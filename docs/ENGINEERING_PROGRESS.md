# Engineering development ledger

## 2026-11-08 — inventory-preserving reconfiguration (proposed PR)

**Finding:** `Coordinator.configure()` previously reduced `batteryWh` and `waterStoredL` to fit a smaller edited capacity without accounting for where the energy or water went. This violated conservation across user-driven equipment changes, even when each hourly solver step had zero residual.

**Change:** Reject edits that would set capacity below current inventory, atomically and before changing configuration. Add regression cases for battery and tank edits, preserved inventory and successful compatible edits. No equations, source engines, or scene topology changed.

**Verification:** The change and regression tests were committed on a feature branch. Automated tests have **not** been executed in this run: the isolated execution container could not resolve github.com for cloning. CI/maintainer should run `node --test tests/engine.test.cjs`, `python3 tests/browser_smoke.py`, and confirm the error is surfaced accessibly in the settings UI before merging. Existing original-source numerical benchmarks remain a separate requirement.

**Next priority:** Inspect `src/main.js` capacity controls and surface rejected edits as user-facing validation rather than uncaught exceptions; then introduce explicit inventory-transfer events and versioned resource contracts, preserving mass/energy accounting. Verify the final commit and browser workflow. Follow with full Solar dispatcher integration and manufacturer-based pump input curves; do not substitute unvalidated visual realism for these prerequisites.

**Evidence tier:** Conservation/ledger logic; no instrumented calibration or physical safety certification.
