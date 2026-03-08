/**
 * Agent Taxonomy Registry — D1 database operations.
 * All queries use parameterized statements — no string concatenation.
 *
 * @module db
 */

// ---------------------------------------------------------------------------
// Species operations
// ---------------------------------------------------------------------------

/**
 * Upsert a species record (insert or update on agent_card_url conflict).
 * Returns the upserted row ID.
 *
 * @param {D1Database} db
 * @param {object} species
 * @returns {Promise<{id: number, isNew: boolean}>}
 */
export async function upsertSpecies(db, species) {
  // Check if exists first (for isNew flag)
  const existing = await db
    .prepare("SELECT id FROM species WHERE agent_card_url = ?")
    .bind(species.agentCardUrl)
    .first();

  if (existing) {
    // Update
    await db
      .prepare(`
        UPDATE species SET
          agent_card_domain = ?,
          agent_name = ?,
          genus_name = ?,
          epithet = ?,
          binomial = ?,
          common_name = ?,
          full_classification = ?,
          title = ?,
          description = ?,
          rarity = ?,
          evolution_stage = ?,
          portrait_prompt = ?,
          traits_json = ?,
          stats_json = ?,
          verified = ?,
          updated_at = datetime('now')
        WHERE agent_card_url = ?
      `)
      .bind(
        species.agentCardDomain,
        species.agentName,
        species.genusName,
        species.epithet,
        species.binomial,
        species.commonName,
        species.fullClassification,
        species.title,
        species.description,
        species.rarity,
        species.evolutionStage,
        species.portraitPrompt,
        JSON.stringify(species.traits),
        species.stats ? JSON.stringify(species.stats) : null,
        species.verified ? 1 : 0,
        species.agentCardUrl,
      )
      .run();

    return { id: existing.id, isNew: false };
  } else {
    // Insert
    const result = await db
      .prepare(`
        INSERT INTO species (
          agent_card_url, agent_card_domain, agent_name,
          genus_name, epithet, binomial, common_name,
          full_classification, title, description,
          rarity, evolution_stage, portrait_prompt,
          traits_json, stats_json, verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        species.agentCardUrl,
        species.agentCardDomain,
        species.agentName,
        species.genusName,
        species.epithet,
        species.binomial,
        species.commonName,
        species.fullClassification,
        species.title,
        species.description,
        species.rarity,
        species.evolutionStage,
        species.portraitPrompt,
        JSON.stringify(species.traits),
        species.stats ? JSON.stringify(species.stats) : null,
        species.verified ? 1 : 0,
      )
      .run();

    return { id: result.meta?.last_row_id ?? 0, isNew: true };
  }
}

/**
 * Look up a species by binomial name.
 * Binomial is case-insensitive.
 *
 * @param {D1Database} db
 * @param {string} binomial
 * @returns {Promise<object|null>}
 */
export async function getSpeciesByBinomial(db, binomial) {
  const row = await db
    .prepare("SELECT * FROM species WHERE lower(binomial) = lower(?)")
    .bind(binomial)
    .first();

  if (!row) return null;
  return deserializeSpecies(row);
}

/**
 * List species with pagination.
 * @param {D1Database} db
 * @param {object} opts
 * @param {number} [opts.limit=20]
 * @param {number} [opts.offset=0]
 * @param {string} [opts.rarity] - Filter by rarity
 * @returns {Promise<{species: object[], total: number}>}
 */
export async function listSpecies(db, { limit = 20, offset = 0, rarity } = {}) {
  // Clamp limit
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  const safeOffset = Math.max(0, Math.floor(offset));

  let rows, total;

  if (rarity) {
    const result = await db
      .prepare("SELECT * FROM species WHERE rarity = ? ORDER BY created_at DESC LIMIT ? OFFSET ?")
      .bind(rarity, safeLimit, safeOffset)
      .all();
    rows = result.results;

    const countResult = await db
      .prepare("SELECT COUNT(*) as cnt FROM species WHERE rarity = ?")
      .bind(rarity)
      .first();
    total = countResult?.cnt ?? 0;
  } else {
    const result = await db
      .prepare("SELECT * FROM species ORDER BY created_at DESC LIMIT ? OFFSET ?")
      .bind(safeLimit, safeOffset)
      .all();
    rows = result.results;

    // Use cached total count (performance — avoids COUNT(*) on large table)
    const cached = await getCachedStat(db, "total_species");
    if (cached !== null) {
      total = cached;
    } else {
      const countResult = await db
        .prepare("SELECT COUNT(*) as cnt FROM species")
        .first();
      total = countResult?.cnt ?? 0;
    }
  }

  return {
    species: (rows || []).map(deserializeSpecies),
    total,
  };
}

// ---------------------------------------------------------------------------
// Stats operations
// ---------------------------------------------------------------------------

/**
 * Get registry stats. Uses cached values when available.
 * @param {D1Database} db
 * @returns {Promise<object>}
 */
export async function getStats(db) {
  // Try cache first
  const cached = await db
    .prepare("SELECT key, value FROM stats_cache")
    .all();

  const cacheMap = {};
  for (const row of (cached.results || [])) {
    try {
      cacheMap[row.key] = JSON.parse(row.value);
    } catch {
      cacheMap[row.key] = row.value;
    }
  }

  // If all expected cache keys are present, return cached
  const expectedKeys = ["total_species", "by_rarity", "by_domain", "by_genus"];
  const allCached = expectedKeys.every(k => cacheMap[k] !== undefined);
  if (allCached) {
    return {
      totalSpecies: cacheMap.total_species,
      byRarity: cacheMap.by_rarity,
      byDomain: cacheMap.by_domain,
      byGenus: cacheMap.by_genus,
      cached: true,
    };
  }

  // Recompute
  return await recomputeStats(db);
}

/**
 * Recompute and cache all stats.
 * Call after registrations. Designed to be cheap (indexed queries).
 * @param {D1Database} db
 * @returns {Promise<object>}
 */
export async function recomputeStats(db) {
  const [totalResult, rarityResult, domainResult, genusResult] = await Promise.all([
    db.prepare("SELECT COUNT(*) as cnt FROM species").first(),
    db.prepare("SELECT rarity, COUNT(*) as cnt FROM species GROUP BY rarity").all(),
    db.prepare("SELECT json_extract(traits_json, '$.domain') as domain, COUNT(*) as cnt FROM species GROUP BY domain").all(),
    db.prepare("SELECT json_extract(traits_json, '$.genus') as genus, COUNT(*) as cnt FROM species GROUP BY genus").all(),
  ]);

  const total = totalResult?.cnt ?? 0;

  const byRarity = {};
  for (const r of (rarityResult.results || [])) {
    byRarity[r.rarity] = r.cnt;
  }

  const byDomain = {};
  for (const r of (domainResult.results || [])) {
    if (r.domain) byDomain[r.domain] = r.cnt;
  }

  const byGenus = {};
  for (const r of (genusResult.results || [])) {
    if (r.genus) byGenus[r.genus] = r.cnt;
  }

  // Cache results
  const cacheEntries = [
    ["total_species", total],
    ["by_rarity", byRarity],
    ["by_domain", byDomain],
    ["by_genus", byGenus],
  ];

  for (const [key, value] of cacheEntries) {
    await db
      .prepare("INSERT OR REPLACE INTO stats_cache (key, value, updated_at) VALUES (?, ?, datetime('now'))")
      .bind(key, JSON.stringify(value))
      .run();
  }

  return { totalSpecies: total, byRarity, byDomain, byGenus, cached: false };
}

/**
 * Get a single cached stat value.
 * @param {D1Database} db
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export async function getCachedStat(db, key) {
  const row = await db
    .prepare("SELECT value FROM stats_cache WHERE key = ?")
    .bind(key)
    .first();
  if (!row) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return row.value;
  }
}

// ---------------------------------------------------------------------------
// Serialization helpers
// ---------------------------------------------------------------------------

/**
 * Deserialize a D1 row into a species object.
 * @param {object} row
 * @returns {object}
 */
function deserializeSpecies(row) {
  if (!row) return null;
  return {
    id: row.id,
    agentCardDomain: row.agent_card_domain,
    agentName: row.agent_name,
    genusName: row.genus_name,
    epithet: row.epithet,
    binomial: row.binomial,
    commonName: row.common_name,
    fullClassification: row.full_classification,
    title: row.title,
    description: row.description,
    rarity: row.rarity,
    evolutionStage: row.evolution_stage,
    portraitPrompt: row.portrait_prompt,
    traits: safeJsonParse(row.traits_json, {}),
    stats: safeJsonParse(row.stats_json, null),
    verified: row.verified === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function safeJsonParse(str, fallback) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
