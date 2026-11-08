# Resource transfer contract v1 — engineering decision (2026-11-08)

## Decision
Introduce `src/resource-contract.js` as a **standalone, side-effect-free** cross-engine transaction validator. It is NOT yet wired into `src/coordinator.js`; do not claim the current simulation has migrated to this contract. A transfer identifies resource, exact canonical unit, source equipment, destination equipment, nonnegative finite quantity, integer scenario hour, and evidence class. Ledgers reject mixed resources and report per-endpoint net balances and a conservation residual.

Canonical units: electrical energy Wh, water L, feed kg. Conversions must be explicit at adapter boundaries. Evidence labels distinguish measured, manufacturer, published model, assumed, and synthetic. They are metadata, not verification of truth.

## Why
The current coordinator reconciles total energy and water, but does not identify each physical source and sink or enforce typed inter-engine transfers. An independent contract permits later adapter integration and testable audit trails without rewriting original upstream engines.

## Acceptance / release gates
- Standalone `node --test tests/resource-contract.test.cjs` must pass.
- Existing `node --test tests/engine.test.cjs` must pass.
- Existing Playwright smoke checks must pass before any UI or coordinator integration is merged.
- Future coordinator migration must represent PV, battery, curtailment, losses, loads, treatment, tank, livestock and overflow as separate nodes; prove per-hour closure and reject impossible transfers.
- Never treat the balancing ledger as evidence that the physical pump, PV dispatcher or farm biology is accurate.
- Verify and reconcile prior draft PRs before touching capacity reconfiguration or zero-watt pump interlock; avoid duplicating their changes.

## Upstream source snapshot review
- Solar Sandbox main observed at `871dd8c0ef03a05feb339c9761ead900875f16b5`.
- Water Purification main observed at `bd1bfedc8e53d71792f532c5a89d80a33dcf6700`.
- Farm Simulator main observed at `d6614d7981535fa2b74be86e0c5356af57b56e3b`.
- Homestead main observed at `3d93edae3cf1b4f9ef23732c4c8c6c0054f9a295`.

## Next increment
Wire transfer recording into coordinator in a separate PR with typed source/sink accounting and deterministic independent numerical benchmarks. Preserve original engines, the continuous 3D scene and existing interface. Keep biological shortage impacts explicitly unmodeled pending sourced rules.
