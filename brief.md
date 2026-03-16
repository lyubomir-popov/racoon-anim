I want you to recreate the attached Houdini-inspired animation as a performant web banner (square, 600px).

Choose either Canvas or SVG based on performance. I do not care which, as long as the result is smooth, clean, and efficient. If there are many animated elements, prefer Canvas. If SVG is still practical and gives cleaner output, use SVG. Your job is to decide.

Deliver a single self-contained HTML file with inline CSS and JS. No frameworks, no external dependencies.

Goal

Create a wide responsive banner animation that looks like a radial system of small white rectangular dots arranged on spokes and orbits over a dark charcoal background.

The feel is:
- precise
- technical
- elegant
- slightly hypnotic
- not flashy
- suitable for a modern product / design / technology website banner

The original effect was prototyped in Houdini. I want the web version to preserve the logic and the feel, not necessarily be a literal pixel-perfect clone.

Visual structure

Think of a circular / radial point field made of:
- multiple spokes radiating from a common center
- multiple concentric orbits
- a varying number of active points per spoke

The active orbit count is not uniform across spokes. It ramps within repeating phase segments:
- at the start of a phase segment, each spoke has only a few active orbits
- across the segment, the active orbit count increases until it reaches the maximum
- then it resets at the next phase segment

This creates a repeating wedge / fan pattern where some spokes are short and others extend further outward.

Each point should render as a tiny white rectangle or box, not a round particle. Slight variation in aspect ratio is okay, but keep them small and crisp.

Background

- dark charcoal / near-black
- no gradients unless extremely subtle
- points should be off-white, not pure blown-out white
- overall aesthetic should feel premium and restrained

Geometry logic

Use parameters like these internally:

- inner_radius
- outer_radius
- num_orbits
- spoke_count
- phase_count
- min_active_orbits
- base_angle_deg
- pattern_offset_spokes

For each spoke:
1. determine which phase segment it belongs to
2. compute its local position within that segment
3. map that to an active orbit count from min_active_orbits up to num_orbits
4. generate points only up to that active orbit count

Each point should know at least:
- spoke_id
- spoke_pattern_id
- orbit_id
- orbit_rank
- orbit_count
- orbit_u
- spoke_u
- reach_u

Definitions:
- orbit_u = normalized orbit position from inner to outer
- reach_u = normalized outermost active orbit on that spoke
- orbital_frontier = the outermost active orbit on a given spoke
- phase_frontier = the start boundary of each phase segment, where the spoke length resets to minimum

Animation behavior

This is important.

The points do not simply sit still.

They begin from a shared spawn angle and move clockwise around their orbit with constant angular velocity.

Then they gradually “capture” into their final target layout.

Animation model:
- each point has a target position in the final radial composition
- each point also has a live orbiting position
- the point starts at a common spawn angle on its orbit
- it rotates clockwise at constant angular speed
- after a delay, it transitions along the orbit into its exact target angle
- by the end of the animation, every point lands exactly in its final target layout

Important:
- the capture should happen along the orbit, not by cutting straight across the circle
- the motion should feel orderly and engineered, not chaotic
- the animation should loop cleanly

Visibility / occlusion idea

In the Houdini version, points were hidden for a short angular distance after spawn, as if emerging from behind a hidden object or gun / building.

Please include that idea:
- each point becomes visible only after travelling some configurable occlusion arc
- before that, it should be hidden

pscale / size logic

Point size must be driven by two separate frontier systems.

1. orbital_frontier
This is radial.
It means the outermost active orbit on each spoke.
Points near that frontier can be scaled differently from points deeper inward.

2. phase_frontier
This is not radial.
It means the phase reset boundary, ie the point where a phase segment starts and the spoke length resets from minimum back upward.

This must affect point scale separately from the orbital frontier.

Both frontier effects must be independently controllable and reversible.

That means each frontier should have:
- amount, range -1 to 1
- width_u
- bias

Interpretation:
- amount = 0 means no effect
- amount > 0 means smaller at the frontier
- amount < 0 means larger at the frontier

Suggested internal parameter names:
- base_pscale
- orbital_frontier_amount
- orbital_frontier_width_u
- orbital_frontier_bias
- phase_frontier_amount
- phase_frontier_width_u
- phase_frontier_bias

The final size should be some combination of:
- base_pscale
- orbital frontier scale effect
- phase frontier scale effect

The key visual goal is that the sparse / resetting phase areas feel like they are emerging from a different state, partly through size modulation.

Timing / motion controls

Use readable snake_case variable names.

Suggested parameters:
- start_frame or start_time
- duration_sec
- spins
- emit_frac
- capture_start_frac
- orbit_stagger_frac
- speed_mult_per_orbit
- inner_faster
- spawn_angle_offset_deg
- occlusion_arc_deg
- hide_invisible_by_pscale

Behavior notes:
- points can be emitted in a staggered way rather than all at once
- denser orbits may require shared shot interval logic so spacing feels consistent
- inner or outer orbits may move faster depending on a flag
- capture should begin after a global fraction of the animation, but not before the point is visible

Banner requirements

- wide responsive banner, suitable for hero/header usage
- should look good roughly around 1600×400, but remain responsive
- animation should continue smoothly on resize
- center and scale composition so it feels intentional in a wide crop
- allow some cropping of the full radial system if it improves composition

Implementation requirements

- single HTML file
- no libraries
- requestAnimationFrame
- efficient rendering
- clean code
- comments explaining the logic
- readable structure
- use snake_case names
- include a top-level config object for easy tuning

Please also include:
1. a sensible default configuration
2. a reduced-motion fallback
3. simple performance-minded decisions, such as:
   - Canvas if many particles
   - devicePixelRatio handling
   - avoiding unnecessary allocations per frame
   - precomputing static geometry where useful

Output

Please provide:
1. the finished self-contained HTML
2. a short explanation of why you chose Canvas or SVG
3. where in the config I should tweak:
   - density
   - speed
   - frontier scaling
   - overall size
   - color
   - crop / composition

Priority order

1. preserve the motion logic and visual feel
2. keep it performant
3. keep the code readable
4. make it look premium

If any part is ambiguous, make a strong design/engineering choice and proceed without asking questions.