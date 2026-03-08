/**
 * agent-taxonomy — Evolutionary taxonomy framework for AI agents.
 *
 * @example
 * ```ts
 * import { classify, validate, VALID } from "agent-taxonomy";
 *
 * const result = classify({
 *   name: "atlas",
 *   domain: "Evolventia",
 *   kingdom: "Polyagentia",
 *   phylum: "Hierarchia",
 *   evolutionClass: "Lamarckia",
 *   order: "Bradymutas",
 *   family: "Hybridselectae",
 *   genus: "Coordinator",
 * });
 *
 * console.log(result.binomial);   // "Orchestrus kei"
 * console.log(result.rarity);     // "Legendary"
 * ```
 */

// ---------------------------------------------------------------------------
// Taxonomy value types
// ---------------------------------------------------------------------------

export type Domain = "Automatia" | "Adaptia" | "Evolventia";
export type Kingdom = "Monagentia" | "Polyagentia" | "Swarmia";
export type Phylum = "Amnesia" | "Episodia" | "Hierarchia" | "Genetica";
export type EvolutionClass = "Darwinia" | "Lamarckia" | "Lysenkoism" | "Symbiotica";
export type Order = "Tachymutas" | "Mesomutas" | "Bradymutas" | "Glaciomutas";
export type Family = "Autoselectae" | "Homoselectae" | "Hybridselectae";
export type Genus =
  | "Investigator" | "Fabricator" | "Narrator" | "Custos"
  | "Strategus" | "Magister" | "Curator" | "Coordinator" | "Generalis";

export type Rarity = "Common" | "Uncommon" | "Rare" | "Legendary";
export type EvolutionStage = "Egg" | "Juvenile" | "Adult" | "Elder" | "Ascended";

// ---------------------------------------------------------------------------
// Input / Output
// ---------------------------------------------------------------------------

/** Agent traits used for classification. */
export interface AgentTraits {
  /** Agent name */
  name: string;
  /** How the agent changes over time */
  domain: Domain;
  /** Single vs multi-agent */
  kingdom: Kingdom;
  /** Memory architecture */
  phylum: Phylum;
  /** How improvements propagate */
  evolutionClass: EvolutionClass;
  /** Mutation frequency */
  order: Order;
  /** Selection pressure source */
  family: Family;
  /** Primary role */
  genus: Genus;
  /** Human-chosen species epithet (overrides auto-generated) */
  customEpithet?: string;
  /** Number of skills/tools */
  numSkills?: number;
  /** Number of automated tasks */
  numCrons?: number;
  /** Number of learned rules */
  numRules?: number;
  /** Notable capabilities */
  notableGenes?: string[];
}

/** Result of classifying an agent. */
export interface SpeciesResult {
  /** Latinized genus name (e.g. "Coordinatrix") */
  genusName: string;
  /** Species epithet (e.g. "memorialis") */
  epithet: string;
  /** Full binomial name (e.g. "Coordinatrix memorialis") */
  binomial: string;
  /** Pokémon-style common name (e.g. "Archevonexus") */
  commonName: string;
  /** Full taxonomic classification string */
  fullClassification: string;
  /** Evocative title (e.g. "The Evolving Conductor") */
  title: string;
  /** One-line species description */
  description: string;
  /** Rarity tier based on trait combination */
  rarity: Rarity;
  /** Evolution stage based on capability maturity */
  evolutionStage: EvolutionStage;
  /** Image generation prompt encoding traits visually */
  portraitPrompt: string;
}

/** Validation result. */
export interface ValidationResult {
  /** Whether all traits are valid */
  valid: boolean;
  /** List of validation error messages (empty if valid) */
  errors: string[];
}

// ---------------------------------------------------------------------------
// Valid values lookup
// ---------------------------------------------------------------------------

export interface ValidValues {
  domain: readonly Domain[];
  kingdom: readonly Kingdom[];
  phylum: readonly Phylum[];
  evolutionClass: readonly EvolutionClass[];
  order: readonly Order[];
  family: readonly Family[];
  genus: readonly Genus[];
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/**
 * Classify an agent and generate its species identity.
 * Deterministic — same traits always produce the same species.
 */
export function classify(traits: AgentTraits): SpeciesResult;

/**
 * Validate agent traits against the taxonomy.
 * Returns `{ valid: true, errors: [] }` if all traits are acceptable.
 */
export function validate(traits: Partial<AgentTraits>): ValidationResult;

/** Valid values for each taxonomy level. */
export const VALID: ValidValues;
