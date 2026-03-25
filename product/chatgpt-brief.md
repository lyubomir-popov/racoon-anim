# Product Brief For ChatGPT

This file concatenates the product strategy notes in one place so the discussion can be moved into another chat without chasing multiple files.

---

# Product Package

This folder is a product/venture memo set for the design-tool direction discussed in chat.

Suggested reading order:

1. `thesis.md`
2. `mvp.md`
3. `architecture.md`
4. `roadmap.md`
5. `yc-angle.md`

The core position is:

- do not try to replace Figma, Canva, Illustrator, InDesign, and After Effects at once
- build a grid-first, constraint-based layout engine for branded editorial/social output
- use the renderer as a backend, not as the product's core truth

---

# Product Thesis

## One-line thesis

Build the first web-native design tool that teaches and enforces rigorous graphic design process instead of letting users improvise layouts freely.

## What problem it solves

Teams currently have a gap between:

- powerful but expert-heavy tools
  - InDesign
  - Illustrator
  - motion/design suites
- easy but conceptually sloppy tools
  - Canva-like editors

The gap is especially visible in marketing teams where:

- non-designers produce daily social assets
- brand teams want consistency
- trained designers cannot review every post

The opportunity is not "make another editor".

The opportunity is:

- encode the layout rules
- encode typographic discipline
- encode grid logic
- encode reusable format systems
- let non-designers produce better work by following the tool

## Core product belief

The tool should not ask:

- "Where do you want to put this?"

It should ask:

- "Which grid field should this align to?"
- "Which text style is this?"
- "Which template type are you using?"
- "Which output format are you targeting?"

This turns graphic design from freehand positioning into constrained composition.

## Why this is interesting now

Three forces make this attractive:

1. Content volume is exploding.
2. Marketing teams need many formats for the same campaign.
3. AI is making content generation easier, which increases the need for design systems and layout discipline.

## Important framing

The wedge is not:

- "better Figma"

The wedge is:

- rigorous branded social/editorial systems
- template-driven campaign production
- guardrailed layout for non-designers

## Target user

Primary:

- social media managers
- campaign managers
- event marketing teams
- brand/content operations teams

Secondary:

- designers building reusable systems for those teams

## Anti-positioning

This product should explicitly reject:

- arbitrary dragging as the primary interaction model
- freehand "close enough" positioning
- layout by taste rather than by system

It should feel more like:

- editorial design software
- a design system compiler
- a motion-capable brand layout engine

---

# MVP

## MVP goal

Enable a marketing team to generate high-quality, on-brand campaign assets across multiple output sizes without needing a designer to manually place each element.

## Narrow first use case

Ubuntu Summit / event marketing style assets:

- generic campaign card
- speaker highlight card
- session highlight card
- date/location variant

Outputs:

- `1080x1920`
- `1080x1350`
- `1280x720`
- `3840x2160`

## MVP promise

"Give us the campaign data and choose a format. The tool will produce layouts that follow typographic and grid rules by default."

## MVP features

### 1. Format-aware layout engine

- output-size-specific layout settings
- safe area per format
- baseline grid
- column grid
- keyline-based text placement
- span-based text width

### 2. Template/content formats

- generic social
- speaker highlight
- session highlight

Each format defines:

- required CSV columns
- text fields
- style mapping
- optional media fields

### 3. Brand system

- global colors
- logo asset
- global type scale
- per-format layout overrides

### 4. Structured content ingestion

- CSV upload
- one row = one asset
- preview selected row
- batch export

### 5. Export

- PNG still
- PNG sequence
- MP4 for animated variants
- exact-size output folders per format

## Explicitly out of MVP

- general-purpose drawing tools
- arbitrary bezier editing
- full collaborative multiplayer editing
- CMYK-accurate print workflow
- a plugin ecosystem
- full document design parity with InDesign

## Success criteria

The MVP is successful if a non-designer can:

1. choose a template type
2. upload campaign CSV data
3. select an output format
4. export a visually disciplined asset

without manually dragging every text box into place.

## MVP product surface

There should be two surfaces:

### Operator mode

Used by the design systems owner.

- tune grids
- tune safe areas
- set type styles
- set output-format layouts
- validate templates

### Stakeholder mode

Used by marketing/content teams.

- choose template
- upload CSV
- choose row(s)
- export

Stakeholder mode is critical to the product thesis.

---

# Product Architecture

## Short answer on Three.js

Three.js is acceptable as a preview/export backend.

It is not ideal as the canonical document model.

## Why

The product's value is:

- layout semantics
- constraints
- style systems
- export correctness

not 3D scene management.

Three.js is strong for:

- fast rendering
- animation
- GPU-heavy visual layers
- large raster/video previews

But it is weak as the core representation for:

- editable text semantics
- precise vector export
- print-oriented document structure
- long-term document interoperability

## Recommended architecture

### 1. Canonical document model

Own this in TypeScript.

It should represent:

- page/frame
- output format
- safe area
- baseline grid
- column grid
- keylines
- styles
- layout rules
- template/content format
- content records

This is the real product.

### 2. Layout engine

A deterministic engine that resolves:

- where each element goes
- how wide it is
- which style it uses
- overflow/wrap behavior
- per-format placement

This engine should not depend on Three.js.

### 3. Rendering backends

Use multiple backends for different jobs.

#### Interactive/animated preview

- Canvas 2D or Three.js/WebGL

#### Raster export

- existing render path
- headless snapshot export

#### Vector / print-oriented export

- separate backend later
- likely SVG/PDF/Skia-style renderer

## Browser rendering recommendation

For a browser editor, it is reasonable to do:

- custom layout engine
- Canvas/WebGL preview
- separate export backends

This is likely better than making SVG DOM the primary runtime for a large editor.

The reason is practical:

- browser SVG becomes expensive and awkward at scale
- large numbers of nodes, text objects, masks, and interactions tend to become painful
- you will likely hit similar constraints that pushed other browser tools toward canvas-like rendering

So the right answer is usually:

- not SVG-first runtime
- but SVG/PDF-capable export backend

## Suggested stack

### Near term

- current TypeScript app
- custom layout model
- current Canvas/Three preview
- Python export pipeline

### Medium term

- scene/document model separated from renderer
- worker-based layout evaluation
- row-based batch generation
- simplified stakeholder UI

### Longer term

- dedicated vector/PDF backend
- print support
- color-management/CMYK workflow via backend pipeline

## Technical moat

The moat is not "we use Three.js".

The moat is:

- rigorous constraint-based layout
- editorial-grade grid logic
- brand system templates
- multi-format asset generation
- guided design decisions

## Print and CMYK

Print is possible later, but it should not drive the MVP architecture.

Treat print as:

- a dedicated export backend
- with separate PDF/color-management concerns

Do not force the browser preview engine to solve print first.

---

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

---

# YC / Venture Angle

## The right framing

Do not pitch this as:

- "Canva but better"
- "Figma but more rigorous"
- "new design software"

Those are too broad and will sound naive.

## Better framing

Pitch it as:

- a constraint-based brand layout engine
- a design system compiler for marketing assets
- editorial-grade layout discipline for non-designers

## Core startup claim

Marketing teams already create huge volumes of content.

The bottleneck is not content generation.

The bottleneck is:

- consistent layout quality
- brand correctness
- designer review bandwidth

So the product is not primarily a creative playground.

It is a production system for high-quality branded output.

## Wedge

Start with:

- event marketing
- speaker cards
- session promos
- campaign derivatives across many aspect ratios

Why this wedge works:

- repetitive structure
- high format variation
- clear brand constraints
- frequent deadlines

This is where a disciplined layout engine is much more valuable than a blank canvas.

## YC-friendly story

Possible pitch:

"We are building a grid-first design system tool for marketing teams. Instead of giving non-designers an empty canvas, we encode editorial design rules directly into the software. Teams upload structured campaign data and get on-brand assets across every required format."

## What investors may like

- strong pain point
- high content volume
- clear automation story
- team workflows
- potential to expand from social into broader brand production

## What they may challenge

- why this is not just a feature inside Canva
- whether the market is big enough
- whether non-designers will accept constraints
- whether designers will trust it

## Good answer

The answer is that the product is not a freeform editor.

It is a production system where:

- designers define the rules
- teams execute within the rules

That is a different product category from "general-purpose design canvas".

## Practical advice

If you pitch this, do not lead with:

- rendering technology
- CMYK as a near-term differentiator
- "first rigorous graphic design app"

Lead with:

- faster campaign production
- better brand consistency
- fewer designer review cycles
- multi-format output from structured content

That is easier to understand and easier to fund.
