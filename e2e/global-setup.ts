import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, "../server");

export default function globalSetup() {
  execSync("npm run test:db:setup", { cwd: serverDir, stdio: "inherit" });
  execSync("npm run test:db:seed", { cwd: serverDir, stdio: "inherit" });
}
