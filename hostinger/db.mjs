import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

// Identité MySQL confirmée dans hPanel pour cette application ESSOR.
// Le mot de passe reste exclusivement dans DB_PASSWORD côté Hostinger.
const HOSTINGER_DB_HOST = "localhost";
const HOSTINGER_DB_PORT = 3306;
const HOSTINGER_DB_USER = "u316484636_essor";
const HOSTINGER_DB_NAME = "u316484636_essor";

function normalizeEnvValue(value) {
  if (typeof value !== "string") return undefined;
  let normalized = value.trim();
  if (!normalized) return undefined;
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }
  return normalized || undefined;
}

function dbPassword() {
  return normalizeEnvValue(process.env.DB_PASSWORD);
}

export function databaseEnvState() {
  return {
    url: false,
    host: true,
    port: true,
    user: true,
    password: Boolean(dbPassword()),
    name: true,
    identityPinned: true,
    passwordSource: "DB_PASSWORD",
  };
}

function poolConfig() {
  return {
    host: HOSTINGER_DB_HOST,
    port: HOSTINGER_DB_PORT,
    user: HOSTINGER_DB_USER,
    password: dbPassword(),
    database: HOSTINGER_DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(normalizeEnvValue(process.env.DB_POOL_SIZE) || 10),
    queueLimit: 0,
    timezone: "Z",
    charset: "utf8mb4",
  };
}

let pool;

export function db() {
  if (!pool) {
    const cfg = poolConfig();
    if (!cfg.password) throw new Error("mysql_not_configured");
    pool = mysql.createPool(cfg);
  }
  return pool;
}

export async function initSchema() {
  const sql = await readFile(join(here, "schema.sql"), "utf8");
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  const connection = await db().getConnection();
  try {
    for (const statement of statements) await connection.query(statement);
  } finally {
    connection.release();
  }
}

export async function withTransaction(fn) {
  const connection = await db().getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
