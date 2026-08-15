import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve("hostinger/server.mjs");
let source = await readFile(path, "utf8");

source = source.replace(
  'import { db, initSchema, withTransaction } from "./db.mjs";',
  'import { db, databaseEnvState, initSchema, probeDatabaseAccess, withTransaction } from "./db.mjs";',
).replace(
  'import { db, databaseEnvState, initSchema, withTransaction } from "./db.mjs";',
  'import { db, databaseEnvState, initSchema, probeDatabaseAccess, withTransaction } from "./db.mjs";',
);

const oldStartup = `await initSchema();\nconst server = app.listen(PORT, "0.0.0.0", () => {\n  console.log(\`ESSOR Hostinger listening on :\${PORT}\`);\n});`;

const newStartup = `const server = app.listen(PORT, "0.0.0.0", () => {\n  console.log(\`ESSOR Hostinger listening on :\${PORT}\`);\n});\n\nlet schemaReady = false;\nlet schemaError = null;\nasync function initializeSchemaWithRetry() {\n  try {\n    await initSchema();\n    schemaReady = true;\n    schemaError = null;\n    console.log("ESSOR MySQL schema ready");\n  } catch (error) {\n    schemaReady = false;\n    schemaError = error?.code || "schema_init_failed";\n    console.error("ESSOR MySQL init failed; retrying in 30s:", schemaError);\n    setTimeout(initializeSchemaWithRetry, 30_000).unref();\n  }\n}\nvoid initializeSchemaWithRetry();`;

if (source.includes(oldStartup)) {
  source = source.replace(oldStartup, newStartup);
} else if (!source.includes("initializeSchemaWithRetry")) {
  throw new Error("Hostinger startup block not found; refusing unsafe patch");
}

const oldHealth = `app.get("/api/health", async (_req, res) => {\n  apiHeaders(res);\n  try {\n    await db().query("SELECT 1 AS ok");\n    return res.json({ ok: true, service: "essor", database: "mysql" });\n  } catch (error) {\n    console.error("health", error);\n    return res.status(503).json({ ok: false, database: "unavailable" });\n  }\n});`;

const newHealth = `function mysqlDiagnostic(error) {\n  const code = error?.code || error?.message || "";\n  if (code === "mysql_not_configured") return "mysql_not_configured";\n  if (code === "ER_ACCESS_DENIED_ERROR") return "access_denied";\n  if (code === "ER_DBACCESS_DENIED_ERROR") return "database_access_denied";\n  if (code === "ER_TABLEACCESS_DENIED_ERROR") return "table_access_denied";\n  if (code === "ER_BAD_DB_ERROR") return "bad_database";\n  if (code === "ER_HOST_NOT_PRIVILEGED") return "host_not_allowed";\n  if (code === "ECONNREFUSED") return "connection_refused";\n  if (code === "ENOTFOUND") return "host_not_found";\n  if (code === "ETIMEDOUT") return "connection_timeout";\n  return "database_unavailable";\n}\n\nfunction integrationState() {\n  return {\n    stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),\n    stripePortal: Boolean(process.env.STRIPE_PORTAL_URL?.startsWith("https://billing.stripe.com/")),\n    googlePlay: Boolean(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON),\n  };\n}\n\napp.get("/api/health", async (_req, res) => {\n  apiHeaders(res);\n  const env = databaseEnvState();\n  const integrations = integrationState();\n  try {\n    await db().query("SELECT 1 AS ok");\n\n    if (!schemaReady) {\n      try {\n        await initSchema();\n        schemaReady = true;\n        schemaError = null;\n      } catch (error) {\n        schemaReady = false;\n        schemaError = error?.code || "schema_init_failed";\n        console.error("health schema init", schemaError);\n      }\n    }\n\n    return res.json({\n      ok: true,\n      service: "essor",\n      database: "mysql",\n      schemaReady,\n      schemaError,\n      env,\n      integrations,\n      stage: schemaReady ? "ready" : "schema_init",\n    });\n  } catch (error) {\n    const probe = await probeDatabaseAccess();\n    const reason = mysqlDiagnostic({ code: probe.code || error?.code || error?.message });\n    console.error("health", error?.code || error?.message || error, "probe", probe.stage, probe.code || probe.ok);\n    return res.status(503).json({\n      ok: false,\n      service: "essor",\n      database: "unavailable",\n      reason,\n      stage: probe.stage,\n      env,\n      integrations,\n    });\n  }\n});`;

if (source.includes(oldHealth)) {
  source = source.replace(oldHealth, newHealth);
} else if (!source.includes('stage: probe.stage')) {
  throw new Error("Hostinger health block not found; refusing unsafe patch");
}

await writeFile(path, source);
console.log("Hostinger runtime patched: HTTP-before-MySQL + staged MySQL diagnostics + schema self-heal + integration state");
