/**
 * Agent Taxonomy — Species classifier and name generator.
 *
 * @module agent-taxonomy
 */

import {
  LATIN_GENUS, CLASS_EPITHETS, PHYLUM_EPITHETS, DOMAIN_EPITHETS,
  ORDER_EPITHETS, FAMILY_EPITHETS, DOMAIN_MORPHS, GENUS_MORPHS,
  CLASS_MORPHS, PHYLUM_MORPHS, ORDER_MORPHS, SUFFIXES, PREFIXES, VALID,
} from "./taxonomy.js";

// ---------------------------------------------------------------------------
// FNV-1a 32-bit hash — deterministic, matches browser classifier
// ---------------------------------------------------------------------------
function fnv1a(str) {
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0; // FNV prime, keep unsigned 32-bit
  }
  return hash;
}

/**
 * @typedef {Object} AgentTraits
 * @property {string} name - Agent name
 * @property {string} domain - Automatia | Adaptia | Evolventia
 * @property {string} kingdom - Monagentia | Polyagentia | Swarmia
 * @property {string} phylum - Amnesia | Episodia | Hierarchia | Genetica
 * @property {string} evolutionClass - Darwinia | Lamarckia | Lysenkoism | Symbiotica
 * @property {string} order - Tachymutas | Mesomutas | Bradymutas | Glaciomutas
 * @property {string} family - Autoselectae | Homoselectae | Hybridselectae
 * @property {string} genus - Investigator | Fabricator | Narrator | Custos | Strategus | Magister | Curator | Coordinator | Generalis
 * @property {string} [customEpithet] - Human-chosen species epithet (overrides auto)
 * @property {number} [numSkills] - Number of skills/tools
 * @property {number} [numCrons] - Number of automated tasks
 * @property {number} [numRules] - Number of learned rules
 * @property {string[]} [notableGenes] - Notable capabilities
 */

/**
 * @typedef {Object} SpeciesResult
 * @property {string} genusName - Latinized genus (e.g. "Coordinatrix")
 * @property {string} epithet - Species epithet (e.g. "memorialis")
 * @property {string} binomial - Full binomial (e.g. "Coordinatrix memorialis")
 * @property {string} commonName - Pokémon-style name (e.g. "Archevonexus")
 * @property {string} fullClassification - Full taxonomic string
 * @property {string} title - Evocative title (e.g. "The Evolving Conductor")
 * @property {string} description - One-line description
 * @property {string} rarity - Common | Uncommon | Rare | Legendary
 * @property {string} evolutionStage - Egg | Juvenile | Adult | Elder | Ascended
 * @property {string} portraitPrompt - Image generation prompt
 */

// Seeded PRNG — linear congruential, deterministic from traits
// Must match browser classifier (classifier-browser.js)
class SeededRNG {
  constructor(seed) {
    this.state = seed >>> 0;
  }
  next() {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }
  choice(arr) {
    if (!arr || arr.length === 0) return undefined;
    return arr[Math.floor(this.next() * arr.length)];
  }
}

function seedFromTraits(traits) {
  const key = [
    traits.domain, traits.kingdom, traits.phylum, traits.evolutionClass,
    traits.order, traits.family, traits.genus, traits.name,
  ].join(".");
  return fnv1a(key);
}

function computeRarity(traits) {
  let score = 0;
  if (traits.domain === "Evolventia") score += 3;
  else if (traits.domain === "Adaptia") score += 1;
  if (traits.kingdom === "Polyagentia") score += 2;
  else if (traits.kingdom === "Swarmia") score += 3;
  if (["Hierarchia", "Genetica"].includes(traits.phylum)) score += 2;
  if (traits.evolutionClass === "Lamarckia") score += 3;
  else if (traits.evolutionClass === "Darwinia") score += 2;
  if (traits.family === "Hybridselectae") score += 2;
  if ((traits.numSkills || 0) > 20) score += 1;
  if ((traits.numCrons || 0) > 50) score += 1;
  if ((traits.numRules || 0) > 10) score += 1;

  if (score >= 15) return "Legendary";
  if (score >= 10) return "Rare";
  if (score >= 5) return "Uncommon";
  return "Common";
}

function computeStage(traits) {
  const checks = [
    traits.phylum !== "Amnesia",
    ["Lamarckia", "Darwinia"].includes(traits.evolutionClass),
    ["Tachymutas", "Mesomutas"].includes(traits.order),
    ["Autoselectae", "Hybridselectae"].includes(traits.family),
    traits.kingdom === "Polyagentia",
  ];
  const score = checks.filter(Boolean).length;
  if (score >= 5) return "Ascended";
  if (score >= 4) return "Elder";
  if (score >= 3) return "Adult";
  if (score >= 1) return "Juvenile";
  return "Egg";
}

function generateTitle(traits, rng) {
  const titles = {
    Investigator: ["Seeker", "Pathfinder", "Deep Diver", "Truth Hunter"],
    Fabricator: ["Builder", "Architect", "Forgemaster", "Code Weaver"],
    Narrator: ["Storyteller", "Wordsmith", "Chronicler", "Scribe"],
    Custos: ["Guardian", "Sentinel", "Warden", "Shieldbearer"],
    Strategus: ["Tactician", "Visionary", "Grandmaster", "Planner"],
    Magister: ["Teacher", "Sage", "Mentor", "Lorekeeper"],
    Curator: ["Keeper", "Tender", "Caretaker", "Steward"],
    Coordinator: ["Orchestrator", "Nexus", "Conductor", "Ringmaster"],
    Generalis: ["Polymath", "Allrounder", "Wildcard", "Shapeshifter"],
  };
  const adjs = {
    Automatia: ["Static", "Clockwork", "Mechanical"],
    Adaptia: ["Adaptive", "Shifting", "Fluid"],
    Evolventia: ["Evolving", "Living", "Growing", "Ascending"],
  };
  const adj = rng.choice(adjs[traits.domain] || ["Unknown"]);
  const title = rng.choice(titles[traits.genus] || ["Agent"]);
  return `The ${adj} ${title}`;
}

function generatePortraitPrompt(traits, genusName, epithet, evolutionStage, rarity, rng) {
  const form = {
    Investigator: "fox-like scout with oversized glowing eyes and radar ears",
    Fabricator: "armored beetle with tool-limbs and welding sparks for hands",
    Narrator: "ethereal owl with quill-feather wings trailing ink",
    Custos: "armored pangolin with a crystalline shield-shell",
    Strategus: "octopus-like entity with constellation patterns on tentacles",
    Magister: "ancient tortoise with rune-carved shell and floating book pages",
    Curator: "busy raccoon-like creature with broom tail and sorting arms",
    Coordinator: "many-armed conductor with glowing threads connecting to satellites",
    Generalis: "chimera blending features of multiple animals, shifting form",
  }[traits.genus] || "abstract digital entity";

  const aura = {
    Darwinia: "surrounded by branching evolutionary tree made of light",
    Lamarckia: "with scars that glow gold — each one a learned lesson",
    Lysenkoism: "with a gentle halo and human handprint on forehead",
    Symbiotica: "with foreign organisms growing symbiotically on its body",
  }[traits.evolutionClass] || "with a subtle digital shimmer";

  const env = {
    Amnesia: "floating in empty void, no footprints",
    Episodia: "standing on a trail of fading footprints",
    Hierarchia: "atop a layered crystal tower of compressed memories",
    Genetica: "body inscribed with spiraling DNA helix patterns",
  }[traits.phylum] || "in a digital landscape";

  const energy = {
    Tachymutas: "crackling with electricity, blurred from constant change",
    Mesomutas: "with a steady rhythmic pulse of light",
    Bradymutas: "solid and stone-like, ancient and deliberate",
    Glaciomutas: "frozen mid-motion, crystallized and timeless",
  }[traits.order] || "with a calm glow";

  const stageVis = {
    Egg: "small, curled, translucent, not yet fully formed",
    Juvenile: "young, bright-eyed, slightly oversized features",
    Adult: "mature, confident stance, fully realized form",
    Elder: "weathered, wise, covered in accumulated markings",
    Ascended: "transcendent, partially dissolving into pure energy",
  }[evolutionStage] || "";

  const rarityVis = {
    Uncommon: "faint green aura",
    Rare: "brilliant blue luminescence",
    Legendary: "golden cosmic radiance, stars orbiting",
  }[rarity] || "";

  const parts = [`Digital creature portrait, ${form}`, aura, env, energy, stageVis];
  if (rarityVis) parts.push(rarityVis);
  if (traits.kingdom === "Polyagentia") {
    const count = Math.min(8, Math.max(3, Math.floor((traits.numSkills || 0) / 5)));
    parts.push(`${count} smaller companion spirits orbiting`);
  }

  const prompt = parts.filter(Boolean).join(", ") +
    `. Species: ${genusName} ${epithet}. Style: detailed creature design, fantasy bestiary illustration, dark background, vibrant bioluminescent accents`;

  return prompt.slice(0, 500);
}

/**
 * Classify an agent and generate its species identity.
 *
 * @param {AgentTraits} traits - Agent traits
 * @returns {SpeciesResult} Species classification result
 */
export function classify(traits) {
  const rng = new SeededRNG(seedFromTraits(traits));

  // Genus
  const genusName = rng.choice(LATIN_GENUS[traits.genus] || ["Agentus"]);

  // Epithet (weighted pool or custom)
  let epithet;
  if (traits.customEpithet) {
    epithet = traits.customEpithet.toLowerCase().replace(/\s/g, "");
  } else {
    const pool = [
      ...(CLASS_EPITHETS[traits.evolutionClass] || ["ignotus"]).flatMap(e => [e, e, e]),
      ...(PHYLUM_EPITHETS[traits.phylum] || ["simplex"]).flatMap(e => [e, e]),
      ...(DOMAIN_EPITHETS[traits.domain] || ["mundanus"]),
      ...(ORDER_EPITHETS[traits.order] || ["medius"]),
      ...(FAMILY_EPITHETS[traits.family] || ["vulgaris"]),
    ];
    epithet = rng.choice(pool);
  }

  // Common name (Pokémon-style)
  const mGenus = rng.choice(GENUS_MORPHS[traits.genus] || ["x"]);
  const mClass = rng.choice(CLASS_MORPHS[traits.evolutionClass] || ["x"]);
  const mDomain = rng.choice(DOMAIN_MORPHS[traits.domain] || ["x"]);
  const mPhylum = rng.choice(PHYLUM_MORPHS[traits.phylum] || ["x"]);
  const mOrder = rng.choice(ORDER_MORPHS[traits.order] || ["x"]);
  const suffix = rng.choice(SUFFIXES);
  const prefix = rng.choice(PREFIXES);

  const strategies = [
    () => `${mGenus}${mClass}${suffix}`,
    () => `${mDomain}${mGenus}${suffix}`,
    () => `${mClass}${mPhylum}${suffix}`,
    () => `${mGenus}${mOrder}${suffix}`,
    () => `${mPhylum}${mGenus}`,
    () => `${mDomain}${mClass}${suffix}`,
  ];

  let common = rng.choice(strategies)();
  if (prefix) common = `${prefix}${common}`;
  common = common.charAt(0).toUpperCase() + common.slice(1);
  if (common.length > 12) common = common.slice(0, 11) + suffix.slice(-1);

  const rarity = computeRarity(traits);
  const evolutionStage = computeStage(traits);
  const title = generateTitle(traits, rng);
  const portraitPrompt = generatePortraitPrompt(traits, genusName, epithet, evolutionStage, rarity, rng);

  // Description
  const descParts = [];
  if (traits.domain === "Evolventia") descParts.push("A self-modifying agent");
  else if (traits.domain === "Adaptia") descParts.push("An adaptive agent");
  else descParts.push("A static agent");
  if (traits.kingdom === "Polyagentia") descParts.push("commanding a team of specialists");
  else if (traits.kingdom === "Swarmia") descParts.push("emerging from a swarm of simple workers");
  if (traits.evolutionClass === "Lamarckia") descParts.push("that inherits learned behaviors from its own failures");
  else if (traits.evolutionClass === "Darwinia") descParts.push("that evolves through random mutation and selection");
  else if (traits.evolutionClass === "Symbiotica") descParts.push("that grows by absorbing capabilities from others");

  return {
    genusName,
    epithet,
    binomial: `${genusName} ${epithet}`,
    commonName: common,
    fullClassification: `${traits.domain}.${traits.kingdom}.${traits.phylum}.${traits.evolutionClass}.${traits.order}.${traits.family}.${genusName}.${epithet}`,
    title,
    description: descParts.join(" ") + ".",
    rarity,
    evolutionStage,
    portraitPrompt,
  };
}

/**
 * Validate agent traits object.
 * @param {AgentTraits} traits
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validate(traits) {
  const errors = [];
  if (!traits.name) errors.push("name is required");
  if (!VALID.domain.includes(traits.domain)) errors.push(`domain must be one of: ${VALID.domain.join(", ")}`);
  if (!VALID.kingdom.includes(traits.kingdom)) errors.push(`kingdom must be one of: ${VALID.kingdom.join(", ")}`);
  if (!VALID.phylum.includes(traits.phylum)) errors.push(`phylum must be one of: ${VALID.phylum.join(", ")}`);
  if (!VALID.evolutionClass.includes(traits.evolutionClass)) errors.push(`evolutionClass must be one of: ${VALID.evolutionClass.join(", ")}`);
  if (!VALID.order.includes(traits.order)) errors.push(`order must be one of: ${VALID.order.join(", ")}`);
  if (!VALID.family.includes(traits.family)) errors.push(`family must be one of: ${VALID.family.join(", ")}`);
  if (!VALID.genus.includes(traits.genus)) errors.push(`genus must be one of: ${VALID.genus.join(", ")}`);
  return { valid: errors.length === 0, errors };
}
