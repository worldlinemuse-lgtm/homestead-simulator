# Integration gates for outstanding engineering pull requests (2026-11-09)

Status: **review plan only; no source changes merged or tests asserted**. Based on direct inspection of main's `src/coordinator.js`, `tests/engine.test.cjs`, `.github/workflows/tests.yml`, open PR metadata #1–#7, and selected PR branch files. Recheck SHAs and PR diffs immediately before integration.

## Current main findings

- `configure()` still clamps battery and water inventories on capacity reduction without recording resource loss. Main coordinator blob: `59655c17ac6cf751d8221978e17bd14cd0cfaf3e`.
- `allocateEnergy()` permits a zero-watt pump to satisfy its activation condition, and `stepHour()` assigns the hydraulic pump 50 psi whenever `pumpEnabled` is true. This is an unverified physical coupling.
- The water solver checks `r.dt>0` before confirming `Number.isFinite(r.dt)`, but the computed `treatedL` only checks `treatedL>=-EPS`; finite and monotonic checks must be explicit.
- The energy ledger's `Math.abs(residualWh)<1e-5` rejects NaN residuals, but inputs must be validated **before** they can alter state; do not overclaim that all non-finite values pass conservation.
- Main CI runs only `tests/engine.test.cjs`; tests introduced by other PRs are not discovered.
- `src/resource-contract.js` exists on PR #4's branch, not on the inspected main. Its current contract is a balanced transfer bookkeeping API; it is **not** yet an integrated physical ledger.
- Farm engine is a mutable singleton; do not run simultaneous coordinator scenarios until isolated.

## Proposed safe dependency order

1. **#5 CI discovery first**: review the shell glob syntax and ensure all `tests/*.test.cjs` execute, including tests added later. Run `node --check` on source/vendor and `node --test tests/*.test.cjs` locally or in Actions. Verify browser smoke separately.
2. **#3 vs #1 capacity editing**: overlapping fixes to the same coordinator. Compare actual patches, select a single canonical implementation, and close the superseded duplicate only after test coverage for rejection, unchanged state, equal-boundary acceptance, and reserve constraints. Never merge both blindly.
3. **#2 pump interlock**: check zero electrical input and zero available energy separately. Establish whether the original Water network allows physically legitimate passive gravity flow at zero pump head; do not equate all flow with powered pumping.
4. **#6 water finite checks** and **#7 energy boundaries**: both touch coordinator; integrate sequentially after rebasing against latest main. Add fault-injection cases with no partial commit on failed hour; verify solver mutations are rolled back or fail the scenario explicitly.
5. **#4 resource contract**: land and test standalone API after CI discovery. Then create a **separate** coordinator integration PR with explicit external source/sink accounts, storage deltas, losses, deficits and overflow; prevent balanced bookkeeping entries from masquerading as proof of real physics.

## Engineering acceptance gates

- Numerical: finite input/output, unit consistency (Wh, L, kg), nonnegative inventory, explicit losses and external boundaries, conservation residuals at each hour and after 24+ hours, zero generation/pumping, empty/full storage, overcapacity edits, missing/invalid solver output.
- Temporal: deterministic seeded reruns, no duplicated farm-day transitions, explicit per-hour load allocation assumption, no silent state corruption after failure.
- Provenance: maintain original source blob hashes and model-specific published/manufacturer evidence; synthetic irradiance and pump electrical draw remain assumptions.
- Visual: Playwright desktop/mobile smoke, inspect scene loading and state-driven animations; don't replace the continuous property with separate zones.
- Release: successful relevant Actions and browser tests on the **actual integration SHA**; draft PRs stay unmerged until evidence is recorded.

## Upstream source boundaries

Solar: `worldlinemuse-lgtm/solar-sandbox` is authoritative for reference PV/electrical models and product topology; the homestead currently uses a synthetic irradiance envelope, not its validated production dispatch. Water: `worldlinemuse-lgtm/water-purification-simulator` is authoritative for hydraulic flow, but the pump electrical-to-pressure curve remains assumed. Farm: `worldlinemuse-lgtm/farm-sim` is authoritative for seeded daily biology; the uniform 24-hour distribution and deficit-response behavior are not validated.

## Next increment

After CI coverage is confirmed, consolidate overlapping capacity edits and run the complete numerical/browser suite on the merged integration candidate. Only then wire the transfer ledger to the live coordinator, with transactional rollback on solver failure. Record each integration commit SHA, test command, test result, and remaining caveat here.
