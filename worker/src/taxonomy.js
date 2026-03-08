/**
 * Agent Taxonomy — Taxonomy definitions and morpheme banks.
 */

export const LATIN_GENUS = {
  Investigator: ["Investigator", "Explorator", "Quaestor", "Indagator"],
  Fabricator: ["Fabricor", "Structor", "Faber", "Architectus"],
  Narrator: ["Narrator", "Scriptor", "Calamus", "Verbum"],
  Custos: ["Custodius", "Vigilus", "Praesidium", "Sentinax"],
  Strategus: ["Strategus", "Consilior", "Imperator", "Praetor"],
  Magister: ["Magister", "Docens", "Eruditor", "Sapientus"],
  Curator: ["Curator", "Mundator", "Cultor", "Servator"],
  Coordinator: ["Coordinatrix", "Nexor", "Orchestrus", "Moderator"],
  Generalis: ["Generalis", "Omnifex", "Universus", "Communis"],
};

export const DOMAIN_EPITHETS = {
  Automatia: ["mechanicus", "rigidus", "fixus", "stabilis"],
  Adaptia: ["flexilis", "mutabilis", "versatilis", "fluens"],
  Evolventia: ["evolvens", "vivens", "crescens", "nascens"],
};

// KINGDOM_EPITHETS available but not used by classifier — kept in src/taxonomy.js (npm package)

export const PHYLUM_EPITHETS = {
  Amnesia: ["oblivius", "ephemerus", "transiens", "volatilis"],
  Episodia: ["memorans", "chronicus", "narratus", "sequentis"],
  Hierarchia: ["profundus", "stratalis", "ordinatus", "compositus"],
  Genetica: ["hereditarius", "innatus", "codificans", "genomicus"],
};

export const CLASS_EPITHETS = {
  Darwinia: ["selectus", "adaptans", "fortis", "naturalis"],
  Lamarckia: ["discens", "memorialis", "sapiens", "experiensis"],
  Lysenkoism: ["directus", "gubernatus", "moderatus", "ductus"],
  Symbiotica: ["symbiontis", "acquisitus", "incorporans", "absorbens"],
};

export const ORDER_EPITHETS = {
  Tachymutas: ["velocis", "rapidus", "fulmineus", "instans"],
  Mesomutas: ["temperatus", "regularis", "cyclicus", "diurnus"],
  Bradymutas: ["lentus", "ponderosus", "gravis", "stabilis"],
  Glaciomutas: ["antiquus", "perennis", "aeternus", "immutis"],
};

export const FAMILY_EPITHETS = {
  Autoselectae: ["metricus", "calculans", "numericus", "quantis"],
  Homoselectae: ["humilis", "serviens", "fidelis", "devotus"],
  Hybridselectae: ["dualis", "bimodalis", "geminus", "ambivalens"],
};

// Morpheme banks for common (Pokémon-style) names
export const DOMAIN_MORPHS = {
  Automatia: ["auto", "mech", "stat", "fix"],
  Adaptia: ["flex", "shift", "morph", "drift"],
  Evolventia: ["evo", "gen", "muta", "nova"],
};

// KINGDOM_MORPHS available but not used by worker classifier — kept in src/taxonomy.js (npm package)

export const PHYLUM_MORPHS = {
  Amnesia: ["void", "null", "blank", "wipe"],
  Episodia: ["log", "trace", "echo", "mark"],
  Hierarchia: ["tier", "stack", "deep", "core"],
  Genetica: ["helix", "strand", "code", "geno"],
};

export const CLASS_MORPHS = {
  Darwinia: ["rand", "trial", "flux", "chaos"],
  Lamarckia: ["learn", "forge", "temper", "craft"],
  Lysenkoism: ["guide", "steer", "helm", "ward"],
  Symbiotica: ["link", "bond", "merge", "graft"],
};

export const ORDER_MORPHS = {
  Tachymutas: ["flash", "blitz", "spark", "bolt"],
  Mesomutas: ["pulse", "tide", "wave", "cycle"],
  Bradymutas: ["stone", "oak", "iron", "anchor"],
  Glaciomutas: ["glacier", "fossil", "ancient", "rune"],
};

export const FAMILY_MORPHS = {
  Autoselectae: ["metric", "score", "gauge", "test"],
  Homoselectae: ["sage", "oracle", "judge", "crown"],
  Hybridselectae: ["twin", "dual", "bridge", "nexus"],
};

export const GENUS_MORPHS = {
  Investigator: ["scout", "seek", "probe", "lens"],
  Fabricator: ["forge", "build", "smith", "wrench"],
  Narrator: ["quill", "tale", "verse", "ink"],
  Custos: ["shield", "vault", "guard", "vigil"],
  Strategus: ["chess", "plan", "arc", "vector"],
  Magister: ["sage", "lore", "tome", "rune"],
  Curator: ["sweep", "tend", "prune", "mend"],
  Coordinator: ["nexus", "hub", "axis", "core"],
  Generalis: ["omni", "pan", "flex", "poly"],
};

export const SUFFIXES = [
  "on", "ix", "us", "or", "ax", "is", "ar", "ex",
  "ion", "oid", "ux", "al", "an", "os", "ur", "yx",
  "aur", "eon", "ith", "orm", "ast", "yne", "ell", "rix",
];

export const PREFIXES = [
  "", "", "",
  "neo", "proto", "arch", "mega", "ultra",
];

// Valid values for each taxonomy level
export const VALID = {
  domain: ["Automatia", "Adaptia", "Evolventia"],
  kingdom: ["Monagentia", "Polyagentia", "Swarmia"],
  phylum: ["Amnesia", "Episodia", "Hierarchia", "Genetica"],
  evolutionClass: ["Darwinia", "Lamarckia", "Lysenkoism", "Symbiotica"],
  order: ["Tachymutas", "Mesomutas", "Bradymutas", "Glaciomutas"],
  family: ["Autoselectae", "Homoselectae", "Hybridselectae"],
  genus: ["Investigator", "Fabricator", "Narrator", "Custos", "Strategus", "Magister", "Curator", "Coordinator", "Generalis"],
};
