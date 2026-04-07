#!/usr/bin/env node

import "dotenv/config";
import Database from "better-sqlite3";
import { password as passwordInput } from "@inquirer/prompts";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { dirname } from "path";
import { mkdirSync } from "fs";

const DB_PATH = process.env.DATABASE_URL;

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function ok(msg) {
  console.log(`${c.green}✓ ${msg}${c.reset}`);
}

function fail(msg) {
  console.error(`${c.red}✗ ${msg}${c.reset}`);
  process.exit(1);
}

function getDb() {
  const dir = dirname(DB_PATH);
  if (dir && dir !== ".") {
    mkdirSync(dir, { recursive: true });
  }
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

async function seedAdmin(db) {
  const password = await passwordInput({ message: "Admin password: " });
  if (!password || password.length < 8) {
    fail("Password must be at least 8 characters");
  }

  const passwordHash = await hash(password, 10);
  const id = randomUUID();
  const createdAt = Date.now();

  db.prepare("DELETE FROM users WHERE username = 'admin'").run();
  db.prepare("INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)").run(
    id,
    "admin",
    passwordHash,
    createdAt,
  );
  ok(`Admin user created (id: ${c.dim}${id}${c.reset})`);
}

async function main() {
  console.log(`\n${c.bold}chat-omfj admin setup${c.reset}`);

  const db = getDb();

  try {
    await seedAdmin(db);
  } finally {
    db.close();
  }

  console.log(`\n${c.bold}${c.green}Done.${c.reset}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
