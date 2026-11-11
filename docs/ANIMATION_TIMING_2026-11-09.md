# Animation clock invariance and grounded pause — 2026-11-09

## Decision and scope

This iteration fixes two rendering artifacts identified by independent spatial review: fixed-factor camera interpolation varies with display frame rate, and a visually hopping rabbit can freeze above terrain when the numerical simulation is paused. It also closes the **failed CI assertion** from P1's 70-day leak test. No Solar, Water, Farm, or Homestead Coordinator numerical models are changed.

### Root cause of previous CI failure

GitHub run 42564860569 failed only its final clock assertion: it expected `25 + 70*24` hours. In `src/main.js`, clicking **Play** invokes `tick()` synchronously and advances the model one hour before the test pauses it and begins its 70-day loop. Thus the test was using an invalid baseline. The corrected browser test reads the actual hour **immediately before** the 70-day loop and then requires exactly 1680 additional simulated hours. The existing GPU-memory and identity assertions remain intact and are not weakened. Passing the previous ownership assertions alone is not evidence of full browser verification.

### Frame-independent visual motion

The helpers in `src/visual-motion.mjs` are pure, deterministic and independent of numerical simulation state.

- For camera response and animal horizontal interpolation, `alpha = 1 - exp(-k * Δt)`. Camera rate k=6 s^-1, animal-follow rate k=4.5 s^-1. This yields the same exponential fraction of remaining distance after one second irrespective of whether the browser displayed 10, 15, 24, 30, 60 or 120 frames. Unit tests assert that invariance to a numerical tolerance of 1e-12.
- Real frame time is consumed up to 0.25 s, not the previous hard cap of 0.055 s. This avoids artificial animation slowdown at 10–15 FPS. Hidden browser tabs and wakeups >1 s contribute no catch-up animation; extremely slow rates below 4 FPS are still presentation-limited to avoid large visual jumps.
- Rabbit hops and chicken stepping remain illustrative poses: they do NOT advance the biological RNG, change animal mass or resource demand, or simulate real inertia/impacts.
- **Pause grounds every animal immediately:** `setPlayback(false)` snaps visual Y to the shared triangulated terrain while leaving X/Z unchanged. The next render frame stays grounded and uses a resting pose. Movement is disabled on pause/night/unmobile young kits. This avoids frozen mid-air poses and nonphysical travel back to spawn when paused.
- Camera remains operable while scenario playback is paused; camera navigation is UI presentation, separate from numerical time.

### Verification gates

1. `node --test tests/engine.test.cjs`: numerical integration plus two pure helper tests for frame invariance, invalid timing, pause/night/kit zero-hop behavior. The main CI workflow currently runs this file explicitly (CI discovery fix remains an unmerged separate PR).
2. `python3 tests/browser_smoke.py`: unchanged 70 consecutive day actions and bounded GPU checks, corrected hour expectation, and additional desktop/mobile assertion that animals land after pause and remain on terrain within 1e-9 scene metres (read-only render diagnostics).
3. Screenshots of desktop/mobile farm/overview/water, including paused farm scene, are published as browser workflow artifacts. CI completion must be verified for latest head before claiming passed.
4. Synthetic weather, unvalidated instantaneous pipe velocity, and source farm biological outcomes remain subject to the earlier model limitations. This work does not add collision bodies or a gravity solver.

### Next priority

After the complete 70-day browser test passes, define stable object IDs, fixed/dynamic roles, actual collision-proxy shapes, and eliminate unresolved spatial intersections (hutch/fence, ramp/gate, cable/pipe endpoints). Maintain P0 grounding invariants and realistic mobile draw-call budgets. This is a prerequisite for meaningful 3D physics, not itself proof of physically correct mechanics.
