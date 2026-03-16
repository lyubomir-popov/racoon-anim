import { exec } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compile_styles_to_string } from "./styles.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const project_root = path.resolve(__dirname, "..");
const source_root = path.join(project_root, "src");
const source_entry = path.join(source_root, "index.html");
const watch_roots = [
  source_root,
  path.join(project_root, "assets")
];
const port_arg = process.argv.find((argument) => argument.startsWith("--port="));
const host_arg = process.argv.find((argument) => argument.startsWith("--host="));
const port = Number(port_arg?.split("=")[1] || process.env.PORT || 5173);
const host = host_arg?.split("=")[1] || process.env.HOST || "127.0.0.1";
const should_open = !process.argv.includes("--no-open");
const should_watch = !process.argv.includes("--no-watch");
const live_clients = new Set();

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
  const clean_path = request_path.split("?")[0];

  if (clean_path === "/" || clean_path === "/index.html") {
    return source_entry;
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

const server = http.createServer(async (request, response) => {
  const request_url = request.url || "/";

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

server.listen(port, host, () => {
  const url = `http://${host}:${port}`;
  log(`serving ${url}`);

  if (should_watch) {
    for (const directory_path of watch_roots) {
      watch_directory(directory_path);
    }
  }

  open_browser(url);
});
