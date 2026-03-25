# Roadmap

## Phase 0: Current prototype to product kernel

Goal:

- extract the layout logic from the current animation-specific app

Deliverables:

- explicit document model
- explicit template model
- explicit output-format model
- explicit content-format model
- renderer-agnostic layout engine

## Phase 1: Campaign asset engine

Goal:

- produce reliable social/event assets from structured data

Features:

- generic social template
- speaker highlight template
- session template
- CSV row selection
- batch still export
- MP4 export for animated variants

Success metric:

- one marketing team can produce a campaign set without manual design intervention

## Phase 2: Stakeholder workflow

Goal:

- turn the operator tool into a usable system for non-designers

Features:

- simplified upload UI
- template chooser
- validation errors for malformed CSV
- preset/template locking
- queue/batch processing

Success metric:

- non-designers can generate assets without touching low-level layout controls

## Phase 3: Brand system and governance

Goal:

- make this attractive to teams, not just individuals

Features:

- locked brand tokens
- reusable template libraries
- approval workflows
- auditability of layout rules

Success metric:

- design lead sets the system once
- team uses it repeatedly

## Phase 4: Print and richer editorial layouts

Goal:

- move from social/editorial motion into broader design workflows

Features:

- richer page composition
- image frames
- multi-block content systems
- vector/PDF export backend
- print-oriented preflight

Success metric:

- one commercial-quality print/export workflow works reliably

## Phase 5: Platform

Goal:

- become the design operating system for structured branded content

Possible expansions:

- APIs
- CMS integration
- watch-folder/automation
- enterprise brand systems
- template marketplace

## Risks

### Risk 1: Too broad too early

Mitigation:

- stay on social/editorial campaign workflows first

### Risk 2: Renderer-led architecture

Mitigation:

- keep layout/document model independent of rendering backend

### Risk 3: Designer skepticism

Mitigation:

- target teams where designers set rules and non-designers execute

### Risk 4: Print complexity too early

Mitigation:

- treat print as later backend work

