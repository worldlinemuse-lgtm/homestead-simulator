# Visual decision 2026-11-09 — Model-gated warm porch and window illumination

## Existing basis
Main includes PR #15's scenario-hour sun and synthetic cloud lighting, PR #14's shared plumage geometry, and PR #9's model-gated flows. The upstream Water Simulator uses unshadowed instanced flows and bounded material brightness, while Farm Simulator's performance tier limits DPR. Preserve both principles. Engineering PRs #2, #3, #4, #6, #7 and #8 remain separate.

## Increment
Two compact 3D wall-mounted lantern fixtures (house entry and henhouse) cast bounded warm light pools with unshadowed point lights. Existing house glazing uses a shared emissive material for low-cost interior warmth. These are part of the same connected world, not separate scenery zones. Brightness follows the scenario clock's existing synthetic daylight curve and is gated by `snapshot.last.energy.servedBaseWh > 0`. At zero modeled base supply, fixtures and window emission are off. Reset restores daylight state. No additional numerical load, wiring, occupancy schedule, electric circuit or switch behavior is inferred. A powered lamp is **illustrative**, not evidence that a dedicated lighting load was served.

## Proof and limitations
The existing Playwright desktop/mobile workflow captures initial, 12-hour advanced, and reset screenshots; extended assertions verify two fixtures, daylight-off, supply-gated night light and reset, and explicitly report `modeledLampLoad: false`. Existing integrated model tests remain unchanged. No new engine mutations or new source dependencies. Point lights do not cast shadows; these are bounded visual accents rather than photometric manufacturer fixtures. Performance impact: two additional active lights and a shared emissive material. Review mobile FPS and nighttime screenshots before merge.

## Next
If lighting passes, prioritize material-based feather draw-call batching or realistic obstacle-aware animal locomotion using the original Farm physics/agents source. Keep any visual steering downstream of the biological engine. If conservation/zero-watt/non-finite engineering PRs are validated and urgent, integrate them separately with numerical proof.
