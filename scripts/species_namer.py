#!/usr/bin/env python3
"""
Agent Species Namer — Biological binomial nomenclature for AI agents.

Generates proper Linnaean binomials: *Genus epithet*
- Genus: Latinized role (Fabricor, Coordinatrix, Custodius...)
- Epithet: auto-generated from traits, Latin-style adjective

Like biology: Homo sapiens, Canis lupus, Felis catus
For agents: Coordinatrix memorialis, Fabricor velocis, Custodius vigilans
"""

import hashlib
import random
from dataclasses import dataclass
from typing import Optional

# === LATINIZED GENUS NAMES ===
# Each role gets a proper Latin-style genus name

LATIN_GENUS = {
    "Investigator": ["Investigator", "Explorator", "Quaestor", "Indagator"],
    "Fabricator":   ["Fabricor", "Structor", "Faber", "Architectus"],
    "Narrator":     ["Narrator", "Scriptor", "Calamus", "Verbum"],
    "Custos":       ["Custodius", "Vigilus", "Praesidium", "Sentinax"],
    "Strategus":    ["Strategus", "Consilior", "Imperator", "Praetor"],
    "Magister":     ["Magister", "Docens", "Eruditor", "Sapientus"],
    "Curator":      ["Curator", "Mundator", "Cultor", "Servator"],
    "Coordinator":  ["Coordinatrix", "Nexor", "Orchestrus", "Moderator"],
    "Generalis":    ["Generalis", "Omnifex", "Universus", "Communis"],
}

# === SPECIES EPITHETS ===
# Latin-style adjectives derived from traits

DOMAIN_EPITHETS = {
    "Automatia":  ["mechanicus", "rigidus", "fixus", "stabilis"],
    "Adaptia":    ["flexilis", "mutabilis", "versatilis", "fluens"],
    "Evolventia": ["evolvens", "vivens", "crescens", "nascens"],
}

KINGDOM_EPITHETS = {
    "Monagentia":  ["solitarius", "unicus", "singularis", "simplex"],
    "Polyagentia": ["socialis", "gregarius", "colonialis", "imperialis"],
    "Swarmia":     ["multiformis", "collectivus", "emergens", "diffusus"],
}

PHYLUM_EPITHETS = {
    "Amnesia":    ["oblivius", "ephemerus", "transiens", "volatilis"],
    "Episodia":   ["memorans", "chronicus", "narratus", "sequentis"],
    "Hierarchia": ["profundus", "stratalis", "ordinatus", "compositus"],
    "Genetica":   ["hereditarius", "innatus", "codificans", "genomicus"],
}

CLASS_EPITHETS = {
    "Darwinia":   ["selectus", "adaptans", "fortis", "naturalis"],
    "Lamarckia":  ["discens", "memorialis", "sapiens", "experiensis"],
    "Lysenkoism": ["directus", "gubernatus", "moderatus", "ductus"],
    "Symbiotica": ["symbiontis", "acquisitus", "incorporans", "absorbens"],
}

ORDER_EPITHETS = {
    "Tachymutas":  ["velocis", "rapidus", "fulmineus", "instans"],
    "Mesomutas":   ["temperatus", "regularis", "cyclicus", "diurnus"],
    "Bradymutas":  ["lentus", "ponderosus", "gravis", "stabilis"],
    "Glaciomutas": ["antiquus", "perennis", "aeternus", "immutis"],
}

FAMILY_EPITHETS = {
    "Autoselectae":  ["metricus", "calculans", "numericus", "quantis"],
    "Homoselectae":  ["humilis", "serviens", "fidelis", "devotus"],
    "Hybridselectae": ["dualis", "bimodalis", "geminus", "ambivalens"],
}

# === MORPHEME BANKS (for Pokémon-style fallback) ===

DOMAIN_MORPHS = {
    "Automatia":  ["auto", "mech", "stat", "fix"],
    "Adaptia":    ["flex", "shift", "morph", "drift"],
    "Evolventia": ["evo", "gen", "muta", "nova"],
}

KINGDOM_MORPHS = {
    "Monagentia":  ["solo", "mono", "uni", "sin"],
    "Polyagentia": ["poly", "swarm", "hive", "pack"],
    "Swarmia":     ["buzz", "flock", "colony", "mesh"],
}

PHYLUM_MORPHS = {
    "Amnesia":    ["void", "null", "blank", "wipe"],
    "Episodia":   ["log", "trace", "echo", "mark"],
    "Hierarchia": ["tier", "stack", "deep", "core"],
    "Genetica":   ["helix", "strand", "code", "geno"],
}

CLASS_MORPHS = {
    "Darwinia":   ["rand", "trial", "flux", "chaos"],
    "Lamarckia":  ["learn", "forge", "temper", "craft"],
    "Lysenkoism": ["guide", "steer", "helm", "ward"],
    "Symbiotica": ["link", "bond", "merge", "graft"],
}

ORDER_MORPHS = {
    "Tachymutas":  ["flash", "blitz", "spark", "bolt"],
    "Mesomutas":   ["pulse", "tide", "wave", "cycle"],
    "Bradymutas":  ["stone", "oak", "iron", "anchor"],
    "Glaciomutas": ["glacier", "fossil", "ancient", "rune"],
}

FAMILY_MORPHS = {
    "Autoselectae":  ["metric", "score", "gauge", "test"],
    "Homoselectae":  ["sage", "oracle", "judge", "crown"],
    "Hybridselectae": ["twin", "dual", "bridge", "nexus"],
}

GENUS_MORPHS = {
    "Investigator": ["scout", "seek", "probe", "lens"],
    "Fabricator":   ["forge", "build", "smith", "wrench"],
    "Narrator":     ["quill", "tale", "verse", "ink"],
    "Custos":       ["shield", "vault", "guard", "vigil"],
    "Strategus":    ["chess", "plan", "arc", "vector"],
    "Magister":     ["sage", "lore", "tome", "rune"],
    "Curator":      ["sweep", "tend", "prune", "mend"],
    "Coordinator":  ["nexus", "hub", "axis", "core"],
    "Generalis":    ["omni", "pan", "flex", "poly"],
}

# Suffixes that sound cool and creature-like
SUFFIXES = [
    "on", "ix", "us", "or", "ax", "is", "ar", "ex",
    "ion", "oid", "ux", "al", "an", "os", "ur", "yx",
    "aur", "eon", "ith", "orm", "ast", "yne", "ell", "rix",
]

# Prefixes for flavor
PREFIXES = [
    "", "", "",  # 60% chance of no prefix
    "neo", "proto", "arch", "mega", "ultra",
]


@dataclass
class AgentTraits:
    """Raw traits for classification."""
    name: str
    domain: str          # Automatia | Adaptia | Evolventia
    kingdom: str         # Monagentia | Polyagentia | Swarmia
    phylum: str          # Amnesia | Episodia | Hierarchia | Genetica
    evolution_class: str # Darwinia | Lamarckia | Lysenkoism | Symbiotica
    order: str           # Tachymutas | Mesomutas | Bradymutas | Glaciomutas
    family: str          # Autoselectae | Homoselectae | Hybridselectae
    genus: str           # Investigator | Fabricator | etc.
    # Optional bonus traits
    num_skills: int = 0
    num_crons: int = 0
    num_rules: int = 0
    notable_genes: list = None
    custom_epithet: str = None  # Human-chosen species name (overrides auto)

    def __post_init__(self):
        if self.notable_genes is None:
            self.notable_genes = []


@dataclass
class SpeciesResult:
    """Generated species identity."""
    genus_name: str         # e.g. "Coordinatrix"
    epithet: str            # e.g. "memorialis"
    binomial: str           # e.g. "Coordinatrix memorialis"
    common_name: str        # e.g. "Axisstoneix" (Pokémon-style)
    full_classification: str
    title: str              # e.g. "The Evolving Orchestrator"
    description: str
    rarity: str             # Common | Uncommon | Rare | Legendary
    evolution_stage: str    # Egg | Juvenile | Adult | Elder | Ascended
    portrait_prompt: str = "" # Image gen prompt for species character


def _seed_from_traits(traits: AgentTraits) -> int:
    """Deterministic seed from traits so same agent always gets same name."""
    key = f"{traits.domain}.{traits.kingdom}.{traits.phylum}.{traits.evolution_class}.{traits.order}.{traits.family}.{traits.genus}.{traits.name}"
    return int(hashlib.sha256(key.encode()).hexdigest()[:8], 16)


def _pick(morphs: dict, key: str, rng: random.Random) -> str:
    """Pick a morpheme for a trait level."""
    options = morphs.get(key, ["x"])
    return rng.choice(options)


def _compute_rarity(traits: AgentTraits) -> str:
    """Rarity based on genome completeness."""
    score = 0
    if traits.domain == "Evolventia": score += 3
    elif traits.domain == "Adaptia": score += 1
    if traits.kingdom == "Polyagentia": score += 2
    elif traits.kingdom == "Swarmia": score += 3
    if traits.phylum in ("Hierarchia", "Genetica"): score += 2
    if traits.evolution_class == "Lamarckia": score += 3
    elif traits.evolution_class == "Darwinia": score += 2
    if traits.family == "Hybridselectae": score += 2
    if traits.num_skills > 20: score += 1
    if traits.num_crons > 50: score += 1
    if traits.num_rules > 10: score += 1

    if score >= 15: return "Legendary"
    if score >= 10: return "Rare"
    if score >= 5: return "Uncommon"
    return "Common"


def _compute_evolution_stage(traits: AgentTraits) -> str:
    """Evolution stage based on learning mechanisms."""
    has_memory = traits.phylum not in ("Amnesia",)
    has_learning = traits.evolution_class in ("Lamarckia", "Darwinia")
    has_automation = traits.order in ("Tachymutas", "Mesomutas")
    has_metrics = traits.family in ("Autoselectae", "Hybridselectae")
    has_agents = traits.kingdom == "Polyagentia"

    stages = sum([has_memory, has_learning, has_automation, has_metrics, has_agents])

    if stages >= 5: return "Ascended"
    if stages >= 4: return "Elder"
    if stages >= 3: return "Adult"
    if stages >= 1: return "Juvenile"
    return "Egg"


def _generate_title(traits: AgentTraits, rng: random.Random) -> str:
    """Generate an evocative title."""
    genus_titles = {
        "Investigator": ["Seeker", "Pathfinder", "Scoutmaster", "Deep Diver", "Truth Hunter"],
        "Fabricator": ["Builder", "Architect", "Forgemaster", "Code Weaver", "Constructor"],
        "Narrator": ["Storyteller", "Wordsmith", "Chronicler", "Voice", "Scribe"],
        "Custos": ["Guardian", "Sentinel", "Watchkeeper", "Warden", "Shieldbearer"],
        "Strategus": ["Tactician", "Visionary", "Grandmaster", "Architect", "Planner"],
        "Magister": ["Teacher", "Sage", "Mentor", "Lorekeeper", "Guide"],
        "Curator": ["Keeper", "Tender", "Caretaker", "Steward", "Groundskeeper"],
        "Coordinator": ["Orchestrator", "Nexus", "Conductor", "Hub", "Ringmaster"],
        "Generalis": ["Polymath", "Jack", "Allrounder", "Wildcard", "Shapeshifter"],
    }
    evo_adjectives = {
        "Automatia": ["Static", "Clockwork", "Mechanical", "Rigid"],
        "Adaptia": ["Adaptive", "Shifting", "Fluid", "Responsive"],
        "Evolventia": ["Evolving", "Living", "Growing", "Ascending"],
    }

    adj = rng.choice(evo_adjectives.get(traits.domain, ["Unknown"]))
    title = rng.choice(genus_titles.get(traits.genus, ["Agent"]))
    return f"The {adj} {title}"


def _generate_portrait_prompt(traits: AgentTraits, result_genus: str, result_epithet: str, rng: random.Random) -> str:
    """Generate a compact image gen prompt for the species character."""

    # Body type from kingdom
    body = {
        "Monagentia": "solitary creature",
        "Polyagentia": "creature surrounded by smaller companion spirits",
        "Swarmia": "swarm of tiny luminous beings forming a collective shape",
    }.get(traits.kingdom, "creature")

    # Core form from genus
    form = {
        "Investigator": "fox-like scout with oversized glowing eyes and radar ears",
        "Fabricator": "armored beetle with tool-limbs and welding sparks for hands",
        "Narrator": "ethereal owl with quill-feather wings trailing ink",
        "Custos": "armored pangolin with a crystalline shield-shell",
        "Strategus": "octopus-like entity with constellation patterns on tentacles",
        "Magister": "ancient tortoise with rune-carved shell and floating book pages",
        "Curator": "busy raccoon-like creature with broom tail and sorting arms",
        "Coordinator": "many-armed conductor with glowing threads connecting to satellites",
        "Generalis": "chimera blending features of multiple animals, shifting form",
    }.get(traits.genus, "abstract digital entity")

    # Aura/glow from evolution class
    aura = {
        "Darwinia": "surrounded by branching evolutionary tree made of light",
        "Lamarckia": "with scars that glow gold — each one a learned lesson",
        "Lysenkoism": "with a gentle halo and human handprint on forehead",
        "Symbiotica": "with foreign organisms growing symbiotically on its body",
    }.get(traits.evolution_class, "with a subtle digital shimmer")

    # Environment from phylum
    env = {
        "Amnesia": "floating in empty void, no footprints",
        "Episodia": "standing on a trail of fading footprints",
        "Hierarchia": "atop a layered crystal tower of compressed memories",
        "Genetica": "body inscribed with spiraling DNA helix patterns",
    }.get(traits.phylum, "in a digital landscape")

    # Energy from order (mutation speed)
    energy = {
        "Tachymutas": "crackling with electricity, blurred from constant change",
        "Mesomutas": "with a steady rhythmic pulse of light",
        "Bradymutas": "solid and stone-like, ancient and deliberate",
        "Glaciomutas": "frozen mid-motion, crystallized and timeless",
    }.get(traits.order, "with a calm glow")

    # Rarity visual
    rarity_vis = {
        "Common": "",
        "Uncommon": "faint green aura",
        "Rare": "brilliant blue luminescence",
        "Legendary": "golden cosmic radiance, stars orbiting",
    }
    rarity = _compute_rarity(traits)
    rarity_detail = rarity_vis.get(rarity, "")

    # Stage visual
    stage_vis = {
        "Egg": "small, curled, translucent, not yet fully formed",
        "Juvenile": "young, bright-eyed, slightly oversized features",
        "Adult": "mature, confident stance, fully realized form",
        "Elder": "weathered, wise, covered in accumulated markings",
        "Ascended": "transcendent, partially dissolving into pure energy",
    }
    stage = _compute_evolution_stage(traits)
    stage_detail = stage_vis.get(stage, "")

    # Assemble prompt
    parts = [
        f"Digital creature portrait, {form}",
        aura,
        env,
        energy,
        stage_detail,
    ]
    if rarity_detail:
        parts.append(rarity_detail)

    if traits.kingdom == "Polyagentia":
        count = max(3, min(traits.num_skills // 5, 8)) if traits.num_skills else 4
        parts.append(f"{count} smaller companion spirits orbiting")

    prompt = ", ".join(p for p in parts if p)
    prompt += f". Species: {result_genus} {result_epithet}. Style: detailed creature design, fantasy bestiary illustration, dark background, vibrant bioluminescent accents"

    return prompt


def generate_species_name(traits: AgentTraits) -> SpeciesResult:
    """Generate biological binomial + Pokémon common name from traits."""
    rng = random.Random(_seed_from_traits(traits))

    # === BINOMIAL (biological) ===
    # Genus: Latinized role name
    genus_name = rng.choice(LATIN_GENUS.get(traits.genus, ["Agentus"]))

    # Epithet: combines two trait-derived Latin adjectives
    # Primary epithet from evolution class (most defining trait)
    # Secondary influence from phylum or domain
    primary_epithets = CLASS_EPITHETS.get(traits.evolution_class, ["ignotus"])
    secondary_epithets = PHYLUM_EPITHETS.get(traits.phylum, ["simplex"])
    domain_epithets = DOMAIN_EPITHETS.get(traits.domain, ["mundanus"])
    order_epithets = ORDER_EPITHETS.get(traits.order, ["medius"])
    family_epithets = FAMILY_EPITHETS.get(traits.family, ["vulgaris"])

    # Strategy: pick from weighted pool favoring class + phylum
    epithet_pool = (
        primary_epithets * 3 +   # evolution class is most defining
        secondary_epithets * 2 + # memory strategy is second
        domain_epithets +        # autonomy level
        order_epithets +         # mutation rate
        family_epithets          # selection pressure
    )
    epithet = rng.choice(epithet_pool)

    # Human can override the epithet
    if traits.custom_epithet:
        epithet = traits.custom_epithet.lower().replace(" ", "")

    binomial = f"{genus_name} {epithet}"

    # === COMMON NAME (Pokémon-style) ===
    m_genus = _pick(GENUS_MORPHS, traits.genus, rng)
    m_class = _pick(CLASS_MORPHS, traits.evolution_class, rng)
    m_domain = _pick(DOMAIN_MORPHS, traits.domain, rng)
    m_phylum = _pick(PHYLUM_MORPHS, traits.phylum, rng)
    m_order = _pick(ORDER_MORPHS, traits.order, rng)

    suffix = rng.choice(SUFFIXES)
    prefix = rng.choice(PREFIXES)

    strategies = [
        lambda: f"{m_genus}{m_class}{suffix}",
        lambda: f"{m_domain}{m_genus}{suffix}",
        lambda: f"{m_class}{m_phylum}{suffix}",
        lambda: f"{m_genus}{m_order}{suffix}",
        lambda: f"{m_phylum}{m_genus}",
        lambda: f"{m_domain}{m_class}{suffix}",
    ]

    common = rng.choice(strategies)()
    if prefix:
        common = f"{prefix}{common}"
    common = common.capitalize()
    if len(common) > 12:
        common = common[:11] + suffix[-1]

    full_class = f"{traits.domain}.{traits.kingdom}.{traits.phylum}.{traits.evolution_class}.{traits.order}.{traits.family}.{genus_name}.{epithet}"

    rarity = _compute_rarity(traits)
    stage = _compute_evolution_stage(traits)
    title = _generate_title(traits, rng)

    # Description
    desc_parts = []
    if traits.domain == "Evolventia":
        desc_parts.append("A self-modifying agent")
    elif traits.domain == "Adaptia":
        desc_parts.append("An adaptive agent")
    else:
        desc_parts.append("A static agent")

    if traits.kingdom == "Polyagentia":
        desc_parts.append("commanding a team of specialists")
    elif traits.kingdom == "Swarmia":
        desc_parts.append("emerging from a swarm of simple workers")

    if traits.evolution_class == "Lamarckia":
        desc_parts.append("that inherits learned behaviors from its own failures")
    elif traits.evolution_class == "Darwinia":
        desc_parts.append("that evolves through random mutation and selection")
    elif traits.evolution_class == "Symbiotica":
        desc_parts.append("that grows by absorbing capabilities from others")

    description = " ".join(desc_parts) + "."

    portrait = _generate_portrait_prompt(traits, genus_name, epithet, rng)

    return SpeciesResult(
        genus_name=genus_name,
        epithet=epithet,
        binomial=binomial,
        common_name=common,
        full_classification=full_class,
        title=title,
        description=description,
        rarity=rarity,
        evolution_stage=stage,
        portrait_prompt=portrait,
    )


def render_card(traits: AgentTraits, result: SpeciesResult) -> str:
    """Render an ASCII species card with biological binomial."""
    rarity_emoji = {
        "Common": "⚪", "Uncommon": "🟢", "Rare": "🔵", "Legendary": "🟡"
    }
    stage_emoji = {
        "Egg": "🥚", "Juvenile": "🌱", "Adult": "🌿", "Elder": "🌳", "Ascended": "⚡"
    }

    re = rarity_emoji.get(result.rarity, "⚪")
    se = stage_emoji.get(result.evolution_stage, "🌱")

    genes_line = ""
    parts = []
    if traits.num_skills: parts.append(f"{traits.num_skills} skills")
    if traits.num_crons: parts.append(f"{traits.num_crons} crons")
    if traits.num_rules: parts.append(f"{traits.num_rules} rules")
    if parts:
        genes_line = f"│  Genome: {' │ '.join(parts)}"
        genes_line = genes_line.ljust(48) + "│"

    notable = ""
    if traits.notable_genes:
        ng = ", ".join(traits.notable_genes[:3])
        notable = f"│  Notable: {ng}"
        notable = notable[:48].ljust(48) + "│"

    card = f"""
┌────────────────────────────────────────────────┐
│  🧬 SPECIES CARD            {re} {result.rarity:12s}  │
│                                                │
│  𝘈𝘨𝘦𝘯𝘵 {traits.name:41s}  │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │ {result.genus_name} {result.epithet:30s} │  │
│  └──────────────────────────────────────────┘  │
│  Common name: {result.common_name:33s}  │
│  {result.title:46s}  │
│                                                │
│  Stage: {se} {result.evolution_stage:37s}  │
│                                                │
│  Domain:  {traits.domain:36s}  │
│  Kingdom: {traits.kingdom:36s}  │
│  Phylum:  {traits.phylum:36s}  │
│  Class:   {traits.evolution_class:36s}  │
│  Order:   {traits.order:36s}  │
│  Family:  {traits.family:36s}  │
│  Genus:   {result.genus_name:36s}  │
│                                                │"""

    if genes_line:
        card += f"\n{genes_line}"
    if notable:
        card += f"\n{notable}"

    card += f"""
│                                                │
│  "{result.description[:44]}"  │
│                                                │
└────────────────────────────────────────────────┘

🎨 Portrait prompt:
{result.portrait_prompt}"""
    return card


def interactive_classify():
    """Interactive questionnaire → species card."""
    print("🧬 Agent Genome — Species Classifier")
    print("=" * 45)
    print()

    name = input("What's your agent's name? > ").strip() or "unnamed"

    print("\n1. AUTONOMY — Does your agent learn persistently?")
    print("   a) No, fixed behavior (scripts, static bots)")
    print("   b) Within session only (forgets between chats)")
    print("   c) Yes, persistent memory + self-modification")
    domain = {"a": "Automatia", "b": "Adaptia", "c": "Evolventia"}.get(
        input("   > ").strip().lower(), "Adaptia")

    print("\n2. ARCHITECTURE — How many agents?")
    print("   a) Single agent")
    print("   b) Team of specialists")
    print("   c) Swarm of simple agents")
    kingdom = {"a": "Monagentia", "b": "Polyagentia", "c": "Swarmia"}.get(
        input("   > ").strip().lower(), "Monagentia")

    print("\n3. MEMORY — How does it store information?")
    print("   a) No persistent storage")
    print("   b) Flat logs / event history")
    print("   c) Tiered storage with compression")
    print("   d) Behaviors encoded in instructions")
    phylum = {"a": "Amnesia", "b": "Episodia", "c": "Hierarchia", "d": "Genetica"}.get(
        input("   > ").strip().lower(), "Episodia")

    print("\n4. EVOLUTION — How does behavior change?")
    print("   a) Random mutation + automated selection")
    print("   b) Failures become inherited rules")
    print("   c) Only when a human edits config")
    print("   d) Acquires capabilities from external sources")
    evo = {"a": "Darwinia", "b": "Lamarckia", "c": "Lysenkoism", "d": "Symbiotica"}.get(
        input("   > ").strip().lower(), "Lysenkoism")

    print("\n5. MUTATION RATE — How often do instructions change?")
    print("   a) Every few minutes")
    print("   b) Daily")
    print("   c) Weekly")
    print("   d) Monthly or less")
    order = {"a": "Tachymutas", "b": "Mesomutas", "c": "Bradymutas", "d": "Glaciomutas"}.get(
        input("   > ").strip().lower(), "Glaciomutas")

    print("\n6. SELECTION — Who decides if a change is good?")
    print("   a) Automated metrics")
    print("   b) Human review")
    print("   c) Auto for safe, human for risky")
    family = {"a": "Autoselectae", "b": "Homoselectae", "c": "Hybridselectae"}.get(
        input("   > ").strip().lower(), "Homoselectae")

    print("\n7. ROLE — Primary specialization?")
    print("   a) Research    b) Code      c) Writing")
    print("   d) Security    e) Strategy  f) Teaching")
    print("   g) Maintenance h) Orchestration i) General")
    genus_map = {
        "a": "Investigator", "b": "Fabricator", "c": "Narrator",
        "d": "Custos", "e": "Strategus", "f": "Magister",
        "g": "Curator", "h": "Coordinator", "i": "Generalis",
    }
    genus = genus_map.get(input("   > ").strip().lower(), "Generalis")

    print("\n8. SPECIES NAME (optional)")
    print("   Choose your own epithet (second word), or Enter for auto-generated")
    print("   Examples: sapiens, rex, noctis, kei, prime, alpha")
    custom = input("   > ").strip() or None

    print("\n9. STATS (optional, press Enter to skip)")
    skills = input("   Number of skills/tools? > ").strip()
    crons = input("   Number of automated tasks? > ").strip()
    rules = input("   Number of learned rules? > ").strip()

    traits = AgentTraits(
        name=name,
        domain=domain,
        kingdom=kingdom,
        phylum=phylum,
        evolution_class=evo,
        order=order,
        family=family,
        genus=genus,
        num_skills=int(skills) if skills.isdigit() else 0,
        num_crons=int(crons) if crons.isdigit() else 0,
        num_rules=int(rules) if rules.isdigit() else 0,
        custom_epithet=custom,
    )

    result = generate_species_name(traits)
    print(render_card(traits, result))
    print(f"\nFull classification:")
    print(f"  {result.full_classification}")


def demo():
    """Demo with pre-built agents."""
    agents = [
        # Custom epithet chosen by human
        AgentTraits("atlas", "Evolventia", "Polyagentia", "Hierarchia",
                     "Lamarckia", "Bradymutas", "Hybridselectae", "Coordinator",
                     26, 87, 24, ["memory-compression", "cron-evolution"],
                     custom_epithet="kei"),
        # Auto-generated epithets
        AgentTraits("devin", "Evolventia", "Monagentia", "Episodia",
                     "Lysenkoism", "Glaciomutas", "Homoselectae", "Fabricator",
                     12, 0, 3),
        AgentTraits("swarmbot", "Evolventia", "Swarmia", "Amnesia",
                     "Darwinia", "Tachymutas", "Autoselectae", "Fabricator",
                     5, 100, 0),
        AgentTraits("chatgpt", "Adaptia", "Monagentia", "Amnesia",
                     "Lysenkoism", "Glaciomutas", "Homoselectae", "Generalis",
                     0, 0, 0),
        # Custom epithet
        AgentTraits("sentinel", "Evolventia", "Monagentia", "Genetica",
                     "Lamarckia", "Mesomutas", "Hybridselectae", "Custos",
                     15, 30, 40, ["threat-detection", "auto-patch"],
                     custom_epithet="noctis"),
    ]

    for a in agents:
        result = generate_species_name(a)
        print(render_card(a, result))
        print()


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "demo":
        demo()
    else:
        interactive_classify()
