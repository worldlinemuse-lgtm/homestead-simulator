# Resource transfer contract v1 — integrated operational ledger

## Version, scope and provenance
PR #4 now connects the cross-engine transfer contract to the live coordinator, instead of shipping only an unused standalone validator. Electrical quantities are Wh, treated water L, feed kg (reserved for later source-backed feed integration). Every transfer has a resource, exact canonical unit, source, destination, hour and evidence classification. Evidence metadata is not a truth or safety certificate.

The original Solar, Water and Farm engine source bundles remain unchanged. Electricity originates from the *synthetic* PV scenario (published upper envelope adjusted by explicit assumptions); charging, discharge losses and pump electricity are *assumed* scenario accounting. Water treatment output derives from the original Water solver but remains uncalibrated as potable treatment. Livestock draw is sourced from Farm daily model demand spread uniformly over 24 hours.

## Actual one-hour accounting
Energy: synthetic solar input -> bus -> base load, pump, battery inventory, charge loss and curtailment. Battery inventory -> load, pump and discharge loss. Both charge conversion and battery discharge loss are explicit destinations. Contract validates independently computed current-minus-previous battery inventory, each load, pump input, losses, curtailment and solar bus balance.

Water: original treatment output -> tank inventory; tank inventory -> farm livestock and overflow. Contract validates current-minus-previous tank inventory, treatment output, consumption and overflow. Water demand deficit is **not** a water transfer: unavailable water cannot be transferred.

The standalone ledger's zero residual is not sufficient proof by itself. auditHour() additionally compares endpoint totals to independently supplied per-hour model quantities, rejecting mismatches, invalid units, invalid values, arithmetic overflow and inconsistent stores. All checks run *before* hydraulic, energy and clock state commit. Last-hour snapshot includes resourceAudit; reset and serialization preserve previous modeling assumptions.

## Correctness and release gates
- Run all tests via node --test tests/*.test.cjs (CI discovers files including resource-contract.test.cjs).
- Validate deterministic model replay, finite values, synthetic PV and model-linked water and Farm behaviors.
- Check zero pump power, funded power and consumption/overflow edge cases.
- Inspect desktop/mobile Playwright screenshots and runtime console.
- Confirm Pages deployment after merge; never equate a merge with a deployed release.

The original capacity and pump guards from merged PRs #3 and #2 are preserved. No original source repositories are modified. Source pinning and physical-model calibration remain separate tasks.
