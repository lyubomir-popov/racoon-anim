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

