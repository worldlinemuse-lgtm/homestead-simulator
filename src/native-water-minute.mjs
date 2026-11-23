/**
 * A minute-scale adapter for the ORIGINAL Water engine.
 *
 * Scientific solver: water-purification-simulator/source/engine.js,
 * blob e3e516aa462272d83442acc7904e5592eeb9f6e7,
 * vendored unchanged within vendor/water-engine.js.
 *
 * Pump electrical demand is metered elsewhere; the hydraulic pressure is
 * enabled only if the minute's full electrical allocation is delivered.
 * Gravity-fed flows remain governed by the original hydraulic solver.
 */
const EPS = 1e-7;
const validate = (name, x) => {
  if (!Number.isFinite(x) || x < 0) throw new RangeError(name + " must be finite and nonnegative");
  return x;
};
export const ORIGINAL_WATER_ENGINE_BLOB = "e3e516aa462272d83442acc7904e5592eeb9f6e7";

/**
 * @param {object} core - original HomesteadWaterCore with cloneWorld and step
 * @param {object} options
 * @param {number} options.pumpPressurePsi
 * @param {string} [options.pumpId] - exact model part ID; defaults to first pump_sky
 */
export function createOriginalWaterMinuteStep(core, {pumpPressurePsi, pumpId} = {}) {
  if (!core || typeof core.cloneWorld !== "function" || typeof core.step !== "function")
    throw new TypeError("Original Water cloneWorld/step engine required");
  validate("pumpPressurePsi", pumpPressurePsi);
  if (pumpId !== undefined && (typeof pumpId !== "string" || !pumpId))
    throw new TypeError("Invalid Water pump ID");

  return function waterStep({minute, requestedWh, deliveredWh, state}) {
    if (!Number.isSafeInteger(minute) || minute < 0) throw new RangeError("Invalid water minute");
    validate("requestedWh", requestedWh);
    validate("deliveredWh", deliveredWh);
    if (deliveredWh > requestedWh + EPS) throw new RangeError("Water electrical allocation exceeds request");
    if (!state || !Array.isArray(state.parts)) throw new TypeError("Native Water world required");
    const world = core.cloneWorld(state);
    if (!world || world === state || !Array.isArray(world.parts))
      throw new Error("Original Water engine did not isolate state");
    const before = validate("cumulative native water production", world.produced);
    const pump = world.parts.find(p => pumpId ? String(p.id) === pumpId : p.type === "pump_sky");
    if (requestedWh > 0 && !pump) throw new Error("Powered native Water pump not found");
    const pumpEnabled = !!pump && requestedWh > 0 &&
      deliveredWh + EPS >= requestedWh && pumpPressurePsi > 0;
    if (pump) {
      if (!pump.params || typeof pump.params !== "object")
        throw new TypeError("Invalid native Water pump settings");
      pump.params.psi = pumpEnabled ? pumpPressurePsi : 0;
    }
    // Advance exactly one native minute using its own bounded hydraulic
    // timesteps. The solver can shorten a step to avoid emptying/overfilling.
    let elapsed = 0, iterations = 0;
    while (elapsed < 60 - EPS) {
      const requestSeconds = Math.min(60 - elapsed, 60);
      const r = core.step(world, requestSeconds, 1);
      if (!r || !Number.isFinite(r.dt) || r.dt <= 0 ||
          r.dt > requestSeconds + EPS)
        throw new RangeError("Original Water engine returned invalid timestep");
      elapsed += r.dt;
      if (++iterations > 1000) throw new Error("Native Water substep iteration limit");
    }
    const produced = validate("cumulative native water production", world.produced);
    if (produced + EPS < before)
      throw new RangeError("Original Water production moved backwards");
    return {
      deliveredL: Math.max(0, produced - before),
      state: world,
      native: {
        source: "water-purification-simulator/source/engine.js",
        sourceBlob: ORIGINAL_WATER_ENGINE_BLOB,
        pumpEnabled, elapsedSeconds: elapsed,
        hydraulicSubsteps: iterations
      }
    };
  };
}
