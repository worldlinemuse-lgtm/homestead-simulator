# Energy-ledger boundary validation — 2026-11-08

## Decision
Validate all inputs to `allocateEnergy` before arithmetic. NaN can evade a check of the form `Math.abs(residual) >= tolerance`; a non-finite residual must be rejected explicitly. Energy values use Wh, efficiencies are dimensionless in (0,1], and inventory must be within the battery's reserve and capacity. This is a safety check on the **experimental** coordinator, not validation of the full Solar Sandbox production dispatcher.

## Provenance and scope
Based on the existing `src/coordinator.js` main-branch model, which uses a synthetic irradiance profile and assumed battery efficiency, not measured equipment response. The original Solar, Water and Farm repos remain unchanged. No physical calibration claim is made.

## Verification
Run `node --test tests/energy-boundaries.test.cjs`, `node --test tests/*.test.cjs` after merging the separate CI-discovery proposal, and the Playwright browser smoke suite. The current main workflow only invokes `tests/engine.test.cjs`, so the new test is not automatically discovered until the workflow is updated.

## Integration order
PRs #1/#3 both modify capacity inventory handling; reconcile instead of merging independently. PR #2 and #6 also modify coordinator.js; resolve against latest main and rerun the full suite. PR #4 introduces resource contracts, and PR #5 improves CI discovery; both require review before merging. Next, connect the resource contract to chronological ledgers and improve source-backed dispatch and pump curves.
