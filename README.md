# Mascot Animation

## Folders

- `src/`: web source
- `assets/`: mascot assets used by the page
- `houdini/`: source wrangles from Houdini
- `references/`: visual reference screenshots
- `scripts/`: local tooling

## Local dev

Run:

```bash
npm run dev
```

That starts a small local server with automatic browser reload when files in `src/` or `assets/` change.

## Build

Run:

```bash
npm run build
```

That writes a deployable static site to `dist/`.

## Overlay Workflow

There are now two levels of tuning in the editor:

- `Output`
  This is where you choose the active screen size and export from it.
- `Presets`
  This is where you edit the global shared settings that should stay consistent across every screen size.

### What switches with Output Format

Changing `Output Format` now swaps in the local settings stored for that screen size. In practice, this means the following can differ per output size:

- composition scale
- mascot size and offsets
- grid rows / columns
- baseline step
- margins
- safe-area inset values
- logo placement
- text block `x / y / max width`
- text style sizes and line heights
- vignette values
- export frame rate

So if you tune `1080x1920`, switch to `1280x720`, and then switch back, each format keeps its own local layout.

### What stays global

The following settings are currently shared across every output size:

- stage / safe-area / spoke / label / mascot colors
- summit heading text
- logo asset path
- active overlay content format

These are edited in the `Presets` tab.

### Overlay content formats

`Overlay Content Format` is still independent from `Output Format`.

It changes:

- which CSV schema is active
- which text-block sub-tabs you see in the overlay editor

Each output size keeps separate text-block layout for each content format. So `Speaker Highlight` at `1080x1920` can have different placement from `Speaker Highlight` at `3840x2160`.

### Recommended operator workflow

1. Open `Output` and choose the screen size.
2. Open `Overlay` and choose the content format.
3. Tune the local layout for that screen size.
4. Open `Presets` and adjust any global shared colors/brand settings if needed.
5. If you want the current state to become the tracked repo default, use `Write Source Default`.

### Generic social layout

For `Social Media Post - Generic`, the overlay tab is organized as:

- `Text Styles`
  - `A-head`
  - `Paragraph`
- `Text Blocks`
  - `A-head`
  - `Paragraph 1`
  - `Paragraph 2`

`Paragraph 2` contains the two stacked footer lines.

### CSV notes

The current formats expect:

- `Social Media Post - Generic`
  - `text_1`
  - `text_2`
  - `text_3`
- `Speaker Highlight`
  - `session_title`
  - `speaker_name`
  - `speaker_role`

Quoted multiline CSV cells are supported. `<br>` is also accepted and converted into line breaks on import.

## Houdini

The `houdini/` folder includes the wrangles that mirror the current browser logic:

- `dot-generator.vex`: spoke/orbit topology, including the current flipped spoke direction and mask-based point cull
- `transition.vex`: orbit motion, capture timing, orbit unlock timing, and frontier-driven `pscale`
- `mascot-shake-blink.vex`: head shake + eye blink/squint timing, with optional direct point-group transforms for imported mascot geometry

## GitHub Pages

This project includes a GitHub Pages workflow in `.github/workflows/deploy-pages.yml`.

After pushing the repo to GitHub:

1. Open repository `Settings`.
2. Open `Pages`.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.
4. Push to `main` or run the workflow manually from the `Actions` tab.
