import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {resolve, dirname} from 'node:path';

const file = resolve(process.env.DATABASE_PATH || './data/sessions.sqlite');
mkdirSync(dirname(file), {recursive:true});
export const db = new DatabaseSync(file);
db.exec(`PRAGMA journal_mode=WAL;
PRAGMA busy_timeout=5000;
PRAGMA secure_delete=ON;
CREATE TABLE IF NOT EXISTS sessions (
  code TEXT PRIMARY KEY NOT NULL,
  data TEXT NOT NULL,
  version INTEGER DEFAULT 0 NOT NULL,
  last_activity INTEGER NOT NULL DEFAULT 0
);`);

export const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
if (!db.prepare('PRAGMA table_info(sessions)').all().some(column => column.name === 'last_activity')) {
  db.exec('ALTER TABLE sessions ADD COLUMN last_activity INTEGER NOT NULL DEFAULT 0');
}
// Give existing dossiers the full retention window after upgrading.
db.prepare('UPDATE sessions SET last_activity=? WHERE last_activity=0').run(Date.now());
db.exec('CREATE INDEX IF NOT EXISTS sessions_last_activity ON sessions(last_activity)');
export function purgeExpired(now=Date.now()) {
  db.prepare('DELETE FROM sessions WHERE last_activity<=?').run(now-RETENTION_MS);
}
purgeExpired();
setInterval(purgeExpired, 60_000).unref();
