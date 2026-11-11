# Development decision — 2026-11-08 — automatic engineering-test discovery

## Observed problem
The main-branch workflow `.github/workflows/tests.yml` ran only `tests/engine.test.cjs`, even though the development roadmap calls for additional standalone contract and integration tests. A new test such as `tests/resource-contract.test.cjs` would not run in CI automatically. A successful CI job could therefore omit newly introduced engineering checks.

## Proposed change
Discover every `tests/*.test.cjs` and run the files together under Node 20's native test runner. Fail closed if no matching tests exist. Syntax-check all `src/*.js` and `vendor/*.js`, also failing closed if no sources exist. Use explicit bash arrays, `nullglob`, and `set -euo pipefail` to avoid silently passing an unmatched wildcard. Preserve the existing separate Playwright workflow.

## Scope and evidence
This change only modifies CI coverage; it does not change numerical equations, animation, production configuration, or source-engine snapshots. The main branch currently has `tests/engine.test.cjs`; additional resource-contract tests are proposed on separate draft branches. GitHub workflow execution is required before claiming this CI change passes. Local GitHub clone was unavailable because DNS resolution for github.com failed in the execution environment. This does not establish that GitHub Actions is broken.

## Integration gates
1. Confirm CI discovers existing integration tests on this PR.
2. After resource-contract work is merged, confirm CI lists and executes the added contract test file.
3. Require numerical and browser workflows to pass before promoting engineering-sensitive PRs.
4. Continue source-specific conservation, evidence provenance, pump power coupling and scenario isolation work. Do not merge unverified modeling changes merely because syntax checks pass.
