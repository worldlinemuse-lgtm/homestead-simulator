# Atomic inventory-preserving scenario configuration — 2026-11-10

## Reconciliation
This single implementation incorporates the overlapping remedies proposed by PRs #1 and #3 on current `main`, including the already-merged PR #7 energy-domain validation and PR #6 transactional hydraulic solver. Neither original scientific engine nor the 3D scene is changed.

## Invariant
Stored battery Wh and water L are live model state, not editable capacities. `configure()` validates the proposed configuration and **all** live capacity and reserve constraints before assigning it. An incompatible edit throws without changing config, resource inventories, clock, last interval, or cumulative ledger. Compatible edits preserve stored inventory exactly. A capacity reduction below current inventory requires a separately modeled explicit transfer or disposal, not silent clipping.

Battery reset inventory remains part of the configuration contract; changing capacity below the configured reset inventory requires an explicit compatible reset-inventory edit too. The existing UI does not currently expose capacity editing controls.

## Proof
`tests/engine.test.cjs` adds cases for rejected battery/water/reserve edits, combined atomic rollback, non-finite settings, exact-fit capacities, unchanged cumulative ledger, legal reset and post-step live reserve enforcement. CI runs all `tests/*.test.cjs`, JS syntax checks, and desktop/mobile browser smoke on the exact PR candidate. Do not merge before both checks pass.

## Model limitations
This change does not calibrate battery dispatch, solar generation, hydraulic pump power, or farm deficit biology. Future explicit transfer/disposal events should use PR #4's resource identity and unit contracts.

## 2026-11-11 — Electrically powered water pump interlock (PR #2)

The experimental one-hour coordinator previously enabled the 50 psi electrical pump when configured pump demand was zero, resulting in unsupported powered head for no modeled electricity. The energy allocator now requires strictly positive demand and enough allocatable Wh before enabling the pump, with no EPS allowance for an energy-short request. The original water hydraulic network is still stepped on its independent working snapshot; its output is not overwritten or artificially zeroed.

Regression tests exercise zero pump input with source-backed preset E, sub-Wh requests without supply, a fully funded pump, an insufficient-power request, pressure flag and both conservation residuals. Any nonzero unpowered output from another topology would need source-level inspection and identification as passive head rather than arbitrary suppression. No claim of pump manufacturer's electrical input curve, water safety or field calibration.
