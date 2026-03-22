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
