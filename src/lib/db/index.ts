import { Kysely, SqliteDialect } from "kysely";
import Database from "better-sqlite3";
import { env } from "$env/dynamic/private";
import { building } from "$app/environment";
import type { Database as DatabaseTypes } from "./types";

let _db: Kysely<DatabaseTypes> | undefined;

if (!building) {
  const sqlite = new Database(env.DATABASE_URL);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  _db = new Kysely<DatabaseTypes>({
    dialect: new SqliteDialect({
      database: sqlite,
    }),
  });
}

export const db = _db as Kysely<DatabaseTypes>;

export function runMigration(): void {
  const sqlite = new Database(env.DATABASE_URL);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'admin')),
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `;

  sqlite.exec(sql);
  sqlite.close();
}
