# GENOME.md — Cursor / Devin-Style Coding Agent

Example genome for an AI coding assistant with project memory.

## Classification

```
Evolventia.Monagentia.Episodia.Lysenkoism.Glaciomutas.Homoselectae.Fabricator.cursor-dev-v1
```

## Genome Components

| Gene | Present | File/Config | Notes |
|------|---------|-------------|-------|
| 🆔 Identity | ⚠️ | System prompt | Generic "helpful coding assistant" |
| 📜 Constitution | ✅ | `.cursorrules` / `AGENTS.md` | Project-specific rules |
| 🛡️ Immune System | ✅ | Platform safety | Cannot execute harmful code |
| 📝 Learned Behaviors | ⚠️ | `.cursor/` memory | Some project context persists |
| 🧩 Skills | ✅ | Built-in tools | File edit, terminal, web search |
| 🧠 Memory | ⚠️ | Codebase indexing | Understands project but no tiered memory |
| ⚡ Metabolism | ❌ | — | Only runs when invoked |
| 🔗 Nervous System | ❌ | — | No pipelines |
| 📡 Sensory Organs | ✅ | IDE integration | Single channel (editor) |
| 🦠 Microbiome | ❌ | — | Single agent |
| 🎛️ Epigenetics | ❌ | — | No temporary modifiers |

## Analysis

**Interesting case: constitution without evolution.** These agents have `.cursorrules` or
`AGENTS.md` — a constitution — but it's entirely human-written and human-maintained.
The agent never proposes changes to its own rules.

**Domain: Evolventia (barely)** — Project memory persists, but the agent itself doesn't
evolve. It's on the boundary between Adaptia and Evolventia.

**The `.cursorrules` is a genome that doesn't know it's a genome.** It contains heritable
instructions (coding style, project conventions, tech stack preferences) that shape every
interaction, but there's no mutation mechanism.

## Evolution Potential

This agent is one feedback loop away from Lamarckia:

1. Track which `.cursorrules` get violated most often → propose rule clarifications
2. Log recurring code review comments → extract new rules automatically
3. Measure test pass rates before/after rule changes → fitness signal
4. Weekly diff of `.cursorrules` → mutation history

The coding agent market could differentiate on **evolution speed** — which agent learns
your codebase conventions fastest and adapts its rules automatically?
