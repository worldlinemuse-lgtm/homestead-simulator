# Farm Ground-Level Inspection Camera — 2026-11-09

## Decision and evidence

After merging PR #11, automated browser tests proved chickens' world-planted stance feet, but the previous high-overhead Farm camera looked down from approximately 17 m and was 25 m away from the farm target. Its screenshots could not show detailed animal anatomy or toe movement; zoom was limited to 9–10 m. Visual quality could therefore neither be meaningfully reviewed nor appreciated by users, particularly on phones.

## Implemented increment

This visual-only camera iteration changes `src/scene.js`, `src/main.js` and `tests/browser_smoke.py`:

1. Farm view now enters from the same unbroken Three.js world at a near-ground eye of (41.8, 3.4, 10.2) m, aiming at (36.3, 0.52, 2.3) m. This is a cinematic viewpoint, not animal POV or a simulated observer.
2. Mouse-wheel and pinch zoom can approach the farm target down to 2.8 m (other world views retain an 8 m minimum). Both requested and interpolated cameras are constrained to remain at least 0.75 m above the actual triangulated heightfield. Camera interpolation retains the existing frame-rate-independent exponential easing.
3. Tapping an existing visible rabbit or chicken follows the animal's **current 3D rig position**, using its stable Farm model identifier. Dragging, pinching or scrolling releases tracking; changing views also releases tracking. If the animal disappears from the biological model, its tracked ID is cleared safely. No additional farm model state or animation truth is invented.
4. The Farm scene hint now explains the interaction without adding a dashboard card. All equipment, paths and livestock remain inside a single continuous homestead.

## Proof gates

Desktop and 393 px mobile Playwright checks assert that the Farm target distance is within 3–12 m, both requested and rendered cameras are above the triangulated terrain, a wheel gesture actually brings the target closer to about 3 m, and no browser errors occur. The test captures new `desktop-farm-close.png` and `mobile-farm-close.png`, alongside the existing overview/farm/water snapshots. It retains the original 70-day GPU allocation and Farm/Solar/Water model numerical tests.

The camera is a **presentation/navigation tool**, not a collision-ready physical body. It may orbit through tree or fence visuals on extreme manual manipulations. Full obstacle avoidance, selected-animal occlusion checks and mobile FPS measurement are separate future tasks. Mouse hover does not automatically select an animal; a tap/click is required. Farm source biology, water/electrical physics and resource ledgers are unchanged.

## Next increment after CI and screenshot review

Improve actual chicken body detail and feather silhouette against close-up screenshots, with deliberately shared geometry or batched details so mobile draw calls do not regress significantly. Preserve the pinned Farm Simulator's visual morphology inspiration and typed biological boundaries. Do not add numerical animal kinematics unless there is a validated source model for them.
