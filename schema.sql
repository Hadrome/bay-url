-- BayUrl Database Schema
-- 用于 Cloudflare D1 数据库

-- 短链接表
CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  note TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  expires_at INTEGER,
  max_visits INTEGER,
  visits INTEGER DEFAULT 0
);

-- 访问记录表
CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id INTEGER NOT NULL,
  ip TEXT,
  user_agent TEXT,
  referer TEXT,
  visit_time INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_slug ON links(slug);
CREATE INDEX IF NOT EXISTS idx_link_id ON visits(link_id);

-- 系统设置表
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- 默认设置
INSERT OR IGNORE INTO settings (key, value) VALUES ('daily_limit', '100');
