# Native Farm runtime integration — execution checklist (2026-11-10)

**Target:** PR #18. This is a dependency-ordered implementation checklist, not a claim of completed integration. Update checkboxes only with code and verification evidence. Preserve farm-sim's authoritative biology and visual-only physics; never derive model results from rendered poses.

## Gate 0 — Establish a clean, measurable baseline
- [x] Import original farm-sim world/agents.js, physics.js and sync.js as upstream source (PR #18).
- [x] Add read-only feet-to-meters pose adapter (PR #18).
- [x] Remove synthetic CatmullRom animal circles from src/scene.js (commit 3c9bca4); no native world means no fabricated locomotion.
- [ ] Confirm latest PR head passes integrated model and browser smoke workflows; capture mobile and desktop screenshots and baseline animal positions.

## Gate 1 — Map the original runtime dependencies (must precede bootstrap)
- [ ] Inspect original farm-sim source/src/world/{agents,physics,looks,weather,perf,draw,sync,loop}.js and the source that initializes WV, S, P, CLOCK, PHYS, pens, layout, RNG, buildCtx and visual context.
- [ ] Record each referenced global/helper and its upstream file; classify biology inputs, visual-only world state, and DOM/canvas dependencies.
- [ ] Define a reproducible native-world initialization contract with deterministic seed, farm snapshot, enclosure layout and clock. Do not silently invent unsupported pens or dimensions.

## Gate 2 — Native runtime bootstrap and state synchronization
- [ ] Load the original controller dependencies in their required order in an isolated visual runtime, without writing into the Farm biological engine.
- [ ] Initialize WV.agents Map, world context, enclosure geometry, clock, seeded visual RNG and collision configuration from authoritative scenario/farm records.
- [ ] On model day/snapshot change call original worldSync(), preserving IDs, births/deaths, transfers and enclosure ownership; validate no duplicate IDs.
- [ ] Advance original physFrame() with a bounded 1/60 s fixed step; call original behavior/think through its native update path; pause must freeze motion.
- [ ] Expose {farmWorld, farmWorldOriginM} to scene.update() from the coordinator/UI, using stable world identity and a documented farm-to-homestead coordinate transform.

## Gate 3 — Cohesive enclosure geometry and renderer
- [ ] Align farm-sim pens, doors, feeders, waterers, coops and hutches with the unified landscape; ensure collision boundaries correspond to visible boundaries.
- [ ] Bind native pose, facing, vertical hop and action to rigs without adding a second motion authority; handle first-frame spawn and discontinuities without fake gait distance.
- [ ] Verify chickens forage, stop, turn and avoid boundaries, and rabbits hop; remove any remaining implicit synthetic path fallback.

## Gate 4 — Proof before merge
- [ ] Deterministic replay: identical seed/snapshot/timestep -> identical positions and collision counters.
- [ ] Edge tests: zero animals, births/deaths, enclosure move, pause/resume, fast-forward, malformed coordinates, mobile frame stalls, and repeated render of unchanged pose.
- [ ] Run integrated solar/water/farm numerical and conservation tests; assert visual runtime cannot mutate authoritative daily results.
- [ ] Run browser smoke and inspect desktop/mobile screenshots; measure frame-time/animal-count scaling.
- [ ] Document actual test results, CI URLs, upstream source revisions, remaining assumptions and merge decision in PR #18.
- [ ] Merge only after successful evidence; do not merge unrelated conflicting engineering PRs as a shortcut.

## Decision log
- 2026-11-10: Source import and read-only adapter alone did not start native farm physics. Remove false circular movement immediately, then prioritize dependency inventory -> runtime bootstrap -> coordinator wiring -> collision-aligned scene -> proof. PR #18 remains draft until all gates pass.
