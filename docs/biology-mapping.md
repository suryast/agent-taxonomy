# Biology ↔ AI Agent Mapping

A detailed mapping between biological concepts and their AI agent equivalents.

## Where the Analogy Holds

| Biology | AI Agent | Strength |
|---------|----------|----------|
| DNA | GENOME.md (config files) | ⭐⭐⭐ Strong — heritable instructions |
| Gene | SKILL.md file | ⭐⭐⭐ Strong — portable, expressible unit |
| Phenotype | Observable agent behavior | ⭐⭐⭐ Strong — same config → same behavior |
| Gene expression | Skill router loading a skill | ⭐⭐⭐ Strong — conditional activation |
| Mutation | Config/prompt change | ⭐⭐⭐ Strong — heritable modification |
| Natural selection | Human review (accept/reject) | ⭐⭐⭐ Strong — fitness-based filtering |
| Horizontal gene transfer | Installing external skills | ⭐⭐⭐ Strong — capability from another organism |
| Essential genes | Frozen safety/identity sections | ⭐⭐⭐ Strong — deletion is lethal |
| Pseudogene | Installed but never-triggered skill | ⭐⭐⭐ Strong — present but not expressed |
| Immune system | Security rules, guardrails | ⭐⭐ Moderate — protects but differently |
| Epigenetics | Temporary context holds | ⭐⭐ Moderate — reversible expression changes |
| Microbiome | Sub-agents | ⭐⭐ Moderate — symbiotic helpers |
| Central dogma | Config → prompt → behavior | ⭐⭐ Moderate — similar flow, different mechanism |
| Lamarckian inheritance | Failure → rule → inherited | ⭐⭐⭐ Strong — this is the key insight |

## Where the Analogy Breaks Down

| Biology | AI Agent | Why It Breaks |
|---------|----------|---------------|
| Sexual reproduction | Merging two agent configs | No clear mechanism for "recombination" — configs don't have chromosomes |
| Speciation via isolation | Platform incompatibility | Agents can be easily ported; isolation is artificial |
| Death | Agent shutdown | Agents can be revived from backups; no true death |
| Aging | Context window limits | Agents don't degrade with age — they accumulate capability |
| Genetic drift | Random config changes | Agent mutations are intentional, not random |
| Convergent evolution | Similar agents on different platforms | More about shared training data than independent evolution |
| Predator-prey dynamics | Agent competition | Agents mostly cooperate, not compete |

## Novel Concepts (No Biology Equivalent)

| AI Agent Concept | Description | Why It's New |
|-----------------|-------------|--------------|
| **Instant cloning** | Copy config → identical agent | Biology can't duplicate organisms perfectly |
| **Selective memory** | Choose what to remember | Organisms can't deliberately forget |
| **Model swapping** | Change the underlying model | Like changing your entire brain while keeping your personality |
| **Context window** | Fixed processing capacity | No biological equivalent to a hard token limit |
| **Prompt injection** | External manipulation of behavior | Closer to parasitism but more like mind control |
| **Rollback** | Revert to previous config version | No biological undo button |

## The Lamarck Connection

Jean-Baptiste Lamarck proposed that organisms could pass on traits acquired during their
lifetime. Biology proved him wrong — DNA doesn't change based on experience.

**But AI agents prove him right.**

In an agent system:
1. Agent encounters a failure (experience)
2. Failure is logged to feedback.md (acquired trait)
3. Feedback becomes a rule in AGENTS.md (heritable instruction)
4. Every future session inherits this rule (next generation)

This is textbook Lamarckian inheritance. It works because agent "DNA" (config files) is
directly writable, unlike biological DNA. The separation between genotype and phenotype
is much thinner in software.

### Why Lamarckian > Darwinian for Agents

| Property | Darwinian | Lamarckian | Winner for Agents |
|----------|-----------|------------|-------------------|
| Speed | Slow (random search) | Fast (directed) | 🏆 Lamarckian |
| Sample efficiency | Low (many mutations needed) | High (one failure = one rule) | 🏆 Lamarckian |
| Risk of bad mutations | Lower (random) | Higher (systematic bias) | ⚠️ Darwinian |
| Requires human | No (automated selection) | Optional | Depends |
| Reversibility | Easy (discard individual) | Harder (rule is now in DNA) | ⚠️ Darwinian |

The risk of Lamarckian evolution is **overfitting to recent failures** — acquiring too many
specific rules that don't generalize. This is why periodic "genome cleanup" (consolidating
or pruning feedback rules) is essential.
