import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve("hostinger/server.mjs");
let source = await readFile(path, "utf8");

function replaceRequired(needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`[ESSOR Community Policy] Bloc introuvable: ${label}`);
  source = source.replace(needle, replacement);
}

replaceRequired(
  `    id: post.id,\n    alias: post.alias,`,
  `    id: post.id,\n    alias: post.alias,\n    authorKey: sha256Hex("public:" + post.author_hash).slice(0, 32),`,
  "authorKey Signes",
);

replaceRequired(
  `return res.status(201).json({ post: { id, alias, messageKey: body.messageKey, days, createdAt: now, supportCount: 0, supported: false, mine: true } });`,
  `return res.status(201).json({ post: { id, alias, authorKey: sha256Hex("public:" + memberHash).slice(0, 32), messageKey: body.messageKey, days, createdAt: now, supportCount: 0, supported: false, mine: true } });`,
  "authorKey publication Signe",
);

replaceRequired(
  `    id: story.id,\n    alias: story.alias,\n    stage: story.stage_key,`,
  `    id: story.id,\n    alias: story.alias,\n    authorKey: sha256Hex("public:" + story.author_hash).slice(0, 32),\n    stage: story.stage_key,`,
  "authorKey Histoires",
);

replaceRequired(
  `        id, alias, stage, context, hardMoment, helped, message, days, createdAt: now,`,
  `        id, alias, authorKey: sha256Hex("public:" + memberHash).slice(0, 32), stage, context, hardMoment, helped, message, days, createdAt: now,`,
  "authorKey publication Histoire",
);

await writeFile(path, source);
console.log("Community policy runtime patched: stable public author keys for local blocking");
