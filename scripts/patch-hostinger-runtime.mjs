import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve("hostinger/server.mjs");
let source = await readFile(path, "utf8");

source = source.replace(
  'import { db, initSchema, withTransaction } from "./db.mjs";',
  'import { db, databaseEnvState, initSchema, withTransaction } from "./db.mjs";',
);

const oldStartup = `await initSchema();\nconst server = app.listen(PORT, "0.0.0.0", () => {\n  console.log(\`ESSOR Hostinger listening on :\${PORT}\`);\n});`;

const newStartup = `const server = app.listen(PORT, "0.0.0.0", () => {\n  console.log(\`ESSOR Hostinger listening on :\${PORT}\`);\n});\n\nlet schemaReady = false;\nasync function initializeSchemaWithRetry() {\n  try {\n    await initSchema();\n    schemaReady = true;\n    console.log("ESSOR MySQL schema ready");\n  } catch (error) {\n    schemaReady = false;\n    console.error("ESSOR MySQL init failed; retrying in 30s:", error?.code || error?.message || error);\n    setTimeout(initializeSchemaWithRetry, 30_000).unref();\n  }\n}\nvoid initializeSchemaWithRetry();`;

if (source.includes(oldStartup)) {
  source = source.replace(oldStartup, newStartup);
} else if (!source.includes("initializeSchemaWithRetry")) {
  throw new Error("Hostinger startup block not found; refusing unsafe patch");
}

const oldHealth = `app.get("/api/health", async (_req, res) => {\n  apiHeaders(res);\n  try {\n    await db().query("SELECT 1 AS ok");\n    return res.json({ ok: true, service: "essor", database: "mysql" });\n  } catch (error) {\n    console.error("health", error);\n    return res.status(503).json({ ok: false, database: "unavailable" });\n  }\n});`;

const newHealth = `function mysqlDiagnostic(error) {\n  const code = error?.code || error?.message || "";\n  if (code === "mysql_not_configured") return "mysql_not_configured";\n  if (code === "ER_ACCESS_DENIED_ERROR") return "access_denied";\n  if (code === "ER_BAD_DB_ERROR") return "bad_database";\n  if (code === "ER_HOST_NOT_PRIVILEGED") return "host_not_allowed";\n  if (code === "ECONNREFUSED") return "connection_refused";\n  if (code === "ENOTFOUND") return "host_not_found";\n  if (code === "ETIMEDOUT") return "connection_timeout";\n  return "database_unavailable";\n}\n\napp.get("/api/health", async (_req, res) => {\n  apiHeaders(res);\n  const env = databaseEnvState();\n  try {\n    await db().query("SELECT 1 AS ok");\n    return res.json({ ok: true, service: "essor", database: "mysql", schemaReady, env });\n  } catch (error) {\n    const reason = mysqlDiagnostic(error);\n    console.error("health", error?.code || error?.message || error);\n    return res.status(503).json({ ok: false, service: "essor", database: "unavailable", reason, env });\n  }\n});`;

if (source.includes(oldHealth)) {
  source = source.replace(oldHealth, newHealth);
} else if (source.includes("mysqlDiagnostic")) {
  source = source.replace(
    'return res.json({ ok: true, service: "essor", database: "mysql", schemaReady });',
    'return res.json({ ok: true, service: "essor", database: "mysql", schemaReady, env: databaseEnvState() });',
  ).replace(
    'return res.status(503).json({ ok: false, service: "essor", database: "unavailable", reason });',
    'return res.status(503).json({ ok: false, service: "essor", database: "unavailable", reason, env: databaseEnvState() });',
  );
} else {
  throw new Error("Hostinger health block not found; refusing unsafe patch");
}

await writeFile(path, source);
console.log("Hostinger runtime patched: HTTP-before-MySQL + safe MySQL env diagnostics");
