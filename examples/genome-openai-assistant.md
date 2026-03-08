# GENOME.md — OpenAI Custom GPT

Example genome for a custom GPT built on OpenAI's platform.

## Classification

```
Adaptia.Monagentia.Episodia.Lysenkoism.Glaciomutas.Homoselectae.Narrator.recipe-gpt-v1
```

## Genome Components

| Gene | Present | File/Config | Notes |
|------|---------|-------------|-------|
| 🆔 Identity | ✅ | System prompt | "You are a helpful recipe assistant..." |
| 📜 Constitution | ❌ | — | No operational rules beyond system prompt |
| 🛡️ Immune System | ✅ | OpenAI safety layer | Platform-level, not agent-controlled |
| 📝 Learned Behaviors | ❌ | — | No feedback loop |
| 🧩 Skills | ✅ | Actions (API) | 2 actions: recipe search, unit conversion |
| 🧠 Memory | ⚠️ | Conversation memory | Session-only, no persistence across chats |
| ⚡ Metabolism | ❌ | — | No automated tasks |
| 🔗 Nervous System | ❌ | — | No pipelines |
| 📡 Sensory Organs | ✅ | ChatGPT UI | Single channel |
| 🦠 Microbiome | ❌ | — | No sub-agents |
| 🎛️ Epigenetics | ❌ | — | No temporary modifiers |

## Analysis

**Domain: Adaptia** — Learns within conversation but nothing persists. Every new chat starts from the same genome.

**Evolution mechanism: Lysenkoism** — Only the human creator can modify the system prompt. No automated mutation, no feedback-driven learning.

**Mutation rate: Glaciomutas** — Changes happen when the creator manually updates the system prompt. Could be months between mutations.

**Key limitation:** No Lamarckian loop. Failures in conversation never become rules. The agent makes the same mistakes forever unless the human notices and updates the prompt.

## What Would Make It Evolvable?

1. **Add feedback.md equivalent** — Log user corrections, extract patterns
2. **Persistent memory** — Move from Episodia to Hierarchia
3. **Automated mutation** — Use conversation logs to propose system prompt improvements
4. **Fitness metrics** — Track user satisfaction, task completion rate
