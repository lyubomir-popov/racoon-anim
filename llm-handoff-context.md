# LLM Handoff Context

## Use This Repo

Work in:

- `h:\HOUDINI PROJECTS\RacoonTail\mascot-animation-clean-port`

Do not treat the old repo as the active implementation:

- `h:\HOUDINI PROJECTS\RacoonTail\mascot-animation`

That older repo is useful only for reference or for checking legacy behavior. The clean-port repo is the active codebase.

## Current Git State

This repo has moved quickly during the refactor.

Do not trust any older hardcoded SHA from previous notes.

Instead, when taking over:

- check `git status`
- check `git log -1 --oneline`
- confirm whether the user is reviewing `main` or `codex/spoke-clean-port`

## High-Level Product Model

This is a flat 2D Ubuntu Summit / Resolute Raccoon animation system with:

- a mascot head in the middle
- a procedural spoke halo around it
- a reveal phase, then a breathing / folded spoke loop
- optional overlay layout for branded social / screen compositions
- browser authoring UI plus Python export tooling

The system targets:

- Instagram story / social layouts
- larger screens such as `3840x2160`
- LED-wall scale render output

## Core Invariants

### 1. Clean visual language

- flat 2D only
- no lighting / faux-3D styling
- white and charcoal palette
- orange comes from the Ubuntu tag logo overlay, not the animation itself

### 2. The halo behavior is intentional

- asymmetric fold / breathing is already tuned
- phase masks matter
- the reveal-to-breath handoff has historically been regression-prone

### 3. The `2.0` prototype is a visual/math reference

- `2.0/` is a sandbox/reference, not the active product path
- it helped establish correct phase orientation, fold logic, and mask behavior
- do not backport from memory; inspect it if a halo behavior regresses

## Important Architecture Decisions Already Made

### Overlay and output settings

The project is now split conceptually into:

- global shared settings
  - brand-level choices
  - colors
  - some shared overlay assets/text
- output-format-specific settings
  - composition/layout/grid/safe-area/tuned per screen size

Output-format switching is intended to swap local settings for the selected format.

Important nuance:

- this is implemented, but the model is still evolving
- some overlay state is still projected through runtime fields for compatibility

### Overlay content formats

There is now a content-format concept in addition to output-format:

- `generic_social`
- `speaker_highlight`

These formats currently map into the runtime fields:

- `main_heading`
- `text_1`
- `text_2`
- `text_3`

So the format system exists, but the renderer still has fixed-slot assumptions internally.

Important current nuance:

- the A-head / summit heading is still fixed brand content from `overlay_text.title_text`
- CSV currently drives the variable fields below it
- `speaker_highlight` CSV now includes a `speaker_photo` path, but photo-card runtime/layout work is still future work

### Grid-based overlay placement

Overlay text layout is moving away from raw XY fiddling.

Current state:

- Y placement is baseline-based
- X placement is keyline-based
- width is now grid-based using column span

That means text blocks should be positioned using:

- keyline / column index
- baseline row offset
- span in columns

not raw pixel X and pixel max width

Legacy pixel fields still exist in hidden compatibility form so older defaults/presets can migrate.

Recent additions:

- left and right margins are now independent baseline controls
- the old shared `margin_side_baselines` is now a hidden migration fallback
- startup HTML/CSS background was aligned to the composition default to avoid a lighter flash on reload

### Overlay text-block tabs

The overlay text-block tabs are sensitive right now.

Recent finding:

- the UI needs to follow the Vanilla tabs interaction pattern more closely
- this is not just styling; the relevant behavior is in:
  - `h:\WSL_dev_projects\vanilla-framework\templates\static\js\tabs.js`

If another model touches subtab behavior, preserve:

- real `aria-controls` on the tab buttons
- `aria-labelledby` on the tabpanels
- active-on-focus/click behavior
- hidden inactive panels

Also re-test both content formats:

- `generic_social`
- `speaker_highlight`

Concrete recent bug to remember:

- inactive panels were still visible because author CSS (`display:grid`) overrode the browser's default `[hidden]` behavior
- fix was to add an explicit `.overlay-subtabs__panel[hidden] { display:none !important; }`

### Safe area model

Safe area exists and can:

- constrain layout/grid
- have its own fill color
- render below or above the animation

There is also a split vignette model:

- inside safe area
- outside safe area

This is still an area of active refinement.

### Halo field clipping

One of the most important recent fixes:

- the legacy phase clip radius and the larger field/clearance radius must not be conflated

Current intended split:

- legacy radius:
  - thick inner spoke clipping
  - original point/dot field clipping
- enlarged radius:
  - clearance / large-format field behavior
  - not used to lengthen thick inner spokes

This was re-fixed recently after a regression where thick spokes became too long.

## Release Label Behavior

Release labels on the spokes have a few critical rules:

- they are tied to spoke identity, not live display angle
- they should not reshuffle when spoke spacing changes
- they have their own background patch for readability
- current release is pinned to the intended pinned spoke
- only the actual Ubuntu release count gets labels; the remaining spokes can stay unlabeled

Also:

- labels and mixed shapes are supposed to stay pinned to spokes
- changes in spacing should alter scale/spacing, not identity

## Export Architecture

### Browser export

The browser UI supports:

- still export
- PNG sequence export
- MP4 export button (prompts for frame count before starting)

But:

- MP4 export is only expected to work when running the local authoring server (`npm run dev`)
- GitHub Pages / static hosting cannot run the Python backend pipeline
- if the browser page is not served by `npm run dev`, clicking Export MP4 will get a `Failed to fetch` error – this is expected and correct

### Python export

The repo already has:

- `scripts/export_frames.py`
- `scripts/export_snapshot.py`
- `scripts/encode_mp4.py`

These are the real long-render tools and are important for stable unattended output.

Snapshot export is especially important because it avoids background edits affecting a long render.

### Export quality fixes (done 2026-03-24)

Several issues were found and fixed in one session:

**Background colour outside safe area was black in MP4:**
- Root cause: `THREE.WebGLRenderer` was created without `preserveDrawingBuffer: true`
- In headless Playwright the framebuffer was not guaranteed to survive until `drawImage()` read it; transparent pixels encoded as black by ffmpeg
- Fix: added `preserveDrawingBuffer: true` to the WebGLRenderer constructor in `rendering.js`
- Also fixed: `STAGE_BACKGROUND_COLOR` fallback constant was `#262626`; corrected to `#202020` to match the authored default

**Text was not crisp in exported frames:**
- Root cause: `export_frames.py` was opening the headless Playwright context with `device_scale_factor=1`
- This meant `window.devicePixelRatio=1` → `runtime.dpr=1` → text overlay canvas rasterised at exactly 1080×1920 with no supersampling
- Fix: default `device_scale_factor` changed to `2` – both the Three.js WebGLRenderer and the Canvas 2D text overlay now rasterise internally at 2×, composite down to the output size
- The output PNG dimensions are unchanged (still 1080×1920); only internal rasterisation quality increases
- Exposed as `--device-scale-factor` CLI arg on both `export_frames.py` and `export_snapshot.py`
- For very large formats (LED wall 7680×2160) pass `--device-scale-factor 1` to avoid excessive memory

**MP4 encoding (banding and platform upload quality):**
- Previous default: CRF 10, `yuv444p`, keyframe every 2 seconds → P-frame banding on dark animations
- UI export path now uses `--delivery --all-intra`:
  - `yuv420p` (all platforms ingest to 420p anyway; doing it ourselves is cleaner)
  - CRF 14 (high quality delivery ceiling)
  - BT.709 colour space tags on all three ffmpeg metadata fields
  - H.264 level 4.1 (universally safe for 1080p on Instagram, YouTube, LinkedIn, X)
  - every frame a keyframe (`-g 1 -keyint_min 1 -sc_threshold 0`) – eliminates inter-frame prediction banding
- The `yuv444p` CRF 10 archival path is still available via CLI without `--delivery`

**MP4 export frame count prompt:**
- Previously derived silently from animation duration; now prompts with the full loop as suggested default, consistent with PNG sequence export

## What Has Historically Caused Regressions

These are the things future edits should be careful around:

1. Reveal path and post-finale loop using slightly different halo logic
2. Shared radius values doing two jobs at once
3. Release labels using angular position instead of stable spoke identity
4. Overlay controls drifting into redundant pixel-based layout even after grid-based refactors
5. Static/browser-hosted UI suggesting capabilities that only work on the local authoring server

## Current Likely Open Areas

These are not necessarily broken right now, but they are the active zones of unfinished design/refactor work:

- fully data-driven multi-CSV overlay formats
- safe area as true output-profile metadata
- stakeholder-friendly CSV upload UI
- further modularization of `rendering.js` and `index.js`
- cross-platform Python dependency setup (requirements.txt + README install steps)

## Recommended Startup Checklist For The Next LLM

1. Run `git status`
2. Confirm whether work should continue on:
   - local `codex/spoke-clean-port`
   - or whatever branch/commit the user is currently reviewing
3. Re-read:
   - `history.md`
   - `remaining-work.md`
   - `art-direction-plan.md`
4. If touching halo behavior:
   - inspect `src/app/halo-field.js`
   - inspect `src/app/rendering.js`
   - avoid reintroducing the shared-radius regression
5. If touching overlay behavior:
   - inspect `src/app/config-schema.js`
   - inspect `src/app/index.js`
   - preserve output-format/local vs global setting separation
