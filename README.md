# Mascot Animation

## Folders

- `src/`: web source
- `src/app/`: live application source
- `assets/`: static mascot/content/font assets
- `houdini/`: source wrangles from Houdini
- `references/`: visual reference screenshots
- `scripts/`: local tooling

## Project Docs

- `00-llm-reading-order.md`: ordered reading list for future LLM handoff
- `art-direction-plan.md`: visual and motion intent
- `llm-handoff-context.md`: current implementation context for future model handoff
- `history.md`: consolidated record of what has already been built
- `remaining-work.md`: open work organized by theme

## Local dev

Run:

```bash
npm run dev
```

That starts a small local server with automatic browser reload when files in `src/` or `assets/` change.

## Build

Run:

```bash
npm run build
```

That writes a deployable static site to `dist/`.

## Overlay Workflow

There are now two levels of tuning in the editor:

- `Output`
  This is where you choose the active screen size and export from it.
- `Presets`
  This is where you edit the global shared settings that should stay consistent across every screen size.

The tracked source default now lives in:

- `src/app/default-config-source.js`

### What switches with Output Format

Changing `Output Format` now swaps in the local settings stored for that screen size. In practice, this means the following can differ per output size:

- composition scale
- mascot size and offsets
- grid rows / columns
- baseline step
- margins
- safe-area inset values
- logo placement
- text block `x / y / max width`
- text style sizes and line heights
- vignette values
- export frame rate

So if you tune `1080x1920`, switch to `1280x720`, and then switch back, each format keeps its own local layout.

### What stays global

The following settings are currently shared across every output size:

- stage / safe-area / spoke / label / mascot colors
- summit heading text
- logo asset path
- active overlay content format

These are edited in the `Presets` tab.

### Overlay content formats

`Overlay Content Format` is still independent from `Output Format`.

It changes:

- which CSV schema is active
- which text-block sub-tabs you see in the overlay editor

Each output size keeps separate text-block layout for each content format. So `Speaker Highlight` at `1080x1920` can have different placement from `Speaker Highlight` at `3840x2160`.

## Export reference

### File naming

All exports follow the pattern `{ExportName}_{dims}_f{nnnn}.ext` and land in typed subfolders:

```
output/
  1080x1920/
    single/    UbuntuSummit2026_1080x1920_f0053.png   ← Export Frame
    sequence/  UbuntuSummit2026_1080x1920_f0001.png … ← Export PNG Seq
    mp4/       UbuntuSummit2026_1080x1920.mp4          ← Export MP4
```

`ExportName` is configured per-preset via the **Export Name** control in the UI. Only alphanumeric characters, `_`, and `-` are kept.

### Two distinct exports

**Reveal** — the full animation (empty screen → spoke reveal → finale).
Post as an Instagram Reel or standalone video. Ends on the held final frame.

**Screensaver loop** — the breathing/pulsing post-finale animation only, looping seamlessly.
Used for ambient video screens between sessions.

### Screensaver loop timing (story_1080x1920 at 30 fps)

Timing chain for the default `story_1080x1920` profile:

| Event | Time | Frame |
|---|---|---|
| Dot animation ends | 1.00 s | 30 |
| Finale sweep ends | 1.75 s | 52 |
| Blink ends (`playback_end_sec`) | 1.91 s | **57** |
| Screensaver starts | 1.91 s | **58** |
| Ramp-in settles (`ramp_in_sec` = 2 s) | 3.91 s | **118** |
| One full cycle ends (`cycle_sec` = 60 s) | 63.91 s | **1918** |

**For a clean seamless loop: export frames 118–1918 (1800 frames = 60 seconds).**

To export a tighter loop, reduce `screensaver.cycle_sec` to 30 s and export 900 frames (frames 118–1018).

Instagram upload recommendations: 1080×1920 H.264 at ~3.5–5 Mbps, 30 fps.

### Recommended operator workflow

1. Open `Output` and choose the screen size.
2. Open `Overlay` and choose the content format.
3. Tune the local layout for that screen size.
4. Open `Presets` and adjust any global shared colors/brand settings if needed.
5. If you want the current state to become the tracked repo default, use `Write Source Default`.

### Generic social layout

For `Social Media Post - Generic`, the overlay tab is organized as:

- `Text Styles`
  - `A-head`
  - `Paragraph`
- `Text Blocks`
  - `A-head`
  - `Paragraph 1`
  - `Paragraph 2`

`Paragraph 2` contains the two stacked footer lines.

### CSV notes

The current formats expect:

- `Social Media Post - Generic`
  - `text_1`
  - `text_2`
  - `text_3`
- `Speaker Highlight`
  - `session_title`
  - `speaker_name`
  - `speaker_role`

Quoted multiline CSV cells are supported. `<br>` is also accepted and converted into line breaks on import.

## Export pipeline setup

The export scripts (`scripts/export_frames.py`, `scripts/encode_mp4.py`) require **Python 3**, **Playwright**, and **ffmpeg**. Install steps differ by platform.

### Windows (PowerShell)

```powershell
# ffmpeg – install via winget, then confirm it is on PATH
winget install Gyan.FFmpeg
# restart terminal, then:
ffmpeg -version

# Node (if not already present)
winget install OpenJS.NodeJS.LTS

# Python Playwright
pip install playwright
playwright install chromium
```

The scripts call `playwright` and `ffmpeg` directly as subprocesses. No venv needed on Windows if `pip install` lands in the user site-packages.

### WSL / Ubuntu 24.04

Ubuntu 24.04 enforces PEP 668 – `pip install` outside a venv is blocked. Use a venv:

```bash
sudo apt update && sudo apt install -y ffmpeg nodejs npm python3-venv

python3 -m venv .venv
.venv/bin/pip install playwright
.venv/bin/playwright install chromium
```

Activate the venv before running the scripts:

```bash
source .venv/bin/activate
python scripts/export_frames.py --help
```

Or invoke through the venv Python directly without activating:

```bash
.venv/bin/python scripts/export_frames.py --help
```

### macOS

```bash
brew install ffmpeg node python3

pip install playwright
playwright install chromium
```

No venv required unless your system Python restricts `pip`.

### Confirm everything is in place

```bash
ffmpeg -version
node --version
python3 -c "from playwright.sync_api import sync_playwright; print('ok')"
```

## Houdini

The `houdini/` folder includes the wrangles that mirror the current browser logic:

- `dot-generator.vex`: spoke/orbit topology, including the current flipped spoke direction and mask-based point cull
- `transition.vex`: orbit motion, capture timing, orbit unlock timing, and frontier-driven `pscale`
- `mascot-shake-blink.vex`: head shake + eye blink/squint timing, with optional direct point-group transforms for imported mascot geometry

## GitHub Pages

This project includes a GitHub Pages workflow in `.github/workflows/deploy-pages.yml`.

After pushing the repo to GitHub:

1. Open repository `Settings`.
2. Open `Pages`.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.
4. Push to `main` or run the workflow manually from the `Actions` tab.
