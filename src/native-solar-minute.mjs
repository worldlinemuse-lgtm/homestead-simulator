/**
 * Adapter for the ORIGINAL solar-sandbox/source/sim.js SIM.step().
 *
 * Provenance: worldlinemuse-lgtm/solar-sandbox source/sim.js
 * blob dccf27949460a044661c1b99eca0e19343ef0c47.
 *
 * This does not recreate PV, MPPT, inverter or battery calculations.
 * It runs the native minute, reads its metered appliance delivery, and restores
 * the original live simulator so a caller's failed exchange cannot advance it.
 *
 * The complete original Solar browser runtime must already be loaded; no
 * estimated PV fallback is permitted. Homestead injects a single synthetic
 * appliance representing aggregate requested AC load (not a new power model).
 */
const YEAR_MINUTES = 365 * 1440;
function finiteNonnegative(name, value) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(name + " must be finite and nonnegative");
  return value;
}
const clone = value => structuredClone(value);

export const ORIGINAL_SOLAR_STEP_BLOB = "dccf27949460a044661c1b99eca0e19343ef0c47";

/**
 * @param {object} sim - Original Solar sandbox window.SIM, NOT SolarNextCore.
 * @param {object} opts
 * @param {number} opts.originMinute - Source Solar calendar minute at Homestead clock zero.
 * @returns {(request: {minute:number, requestedWh:number, state:object}) => object}
 */
export function createOriginalSolarMinuteStep(sim, {originMinute = 0} = {}) {
  if (!sim || typeof sim.step !== "function" || typeof sim.grabState !== "function" ||
      typeof sim.putState !== "function" || !sim.S || !sim.S.cfg)
    throw new TypeError("Original Solar SIM.step/grabState/putState runtime required");
  if (!Number.isSafeInteger(originMinute) || originMinute < 0 || originMinute >= YEAR_MINUTES)
    throw new RangeError("Invalid native Solar calendar origin");

  return function solarStep({minute, requestedWh, state}) {
    if (!Number.isSafeInteger(minute) || minute < 0) throw new RangeError("Invalid Solar minute");
    finiteNonnegative("requestedWh", requestedWh);
    const requestedW = finiteNonnegative("requestedW", requestedWh * 60);
    if (!state || typeof state !== "object" ||
        state.t !== (originMinute + minute) % YEAR_MINUTES)
      throw new RangeError("Native Solar state/clock mismatch");
    if (sim.S.playing) throw new Error("Original Solar runtime must be paused for isolated stepping");

    // grabState() in the original is a SHALLOW snapshot; deep-copy both sides
    // so nested stats, logs and appliance state cannot leak across a rollback.
    const original = clone(sim.grabState());
    const quietBefore = sim.S.quiet;
    let entered = false;
    try {
      const input = clone(state);
      input.loads = [{
        id: "homestead-demand", name: "Homestead AC demand",
        short: "Homestead", w: requestedW, qty: 1, surge: 1,
        mode: "on", wins: [[0, 0]], cyc: null, thermo: null,
        chg: null, off: 0, volt: 120, leg: 1
      }];
      const previousServed = finiteNonnegative("native servedWh", input.stats?.served);
      sim.S.quiet = true; // prevent browser log/UI mutations during model invocation
      sim.putState(input);
      entered = true;
      sim.step(false);
      const updated = clone(sim.grabState());
      if (updated.t !== (input.t + 1) % YEAR_MINUTES)
        throw new Error("Original Solar engine did not advance one minute");
      const nextServed = finiteNonnegative("native servedWh", updated.stats?.served);
      const deliveredWh = nextServed - previousServed;
      if (!Number.isFinite(deliveredWh) || deliveredWh < -1e-7 ||
          deliveredWh > requestedWh + 1e-7)
        throw new RangeError("Original Solar delivered energy outside requested range");
      const live = updated.live;
      if (!live || !Number.isFinite(live.served) ||
          Math.abs(deliveredWh - live.served / 60) > 1e-5)
        throw new Error("Original Solar per-minute delivery disagrees with native metering");
      return {
        deliveredWh: Math.max(0, deliveredWh),
        state: updated,
        native: {
          source: "solar-sandbox/source/sim.js",
          sourceBlob: ORIGINAL_SOLAR_STEP_BLOB,
          acRequestedWh: requestedWh,
          acServedWh: Math.max(0, deliveredWh),
          pvControllerWh: finiteNonnegative("native controller Wh", live.mOut) / 60,
          generatorAcWh: finiteNonnegative("native generator AC Wh", live.genAC ?? 0) / 60,
          batterySoc: finiteNonnegative("native battery SoC", updated.soc),
          inverterRunning: !!live.invRun,
          controllerStatus: live.state
        }
      };
    } finally {
      // Restoration is mandatory even when the native runtime throws after a
      // partial state mutation; never let a failed minute corrupt another run.
      try {
        if (entered) sim.putState(original);
      } finally {
        sim.S.quiet = quietBefore;
      }
    }
  };
}
