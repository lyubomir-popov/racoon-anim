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
3. Ensure field naming and tabs reflect the active format naturally.

### Why it matters

The user explicitly wants multiple overlay template types, not just one generic block of text.

## F. Export UX

### Goal

Make local export robust and make static-hosting limitations obvious.

### Still remaining

1. Debug the local `Export MP4` button end to end on the authoring server.
2. Ensure the UI clearly communicates:
   - local dev server: MP4 export supported
   - GitHub Pages/static build: MP4 export not available
3. Consider disabling or relabeling MP4 export automatically on static builds.

### Why it matters

Right now users can infer the button works everywhere, but the Python backend only exists locally.

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
   - `assets/app/rendering.js`
   - `assets/app/index.js`
2. Keep halo field logic centralized in shared helpers.
3. Move more render-only / UI metadata into schema rather than maintaining separate ad hoc allowlists.
4. Remove legacy hidden compatibility fields once migration is stable enough.

### Why it matters

A lot of the painful regressions in this project came from patching duplicated logic in large files.

## I. Validation Passes Still Worth Doing

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

## Suggested Execution Order

If another model needs a practical order, use this:

1. finish overlay data model cleanup
2. move safe area into output profile metadata
3. finish stakeholder-friendly CSV flow
4. debug local MP4 export button
5. implement watch-folder automation
6. continue deeper refactor only after the overlay model is stable

