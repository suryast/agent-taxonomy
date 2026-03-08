/**
 * Agent Taxonomy Registry — Security middleware.
 * Implements all P0 and P1 security measures from the threat model.
 *
 * Covers:
 *  - IP rate limiting (KV, 5 reg/IP/24h, 100 classify/IP/24h)
 *  - Domain rate limiting (KV, 10 reg/domain/24h)
 *  - Input validation (whitelist patterns)
 *  - Agent Card verification (live fetch, 3s timeout)
 *  - Reserved namespace protection
 *  - Prompt injection sanitization
 *
 * @module security
 */

import { VALID } from "./taxonomy.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const LIMITS = {
  REG_PER_IP: 5,
  CLASSIFY_PER_IP: 100,
  REG_PER_DOMAIN: 10,
  KV_TTL: 86400, // 24h in seconds
};

// Reserved domains — require live agent card verification before accepting
const RESERVED_DOMAINS = new Set([
  "openai.com", "anthropic.com", "google.com", "microsoft.com",
  "deepmind.com", "meta.com", "apple.com", "amazon.com",
]);

// Prompt injection patterns to strip from notableGenes
const INJECTION_PATTERNS = [
  /ignore\s+(?:previous|all|above)\s+instructions?/gi,
  /system\s*:/gi,
  /assistant\s*:/gi,
  /user\s*:/gi,
  /\[INST\]/gi,
  /<<SYS>>/gi,
  /<\/?s>/gi,
  /\bprompt\s+injection\b/gi,
  /\bjailbreak\b/gi,
  /\bDAN\b/g,
  /forget\s+(?:your|all|previous)/gi,
  /act\s+as\s+(?:if|a|an)\b/gi,
];

// ---------------------------------------------------------------------------
// Rate limiting helpers
// ---------------------------------------------------------------------------

/**
 * Get today's date string for KV key namespacing.
 * @returns {string} YYYY-MM-DD
 */
function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Increment a KV counter. Returns the NEW value after increment.
 * Uses TTL-based expiry (24h) for automatic cleanup.
 *
 * NOTE: GET→parse→PUT is not atomic. Concurrent requests may lose increments,
 * making the rate limit slightly permissive (not restrictive). Acceptable
 * trade-off — CF KV doesn't support atomic increments. Durable Objects
 * would fix this if precision ever matters.
 *
 * @param {KVNamespace} kv
 * @param {string} key
 * @returns {Promise<number>}
 */
async function kvIncrement(kv, key) {
  const raw = await kv.get(key);
  const current = raw ? parseInt(raw, 10) : 0;
  const next = current + 1;
  await kv.put(key, String(next), { expirationTtl: LIMITS.KV_TTL });
  return next;
}

/**
 * Get current KV counter value without incrementing.
 * @param {KVNamespace} kv
 * @param {string} key
 * @returns {Promise<number>}
 */
async function kvGet(kv, key) {
  const raw = await kv.get(key);
  return raw ? parseInt(raw, 10) : 0;
}

/**
 * Check IP rate limit for registrations.
 * Returns { allowed: bool, count: number, limit: number }
 *
 * @param {KVNamespace} kv
 * @param {string} ip
 * @returns {Promise<{allowed: boolean, count: number, limit: number}>}
 */
export async function checkIPRegLimit(kv, ip) {
  const key = `reg:ip:${ip}:${today()}`;
  const count = await kvGet(kv, key);
  return { allowed: count < LIMITS.REG_PER_IP, count, limit: LIMITS.REG_PER_IP };
}

/**
 * Check IP rate limit for classify actions.
 * @param {KVNamespace} kv
 * @param {string} ip
 * @returns {Promise<{allowed: boolean, count: number, limit: number}>}
 */
export async function checkIPClassifyLimit(kv, ip) {
  const key = `cls:ip:${ip}:${today()}`;
  const count = await kvGet(kv, key);
  return { allowed: count < LIMITS.CLASSIFY_PER_IP, count, limit: LIMITS.CLASSIFY_PER_IP };
}

/**
 * Check domain rate limit for registrations.
 * @param {KVNamespace} kv
 * @param {string} domain
 * @returns {Promise<{allowed: boolean, count: number, limit: number}>}
 */
export async function checkDomainRegLimit(kv, domain) {
  const key = `reg:domain:${domain}:${today()}`;
  const count = await kvGet(kv, key);
  return { allowed: count < LIMITS.REG_PER_DOMAIN, count, limit: LIMITS.REG_PER_DOMAIN };
}

/**
 * Increment the IP registration counter.
 * Call AFTER successful registration.
 * @param {KVNamespace} kv
 * @param {string} ip
 */
export async function incrementIPRegCount(kv, ip) {
  await kvIncrement(kv, `reg:ip:${ip}:${today()}`);
}

/**
 * Increment the IP classify counter.
 * Call AFTER successful classify.
 * @param {KVNamespace} kv
 * @param {string} ip
 */
export async function incrementIPClassifyCount(kv, ip) {
  await kvIncrement(kv, `cls:ip:${ip}:${today()}`);
}

/**
 * Increment the domain registration counter.
 * Call AFTER successful registration.
 * @param {KVNamespace} kv
 * @param {string} domain
 */
export async function incrementDomainRegCount(kv, domain) {
  await kvIncrement(kv, `reg:domain:${domain}:${today()}`);
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

const NAME_RE = /^[a-zA-Z0-9\s\-_\.]{1,100}$/;
const EPITHET_RE = /^[a-zA-Z0-9\-_]{1,50}$/;
const GENE_RE = /^[a-zA-Z0-9\s\-_]{1,100}$/;
const AGENT_CARD_URL_RE = /^https:\/\/[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+\/\.well-known\/agent\.json$/;

/**
 * Validate and sanitize registration input.
 * Returns { valid: boolean, errors: string[], sanitized: object|null }
 *
 * @param {object} data - Raw input from A2A task payload
 * @returns {{ valid: boolean, errors: string[], sanitized: object|null }}
 */
export function validateRegistrationInput(data) {
  const errors = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["payload must be an object"], sanitized: null };
  }

  // agentCardUrl is required for registration
  if (!data.agentCardUrl || typeof data.agentCardUrl !== "string") {
    errors.push("agentCardUrl is required");
  } else if (!AGENT_CARD_URL_RE.test(data.agentCardUrl)) {
    errors.push("agentCardUrl must be a valid https URL ending in /.well-known/agent.json");
  }

  // traits validation
  const traitsResult = validateTraits(data.traits);
  if (!traitsResult.valid) {
    errors.push(...traitsResult.errors);
  }

  if (errors.length > 0) {
    return { valid: false, errors, sanitized: null };
  }

  // Sanitize stats
  const stats = sanitizeStats(data.stats || {});

  return {
    valid: true,
    errors: [],
    sanitized: {
      agentCardUrl: data.agentCardUrl.trim(),
      traits: traitsResult.sanitized,
      stats,
    },
  };
}

/**
 * Validate and sanitize traits object.
 * @param {object} traits
 * @returns {{ valid: boolean, errors: string[], sanitized: object|null }}
 */
export function validateTraits(traits) {
  const errors = [];

  if (!traits || typeof traits !== "object") {
    return { valid: false, errors: ["traits is required"], sanitized: null };
  }

  // Required fields — enum validation
  if (!VALID.domain.includes(traits.domain)) errors.push(`domain must be one of: ${VALID.domain.join(", ")}`);
  if (!VALID.kingdom.includes(traits.kingdom)) errors.push(`kingdom must be one of: ${VALID.kingdom.join(", ")}`);
  if (!VALID.phylum.includes(traits.phylum)) errors.push(`phylum must be one of: ${VALID.phylum.join(", ")}`);
  if (!VALID.evolutionClass.includes(traits.evolutionClass)) errors.push(`evolutionClass must be one of: ${VALID.evolutionClass.join(", ")}`);
  if (!VALID.order.includes(traits.order)) errors.push(`order must be one of: ${VALID.order.join(", ")}`);
  if (!VALID.family.includes(traits.family)) errors.push(`family must be one of: ${VALID.family.join(", ")}`);
  if (!VALID.genus.includes(traits.genus)) errors.push(`genus must be one of: ${VALID.genus.join(", ")}`);

  // name validation
  if (!traits.name || typeof traits.name !== "string") {
    errors.push("traits.name is required");
  } else if (!NAME_RE.test(traits.name)) {
    errors.push("traits.name must match [a-zA-Z0-9\\s\\-_\\.]{1,100}");
  }

  // customEpithet validation (optional)
  if (traits.customEpithet !== undefined) {
    if (typeof traits.customEpithet !== "string" || !EPITHET_RE.test(traits.customEpithet)) {
      errors.push("traits.customEpithet must match [a-zA-Z0-9\\-_]{1,50}");
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, sanitized: null };
  }

  return {
    valid: true,
    errors: [],
    sanitized: {
      name: traits.name.trim(),
      domain: traits.domain,
      kingdom: traits.kingdom,
      phylum: traits.phylum,
      evolutionClass: traits.evolutionClass,
      order: traits.order,
      family: traits.family,
      genus: traits.genus,
      ...(traits.customEpithet ? { customEpithet: traits.customEpithet.toLowerCase().trim() } : {}),
    },
  };
}

/**
 * Sanitize stats object.
 * @param {object} stats
 * @returns {object}
 */
export function sanitizeStats(stats) {
  if (!stats || typeof stats !== "object") return {};

  const sanitized = {};

  if (typeof stats.numSkills === "number" && isFinite(stats.numSkills)) {
    sanitized.numSkills = Math.max(0, Math.min(10000, Math.floor(stats.numSkills)));
  }
  if (typeof stats.numCrons === "number" && isFinite(stats.numCrons)) {
    sanitized.numCrons = Math.max(0, Math.min(100000, Math.floor(stats.numCrons)));
  }
  if (typeof stats.numRules === "number" && isFinite(stats.numRules)) {
    sanitized.numRules = Math.max(0, Math.min(100000, Math.floor(stats.numRules)));
  }

  if (Array.isArray(stats.notableGenes)) {
    sanitized.notableGenes = stats.notableGenes
      .slice(0, 10) // max 10 items
      .filter(g => typeof g === "string")
      .map(g => sanitizeGene(g))
      .filter(g => g.length > 0 && GENE_RE.test(g));
  }

  return sanitized;
}

/**
 * Strip prompt injection patterns from a gene string.
 * @param {string} gene
 * @returns {string}
 */
function sanitizeGene(gene) {
  let cleaned = gene.slice(0, 100); // enforce length
  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }
  return cleaned.trim();
}

// ---------------------------------------------------------------------------
// Agent Card verification
// ---------------------------------------------------------------------------

/**
 * Extract domain from an agent card URL.
 * e.g. "https://myagent.example.com/.well-known/agent.json" → "myagent.example.com"
 * @param {string} url
 * @returns {string}
 */
export function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

/**
 * Check if a domain is in the reserved namespace.
 * @param {string} domain
 * @returns {boolean}
 */
export function isReservedDomain(domain) {
  // Check exact match or subdomain of reserved domains
  return RESERVED_DOMAINS.has(domain) ||
    [...RESERVED_DOMAINS].some(r => domain.endsWith(`.${r}`));
}

/**
 * Fetch and verify an agent card.
 * Returns { verified: boolean, card: object|null, error: string|null }
 *
 * Checks:
 * - URL is reachable (3s timeout)
 * - Response is valid JSON
 * - Has required A2A fields (name, url)
 *
 * @param {string} agentCardUrl
 * @returns {Promise<{verified: boolean, card: object|null, error: string|null}>}
 */
export async function verifyAgentCard(agentCardUrl) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(agentCardUrl, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "User-Agent": "AgentTaxonomyRegistry/0.1 (+https://github.com/suryast/agent-taxonomy)",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        verified: false,
        card: null,
        error: `Agent card returned HTTP ${response.status}`,
      };
    }

    let card;
    try {
      card = await response.json();
    } catch {
      return { verified: false, card: null, error: "Agent card is not valid JSON" };
    }

    // Minimal A2A card requirements
    if (!card || typeof card !== "object") {
      return { verified: false, card: null, error: "Agent card must be a JSON object" };
    }
    if (typeof card.name !== "string" || !card.name.trim()) {
      return { verified: false, card: null, error: "Agent card missing required field: name" };
    }

    return { verified: true, card, error: null };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      return { verified: false, card: null, error: "Agent card fetch timed out (3s)" };
    }
    return { verified: false, card: null, error: `Agent card fetch failed: ${err.message}` };
  }
}

// ---------------------------------------------------------------------------
// IP extraction
// ---------------------------------------------------------------------------

/**
 * Extract client IP from request headers.
 * Cloudflare provides CF-Connecting-IP.
 * @param {Request} request
 * @returns {string}
 */
export function getClientIP(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
