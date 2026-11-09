# Realistic farmyard architecture and grounded chicken movement — 2026-11-09

## User-visible problem and findings
The previous farmyard had a 4 m-high house entry door, 3.2 m-high window panels, 3.5 m-high coop door opening directly to a chicken ramp, open triangular house/henhouse gables, a south fence through the chicken ramp, a west fence crossing the hutch footprint, and chickens that merely orbited their spawn points and looked airborne.

This iteration corrects actual Three.js geometry and movement rather than adding generic UI or another independent scene. It extends PR #9 on the existing visual branch. The CI test-discovery improvement from PR #5 was independently reviewed and merged into main, but PR #9 stays unmerged until its own latest branch tests and visual review pass.

## Changes, constraints, and provenance
- **House:** A two-story façade with human-scale entry door (2.18 m high), properly framed and divided windows, porch entry, gable walls on both ends, ridge cap and corrected roof orientation. House footprint and the earlier terrain-correct foundation remain unchanged.
- **Henhouse:** Human service door (2.38 m) separate from a low chicken entry (0.79 m) aligned with the cleated ramp. Both gable triangles are enclosed. The pen's south fence has a 3.30 m opening aligned with the 2.15 m-wide ramp; clearance is measured, not assumed. These are visual architectural illustrations, not permitting or housing code guidance.
- **Pen:** Rabbit hutch bank moves from x=21 to x=24.5, giving >1 m clearance between its footprint and the west fence. Chicken and rabbit roaming tracks are bounded in clear portions of the existing fenced pasture, separated from the hutch, trough, garden and ramp. These are not demonstrated obstacle-aware collision paths or actual biological enclosure location data.
- **Chickens:** Each surviving Farm-ID rig is retained. Rather than a ~1 m sine-wave oscillation, hens walk through a many-metre closed 3D yard trajectory with individualized start phase and speed. Their root's vertical position equals the shared triangulated terrain height every frame; alternating legs and toe lifts convey real steps, while a separately parented torso bobs above the planted root. Animal spatial plans, gait and head poses are **illustrative**, not biological movement outputs. No feed, health, mass, water use or farm RNG inputs are modified.
- **Rabbits:** Distinct bounded paths, with visible hops only during playback; on pause the root returns to the exact terrain surface. The scene's original Farm model ID reconciliation and GPU resource release remain intact.
- **Close-up view:** The farm waypoint is closer to expose chicken gait, equipment and architecture on desktop/mobile.

## Proof-gated tests
- Syntax parse new scene with V8 before commit.
- `tests/browser_smoke.py` now asserts geometry-derived door and gable parameters, hutch/west fence separation, ramp/south gate opening and that chickens travel >0.05 m during a ~1-second Play interval with zero terrain-root residual. Original 70-day animal memory regression still runs (does not validate biological trajectories), plus desktop and mobile screenshots.
- Maintain CI numerical tests, explicit source-origin limitations, and no changes to Solar/Water/Farm physics.
- Browser tests do not certify actual live-phone FPS, construction dimensions, water potability, safety, load ratings, or actual chicken movement statistics.

## Remaining risks / next increments
1. Visual inspection of screenshots and close-up camera for geometry intersections and believable proportions, with iteration before merge if needed.
2. Stable unique IDs and collision proxies for walls, doors, equipment, fences, fittings and livestock; source engines must remain the authority for farm population and outcomes.
3. Actual contact-aware animal roaming, gate access, avoidance and foot-ground kinematics if future visual requirements justify it; do not claim the current kinematic loops are validated physical animal behavior.
4. Geometry batching/instancing, measured mobile performance and physically based materials. The current full scene remains stylized, not photorealistic.
