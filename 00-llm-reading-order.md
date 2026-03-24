# LLM Reading Order

Use this file to orient a new model quickly.

## Read In This Order

1. `README.md`
   - broad repo behavior
   - output/global setting model
   - local dev/build workflow

2. `llm-handoff-context.md`
   - current implementation context
   - active invariants
   - current git/repo assumptions

3. `history.md`
   - what has already been built
   - why certain subsystems ended up the way they are

4. `remaining-work.md`
   - what is still open
   - thematic execution order

5. `art-direction-plan.md`
   - visual intent
   - the aesthetic/motion constraints that should not be broken

## If Working On Halo / Spokes

Then also read:

6. `spoke-fold-spec.md`
7. `src/app/halo-field.js`
8. `src/app/rendering.js`

## If Working On Overlay / Layout

Then also read:

6. `src/app/config-schema.js`
7. `src/app/index.js`
8. `src/app/rendering.js`
9. `src/app/default-config-source.js`

## Source Tree Note

The repo has already been improved once:

- live app source now lives in `src/app/`
- `src/` contains the HTML shell and SCSS
- `assets/` is for static assets

Public output still serves the browser JS from `/assets/app/*` for compatibility, but that is now a build/dev-server mapping, not the source-of-truth directory layout.
