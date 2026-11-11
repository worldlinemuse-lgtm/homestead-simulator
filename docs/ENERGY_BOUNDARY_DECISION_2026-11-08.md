# Energy allocation input boundaries — reconciled with current main

The experimental allocator now rejects invalid Wh inputs, invalid efficiency ratios, inconsistent reserve/capacity/inventory, and non-finite input sums, residuals and ledger outputs. It does not change the pinned Solar, Water, or Farm engines or claim equipment calibration.

Regression tests are in `tests/energy-boundaries.test.cjs`. CI now discovers all `tests/*.test.cjs` through merged PR #5. The current coordinator includes the water-solver transaction protections from merged PR #6. Full model and browser checks must pass on the exact PR head before merge.

Future work: PR #1/#3 inventory-preserving configuration, PR #2 pump interlock, PR #4 versioned resource transfer contracts. Never silently delete stored resources.
