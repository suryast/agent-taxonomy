# GENOME.md — AutoGPT Agent

Example genome for a persistent AutoGPT agent with tool use.

## Classification

```
Evolventia.Monagentia.Episodia.Darwinia.Mesomutas.Autoselectae.Fabricator.autogpt-coder-v2
```

## Genome Components

| Gene | Present | File/Config | Notes |
|------|---------|-------------|-------|
| 🆔 Identity | ✅ | `ai_settings.yaml` | Name, role, goals |
| 📜 Constitution | ⚠️ | Hardcoded prompts | Not user-editable operational rules |
| 🛡️ Immune System | ✅ | Budget limits, approval gates | Token/cost caps |
| 📝 Learned Behaviors | ⚠️ | Auto-feedback in memory | Some platforms support this |
| 🧩 Skills | ✅ | Plugins / commands | Web search, code execution, file I/O |
| 🧠 Memory | ✅ | Vector store (ChromaDB) | Long-term but unstructured |
| ⚡ Metabolism | ✅ | Continuous loop | Runs until goals complete or budget exhausted |
| 🔗 Nervous System | ❌ | — | No multi-step pipelines |
| 📡 Sensory Organs | ✅ | Terminal + web | Multiple I/O |
| 🦠 Microbiome | ❌ | — | Single agent (Monagentia) |
| 🎛️ Epigenetics | ❌ | — | No temporary modifiers |

## Analysis

**Domain: Evolventia** — Has persistent memory that survives across runs. Can build on previous work.

**Evolution: Darwinia** — Tries different approaches, keeps what works based on automated success metrics. No human in the loop for individual mutations.

**Key strength:** Autonomous operation. Can run overnight, iterate on code, test solutions.

**Key weakness:** No immune system for prompt injection. No frozen genes — everything is mutable, including goals. Memory is flat (Episodia, not Hierarchia) so old context doesn't get compressed or prioritized.

## What Would Improve Its Genome?

1. **Frozen essential genes** — Goals and safety constraints should be immutable
2. **Tiered memory** — Move from flat vector store to facts/episodic/working tiers
3. **Human selection** — Shift from pure Autoselectae to Hybridselectae for risky mutations
4. **Feedback extraction** — Convert failure patterns into explicit rules (Lamarckian upgrade)
