import { rmSync } from "node:fs";
import path from "node:path";

const targets = [
  path.join(process.cwd(), ".next"),
  path.join(process.cwd(), "node_modules", ".cache", "next"),
  path.join(process.env.LOCALAPPDATA || "", "sompacare-webpack-cache"),
  path.join(process.env.LOCALAPPDATA || "", "sompacare-next"),
].filter(Boolean);

for (const target of targets) {
  if (!target || target.endsWith(path.sep)) continue;
  try {
    rmSync(target, { recursive: true, force: true });
    console.log(`Removed: ${target}`);
  } catch {
    // Ignore missing paths
  }
}

console.log("Next.js cache cleared.");
