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

## GitHub Pages

This project includes a GitHub Pages workflow in `.github/workflows/deploy-pages.yml`.

After pushing the repo to GitHub:

1. Open repository `Settings`.
2. Open `Pages`.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.
4. Push to `main` or run the workflow manually from the `Actions` tab.
