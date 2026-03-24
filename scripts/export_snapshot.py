#!/usr/bin/env python3
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 0


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(
    description=(
      "Build the current working tree once, copy dist into a frozen snapshot folder, "
      "and export frames from that static build so later edits cannot interrupt the run."
    )
  )
  parser.add_argument("--profile", help="Output profile key to export, for example story_1080x1920.")
  parser.add_argument("--config", help="Optional JSON config or preset file to apply before rendering.")
  parser.add_argument("--output-dir", help="Final directory for the PNGs.")
  parser.add_argument("--frame-rate", type=int, help="Override the export frame rate.")
  parser.add_argument("--frame-count", type=int, help="Number of frames to export.")
  parser.add_argument("--seconds", type=float, help="Export this many seconds.")
  parser.add_argument("--frame", type=int, help="Export a single 1-based frame.")
  parser.add_argument(
    "--transparent-background",
    action="store_true",
    help="Export PNGs with transparent background."
  )
  parser.add_argument(
    "--browser-channel",
    choices=["chromium", "chrome", "msedge"],
    default="chromium",
    help="Browser channel for the headless exporter."
  )
  parser.add_argument("--headful", action="store_true", help="Run the browser visibly for debugging.")
  parser.add_argument("--host", default=DEFAULT_HOST, help="Host for the snapshot server.")
  parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port for the snapshot server.")
  parser.add_argument(
    "--keep-snapshot",
    action="store_true",
    help="Do not remove the temporary dist snapshot after export."
  )
  return parser.parse_args()


def log(message: str) -> None:
  print(message, flush=True)


def run(command: list[str], *, cwd: Path) -> None:
  subprocess.run(command, cwd=str(cwd), check=True)


def snapshot_path() -> Path:
  return REPO_ROOT / ".export-snapshots" / time.strftime("%Y%m%d-%H%M%S")


def build_current_dist() -> None:
  run(["npm.cmd" if sys.platform == "win32" else "npm", "run", "build"], cwd=REPO_ROOT)


def create_dist_snapshot(destination: Path) -> Path:
  source_dist = REPO_ROOT / "dist"
  destination.mkdir(parents=True, exist_ok=True)
  snapshot_dist = destination / "dist"
  if snapshot_dist.exists():
    shutil.rmtree(snapshot_dist)
  shutil.copytree(source_dist, snapshot_dist)
  return snapshot_dist


def wait_for_http_ok(url: str, timeout_sec: float = 30.0) -> None:
  deadline = time.monotonic() + timeout_sec
  last_error: Exception | None = None
  while time.monotonic() < deadline:
    try:
      with urllib.request.urlopen(url, timeout=2.0) as response:
        if 200 <= response.status < 400:
          return
    except Exception as error:  # noqa: BLE001
      last_error = error
    time.sleep(0.25)
  message = f"Timed out waiting for {url}"
  if last_error:
    message = f"{message}: {last_error}"
  raise RuntimeError(message)


class QuietStaticHandler(SimpleHTTPRequestHandler):
  def log_message(self, format: str, *args: object) -> None:  # noqa: A003
    return


def start_static_server(snapshot_dist: Path, host: str, port: int) -> tuple[ThreadingHTTPServer, Thread, str]:
  requested_port = 0 if port <= 0 else port
  handler = partial(QuietStaticHandler, directory=str(snapshot_dist))
  server = ThreadingHTTPServer((host, requested_port), handler)
  thread = Thread(target=server.serve_forever, daemon=True)
  thread.start()
  active_port = int(server.server_address[1])
  url = f"http://{host}:{active_port}/?automation=1"
  wait_for_http_ok(url)
  return server, thread, url


def stop_static_server(server: ThreadingHTTPServer | None, thread: Thread | None) -> None:
  if not server:
    return
  server.shutdown()
  server.server_close()
  if thread:
    thread.join(timeout=5)


def build_child_command(args: argparse.Namespace, output_dir: str, url: str) -> list[str]:
  command = [sys.executable, "scripts/export_frames.py", "--url", url]
  if args.profile:
    command.extend(["--profile", args.profile])
  if args.config:
    command.extend(["--config", str(Path(args.config).resolve())])
  if args.frame_rate:
    command.extend(["--frame-rate", str(args.frame_rate)])
  if args.frame_count:
    command.extend(["--frame-count", str(args.frame_count)])
  if args.seconds is not None:
    command.extend(["--seconds", str(args.seconds)])
  if args.frame is not None:
    command.extend(["--frame", str(args.frame)])
  if args.transparent_background:
    command.append("--transparent-background")
  if args.browser_channel:
    command.extend(["--browser-channel", args.browser_channel])
  if args.headful:
    command.append("--headful")
  if args.output_dir:
    command.extend(["--output-dir", output_dir])
  return command


def remove_snapshot(destination: Path) -> None:
  for _ in range(10):
    if not destination.exists():
      return
    try:
      shutil.rmtree(destination)
      return
    except FileNotFoundError:
      return
    except PermissionError:
      time.sleep(0.5)


def main() -> int:
  args = parse_args()
  snapshot_root = snapshot_path()
  server: ThreadingHTTPServer | None = None
  server_thread: Thread | None = None

  log("Building current working tree into dist/")
  build_current_dist()
  snapshot_dist = create_dist_snapshot(snapshot_root)

  try:
    server, server_thread, url = start_static_server(snapshot_dist, args.host, args.port)
    output_dir = str(Path(args.output_dir).resolve()) if args.output_dir else ""
    log(f"Exporting from frozen dist snapshot {snapshot_dist}")
    command = build_child_command(args, output_dir, url)
    completed = subprocess.run(command, cwd=str(REPO_ROOT))
    return completed.returncode
  finally:
    stop_static_server(server, server_thread)
    if args.keep_snapshot:
      log(f"Kept dist snapshot: {snapshot_root}")
    else:
      remove_snapshot(snapshot_root)


if __name__ == "__main__":
  raise SystemExit(main())
