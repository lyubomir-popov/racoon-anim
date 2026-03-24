#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import sync_playwright


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 4173
DEFAULT_VIEWPORT = {"width": 1280, "height": 720}


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(
    description=(
      "Headless PNG exporter for the mascot animation. "
      "It drives the existing browser renderer rather than reimplementing scene logic."
    )
  )
  parser.add_argument("--url", help="Use an already running app URL instead of starting a local server.")
  parser.add_argument(
    "--profile",
    help="Override the output profile key, for example story_1080x1920 or led_wall_7680x2160."
  )
  parser.add_argument(
    "--config",
    help=(
      "Optional JSON config or exported preset file. "
      "If the JSON has a top-level 'config' object, that object is used."
    )
  )
  parser.add_argument("--output-dir", help="Directory to write PNGs into.")
  parser.add_argument("--host", default=DEFAULT_HOST, help="Host for the temporary local server.")
  parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port for the temporary local server.")
  parser.add_argument("--frame-rate", type=int, help="Override the export frame rate.")
  parser.add_argument("--frame-count", type=int, help="Number of frames to export.")
  parser.add_argument("--seconds", type=float, help="Export this many seconds instead of deriving frame count.")
  parser.add_argument("--frame", type=int, help="Export a single 1-based frame number.")
  parser.add_argument(
    "--transparent-background",
    action="store_true",
    help="Export PNGs with transparent background regardless of config."
  )
  parser.add_argument(
    "--browser-channel",
    choices=["chromium", "chrome", "msedge"],
    default="chromium",
    help="Browser channel to use. 'chromium' uses Playwright's bundled browser."
  )
  parser.add_argument(
    "--headful",
    action="store_true",
    help="Run the browser visibly for debugging instead of headless."
  )
  parser.add_argument(
    "--device-scale-factor",
    type=float,
    default=2.0,
    help=(
      "Browser device scale factor for headless rendering. "
      "2 gives 2x supersampling: text and geometry rasterise at double resolution "
      "then composite down to the output size. Sharper results at the cost of render time. "
      "Use 1 for very large output formats where memory is a concern."
    )
  )
  return parser.parse_args()


def npm_executable() -> str:
  return "npm.cmd" if os.name == "nt" else "npm"


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


def start_local_server(host: str, port: int) -> tuple[subprocess.Popen[str], str]:
  command = [
    npm_executable(),
    "run",
    "serve",
    "--",
    f"--host={host}",
    f"--port={port}"
  ]
  process = subprocess.Popen(
    command,
    cwd=REPO_ROOT,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True
  )
  url = f"http://{host}:{port}/?automation=1"
  try:
    wait_for_http_ok(url)
    return process, url
  except Exception:
    process.terminate()
    try:
      process.wait(timeout=5)
    except subprocess.TimeoutExpired:
      process.kill()
    if process.stdout:
      output = process.stdout.read()
      if output:
        sys.stderr.write(output)
    raise


def stop_local_server(process: subprocess.Popen[str] | None) -> None:
  if not process:
    return
  process.terminate()
  try:
    process.wait(timeout=5)
  except subprocess.TimeoutExpired:
    process.kill()
    process.wait(timeout=5)


def load_config_snapshot(config_path: str | None) -> dict[str, Any] | None:
  if not config_path:
    return None

  payload = json.loads(Path(config_path).read_text(encoding="utf-8"))
  if isinstance(payload, dict) and isinstance(payload.get("config"), dict):
    return payload["config"]
  if isinstance(payload, dict) and isinstance(payload.get("presets"), list):
    presets = [entry for entry in payload["presets"] if isinstance(entry, dict)]
    if len(presets) == 1 and isinstance(presets[0].get("config"), dict):
      return presets[0]["config"]
    raise ValueError("Preset bundle contains multiple presets. Export one preset JSON or reduce it to one config.")
  if isinstance(payload, dict):
    return payload
  raise ValueError("Config file must contain a JSON object.")


def default_output_dir(base_state: dict[str, Any]) -> Path:
  profile = base_state.get("output_profile") or {}
  width_px = int(profile.get("width_px") or 0)
  height_px = int(profile.get("height_px") or 0)
  timestamp = time.strftime("cli-%Y%m%d-%H%M%S")
  return REPO_ROOT / "output" / f"{width_px}x{height_px}" / timestamp


def build_apply_payload(args: argparse.Namespace, config_snapshot: dict[str, Any] | None) -> dict[str, Any]:
  payload: dict[str, Any] = {}
  if config_snapshot is not None:
    payload["config"] = config_snapshot
  if args.profile:
    payload["output_profile_key"] = args.profile
  if args.frame_rate:
    payload["frame_rate"] = args.frame_rate
  if args.transparent_background:
    payload["transparent_background"] = True
  return payload


def determine_frames(args: argparse.Namespace, frame_rate: int, playback_end_sec: float) -> list[int]:
  if args.frame is not None:
    return [max(1, args.frame)]
  if args.frame_count is not None:
    frame_count = max(1, args.frame_count)
  elif args.seconds is not None:
    frame_count = max(1, int(round(args.seconds * frame_rate)) + 1)
  else:
    frame_count = max(1, int(playback_end_sec * frame_rate) + 1)
  return list(range(1, frame_count + 1))


def log(message: str) -> None:
  print(message, flush=True)


def main() -> int:
  args = parse_args()
  config_snapshot = load_config_snapshot(args.config)

  server_process: subprocess.Popen[str] | None = None
  url = args.url
  if not url:
    server_process, url = start_local_server(args.host, args.port)

  try:
    with sync_playwright() as playwright:
      browser_type = playwright.chromium
      launch_kwargs: dict[str, Any] = {"headless": not args.headful}
      if args.browser_channel != "chromium":
        launch_kwargs["channel"] = args.browser_channel

      browser = browser_type.launch(**launch_kwargs)
      try:
        device_scale_factor = max(1.0, float(args.device_scale_factor))
        context = browser.new_context(
          viewport=DEFAULT_VIEWPORT,
          device_scale_factor=device_scale_factor
        )
        page = context.new_page()
        page.goto(url, wait_until="networkidle")
        page.wait_for_function("() => Boolean(window.__mascotAutomation)")

        state = page.evaluate("() => window.__mascotAutomation.ready()")
        apply_payload = build_apply_payload(args, config_snapshot)
        if apply_payload:
          state = page.evaluate("(payload) => window.__mascotAutomation.applySnapshot(payload)", apply_payload)

        frame_rate = int(args.frame_rate or state["frame_rate"])
        frames = determine_frames(args, frame_rate, float(state["playback_end_sec"]))
        output_dir = Path(args.output_dir) if args.output_dir else default_output_dir(state)
        output_dir.mkdir(parents=True, exist_ok=True)

        pad_width = max(4, len(str(max(frames))))
        transparent_background = (
          True if args.transparent_background else bool(state.get("transparent_background"))
        )

        total_frames = len(frames)
        log(f"Exporting {total_frames} frame(s) at {frame_rate} fps to {output_dir}")
        for index, frame_number in enumerate(frames, start=1):
          playback_time_sec = (frame_number - 1) / frame_rate
          result = page.evaluate(
            "(payload) => window.__mascotAutomation.exportFrame(payload)",
            {
              "playback_time_sec": playback_time_sec,
              "transparent_background": transparent_background
            }
          )
          png_bytes = base64.b64decode(result["png_base64"])
          output_path = output_dir / f"frame-{frame_number:0{pad_width}d}.png"
          output_path.write_bytes(png_bytes)
          if index == 1 or index == total_frames or index % max(1, frame_rate // 2) == 0:
            log(f"Rendered {index}/{total_frames}: {output_path.name}")
      finally:
        browser.close()
  except PlaywrightError as error:
    message = str(error)
    if "Executable doesn't exist" in message or "browserType.launch" in message:
      sys.stderr.write(
        "Playwright browser is not installed. Run:\n"
        "  python -m playwright install chromium\n"
      )
    sys.stderr.write(f"{message}\n")
    return 1
  finally:
    stop_local_server(server_process)

  return 0


if __name__ == "__main__":
  raise SystemExit(main())
