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
            page.wait_for_function("window.HomesteadApp && window.HomesteadApp.snapshot().farm.counts.n > 0",timeout=40000)
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
            page.locator("#playBtn").click()
            assert page.evaluate("window.HomesteadApp.world().playing") is True
            page.wait_for_timeout(450)  # sample at least one visible locomotion frame
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
            page.screenshot(path=str(out/("mobile-farm.png" if mobile else "desktop-farm.png")))
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
