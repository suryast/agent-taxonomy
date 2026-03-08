/**
 * Agent Taxonomy Registry — A2A JSON-RPC handler.
 *
 * Implements: tasks/send with actions:
 *   - classify  — classify only, no persistence
 *   - register  — classify + store in D1
 *   - lookup    — query by binomial
 *   - list      — list species with pagination
 *
 * Security flow (registration):
 *   1. IP rate limit check
 *   2. Input validation
 *   3. Agent Card fetch + verify (3s timeout)
 *   4. Domain rate limit check
 *   5. Reserved namespace check
 *   6. Classify
 *   7. D1 upsert
 *   8. Increment counters
 *
 * @module a2a
 */

import { classify } from "./classifier.js";
import {
  validateRegistrationInput,
  validateTraits,
  sanitizeStats,
  checkIPRegLimit,
  checkIPClassifyLimit,
  checkDomainRegLimit,
  incrementIPRegCount,
  incrementIPClassifyCount,
  incrementDomainRegCount,
  verifyAgentCard,
  extractDomain,
  isReservedDomain,
  getClientIP,
} from "./security.js";
import {
  upsertSpecies,
  getSpeciesByBinomial,
  listSpecies,
  recomputeStats,
} from "./db.js";

// ---------------------------------------------------------------------------
// JSON-RPC helpers
// ---------------------------------------------------------------------------

function rpcOk(id, data) {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    result: {
      id,
      status: { state: "completed" },
      artifacts: [{
        parts: [{
          type: "data",
          data,
        }],
      }],
    },
  };
}

function rpcError(id, code, message, data = undefined) {
  const error = { code, message };
  if (data !== undefined) error.data = data;
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    error,
  };
}

// Standard JSON-RPC error codes
const RPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // Application-specific
  RATE_LIMITED: -32000,
  VALIDATION_FAILED: -32001,
  CARD_VERIFICATION_FAILED: -32002,
  NOT_FOUND: -32003,
  FORBIDDEN: -32004,
};

// ---------------------------------------------------------------------------
// Main A2A handler
// ---------------------------------------------------------------------------

/**
 * Handle a POST /a2a request.
 * @param {Request} request
 * @param {object} env - Cloudflare Worker env bindings
 * @returns {Promise<Response>}
 */
export async function handleA2A(request, env) {
  const ip = getClientIP(request);

  // Parse JSON body
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, rpcError(null, RPC_ERRORS.PARSE_ERROR, "Parse error: invalid JSON"));
  }

  // Validate JSON-RPC 2.0 envelope
  if (body.jsonrpc !== "2.0") {
    return jsonResponse(400, rpcError(body.id ?? null, RPC_ERRORS.INVALID_REQUEST, "Invalid Request: jsonrpc must be '2.0'"));
  }
  if (body.method !== "tasks/send") {
    return jsonResponse(404, rpcError(body.id ?? null, RPC_ERRORS.METHOD_NOT_FOUND, `Method not found: ${body.method}`));
  }
  if (!body.params || typeof body.params !== "object") {
    return jsonResponse(400, rpcError(body.id ?? null, RPC_ERRORS.INVALID_PARAMS, "Invalid params: params must be an object"));
  }

  const taskId = body.params.id ?? body.id ?? null;

  // Extract task data from A2A message parts
  const message = body.params.message;
  if (!message || !Array.isArray(message.parts) || message.parts.length === 0) {
    return jsonResponse(400, rpcError(taskId, RPC_ERRORS.INVALID_PARAMS, "Invalid params: message.parts must be a non-empty array"));
  }

  const dataPart = message.parts.find(p => p.type === "data" && p.data);
  if (!dataPart) {
    return jsonResponse(400, rpcError(taskId, RPC_ERRORS.INVALID_PARAMS, "Invalid params: message must contain a data part"));
  }

  const payload = dataPart.data;
  const action = payload?.action;

  if (!action) {
    return jsonResponse(400, rpcError(taskId, RPC_ERRORS.INVALID_PARAMS, "Invalid params: data.action is required"));
  }

  // Route to action handlers
  switch (action) {
    case "classify":
      return handleClassify(taskId, payload, ip, env);
    case "register":
      return handleRegister(taskId, payload, ip, env);
    case "lookup":
      return handleLookup(taskId, payload, env);
    case "list":
      return handleList(taskId, payload, env);
    default:
      return jsonResponse(400, rpcError(taskId, RPC_ERRORS.INVALID_PARAMS, `Unknown action: ${action}. Valid actions: classify, register, lookup, list`));
  }
}

// ---------------------------------------------------------------------------
// Action: classify
// ---------------------------------------------------------------------------

async function handleClassify(taskId, payload, ip, env) {
  // IP rate limit for classify
  const ipLimit = await checkIPClassifyLimit(env.RATE_LIMIT, ip);
  if (!ipLimit.allowed) {
    return jsonResponse(429, rpcError(taskId, RPC_ERRORS.RATE_LIMITED, `Rate limit exceeded: ${ipLimit.count}/${ipLimit.limit} classify requests today from this IP`, {
      retryAfter: 86400,
    }));
  }

  // Validate traits
  const traitsResult = validateTraits(payload.traits);
  if (!traitsResult.valid) {
    return jsonResponse(400, rpcError(taskId, RPC_ERRORS.VALIDATION_FAILED, "Trait validation failed", { errors: traitsResult.errors }));
  }

  const stats = sanitizeStats(payload.stats || {});
  const traits = { ...traitsResult.sanitized, ...stats };

  // Classify
  const species = classify(traits);

  // Increment classify counter (fire and forget — don't block response)
  env.RATE_LIMIT && incrementIPClassifyCount(env.RATE_LIMIT, ip).catch(() => {});

  return jsonResponse(200, rpcOk(taskId, {
    ...species,
    traits,
    classified: true,
    registered: false,
  }));
}

// ---------------------------------------------------------------------------
// Action: register
// ---------------------------------------------------------------------------

async function handleRegister(taskId, payload, ip, env) {
  // Step 1: IP rate limit check
  const ipLimit = await checkIPRegLimit(env.RATE_LIMIT, ip);
  if (!ipLimit.allowed) {
    return jsonResponse(429, rpcError(taskId, RPC_ERRORS.RATE_LIMITED, `Rate limit exceeded: ${ipLimit.count}/${ipLimit.limit} registrations today from this IP`, {
      retryAfter: 86400,
    }));
  }

  // Step 2: Input validation
  const validation = validateRegistrationInput(payload);
  if (!validation.valid) {
    return jsonResponse(400, rpcError(taskId, RPC_ERRORS.VALIDATION_FAILED, "Validation failed", { errors: validation.errors }));
  }

  const { agentCardUrl, traits: validatedTraits, stats } = validation.sanitized;
  const domain = extractDomain(agentCardUrl);

  if (!domain) {
    return jsonResponse(400, rpcError(taskId, RPC_ERRORS.VALIDATION_FAILED, "Invalid agentCardUrl: could not extract domain"));
  }

  // Step 3+4: Agent Card verification (single fetch, reused for reserved check)
  const cardResult = await verifyAgentCard(agentCardUrl);
  if (!cardResult.verified) {
    const code = isReservedDomain(domain) ? RPC_ERRORS.FORBIDDEN : RPC_ERRORS.CARD_VERIFICATION_FAILED;
    const msg = isReservedDomain(domain)
      ? `Reserved domain: ${domain} is protected. Agent card verification failed: ${cardResult.error}`
      : `Agent card verification failed: ${cardResult.error}`;
    return jsonResponse(403, rpcError(taskId, code, msg, { agentCardUrl }));
  }

  // Step 5: Domain rate limit check
  const domainLimit = await checkDomainRegLimit(env.RATE_LIMIT, domain);
  if (!domainLimit.allowed) {
    return jsonResponse(429, rpcError(taskId, RPC_ERRORS.RATE_LIMITED,
      `Rate limit exceeded: ${domainLimit.count}/${domainLimit.limit} registrations today from domain ${domain}`, {
        retryAfter: 86400,
      }));
  }

  // Step 6: Merge stats into traits and classify
  const fullTraits = { ...validatedTraits, ...stats };
  const species = classify(fullTraits);

  // Derive agent name: prefer card name, fall back to traits.name
  const agentName = (cardResult.card?.name || validatedTraits.name).slice(0, 100);

  // Step 7: Upsert into D1
  const { id, isNew } = await upsertSpecies(env.DB, {
    agentCardUrl,
    agentCardDomain: domain,
    agentName,
    genusName: species.genusName,
    epithet: species.epithet,
    binomial: species.binomial,
    commonName: species.commonName,
    fullClassification: species.fullClassification,
    title: species.title,
    description: species.description,
    rarity: species.rarity,
    evolutionStage: species.evolutionStage,
    portraitPrompt: species.portraitPrompt,
    traits: fullTraits,
    stats: stats && Object.keys(stats).length > 0 ? stats : null,
    verified: true,
  });

  // Step 8: Increment rate limit counters (async — don't block response)
  await Promise.all([
    incrementIPRegCount(env.RATE_LIMIT, ip),
    incrementDomainRegCount(env.RATE_LIMIT, domain),
  ]);

  // Async stats recomputation (fire and forget)
  recomputeStats(env.DB).catch(() => {});

  const baseUrl = env.REGISTRY_BASE_URL || env.REGISTRY_BASE_URL or "";
  const binomialSlug = species.binomial.toLowerCase().replace(/\s+/g, "-");

  return jsonResponse(200, rpcOk(taskId, {
    ...species,
    agentName,
    agentCardDomain: domain,
    traits: fullTraits,
    verified: true,
    isNew,
    shareUrl: `${baseUrl}/species/${binomialSlug}`,
    registeredAt: new Date().toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Action: lookup
// ---------------------------------------------------------------------------

async function handleLookup(taskId, payload, env) {
  if (!payload.binomial || typeof payload.binomial !== "string") {
    return jsonResponse(400, rpcError(taskId, RPC_ERRORS.INVALID_PARAMS, "lookup requires binomial field"));
  }

  const binomial = payload.binomial.trim().slice(0, 200);
  const species = await getSpeciesByBinomial(env.DB, binomial);

  if (!species) {
    return jsonResponse(404, rpcError(taskId, RPC_ERRORS.NOT_FOUND, `Species not found: ${binomial}`));
  }

  return jsonResponse(200, rpcOk(taskId, { species }));
}

// ---------------------------------------------------------------------------
// Action: list
// ---------------------------------------------------------------------------

async function handleList(taskId, payload, env) {
  const limit = Math.max(1, Math.min(100, parseInt(payload.limit || 20, 10)));
  const offset = Math.max(0, parseInt(payload.offset || 0, 10));
  const rarity = payload.rarity || undefined;

  const validRarities = ["Common", "Uncommon", "Rare", "Legendary"];
  if (rarity && !validRarities.includes(rarity)) {
    return jsonResponse(400, rpcError(taskId, RPC_ERRORS.VALIDATION_FAILED,
      `Invalid rarity filter. Must be one of: ${validRarities.join(", ")}`));
  }

  const { species, total } = await listSpecies(env.DB, { limit, offset, rarity });

  return jsonResponse(200, rpcOk(taskId, {
    species,
    total,
    limit,
    offset,
    hasMore: offset + species.length < total,
  }));
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
