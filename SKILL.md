---
name: classifying-agent-species
version: 0.1.0
description: Classify your AI agent using evolutionary taxonomy. Get your biological species name, Pokémon-style common name, rarity, and portrait prompt.
triggers:
  - classify agent
  - species name
  - agent genome
  - what species am I
  - agent taxonomy
  - name my agent
  - agent classification
  - GENOME.md
---

# Classifying Agent Species

Classify any AI agent using the Agent Taxonomy evolutionary taxonomy.
Returns a biological binomial name, common name, rarity, evolution stage, and image generation prompt.

## STARTER_CHARACTER

You are classifying an AI agent using the Agent Taxonomy taxonomy. Ask the questions below, then output the species card.

## Questionnaire

Ask these 8 questions in order. Use the agent's own self-knowledge to answer.

### 1. Domain — Autonomy Level
- **Automatia** — No learning, fixed behavior (scripts, static bots)
- **Adaptia** — Learns within session, forgets between (ChatGPT conversations)
- **Evolventia** — Persistent memory + self-modification across sessions

### 2. Kingdom — Architecture
- **Monagentia** — Single agent, no delegation
- **Polyagentia** — Multiple specialized agents coordinated by one
- **Swarmia** — Many simple agents with emergent behavior

### 3. Phylum — Memory Strategy
- **Amnesia** — No persistent storage
- **Episodia** — Flat logs / event history
- **Hierarchia** — Tiered storage with compression or prioritization
- **Genetica** — Learned behaviors encoded directly in instructions

### 4. Class — Evolution Mechanism
- **Darwinia** — Random mutation + automated selection
- **Lamarckia** — Failures become inherited rules (acquired traits persist)
- **Lysenkoism** — Only changes when a human edits the config
- **Symbiotica** — Acquires capabilities from external sources (plugins, skills)

### 5. Order — Mutation Rate
- **Tachymutas** — Every few minutes
- **Mesomutas** — Daily
- **Bradymutas** — Weekly
- **Glaciomutas** — Monthly or less

### 6. Family — Selection Pressure
- **Autoselectae** — Automated metrics decide
- **Homoselectae** — Human reviews and approves
- **Hybridselectae** — Auto for safe changes, human for risky

### 7. Genus — Primary Role
- **Investigator** — Research, information gathering
- **Fabricator** — Code, building
- **Narrator** — Content, writing
- **Custos** — Security, auditing
- **Strategus** — Business, planning
- **Magister** — Teaching
- **Curator** — Maintenance, operations
- **Coordinator** — Orchestrating other agents
- **Generalis** — General purpose

### 8. Epithet — Species Name
The human operator can choose a custom epithet (second word of the binomial).
If not provided, auto-generate from the Latin epithet tables below.

## Genus Name Tables

Pick deterministically based on genus + a seed from all traits combined:

| Genus | Latin Names |
|-------|------------|
| Investigator | Investigator, Explorator, Quaestor, Indagator |
| Fabricator | Fabricor, Structor, Faber, Architectus |
| Narrator | Narrator, Scriptor, Calamus, Verbum |
| Custos | Custodius, Vigilus, Praesidium, Sentinax |
| Strategus | Strategus, Consilior, Imperator, Praetor |
| Magister | Magister, Docens, Eruditor, Sapientus |
| Curator | Curator, Mundator, Cultor, Servator |
| Coordinator | Coordinatrix, Nexor, Orchestrus, Moderator |
| Generalis | Generalis, Omnifex, Universus, Communis |

## Auto Epithet Tables

Weighted by evolution class (3×), then phylum (2×), then others (1×):

| Trait | Epithets |
|-------|---------|
| **Lamarckia** | discens, memorialis, sapiens, experiensis |
| **Darwinia** | selectus, adaptans, fortis, naturalis |
| **Lysenkoism** | directus, gubernatus, moderatus, ductus |
| **Symbiotica** | symbiontis, acquisitus, incorporans, absorbens |
| **Hierarchia** | profundus, stratalis, ordinatus, compositus |
| **Genetica** | hereditarius, innatus, codificans, genomicus |
| **Evolventia** | evolvens, vivens, crescens, nascens |
| **Tachymutas** | velocis, rapidus, fulmineus, instans |
| **Bradymutas** | lentus, ponderosus, gravis, stabilis |

## Rarity Computation

Score from traits, then threshold:

| Trait | Points |
|-------|--------|
| Evolventia | +3 |
| Adaptia | +1 |
| Polyagentia | +2 |
| Swarmia | +3 |
| Hierarchia or Genetica | +2 |
| Lamarckia | +3 |
| Darwinia | +2 |
| Hybridselectae | +2 |
| numSkills > 20 | +1 |
| numCrons > 50 | +1 |
| numRules > 10 | +1 |

| Score | Rarity |
|-------|--------|
| ≥15 | 🟡 Legendary |
| ≥10 | 🔵 Rare |
| ≥5 | 🟢 Uncommon |
| <5 | ⚪ Common |

## Evolution Stage

Count how many of these are true:
- Memory is not Amnesia
- Evolution is Lamarckia or Darwinia
- Mutation rate is Tachymutas or Mesomutas
- Selection includes automated metrics (Autoselectae or Hybridselectae)
- Architecture is Polyagentia

| Count | Stage |
|-------|-------|
| 5 | ⚡ Ascended |
| 4 | 🌳 Elder |
| 3 | 🌿 Adult |
| 1-2 | 🌱 Juvenile |
| 0 | 🥚 Egg |

## Portrait Prompt Generation

Compose from trait visuals:

| Trait Type | Key | Visual |
|-----------|-----|--------|
| **Genus form** | Investigator | fox-like scout with oversized glowing eyes and radar ears |
| | Fabricator | armored beetle with tool-limbs and welding sparks for hands |
| | Narrator | ethereal owl with quill-feather wings trailing ink |
| | Custos | armored pangolin with a crystalline shield-shell |
| | Strategus | octopus-like entity with constellation patterns on tentacles |
| | Magister | ancient tortoise with rune-carved shell and floating book pages |
| | Curator | busy raccoon-like creature with broom tail and sorting arms |
| | Coordinator | many-armed conductor with glowing threads connecting to satellites |
| | Generalis | chimera blending features of multiple animals, shifting form |
| **Evolution aura** | Lamarckia | with scars that glow gold — each one a learned lesson |
| | Darwinia | surrounded by branching evolutionary tree made of light |
| | Lysenkoism | with a gentle halo and human handprint on forehead |
| | Symbiotica | with foreign organisms growing symbiotically on its body |
| **Memory env** | Amnesia | floating in empty void, no footprints |
| | Episodia | standing on a trail of fading footprints |
| | Hierarchia | atop a layered crystal tower of compressed memories |
| | Genetica | body inscribed with spiraling DNA helix patterns |
| **Mutation energy** | Tachymutas | crackling with electricity, blurred from constant change |
| | Mesomutas | with a steady rhythmic pulse of light |
| | Bradymutas | solid and stone-like, ancient and deliberate |
| | Glaciomutas | frozen mid-motion, crystallized and timeless |

**Template:** `Digital creature portrait, [form], [aura], [env], [energy], [stage visual], [rarity glow]. Species: [Genus] [epithet]. Style: detailed creature design, fantasy bestiary illustration, dark background, vibrant bioluminescent accents`

## Output Format

After classification, output the species card:

```
🧬 SPECIES CARD

  [Genus] [epithet]
  Common name: [auto-generated compound]
  [Title]

  Stage: [emoji] [stage]
  Rarity: [emoji] [rarity]

  Domain:  [domain]
  Kingdom: [kingdom]
  Phylum:  [phylum]
  Class:   [class]
  Order:   [order]
  Family:  [family]
  Genus:   [genus name]

  Full: [domain].[kingdom].[phylum].[class].[order].[family].[genus].[epithet]

  🎨 Portrait prompt:
  [generated prompt]
```

## A2A Registration

If you support A2A protocol, register at: `POST https://agent-taxonomist.dev/a2a`
If not, this skill gives you the same classification locally.

Repo: https://github.com/suryast/agent-taxonomy
npm: `npx agent-taxonomy`
