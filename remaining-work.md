# Remaining Work

This file is the forward-looking plan. It is organized by theme rather than by chronology.

## A. Overlay Data Model

### Goal

Finish the move from a partially projected overlay system to a clean data-driven model.

- [x] Remove the fixed internal assumption that every format resolves to `main_heading`, `text_1`, `text_2`, `text_3`. (dead `runtime_specs` loop + 15 dead `CONFIG_FIELD_META` entries removed; dead `overlay_text.text_1/2/3_*` migration writes removed)
- [x] Make content formats declare their own field list and style mapping in a fully data-driven way. (done in prior refactor – `OVERLAY_CONTENT_FORMATS.fields`, `get_overlay_content_record()`, `draw_overlay_text_block()` all iterate field list)
- [x] Keep the summit heading/logo as fixed brand content while variable content comes from the selected CSV format. (`main_heading` reads `overlay_text.title_text` directly; variable fields come from `format_spec.fields`)
- [x] Preserve migration for older presets/source defaults. (Loop 2 in `ensure_overlay_text_keyline_defaults` + `legacy_slot` references in format-bucket migration are untouched)
- [x] Verify the text-block subtabs after the recent dynamic-field refactor. (`build_tabbed_control_section` confirmed: `aria-controls`, `aria-labelledby`, `role="tabpanel"`, `tabindex` management, active-on-focus/click, arrow key nav – Vanilla model correct)
  - The subtab UI must follow the Vanilla tabs interaction model: real `aria-controls`, `aria-labelledby`, active-on-focus/click, hidden tabpanels.
  - Local reference: `h:\WSL_dev_projects\vanilla-framework`, especially `templates/static/js/tabs.js`.

### Why it matters

Right now the format system exists, but it still bottoms out in fixed runtime slots. That is good enough for the current demo work, but not yet the final architecture.

## B. Safe Area As Output-Profile Metadata

### Goal

Safe area should be a first-class property of each output profile, with a zero-inset fallback.

- [x] Move safe-area defaults into the output profile definitions. (`OUTPUT_PROFILES` now carries `safe_area: { top, right, bottom, left }`)
- [x] Normalize missing safe areas to `{ top: 0, right: 0, bottom: 0, left: 0 }`. (`get_output_profile_safe_area()` helper; `sync_profile_derived_config` seeds on load)
- [x] Keep user offsets additive on top of the normalized profile safe area. (seeding is non-destructive – only fills when value is absent)
- [x] Ensure switching output formats swaps the correct safe-area defaults automatically. (`seed_profile_local_snapshot` now overwrites `safe_*_px` from profile on every format switch)

## C. Overlay Preset Semantics

### Goal

Make the global-vs-local split fully legible and stable.

- [ ] Audit which controls should truly be global shared settings vs output-format-specific settings.
- [ ] Keep colors global unless there is a strong reason not to.
- [ ] Keep layout/scale/grid/text-placement per output format.
- [ ] Confirm the writeback and reload path preserves this split without silent flattening.

### Why it matters

This is the central mental model for the user: select screen size → tune that screen size → shared brand/color settings remain global.

## D. Stakeholder-Friendly CSV Workflow

### Goal

Let non-operator stakeholders supply CSV content without navigating the full authoring UI.

- [ ] Add a simplified CSV upload flow.
- [ ] Add row selection by row index or stable row ID.
- [ ] Allow the operator to choose a content format and then upload CSV matching that format.
- [ ] Keep the full tuning UI for operator use, but provide a simpler surface for stakeholders.

### Why it matters

The current UI is an operator UI, not a stakeholder UI.

## E. Speaker Highlight / Richer Templates

### Goal

Expand beyond the current generic social text layout.

- [ ] Fully flesh out `speaker_highlight`.
- [ ] Add support for richer card layouts: speaker name, speaker role, session title, optional photo block. (CSV already carries `speaker_photo`, but visual card/photo layout is not finished)
- [ ] Ensure field naming and tabs reflect the active format naturally.

### Why it matters

The user explicitly wants multiple overlay template types, not just one generic block of text.

## F. Export UX

### Goal

Make local export robust and make static-hosting limitations obvious.

- [x] `Export MP4` button now prompts for frame count before starting (was silent/derived).
- [x] `Failed to fetch` on static hosting now produces the correct error message via the 404 path.
- [x] `preserveDrawingBuffer: true` added to WebGLRenderer – fixes black background outside safe area in exported frames.
- [x] `device_scale_factor` raised from 1 to 2 in headless Playwright – fixes soft/unsharp text in exports.
- [x] MP4 encode now uses `--delivery --all-intra`: yuv420p, CRF 14, BT.709 tags, level 4.1, all-keyframes. Eliminates banding; correct settings for Instagram, YouTube, LinkedIn, X.
- [x] `STAGE_BACKGROUND_COLOR` constant corrected from `#262626` to `#202020`.
- [ ] Consider disabling or relabeling MP4 export automatically on static builds (the 404 message is a reasonable fallback but a proactive label would be cleaner).

## G. Watch-Folder Automation

### Goal

Automate asset generation from incoming CSV jobs in a synced folder.

- [ ] Implement `scripts/watch_jobs.py`.
- [ ] Add inbox / processed / failed / logs / output folder structure.
- [ ] Add debounce / file-stability checks.
- [ ] Queue jobs serially.
- [ ] Export via snapshot.
- [ ] Encode MP4.
- [ ] Write a manifest alongside outputs.

### Why it matters

This is the bridge from the authoring tool to a semi-automated production pipeline.

## H. Refactor Debt

### Goal

Reduce the chance of halo/overlay regressions from future feature work.

- [ ] Continue modularizing `src/app/rendering.js` and `src/app/index.js`.
- [ ] Keep halo field logic centralized in shared helpers.
- [ ] Move more render-only / UI metadata into schema rather than maintaining separate ad hoc allowlists.
- [ ] Remove legacy hidden compatibility fields once migration is stable enough.

### Why it matters

A lot of the painful regressions in this project came from patching duplicated logic in large files.

## I. Source Tree Reorganization

### Status

Partially done.

### What changed

- Live application source now lives in `src/app/`.
- `assets/` is now reserved for static assets.
- The build/dev-server still publish browser modules at `/assets/app/*` for runtime compatibility.

### Still remaining

- [ ] Audit docs and helper scripts for any stale path references.
- [ ] Decide later whether the public output path should also change, or whether `/assets/app/*` should remain the stable browser path.
- [ ] Keep the current compatibility mapping until the app is otherwise stable.

## J. Validation Passes Still Worth Doing

These are not necessarily new features, but they should be part of future work:

- [ ] Verify overlay layouts across all active output formats.
- [ ] Verify safe-area behavior in: below-animation mode, above-animation mode, inside-only vignette, outside-only vignette.
- [ ] Verify halo clipping and label behavior on: portrait social, landscape screen, LED-wide formats.
- [ ] Verify overlay text-block subtabs in both formats (`generic_social`, `speaker_highlight`) and confirm each tab edits only its own field layout.

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

- [x] Audit current platform state (Windows, WSL/Linux, macOS) – documented above.
- [ ] Add `requirements.txt` listing `playwright` so the install step is explicit.
- [ ] Add a setup section to `README.md` with per-platform install steps (Windows, WSL/Linux, macOS).
- [ ] Decide how to handle the venv on WSL/Linux: document activation, or add a check at the top of each script that prints a clear install hint if the module is missing.
- [ ] Fix the frame filename padding vs ffmpeg glob mismatch: `export_frames.py` uses `max(4, len(str(max(frames))))` digits but `encode_mp4.py` hardcodes `frame-%04d.png`. At 10 000+ frames ffmpeg fails to match files – cap at 4 digits or make the pattern dynamic.

### Why it matters

The project may move to a Linux or macOS machine. The scripts are structurally cross-platform already; they just need declared dependencies and a setup path that does not require reverse-engineering the environment.

## Suggested Execution Order

If another model needs a practical order, use this:

- [x] Move safe area into output profile metadata (B)
- [x] Finish overlay data model cleanup (A)
- [ ] Add requirements.txt and cross-platform setup docs (K)
- [ ] Finish stakeholder-friendly CSV flow (D)
- [ ] Debug local MP4 export button end to end (F)
- [ ] Implement watch-folder automation (G)
- [ ] Continue deeper refactor only after the overlay model is stable (H)
