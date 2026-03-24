import { exec, spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compile_styles_to_string } from "./styles.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const project_root = path.resolve(__dirname, "..");
const source_root = path.join(project_root, "src");
const source_entry = path.join(source_root, "index.html");
const three_root = path.join(project_root, "node_modules", "three");
const source_default_config_path = path.join(project_root, "assets", "app", "default-config-source.js");
const watch_roots = [
  source_root,
  path.join(project_root, "assets"),
  path.join(project_root, "2.0")
];
const port_arg = process.argv.find((argument) => argument.startsWith("--port="));
const host_arg = process.argv.find((argument) => argument.startsWith("--host="));
const requested_port = Number(port_arg?.split("=")[1] || process.env.PORT || 5173);
const host = host_arg?.split("=")[1] || process.env.HOST || "127.0.0.1";
const should_open = !process.argv.includes("--no-open");
const should_watch = !process.argv.includes("--no-watch");
const live_clients = new Set();
const max_port_attempts = 20;

const mime_types = {
  ".ai": "application/postscript",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".vex": "text/plain; charset=utf-8"
};

function log(message) {
  console.log(`[dev-server] ${message}`);
}

function get_mime_type(file_path) {
  return mime_types[path.extname(file_path).toLowerCase()] || "application/octet-stream";
}

function inject_live_reload(html) {
  const live_reload_script = `
<script>
  (() => {
    const event_source = new EventSource("/__live");
    event_source.addEventListener("reload", () => window.location.reload());
    window.addEventListener("beforeunload", () => event_source.close());
  })();
</script>`;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${live_reload_script}\n</body>`);
  }

  return `${html}\n${live_reload_script}`;
}

function resolve_public_path(request_path) {
  const encoded_path = request_path.split("?")[0];
  let clean_path = encoded_path;

  try {
    clean_path = decodeURIComponent(encoded_path);
  } catch {
    clean_path = encoded_path;
  }

  if (clean_path === "/" || clean_path === "/index.html") {
    return source_entry;
  }

  if (clean_path.startsWith("/three/")) {
    const relative_three_path = clean_path.slice("/three/".length);
    const absolute_three_path = path.join(three_root, relative_three_path);
    const normalized_three_root = path.normalize(three_root + path.sep);
    const normalized_three_path = path.normalize(absolute_three_path);

    if (!normalized_three_path.startsWith(normalized_three_root)) {
      return null;
    }

    return normalized_three_path;
  }

  const relative_path = clean_path.replace(/^\/+/, "");
  const absolute_path = path.join(project_root, relative_path);
  const normalized_root = path.normalize(project_root + path.sep);
  const normalized_path = path.normalize(absolute_path);

  if (!normalized_path.startsWith(normalized_root)) {
    return null;
  }

  return normalized_path;
}

function send_reload(reason) {
  for (const client of live_clients) {
    client.write(`event: reload\ndata: ${reason}\n\n`);
  }
}

function queue_reload(reason) {
  clearTimeout(queue_reload.timer_id);
  queue_reload.timer_id = setTimeout(() => {
    log(`reload ${reason}`);
    send_reload(reason);
  }, 50);
}

function watch_directory(directory_path) {
  if (!fs.existsSync(directory_path)) {
    return;
  }

  try {
    fs.watch(directory_path, { recursive: true }, (_event_type, filename) => {
      if (!filename) {
        return;
      }

      queue_reload(filename);
    });
    log(`watching ${path.relative(project_root, directory_path)}`);
  } catch (error) {
    log(`watch failed for ${directory_path}: ${error.message}`);
  }
}

function open_browser(url) {
  if (!should_open) {
    return;
  }

  if (process.platform === "win32") {
    exec(`start "" "${url}"`);
    return;
  }

  if (process.platform === "darwin") {
    exec(`open "${url}"`);
    return;
  }

  exec(`xdg-open "${url}"`);
}

function read_request_body(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    request.on("data", (chunk) => {
      chunks.push(chunk);
    });

    request.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    request.on("error", reject);
  });
}

function write_source_default_config(snapshot) {
  const module_source =
    "export const SOURCE_DEFAULT_CONFIG = " +
    `${JSON.stringify(snapshot, null, 2)};\n\n` +
    "export default SOURCE_DEFAULT_CONFIG;\n";

  fs.writeFileSync(source_default_config_path, module_source);
}

async function read_source_default_config() {
  const module_url = `${pathToFileURL(source_default_config_path).href}?ts=${Date.now()}`;
  const source_default_module = await import(module_url);
  return source_default_module.SOURCE_DEFAULT_CONFIG || source_default_module.default;
}

function python_executable() {
  if (process.env.PYTHON && process.env.PYTHON.trim()) {
    return process.env.PYTHON.trim();
  }
  return process.platform === "win32" ? "python" : "python3";
}

function run_process(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || project_root,
      env: {
        ...process.env,
        ...(options.env || {})
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (options.log_prefix) {
        process.stdout.write(`[${options.log_prefix}] ${text}`);
      }
    });

    child.stderr?.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      if (options.log_prefix) {
        process.stderr.write(`[${options.log_prefix}] ${text}`);
      }
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(
        new Error(
          `${command} exited with ${code}.${stderr ? ` ${stderr.trim()}` : ""}`.trim()
        )
      );
    });
  });
}

const server = http.createServer(async (request, response) => {
  const request_url = request.url || "/";
  const request_path = request_url.split("?")[0];

  if (request_path === "/__authoring/source-default-config" && request.method === "GET") {
    try {
      const source_default_config = await read_source_default_config();
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({
        ok: true,
        config: source_default_config
      }));
      return;
    } catch (error) {
      response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: error.message }));
      return;
    }
  }

  if (request_path === "/__authoring/source-default-config" && request.method === "POST") {
    try {
      const request_body = await read_request_body(request);
      const payload = JSON.parse(request_body || "{}");
      const next_config = payload?.config;

      if (!next_config || typeof next_config !== "object" || Array.isArray(next_config)) {
        response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: "Expected a config object." }));
        return;
      }

      write_source_default_config(next_config);
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({
        ok: true,
        path: "assets/app/default-config-source.js",
        config: next_config
      }));
      return;
    } catch (error) {
      response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: error.message }));
      return;
    }
  }

  if (request_path === "/__authoring/export-mp4" && request.method === "POST") {
    let temp_dir_path = null;

    try {
      const request_body = await read_request_body(request);
      const payload = JSON.parse(request_body || "{}");
      const next_config = payload?.config;
      const output_width_px = Math.max(1, Number(payload?.output_width_px || 0));
      const output_height_px = Math.max(1, Number(payload?.output_height_px || 0));
      const frame_rate = Math.max(1, Math.round(Number(payload?.frame_rate || 24)));
      const frame_count = Math.max(1, Math.round(Number(payload?.frame_count || 1)));

      if (!next_config || typeof next_config !== "object" || Array.isArray(next_config)) {
        response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: "Expected a config object." }));
        return;
      }

      temp_dir_path = fs.mkdtempSync(path.join(os.tmpdir(), "mascot-animation-mp4-"));
      const temp_config_path = path.join(temp_dir_path, "config.json");
      fs.writeFileSync(temp_config_path, JSON.stringify(next_config, null, 2));

      const output_dir = path.join(
        project_root,
        "output",
        `${output_width_px}x${output_height_px}`,
        `ui-mp4-${Date.now()}`
      );
      fs.mkdirSync(output_dir, { recursive: true });

      const python = python_executable();
      await run_process(
        python,
        [
          "scripts/export_snapshot.py",
          "--config",
          temp_config_path,
          "--frame-rate",
          String(frame_rate),
          "--frame-count",
          String(frame_count),
          "--output-dir",
          output_dir
        ],
        { cwd: project_root, log_prefix: "export-mp4" }
      );

      await run_process(
        python,
        [
          "scripts/encode_mp4.py",
          "--input-dir",
          output_dir,
          "--fps",
          String(frame_rate),
          "--overwrite"
        ],
        { cwd: project_root, log_prefix: "encode-mp4" }
      );

      const mp4_path = path.join(output_dir, `${path.basename(output_dir)}-master.mp4`);
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(
        JSON.stringify({
          ok: true,
          output_dir,
          mp4_path
        })
      );
      return;
    } catch (error) {
      response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: error.message }));
      return;
    } finally {
      if (temp_dir_path) {
        fs.rmSync(temp_dir_path, { recursive: true, force: true });
      }
    }
  }

  if (request_url === "/__live") {
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Connection": "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8"
    });
    response.write("retry: 250\n\n");
    live_clients.add(response);

    request.on("close", () => {
      live_clients.delete(response);
    });
    return;
  }

  if (request_url.split("?")[0] === "/favicon.ico") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request_url.split("?")[0] === "/assets/app.css") {
    try {
      const css = await compile_styles_to_string({ style: "expanded" });
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": "text/css; charset=utf-8"
      });
      response.end(css);
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(`Stylesheet compilation failed: ${error.message}`);
    }
    return;
  }

  const file_path = resolve_public_path(request_url);
  if (!file_path || !fs.existsSync(file_path) || fs.statSync(file_path).isDirectory()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const mime_type = get_mime_type(file_path);
  const headers = {
    "Cache-Control": "no-store",
    "Content-Type": mime_type
  };

  if (file_path === source_entry && should_watch) {
    const html = fs.readFileSync(file_path, "utf8");
    response.writeHead(200, headers);
    response.end(inject_live_reload(html));
    return;
  }

  response.writeHead(200, headers);
  fs.createReadStream(file_path).pipe(response);
});

let active_port = requested_port;
let port_attempt = 0;

server.on("error", (error) => {
  if (error.code === "EADDRINUSE" && port_attempt < max_port_attempts - 1) {
    port_attempt += 1;
    active_port = requested_port + port_attempt;
    log(`port ${active_port - 1} in use, retrying on ${active_port}`);
    server.listen(active_port, host);
    return;
  }

  throw error;
});

server.listen(active_port, host, () => {
  const url = `http://${host}:${active_port}`;
  log(`serving ${url}`);

  if (should_watch) {
    for (const directory_path of watch_roots) {
      watch_directory(directory_path);
    }
  }

  open_browser(url);
});
