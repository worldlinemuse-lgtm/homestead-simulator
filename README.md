# Homestead Simulator

Unified energy, water and food planning platform.

**Live site:** https://worldlinemuse-lgtm.github.io/homestead-simulator/

## What this is

A hub for three simulators that each stand on their own, built to share
numbers with each other over time:

- **Energy** — [Solar Sandbox](https://worldlinemuse-lgtm.github.io/solar-sandbox/)
  ([source](https://github.com/worldlinemuse-lgtm/solar-sandbox)): solar
  generation, batteries, electrical infrastructure, weather, appliance
  loads, system sizing, equipment selection.
- **Water** — [Water Purification Simulator](https://worldlinemuse-lgtm.github.io/water-purification-simulator/)
  ([source](https://github.com/worldlinemuse-lgtm/water-purification-simulator)):
  configurable water treatment trains, treatment performance, flow
  calculations, modeled output quality. Simulation only, never certified
  drinking water.
- **Food** — [Farm Simulator](https://worldlinemuse-lgtm.github.io/farm-sim/)
  ([source](https://github.com/worldlinemuse-lgtm/farm-sim)): rabbit and
  chicken farm planning, animal production models, buildings, environmental
  conditions, 3D visualization. A teaching model, not a validated forecast.

## What gets built here

The integration layer — not a merge of the three codebases. The rules:

1. **Preserve the originals.** The three repositories stay operational and
   independently testable. They remain the source of truth for each engine.
2. **Integrate by adapters, not by merging.** Each simulator joins the
   platform without changing its physics, so existing behavior and test
   results can be compared before and after.
3. **Standardize data contracts first.** Quantities, units, timestamps,
   locations, provenance, uncertainty, and serialized simulation states —
   agreed before any coupling.
4. **Cross-simulator resource accounting.** Energy, water, and agricultural
   demand exchanged through explicit interfaces, with conservation and
   chronological integration tests. Example: a solar-powered water pump
   supplying livestock, pump consumption deducted from the energy budget,
   animal water demand deducted from storage.
5. **Validation per discipline.** Solar Sandbox's E0–E2 mathematical
   validation approach carries over, but each discipline gets its own
   scientifically appropriate validation. Electrical, water treatment, and
   biological models are not validated by identical tests.

## What is not built yet

The resource accounting, the shared simulation clock, the data contracts,
unified scenarios and reports, and the shared shopping/planning layer are
all planned, not built. This repository currently ships the hub page only.
Nothing here claims integration that does not exist yet.

## The hard problem, stated plainly

The three engines run on different clocks — solar is hourly on weather,
the farm is daily, water is steady-state flow rates. Reconciling those
clocks is the crux of the integration, and it gets designed before it gets
built.
