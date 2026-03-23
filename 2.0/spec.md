# Spoke Fold 2.0 Spec

This folder is an isolated reset for the spoke-fold problem. It does not modify the current app path.

This spec supersedes the older root-level `spoke-fold-spec.md` wherever they conflict.

## Goal

Define the post-finale spoke breathing model as a wrapped strip problem, not as a naive angle-remap problem.

## Core Mental Model

Think of the spokes as marks printed on a rubber band.

- One end of the rubber band is pinned at `3pm`.
- The other end is stretched counter-clockwise around a tube.
- The viewing direction is the tube cross section.
- You only ever see the front `360 deg` of the rubber band.
- Any additional winding goes behind that first visible turn.

Starting point:

- `60` source spokes
- one source spoke mark every `6 deg`
- fully visible front turn only

As the band winds counter-clockwise:

- the number of visible spokes decreases
- the hidden spokes do not fade out
- they go behind the front turn
- disappearance happens only at the lower side of the pinned `3pm` seam

The result should read like a circle becoming a spiral, while only one `360 deg` turn remains visible.

## Non-Negotiable Rules

### 1. Source spoke identity is fixed

There are always `60` source spokes in the source domain.

Breathing must not:

- rotate the visible glass field around the circle
- slide the visible glass field to different screen positions
- change source spoke order on the rubber band

Breathing may only change:

- how source spokes resolve onto visible spoke positions
- which wrapped turns are hidden behind the front turn

### 2. Visible spoke count is derived from winding

If `visible_spokes = N`, then:

- the strip spans `60 / N` turns total
- only the front `1` turn is visible
- all additional turns are hidden behind it

Examples:

- `60 -> 30` means `2.0` total turns
- `60 -> 24` means `2.5` total turns

### 3. The seam is pinned at 3pm

- The visible seam is anchored at `3pm`
- Folding must occur only at the lower side of `3pm`
- No symmetric merge
- No visible jump at `9am`
- No gap elsewhere in the circle

### 4. Occlusion, not fade

Hidden spokes are not alpha-faded away.

They are hidden because their wrapped turn is behind the first visible `360 deg` turn.

## Phase Sampling — The Glass Model

Think of a curved piece of glass with varying thickness, fixed in space in front of the tube. The rubber band slides behind this glass.

The glass has a per-phase gradient across each `180 deg` half:

| Clock Position | Glass Thickness | Effect |
| --- | --- | --- |
| `3pm` | thin | spoke appears thin & short |
| `2pm` | medium-thin | spoke appears medium-thin |
| `12pm` | medium | spoke appears medium |
| `9am` | thick | spoke appears thickest & longest |

(Upper phase. Lower phase mirrors.)

The glass is fixed in space. It does not move with the rubber band.

As winding pushes spoke marks to new display positions, each mark picks up thickness and length from the glass at **its current display angle**.

A mark that started at `3pm` (thin glass) and gets pushed CCW to `12pm` is now behind thicker glass — it becomes medium-thick.

Important:

- the glass gradient is spatial, not attached to individual spoke marks
- thickness/length are a function of **display angle**, not source spoke index
- the fold changes which marks sit behind which part of the glass

## What The Old Approach Got Wrong

The broken approach treated the animation like:

- each spoke gets a new angle and then fades or pops in/out
- visible count is faked by moving or fading spokes symmetrically
- fold direction was the same sign for both phases

The correct approach is:

- keep source spoke order fixed on the rubber band
- wrap the source strip into multiple turns via CCW winding
- show only the front turn (spokes on back turns are hidden, not faded)
- project the visible front turn back onto the circle
- sample thickness/length from the fixed glass (display angle), not from source spoke index

## Implementation Direction

The clean implementation should treat the post-finale state as two spaces:

### A. Source strip space

- fixed source spoke count: `60`
- fixed source spoke identity
- fixed source order along the rubber band

### B. Visible projection space

- derived from the current winding ratio
- contains only the front visible turn
- receives source samples from the wrapped strip
- decides which samples are hidden because they lie on back turns
- contains the fixed glass field used for thickness/length sampling

The rendering pipeline should follow this order:

1. Build source spoke records in source order (fixed positions on the rubber band).
2. Assign each source spoke a wrapped strip position from the winding ratio.
3. Determine whether that wrapped position lands on the front turn or a hidden turn.
4. Project front-turn samples onto visible circular angles.
5. Sample thickness/length from the glass at each spoke's **display angle** (not source index).
6. Draw the visible projection.

## Acceptance Criteria

The 2.0 implementation is correct if all of the following are true:

- Reducing visible spoke count never rotates the phase pattern around the circle.
- The seam stays pinned at `3pm`.
- Spokes disappear only at the lower side of `3pm`.
- No fade reveals dots behind the disappearing spokes.
- No jump appears at `9am`.
- The circle reads as a wrapped spiral with only one visible `360 deg` turn.
- Thickness and length still follow the source phase arc:
  - thin/short near `3pm`
  - medium at `2pm`
  - larger at `12pm`
  - maximum at `9am`

## Suggested Next Step

Build the first isolated prototype in this `2.0` folder and leave the existing app untouched until the wrapped-strip model is visually correct.
