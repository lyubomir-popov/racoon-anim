# Overlay Multi-CSV Implementation Plan

## Goal

Support multiple overlay content schemas without changing the shared Ubuntu Summit art direction:

- the Ubuntu tag logo and the main heading remain constant across deliverables
- the remaining text fields come from selectable CSV formats
- each CSV format can define its own field set and its own layout controls
- typography is constrained to three shared text styles
- layout must scale cleanly across all output formats
- safe area becomes a first-class per-format abstraction, defaulting to zero insets when not specified

## Status

### Done

- `Overlay` is the first tab
- baseline and composition grid overlays exist
- separate top, side, and bottom margin controls exist in baseline units
- safe-area layout exists, including additive offsets
- safe-area panel can render either below or above the animation
- overlay copy is CSV-driven
- content format selector exists:
  - `Social Media Post - Generic`
  - `Speaker Highlight`
- per-format CSV path and per-format text-field layout are plumbed through runtime config
- summit heading/logo are treated as fixed brand content
- text styles are now named:
  - `A-head`
  - `B-head`
  - `Paragraph`
- inside-safe-area and outside-safe-area vignette controls are split

### Partially Done

- multi-format overlay content is still implemented through projected runtime fields
  - the renderer still resolves into `text_1`, `text_2`, `text_3` internally
  - current formats map their CSV columns onto those runtime slots
- safe area is implemented generically in the overlay system, but not yet stored as first-class metadata inside each output profile definition
- operator-facing format selection exists, but the simplified stakeholder CSV-upload flow does not

### Not Done

- move safe-area defaults into per-profile metadata with `0,0,0,0` fallback
- add row selection by index or ID
- add simplified stakeholder UI for CSV upload / row-driven rendering
- remove the remaining fixed `text_1..text_3` assumptions from the renderer
- extend the format system for photo/image overlays and richer speaker-card layouts

This document started as implementation-only planning and now also tracks what has landed versus what remains.

## Current State

The clean-port repo already has:

- a first-tab `Overlay` UI
- baseline and composition grid overlays
- per-format output profiles
- a safe-area abstraction for the current portrait format
- a CSV-driven text overlay using one fixed schema:
  - `main_heading`
  - `text_1`
  - `text_2`
  - `text_3`

The current overlay system is still too rigid for stakeholder-supplied content because:

- it only supports one CSV schema
- text controls are bound to one fixed field list
- safe area is treated as a special case rather than a generic per-profile property
- logo/main-heading invariants are mixed with variable copy fields

## Design Principles

1. Keep content schema separate from visual style.
2. Treat safe area as profile metadata, not ad hoc overlay math.
3. Keep typography global and limited:
   - Style A: main heading
   - Style B: secondary text
   - Style C: tertiary/meta text
4. Keep field placement configurable per CSV format and per output profile.
5. Preserve graceful fallback:
   - if a profile has no safe area, use `0,0,0,0`
   - if a CSV format omits a field, render nothing for that field

## Proposed Model

### 1. Split overlay into two layers

#### Fixed brand layer

Always present for all formats:

- Ubuntu tag logo
- main heading

These share:

- placement controls per output profile
- size/linking behavior already established in the current overlay system

#### Variable content layer

Driven by a selected CSV format:

- subheading / date / location / speaker / track / CTA / etc.

This layer should not be hardcoded to `text_1..text_3`.

### 2. Introduce CSV format definitions

Add a format registry in config/schema, for example:

- `summit_basic`
- `summit_session`
- `summit_speaker`
- `summit_agenda`

Each format definition should declare:

- human label
- CSV file path
- expected column names
- which text style each field uses
- default visibility/order
- per-field layout controls to expose

Example shape:

```js
{
  key: "summit_session",
  label: "Session Card",
  csv_path: "./assets/content/session.csv",
  fields: [
    { key: "kicker", style: "style_c" },
    { key: "title", style: "style_a" },
    { key: "speaker", style: "style_b" },
    { key: "time_location", style: "style_b" }
  ]
}
```

### 3. Add a CSV format selector

In the `Overlay` tab:

- add a select control: `Overlay Content Format`

Selecting a format should:

- choose which CSV file to read
- choose which fields are active
- show only the placement controls relevant to that format

This avoids clutter from controls for fields not used by the selected template.

### 4. Per-format, per-field layout controls

For every active text field in a CSV format, expose:

- `x_px`
- `y_baselines`
- `max_width_px`

These values should be stored by:

- output profile key
- CSV format key
- field key

Conceptually:

```js
overlay_layout: {
  story_1080x1920: {
    summit_session: {
      title: { x_px, y_baselines, max_width_px },
      speaker: { x_px, y_baselines, max_width_px }
    },
    summit_basic: {
      text_1: { ... }
    }
  }
}
```

This is the critical change that makes the same CSV format usable across IG, LED, screen, tablet, etc.

### 5. Keep typography global

Do not create per-field font sizes.

Instead define three shared text styles:

- `style_a`
  - font size
  - line height
- `style_b`
  - font size
  - line height
- `style_c`
  - font size
  - line height

Each CSV field references one of those styles.

Advantages:

- preserves art-direction consistency
- keeps controls manageable
- makes cross-format scaling predictable

### 6. Make safe area generic per output profile

Every output profile should optionally define:

- `safe_top_px`
- `safe_right_px`
- `safe_bottom_px`
- `safe_left_px`

If omitted, normalize to:

- `0, 0, 0, 0`

This makes the safe area a general property of the profile rather than something special for only the Instagram preset.

Then:

- `Fit Within Safe Area` uses the current profile’s normalized safe-area box
- grid, baseline grid, logo, and text all measure from that box when enabled

### 7. Safe-area offsets remain additive

When `Fit Within Safe Area` is enabled, keep user offsets additive on top of the normalized profile safe area.

Meaning:

- profile safe area defines the baseline protected region
- user offsets allow per-deliverable tuning without changing the profile definition

For example:

- profile says `250/65/250/65`
- user can add `+8 top`, `+16 left`

This is better than editing raw profile metadata every time.

## Recommended Refactor Sequence

### Phase 1. Normalize overlay data model

No visual changes intended.

- extract current overlay config into:
  - profile-safe-area metadata
  - overlay text styles
  - overlay field layout map
  - CSV format registry
- keep current `content.csv` working through a compatibility adapter

Outcome:

- existing Summit layout still renders
- internals can support more than one schema

### Phase 2. Add CSV format selection

- add the select control
- load the chosen CSV schema
- drive visible field controls from format definition
- preserve first-row CSV behavior for now

Outcome:

- operator can switch templates without touching code

### Phase 3. Move per-field layout to format/profile-scoped storage

- move `text_1`, `text_2`, `text_3` layout controls into the nested map
- keep migration from the current single-layout model

Outcome:

- a session template and a speaker template can coexist cleanly

### Phase 4. Generalize safe area by profile

- move current Instagram safe area into the output-profile definitions
- normalize missing values to zeros
- update overlay layout/grid calculations to consume normalized safe area only

Outcome:

- all formats behave consistently
- future screen specs can add safe areas without special-case logic

### Phase 5. CSV row selection / automation integration

After the demo, add:

- row selection by index or ID
- render from a chosen record
- watch-folder / automation integration

Outcome:

- stakeholders can drop a CSV and render multiple assets from rows

## Suggested Schema Direction

### Output profile

Add to each profile:

```js
{
  key: "story_1080x1920",
  width: 1080,
  height: 1920,
  safe_area: {
    top_px: 250,
    right_px: 65,
    bottom_px: 250,
    left_px: 65
  }
}
```

If `safe_area` missing:

```js
safe_area = { top_px: 0, right_px: 0, bottom_px: 0, left_px: 0 }
```

### Overlay content registry

```js
overlay_content_formats: {
  summit_basic: {
    label: "Summit Basic",
    csv_path: "./assets/content.csv",
    fields: [
      { key: "main_heading", style: "style_a", fixed: true },
      { key: "text_1", style: "style_b" },
      { key: "text_2", style: "style_b" },
      { key: "text_3", style: "style_c" }
    ]
  }
}
```

### Overlay layout

```js
overlay_layout_by_profile: {
  story_1080x1920: {
    summit_basic: {
      main_heading: { x_px: 96, y_baselines: 12, max_width_px: 720 },
      text_1: { x_px: 96, y_baselines: 37, max_width_px: 540 },
      text_2: { x_px: 96, y_baselines: 40, max_width_px: 540 },
      text_3: { x_px: 96, y_baselines: 43, max_width_px: 540 }
    }
  }
}
```

## CSV Guidance for Stakeholders

Preferred format:

- real CSV with quoted multiline cells

Keep support for `<br>` as a compatibility layer, but treat it as legacy input.

Recommendation:

- continue accepting `<br>` on import
- normalize to actual line breaks immediately after parsing

This gives flexibility while steering contributors toward cleaner CSV authoring.

## UI Changes After Demo

### Overlay tab

Keep first tab.

Add:

- `Overlay Content Format` select
- `Content CSV Path` or CSV source picker
- per-format field groupings

Likely sections:

- `Grid`
- `Safe Area`
- `Brand Layer`
- `Content Layer`
- `Type Styles`

### Remove current hardcoded assumptions

Once migration is complete:

- remove fixed `text_1/text_2/text_3` assumptions from renderer
- stop exposing irrelevant controls when a format does not use them

## Risks / Watchouts

1. Renderer complexity
   The overlay renderer is already doing layout, logo, and grids. Do not hardcode each new CSV format directly into rendering logic. Keep all schema differences data-driven.

2. Migration debt
   Existing presets/source defaults rely on the current overlay structure. A compatibility loader is necessary during the transition.

3. UI sprawl
   Per-profile and per-format controls can explode quickly. Visible controls must be filtered by the selected output profile and CSV format.

4. Safe-area ambiguity
   Make it explicit whether offsets are:
   - included in profile metadata
   - or additive user adjustments

   Recommended: additive adjustments.

## Deliverable After Demo

When implementation begins, the first coding task should be:

1. introduce normalized per-profile safe area
2. add CSV format registry
3. adapt the current `content.csv` path into that registry without changing visuals

That gives a stable base before adding more templates or watch-folder automation.
