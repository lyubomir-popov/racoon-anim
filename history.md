# History

This file consolidates what has already been done across:

- the art-direction plan
- the watch-folder plan
- the overlay multi-CSV plan
- the long implementation thread that is not fully encoded in the older planning docs

## 1. Project Direction And Repo Split

### What happened

- The original repo became too messy to patch safely.
- A clean-port repo was created:
  - `h:\HOUDINI PROJECTS\RacoonTail\mascot-animation-clean-port`
- The older repo remained as reference only.
- A `2.0/` sandbox/prototype was built to prove the spoke-fold and phase ideas without disturbing the production path.

### Why this matters

Many current behaviors in the clean-port repo were first validated in `2.0/`, then selectively ported.

## 2. Halo / Spoke Animation Work

### Major accomplishments

- restored the correct phase orientation
- removed multiple reveal/breath handoff regressions
- stabilized the folded spoke behavior
- pinned release labels and mixed echo identities to spoke identity rather than live angle
- added breathing-related eye/nose bundled motion behavior
- restored the legacy clip radius for:
  - thick white inner spokes
  - original point/dot field
- kept a larger field radius for large-format clearance behavior

### Important consequence

The halo system is now much closer to the intended art direction, but it is still sensitive. Halo geometry, masks, and overlay behavior should be changed carefully.

## 3. Echo Markers And Release Labels

### Added / implemented

- multiple echo shapes:
  - dots
  - pluses
  - triangles
  - mixed
  - Ubuntu release labels
- deterministic seed for mixed markers
- shape stroke width decoupled from thin outer spoke width
- shape scale multiplier
- sparse-density shape boost
- plus markers aligned to the spoke direction
- release labels tied to spoke index
- release label background patch for readability

### Related design decisions

- label text should behave more like one more spoke-attached echo layer than like an unrelated floating overlay
- readability on top of construction lines matters

## 4. Overlay / Layout System

### Grid and baseline system

Implemented:

- baseline grid
- composition grid
- margins expressed in baseline units
- separate top / bottom / side margin controls
- separate row and column gutter controls in baseline units
- overlay visibility controls
- keyline-based horizontal text placement
- grid-based text width via column spans

### Safe area system

Implemented:

- safe area box
- safe-area fill color
- ability to place the safe-area panel:
  - below animation
  - above animation
- separate inside-safe-area and outside-safe-area vignette behavior

### Overlay content

Implemented:

- logo overlay
- text overlay
- overlay is first tab
- styles labelled:
  - `A-head`
  - `B-head`
  - `Paragraph`
- content now driven from CSV
- content format selector added with:
  - `Social Media Post - Generic`
  - `Speaker Highlight`

### Important caveat

The content-format system is only partially generalized. Internally, the renderer still resolves into fixed runtime slots (`text_1..text_3`).

## 5. Output / Export Tooling

### Browser-side improvements

- still export
- PNG sequence export
- export folders organized by output dimensions
- export prompts adjusted so output directories are explicit

### Python tooling added

- headless frame exporter
- snapshot exporter
- MP4 encoder
- FFmpeg integration

### Important operational truth

Python-backed export only works on the local authoring server, not on GitHub Pages.

## 6. Art Direction Plan Status

### Mostly completed or materially represented

From `art-direction-plan.md`, these are effectively landed or substantially represented in the live project:

- breathing system
- restrained monochrome palette
- staggered reveal/capture behavior
- extra echo shapes
- Ubuntu release labels on spokes
- logo as separate orange accent

### Still relevant as reference, not literal truth

`art-direction-plan.md` should now be read as design intent, not as a line-by-line implementation spec. Some details were adjusted later in the live build.

## 7. Future Watch-Folder Plan Status

### Implemented prerequisites

The repo already has the core export tools the future watch-folder workflow would need:

- headless frame export
- snapshot export
- MP4 encoding

### Not implemented yet

The actual watch-folder automation is still only a plan. There is no finished watcher/orchestrator yet.

## 8. Overlay Multi-CSV Plan Status

### Implemented foundation

- content format selector exists
- per-format CSV path exists
- per-format text layout exists in projected form
- CSV-driven overlay content is active

### Still incomplete

- safe area is not yet a clean first-class output-profile metadata system
- renderer still relies on fixed runtime field slots
- stakeholder upload flow does not exist yet

## 9. Recent Commit Landmarks

Not exhaustive, but helpful recent milestones:

- `40583f8` `Drive overlay text from CSV content`
- `80e5685` `Fix large-format halo scaling and masks`
- `fcda31b` `Expand overlay formats and MP4 export`
- `dc1757a` `Split global and output-specific editor settings`
- `9b21407` `Restore legacy halo clip radius behavior`
- `cef273e` `Refine overlay editor keyline layout`
- `9594533` `Make overlay text width grid-based`

Use Git log for the full sequence, but these are good landmarks when orienting a new model.
