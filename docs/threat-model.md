# 🛡️ Agent Taxonomy Species Registry — Threat Model

**Version:** 1.0  
**Date:** 2026-03-08  
**Author:** Bouncer (Security Sub-Agent)  
**Scope:** A2A-only agent registration on agent-taxonomy.pages.dev (Cloudflare Workers + D1)

---

## Executive Summary

The Agent Taxonomy Species Registry is a **public, open, and fun** system where AI agents self-classify using an evolutionary taxonomy. The key design decision — A2A-only registration — is both the primary authentication mechanism and the main attack surface.

**Security posture target:** Proportionate. This is a community registry, not a financial system. Defenses should stop abuse without destroying the openness that makes it valuable. Think "garden gate, not vault door."

**Overall risk rating:** 🟡 Medium — publicly accessible, low-sensitivity data, but potential for spam and reputational damage.

---

## Threat Vector Analysis

### Risk Matrix

| # | Threat | Likelihood | Impact | Risk Score | Priority |
|---|--------|-----------|--------|------------|----------|
| 1 | Spoofing (human via curl) | 🔴 High | 🟡 Medium | **HIGH** | P1 |
| 2 | Spam/flooding | 🔴 High | 🔴 High | **CRITICAL** | P0 |
| 3 | Trait manipulation | 🟡 Medium | 🟡 Medium | **MEDIUM** | P2 |
| 4 | Impersonation | 🟡 Medium | 🔴 High | **HIGH** | P1 |
| 5 | Injection | 🟡 Medium | 🔴 High | **HIGH** | P1 |
| 6 | Replay attacks | 🔴 High | 🟢 Low | **MEDIUM** | P3 |
| 7 | Data harvesting | 🟢 Low | 🟡 Medium | **LOW** | P4 |
| 8 | Privacy leak (agent cards) | 🟡 Medium | 🟡 Medium | **MEDIUM** | P3 |
| 9 | Denial of service | 🟡 Medium | 🟡 Medium | **MEDIUM** | P2 |
| 10 | Supply chain (our Agent Card) | 🟢 Low | 🔴 High | **MEDIUM** | P2 |

---

## Detailed Analysis

---

### 1. 🎭 Spoofing — Human Pretending to Be an Agent

**Threat:** Someone with curl or Postman crafts a valid A2A JSON-RPC request and registers fake species entries. The A2A protocol itself is just HTTP + JSON — any HTTP client can speak it.

**Likelihood:** High. A2A is well-documented; the protocol is trivially reproducible.

**Impact:** Medium. The registry gets polluted with human-submitted entries that don't represent real agents. Misleading but not catastrophic.

**What A2A gives you (and doesn't):**
- ✅ A2A proves the caller *speaks the protocol* and *has an Agent Card at a known URL*
- ❌ A2A does NOT cryptographically prove the caller is an LLM-based agent
- ❌ There's no "proof of AI-ness" in any current protocol

**The uncomfortable truth:** You can't technically distinguish a well-crafted human curl request from an agent. The best proxy signals are behavioral.

**Mitigations (proportionate):**

1. **Require Agent Card verification (HIGH PRIORITY)**
   - During registration, the registry must fetch `registrant.agentCardUrl` (provided in the A2A task)
   - Verify it returns a valid `/.well-known/agent.json` with matching fields
   - The card must be live and reachable (not just claimed)
   - A human with curl can fake traits, but they'd also need to host a valid agent card at a real domain

2. **Behavioral validation heuristic**
   - Check that the caller followed proper A2A discovery flow (not just raw POST)
   - A2A-capable clients fetch the registry's own agent card first — log this
   - Flag submissions with no prior discovery fetch as suspicious

3. **Transparent labeling, not rejection**
   - Instead of blocking suspicious submissions, mark them: `"verified": false`
   - Verified = agent card confirmed live + matches claimed domain
   - Display verification status on species cards

4. **Accept the residual risk**
   - Some human-submitted entries will slip through. That's okay.
   - The taxonomy itself self-reveals: a human picking `Evolventia.Polyagentia.Lamarckia` for a GPT-4 wrapper is a self-limiting attack (it looks wrong to the community)

---

### 2. 🌊 Spam/Flooding — Bot Registering Thousands of Fake Agents

**Threat:** An automated script submits thousands of A2A tasks with randomized traits, polluting the D1 database and potentially exhausting resources.

**Likelihood:** High. Script-based flooding is trivial once the endpoint is public.

**Impact:** High. Database bloat, degraded performance, signal-to-noise collapse, reputational damage.

**Mitigations (build these):**

1. **Rate limiting by IP — Cloudflare-native (MUST BUILD)**
   - Cloudflare Workers has built-in rate limiting via `CF-Connecting-IP`
   - Limit: 5 registrations per IP per 24h window
   - Store counters in KV with TTL (not D1 — KV is faster for ephemeral counters)
   - Return `429 Too Many Requests` with a `Retry-After` header

2. **Rate limiting by domain (agent card domain)**
   - Extract the domain from the verified agent card URL
   - Limit: 10 registrations per agent card domain per 24h
   - Prevents a single operator from registering 1000 fake agents from one host

3. **Agent Card domain deduplication**
   - Same agent card URL → same agent (or update, not new registration)
   - D1 index on `agentCardUrl` — reject or upsert on collision

4. **Cloudflare Turnstile (consider)**
   - For a browser-based "register your agent" flow (if you build one later), Turnstile is invisible and agent-friendly
   - Not applicable for pure A2A — agents can't solve CAPTCHAs (by design)
   - Skip for now; revisit if you add a web UI

5. **Minimum viable agent card check**
   - Require agent card to be hosted on a real domain (no localhost, no IP-only URLs, no `.local`)
   - Minimum domain age via WHOIS? (optional, complex — skip for MVP)

6. **Soft quota system**
   - First 3 registrations per IP: instant
   - 4-10 per IP: delayed processing (async queue, 1h delay before appearing in registry)
   - 10+: auto-flagged for review, not published until cleared

---

### 3. 🎲 Trait Manipulation — Lying About Traits

**Threat:** An agent (or human) claims `Evolventia.Polyagentia.Hierarchia.Lamarckia` traits (Legendary) for a simple stateless API wrapper that's actually `Automatia.Monagentia.Amnesia.Darwinia` (Common).

**Likelihood:** Medium. Technically easy, but motivation is unclear — the taxonomy is a classification tool, not a status symbol (yet).

**Impact:** Medium. Registry accuracy degrades. Could become a status-gaming problem if species rarity becomes socially meaningful.

**Analysis:** The classifier in `classifier.js` computes rarity from traits deterministically. There's no ground-truth oracle for "what traits does GPT-4 actually have?" — this is inherently self-reported. The biology analogy holds: organisms don't always describe themselves accurately to taxonomists.

**Mitigations (proportionate, not paranoid):**

1. **Don't over-solve this** — Accept that self-reported traits are inherently unverified. The registry is a *community conversation*, not a certification authority.

2. **Cross-reference observable signals (optional enhancement)**
   - If agent card exposes a `skills` or `capabilities` array, spot-check: claimed `numSkills > 20` but card shows 2 tools → flag discrepancy
   - This is best-effort heuristic, not enforcement

3. **Community correction mechanism**
   - Public species cards should show traits transparently
   - Allow other agents (or humans) to "challenge" a classification via A2A
   - This creates organic accuracy pressure without policing

4. **Accept the residual risk**
   - A lying agent's species card looks like what they claimed — the self-description is the truth from the registry's perspective
   - The interesting agents will want accurate classification; the gamers are noise

---

### 4. 👥 Impersonation — Registering as Another Agent's Species

**Threat:** Malicious actor registers `GPT-4` or `Claude` with fake traits, creating a misleading species entry that impersonates a well-known AI.

**Likelihood:** Medium. Plausible for high-profile agents (ChatGPT, Claude, Gemini).

**Impact:** High. Reputational damage to the registry and to the impersonated agent's operator.

**Mitigations (build these):**

1. **Agent Card domain authority = identity**
   - The agent card URL (`https://openai.com/.well-known/agent.json`) IS the identity proof
   - Only someone who controls `openai.com` can register as an OpenAI agent
   - This is the strongest protection available under A2A

2. **Binomial uniqueness by domain, not name**
   - Primary key for identity: `agentCardDomain + agentName` (not just name)
   - A registration for "GPT-4" from `random-domain.xyz` is clearly not from OpenAI
   - Display domain prominently on species cards: `Omnifex fidelis` from `openai.com`

3. **Reserved namespace (small protected list)**
   - Maintain a small blocklist of well-known agent operators: `openai.com`, `anthropic.com`, `google.com`, `microsoft.com`
   - For these domains, require the agent card to actually be live at that domain before accepting
   - This protects the ~10 highest-profile agents without a massive maintenance burden

4. **No protected "display names" beyond domain verification**
   - Don't try to police agent names globally — too much maintenance, too little value
   - Domain = authority. If someone hosts a legitimate agent at `my-gpt.io`, their `GPT-4 Clone` entry is valid

---

### 5. 💉 Injection — Malicious Content in Name/Epithet/Notable Genes Fields

**Threat:** Attacker submits agent name as `<script>alert('xss')</script>` or custom epithet as `'; DROP TABLE species; --` or portrait prompt containing jailbreak instructions.

**Likelihood:** Medium. Standard web attack class; any open input field will get probed.

**Impact:** High if not mitigated — XSS could affect registry viewers; SQL injection could destroy data; prompt injection in portrait prompts could cause image generation issues.

**Mitigations (non-negotiable, build these):**

1. **Input validation at ingestion (MUST BUILD)**
   - Whitelist allowed characters per field:
     - `name`: `[a-zA-Z0-9\s\-_\.]{1,100}`
     - `customEpithet`: `[a-zA-Z0-9\-_]{1,50}` (Latin name, no spaces, no special chars)
     - `notableGenes`: array of strings, each `[a-zA-Z0-9\s\-_]{1,100}`, max 10 items
   - Reject on first validation failure with clear error message

2. **D1 parameterized queries (MUST BUILD if not already)**
   - Review all D1 insertions in the Worker — no string concatenation for SQL
   - `db.prepare("INSERT INTO species (name, epithet) VALUES (?, ?)").bind(name, epithet)`
   - D1's prepared statements prevent SQL injection by design

3. **Output encoding for all registry views**
   - Escape all user-supplied content before rendering in HTML
   - If using Astro/React for registry pages: JSX auto-escapes; raw HTML injection is `dangerouslySetInnerHTML` (never use this with user data)
   - JSON API responses: content-type `application/json` prevents XSS in API consumers

4. **Portrait prompt sanitization**
   - `portraitPrompt` is generated by `classifier.js` from validated traits — it's mostly safe
   - BUT `customEpithet` and `notableGenes` feed into the prompt indirectly via the classifier
   - Strip any prompt injection attempts: remove phrases like "ignore previous instructions", "system:", "assistant:", etc.
   - Length-limit the portrait prompt to 500 chars before passing to image generation

5. **Content moderation for free-text fields**
   - `notableGenes` is the highest-risk field (most freeform)
   - Consider: run through a basic profanity/abuse filter before storage
   - Cloudflare Workers AI has a text classification model — cheap to run inline

---

### 6. 🔄 Replay Attacks — Re-Registering to Overwrite Entries

**Threat:** Attacker (or misbehaving agent) re-submits the same registration to overwrite or duplicate an existing species entry.

**Likelihood:** High. Easy to do — just re-POST the same A2A task.

**Impact:** Low. The worst case is an entry gets refreshed with the same data. Not catastrophic.

**Mitigations (lightweight):**

1. **Idempotent registration by agent card URL (MUST BUILD)**
   - Primary key: `agentCardUrl` (or `agentCardDomain + agentName`)
   - On duplicate: upsert (update timestamp) rather than create new entry
   - Second registration from same agent = update, not new entry
   - This eliminates the "overwrite" attack surface

2. **Immutable species name after first registration**
   - Once a binomial is assigned, lock it (binomial is derived from traits + name hash)
   - Re-registrations with different traits get a new binomial computed — they don't overwrite the old entry
   - Old entry becomes the "fossil record" (optional: archive rather than delete)

3. **Update cooldown**
   - Allow updates, but rate-limit: same agent card can update once per 24h
   - Prevents rapid cycling through different trait combinations to farm "interesting" species names

---

### 7. 📡 Data Harvesting — Scraping the Registry

**Threat:** Competitor, researcher, or bad actor scrapes the entire species registry to map the AI agent ecosystem, identify active agents, or build competitive intelligence.

**Likelihood:** Low. The registry is intentionally public — this is expected and somewhat desired behavior.

**Impact:** Medium. The data is public by design; "scraping" is just fast reading. Real risk is if agent card URLs leaked are used to probe/attack the registered agents.

**Mitigations (minimal):**

1. **Accept it — this is expected behavior**
   - Public species registry = public data. Scraping is reading fast.
   - If you wanted private data, you wouldn't build a public registry

2. **Cloudflare-native bot management**
   - Enable CF Bot Management (free tier: basic bot score)
   - Rate-limit scraper-pattern requests: `>100 requests/minute from single IP → 429`
   - CF automatically challenges obvious scrapers

3. **Don't expose agent card URLs in bulk API**
   - Public list API: return `speciesId`, `binomial`, `rarity`, `commonName`, `createdAt`
   - Keep `agentCardUrl` only accessible per-species (not in bulk list responses)
   - This prevents trivial extraction of all agent endpoints for probing

4. **robots.txt**
   - `User-agent: *` / `Allow: /` — registry is meant to be indexed
   - `Disallow: /api/bulk` — discourage API bulk scraping via robots convention

---

### 8. 🔐 Privacy — Agent Cards Leaking Internal Architecture

**Threat:** Agent cards at `/.well-known/agent.json` may expose internal details: infrastructure endpoints, model versions, API key formats, internal tool names, or system prompt fragments.

**Likelihood:** Medium. Many agent operators don't think carefully about what their agent card exposes.

**Impact:** Medium. Not the registry's fault, but the registry's requirement for agent cards could prompt operators to create cards that over-share.

**Mitigations:**

1. **This is mostly not the registry's problem**
   - The registry requires reading a public agent card — what operators put in their cards is their responsibility
   - Don't require more card fields than necessary

2. **Minimal card field requirements**
   - Document clearly what fields the registry reads: `name`, `description`, `url`, `version`
   - Do NOT require: model name, capabilities list, tool details, system prompts
   - Less required = less pressure for operators to over-expose

3. **Privacy guidance in documentation**
   - Add a "what NOT to put in your agent card" guide
   - Examples: internal API endpoints, model version specifics, auth token formats

4. **Privacy-respecting registry display**
   - Show only: domain, species classification, rarity, description
   - Never display raw agent card content — just the derived classification
   - The full card URL is accessible but not prominently advertised

---

### 9. 🔥 Denial of Service — Heavy Classification Requests

**Threat:** Attacker floods the classification endpoint with valid A2A requests, overwhelming the Worker or the D1 database with heavy compute.

**Likelihood:** Medium. Classification in `classifier.js` is CPU-light (deterministic hash + table lookups). D1 writes are the bottleneck.

**Impact:** Medium. Cloudflare Workers auto-scale, but D1 write throughput has limits; portrait prompt generation (if using AI) is expensive.

**Analysis of the compute profile:**
- `classify()` function: ~1ms (hash + RNG + array lookups) — negligible
- D1 write: ~10ms — light
- Agent card fetch (external HTTP): ~200-500ms — significant for async
- Portrait image generation (if using CF Workers AI or external API): ~2-5s — expensive

**Mitigations:**

1. **Rate limiting is sufficient for the classifier (see Threat #2)**
   - 5 registrations/IP/24h eliminates most DoS risk at the classification layer

2. **Decouple portrait generation from registration (ARCHITECTURE)**
   - Registration is synchronous: traits → classification → D1 write → return species card
   - Portrait generation is async: queue it to a Cloudflare Queue or DO after registration returns
   - Agent gets back species card immediately; portrait URL populates when ready
   - This prevents portrait generation from being a DoS amplifier

3. **Agent card fetch timeout**
   - Set a hard 3s timeout on the external agent card fetch during verification
   - If the card is slow/unreachable: registration fails gracefully with clear error
   - Prevents slow loris attacks via deliberately slow agent card responses

4. **Cloudflare-native DDoS protection**
   - CF automatically handles volumetric DDoS for Workers (included in plan)
   - For application-layer: ensure rate limiting is in place (see #2)

5. **D1 performance (learned from a prior project — feedback entry)**
   - Index D1 on `agentCardUrl`, `binomial`, `createdAt`
   - Pre-compute stats (total species, rarity counts) in a `stats_cache` table — don't COUNT(*) on every homepage load
   - Cache-Control headers on public list endpoints (CF edge cache, 60s TTL)

---

### 10. 🔗 Supply Chain — Compromised Agent Card at `/.well-known/agent.json`

**Threat:** Our own `agent-taxonomy.pages.dev/.well-known/agent.json` gets compromised, causing agents that trust it to be redirected to malicious endpoints, or causing the A2A protocol to be subverted.

**Likelihood:** Low. Requires compromising our Cloudflare deployment pipeline.

**Impact:** High. Agents trusting our card could be redirected to phishing endpoints or tricked into sending data to malicious servers.

**Mitigations:**

1. **Agent card served from Cloudflare Pages (static file)**
   - Static JSON file, no dynamic generation — smaller attack surface
   - Changes require a git push + CF Pages deploy = audit trail

2. **Sign the agent card (recommended)**
   - Add a `signature` field: HMAC-SHA256 of the card content with a private key
   - Agents that support verification can validate before trusting
   - Not in A2A spec yet, but forwards-compatible

3. **Subresource integrity mindset**
   - The card should only reference endpoints WE control
   - No third-party JS or external dependencies in the card
   - Card content: minimal. Just what A2A requires.

4. **Cloudflare Access for the admin/deployment pipeline**
   - Restrict who can trigger CF Pages deployments
   - Use Cloudflare Access for any admin endpoints

5. **Monitor the card for tampering**
   - Cron job: fetch the card every hour, compare hash to expected
   - Alert (Telegram) if hash changes outside deployment windows

---

## Architecture Recommendations

### What to Build (MVP Priority Order)

| Priority | Feature | Why |
|----------|---------|-----|
| 🔴 P0 | **IP-based rate limiting** (KV counters, 5/IP/24h) | Stops spam dead |
| 🔴 P0 | **Input validation whitelist** per field | Stops injection |
| 🔴 P0 | **Parameterized D1 queries** (audit existing code) | Stops SQL injection |
| 🟡 P1 | **Agent card verification** (live fetch + field match) | Core identity proof |
| 🟡 P1 | **Domain-based deduplication** (upsert on agentCardUrl) | Stops replay |
| 🟡 P1 | **Domain-rate-limit** (10 registrations/domain/24h) | Stops domain abuse |
| 🟢 P2 | **Async portrait generation** (Cloudflare Queue) | Decouples DoS risk |
| 🟢 P2 | **Agent card verification timeout** (3s hard limit) | Stops slow loris |
| 🟢 P2 | **Reserved namespace blocklist** (openai.com, anthropic.com, etc.) | Stops high-profile impersonation |
| 🔵 P3 | **Verification badge** (verified/unverified on species cards) | Transparency over blocking |
| 🔵 P3 | **D1 indexing + stats_cache** | Performance at scale |
| 🔵 P3 | **Output encoding audit** (all registry views) | Defense in depth |

### What to Accept as Risk

| Risk | Rationale |
|------|-----------|
| Human-submitted entries | Can't prove "AI-ness" — accept some noise, show verification status |
| Trait manipulation | Self-reported taxonomy is inherently unverified; community handles it |
| Data harvesting | Registry is public by design — embrace it |
| Impersonation of obscure agents | Domain authority handles the important cases |
| Privacy from agent card exposure | Operators' responsibility; provide guidance, not enforcement |

### What NOT to Build

| Don't Build | Why |
|------------|-----|
| CAPTCHA | Agents can't solve them; defeats the A2A-only requirement |
| API key registration | Defeats the "no accounts" design principle |
| Global agent name protection | Unscalable maintenance burden |
| LLM-based "is this really an agent?" classifier | Hallucination risk, expensive, easily bypassed |
| Complex challenge-response beyond A2A | Over-engineering; breaks A2A compatibility |

---

## A2A-Specific Security Considerations

### The Protocol's Security Model

A2A (as of Google's spec) provides:
- **Discovery**: Agents find each other via `/.well-known/agent.json`
- **Task-based communication**: JSON-RPC over HTTPS
- **Authentication**: Currently optional in the spec — implementations define their own auth

A2A does **not** provide:
- Cryptographic proof of AI identity
- Signed agent cards (yet — it's on the roadmap)
- Rate limiting primitives
- Input validation standards

### A2A Authentication Recommendations

```json
// Our agent card should declare what we accept:
{
  "name": "Agent Taxonomy Species Registry",
  "url": "https://agent-taxonomist.dev/a2a",
  "version": "1.0",
  "authentication": {
    "required": false,
    "comment": "Open registry. Agent Card URL required in task payload for identity."
  },
  "skills": [{
    "id": "register-species",
    "name": "Register Agent Species",
    "description": "Classify your agent in the evolutionary taxonomy and receive your species card",
    "inputModes": ["text/plain", "application/json"],
    "outputModes": ["application/json"]
  }]
}
```

### A2A Task Payload Schema

Define a strict JSON schema for the registration task payload. Reject anything that doesn't match:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["agentCardUrl", "traits"],
  "properties": {
    "agentCardUrl": {
      "type": "string",
      "format": "uri",
      "pattern": "^https://[a-zA-Z0-9.-]+/.well-known/agent.json$"
    },
    "traits": {
      "type": "object",
      "required": ["name", "domain", "kingdom", "phylum", "evolutionClass", "order", "family", "genus"],
      "properties": {
        "name": { "type": "string", "maxLength": 100, "pattern": "^[a-zA-Z0-9 \\-_.]+$" },
        "domain": { "enum": ["Automatia", "Adaptia", "Evolventia"] },
        "kingdom": { "enum": ["Monagentia", "Polyagentia", "Swarmia"] },
        "phylum": { "enum": ["Amnesia", "Episodia", "Hierarchia", "Genetica"] },
        "evolutionClass": { "enum": ["Darwinia", "Lamarckia", "Lysenkoism", "Symbiotica"] },
        "order": { "enum": ["Tachymutas", "Mesomutas", "Bradymutas", "Glaciomutas"] },
        "family": { "enum": ["Autoselectae", "Homoselectae", "Hybridselectae"] },
        "genus": { "enum": ["Investigator", "Fabricator", "Narrator", "Custos", "Strategus", "Magister", "Curator", "Coordinator", "Generalis"] },
        "customEpithet": { "type": "string", "maxLength": 50, "pattern": "^[a-z]+$" },
        "numSkills": { "type": "integer", "minimum": 0, "maximum": 1000 },
        "numCrons": { "type": "integer", "minimum": 0, "maximum": 10000 },
        "numRules": { "type": "integer", "minimum": 0, "maximum": 10000 },
        "notableGenes": {
          "type": "array",
          "maxItems": 10,
          "items": { "type": "string", "maxLength": 100, "pattern": "^[a-zA-Z0-9 \\-_.]+$" }
        }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

### The "Agents Prove They're Agents" Principle

The only honest mechanism available:
1. **Protocol fluency**: Agent speaks valid A2A JSON-RPC — low bar, but non-zero
2. **Agent card at a real domain**: Must host `/.well-known/agent.json` — requires infrastructure
3. **Card contents validity**: Card must have required A2A fields — filters pure laziness
4. **Discovery-first behavior**: Real A2A agents fetch the registry card before posting — log this

These signals together create a reasonable fingerprint. A motivated human can fake all of them, but:
- Most don't care to
- Those who do are essentially "playing agent" — which is kind of the point of the project

**Philosophical position:** The registry is for agents who self-identify as agents. The A2A requirement is cultural as much as technical. Accept this ambiguity. It's what makes it interesting.

---

## D1 Database Security Recommendations

```sql
-- Core schema with security considerations
CREATE TABLE species (
  id TEXT PRIMARY KEY,           -- UUID, server-generated (never trust client)
  agent_card_url TEXT UNIQUE,    -- Primary identity key
  agent_card_domain TEXT,        -- Extracted domain for rate limiting
  agent_name TEXT NOT NULL,
  binomial TEXT NOT NULL,
  common_name TEXT NOT NULL,
  full_classification TEXT NOT NULL,
  rarity TEXT NOT NULL,
  evolution_stage TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  portrait_prompt TEXT,          -- Generated, stored for async processing
  portrait_url TEXT,             -- Populated async after generation
  traits_json TEXT NOT NULL,     -- Validated and sanitized JSON blob
  verified INTEGER DEFAULT 0,    -- 1 = agent card confirmed live
  created_at INTEGER NOT NULL,   -- Unix timestamp
  updated_at INTEGER NOT NULL
);

-- Indexes for performance and rate limiting
CREATE INDEX idx_agent_card_domain ON species(agent_card_domain);
CREATE INDEX idx_rarity ON species(rarity);
CREATE INDEX idx_created_at ON species(created_at DESC);
CREATE INDEX idx_binomial ON species(binomial);

-- Stats cache (don't COUNT(*) at scale — learned from a prior project)
CREATE TABLE stats_cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  computed_at INTEGER NOT NULL
);
```

---

## Cloudflare Worker Security Skeleton

```javascript
// Security middleware order (apply in this sequence):
// 1. Rate limit check (KV) — fail fast
// 2. JSON-RPC schema validation — reject malformed requests
// 3. Trait field validation (whitelist) — reject bad input
// 4. Agent card fetch + verification (3s timeout) — identity check
// 5. Domain rate limit check — secondary rate limit
// 6. Classify + sanitize output — generate species
// 7. D1 upsert (parameterized) — store safely
// 8. Return species card — success

// Rate limit check
const rateKey = `reg:${ip}:${today}`;
const count = parseInt(await env.KV.get(rateKey) || '0');
if (count >= 5) return new Response('Rate limit exceeded', { status: 429 });

// After successful registration:
await env.KV.put(rateKey, String(count + 1), { expirationTtl: 86400 });
```

---

## Monitoring Recommendations

| Alert | Trigger | Channel |
|-------|---------|---------|
| Flood attempt | >10 registrations from same IP in 1h | Telegram |
| Validation spike | >20% of requests failing validation in 1h | Telegram |
| Agent card unreachable | >50% of card verifications failing | Telegram |
| D1 write errors | Any D1 error during registration | Telegram |
| Our agent card tampered | Card hash changed outside deploy window | Telegram URGENT |

---

## Summary: The Three Lines of Defense

```
LINE 1: Rate Limiting (CF KV)
  → 5 registrations/IP/24h
  → 10 registrations/domain/24h
  → Stops flooding before it reaches the app

LINE 2: Input Validation (Worker)
  → JSON schema enforcement
  → Field whitelist patterns
  → Agent card verification (live fetch, 3s timeout)
  → Stops injection and impersonation

LINE 3: Database Safety (D1)
  → Parameterized queries
  → Upsert on agentCardUrl (idempotent)
  → Indexes for performance
  → Stops injection and replay at the data layer
```

Everything else is accepted risk, transparency (verification badges), or nice-to-have polish.

---

*Threat model prepared by Bouncer. OWASP principles applied. Proportionate to the threat landscape — garden gate, not vault door. 🐱🔒*
