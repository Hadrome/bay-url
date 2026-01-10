DROP TABLE IF EXISTS links;
CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at INTEGER DEFAULT (unixepoch()),
  expires_at INTEGER
);

DROP TABLE IF EXISTS visits;
CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id INTEGER NOT NULL,
  ip TEXT,
  user_agent TEXT,
  referer TEXT,
  visit_time INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_slug ON links(slug);
CREATE INDEX IF NOT EXISTS idx_link_id ON visits(link_id);
