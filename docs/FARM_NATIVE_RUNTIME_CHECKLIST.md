# Native Farm runtime integration — execution checklist (2026-11-10)

**Target:** PR #18. This is a dependency-ordered implementation checklist, not a claim of completed integration. Update checkboxes only with code and verification evidence. Preserve farm-sim's authoritative biology and visual-only physics; never derive model results from rendered poses.

## Gate 0 — Establish a clean, measurable baseline
- [x] Import original farm-sim world/agents.js, physics.js and sync.js as upstream source (PR #18).
- [x] Add read-only feet-to-meters pose adapter (PR #18).
- [x] Remove synthetic CatmullRom animal circles from src/scene.js (commit 3c9bca4); no native world means no fabricated locomotion.
- [ ] Confirm latest PR head passes integrated model and browser smoke workflows; capture mobile and desktop screenshots and baseline animal positions.

## Gate 1 — Map the original runtime dependencies (must precede bootstrap)
- [x] Inspect original farm-sim source/src/world/{agents,physics,looks,weather,perf,draw,sync,loop}.js and the source that initializes WV, S, P, CLOCK, PHYS, pens, layout, RNG, buildCtx and visual context.
- [x] Record each referenced global/helper and its upstream file; classify biology inputs, visual-only world state, and DOM/canvas dependencies.
- [x] Define a reproducible native-world initialization contract with deterministic seed, farm snapshot, enclosure layout and clock. Do not silently invent unsupported pens or dimensions.

## Gate 2 — Native runtime bootstrap and state synchronization
- [x] Load the original controller dependencies in their required order in an isolated visual runtime, without writing into the Farm biological engine.
- [x] Initialize WV.agents Map, world context, enclosure geometry, clock, seeded visual RNG and collision configuration from authoritative scenario/farm records.
- [x] On model day/snapshot change call original worldSync(), preserving IDs, births/deaths, transfers and enclosure ownership; validate no duplicate IDs.
- [x] Advance original physFrame() with a bounded 1/60 s fixed step; call original behavior/think through its native update path; pause must freeze motion.
- [x] Expose {farmWorld, farmWorldOriginM} to scene.update() from the coordinator/UI, using stable world identity and a documented farm-to-homestead coordinate transform.

## Gate 3 — Cohesive enclosure geometry and renderer
- [ ] Align all farm-sim pens, doors, feeders, waterers, coops and hutches with visible geometry. Native run/hutch footprints are rendered from Farm component sizes, but detailed coop entrances, feeders and elevated floor geometry still require correspondence checks.
- [x] Bind native pose, facing, vertical hop and action to rigs without adding a second motion authority; handle first-frame spawn and discontinuities without fake gait distance.
- [x] Verify chickens forage, stop, turn and avoid boundaries, and rabbits hop; remove any remaining implicit synthetic path fallback.

## Gate 4 — Proof before merge
- [x] Deterministic replay: identical seed/snapshot/timestep -> identical positions (CI model tests passing on 32454a1 and 4131593); collision counters tracked by original PHYS.
- [ ] Edge tests: zero animals, births/deaths, enclosure move, pause/resume, fast-forward, malformed coordinates, mobile frame stalls, and repeated render of unchanged pose.
- [x] Run integrated solar/water/farm numerical and conservation tests; assert visual runtime cannot mutate authoritative daily results.
- [ ] Run browser smoke and inspect desktop/mobile screenshots; measure frame-time/animal-count scaling.
- [ ] Document actual test results, CI URLs, upstream source revisions, remaining assumptions and merge decision in PR #18.
- [ ] Merge only after successful evidence; do not merge unrelated conflicting engineering PRs as a shortcut.

## Implementation evidence and runtime contract
- Original bundled upstream: app/clock.js; world/base.js, cages.js, context.js, weather.js, agents.js, physics.js, sync.js. All original source bodies are copied unchanged into the existing biological closure in vendor/farm-core.js. Adapter footer is new. The original biological calculations were not changed.
- `nativeVisual.init(seed,hour)` initializes one separate visual RNG and WV world. `nativeVisual.sync(hour)` calls original `worldSync`; `nativeVisual.frame(realSeconds,playing,hour)` caps frame time at 0.1 s, advances native 1/60-s `physFrame` and original `updAgent`/`think` only while playing. It does not run daily biology.
- `src/main.js` supplies rigid farm-to-homestead origin `{x:23,y:0,z:6}` metres. Native x/y in feet become world x/z in metres. The Three.js renderer samples native poses every frame. No CatmullRom fallback is allowed.
- Biological day continues to be advanced ONLY by the existing chronological coordinator; `nativeVisual` never calls `step()` or changes its S/P state.
- Scene also draws native run/hutch enclosure rail footprints using authoritative `farm.components` x/y/w/d in feet; heights/materials are illustrative. Full coop/wall/door reconciliation still pending.
- `tests/engine.test.cjs` exercises actual locomotion, seeded replay, pause and biological-state immutability. GitHub Actions numerical suite passed for commit 4131593. Browser smoke is still required on latest head and must include screenshots (desktop/mobile) and verified native displacement. Do not claim it passed until completed.

## Decision log
- 2026-11-10: Initialized and wired the native Farm visual controller with original world sources and original fixed-step behavior; added deterministic isolation proof and scenario footprint rendering. Remaining gate: browser validation and physical door/fixture correspondence before merge.
- 2026-11-10: Source import and read-only adapter alone did not start native farm physics. Remove false circular movement immediately, then prioritize dependency inventory -> runtime bootstrap -> coordinator wiring -> collision-aligned scene -> proof. PR #18 remains draft until all gates pass.
