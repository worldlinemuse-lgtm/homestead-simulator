# Chicken foot contact and weight-bearing visual gait — November 9, 2026

## Decision
After PRs #9 (merged grounded shared terrain/animal identities) and #10 (merged actual house/coop openings), the next highest-impact visual defect is **foot sliding/hovering**. The former chicken mesh rotated a whole leg about its hip while its toes had no knowledge of the terrain or which foot was supporting the body.

This change uses the user's original Farm Simulator's `source/src/world/draw.js` depiction of alternating bird steps, ground shadows and head/belly bob, and its `source/src/world/physics.js` separation between model-driven motion and presentation. The visual method is native Three.js, not a copy of the 2D renderer.

## Implemented visual geometry
- Two separate chicken leg assemblies with toe geometry, rear toe, ankle and shin cylinders. The shin transforms dynamically between the scaled hip and the animated foot instead of a fixed hip rotation.
- Each hen's gait phase advances with **travel distance in metres**, not with rendered frame count. The two feet are 180° out of phase, with 62% stance duty cycle. A bird always has at least one nominal support foot.
- During stance a foot's X/Z location and toe yaw are held in world space, so rotating/moving the chicken root cannot slide the planted toes.
- During swing the free foot travels from toe-off toward an upcoming position, with a smoothstep horizontal profile and a sinusoidal 0–7 cm peak vertical clearance (scaled for life-stage illustration). The landing surface is the exact terrain heightfield used by all structures and visual animal roots.
- When playback stops, when nighttime resting applies, or when a chicken is otherwise inactive, both feet are set flat on the ground immediately; body-bobbing also stops.
- Original Farm animal IDs are preserved. The rig uses additional owned geometry per individual that is disposed using the existing keyed lifecycle recycler.

## Scientific and graphic boundaries
This is an *illustrative kinematic gait*, not a measured biomechanics, collision or physics solver. Chicken travel paths and heading are presentation-only, and their duration is based on real rendered seconds. Farm source biological age, feed, water use, mass and mortality remain the sole source of those reported model outcomes. No new biological measurements are invented. It does not imply chickens follow those exact routes in a real farm.

There may still be visible foot posture imperfections on steep grades and turns because toe articulation is simplified; shin lengths are not dynamically constrained by avian biomechanics. Longer-term obstacle-aware routes, mesh/ground collider coverage, and actual foot/ankle IK require separate work.

## Verification
- `tests/engine.test.cjs` checks phase alternation, swing clearance, edge and invalid inputs, and distance-phase equivalence across display-frame rates.
- `tests/browser_smoke.py` on desktop and 393 px mobile asserts the chickens actually traverse the yard, one or more feet per hen are planted while walking, planted foot world-X/Z slip is under 1 μm, none penetrates the terrain by more than 1 μm, and both feet are grounded on pause. It also captures a **farm-stride screenshot during Play**.
- Existing 70-day stable-identity/GPU geometry and engineering conservation tests must continue to pass; a short smoke test cannot establish mobile FPS or field correctness.
- Merge only after both numerical and browser workflows pass for the final PR head and screenshots are reviewed. Do not modify original source repositories.

## Next priorities
Inspect playback footage or real phone performance (static screenshots alone do not capture every frame), then advance close-range animal proportions/rig details; reduce draw calls and implement safe walking path avoidance near equipment and fences before claiming dynamic collisions.
