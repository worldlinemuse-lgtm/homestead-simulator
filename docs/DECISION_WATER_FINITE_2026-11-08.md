# Decision 2026-11-08 — Fail-closed hydraulic numeric boundaries

## Observed defect
The active coordinator previously checked `treatedL >= -EPS` and `r.dt > 0` without consistently validating cumulative water production. In JavaScript, comparisons with NaN are false; therefore a NaN cumulative production could evade the negative-production guard, poison the tank, and pass `Math.abs(NaN) >= threshold`-style conservation checks. Infinite production could also propagate into an invalid stored-water state. A null solver return could cause an opaque TypeError.

## Proposed correction
After each hydraulic solver substep, require a non-null result, finite positive bounded timestep, finite nondecreasing cumulative production; require finite nonnegative treated production at the hour boundary. Preserve source solver equations and the 3D scene. Fail closed rather than silently fabricate a physically valid state.

## Verification
Run `node --test tests/water-finite.test.cjs` and `node --test tests/*.test.cjs`, then the Playwright browser smoke test. The focused test injects invalid production states and checks a valid zero-production case. This change is not considered fully verified until the actual repository tests and browser tests execute successfully.

## Follow-on
Audit energy ledger finite inputs, transactional rollback after solver failure, and typed resource-transfer contracts. The coordinator remains experimental: synthetic irradiance, assumed pump watts, and uniform farm hourly demand are not manufacturer-calibrated predictions.
