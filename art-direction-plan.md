# Art direction plan – Ubuntu Summit 26.04 background animation

## Context

Animated background for Ubuntu Summit 26.04 (Resolute Raccoon). Used as social media assets (story/portrait/landscape) and as an interstitial on the large LED wall in the Canonical office in London. The mascot illustration (raccoon face + radial spoke halo representing the tail) comes from an external illustrator. This project amplifies that illustration into a breathing, animated halo field and extends it to fill the full background.

The narrative arc: wet raccoon shakes water off → droplets radiate outward along spokes (circles) → halo reveals → shapes populate the radial lines and flicker, creating an icy crystalline field.

The wordplay is resolute → resolution (radial lines, orbits, measurement).

---

## What's already working – do not change

- [x] **Breathing system.** The rubber-band spoke fold with asymmetric phase masks already reads as alive without calling attention to the mechanism.
- [x] **Sine-wave ripple on echo dots.** Four-wave count gives a subtle concentric undulation. Both spoke count and orbit count already animate.
- [x] **Restraint.** Monochrome white-on-charcoal palette is intentional. No colour accents – the orange Canonical tag logo is composited separately and provides the only colour. That separation is an asset.
- [x] **Raccoon-tail banding.** The dark gaps between spoke clusters effectively create the alternating light/dark bands of a raccoon tail. This is already the right read.
- [x] **Staggered dot-capture reveal.** The `capture_start_frac` / `orbit_stagger_frac` parameters already control this timing.

---

## New shapes to add

- [x] Diamond (rhombus)
- [x] Radial dash
- [x] Star (compound plus)
- [x] Hexagon outline

Ensure closed shapes are same visual weight - maybe inscribed in the same size circle?

### 1. Diamond (rhombus)

A 45°-rotated square outline, 2 corners along radial spokes. Drawn as four line segments. Ties to ice crystal facets and "resolution grid pixel" concept. Visually fills the gap between circle and triangle – gives the field a sharper, more crystalline texture.

### 2. Radial dash

A short rectangle aligned to its spoke's radial direction, with roughly 2:1 or 3:1 aspect ratio. Drawn as a single thick stroke segment. References ruler markings / measurement (resolution), and reads as a water streak. Introduces directionality that breaks the rotational symmetry of the other markers.

### 3. Star (compound plus)

**Not** an asterisk – instead, a larger plus at 0° with a smaller plus overlaid at 45°, like the classic star icon. Constructed from four line segments (two for the big plus, two for the small plus). Use at orbital frontiers or as an occasional replacement in the mixed pool.

### 4. Hexagon outline

Six-sided polygon drawn from line segments. References snowflake / ice lattice geometry. Use sparingly – only on outer orbits. Reads as a structural node. The Ubuntu "circle of friends" has three-fold symmetry and hexagonal tiles emerge from it naturally.

All shapes must remain stroke-only, constructable from line segments, and no thicker than ~2.5 px at 1080p. No fills. No curves. This keeps GPU instancing fast and prevents shapes from competing with the mascot.

---

## Droplet-to-halo handoff – flash-on-capture

- [ ] Flash-on-capture alpha spike

When an orbiting dot locks into its target angle, introduce a brief alpha spike: ramp to 1.0 for ~2 frames, then ease back to 0.6, then settle to the base spoke alpha. This sells the moment of "impact" – a droplet hitting a surface – and connects the dot phase to the halo phase more tightly.

The existing `capture_start_frac` parameter already handles the stagger timing, so no new control is needed for sequencing.

---

## Vignette – context-dependent intensity

- [ ] LED wall interstitial vignette preset (reduce `vignette.choke`, increase `vignette.radius_px`)

The radial vignette exists to make overlaid text readable. It uses a keyhole metaphor: a glimpse into a larger universe, not a bounded circle.

- **Social media frames with text overlay:** keep the current vignette intensity. The text needs that contrast.
- **LED wall interstitial (no text):** tone the vignette down significantly. The animation can breathe into a wider field when there's no typography to protect.

No concentric boundary ring. The vignette *is* the outer boundary, and it should stay soft. Adding a defined edge contradicts the keyhole metaphor.

Consider exposing a `vignette.interstitial_mode` toggle or preset that reduces `vignette.choke` and increases `vignette.radius_px` for the LED wall profile.

---

## Micro-typography layer – Ubuntu release history on spokes

- [ ] Update `UBUNTU_RELEASE_LABELS` to 44 entries (add 26.04)
- [ ] Add codenames to labels
- [ ] Orient text along spoke direction (not horizontal)
- [ ] Place labels in echo zone (not canvas edge)
- [ ] Integrate opacity with reveal and breathing systems

### Concept

Each spoke carries a small text label referencing a past Ubuntu release, oriented along the spoke's radial direction in very small type. At LED-wall viewing distance these are subliminal texture; on a phone in someone's hand they're a discoverable easter egg. The pinned spoke at 3 o'clock carries the newest release (26.04 Resolute Raccoon).

### The mapping problem

There are 60 spokes but only 44 Ubuntu releases (4.10 Warty Warthog through 26.04 Resolute Raccoon). That leaves 16 spokes unfilled.

Options to fill the gap:

**Option A – pad with mainline kernel versions.**
Linux kernel releases between 2.6.0 and 7.0 number well over 100. We could select 16 landmark kernel versions that don't already appear as Ubuntu-shipped kernels. These would read as historical Linux milestones woven into the Ubuntu timeline. Examples: 1.0, 2.0, 2.2, 2.4, 3.0, 4.0, 5.0, 6.0, etc.

**Option B – use Ubuntu release version + codename + shipped kernel as a compound label.**
Each spoke label becomes a multi-line micro-block, e.g.:

```
26.04
Resolute Raccoon
kernel 7.0
```

This is richer but requires more vertical space per spoke.

**Option C – wrap the 44 releases and leave 16 spokes with geometric markers only.**
The simplest approach. Not every spoke needs text – the gaps reinforce the raccoon-tail banding (dark = no text, light = text). This avoids inventing filler data.

**Option D – include Ubuntu point releases (e.g. 22.04.1, 22.04.2, etc.).**
LTS releases get multiple point releases. Adding these for the 10 LTS releases could yield enough to fill 60.

### Recommended approach

**Option C as the base, with Option A available as a variant.** The 44 releases map to 44 spokes. The remaining 16 carry only geometric shapes. If in testing the field looks too sparse with only 44 text labels, promote Option A and interleave kernel milestones.

### Assignment order

- Spoke 0 (pinned at 3 o'clock): **26.04 – Resolute Raccoon – kernel 7.0 (6.20)**
- Spoke 1 (next CCW): **25.10 – Questing Quokka – kernel 6.17**
- Spoke 2: **25.04 – Plucky Puffin – kernel 6.14**
- Continue chronologically backward through the history
- Spoke 43: **4.10 – Warty Warthog – kernel 2.6.8**
- Spokes 44–59: geometric shapes only (no text)

### Complete Ubuntu release reference

| Spoke | Version | Codename | Kernel |
|---|---|---|---|
| 0 | 26.04 LTS | Resolute Raccoon | 7.0 (6.20) |
| 1 | 25.10 | Questing Quokka | 6.17 |
| 2 | 25.04 | Plucky Puffin | 6.14 |
| 3 | 24.10 | Oracular Oriole | 6.11 |
| 4 | 24.04 LTS | Noble Numbat | 6.8 |
| 5 | 23.10 | Mantic Minotaur | 6.5 |
| 6 | 23.04 | Lunar Lobster | 6.2 |
| 7 | 22.10 | Kinetic Kudu | 5.19 |
| 8 | 22.04 LTS | Jammy Jellyfish | 5.15 |
| 9 | 21.10 | Impish Indri | 5.13 |
| 10 | 21.04 | Hirsute Hippo | 5.11 |
| 11 | 20.10 | Groovy Gorilla | 5.8 |
| 12 | 20.04 LTS | Focal Fossa | 5.4 |
| 13 | 19.10 | Eoan Ermine | 5.3 |
| 14 | 19.04 | Disco Dingo | 5.0 |
| 15 | 18.10 | Cosmic Cuttlefish | 4.18 |
| 16 | 18.04 LTS | Bionic Beaver | 4.15 |
| 17 | 17.10 | Artful Aardvark | 4.13 |
| 18 | 17.04 | Zesty Zapus | 4.10 |
| 19 | 16.10 | Yakkety Yak | 4.8 |
| 20 | 16.04 LTS | Xenial Xerus | 4.4 |
| 21 | 15.10 | Wily Werewolf | 4.2 |
| 22 | 15.04 | Vivid Vervet | 3.19 |
| 23 | 14.10 | Utopic Unicorn | 3.16 |
| 24 | 14.04 LTS | Trusty Tahr | 3.13 |
| 25 | 13.10 | Saucy Salamander | 3.11 |
| 26 | 13.04 | Raring Ringtail | 3.8 |
| 27 | 12.10 | Quantal Quetzal | 3.5 |
| 28 | 12.04 LTS | Precise Pangolin | 3.2 |
| 29 | 11.10 | Oneiric Ocelot | 3.0 |
| 30 | 11.04 | Natty Narwhal | 2.6.38 |
| 31 | 10.10 | Maverick Meerkat | 2.6.35 |
| 32 | 10.04 LTS | Lucid Lynx | 2.6.32 |
| 33 | 9.10 | Karmic Koala | 2.6.31 |
| 34 | 9.04 | Jaunty Jackalope | 2.6.28 |
| 35 | 8.10 | Intrepid Ibex | 2.6.27 |
| 36 | 8.04 LTS | Hardy Heron | 2.6.24 |
| 37 | 7.10 | Gutsy Gibbon | 2.6.22 |
| 38 | 7.04 | Feisty Fawn | 2.6.20 |
| 39 | 6.10 | Edgy Eft | 2.6.17 |
| 40 | 6.06 LTS | Dapper Drake | 2.6.15 |
| 41 | 5.10 | Breezy Badger | 2.6.12 |
| 42 | 5.04 | Hoary Hedgehog | 2.6.10 |
| 43 | 4.10 | Warty Warthog | 2.6.8 |
| 44–59 | — | (geometric shapes only) | — |

### Text rendering

- Font: Ubuntu Sans or Ubuntu Mono at very small size (~4–5 px at 1080p)
- Orientation: along the spoke radial direction, reading outward from centre
- Placement: in the outer echo zone, beyond the thick-spoke halo boundary
- Opacity: tied to the existing echo opacity/fade system so labels dissolve into the vignette naturally
- Content per spoke: version number + animal name only (e.g. "26.04 Resolute Raccoon"), not the full compound block – keeps it compact and scannable

### Implementation note

The existing `ubuntu_releases` echo style and `UBUNTU_RELEASE_LABELS` array provide a starting point. The current array has 43 entries (4.10 through 25.10). Update it to include 26.04 and wire in the codenames. The `echo_style: "ubuntu_releases"` path already handles text overlay via `draw_ubuntu_release_overlay()` in `rendering.js`, but currently only renders version numbers as floating text near the canvas edge. The upgrade needs to:

1. Add codenames alongside version numbers
2. Orient text along the spoke direction instead of horizontal
3. Place labels in the echo zone rather than at the canvas edge
4. Integrate with the reveal and breathing systems
