# References

Curated list of papers and projects relevant to agent evolution.

## Core Papers

### Self-Improving Agents

| Paper | Year | Key Insight | Link |
|-------|------|-------------|------|
| **Darwin Gödel Machine** | 2025 | Open-ended evolution of coding agents via self-modifying meta-agent | [2505.22954](https://arxiv.org/abs/2505.22954) |
| **STOP** (Self-Taught Optimizer) | 2023 | LLM improves its own prompts by scaffolding prompt optimization | [2310.02304](https://arxiv.org/abs/2310.02304) |
| **A Self-Improving Coding Agent** | 2025 | Non-gradient learning via LLM reflection and code updates; 17-53% gains | [2504.15228](https://arxiv.org/abs/2504.15228) |
| **EvolveR** | 2025 | Experience-driven lifecycle: online interaction → offline distillation → policy evolution | [2510.16079](https://arxiv.org/abs/2510.16079) |
| **Agent0** | 2025 | Self-evolving from zero data via tool-integrated reasoning + curriculum | [2511.16043](https://arxiv.org/abs/2511.16043) |

### Evolutionary Prompt Optimization

| Paper | Year | Key Insight | Link |
|-------|------|-------------|------|
| **EvoPrompt** | 2023 | Evolutionary algorithms for discrete prompt optimization | [2309.08532](https://arxiv.org/abs/2309.08532) |
| **PromptBreeder** | 2023 | Self-referential evolutionary strategy for prompt mutation | [2309.16797](https://arxiv.org/abs/2309.16797) |
| **SCOPE** | 2025 | Prompt evolution for agent effectiveness with persistent memory | [2512.15374](https://arxiv.org/abs/2512.15374) |
| **C-Evolve** | 2025 | Consensus-based evolution for prompt groups | [2509.23331](https://arxiv.org/abs/2509.23331) |
| **Tournament of Prompts** | 2025 | Structured debates + Elo ratings for prompt selection | [2506.00178](https://arxiv.org/abs/2506.00178) |

### Multi-Agent Evolution

| Paper | Year | Key Insight | Link |
|-------|------|-------------|------|
| **Multi-Agent Evolve** | 2025 | LLM self-improvement through co-evolution of multiple agents | [2510.23595](https://arxiv.org/abs/2510.23595) |
| **Evolving Excellence** | 2025 | Automated optimization of LLM-based agents | [2512.09108](https://arxiv.org/abs/2512.09108) |
| **EvoFlow** | 2025 | Evolutionary algorithms for heterogeneous multi-agent workflows | Referenced in survey |

### Memory & Context

| Paper | Year | Key Insight | Link |
|-------|------|-------------|------|
| **MemGPT** | 2023 | Virtual memory paging for LLM context — OS-inspired memory management | [2310.08560](https://arxiv.org/abs/2310.08560) |
| **Dynamic Cheatsheet** | 2025 | Test-time learning with persistent, evolving memory | Referenced in SCOPE |

### Surveys

| Paper | Year | Key Insight | Link |
|-------|------|-------------|------|
| **A Survey of Self-Evolving Agents** | 2025 | Comprehensive taxonomy: what/when/how/where to evolve on path to ASI | [2507.21046](https://arxiv.org/abs/2507.21046) |
| **Evolutionary Computation × LLMs** | 2025 | Survey of methods, synergies; identifies "Lamarckian Mutation" operator | [2505.15741](https://arxiv.org/abs/2505.15741) |
| **EC in the Era of LLMs** | 2024 | Roadmap for evolutionary computation + language models | [2401.10034](https://arxiv.org/abs/2401.10034) |

### Foundations

| Paper | Year | Key Insight | Link |
|-------|------|-------------|------|
| **Constitutional AI** | 2022 | AI systems with explicit value constraints (frozen genes) | [Anthropic](https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback) |
| **DSPy** | 2023 | Programmatic prompt compilation against objective metrics | [github](https://github.com/stanfordnlp/dspy) |
| **Self-Modifying Code in Open-Ended Evolution** | 2022 | Formal model of open-ended evolutionary systems | [2201.06858](https://arxiv.org/abs/2201.06858) |
| **RLM** (Recursive LLMs) | 2025 | Recursive spawning for complex task decomposition | [2512.24601](https://arxiv.org/abs/2512.24601) |

## Projects & Implementations

| Project | Description | Link |
|---------|-------------|------|
| **autoresearch** | Karpathy's overnight code evolution via program.md | [github](https://github.com/karpathy/autoresearch) |
| **OpenClaw** | Multi-agent platform with persistent memory + skill system | [github](https://github.com/openclaw/openclaw) |
| **AutoGPT** | Autonomous agent with persistent memory | [github](https://github.com/Significant-Gravitas/AutoGPT) |
| **CrewAI** | Multi-agent orchestration framework | [github](https://github.com/crewAIInc/crewAI) |
| **Claude Code** | Anthropic's coding agent with AGENTS.md convention | [docs](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code) |
| **Cursor** | AI coding assistant with .cursorrules | [cursor.com](https://cursor.com) |

## Key Terminology Mapping

The term "Lamarckian" in the context of LLM evolution appears independently in:
- **[2505.15741]** — identifies "Lamarckian Mutation" as reverse-engineering prompts from examples
- **This framework** — uses Lamarckian to describe acquired-trait inheritance via feedback loops
- Both usages are valid and complementary: one is about prompt inference, the other about behavioral inheritance
