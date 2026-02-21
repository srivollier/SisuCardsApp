// Copy root favico/ into public/favico/ so Vite includes icons in dist/
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, "..", "favico");
const destDir = path.join(__dirname, "..", "public", "favico");

if (!fs.existsSync(srcDir)) {
  console.warn("copy-favico: favico/ not found, skipping");
  process.exit(0);
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

for (const name of fs.readdirSync(srcDir)) {
  const src = path.join(srcDir, name);
  if (fs.statSync(src).isFile()) {
    fs.copyFileSync(src, path.join(destDir, name));
  }
}
console.log("copy-favico: copied favico to public/favico");
