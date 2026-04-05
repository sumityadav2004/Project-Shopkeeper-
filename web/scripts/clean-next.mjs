import { rmSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function removeDir(rel) {
  const dir = join(root, rel);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
    console.log(`Removed ${rel}`);
  }
}

// Stale .next chunks cause "Cannot find module './NNN.js'" at runtime.
removeDir(".next");
removeDir("node_modules/.cache");
