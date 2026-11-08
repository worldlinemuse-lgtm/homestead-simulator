# Engineering decision log

## 2026-11-08 — Atomic resource-capacity edits (proposed, PR pending)

**Finding:** On main, `Coordinator.configure()` clamps stored battery Wh and treated-water liters when a user lowers capacity. This silently destroys modeled inventory, breaking the scenario's resource ledger without an explicit spill/discharge transaction. Existing reserve can also be raised above current stored energy.

**Decision:** Reject capacity edits that conflict with current inventory or battery reserve, before changing any configuration or state. Keep the full previous configuration unchanged after a rejected edit. Allow capacity exactly equal to current inventory. Treat this as a narrow safety invariant; no new physical equipment model is implied.

**Change scope:** `src/coordinator.js` and `tests/engine.test.cjs`. Original Solar, Water, Farm engines and Three.js scene are untouched.

**Verification gate:** Run `node --test tests/engine.test.cjs`, `python3 tests/browser_smoke.py` with Playwright installed, and inspect GitHub Actions for the PR head SHA. No full-suite or browser pass is claimed until independently observed. Test assertions cover unchanged inventory/config on invalid battery capacity, water capacity, and reserve; exact-fit capacities must succeed.

**Next:** Verify this PR, check for overlapping prior draft PRs before merging, and add versioned typed inter-engine resource contracts with units and provenance. Later, support intentional spill/discharge as explicit conserved transfers rather than silently clipping stored inventory.

**Model limitations:** The coupled coordinator still uses synthetic solar irradiance and assumed utilization/battery efficiencies/pump watts; farm daily demands are uniformly spread across hours. Do not infer certified electrical safety, potable water, or validated deficit biology.
