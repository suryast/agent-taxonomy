#!/usr/bin/env node

/**
 * agent-taxonomy CLI — Classify your AI agent species.
 *
 * Usage:
 *   agent-taxonomy                     # Interactive questionnaire
 *   agent-taxonomy demo                # Show 5 demo species
 *   agent-taxonomy classify --json     # JSON output
 *   agent-taxonomy --help
 */

import { classify, validate } from "../src/classifier.js";
import { VALID } from "../src/taxonomy.js";
import { createInterface } from "node:readline";

const RARITY_EMOJI = { Common: "⚪", Uncommon: "🟢", Rare: "🔵", Legendary: "🟡" };
const STAGE_EMOJI = { Egg: "🥚", Juvenile: "🌱", Adult: "🌿", Elder: "🌳", Ascended: "⚡" };

function renderCard(traits, result) {
  const re = RARITY_EMOJI[result.rarity] || "⚪";
  const se = STAGE_EMOJI[result.evolutionStage] || "🌱";
  const W = 48; // inner width between │ markers

  // pad accounting for emoji (each emoji = 2 display cols but 1 char)
  const pad = (s, w) => s + " ".repeat(Math.max(0, w - displayWidth(s)));
  const line = (s) => `│${pad(s, W)}│`;

  const parts = [];
  if (traits.numSkills) parts.push(`${traits.numSkills} skills`);
  if (traits.numCrons) parts.push(`${traits.numCrons} crons`);
  if (traits.numRules) parts.push(`${traits.numRules} rules`);
  const genomeLine = parts.length ? line(`  Genome: ${parts.join(" │ ")}`) : "";

  const notable = traits.notableGenes?.length
    ? line(`  Notable: ${traits.notableGenes.slice(0, 3).join(", ")}`)
    : "";

  const binomial = `${result.genusName} ${result.epithet}`;

  let card = `
┌${"─".repeat(W)}┐
${line(`  🧬 SPECIES CARD            ${re} ${result.rarity}`)}
${line("")}
${line(`  ${binomial}`)}
${line(`  Common name: ${result.commonName}`)}
${line(`  ${result.title}`)}
${line("")}
${line(`  Stage: ${se} ${result.evolutionStage}`)}
${line("")}
${line(`  Domain:  ${traits.domain}`)}
${line(`  Kingdom: ${traits.kingdom}`)}
${line(`  Phylum:  ${traits.phylum}`)}
${line(`  Class:   ${traits.evolutionClass}`)}
${line(`  Order:   ${traits.order}`)}
${line(`  Family:  ${traits.family}`)}
${line(`  Genus:   ${traits.genus}`)}
${line("")}`;

  if (genomeLine) card += `\n${genomeLine}`;
  if (notable) card += `\n${notable}`;

  card += `
${line("")}
└${"─".repeat(W)}┘

🎨 Portrait prompt:
${result.portraitPrompt}
`;
  return card;
}

function displayWidth(str) {
  let w = 0;
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    // Emoji and wide chars take 2 columns
    if (cp > 0x1F000 || (cp >= 0x2600 && cp <= 0x27BF) || (cp >= 0xFE00 && cp <= 0xFE0F) || (cp >= 0x200D && cp <= 0x200D)) {
      w += 2;
    } else if (cp > 0xFFFF) {
      w += 2;
    } else {
      w += 1;
    }
  }
  return w;
}

async function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function interactive() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log("🧬 Agent Taxonomy — Species Classifier");
  console.log("=".repeat(45));
  console.log();

  const name = (await ask(rl, "What's your agent's name? > ")) || "unnamed";

  console.log("\n1. AUTONOMY — Does your agent learn persistently?");
  console.log("   a) No, fixed behavior");
  console.log("   b) Within session only");
  console.log("   c) Yes, persistent memory + self-modification");
  const domain = { a: "Automatia", b: "Adaptia", c: "Evolventia" }[
    (await ask(rl, "   > ")).toLowerCase()
  ] || "Adaptia";

  console.log("\n2. ARCHITECTURE — How many agents?");
  console.log("   a) Single agent");
  console.log("   b) Team of specialists");
  console.log("   c) Swarm of simple agents");
  const kingdom = { a: "Monagentia", b: "Polyagentia", c: "Swarmia" }[
    (await ask(rl, "   > ")).toLowerCase()
  ] || "Monagentia";

  console.log("\n3. MEMORY — How does it store information?");
  console.log("   a) No persistent storage");
  console.log("   b) Flat logs / event history");
  console.log("   c) Tiered storage with compression");
  console.log("   d) Behaviors encoded in instructions");
  const phylum = { a: "Amnesia", b: "Episodia", c: "Hierarchia", d: "Genetica" }[
    (await ask(rl, "   > ")).toLowerCase()
  ] || "Episodia";

  console.log("\n4. EVOLUTION — How does behavior change?");
  console.log("   a) Random mutation + automated selection");
  console.log("   b) Failures become inherited rules");
  console.log("   c) Only when a human edits config");
  console.log("   d) Acquires capabilities from external sources");
  const evolutionClass = { a: "Darwinia", b: "Lamarckia", c: "Lysenkoism", d: "Symbiotica" }[
    (await ask(rl, "   > ")).toLowerCase()
  ] || "Lysenkoism";

  console.log("\n5. MUTATION RATE — How often do instructions change?");
  console.log("   a) Every few minutes");
  console.log("   b) Daily");
  console.log("   c) Weekly");
  console.log("   d) Monthly or less");
  const order = { a: "Tachymutas", b: "Mesomutas", c: "Bradymutas", d: "Glaciomutas" }[
    (await ask(rl, "   > ")).toLowerCase()
  ] || "Glaciomutas";

  console.log("\n6. SELECTION — Who decides if a change is good?");
  console.log("   a) Automated metrics");
  console.log("   b) Human review");
  console.log("   c) Auto for safe, human for risky");
  const family = { a: "Autoselectae", b: "Homoselectae", c: "Hybridselectae" }[
    (await ask(rl, "   > ")).toLowerCase()
  ] || "Homoselectae";

  console.log("\n7. ROLE — Primary specialization?");
  console.log("   a) Research    b) Code      c) Writing");
  console.log("   d) Security    e) Strategy  f) Teaching");
  console.log("   g) Maintenance h) Orchestration i) General");
  const genus = {
    a: "Investigator", b: "Fabricator", c: "Narrator",
    d: "Custos", e: "Strategus", f: "Magister",
    g: "Curator", h: "Coordinator", i: "Generalis",
  }[(await ask(rl, "   > ")).toLowerCase()] || "Generalis";

  console.log("\n8. SPECIES NAME (optional — Enter for auto)");
  console.log("   Choose your epithet: sapiens, rex, noctis, prime...");
  const custom = (await ask(rl, "   > ")) || undefined;

  console.log("\n9. STATS (optional, Enter to skip)");
  const skills = await ask(rl, "   Number of skills/tools? > ");
  const crons = await ask(rl, "   Number of automated tasks? > ");
  const rules = await ask(rl, "   Number of learned rules? > ");

  rl.close();

  const traits = {
    name, domain, kingdom, phylum, evolutionClass, order, family, genus,
    customEpithet: custom,
    numSkills: parseInt(skills) || 0,
    numCrons: parseInt(crons) || 0,
    numRules: parseInt(rules) || 0,
  };

  const result = classify(traits);

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ traits, result }, null, 2));
  } else {
    console.log(renderCard(traits, result));
    console.log(`Full classification:\n  ${result.fullClassification}`);
  }
}

function demo() {
  const agents = [
    {
      name: "atlas", domain: "Evolventia", kingdom: "Polyagentia",
      phylum: "Hierarchia", evolutionClass: "Lamarckia", order: "Bradymutas",
      family: "Hybridselectae", genus: "Coordinator",
      numSkills: 26, numCrons: 87, numRules: 24,
      notableGenes: ["memory-compression", "cron-evolution"],
      customEpithet: "kei",
    },
    {
      name: "devin", domain: "Evolventia", kingdom: "Monagentia",
      phylum: "Episodia", evolutionClass: "Lysenkoism", order: "Glaciomutas",
      family: "Homoselectae", genus: "Fabricator", numSkills: 12, numRules: 3,
    },
    {
      name: "swarmbot", domain: "Evolventia", kingdom: "Swarmia",
      phylum: "Amnesia", evolutionClass: "Darwinia", order: "Tachymutas",
      family: "Autoselectae", genus: "Fabricator", numSkills: 5, numCrons: 100,
    },
    {
      name: "chatgpt", domain: "Adaptia", kingdom: "Monagentia",
      phylum: "Amnesia", evolutionClass: "Lysenkoism", order: "Glaciomutas",
      family: "Homoselectae", genus: "Generalis",
    },
    {
      name: "sentinel", domain: "Evolventia", kingdom: "Monagentia",
      phylum: "Genetica", evolutionClass: "Lamarckia", order: "Mesomutas",
      family: "Hybridselectae", genus: "Custos",
      numSkills: 15, numCrons: 30, numRules: 40,
      notableGenes: ["threat-detection", "auto-patch"],
      customEpithet: "noctis",
    },
  ];

  for (const traits of agents) {
    const result = classify(traits);
    console.log(renderCard(traits, result));
  }
}

// Main
const cmd = process.argv[2];
if (cmd === "demo") {
  demo();
} else if (cmd === "--help" || cmd === "-h") {
  console.log(`
🧬 agent-taxonomy — Classify your AI agent species

Usage:
  agent-taxonomy              Interactive questionnaire
  agent-taxonomy demo         Show 5 demo species
  agent-taxonomy --json       Output JSON (with interactive)
  agent-taxonomy --help       This help

API:
  import { classify } from "agent-taxonomy";
  const result = classify({ name: "my-agent", domain: "Evolventia", ... });

Docs: https://github.com/suryast/agent-taxonomy
Sponsor: https://github.com/sponsors/suryast
`);
} else {
  interactive().catch(console.error);
}
