#!/usr/bin/env python3
"""3D WebGL + all-source-coupling browser smoke. Run from repository root."""
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args):pass
server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=["--enable-webgl","--use-gl=angle","--use-angle=swiftshader","--ignore-gpu-blocklist"])
        for mobile in (False,True):
            page=browser.new_page(viewport={"width":393 if mobile else 1280,"height":851 if mobile else 800},device_scale_factor=1)
            errors=[]
            page.on("pageerror",lambda e:errors.append(str(e)+"\n"+(getattr(e,"stack","") or "")))
            page.goto("http://127.0.0.1:%d/"%server.server_port,wait_until="load")
            try:
                page.wait_for_function("window.HomesteadApp && window.HomesteadApp.snapshot().farm.counts.n > 0",timeout=40000)
            except Exception as exc:
                # Startup failures must expose the first browser exception, not
                # only an opaque forty-second readiness timeout.
                raise AssertionError(f"Homestead startup failed (mobile={mobile}); page errors={errors!r}; url={page.url}") from exc
            assert page.locator("#world").is_visible()
            if mobile:
                assert page.evaluate("document.getElementById('summary').classList.contains('collapsed')")
                page.locator("#hudToggle").click()
                assert not page.evaluate("document.getElementById('summary').classList.contains('collapsed')")
                page.locator("#hudToggle").click()
                assert page.evaluate("document.getElementById('summary').classList.contains('collapsed')")
            page.locator("#inspectBtn").click()
            assert page.evaluate("getComputedStyle(document.querySelector('#inspector')).display") == "block"
            assert page.locator("#assetReadout").is_visible()
            page.locator("#closeInspector").click()
            assert page.evaluate("window.HomesteadApp.world().animals") > 0
            # Native Farm enclosure footprints are mapped from the original
            # model's feet coordinates, not authored freehand in Three.js.
            assert page.evaluate("""() => {
                const s=window.HomesteadApp.snapshot();
                const e=window.HomesteadApp.world().nativeEnclosureLayout;
                const relevant=s.farm.components.filter(c=>c.type==="run"||c.type==="hutch");
                return e.count===relevant.length&&e.count>=3&&
                  relevant.every(c=>{
                    const x=e.footprints.find(p=>p.id===c.id);
                    return x&&x.unit==="m"&&x.type===c.type&&
                      Math.abs((x.x1-x.x0)-c.w*0.3048)<1e-8&&
                      Math.abs((x.z1-x.z0)-c.d*0.3048)<1e-8;
                  });
            }""")
            light_out=ROOT/"tests"/"artifacts";light_out.mkdir(parents=True,exist_ok=True)
            # Visual sun and shadows are driven by coordinator hour, never
            # fed back into the Solar energy ledger. Check actual UI steps.
            initial_sun=page.evaluate("window.HomesteadApp.world().visualSun")
            initial_hour=page.evaluate("window.HomesteadApp.snapshot().clock.hourOfDay")
            assert initial_sun and initial_sun["hour"]==initial_hour, initial_sun
            assert initial_sun["syntheticClarity"]>=0 and initial_sun["syntheticClarity"]<=1
            assert initial_sun["directIntensity"]>=0
            initial_lamps=initial_sun["decorativeLighting"]
            assert initial_lamps["lampCount"]==2 and initial_lamps["modeledLampLoad"] is False
            assert initial_lamps["intensity"]==0, initial_lamps
            page.wait_for_timeout(350)
            page.screenshot(path=str(light_out/("mobile-light-initial.png" if mobile else "desktop-light-initial.png")))
            for _ in range(12):
                page.locator("#stepBtn").click()
            advanced_sun=page.evaluate("window.HomesteadApp.world().visualSun")
            advanced_hour=page.evaluate("window.HomesteadApp.snapshot().clock.hourOfDay")
            assert advanced_sun["hour"]==advanced_hour
            assert advanced_hour==(initial_hour+12)%24
            assert advanced_sun["daylight"] != initial_sun["daylight"], (initial_sun,advanced_sun)
            assert advanced_sun["directIntensity"]>=0
            assert advanced_sun["directIntensity"] != initial_sun["directIntensity"]
            advanced_lamps=advanced_sun["decorativeLighting"]
            assert advanced_lamps["lampCount"]==2
            assert advanced_lamps["modeledLampLoad"] is False
            assert advanced_lamps["baseSupplyWh"]>=0
            assert advanced_lamps["intensity"]>0 if advanced_lamps["baseSupplyWh"]>0 else advanced_lamps["intensity"]==0, advanced_lamps
            assert advanced_lamps["windowEmissive"]>0 if advanced_lamps["baseSupplyWh"]>0 else advanced_lamps["windowEmissive"]==0, advanced_lamps
            page.wait_for_timeout(350)
            page.screenshot(path=str(light_out/("mobile-light-advanced.png" if mobile else "desktop-light-advanced.png")))
            page.locator("#resetBtn").click()
            reset_sun=page.evaluate("window.HomesteadApp.world().visualSun")
            assert reset_sun["hour"]==initial_hour
            assert abs(reset_sun["directIntensity"]-initial_sun["directIntensity"])<1e-9
            assert reset_sun["decorativeLighting"]["intensity"]==0
            assert reset_sun["decorativeLighting"]["windowEmissive"]==0
            page.wait_for_timeout(350)
            page.screenshot(path=str(light_out/("mobile-light-reset.png" if mobile else "desktop-light-reset.png")))

            # Feather detail exists only on real Farm-model chicken rigs, not
            # synthetic scenery animals; each has 13 added feather meshes.
            plumage=page.evaluate("window.HomesteadApp.world().plumage")
            assert plumage["chickens"] > 0, plumage
            assert plumage["decorativeFeathers"] == 13*plumage["chickens"], plumage
            # All feathers share one immutable GPU geometry; no per-animal
            # disposal can free it while other live chickens still use it.
            assert plumage["sharedGeometry"] is True, plumage
            assert plumage["sharedFeatherGeometryCount"] == 1, plumage
            lifecycle=page.evaluate("window.HomesteadApp.world().animalLifecycle")
            assert lifecycle["ownedGeometries"] < 50*lifecycle["active"], lifecycle
            assert page.evaluate("window.HomesteadApp.world().paths") >= 8
            assert page.evaluate("window.HomesteadApp.world().meshes") >= 30
            # P0: GPU-rendered terrain triangles and all ground-height queries agree.
            # Foundations must extend beneath the lowest sampled terrain vertex;
            # scene scale is explicitly one metre per world unit.
            assert page.evaluate("""() => {
                const g=window.HomesteadApp.world().grounding;
                return g.unit==="m" && g.raycastMisses===0
                  && Number.isFinite(g.maxRayResidualM)
                  && g.maxRayResidualM < 0.0005
                  && g.foundationCount>=5
                  && g.minimumEmbedM>=0.30
                  && g.coverViolations===0
                  && ["Home and utility loads","Henhouse","Solar inverter and battery",
                      "Water treatment and storage","Treated-water storage tank"]
                     .every(s=>g.foundationAssets.includes(s));
            }""")
            # The raised hutches must contain visible mesh screens and usable-looking
            # door frames rather than opaque solid fronts. Geometry is illustrative.
            assert page.evaluate("window.HomesteadApp.world().housingScreenCount") >= 2
            assert page.evaluate("window.HomesteadApp.world().illustrativeCageDoors") == 6
            # Raycast the segmented facade geometry rather than relying on flags.
            audit=page.evaluate("window.HomesteadApp.world().structureAudit")
            assert audit["houseFacade"]["openingCount"] == 6, audit
            assert audit["coopFacade"]["openingCount"] == 4, audit
            for name in ("houseFacade","coopFacade"):
                facade=audit[name]
                assert facade["wallSegments"] >= 12, facade
                assert facade["blockedOpenings"] == [], facade
                assert facade["solidWallHits"] > 0, facade
            # The raised henhouse hatch cannot cover the pop-hole opening.
            assert audit["coopHatchClearanceM"] >= .02, audit
            # Geometry-derived measurements, not decorative property flags.
            assert page.evaluate("""() => {
                const a=window.HomesteadApp.world().structureAudit;
                return a.closedGables===4
                  && a.houseDoorHeightM>=2.0 && a.houseDoorHeightM<=2.5
                  && a.coopServiceDoorHeightM>=2.0 && a.coopServiceDoorHeightM<=2.5
                  && a.coopPopDoorHeightM>=0.5 && a.coopPopDoorHeightM<=1
                  && a.hasRampClearance && a.gateOpeningM-a.rampWidthM>=1
                  && a.hutchFenceClearanceM>=1;
            }""")
            # Visual-only adaptive DPR must never exceed physical device DPR or
            # change simulation time; the scene exposes its current render tier.
            assert page.evaluate("""() => {
                const v=window.HomesteadApp.world();
                return Number.isFinite(v.qualityFps) && v.qualityTier>=0
                  && v.qualityTier<=2 && v.qualityPixelRatio>=1
                  && v.qualityPixelRatio<=Math.max(1,devicePixelRatio)
                  && v.qualityChanges>=0;
            }""")
            # Renderer metadata must agree with the model snapshot.
            assert page.evaluate("""() => {
                const s = window.HomesteadApp.snapshot(), v = window.HomesteadApp.world();
                const expected = s.config.waterStorageCapacityL > 0
                  ? Math.min(1, Math.max(0, s.waterStoredL / s.config.waterStorageCapacityL)) : 0;
                return Math.abs(v.tankFillFraction - expected) < 1e-8
                  && v.visualFarmHour === s.clock.hourOfDay
                  && v.activeFlowPaths >= 0 && v.activeFlowPaths <= v.paths;
            }""")
            assert page.evaluate("getComputedStyle(document.querySelector('#inspector')).display") == "none"
            assert page.evaluate("window.HomesteadApp.snapshot().clock.hours")==0
            page.locator("#stepBtn").click()
            assert page.evaluate("window.HomesteadApp.snapshot().clock.hours")==1
            assert page.evaluate("""() => {
                const s = window.HomesteadApp.snapshot(), v = window.HomesteadApp.world();
                return Math.abs(v.tankFillFraction - (s.config.waterStorageCapacityL > 0 ? s.waterStoredL / s.config.waterStorageCapacityL : 0)) < 1e-8
                  && v.visualFarmHour === s.clock.hourOfDay;
            }""")
            # Reconciliation regression: stable IDs survive day advances; each
            # retired rig's unique GPU geometry is disposed rather than leaked.
            baseline=page.evaluate("window.HomesteadApp.world().animalLifecycle")
            assert baseline["active"] == page.evaluate("window.HomesteadApp.world().animals")
            assert len(baseline["stableIds"]) == len(set(baseline["stableIds"]))
            page.locator("[data-view=water]").click()
            page.locator("#dayBtn").click()
            assert page.evaluate("window.HomesteadApp.snapshot().clock.hours")==25
            after=page.evaluate("window.HomesteadApp.world().animalLifecycle")
            assert after["active"] == page.evaluate("window.HomesteadApp.world().animals")
            assert after["added"]-baseline["added"] <= 50
            assert after["ownedGeometries"] <= 60*max(1,after["active"])
            # Stable survivors must not be recreated even when their stage ages.
            survivors=set(baseline["stableIds"]) & set(after["stableIds"])
            assert after["added"]-baseline["added"] <= len(set(after["stableIds"])-set(baseline["stableIds"]))+1
            beforeMotion=page.evaluate("window.HomesteadApp.world().animalMotion")
            beforeNative=page.evaluate("window.HomesteadApp.world().nativeFarm")
            assert beforeNative["initialized"] is True and beforeNative["agentCount"]>0, beforeNative
            page.locator("#playBtn").click()
            assert page.evaluate("window.HomesteadApp.world().playing") is True
            page.wait_for_timeout(950)
            afterMotion=page.evaluate("window.HomesteadApp.world().animalMotion")
            afterNative=page.evaluate("window.HomesteadApp.world().nativeFarm")
            # Native fixed-step physics must actually advance. A foraging chicken can
            # legitimately pause at the exact frame sampled; assess cumulative travel,
            # not whether the current animation frame happens to be a walking pose.
            assert afterNative["visualSteps"] > beforeNative["visualSteps"]+10, (beforeNative,afterNative)
            assert afterMotion["chickenTravelM"] > beforeMotion["chickenTravelM"] + .05, (
                "Chickens must traverse the yard, not just hover in place",beforeMotion,afterMotion)
            assert afterMotion["maxRootGroundErrorM"] < 1e-9, afterMotion
            feet=page.evaluate("window.HomesteadApp.world().chickenFootContact")
            assert feet["unit"]=="m" and feet["chickens"]>0, feet
            # Two legs half a gait apart, 62% planted: a moving chicken
            # always has at least one planted and zero underground feet.
            assert feet["planted"] >= feet["chickens"], feet
            assert feet["maxPlantedSlipM"] < 1e-6, feet
            assert feet["maxPenetrationM"] < 1e-6, feet
            page.locator("[data-view=farm]").click()
            page.wait_for_timeout(650)
            (ROOT/"tests"/"artifacts").mkdir(exist_ok=True)
            page.screenshot(path=str((ROOT/"tests"/"artifacts"/
                ("mobile-farm-stride.png" if mobile else "desktop-farm-stride.png"))))
            page.locator("#playBtn").click()
            assert page.evaluate("window.HomesteadApp.world().playing") is False
            # Pause must land all animals immediately, even if the frozen gait
            # phase had them airborne; it must not keep walking toward spawn.
            assert page.evaluate("""() => {
                const w=window.HomesteadApp.world();
                return Number.isFinite(w.pausedGroundErrorM)
                  && w.pausedGroundErrorM<1e-9;
            }""")
            page.wait_for_timeout(130)
            assert page.evaluate("window.HomesteadApp.world().pausedGroundErrorM") < 1e-9
            resting=page.evaluate("window.HomesteadApp.world().chickenFootContact")
            assert resting["planted"] == 2*resting["chickens"], resting
            assert resting["swinging"] == 0, resting
            assert resting["maxPlantedSlipM"] < 1e-6, resting
            assert resting["maxPenetrationM"] < 1e-6, resting
            assert page.locator("#energyValue").inner_text().endswith("kWh")
            assert page.locator("#waterValue").inner_text().endswith("L")
            assert page.evaluate("document.getElementById('errors').style.display")!="block"
            assert not errors,errors
            out=ROOT/"tests"/"artifacts";out.mkdir(exist_ok=True)
            page.screenshot(path=str(out/("mobile-water.png" if mobile else "desktop-water.png")))
            page.locator("[data-view=overview]").click()
            page.wait_for_timeout(900)  # smooth camera reaches the whole-property waypoint
            page.screenshot(path=str(out/("mobile-overview.png" if mobile else "desktop-overview.png")))
            # Close-up capture of new hutch mesh, coop roof, nesting details and ramp.
            page.locator("[data-view=farm]").click()
            page.wait_for_timeout(950)
            camera=page.evaluate("window.HomesteadApp.world().camera")
            assert page.evaluate("window.HomesteadApp.world().view")=="farm"
            assert 3.0<camera["requestedDistanceM"]<12, camera
            assert camera["requestedHeightAboveGroundM"]>=.74, camera
            assert camera["heightAboveGroundM"]>=.74, camera
            page.screenshot(path=str(out/("mobile-farm.png" if mobile else "desktop-farm.png")))
            # User can inspect animals at a plausible close distance; the old
            # 10 m zoom minimum made the planted-foot animation impossible to see.
            rect=page.locator("#world").bounding_box()
            assert rect and rect["width"]>200
            page.mouse.move(rect["x"]+rect["width"]/2,rect["y"]+rect["height"]/2)
            page.mouse.wheel(0,-1100)
            page.wait_for_timeout(650)
            zoom=page.evaluate("window.HomesteadApp.world().camera")
            assert 2.7<=zoom["requestedDistanceM"]<camera["requestedDistanceM"]-.7, (camera,zoom)
            assert zoom["requestedHeightAboveGroundM"]>=.74, zoom
            assert zoom["heightAboveGroundM"]>=.74, zoom
            page.screenshot(path=str(out/("mobile-farm-close.png" if mobile else "desktop-farm-close.png")))
            if not mobile:
                # Reproduce the independent audit's 70-day GPU leak scenario.
                # Browser actions are genuine model steps, not fake snapshots.
                before70=page.evaluate("window.HomesteadApp.world().animalLifecycle")
                starting_hour=page.evaluate("window.HomesteadApp.snapshot().clock.hours")
                for _ in range(70):
                    page.locator("#dayBtn").click()
                after70=page.evaluate("window.HomesteadApp.world().animalLifecycle")
                assert after70["active"] <= 50
                assert after70["ownedGeometries"] <= 60*max(1,after70["active"])
                assert after70["added"]-after70["removed"] == after70["active"]
                # The original audit observed +6,814 leaked GPU geometries.
                # Even with new births, retained GPU allocations must stay bounded.
                assert after70["gpuGeometries"] <= before70["gpuGeometries"]+1000, (
                    before70["gpuGeometries"],after70["gpuGeometries"])
                actual_hour=page.evaluate("window.HomesteadApp.snapshot().clock.hours")
                assert actual_hour==starting_hour+70*24, (
                    "70 day button presses should advance 1680 hours",
                    starting_hour, actual_hour)
                assert not errors,errors
            page.close()
        browser.close()
    print("PASS: unified 3D site runs, both layouts step 25 model hours, no page exceptions")
finally:
    server.shutdown()
