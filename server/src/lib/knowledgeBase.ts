import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const knowledgeBasePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../knowledge-base.md",
);

export const knowledgeBase = readFileSync(knowledgeBasePath, "utf-8");
