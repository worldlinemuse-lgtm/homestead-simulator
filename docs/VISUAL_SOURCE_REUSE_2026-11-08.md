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

## Next improvements

1. Adapt Farm's obstacle-aware roaming, nesting and enclosure collision into native 3D, without modifying biological RNG.
2. Adapt Farm's auto quality/FPS monitoring from world/perf.js for mobile WebGL.
3. Add weather and seasonal ground effects only once appropriate numerical climate fields exist, or clearly label an optional decorative climate view.
4. Improve geometry and materials for the actual pump/RO equipment, coop, water storage, PV mounts and fixtures using supported source identities and dimensions.
5. Independently inspect visuals and frame rates before asserting greater realism.

## Integration caution

Outstanding engineering PRs #1–#8 modify other parts of the system and are not present in main as of this iteration. This visual branch starts from main; verify against newer coordinator contracts before integration.
