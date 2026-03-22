import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { write_stylesheet } from "./styles.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const project_root = path.resolve(__dirname, "..");
const dist_root = path.join(project_root, "dist");
const three_root = path.join(project_root, "node_modules", "three");

function copy_directory(source_path, destination_path) {
  fs.mkdirSync(destination_path, { recursive: true });
  const entries = fs.readdirSync(source_path, { withFileTypes: true });

  for (const entry of entries) {
    const source_entry_path = path.join(source_path, entry.name);
    const destination_entry_path = path.join(destination_path, entry.name);

    if (entry.isDirectory()) {
      copy_directory(source_entry_path, destination_entry_path);
      continue;
    }

    fs.copyFileSync(source_entry_path, destination_entry_path);
  }
}

fs.rmSync(dist_root, { recursive: true, force: true });
fs.mkdirSync(dist_root, { recursive: true });
fs.copyFileSync(path.join(project_root, "src", "index.html"), path.join(dist_root, "index.html"));
copy_directory(path.join(project_root, "assets"), path.join(dist_root, "assets"));
copy_directory(path.join(three_root, "build"), path.join(dist_root, "three", "build"));
await write_stylesheet(path.join(dist_root, "assets", "app.css"), { style: "compressed" });
fs.writeFileSync(path.join(dist_root, ".nojekyll"), "");
console.log("built dist/");
