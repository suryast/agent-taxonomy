/**
 * agent-taxonomy — Classify your AI agent species.
 *
 * @example
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
 *   customEpithet: "kei",
 * });
 *
 * console.log(result.binomial);       // "Orchestrus kei"
 * console.log(result.commonName);     // "Archevonexus"
 * console.log(result.rarity);         // "Legendary"
 * console.log(result.portraitPrompt); // image gen prompt
 *
 * @module agent-taxonomy
 */

export { classify, validate } from "./classifier.js";
export { VALID } from "./taxonomy.js";
