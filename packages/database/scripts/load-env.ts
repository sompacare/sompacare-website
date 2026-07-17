import { readFileSync } from "fs";
import { join } from "path";

const root = join(import.meta.dirname, "../../..");

export function loadProductionEnv() {
  for (const file of [
    join(root, ".env.platform.live"),
    join(root, ".env"),
    join(root, "packages/database/.env"),
  ]) {
    try {
      const content = readFileSync(file, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const idx = trimmed.indexOf("=");
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        let value = trimmed.slice(idx + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = value;
      }
    } catch {
      // optional file
    }
  }
}
