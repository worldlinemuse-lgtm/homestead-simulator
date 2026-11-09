# Visual source reuse — November 8, 2026

## Purpose and exact boundary

The homestead is one physical 3D property, not a composite of three isolated UIs. Original scientific models remain unchanged. This iteration modifies the Three.js presentation layer and adds browser assertions. Rendering reads HomesteadCoordinator.snapshot(); it must never advance hydraulic flow, animal growth or the energy ledger.

## Original owned source and visual reuse

| Original repository and file | Proven feature | Three.js adaptation |
| --- | --- | --- |
| farm-sim: source/src/world/agents.js | Species palette, animal locomotion, day/night behavior | Deterministic coat variation, hopping/stepping/pecking, resting at night |
| farm-sim: source/src/world/looks.js | Species and stage classes | Stage-size illustrations without unsubstantiated breed-specific scales |
| farm-sim: source/src/world/physics.js | Visual movement independent of biological model RNG | Separate visual phase; visual movement never changes model calculations |
| farm-sim: source/src/world/sync.js | Actual animal IDs and population reconciliation | Only draw real animals in the farm snapshot (50-animal display cap) |
| water-purification-simulator: source/ui.js buildPipe()/frame() | Instanced flow particles, wet pipes and tank inventory | Instanced per-path flow beads, subtle active pipe and tank ripples |
| water-purification-simulator: source/style_v3.css | 3D-first interface | Existing collapsed inspector and world-first layout retained |

This is a source-informed adaptation, not a replacement of original engines or a claim of identical model capabilities.

## Representation rules

- snapshot.farm.animals is authoritative for species and individuals; visual poses are illustrative. The 50-rendered-animal display cap does not cap model population.
- snapshot.clock.hourOfDay drives daily visual activity, not geolocated sunrise or weather.
- snapshot.waterStoredL and config.waterStorageCapacityL govern the tank's interior visible level; zero volume has no water surface.
- last.energy.servedPumpWh drives pumping electricity visuals; pvWh and servedBaseWh drive other electrical cable indications.
- last.water.treatedL and consumedL are hourly aggregates. Particle speed and brightness are qualitative visual encodings, NEVER instantaneous per-pipe L/min or pressure.
- The creek's slowly scrolling texture is an environmental decoration, independent of modeled water treatment throughput.
- Do not infer rain, snow, breed details, individual animal water consumption, potable water certification or physiology from missing numerical data.
- src/coordinator.js and all vendored source-engine snapshots were NOT modified.

## Verification and limitations

- Local JavaScript syntax was checked by parsing the transformed scene function in V8 prior to commit.
- Browser smoke tests were expanded to assert visual tank fraction and time-of-day agree with snapshot; screenshots on desktop and mobile must still run.
- Suggested commands: node --test tests/*.test.cjs ; python3 tests/browser_smoke.py (with Playwright Chromium installed).
- Screenshots and mobile GPU frame rate were NOT verified during this source-only development iteration; photorealism is not claimed.
- The current representations of equipment, pipes, animal task choice and physical scale remain illustrative rather than dimensioned engineering drawings.

## Screenshot-guided follow-up in the same PR

The initial PR head passed GitHub model tests and browser smoke for desktop and 393px mobile. Its four CI screenshots were downloaded and inspected. Three visible defects were identified: the flat bright-blue creek hovered on the ground, scattered foliage read as dark spikes, and the mobile telemetry obscured a substantial part of the scene.

Corrective commits now (1) recess the terrain beneath the existing creek route, (2) replace single cone vegetation instances with five-blade, double-sided green clumps and remove them from the water channel, and (3) collapse the mobile telemetry panel by default with an accessible toggle. The creek geometry, colors and animated surface remain scene art, **not calculated streambed hydraulics**.

The model-driven animal and water animation changes remain unchanged. Final new-commit CI screenshots still require reinspection; do not treat previous screenshots as confirmation of the updated terrain or phone layout.

## Next improvements

1. Adapt Farm's obstacle-aware roaming, nesting and enclosure collision into native 3D, without modifying biological RNG.
2. Adapt Farm's auto quality/FPS monitoring from world/perf.js for mobile WebGL.
3. Add weather and seasonal ground effects only once appropriate numerical climate fields exist, or clearly label an optional decorative climate view.
4. Improve geometry and materials for the actual pump/RO equipment, coop, water storage, PV mounts and fixtures using supported source identities and dimensions.
5. Independently inspect visuals and frame rates before asserting greater realism.

## Integration caution

Outstanding engineering PRs #1–#8 modify other parts of the system and are not present in main as of this iteration. This visual branch starts from main; verify against newer coordinator contracts before integration.

## Iteration 10 — pump and RO skid visual refinement (November 8, 2026)

Reused the owned Water Simulator's `source/ui.js` `buildPart()` pump-rotor and RO-cartridge vocabulary in the existing unified Three.js scene. Added a motor fin array, guarded fan, pump feet/flange/bolts, uncalibrated service gauge, more recognizable RO vessel shells, end caps, rails, manifold and return piping. This replaces the disconnected-looking bare cylinders with a coherent illustrative equipment assembly. The visible three housings remain **one** original RO solver unit: no additional hydraulic or treatment stages were created. The gauge has no numeric label or calibrated pressure value; dimensions and material finishes are illustrative, not manufacturer specifications.

The fan rotates only while playback is running **and** the last coupled hour reports positive served pump electricity and treated water. This is a conservative visual condition, not a claim of RPM or actual pump duty-cycle measurement. No coordinator, engineering model, unit conversion or farm RNG changed. Syntax was parsed in V8 before commit; the integrated model and browser CI for this commit require independent review.

## Farming structures visual milestone (November 8, 2026, follow-on)

Farm enclosure detail now adapts the original Farm Simulator's *world/draw.js* fixtures: raised wired hutches, dropping trays, hinged door frames/latches, exterior hopper feeders and clipped watering bottles, plus exterior coop nesting access, ventilation, eaves, a cleated ramp and unfilled feeder. Three visual rabbit compartments per hutch row are illustrative only; they do not imply individual biological model cages or computed feeder/water inventory. No fixed volume is shown for these unmodeled fixtures. The roof profile was corrected to slope down from the ridge toward the eaves rather than forming a valley.

Performance: wire grids use two batched LineSegments geometries (one per hutch row) rather than hundreds of separate mesh draw calls. The mobile/desktop WebGL smoke tests now assert these screens and six visual door frames are present. The previously modeled chickens/rabbits remain unchanged in count and biological state, and the water/energy source engines are not modified. Verify close-up screenshots for shading, intersections, and scale.

## Adaptive mobile WebGL pixel budget (November 9, 2026)

The homestead renderer now adapts the original Farm Simulator `source/src/world/perf.js` Auto-quality strategy without touching the Farm, Water, Solar, or shared coordinator state. Its only output is a Three.js renderer pixel-ratio tier (1.0, 1.25, 1.5, capped by the physical device DPR). A rolling 90-frame median is used as an approximate on-screen FPS indicator; sustained <39 FPS for 2.2 s steps down, while >55 FPS for 10 s steps up, subject to a 5-second cooldown. Two failures at the highest tier lock out that tier until scene recreation. Hidden tabs and frame gaps >250 ms reset observations. These are **heuristic UX thresholds**, not calibrated GPU performance measurements; high refresh-rate displays, CPU throttling, and background activity may affect results. The algorithm changes only render resolution, not model clock, resource balances, livestock counts, or physical predictions. Future: explicit user quality override and GPU frame-time profiling. Browser smoke asserts bounded DPR and finite quality telemetry; dedicated throttled-device tests remain outstanding.
