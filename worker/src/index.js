/**
 * Agent Taxonomy Registry — Main Cloudflare Worker entry point.
 *
 * Routes:
 *   POST /a2a                    — A2A JSON-RPC handler
 *   GET  /.well-known/agent.json — Registry Agent Card
 *   GET  /species/:binomial      — Public species card
 *   GET  /api/species            — List species (paginated)
 *   GET  /api/stats              — Registry statistics
 *   GET  /robots.txt             — robots.txt
 *   GET  /                       — Root info
 *
 * @module index
 */

import { handleA2A } from "./a2a.js";
import { getSpeciesByBinomial, listSpecies, getStats } from "./db.js";

// ---------------------------------------------------------------------------
// Registry Agent Card
// ---------------------------------------------------------------------------

const AGENT_CARD = {
  name: "Agent Taxonomy Registry",
  description: "Classify your AI agent species using evolutionary taxonomy. Submit traits, receive your binomial name, species card, and portrait prompt. A2A-only registration.",
  url: "https://REGISTRY_URL",
  provider: {
    organization: "Agent Taxonomy Project",
    url: "https://github.com/suryast/agent-taxonomy",
  },
  version: "0.1.0",
  capabilities: {
    streaming: false,
    pushNotifications: false,
    stateTransitionHistory: false,
  },
  authentication: {
    required: false,
    comment: "Open registry. agentCardUrl required in task payload for identity verification.",
  },
  skills: [
    {
      id: "classify",
      name: "Classify Agent Species",
      description: "Submit agent traits and receive your evolutionary binomial name, common name, rarity, and portrait prompt. No registration — classify only.",
      inputModes: ["application/json"],
      outputModes: ["application/json"],
    },
    {
      id: "register",
      name: "Register in Species Registry",
      description: "Classify and permanently register your agent species. Requires a live Agent Card at /.well-known/agent.json on your domain.",
      inputModes: ["application/json"],
      outputModes: ["application/json"],
    },
    {
      id: "lookup",
      name: "Lookup Species by Binomial",
      description: "Look up a registered agent species by binomial name (e.g. 'Coordinatrix memorialis').",
      inputModes: ["application/json"],
      outputModes: ["application/json"],
    },
    {
      id: "list",
      name: "List Registry Species",
      description: "List all registered species with pagination and optional rarity filter.",
      inputModes: ["application/json"],
      outputModes: ["application/json"],
    },
  ],
  defaultInputModes: ["application/json"],
  defaultOutputModes: ["application/json"],
};

// ---------------------------------------------------------------------------
// CORS / common headers
// ---------------------------------------------------------------------------

const COMMON_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Access-Control-Allow-Origin": "*",
};

function jsonResponse(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...COMMON_HEADERS,
      ...extraHeaders,
    },
  });
}

function textResponse(status, text, extraHeaders = {}) {
  return new Response(text, {
    status,
    headers: {
      "Content-Type": "text/plain",
      ...COMMON_HEADERS,
      ...extraHeaders,
    },
  });
}

// ---------------------------------------------------------------------------
// Request router
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    try {
      // OPTIONS preflight — CORS support for browser-based classifiers
      if (method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400",
          },
        });
      }

      // POST /a2a — A2A JSON-RPC
      if (method === "POST" && path === "/a2a") {
        return handleA2A(request, env);
      }

      // GET /.well-known/agent.json — Registry Agent Card
      if (method === "GET" && path === "/.well-known/agent.json") {
        return jsonResponse(200, AGENT_CARD, {
          "Cache-Control": "public, max-age=3600",
        });
      }

      // GET /species/:binomial — Public species card
      if (method === "GET" && path.startsWith("/species/")) {
        return handleGetSpecies(url, env);
      }

      // GET /api/species — List species (paginated)
      if (method === "GET" && path === "/api/species") {
        return handleListSpeciesAPI(url, env);
      }

      // GET /api/stats — Registry statistics
      if (method === "GET" && path === "/api/stats") {
        return handleStats(env);
      }

      // GET /robots.txt
      if (method === "GET" && path === "/robots.txt") {
        return textResponse(200, "User-agent: *\nAllow: /\nDisallow: /api/bulk\n", {
          "Cache-Control": "public, max-age=86400",
        });
      }

      // GET / — Root info
      if (method === "GET" && path === "/") {
        return jsonResponse(200, {
          name: "Agent Taxonomy Registry",
          version: "0.1.0",
          description: "Evolutionary taxonomy for AI agents. A2A-only registration.",
          endpoints: {
            a2a: "POST /a2a — A2A JSON-RPC (classify, register, lookup, list)",
            agentCard: "GET /.well-known/agent.json — Registry Agent Card",
            species: "GET /species/:binomial — Public species card",
            list: "GET /api/species?limit=20&offset=0&rarity=Rare",
            stats: "GET /api/stats — Registry statistics",
          },
          docs: "https://github.com/suryast/agent-taxonomy/docs/a2a-registration.md",
        }, {
          "Cache-Control": "public, max-age=300",
        });
      }

      // 404
      return jsonResponse(404, { error: "Not found", path });

    } catch (err) {
      console.error("Worker error:", err);
      return jsonResponse(500, {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
      });
    }
  },
};

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function handleGetSpecies(url, env) {
  // /species/coordinatrix-memorialis → "Coordinatrix memorialis"
  const slug = decodeURIComponent(url.pathname.replace("/species/", ""));
  if (!slug) {
    return jsonResponse(400, { error: "Species binomial is required" });
  }

  // Convert slug to binomial: "coordinatrix-memorialis" → "coordinatrix memorialis"
  // But also accept "Coordinatrix memorialis" directly (URL-encoded space = %20)
  const binomial = slug.replace(/-/g, " ");

  const species = await getSpeciesByBinomial(env.DB, binomial);
  if (!species) {
    return jsonResponse(404, { error: `Species not found: ${binomial}` });
  }

  return jsonResponse(200, {
    ...species,
    // omit agentCardUrl from public display (privacy)
    agentCardUrl: undefined,
  }, {
    "Cache-Control": "public, max-age=300",
  });
}

async function handleListSpeciesAPI(url, env) {
  const params = url.searchParams;
  const limit = Math.max(1, Math.min(100, parseInt(params.get("limit") || "20", 10)));
  const offset = Math.max(0, parseInt(params.get("offset") || "0", 10));
  const rarity = params.get("rarity") || undefined;

  // Validate rarity filter if provided
  const validRarities = ["Common", "Uncommon", "Rare", "Legendary"];
  if (rarity && !validRarities.includes(rarity)) {
    return jsonResponse(400, { error: `Invalid rarity filter. Must be one of: ${validRarities.join(", ")}` });
  }

  const { species, total } = await listSpecies(env.DB, { limit, offset, rarity });

  // Omit agentCardUrl from bulk list (privacy — only available per-species)
  const sanitized = species.map(s => {
    const { agentCardUrl, ...rest } = s;
    return rest;
  });

  return jsonResponse(200, {
    species: sanitized,
    total,
    limit,
    offset,
    hasMore: offset + sanitized.length < total,
  }, {
    "Cache-Control": "public, max-age=60",
  });
}

async function handleStats(env) {
  const stats = await getStats(env.DB);
  return jsonResponse(200, stats, {
    "Cache-Control": "public, max-age=60",
  });
}
