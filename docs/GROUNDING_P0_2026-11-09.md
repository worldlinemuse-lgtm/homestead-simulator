# P0 Terrain, Grounding, Scale — visual branch (2026-11-09)

## Reason for change and evidence

Independent review identified a systematic 0.2 scene-unit mismatch: terrain vertices used `terrainY(x,z) - 0.2` while all rigid asset origins and agents used `terrainY(x,z)`. Since the mesh is triangulated, simply changing the offset would still leave small gaps between smooth analytic terrain sampling and mesh triangles. The previous house had a flat 13 m x 9.6 m bottom, no foundation; its roof used the wrong sign and formed a valley. Existing raised PV frames and hutch posts may not touch uneven terrain.

## Implemented — renderer only

1. **Shared triangulated heightfield:** analytic terrain profile and decorative creek carving are sampled once into a regular Float32Array of 157 by 123 points, covering x=-150..150 and z=-125..125 scene metres. The visible indexed mesh uses these exact heights (without the extra -0.2). `terrainY(x,z)` now uses barycentric interpolation of the **same two triangle faces** that form each quad (a,c,b) and (b,c,d). This is a render/collision-query surface for future use; no physics engine has been installed.
2. **Conservative foundation elevation:** footprints enumerate source mesh vertices in all intersecting grid cells. The maximum vertex height bounds all interpolated ground values, and foundation tops are placed 0.04 m above that conservative maximum. Foundation undersides penetrate 0.32 m beneath the lowest vertex in those cells. This avoids cantilevered flat floors and gaps. Five groups receive foundations: house, inverter/battery outbuilding, water treatment, treated-water tank (round), and henhouse. The house porch has independent piers penetrating the local surface.
3. **Unpaved rack and hutch footings:** PV array support posts and individual hutch legs have short extensions embedded into the local terrain. No ornamental full-site concrete slabs added.
4. **Scale and roof:** declared nominal `1 world unit = 1 metre`. The house roof slope sign was corrected. The visibly oversized animated chicken/rabbit silhouettes use smaller illustrative scales. This is **not** a dimensioned material takeoff, manufacturer CAD, cage sizing proof or validated construction design.
5. **Static validation instrumentation:** one-time raycast against actual rendered triangle mesh at 25 world points; compare its heights to the same `terrainY` used for supports. Report number of misses, max residual, all foundation assets, minimum under-ground embed, and conservative vertex clearance through `scene.stats().grounding`. Browser smoke on desktop/mobile checks 0 misses, <0.5 mm residual, 5 registered supports, >=0.30 m penetration and zero foundation cover violations. Checks are independent of the farm/water/solar numerical models.

## Explicit boundaries and unresolved audit findings

- The other AI's measured gaps, draw-call counts and intersection counts were not independently reproduced in this run. Our test only covers the ground surface and recorded major foundations, **not** every mesh or structural contact.
- This does not solve visual intersections between the west fence and hutches, ramp and fence gate, or animals and fixtures; it does not re-terminate electrical cables or hydraulic hoses. Those require a tagged object hierarchy and endpoint-aware routing.
- `syncAnimals` still replaces the full population on change and retains GPU geometry; identity preservation and explicit disposal are the next correctness and performance blocker **before adding physics bodies**.
- Camera spring lerp and dt clamp remain frame-rate-sensitive; these should be fixed before character physics.
- Soil, water treatment and PV dimensions are still illustrative. Source physical models are unchanged, and no certified electrical, hydraulic or animal-welfare claim is made.
- Instancing of repeated fence, vegetation and hutch details is future performance work, following a reproducible draw-call benchmark.

## Proof gates and integration

- V8 syntax parsing was performed on the changed scene text before pushing.
- Dedicated branch is `visual/farm-water-state-animation-20261108`; update existing PR #9 instead of creating another overlapping graphics PR.
- CI commands: `node --test tests/*.test.cjs` (or current workflow's discovery) and `python3 tests/browser_smoke.py` with Playwright Chromium. Verify the *latest head* CI, screenshots, and actual phone performance before merging.
- Shared world and current numerical farm/water/solar engines must continue to work exactly as before.

## Next P0+P1 tasks

1. Fix stable per-animal IDs and disposal with a keyed `Map`; test 70 consecutive +1-day updates for bounded `renderer.info.memory.geometries` and preserved object identity for survivors. Reuse shared geometries/materials where possible.
2. Give each asset unique stable IDs and semantic fixed/moving/collider tags, with explicit compound colliders. Do not infer collisions from visual material/selection.
3. Resolve remaining intersections, give fence a ramp gate and straighten the pipe/cable endpoints; benchmark instancing.
4. Replace fixed-factor camera lerp with exponential dt smoothing and separate real-time wall-clock animation from numerical simulation steps.

## P1 animal lifecycle implementation (2026-11-09, follow-up)

Farm-sim `source/src/world/sync.js` reconciles visual agents against model animals by stable ID. This renderer now mirrors that lifecycle: `animalById` retains the Three.js group and its phase/pose when a model ID survives; only new IDs allocate rigs, and only missing IDs retire rigs. A changed species on the same ID retires and replaces the incompatible rig. Stage/health/age changes update existing rigs. Each generated animal-only geometry is tracked in `ownedAnimalGeometry` and disposed exactly once on retirement; shared eye geometry, coats and global scene materials are intentionally preserved. This does **not** modify the authoritative farm RNG, populations or animal behavior model.

The browser smoke test now checks ID uniqueness, stable survivor reconciliation, owned geometry bounds and, on desktop, reproduces 70 consecutive +1-day button clicks with a lifecycle accounting invariant (`added-removed===active`). It still needs actual `renderer.info.memory.geometries` telemetry to compare directly to the original independent GPU audit, plus mobile hardware benchmarking. Future work: expose geometry counters safely and test allocation/deallocation over synthetic birth/death events without mutating farm engine truth.
