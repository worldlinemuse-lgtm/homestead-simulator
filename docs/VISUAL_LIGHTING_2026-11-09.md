# Visual roadmap — 2026-11-09: chronological sun/shadow increment

## Current source and proof boundary
PR #14 (shared plumage geometry) is merged into main. Outstanding engineering PRs #1–#8 remain separate. The Farm source `source/src/world/perf.js` already informed the unified simulator's adaptive DPR, so do not duplicate that work. The existing renderer already adjusts sky brightness from the coordinator's hour but keeps the shadow light in a fixed position. This produces implausible fixed-direction shadows during a 24-hour scenario.

## This increment
Move the 3D directional key light east-to-west and vary sky color, twilight warmth, and shadow intensity from the **same authoritative snapshot.clock.hourOfDay** used by the scene's existing weather and livestock visuals. Synthetic cloud transmittance from the scenario affects illumination. Expose `visualSun` diagnostics and verify a 12-hour step and reset in the desktop/mobile browser smoke.

This is **artistic solar lighting** only. It is not an astronomical ephemeris, a site-specific solar altitude, a validated irradiance source, a weather measurement, or an electrical-energy input. The actual Solar Sandbox energy calculations, battery dispatch, water hydraulics, Farm biology and resource ledgers remain untouched. The visible sun angle must never be used to calculate PV yield.

## Proof gate and next work
Require exact-head numerical and browser CI, inspect day/night screenshots and performance, then merge if both are satisfactory. Next highest-value visual task: reduce chicken draw calls by material-based instancing/merging without losing stable Farm animal IDs or wing motion, with GPU allocation and mobile frame-time evidence. Long-term engineering blockers are tracked in existing PRs #1–#8; don't silently merge them.
