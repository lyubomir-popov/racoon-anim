# Remaining Work

This file is the forward-looking plan. It is organized by theme rather than by chronology.

## A. Overlay Data Model

### Goal

Finish the move from a partially projected overlay system to a clean data-driven model.

### Still remaining

1. Remove the fixed internal assumption that every format resolves to:
   - `main_heading`
   - `text_1`
   - `text_2`
   - `text_3`
2. Make content formats declare their own field list and style mapping in a fully data-driven way.
3. Keep the summit heading/logo as fixed brand content while variable content comes from the selected CSV format.
4. Preserve migration for older presets/source defaults.
5. Verify the text-block subtabs after the recent dynamic-field refactor.
   - The subtab UI must follow the Vanilla tabs interaction model:
     - real `aria-controls`
     - `aria-labelledby`
     - active-on-focus/click
     - hidden tabpanels
   - Local reference repo for this behavior:
     - `h:\WSL_dev_projects\vanilla-framework`
     - especially `templates/static/js/tabs.js`

### Why it matters

Right now the format system exists, but it still bottoms out in fixed runtime slots. That is good enough for the current demo work, but not yet the final architecture.

## B. Safe Area As Output-Profile Metadata

### Goal

Safe area should be a first-class property of each output profile, with a zero-inset fallback.

### Still remaining

1. Move safe-area defaults into the output profile definitions.
2. Normalize missing safe areas to:
   - `top: 0`
   - `right: 0`
   - `bottom: 0`
   - `left: 0`
3. Keep user offsets additive on top of the normalized profile safe area.
4. Ensure switching output formats swaps the correct safe-area defaults automatically.

### Why it matters

The current safe-area implementation works, but it is still more runtime-projected than profile-native.

## C. Overlay Preset Semantics

### Goal

Make the global-vs-local split fully legible and stable.

### Still remaining

1. Audit which controls should truly be:
   - global shared settings
   - output-format-specific settings
2. Keep colors global unless there is a strong reason not to.
3. Keep layout/scale/grid/text-placement per output format.
4. Confirm the writeback and reload path preserves this split without silent flattening.

### Why it matters

This is the central mental model for the user:

- select screen size
- tune that screen size
- shared brand/color settings remain global

## D. Stakeholder-Friendly CSV Workflow

### Goal

Let non-operator stakeholders supply CSV content without navigating the full authoring UI.

### Still remaining

1. Add a simplified CSV upload flow.
2. Add row selection by:
   - row index
   - or stable row ID
3. Allow the operator to choose a content format and then upload CSV matching that format.
4. Keep the full tuning UI for operator use, but provide a simpler surface for stakeholders.

### Why it matters

The current UI is an operator UI, not a stakeholder UI.

## E. Speaker Highlight / Richer Templates

### Goal

Expand beyond the current generic social text layout.

### Still remaining

1. Fully flesh out `speaker_highlight`.
2. Add support for richer card layouts:
   - speaker name
   - speaker role
   - session title
   - optional photo block
   - note: the CSV already carries `speaker_photo`, but the visual card/photo layout is not finished runtime behavior yet
3. Ensure field naming and tabs reflect the active format naturally.

### Why it matters

The user explicitly wants multiple overlay template types, not just one generic block of text.

## F. Export UX

### Goal

Make local export robust and make static-hosting limitations obvious.

### Done (2026-03-24)

1. `Export MP4` button now prompts for frame count before starting (was silent/derived).
2. `Failed to fetch` on static hosting now produces the correct error message via the 404 path.
3. `preserveDrawingBuffer: true` added to WebGLRenderer – fixes black background outside safe area in exported frames.
4. `device_scale_factor` raised from 1 to 2 in headless Playwright – fixes soft/unsharp text in exports.
5. MP4 encode now uses `--delivery --all-intra`: yuv420p, CRF 14, BT.709 tags, level 4.1, all-keyframes. Eliminates banding; correct settings for Instagram, YouTube, LinkedIn, X.
6. `STAGE_BACKGROUND_COLOR` constant corrected from `#262626` to `#202020`.

### Still remaining

1. Consider disabling or relabeling MP4 export automatically on static builds (the 404 message is a reasonable fallback but a proactive label would be cleaner).

## G. Watch-Folder Automation

### Goal

Automate asset generation from incoming CSV jobs in a synced folder.

### Still remaining

1. Implement `scripts/watch_jobs.py`
2. Add:
   - inbox
   - processed
   - failed
   - logs
   - output
3. Add debounce / file-stability checks
4. Queue jobs serially
5. Export via snapshot
6. Encode MP4
7. Write a manifest alongside outputs

### Why it matters

This is the bridge from the authoring tool to a semi-automated production pipeline.

## H. Refactor Debt

### Goal

Reduce the chance of halo/overlay regressions from future feature work.

### Still remaining

1. Continue modularizing:
   - `src/app/rendering.js`
   - `src/app/index.js`
2. Keep halo field logic centralized in shared helpers.
3. Move more render-only / UI metadata into schema rather than maintaining separate ad hoc allowlists.
4. Remove legacy hidden compatibility fields once migration is stable enough.

### Why it matters

A lot of the painful regressions in this project came from patching duplicated logic in large files.

## I. Source Tree Reorganization

### Status

Partially done.

### What changed

- live application source now lives in `src/app/`
- `assets/` is now reserved for static assets
- the build/dev-server still publish browser modules at `/assets/app/*` for runtime compatibility

### Still remaining

1. Audit docs and helper scripts for any stale path references.
2. Decide later whether the public output path should also change, or whether `/assets/app/*` should remain the stable browser path.
3. Keep the current compatibility mapping until the app is otherwise stable.

## J. Validation Passes Still Worth Doing

These are not necessarily new features, but they should be part of future work:

1. Verify overlay layouts across all active output formats.
2. Verify safe-area behavior in:
   - below-animation mode
   - above-animation mode
   - inside-only vignette
   - outside-only vignette
3. Verify halo clipping and label behavior on:
   - portrait social
   - landscape screen
   - LED-wide formats
4. Verify overlay text-block subtabs in both formats:
   - `generic_social`
   - `speaker_highlight`
   and confirm each tab edits only its own field layout.

## K. Cross-Platform Export Dependencies

### Goal

Ensure the Python export pipeline works on Windows, WSL (Ubuntu), Linux, and macOS without manual environment archaeology.

### Current state (audited 2026-03-24)

**Windows PowerShell – fully working:**
- ffmpeg v8.1 present (gyan.dev build, found via PATH or winget packages)
- Playwright installed with bundled Chromium
- `npm_executable()` and `python_executable()` helpers already handle platform differences

**WSL (Ubuntu 24.04) and Linux – dependencies missing but installable:**
- ffmpeg: `sudo apt install ffmpeg` (v6.1 available in apt)
- Node.js: `sudo apt install nodejs npm` (v18 available in apt)
- Playwright: not an apt package; must be pip-installed inside a venv because Ubuntu 24.04 enforces PEP 668
  - `python3 -m venv .venv && .venv/bin/pip install playwright && .venv/bin/playwright install chromium`
- The bare `python` / `python3` in PATH will not have Playwright without an activated venv

**macOS:**
- `brew install ffmpeg node`
- `pip install playwright && playwright install chromium` (no PEP 668 restriction with Homebrew Python)

### Still remaining

1. Add `requirements.txt` listing `playwright` so the install step is explicit.
2. Add a setup section to `README.md` with per-platform install steps (Windows, WSL/Linux, macOS).
3. Decide how to handle the venv on WSL/Linux: document activation, or add a check at the top of each script that prints a clear install hint if the module is missing.
4. Fix the frame filename padding vs ffmpeg glob mismatch: `export_frames.py` uses `max(4, len(str(max(frames))))` digits but `encode_mp4.py` hardcodes `frame-%04d.png`. At 10 000+ frames ffmpeg fails to match files. Cap at 4 digits or make the pattern dynamic.

### Why it matters

The project may move to a Linux or macOS machine. The scripts are structurally cross-platform already; they just need declared dependencies and a setup path that does not require reverse-engineering the environment.

## Suggested Execution Order

If another model needs a practical order, use this:

1. finish overlay data model cleanup
2. move safe area into output profile metadata
3. finish stakeholder-friendly CSV flow
4. add requirements.txt and cross-platform setup docs
5. debug local MP4 export button end to end
6. implement watch-folder automation
7. continue deeper refactor only after the overlay model is stable
