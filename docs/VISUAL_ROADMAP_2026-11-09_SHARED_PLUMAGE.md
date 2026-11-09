# Visual roadmap — 2026-11-09, shared plumage buffer

Baseline: main includes merged visual PRs #9–#13. Existing pending engineering PRs #1–#8 remain separate; do not duplicate or merge them implicitly.

## Increment: remove per-feather GPU allocation churn

Original Farm Simulator `source/src/world/perf.js` uses visual-only rendering quality control; the unified scene already adapts its auto pixel ratio. PR #13 introduced 13 decorative feather meshes per chicken, each originally allocating a unique 12×9 sphere buffer. This increment preserves the feather silhouettes, transforms, materials and individual chicken identities but uses one immutable shared sphere buffer for all decorative feathers.

Ownership contract: shared feather geometry is excluded from the per-animal `ownedAnimalGeometry` set and retirement disposal. Scene-level cleanup remains responsible for its disposal. All other unique animal geometries remain tracked and freed. No model, ledger, or population changes. GPU geometry allocations decrease by approximately 13 per chicken (depending on prior rendering cache state); **draw calls do not decrease**, so this is not a claim of complete mobile optimization.

Proof: browser smoke checks exactly 13 decorative feathers per real chicken, shared geometry flag, reduced per-animal owned allocations and the existing 70-day birth/death GPU regression. Verify desktop/mobile screenshots and both engineering/browser CI workflows before merging.

Next: batch static feather surfaces by material without losing per-chicken rigs; compare measured WebGL draw calls and mobile FPS against this baseline. Do not invent physical feather movement or biological outcomes.
