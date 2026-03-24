# Future Watch-Folder Plan

## Goal

Watch a Google Drive-synced local folder for incoming text data files, then automatically render a video using the current animation design plus overlaid text.

This should work without using the browser UI manually.

## Recommended Approach

Do not watch Google Drive's API directly.

Instead:

1. Use Google Drive for desktop to sync a folder onto the local machine.
2. Watch that local filesystem folder with Python.
3. Treat each new or updated CSV file as a render job.
4. Export frames with the existing headless renderer.
5. Encode the frames to MP4.

This is simpler, more reliable, and fits the current repo tooling.

## Existing Building Blocks

The repo already has most of what is needed:

- `scripts/export_frames.py`
  Headless browser renderer for frame export.
- `scripts/export_snapshot.py`
  Frozen-build export so background edits do not affect a running render.
- `scripts/encode_mp4.py`
  MP4 encoding from exported PNG frames.

So the missing pieces are:

- a folder watcher / job orchestrator
- a text-overlay input path
- job bookkeeping

## Proposed Flow

1. Google Drive syncs a shared folder locally.
2. A Python watcher monitors that local folder.
3. When a CSV appears or changes:
   - wait briefly for the save to finish
   - verify the file size has stabilized
   - parse the job
4. Create a render payload from the CSV row(s).
5. Render via the frozen snapshot exporter.
6. Encode the result to MP4.
7. Move the source CSV into:
   - `processed/` on success
   - `failed/` on error
8. Write a job log / manifest alongside the output.

## Why Snapshot Export Matters

The current project is edited actively while rendering.

Using `scripts/export_snapshot.py` avoids:

- half-finished changes entering a render
- file-watch reloads interrupting a long export
- background edits from another agent changing output mid-run

The watcher should export only from a frozen snapshot, not from the live source tree.

## CSV Model

Use CSV rows as jobs, not per-frame instructions.

Example:

```csv
job_id,text,profile,frame_count,fps
summit-001,"Ubuntu Summit 26.04",story_1080x1920,480,30
summit-002,"Resolute Raccoon",screen_3840x2160,720,24
```

Possible later expansion:

```csv
job_id,title,subtitle,profile,frame_count,fps,preset
summit-003,"Ubuntu Summit","Resolute Raccoon",story_1080x1920,480,30,preset-1
```

## Text Overlay Strategy

Two options:

### Option A: Renderer-integrated overlay

Best if the text should feel native to the design.

Pros:

- matches the project visual style
- predictable placement and scaling per output profile
- can participate in vignette / composition logic

Cons:

- requires adding a text payload path into the renderer

### Option B: FFmpeg post-overlay

Best only for very simple, flat title text.

Pros:

- faster to prototype
- keeps renderer unchanged

Cons:

- text feels less integrated
- harder to align with design behavior

Recommended: Option A.

## Watcher Design

Suggested script:

- `scripts/watch_jobs.py`

Responsibilities:

- watch an input folder with `watchdog`
- debounce saves
- queue jobs
- prevent concurrent exports
- call:
  - `export_snapshot.py`
  - `encode_mp4.py`
- move source files to `processed/` / `failed/`
- write logs and manifests

Suggested folder layout:

```text
watch/
  inbox/
  processed/
  failed/
  output/
  logs/
```

## Debounce / Stability Rules

Needed because synced files may arrive in chunks.

Before accepting a CSV:

- wait 1-2 seconds after the last modification
- confirm file size is unchanged across two checks
- optionally require a `.ready` companion file for stricter workflows

## Queueing Rules

Do not render jobs in parallel by default.

Reasons:

- exports are already heavy
- PNG rendering is the main bottleneck
- LED-wall sizes will be expensive
- parallel browser renders will fight for CPU/GPU and disk bandwidth

Recommended:

- single-worker queue initially
- later, configurable worker count if needed

## Output Rules

For each job:

- export PNGs to a job-specific folder
- encode MP4 beside them
- write a manifest file containing:
  - timestamp
  - source CSV path
  - chosen profile
  - frame count
  - fps
  - preset or config used
  - output paths

Suggested output layout:

```text
output/
  1080x1920/
    summit-001/
      frames/
      summit-001-master.mp4
      manifest.json
```

## Performance Notes

This avoids browser save-dialog friction, but it does not remove the main bottleneck.

The expensive parts will still be:

- frame rendering
- PNG encoding
- MP4 encoding

For large LED-wall output, likely next optimizations:

- profile per-frame render time
- reduce unnecessary per-frame rebuild work
- consider direct video encoding from raw frame buffers where possible
- possibly add lower-res preview / full-res final split

## Recommended Next Implementation Steps

1. Add a small renderer text-payload input path.
2. Define a stable CSV schema.
3. Implement `scripts/watch_jobs.py`.
4. Add `processed/`, `failed/`, and manifest handling.
5. Test with a local non-Google-Drive folder first.
6. Then point it at the Google Drive synced folder.

## Summary

Yes, this is practical.

The best version is:

- local Google Drive sync folder
- Python filesystem watcher
- frozen snapshot export
- renderer-native text overlay
- MP4 encode after frames
- queue + processed/failed job handling
