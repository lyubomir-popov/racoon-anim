#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(
    description=(
      "Encode an exported PNG sequence into an MP4 master. "
      "Defaults are tuned to preserve thin graphic shapes better than a normal delivery encode."
    )
  )
  parser.add_argument(
    "--input-dir",
    required=True,
    help="Directory containing frame-0001.png style exports."
  )
  parser.add_argument(
    "--output",
    help="Output MP4 path. Defaults to <input-dir>/<input-dir-name>-master.mp4."
  )
  parser.add_argument(
    "--fps",
    type=int,
    default=24,
    help="Frame rate of the image sequence."
  )
  parser.add_argument(
    "--crf",
    type=float,
    default=10,
    help="Quality target. Lower is higher quality. 10 is a good sharp master default."
  )
  parser.add_argument(
    "--preset",
    default="slow",
    choices=["medium", "slow", "slower", "veryslow"],
    help="x264 speed/quality preset."
  )
  parser.add_argument(
    "--pix-fmt",
    default="yuv444p",
    choices=["yuv444p", "yuv420p"],
    help=(
      "Pixel format. yuv444p preserves thin colored edges better; yuv420p is more widely compatible."
    )
  )
  parser.add_argument(
    "--all-intra",
    action="store_true",
    help="Make every frame a keyframe. Larger files; useful for editing, not usually needed for sharpness."
  )
  parser.add_argument(
    "--delivery",
    action="store_true",
    help="Use delivery-oriented defaults: yuv420p, CRF 14, BT.709 tags, level 4.1. Recommended for platform upload (Instagram, YouTube, LinkedIn, X)."
  )
  parser.add_argument(
    "--ffmpeg",
    help="Explicit ffmpeg executable path. Otherwise uses ffmpeg from PATH."
  )
  parser.add_argument(
    "--overwrite",
    action="store_true",
    help="Overwrite the output file if it already exists."
  )
  return parser.parse_args()


def resolve_ffmpeg(ffmpeg_arg: str | None) -> str:
  if ffmpeg_arg:
    return str(Path(ffmpeg_arg).resolve())
  ffmpeg = shutil.which("ffmpeg")
  if ffmpeg:
    return ffmpeg

  if os.name == "nt":
    local_app_data = Path(os.environ.get("LOCALAPPDATA", ""))
    winget_packages_dir = local_app_data / "Microsoft" / "WinGet" / "Packages"
    if winget_packages_dir.is_dir():
      candidates = sorted(
        winget_packages_dir.glob("Gyan.FFmpeg.Essentials*/*/bin/ffmpeg.exe"),
        reverse=True
      )
      if not candidates:
        candidates = sorted(
          winget_packages_dir.glob("Gyan.FFmpeg*/*/bin/ffmpeg.exe"),
          reverse=True
        )
      if candidates:
        return str(candidates[0])

  raise FileNotFoundError(
    "ffmpeg was not found on PATH. Pass --ffmpeg <path-to-ffmpeg.exe> or install ffmpeg."
  )


def validate_input_dir(input_dir: Path) -> Path:
  if not input_dir.is_dir():
    raise FileNotFoundError(f"Input directory does not exist: {input_dir}")
  first_frame = input_dir / "frame-0001.png"
  if not first_frame.exists():
    raise FileNotFoundError(
      f"{input_dir} does not contain frame-0001.png. "
      "This encoder expects the exporter naming convention."
    )
  return first_frame


def default_output_path(input_dir: Path) -> Path:
  return input_dir / f"{input_dir.name}-master.mp4"


def build_ffmpeg_command(
  ffmpeg: str,
  first_frame: Path,
  output_path: Path,
  fps: int,
  crf: float,
  preset: str,
  pix_fmt: str,
  all_intra: bool,
  overwrite: bool
) -> list[str]:
  command = [
    ffmpeg,
    "-hide_banner",
    "-loglevel",
    "error",
    "-framerate",
    str(fps),
    "-i",
    str(first_frame.parent / "frame-%04d.png"),
    "-c:v",
    "libx264",
    "-preset",
    preset,
    "-crf",
    str(crf),
    "-pix_fmt",
    pix_fmt,
    "-profile:v",
    "high444" if pix_fmt == "yuv444p" else "high",
    "-level:v",
    "4.1",
    "-colorspace",
    "bt709",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "bt709",
    "-movflags",
    "+faststart",
    "-tune",
    "animation",
    "-bf",
    "0"
  ]

  if all_intra:
    command.extend([
      "-g",
      "1",
      "-keyint_min",
      "1",
      "-sc_threshold",
      "0"
    ])
  else:
    command.extend([
      "-g",
      str(max(1, fps * 2)),
      "-keyint_min",
      str(max(1, fps // 2))
    ])

  command.append("-y" if overwrite else "-n")
  command.append(str(output_path))
  return command


def main() -> int:
  args = parse_args()
  input_dir = Path(args.input_dir).resolve()
  first_frame = validate_input_dir(input_dir)
  output_path = Path(args.output).resolve() if args.output else default_output_path(input_dir)

  ffmpeg = resolve_ffmpeg(args.ffmpeg)

  fps = max(1, int(args.fps))
  crf = 14 if args.delivery else float(args.crf)
  pix_fmt = "yuv420p" if args.delivery else args.pix_fmt

  command = build_ffmpeg_command(
    ffmpeg=ffmpeg,
    first_frame=first_frame,
    output_path=output_path,
    fps=fps,
    crf=crf,
    preset=args.preset,
    pix_fmt=pix_fmt,
    all_intra=bool(args.all_intra),
    overwrite=bool(args.overwrite)
  )

  print(f"Encoding MP4 from {input_dir}", flush=True)
  print(f"Output: {output_path}", flush=True)
  print(
    f"Settings: fps={fps}, crf={crf}, pix_fmt={pix_fmt}, all_intra={bool(args.all_intra)}",
    flush=True
  )

  completed = subprocess.run(command)
  return completed.returncode


if __name__ == "__main__":
  raise SystemExit(main())
