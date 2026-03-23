# Spoke Fold Animation — Specification

## The Rubber Band Model

Imagine a rubber band wrapped once around a tube, pinned at **3 o'clock (bottom of 3PM)**.

At rest, the rubber band makes exactly one full turn (360°). 60 spoke marks are evenly spaced on the rubber band — one every 6°. You view the tube in cross-section, so you see all 360° of marks.

When you **wind the rubber band CCW** (counterclockwise), the band spirals. Since you can only see the first 360° of the spiral, some spoke marks slide past the pin point at 3 o'clock and wrap behind — they disappear. The more you wind, the fewer spokes remain visible.

**Key properties:**
- The pin is at **3 o'clock**. Spokes disappear only at this point.
- Winding is **CCW**. Every spoke shifts CCW by an amount proportional to its distance from the pin.
- A spoke that was originally right next to the pin barely moves. A spoke originally on the opposite side (9 o'clock) moves the most.
- As spokes compress together, the visible count decreases smoothly.

## Thickness & Length Sampling — The Glass Model

Imagine a piece of curved glass with varying thickness sits **in front** of the tube, fixed in space. The rubber band slides behind this glass.

The glass has a gradient per phase (each 180° half):

| Clock position | Glass thickness | Effect |
|---|---|---|
| 3 o'clock | thin | spoke appears thin & short |
| 2 o'clock | medium-thin | spoke appears medium-thin & medium-short |
| 12 o'clock | medium | spoke appears medium |
| 9 o'clock | thick | spoke appears thickest & longest |

(These are for the upper phase. The lower phase mirrors it.)

The glass is **fixed in space**. It does not rotate. It does not move with the rubber band.

As winding pushes spoke marks to new display positions, each spoke picks up thickness and length from the glass at **its current display angle** — not from its original source position.

A spoke that started near 3 o'clock (thin glass) and gets pushed CCW to 12 o'clock now sits behind thicker glass → it becomes medium-thick. The glass determines appearance, not the spoke's identity.

In code terms:

- After computing each spoke's display angle, derive `phase_u` from **where on the phase arc that display angle falls**
- `phase_u` is a function of display position, not source identity
- Spokes that move to thicker parts of the glass get thicker
- Spokes that move to thinner parts get thinner

## Phase Masks (Clipping Circles)

Two offset circles control which echo dots and thick spoke segments are visible:

- **Phase 0** (upper half): circle center shifted **LEFT** of composition center
- **Phase 1** (lower half): circle center shifted **RIGHT** of composition center

The horizontal dividing line between phases runs through the center of the composition. Upper half = phase 0, lower half = phase 1.

The left-shifted circle for phase 0 allows more room on the left (9 o'clock) side — where that phase's spokes are thickest and longest. It clips tighter on the right (3 o'clock) side — where spokes are thin and short, so less room is needed.

The right-shifted circle for phase 1 is the mirror — more room on the right (3 o'clock, where phase 1 is thickest) and tighter on the left.

## Breathing Cycle

A cosine oscillator varies `effective_spoke_count` between 60 (all spokes visible, no winding) and ~24 (heavy winding, many spokes hidden).

- At **60 spokes**: the rubber band is at rest. All marks visible. Uniform 6° spacing.
- At **24 spokes**: the rubber band is wound ~1.5 extra turns. Only 24 marks remain in the visible 360° window. They cluster toward 9 o'clock (far from the pin). 36 marks have slid past the pin at 3 o'clock and are hidden.

## Summary

| Concept | Rule |
|---|---|
| Pin point | 3 o'clock |
| Wind direction | CCW |
| Spokes disappear at | 3 o'clock (the pin) |
| Thickness/length | Sampled from display angle (the glass), not source identity |
| Thick end | 9 o'clock (upper phase), 3 o'clock (lower phase) |
| Thin end | 3 o'clock (upper phase), 9 o'clock (lower phase) |
| Upper mask | Circle shifted left → more room at 9 o'clock |
| Lower mask | Circle shifted right → more room at 3 o'clock |
| Phase boundary | Horizontal through center |
