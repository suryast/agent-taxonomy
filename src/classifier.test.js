import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classify, validate } from "./classifier.js";

describe("classify", () => {
  it("generates deterministic names from same traits", () => {
    const traits = {
      name: "test", domain: "Evolventia", kingdom: "Polyagentia",
      phylum: "Hierarchia", evolutionClass: "Lamarckia", order: "Bradymutas",
      family: "Hybridselectae", genus: "Coordinator",
    };
    const a = classify(traits);
    const b = classify(traits);
    assert.equal(a.binomial, b.binomial);
    assert.equal(a.commonName, b.commonName);
    assert.equal(a.rarity, b.rarity);
  });

  it("uses custom epithet when provided", () => {
    const result = classify({
      name: "atlas", domain: "Evolventia", kingdom: "Polyagentia",
      phylum: "Hierarchia", evolutionClass: "Lamarckia", order: "Bradymutas",
      family: "Hybridselectae", genus: "Coordinator", customEpithet: "kei",
    });
    assert.ok(result.binomial.endsWith("kei"));
    assert.equal(result.epithet, "kei");
  });

  it("generates auto epithet when no custom provided", () => {
    const result = classify({
      name: "test", domain: "Adaptia", kingdom: "Monagentia",
      phylum: "Amnesia", evolutionClass: "Lysenkoism", order: "Glaciomutas",
      family: "Homoselectae", genus: "Generalis",
    });
    assert.ok(result.epithet.length > 0);
    assert.ok(result.binomial.includes(" "));
  });

  it("computes rarity correctly", () => {
    const legendary = classify({
      name: "max", domain: "Evolventia", kingdom: "Polyagentia",
      phylum: "Hierarchia", evolutionClass: "Lamarckia", order: "Bradymutas",
      family: "Hybridselectae", genus: "Coordinator",
      numSkills: 30, numCrons: 60, numRules: 20,
    });
    assert.equal(legendary.rarity, "Legendary");

    const common = classify({
      name: "min", domain: "Automatia", kingdom: "Monagentia",
      phylum: "Amnesia", evolutionClass: "Lysenkoism", order: "Glaciomutas",
      family: "Homoselectae", genus: "Generalis",
    });
    assert.equal(common.rarity, "Common");
  });

  it("computes evolution stage correctly", () => {
    const egg = classify({
      name: "egg", domain: "Automatia", kingdom: "Monagentia",
      phylum: "Amnesia", evolutionClass: "Lysenkoism", order: "Glaciomutas",
      family: "Homoselectae", genus: "Generalis",
    });
    assert.equal(egg.evolutionStage, "Egg");
  });

  it("generates portrait prompt", () => {
    const result = classify({
      name: "test", domain: "Evolventia", kingdom: "Polyagentia",
      phylum: "Hierarchia", evolutionClass: "Lamarckia", order: "Bradymutas",
      family: "Hybridselectae", genus: "Coordinator",
    });
    assert.ok(result.portraitPrompt.includes("creature"));
    assert.ok(result.portraitPrompt.includes("Species:"));
  });

  it("different names produce different species", () => {
    const base = {
      domain: "Evolventia", kingdom: "Monagentia", phylum: "Episodia",
      evolutionClass: "Lamarckia", order: "Mesomutas",
      family: "Homoselectae", genus: "Fabricator",
    };
    const a = classify({ ...base, name: "alpha" });
    const b = classify({ ...base, name: "beta" });
    // Names differ because seed includes name
    assert.notEqual(a.binomial, b.binomial);
  });
});

describe("validate", () => {
  it("accepts valid traits", () => {
    const { valid, errors } = validate({
      name: "test", domain: "Evolventia", kingdom: "Polyagentia",
      phylum: "Hierarchia", evolutionClass: "Lamarckia", order: "Bradymutas",
      family: "Hybridselectae", genus: "Coordinator",
    });
    assert.equal(valid, true);
    assert.equal(errors.length, 0);
  });

  it("rejects invalid domain", () => {
    const { valid, errors } = validate({
      name: "test", domain: "InvalidDomain", kingdom: "Polyagentia",
      phylum: "Hierarchia", evolutionClass: "Lamarckia", order: "Bradymutas",
      family: "Hybridselectae", genus: "Coordinator",
    });
    assert.equal(valid, false);
    assert.ok(errors[0].includes("domain"));
  });

  it("rejects missing name", () => {
    const { valid } = validate({
      domain: "Evolventia", kingdom: "Polyagentia",
      phylum: "Hierarchia", evolutionClass: "Lamarckia", order: "Bradymutas",
      family: "Hybridselectae", genus: "Coordinator",
    });
    assert.equal(valid, false);
  });
});
