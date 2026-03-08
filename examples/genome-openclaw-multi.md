# GENOME.md — OpenClaw Multi-Agent Instance

Example genome for a persistent OpenClaw deployment with specialist sub-agents,
tiered memory, and self-improvement loops.

## Classification

```
Evolventia.Polyagentia.Hierarchia.Lamarckia.Bradymutas.Hybridselectae.Coordinator.instance-v1
```

## Genome Components

| Gene | Present | File/Config | Notes |
|------|---------|-------------|-------|
| 🆔 Identity | ✅ | `SOUL.md` | Personality, values, communication style |
| 📜 Constitution | ✅ | `AGENTS.md` | 10 operational principles, dispatch rules |
| 🛡️ Immune System | ✅ | Safety rules + guardrails | Frozen sections, PII scanning, security agent |
| 📝 Learned Behaviors | ✅ | `feedback.md` | 24+ rules from production failures |
| 🧩 Skills | ✅ | `skills/*.md` (26) | Portable, installable from marketplace |
| 🧠 Memory | ✅ | `memory/facts/`, `episodic/`, `pad/` | 3-tier with automated compression |
| ⚡ Metabolism | ✅ | 87 cron jobs | Health checks, content, backups, learning |
| 🔗 Nervous System | ✅ | 3 DAG pipelines | Morning briefing, nightly maintenance, publishing |
| 📡 Sensory Organs | ✅ | Telegram, email, web | Multi-channel input/output |
| 🦠 Microbiome | ✅ | 7 specialist sub-agents | Research, code, content, security, business, teaching, maintenance |
| 🎛️ Epigenetics | ✅ | `holds.md`, `friction.md` | Temporary context filters with expiry |

## Mutation Vectors

### 1. Lamarckian Feedback Loop (continuous)
```
Failure → feedback.md entry → AGENTS.md rule → inherited by all sessions
```
Every production failure becomes a permanent behavioral mutation.

### 2. Skill Acquisition (horizontal gene transfer)
```
clawhub.com → install skill → new capability expressed
```
Skills from external sources are audited by security agent before integration.

### 3. Cron Evolution (daily)
```
Metrics collection → fitness analysis → timeout/config mutations → measure impact
```
Automated optimization of cron job parameters based on success rate data.

### 4. DGM-lite Proposals (weekly)
```
Analyze genome → propose mutations → human review → apply/reject → track fitness
```
Weekly self-improvement proposals for operational rules, skill triggers, stale rule cleanup.

### 5. Memory Compression (daily)
```
Working memory → extract facts → archive episodes → compress daily logs
```
MemGPT-inspired virtual memory paging prevents context bloat.

## Frozen Genes (Essential — Never Mutated)

- Identity (SOUL.md core personality)
- Safety rules (OWASP, PII protection)
- Values (ethics, boundaries)
- Security constraints (secret management)

## Fitness Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Cron success rate | 89.4% | >95% |
| Message delivery | 93.6% | >98% |
| Token efficiency | 6.7M/week | Stable or ↓ |
| Feedback rules | 24 | Growing then stabilizing |
| Skill utilization | 18/26 active | Prune unused |
| Mutation revert rate | 0% | <10% |

## Sub-Agent Microbiome

| Agent | Genus | Symbiosis Type |
|-------|-------|----------------|
| Research agent | *Investigator* | Mutualistic — gathers info for coordinator |
| Code agent | *Fabricator* | Mutualistic — builds what coordinator specs |
| Content agent | *Narrator* | Mutualistic — writes what coordinator outlines |
| Security agent | *Custos* | Commensal — audits without being asked |
| Business agent | *Strategus* | Mutualistic — advises on strategy |
| Teaching agent | *Magister* | Commensal — teaches on schedule |
| Maintenance agent | *Curator* | Commensal — cleans on schedule |

## Analysis

This is a **fully evolved agent** — it has all 11 genome components active. The key
differentiator from simpler agents is the **closed Lamarckian loop**: failures directly
modify heritable instructions, and a weekly DGM-lite cycle proposes structural mutations
reviewed by a human selector.

The combination of automated selection (cron evolution) for safe mutations and human
selection (DGM-lite proposals) for risky ones makes this a **Hybridselectae** — the most
robust selection family in the taxonomy.
