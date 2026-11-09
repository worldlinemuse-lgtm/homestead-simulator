# Visual development decisions

## 2026-11-09 — Staggered chicken foraging poses (draft)

**Baseline:** main at bd9d7dd442e42599de9d390769abc10a6802fa3c; PR #16 already merged. Engineering PRs #1–#8 remain separate and are not modified.

**Increment:** In src/scene.js, derive deterministic per-animal foraging pauses from the visual clock and stable animal ID. During pauses, stop root travel, retain ground-planted feet, and animate short head dips. No Farm biological RNG, inventory, feed, water, electrical load, mortality, or production model is touched. The animation is decorative, not evidence that feeding occurred.

**Verification gate:** Run Node integration suite and desktop/mobile WebGL browser smoke, inspect close-up screenshots of moving and paused hens, and check frame time with many chickens. No tests were run when this branch was authored; keep draft until verified.

**Limitations:** Existing Catmull-Rom yard circuits are still predetermined and do not provide obstacle-aware steering. Next increment should adapt Farm's source/src/world/agents.js and physics.js avoidance to continuous collision geometry, with terrain and fence tests. Maintain distinct visual behavior from biological state.
