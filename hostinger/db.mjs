import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

function poolConfig() {
  if (process.env.DATABASE_URL) {
    return {
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
      queueLimit: 0,
      timezone: "Z",
      charset: "utf8mb4",
    };
  }

  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
    queueLimit: 0,
    timezone: "Z",
    charset: "utf8mb4",
  };
}

let pool;

export function db() {
  if (!pool) {
    const cfg = poolConfig();
    if (!process.env.DATABASE_URL && (!cfg.user || !cfg.database)) {
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
