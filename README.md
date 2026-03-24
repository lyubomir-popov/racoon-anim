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

There are two independent selectors in the editor:

- `Output Format`
  This changes the canvas size and default export frame rate.
- `Overlay Content Format`
  This changes which CSV schema is active and which text-block layout controls you are editing.

### What is currently format-specific

The following settings are currently stored per **overlay content format**:

- `Active Format CSV Path`
- text-block placement for the active format:
  - `x`
  - `y`
  - `max width`

So if you switch `Overlay Content Format` from `Social Media Post - Generic` to `Speaker Highlight`, adjust the text-block controls, and switch back, each format keeps its own text layout.

### What is currently shared

The following settings are still shared across output sizes unless you save separate presets:

- grid rows / columns
- baseline step
- margins
- safe-area inset values
- logo placement
- text style sizes and line heights
- vignette settings

That means if you switch from `1080x1920` to `1280x720`, the previous safe-area values may look too large or too small for the new canvas until you retune them.

### Recommended operator workflow

1. Choose the `Output Format`.
2. Choose the `Overlay Content Format`.
3. Tune the overlay for that combination.
4. Save a preset for that deliverable.
5. If you want those values to become the repo defaults, use `Write Source Default`.

### Generic social layout

For `Social Media Post - Generic`, the overlay tab is organized as:

- `Text Styles`
  - `A-head`
  - `B-head`
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
