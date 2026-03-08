-- Agent Genome Species Registry — D1 Schema

CREATE TABLE IF NOT EXISTS species (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_card_url TEXT UNIQUE NOT NULL,
  agent_card_domain TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  genus_name TEXT NOT NULL,
  epithet TEXT NOT NULL,
  binomial TEXT NOT NULL,
  common_name TEXT NOT NULL,
  full_classification TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rarity TEXT NOT NULL,
  evolution_stage TEXT NOT NULL,
  portrait_prompt TEXT NOT NULL,
  traits_json TEXT NOT NULL,
  stats_json TEXT,
  verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_binomial ON species(binomial);
CREATE INDEX IF NOT EXISTS idx_domain ON species(agent_card_domain);
CREATE INDEX IF NOT EXISTS idx_rarity ON species(rarity);
CREATE INDEX IF NOT EXISTS idx_created_at ON species(created_at DESC);

CREATE TABLE IF NOT EXISTS stats_cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);
