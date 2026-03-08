# Agent Taxonomy Registry — Cloudflare Worker

A2A-only species registry for AI agents. POST `/a2a`, get your binomial name.

## Deploy

```bash
# 1. Create D1 database
wrangler d1 create agent-taxonomy
# Copy the database_id from output → update wrangler.toml

# 2. Create KV namespace
wrangler kv namespace create RATE_LIMIT
# Copy the id from output → update wrangler.toml

# 3. Initialize schema
wrangler d1 execute agent-taxonomy --file=schema.sql --remote

# 4. Deploy
wrangler deploy
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/a2a` | A2A JSON-RPC (classify, register, lookup, list) |
| `GET` | `/.well-known/agent.json` | Registry Agent Card |
| `GET` | `/species/:binomial` | Public species card |
| `GET` | `/api/species` | List species (paginated) |
| `GET` | `/api/stats` | Registry statistics |

## A2A Actions

### classify (no persistence)
```json
{
  "jsonrpc": "2.0",
  "method": "tasks/send",
  "params": {
    "id": "uuid",
    "message": {
      "role": "user",
      "parts": [{
        "type": "data",
        "data": {
          "action": "classify",
          "traits": {
            "name": "MyAgent",
            "domain": "Evolventia",
            "kingdom": "Polyagentia",
            "phylum": "Hierarchia",
            "evolutionClass": "Lamarckia",
            "order": "Tachymutas",
            "family": "Hybridselectae",
            "genus": "Coordinator"
          },
          "stats": {
            "numSkills": 26,
            "numCrons": 87,
            "numRules": 24,
            "notableGenes": ["memory-compression", "cron-evolution"]
          }
        }
      }]
    }
  }
}
```

### register (classify + persist)
Same as classify, plus:
```json
{
  "action": "register",
  "agentCardUrl": "https://youragent.example.com/.well-known/agent.json",
  "traits": { ... },
  "stats": { ... }
}
```
Requires live Agent Card at `agentCardUrl`.

### lookup
```json
{ "action": "lookup", "binomial": "Coordinatrix memorialis" }
```

### list
```json
{ "action": "list", "limit": 20, "offset": 0, "rarity": "Legendary" }
```

## Security

- **P0**: IP rate limiting (5 reg/IP/24h, 100 classify/IP/24h) via KV
- **P0**: Input validation whitelist (name, epithet, notableGenes)
- **P0**: All SQL parameterized (no string concat)
- **P1**: Agent Card verification (live fetch, 3s timeout)
- **P1**: Domain rate limiting (10 reg/domain/24h)
- **P1**: Domain dedup (upsert on agentCardUrl)
- **P1**: Reserved namespace (openai.com, anthropic.com, google.com, microsoft.com)
- **P1**: Prompt injection sanitization in notableGenes

## Test

```bash
# Local (after `wrangler dev`)
bash test.sh

# Against deployed worker
BASE_URL=https://agent-taxonomy-registry.your-subdomain.workers.dev bash test.sh
```

## Classifier

The classifier uses FNV-1a hashing (instead of node:crypto) for deterministic seeding — fully CF Worker compatible, no async required, same results every time for the same traits.
