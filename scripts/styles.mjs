import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const project_root = path.resolve(__dirname, "..");
const style_entry_path = path.join(project_root, "src", "styles", "app.scss");
const node_modules_path = path.join(project_root, "node_modules");

async function compile_styles(options = {}) {
  const style = options.style || "expanded";
  const result = await sass.compileAsync(style_entry_path, {
    loadPaths: [node_modules_path],
    silenceDeprecations: ["import", "global-builtin", "if-function"],
    style
  });

  return result.css;
}

export async function compile_styles_to_string(options = {}) {
  return compile_styles(options);
}

export async function write_stylesheet(destination_path, options = {}) {
  const css = await compile_styles(options);
  fs.mkdirSync(path.dirname(destination_path), { recursive: true });
  fs.writeFileSync(destination_path, css);
}
