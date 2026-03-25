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

