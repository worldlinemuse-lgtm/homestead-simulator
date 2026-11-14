"use strict";
// Compatibility entrypoint for the currently deployed CI glob (tests/*.test.cjs).
// The complete independent ESM contract suite is imported and registered with
// node:test; it must execute even before the primary workflow fix is merged.
// Remove this bridge only after CI reliably discovers all .test.mjs suites.
require("node:assert/strict");
void import("./native-ledger-independent-contract.test.mjs").catch(error=>{
  console.error("Independent ledger contract suite failed to load",error);
  process.exitCode=1;
});
