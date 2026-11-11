# Architectural shell correction — 2026-11-09

## Baseline and problem

The unified homestead is now on the merged graphics revision of main (visual PR #9). But the house and henhouse were each rendered as a single opaque rectangular box, **then their windows and doors were applied on top**. That made the building look like a solid block with painted trim, and any future collision tests would incorrectly find walls where entrances ought to be.

## This increment: genuinely open wall assemblies

Changes are confined to the scene and browser regression suite. Both buildings now have:

- A segmented fixed front wall with empty door and window rectangles, created from a rectilinear band-sweep of opening edges.
- Continuous physical side and rear walls and a supported ground-floor slab; the two-story house also has an upper floor slab.
- Recessed window glazing in the openings, with outer mullions/sills/trim and doors occupying the right-sized gaps rather than sitting in front of a solid wall.
- Individually named wall segments carrying explicit *candidate* fixed-axis-aligned box collider dimensions in scene metres. These are spatial metadata, **not** evidence of a running dynamics/collision solver.
- Existing pitched roofs, closed gables, embedded foundation slabs, electric/water source engines, and animal animation left intact.

## Geometry details and tests

The house's actual wall apertures are five windows and one 2.18 m entry door; the henhouse has two windows, one human service entry and a separate chicken pop door.

The sweep algorithm derives **horizontal wall bands from actual opening boundaries**, then emits solid box segments only between active opening ranges in each band. Overlapping or invalid dimensions fail at construction time. This avoids expensive per-pixel transparency, hidden full-wall faces, or boolean mesh subtraction and leaves correct physical gaps for later collider implementation.

Desktop and mobile browser regression now raycast against the actual front-wall solids at the center of every intended opening and at reference positions in solid wall panels. Required evidence: six unobstructed house apertures, four unobstructed henhouse apertures, and at least one actual panel ray hit for each building. Existing 70-day animal GPU ownership, numerical accounting, and WebGL layout checks remain unchanged.

These dimensions are **illustrative**, not construction specifications; the scene remains visually stylized, and window panes are visually opaque reflective materials instead of physically accurate dielectric optical modeling. The wall segments are not a complete building code, thermal model or load-bearing analysis.

## Integration decision

- Branch: `visual/true-facade-openings-20261109`, based on main after PRs #5 and #9 were merged.
- Only this single architecture increment is proposed for merge. No changes to the Solar, Water or Farm engines, no alteration of resource quantities.
- Merge gate: numerics and Playwright desktop/mobile tests must pass for the final PR head. Review captured house/farm screenshots for believable proportions before merging.

## Next evidence-driven work

The largest remaining realism issues are visual foot-planting during chicken walking, more diverse path planning/animal interactions without inventing biological records, non-intersecting entrance/fixture geometry and physical-model-aware materials. Any dynamic physics implementation should wait until stable collider contracts cover the remaining world props.

## Open chicken access correction

The previous solid black chicken door had been placed directly across the 0.79 m access opening at y=1.24 m. The new panel is a **raised sliding hatch** above the opening, with visible guide rails. This is one fixed visual pose, not an assertion that the biological model opens/closes a door or that chickens can physically cross that threshold. Browser regression checks the panel's lower edge remains at least 0.02 m clear of the opening's upper edge.
