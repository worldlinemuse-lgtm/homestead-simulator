# Development decision log

## 2026-11-08 — Zero-watt powered-pump interlock (draft, unverified)

**Observed in `src/coordinator.js` on main:** `allocateEnergy` accepted `pumpWh=0` and marked `pumpEnabled=true` whenever the base demand was served. `stepHour` interpreted this flag as a 50 psi powered pump despite zero electrical input. This is an unsupported energy-to-hydraulics coupling, not a physically validated pump model.

**Proposed correction:** Treat zero assumed pump input as an off/unsupported powered pump; preserve the existing explicit pump electrical assumption and conservation ledger. Regression test checks the pump enable flag, electrical charge, hydraulic pressure, produced water, and both residuals. The original Solar/Water/Farm engine snapshots remain untouched.

**Verification status:** NOT RUN. Local `git clone` failed because the environment could not resolve `github.com`. GitHub connector allowed source inspection and branch commits, but cannot run Node or Playwright. CI must run and confirm before merge. In particular verify that the original Water preset produces zero water at zero pump pressure; if not, trace passive-head behavior and distinguish it from electrically pumped water instead of masking it.

**Next engineering step:** Validate this interlock with CI and browser smoke tests. Then implement versioned typed contracts and per-transfer energy/water ledgers, before integrating manufacturer-supported pump curves or full Solar dispatch. Continue improving realistic, unified 3D equipment and direct interaction only with simulation-driven animation.

**Source references:** `solar-sandbox`, `water-purification-simulator`, `farm-sim` remain independent, pinned reference engines; no new physical validation is claimed.
