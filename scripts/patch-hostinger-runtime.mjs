import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve("hostinger/server.mjs");
let source = await readFile(path, "utf8");

const oldBlock = `await initSchema();\nconst server = app.listen(PORT, "0.0.0.0", () => {\n  console.log(\`ESSOR Hostinger listening on :\${PORT}\`);\n});`;

const newBlock = `const server = app.listen(PORT, "0.0.0.0", () => {\n  console.log(\`ESSOR Hostinger listening on :\${PORT}\`);\n});\n\nlet schemaReady = false;\nasync function initializeSchemaWithRetry() {\n  try {\n    await initSchema();\n    schemaReady = true;\n    console.log("ESSOR MySQL schema ready");\n  } catch (error) {\n    schemaReady = false;\n    console.error("ESSOR MySQL init failed; retrying in 30s:", error?.message || error);\n    setTimeout(initializeSchemaWithRetry, 30_000).unref();\n  }\n}\nvoid initializeSchemaWithRetry();`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
  await writeFile(path, source);
  console.log("Hostinger runtime patched: HTTP starts before MySQL initialization");
} else if (source.includes("initializeSchemaWithRetry")) {
  console.log("Hostinger runtime already patched");
} else {
  throw new Error("Hostinger startup block not found; refusing unsafe patch");
}
