# Homestead Simulator — one linked 3D world

**Live:** https://worldlinemuse-lgtm.github.io/homestead-simulator/

## What is working (November 8, 2026)

The original navigation-only hub is now an interactive 3D WebGL application. Its unified world contains solar panels, batteries, a hydraulic treatment plant, a water tank, rabbit hutches, a coop, and animated livestock. Energy pulses, pump illumination, stored-water level, and the visible animal population follow numerical simulator state, not independent decorative clocks.

It is driven by **real pinned source-engine snapshots**:
- Solar Sandbox reference: bundled TypeScript browser engine, published-reference PV upper-envelope model. Original source: https://github.com/worldlinemuse-lgtm/solar-sandbox
- Water Purification Simulator: original hydraulic network/RO flow solver and dynamic water storage/throughput state. Original source: https://github.com/worldlinemuse-lgtm/water-purification-simulator
- Farm Simulator: original seeded rabbit/chicken daily biological model, electricity and animal water requirements. Original source: https://github.com/worldlinemuse-lgtm/farm-sim

Original project repositories and detailed interfaces remain unchanged and accessible from the 3D app.

## How the connection works

1. Shared coordinator steps forward in **one-hour accounting intervals**.
2. Solar published-reference equations calculate a PV upper-power envelope from an explicitly *synthetic* clear-sky irradiance profile and user-controlled cloud factor. An **assumed utilization factor of 0.72** converts that upper envelope into exploratory available power.
3. A separately declared experimental battery ledger serves household and farm demand, then powers an assumed-electrical-wattage water pump when sufficient supply exists. Battery charge/discharge losses and PV curtailment are reconciled.
4. Original Water hydraulic model preset E (stream > pump > reverse osmosis > outlet) advances in dynamic substeps. Water production is transferred into a shared storage reservoir; farm water consumption and overflow are debited explicitly.
5. Original Farm daily biological model advances at day boundaries. Its reported water/electrical demand is provisionally distributed uniformly over 24 hours. Water or energy shortfalls are shown, but **not** fed back into farm mortality, growth, egg laying or hatch rates without a validated model.
6. The Three.js scene renders the shared state in one spatial view. Visual animal movement cannot alter the original biological random stream.

**The result is working experimental cross-simulator resource accounting and visual integration, NOT yet fully validated physical model integration.**

## Engineering limitations — do not conceal these

- **Solar:** The reference PV upper envelope is not the legacy Solar Sandbox production dispatcher. Original real-weather, batteries, inverter/transient response, BMS and hardware topology are not all integrated. Solar utilization, synthetic irradiance, and battery efficiencies are labeled **assumptions**, not measurements.
- **Water:** The actual Water hydraulic solver is integrated. The pump electrical power requirement is a user-editable **assumption** because this selected pump's manufacturer electrical-input/performance curve is not independently established.
- **Farm:** The original daily biological model is reused, but daily demand is spread evenly over each 24-hour accounting period. Timing of loads and biological consequences of shortages are not validated.
- **Safety:** Hydraulic flow and modeled treatment stages do **not** certify safe drinking water. Nor does a 3D electrical rendering certify wiring compliance or a validated household backup duration.
- **Scenarios:** The underlying Farm model has global mutable state. This initial coordinator supports **one active simulation instance**. Simultaneous parallel scenario runs require serialized isolation.
- **Provenance:** Model snapshots were pinned on November 8, 2026. Each source component retains its original specialized tests and validation scope. Mathematical ledger closure is necessary but not sufficient for real-world prediction accuracy.

## How to use

Open the GitHub Pages site. Use Whole homestead, Solar, Water or Farm to focus the same 3D scene. Use Play / +1 hour / +1 day. Change clouds, background demand and explicitly assumed pump electrical draw in Details. Export the scenario results as JSON.

For a local development server:

    python3 -m http.server 8000

Then visit http://localhost:8000/. There are no required browser dependencies fetched from the internet: Three.js r170 (0.170.0) is vendored and MIT-licensed in vendor/ with its original license. An optional service worker caches the application for subsequent offline use after a successful first online visit.

## Source layout

- index.html — responsive workspace, simulation readouts, user controls.
- src/main.js — UI wiring, scenario settings, export and view switching.
- src/scene.js — unified Three.js WebGL world; only reads the shared snapshot.
- src/coordinator.js — chronological energy/water/farm transactions and conservation guards.
- vendor/solar-next-core.js — pinned original Solar reference browser bundle.
- vendor/water-engine.js — original Water engine in a namespace wrapper.
- vendor/farm-core.js — original Farm core modules, a required source helper, and namespace adapter.
- vendor/three.module.min.js — pinned Three.js r170 with license at vendor/THREE_LICENSE.
- tests/engine.test.cjs — deterministic model integration, numerical conservation and scenarios.
- tests/browser_smoke.py — browser UI/3D smoke check using Playwright.
- .github/workflows/ — automated model tests, browser checks.

## Build and testing

    node --test tests/engine.test.cjs
    python3 -m pip install playwright
    python3 -m playwright install chromium
    python3 tests/browser_smoke.py

Python 3 and Node.js are only required for tests and local development. The deployed application is a static HTML/JS app.

## Immediate engineering priorities

1. Formal, versioned inter-engine data contracts and distinct resource identities, locations, units and evidence.
2. Full Solar dispatcher adapter with genuine chronological weather and electrical constraints; avoid treating PV maximum envelope as guaranteed generation.
3. Manufacturer-specific hydraulic pump/electrical efficiency and demand models.
4. Deficit-response rules and time-resolved loads validated for farm biology.
5. Multi-scenario isolation, reliable state serialization, and independent numerical benchmarks.
6. More complete 3D construction/editing interactions while keeping model equations authoritative.

Model-source hashes: solar reference original blob ccf450a642ddc954689fea20556dfbbe7e308e99; water engine original blob e3e516aa462272d83442acc7904e5592eeb9f6e7. Farm core original file-level blob identifiers are documented in vendor/farm-core.js comments. All three originals remain independent.

**Rule:** Animation follows calculated state; animation never invents the engineering result.
