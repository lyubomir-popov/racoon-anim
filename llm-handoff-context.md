# LLM Handoff Context

## Use This Repo

Work in:

- `h:\HOUDINI PROJECTS\RacoonTail\mascot-animation-clean-port`

Do not treat the old repo as the active implementation:

- `h:\HOUDINI PROJECTS\RacoonTail\mascot-animation`

That older repo is useful only for reference or for checking legacy behavior. The clean-port repo is the active codebase.

## Current Git State

At the time this handoff was written:

- active branch: `codex/spoke-clean-port`
- local HEAD: `9594533` `Make overlay text width grid-based`
- local branch is ahead of `origin/codex/spoke-clean-port` by 2 commits

If another LLM takes over, check `git status` first and do not assume `origin/main` contains the latest local work.

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
- MP4 export button

But:

- MP4 export is only expected to work when running the local authoring server (`npm run dev`)
- GitHub Pages / static hosting cannot run the Python backend pipeline

### Python export

The repo already has:

- `scripts/export_frames.py`
- `scripts/export_snapshot.py`
- `scripts/encode_mp4.py`

These are the real long-render tools and are important for stable unattended output.

Snapshot export is especially important because it avoids background edits affecting a long render.

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
- local MP4 export button debugging
- further modularization of `rendering.js` and `index.js`

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
