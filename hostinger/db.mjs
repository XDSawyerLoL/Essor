import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

// Identité MySQL confirmée dans hPanel pour cette application ESSOR.
// Le mot de passe reste exclusivement dans les variables d'environnement Hostinger.
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

function firstEnv(...names) {
  for (const name of names) {
    const value = normalizeEnvValue(process.env[name]);
    if (value) return value;
  }
  return undefined;
}

export function databaseEnvState() {
  return {
    url: Boolean(firstEnv("DATABASE_URL", "MYSQL_URL")),
    host: true,
    port: true,
    user: true,
    password: Boolean(firstEnv("DB_PASSWORD", "MYSQL_PASSWORD", "MYSQLPASS", "MYSQL_PASSWORD_RAW")),
    name: true,
    identityPinned: true,
  };
}

function poolConfig() {
  const uri = firstEnv("DATABASE_URL", "MYSQL_URL");
  if (uri) {
    return {
      uri,
      waitForConnections: true,
      connectionLimit: Number(firstEnv("DB_POOL_SIZE", "MYSQL_POOL_SIZE") || 10),
      queueLimit: 0,
      timezone: "Z",
      charset: "utf8mb4",
    };
  }

  return {
    host: HOSTINGER_DB_HOST,
    port: HOSTINGER_DB_PORT,
    user: HOSTINGER_DB_USER,
    password: firstEnv("DB_PASSWORD", "MYSQL_PASSWORD", "MYSQLPASS", "MYSQL_PASSWORD_RAW"),
    database: HOSTINGER_DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(firstEnv("DB_POOL_SIZE", "MYSQL_POOL_SIZE") || 10),
    queueLimit: 0,
    timezone: "Z",
    charset: "utf8mb4",
  };
}

let pool;

export function db() {
  if (!pool) {
    const cfg = poolConfig();
    if (!cfg.uri && !cfg.password) {
      throw new Error("mysql_not_configured");
    }
    pool = cfg.uri ? mysql.createPool(cfg.uri) : mysql.createPool(cfg);
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
