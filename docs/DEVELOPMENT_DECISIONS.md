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
