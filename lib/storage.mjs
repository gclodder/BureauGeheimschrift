import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {resolve, dirname} from 'node:path';

const file = resolve(process.env.DATABASE_PATH || './data/sessions.sqlite');
mkdirSync(dirname(file), {recursive:true});
export const db = new DatabaseSync(file);
db.exec(`PRAGMA journal_mode=WAL;
PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS sessions (
  code TEXT PRIMARY KEY NOT NULL,
  data TEXT NOT NULL,
  version INTEGER DEFAULT 0 NOT NULL
);`);
