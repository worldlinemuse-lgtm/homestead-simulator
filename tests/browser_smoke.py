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
            # UTILITY NAVIGATION REGRESSION: the source-native tools must be
            # discoverable without first traversing the long Details inspector.
            assert page.locator("#utilitiesBtn").is_visible()
            assert page.locator("#utilitiesBtn").get_attribute("aria-expanded")=="false"
            nav_box=page.locator("#utilitiesBtn").bounding_box()
            assert nav_box and nav_box["x"]>=0 and nav_box["x"]+nav_box["width"]<=page.viewport_size["width"]+1
            before_tool_navigation=page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())")
            page.locator("#utilitiesBtn").click()
            assert page.locator("#inspector").is_visible()
            assert page.locator("#utilitiesBtn").get_attribute("aria-expanded")=="true"
            assert page.locator("#inspectBtn").get_attribute("aria-expanded")=="true"
            assert page.evaluate("document.activeElement.id")=="utilityHub"
            available=page.locator("#nativeUtilityList button[data-utility-id]")
            assert available.count()>=3,available.all_text_contents()
            assert page.locator('[data-utility-id="water.preset.source-comparison"]').count()==1
            assert available.first.get_attribute("data-utility-id").startswith("water.preset."), (
                "Water evaluator should be first in native utility directory",mobile)
            assert page.locator('[data-utility-id="water.preset.native-evaluator"]').count()==1
            assert page.locator('[data-utility-id="cross-domain.resource-ledger.csv"]').count()==1
            assert "not available" in page.locator("#utilityHub").inner_text().lower() or (
                "not yet" in page.locator("#utilityHub").inner_text().lower())
            utility_shots=ROOT/"tests"/"artifacts"
            utility_shots.mkdir(parents=True,exist_ok=True)
            page.screenshot(path=str(utility_shots/("mobile-utility-hub.png" if mobile else "desktop-utility-hub.png")))
            # Search works by category/purpose, includes explicit empty state and
            # supports keyboard Enter to directly navigate to the first result.
            page.locator("#nativeUtilitySearch").fill("no such simulator")
            assert available.count()==0
            assert page.locator("#nativeUtilityEmpty").is_visible()
            page.locator("#nativeUtilitySearch").fill("csv")
            assert available.count()==1
            page.locator("#nativeUtilitySearch").press("Enter")
            assert page.evaluate("document.activeElement.id")=="utilityExports"
            assert page.locator("#ledgerCsvBtn").is_visible()
            assert page.locator("#utilitiesBtn").get_attribute("aria-expanded")=="true"
            # The top-level utilities button always returns to the directory,
            # even after a deep link inside the inspector.
            page.locator("#utilitiesBtn").click()
            page.locator("#nativeUtilitySearch").fill("")
            page.locator('[data-utility-id="water.preset.native-evaluator"]').click()
            assert page.evaluate("document.activeElement.id")=="waterPresetUtility"
            assert page.evaluate("""() => {
                const a=document.querySelector("#inspector .inspector-body").getBoundingClientRect();
                const b=document.querySelector("#waterPresetUtility").getBoundingClientRect();
                return b.top>=a.top-5 && b.top<a.bottom-30;
            }"""), "Water utility is not reachable within the inspector viewport"
            assert "independent study" in page.locator("#waterPresetUtility").inner_text().lower()
            page.screenshot(path=str(utility_shots/("mobile-water-utility-guide.png" if mobile else "desktop-water-utility-guide.png")))
            page.locator("#utilitiesBtn").click()
            page.locator("#utilityLiveShortcut").click()
            assert page.evaluate("document.activeElement.id")=="scenarioControls"
            assert "change the connected experimental" in page.locator("#scenarioControls").inner_text().lower()
            page.locator("#utilitiesBtn").click()
            page.locator("#utilityLayoutShortcut").click()
            assert page.evaluate("document.activeElement.id")=="objectEditor"
            assert before_tool_navigation==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())"), (
                "Utility navigation changed numerical scenario state",mobile)
            page.locator("#closeInspector").click()
            assert page.locator("#utilitiesBtn").get_attribute("aria-expanded")=="false"
            if mobile:
                assert page.evaluate("document.getElementById('summary').classList.contains('collapsed')")
                page.locator("#hudToggle").click()
                assert not page.evaluate("document.getElementById('summary').classList.contains('collapsed')")
                page.locator("#hudToggle").click()
                assert page.evaluate("document.getElementById('summary').classList.contains('collapsed')")
            page.locator("#inspectBtn").click()
            assert page.evaluate("getComputedStyle(document.querySelector('#inspector')).display") == "block"
            assert page.locator("#assetReadout").is_visible()
            # Native Water preset evaluator runs real vendored source hydraulics in an
            # isolated world; neither the shared scenario nor its clock may advance.
            prior_source_eval=page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())")
            page.locator("#waterPresetSelect").select_option("E")
            page.locator("#waterPresetScenario").select_option("1")
            page.locator("#waterPresetDuration").select_option("60")
            page.locator("#waterPresetRun").click()
            water_eval=page.evaluate("window.HomesteadApp.waterPreset()")
            assert water_eval is not None and water_eval["preset"]=="E",water_eval
            assert water_eval["schema"]==1 and water_eval["seconds"]==60,water_eval
            assert water_eval["producedL"]>=0 and water_eval["estimatedPartsUSD"]>=0,water_eval
            assert water_eval["source"]["path"]=="source/engine.js",water_eval
            assert "Not a potable-water" in page.locator("#waterPresetReport").inner_text()
            assert page.locator("#waterPresetReport .utilityResultSummary strong").inner_text().endswith(" L"), (
                "Source output summary must show liters",mobile)
            assert page.locator("#waterPresetReport .utilityResultsDetails dt").count()>=9
            assert "not certification" in page.locator("#waterPresetReport").inner_text().lower()
            preview_shots=ROOT/"tests"/"artifacts";preview_shots.mkdir(parents=True,exist_ok=True)
            page.screenshot(path=str(preview_shots/("mobile-water-preset.png" if mobile else "desktop-water-preset.png")))
            assert prior_source_eval==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())"), (
                "Water engineering preview mutated the live model",mobile)
            # Original pump and RO parameters must affect the actual source world.
            pump_field=page.locator('#waterNativeControls [data-native-key="p"][data-native-field="psi"]')
            ro_field=page.locator('#waterNativeControls [data-native-key="r"][data-native-field="drain"]')
            assert pump_field.count()==1 and ro_field.count()==1,(mobile,"Original controls not found")
            pump_field.fill("40")
            ro_field.fill("3")
            assert page.evaluate("window.HomesteadApp.waterPreset()") is None
            page.locator("#waterPresetRun").click()
            edited=page.evaluate("window.HomesteadApp.waterPreset()")
            assert edited and next(c for c in edited["components"] if c["sourceKey"]=="p")["params"]["psi"]==40
            assert next(c for c in edited["components"] if c["sourceKey"]=="r")["params"]["drain"]==3
            assert prior_source_eval==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())"), (
                "Edited native Water controls unexpectedly mutated the live model",mobile)
            page.screenshot(path=str(preview_shots/("mobile-water-native-controls.png" if mobile else "desktop-water-native-controls.png")))
            # Native time-to-volume action must execute in a real browser on both
            # viewports, produce a source-engine result, and never mutate live state.
            before_time=page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())")
            page.locator("#waterTargetLiters").fill("10")
            page.locator("#waterTimeRun").click()
            report=page.locator("#waterTimeReport")
            assert report.get_attribute("data-result-state") in ("flow","no-flow"), (
                "Water target action failed",mobile,report.inner_text())
            assert "No target-volume estimate yet" not in report.inner_text()
            assert "Original" in report.inner_text()
            assert before_time==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())"), (
                "Target-volume calculation mutated live state",mobile)
            page.screenshot(path=str(preview_shots/("mobile-water-time-result.png" if mobile else "desktop-water-time-result.png")))
            # Reject invalid values in the actual UI; do not display stale success.
            page.locator("#waterTargetLiters").fill("-1")
            page.locator("#waterTimeRun").click()
            assert report.get_attribute("data-result-state")=="error",report.inner_text()
            assert "Target volume" in report.inner_text()
            assert before_time==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())")
            # The original timeTo solver uses a 0.01 L absolute completion
            # tolerance. The visible HTML constraint must agree with the
            # adapter: 0.01 L can falsely count as produced with zero outlet.
            assert page.locator("#waterTargetLiters").get_attribute("min")=="0.02"
            page.locator("#waterTargetLiters").fill("0.01")
            page.locator("#waterTimeRun").click()
            assert report.get_attribute("data-result-state")=="error",report.inner_text()
            assert "resolution" in report.inner_text().lower()
            assert before_time==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())")
            page.locator("#waterTargetLiters").fill("10")
            # Tank startup is a source-native storage setting on preset D.
            page.locator("#waterPresetSelect").select_option("D")
            tank=page.locator('#waterNativeControls [data-native-key="b"][data-native-field="init"]')
            assert tank.count()==1
            tank.fill("0")
            page.locator("#waterPresetRun").click()
            dry=page.evaluate("window.HomesteadApp.waterPreset()")
            assert dry and next(c for c in dry["components"] if c["sourceKey"]=="b")["volumeL"]==0
            assert prior_source_eval==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())")
            page.locator("#waterPresetSelect").select_option("E")
            # Editing a source input must invalidate the prior result immediately:
            # stale engineering outputs must never appear to match new settings.
            page.locator("#waterPresetDuration").select_option("300")
            assert page.evaluate("window.HomesteadApp.waterPreset()") is None
            assert page.locator("#waterPresetReport").get_attribute("data-result-state")=="none"
            assert "Inputs changed" in page.locator("#waterPresetReport").inner_text()
            page.locator("#waterPresetRun").click()
            new_eval=page.evaluate("window.HomesteadApp.waterPreset()")
            assert new_eval and new_eval["seconds"]==300
            assert prior_source_eval==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())"), (
                "Recomputed Water study mutated the live Homestead resources",mobile)
            # The directory and the real source comparison must expose the
            # same executable native Water controls on desktop and mobile.
            before_comparison=page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())")
            page.locator("#utilitiesBtn").click()
            comparison_entry=page.locator('[data-utility-id="water.preset.source-comparison"]')
            assert comparison_entry.count()==1, ("Source comparison missing from Utilities",mobile)
            comparison_entry.click()
            assert page.evaluate("document.activeElement.id")=="waterPresetUtility"
            page.locator("#waterPresetDuration").select_option("60")
            page.locator("#waterPresetScenario").select_option("1")
            page.locator("#waterCompareRun").click()
            comparison=page.evaluate("window.HomesteadApp.waterComparison()")
            assert comparison and len(comparison["results"])==8, ("Missing original A-H results",mobile)
            assert [r["preset"] for r in comparison["results"]]==list("ABCDEFGH")
            assert comparison["source"]["path"]=="source/engine.js"
            assert page.locator("#waterComparisonReport").get_attribute("data-result-state")=="comparison"
            assert page.locator("#waterComparisonReport tbody tr").count()==8
            assert "not a yield estimate" in page.locator("#waterComparisonReport").inner_text()
            assert before_comparison==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())"), (
                "Original Water A-H comparison mutated live Homestead state",mobile)
            page.screenshot(path=str(preview_shots/(
                "mobile-water-comparison.png" if mobile else "desktop-water-comparison.png")))
            page.locator("#waterComparisonReport tbody tr").first.locator("button").click()
            selected=page.evaluate("window.HomesteadApp.waterPreset()")
            assert selected and selected["preset"]=="A"
            assert page.evaluate("document.activeElement.id")=="waterPresetReport"
            assert before_comparison==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())")
            page.locator("#waterPresetScenario").select_option("2")
            assert page.evaluate("window.HomesteadApp.waterComparison()") is None
            assert page.locator("#waterComparisonReport").is_hidden()
            assert before_comparison==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())")
            page.locator("#closeInspector").click()
            # Real Three.js raycast acceptance: selecting water hardware from the
            # rendered canvas reaches the exact source-native component input.
            before_3d_selection=page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())")
            page.locator('nav [data-view="water"]').click()
            page.wait_for_function("""() => {
                const c=window.HomesteadApp.world().camera;
                return c.eyeTargetResidualM<0.15 && c.lookTargetResidualM<0.15;
            }""",timeout=30000)
            evidence=page.evaluate("window.HomesteadApp.world()")
            assert evidence["waterPickable"]=={"pump":True,"ro":True,"tank":True},(
                "Main Water equipment missing from Three.js raycast targets",mobile,evidence["waterPickable"])
            for role,label,field in [
                ("pump","Water pressure pump","psi"),
                ("ro","Reverse-osmosis treatment stage","drain")]:
                target=next(t for t in page.evaluate("window.HomesteadApp.world().waterPickTargets")
                            if t["role"]==role)
                assert target["inView"],("Water object not in camera view",mobile,target)
                page.mouse.click(target["x"],target["y"])
                assert page.locator("#inspectTitle").inner_text()==label,(
                    "3D water raycast missed original hardware",mobile,role,target,
                    page.locator("#inspectTitle").inner_text())
                assert page.locator('#waterNativeControls [data-native-field="'+field+'"]').count()==1
                assert page.evaluate("document.activeElement.dataset.nativeField")==field
                assert page.locator("#waterPresetSelect").input_value()=="E"
                assert before_3d_selection==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())"),(
                    "3D equipment selection mutated live simulation",mobile,role)
                page.screenshot(path=str(preview_shots/(
                    ("mobile" if mobile else "desktop")+"-water-3d-"+role+".png")))
                page.locator("#closeInspector").click()
            # The top-level source-native directory resets object-specific
            # filtering while calling the SAME original executable evaluator.
            page.locator("#utilitiesBtn").click()
            page.locator('[data-utility-id="water.preset.native-evaluator"]').click()
            page.locator("#waterPresetRun").click()
            assert "Selected 3D" not in page.locator("#waterPresetReport").inner_text()
            assert page.evaluate("window.HomesteadApp.waterPreset()") is not None
            assert before_3d_selection==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())")
            page.locator("#closeInspector").click()
            # SOURCE-NATIVE SOLAR BATTERY: directory -> configure -> run ->
            # actual source parity -> focus real 3D battery -> click -> return.
            before_solar=page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())")
            page.locator("#utilitiesBtn").click()
            page.locator("#nativeUtilitySearch").fill("Solar battery")
            battery_entry=page.locator('[data-utility-id="solar.battery.source-diagnostics"]')
            assert battery_entry.count()==1,(mobile,"Original Solar study missing from Utilities directory")
            battery_entry.click()
            assert page.evaluate("document.activeElement.id")=="solarBatteryUtility"
            page.locator("#solarBatteryChem").select_option("agm")
            page.locator("#solarBatteryCurrentA").fill("55")
            page.locator("#solarBatteryTempC").fill("20")
            page.locator("#solarBatterySoc").fill("90")
            page.locator("#solarBatteryRun").click()
            solar_study=page.evaluate("window.HomesteadApp.solarBattery()")
            assert solar_study and solar_study["source"]["path"]=="source/battery.js"
            assert solar_study["discharge"]["m"]==page.evaluate("window.BATTMODEL.drainMult('agm',55,20).m")
            assert solar_study["charging"]["mult"]==page.evaluate("window.BATTMODEL.absorption('agm',.9,0,100).mult")
            assert page.locator("#solarBatteryReport").get_attribute("data-result-state")=="complete"
            assert before_solar==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())")
            page.screenshot(path=str(preview_shots/("mobile-solar-battery-result.png" if mobile else "desktop-solar-battery-result.png")))
            page.locator("#solarBatterySweepRun").click()
            agm=page.evaluate("window.HomesteadApp.solarAgmSweep()")
            assert agm and len(agm["points"])==page.evaluate("window.BATTMODEL.AGM_RATE.length")
            assert agm["source"]["path"]=="source/battery.js"
            for point in agm["points"]:
                direct=page.evaluate("(a) => window.BATTMODEL.drainMult('agm',a,20).m",point["currentA"])
                assert point["drainMultiplier"]==direct
            assert page.locator("#solarBatterySweepReport").get_attribute("data-result-state")=="complete"
            assert page.locator("#solarBatterySweepReport svg[role='img']").count()==1
            assert page.locator("#solarBatterySweepReport tbody tr").count()==len(agm["points"])
            assert before_solar==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())")
            page.screenshot(path=str(preview_shots/("mobile-solar-agm-plot.png" if mobile else "desktop-solar-agm-plot.png")))

            page.locator("#solarBatteryCurrentA").fill("-1")
            assert page.evaluate("window.HomesteadApp.solarBattery()") is None
            page.locator("#solarBatteryRun").click()
            assert page.locator("#solarBatteryReport").get_attribute("data-result-state")=="error"
            page.locator("#solarBatteryCurrentA").fill("10")
            page.locator("#solarBatteryChem").select_option("lfp")
            page.locator("#solarBatteryTempC").fill("-10")
            page.locator("#solarBatteryHeatMode").select_option("mid")
            page.locator("#solarBatteryRun").click()
            warm=page.evaluate("window.HomesteadApp.solarBattery()")
            assert warm and warm["heating"]["minutesTo5C"]==page.evaluate(
                "window.BATTMODEL.heatMinutes(window.BATTMODEL.HEAT.mid.rate,-10,5)")
            assert warm["discharge"]["m"]==1
            assert before_solar==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())")
            # Focus the true Three.js battery, not a synthetic picker callback.
            page.locator("#solarBatteryFocus").click()
            page.wait_for_function("""() => {
                const c=window.HomesteadApp.world().camera;
                return c.eyeTargetResidualM<0.15 && c.lookTargetResidualM<0.15;
            }""",timeout=30000)
            assert page.evaluate("window.HomesteadApp.world().solarBatteryPickable")
            target=page.evaluate("window.HomesteadApp.world().solarBatteryPickTarget")
            assert target["inView"],("Selected Solar battery not in 3D camera view",mobile,target)
            page.mouse.click(target["x"],target["y"])
            assert page.locator("#inspectTitle").inner_text()=="Battery storage module",(
                "Rendered battery raycast missed original Solar equipment",mobile,target,
                page.locator("#inspectTitle").inner_text())
            assert page.evaluate("document.activeElement.id")=="solarBatteryCurrentA"
            assert page.locator("#solarBatteryUtility").is_visible()
            assert before_solar==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())")
            page.screenshot(path=str(preview_shots/("mobile-solar-battery-object.png" if mobile else "desktop-solar-battery-object.png")))
            page.locator("#solarBatteryReturn").click()
            assert page.evaluate("document.activeElement.id")=="assetReadout"
            page.locator("#closeInspector").click()
            # Native Farm original source -> directory -> configure -> execute ->
            # result/chart -> full CSV -> real 3D asset raycast -> return.
            before_farm=page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())")
            page.locator("#utilitiesBtn").click()
            page.locator("#nativeUtilitySearch").fill("Farm original")
            farm_entry=page.locator('[data-utility-id="farm.native-daily-scenario"]')
            assert farm_entry.count()==1,("Original Farm daily study not discoverable",mobile)
            farm_entry.click()
            assert page.evaluate("document.activeElement.id")=="farmStudyUtility"
            page.locator("#farmStudyDays").select_option("7")
            page.locator("#farmStudySeed").fill("7")
            page.locator("#farmStudyHens").fill("10")
            page.screenshot(path=str(preview_shots/(
                "mobile-farm-native-directory.png" if mobile else "desktop-farm-native-directory.png")))
            page.locator("#farmStudyRun").click()
            page.wait_for_function("""() => {
              const el=document.querySelector('#farmStudyReport');
              return ['complete','error'].includes(el.dataset.resultState);
            }""",timeout=45000)
            status=page.locator("#farmStudyReport").get_attribute("data-result-state")
            assert status=="complete",(mobile,page.locator("#farmStudyReport").inner_text())
            farm_study=page.evaluate("window.HomesteadApp.farmStudy()")
            assert farm_study and farm_study["source"]["revision"]=="d6614d7981535fa2b74be86e0c5356af57b56e3b"
            assert farm_study["days"]==7 and len(farm_study["series"])==7
            assert farm_study["parameters"]["mg_hens"]==10
            assert farm_study["final"]["day"]==farm_study["initial"]["day"]+7
            assert page.locator("#farmStudyReport svg[role='img']").count()==1
            assert page.locator("#farmStudyReport tbody tr").count()==7
            assert before_farm==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())"),(
                "Independent original Farm study mutated coupled Homestead",mobile)
            page.screenshot(path=str(preview_shots/(
                "mobile-farm-native-results.png" if mobile else "desktop-farm-native-results.png")))
            with page.expect_download() as transfer:
                page.locator("#farmStudyCsv").click()
            exported=transfer.value
            assert exported.suggested_filename.startswith("farm-original-native-daily-seed-7")
            csv_text=Path(exported.path()).read_text()
            assert csv_text.startswith("day,date,animals_count,eggs_count,water_US_gal,electricity_kWh")
            assert len(csv_text.strip().splitlines())==8,("Missing native daily CSV rows",mobile)
            page.locator("#farmStudyDoes").fill("-1")
            assert page.evaluate("window.HomesteadApp.farmStudy()") is None
            page.locator("#farmStudyRun").click()
            assert page.locator("#farmStudyReport").get_attribute("data-result-state")=="error"
            assert before_farm==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())")
            page.locator("#farmStudyDoes").fill("6")
            page.locator("#farmStudyFocus").click()
            page.wait_for_function("""() => {
              const c=window.HomesteadApp.world().camera;
              return c.eyeTargetResidualM<0.15 && c.lookTargetResidualM<0.15;
            }""",timeout=30000)
            evidence=page.evaluate("window.HomesteadApp.world()")
            assert evidence["farmStudyPickable"],("Actual Farm equipment missing from picker",mobile)
            target=evidence["farmStudyPickTarget"]
            assert target["inView"],("Farm equipment not in camera view",mobile,target)
            page.mouse.click(target["x"],target["y"])
            assert page.locator("#inspectTitle").inner_text()=="Feed and equipment storage barn",(
                "3D Farm source-study object selection failed",mobile,target,
                page.locator("#inspectTitle").inner_text())
            assert page.evaluate("document.activeElement.id")=="farmStudyHens"
            assert page.locator("#farmStudyReturn").is_visible()
            assert before_farm==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())")
            page.screenshot(path=str(preview_shots/(
                "mobile-farm-native-object.png" if mobile else "desktop-farm-native-object.png")))
            page.locator("#farmStudyReturn").click()
            assert page.evaluate("document.activeElement.id")=="assetReadout"
            page.locator("#closeInspector").click()
            # Returning to whole property must not mutate the model or playback.
            page.locator('nav [data-view="overview"]').click()
            assert before_3d_selection==page.evaluate("JSON.stringify(window.HomesteadApp.snapshot())")
            assert page.evaluate("window.HomesteadApp.world().animals") > 0
            # Native Farm enclosure footprints are mapped from the original
            # model's feet coordinates, not authored freehand in Three.js.
            assert page.evaluate("""() => {
                const s=window.HomesteadApp.snapshot();
                const v=window.HomesteadApp.world();
                const e=v.nativeEnclosureLayout, origin=v.farmWorldOriginM;
                const relevant=s.farm.components.filter(c=>c.type==="run"||c.type==="hutch");
                return origin&&Number.isFinite(origin.x)&&Number.isFinite(origin.z)&&
                  e.count===relevant.length&&e.count>=3&&
                  relevant.every(c=>{
                    const x=e.footprints.find(p=>p.id===c.id);
                    return x&&x.unit==="m"&&x.type===c.type&&
                      Math.abs(x.x0-(origin.x+c.x*0.3048))<1e-8&&
                      Math.abs(x.z0-(origin.z+c.y*0.3048))<1e-8&&
                      Math.abs(x.x1-(origin.x+(c.x+c.w)*0.3048))<1e-8&&
                      Math.abs(x.z1-(origin.z+(c.y+c.d)*0.3048))<1e-8&&
                      Math.abs((x.x1-x.x0)-c.w*0.3048)<1e-8&&
                      Math.abs((x.z1-x.z0)-c.d*0.3048)<1e-8;
                  });
            }""")
            # A scenario reset must preserve the exact authoritative enclosure
            # footprint layout, without accumulating stale Three.js geometry.
            enclosure_baseline=page.evaluate("""() => JSON.stringify(
                window.HomesteadApp.world().nativeEnclosureLayout)""")
            assert enclosure_baseline and enclosure_baseline != "null"
            # Footprint metadata alone cannot detect obsolete rail mesh buildup.
            enclosure_meshes=page.evaluate("""() =>
                window.HomesteadApp.world().nativeEnclosureLayout.renderedMeshes""")
            assert isinstance(enclosure_meshes,int) and enclosure_meshes>0, (
                "Native Farm enclosure meshes missing",mobile,enclosure_meshes)
            # The renderer creates four posts per enclosure and three rails
            # per <=1.1 m perimeter segment. Assert the exact mesh budget
            # against authoritative Farm dimensions, not merely a nonzero count.
            assert page.evaluate("""() => {
                const farm=window.HomesteadApp.snapshot().farm;
                const layout=window.HomesteadApp.world().nativeEnclosureLayout;
                const components=farm.components.filter(c=>c.type==="run"||c.type==="hutch");
                const origin=window.HomesteadApp.world().farmWorldOriginM;
                const portal=window.HomesteadApp.world().nativeCoopLayout.portal;
                const expected=components.reduce((total,c)=>{
                    const x0=origin.x+c.x*.3048,z0=origin.z+c.y*.3048;
                    const x1=x0+c.w*.3048,z1=z0+c.d*.3048;
                    const corners=[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];
                    let segments=0;
                    for(let edge=0;edge<4;edge++){
                      const a=corners[edge],b=corners[(edge+1)%4];
                      const N=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/1.1));
                      const shared=c.type==="run"&&c.id===portal?.runId&&
                        (portal?.axis==="x"?
                          Math.abs(a[0]-portal.plane)<1e-6&&Math.abs(b[0]-portal.plane)<1e-6:
                          Math.abs(a[1]-portal?.plane)<1e-6&&Math.abs(b[1]-portal?.plane)<1e-6);
                      if(!shared){segments+=N;continue;}
                      const v0=portal.axis==="x"?a[1]:a[0],v1=portal.axis==="x"?b[1]:b[0];
                      const lo=Math.min((portal.start-v0)/(v1-v0),(portal.end-v0)/(v1-v0));
                      const hi=Math.max((portal.start-v0)/(v1-v0),(portal.end-v0)/(v1-v0));
                      for(let q=0;q<N;q++){
                        const t0=q/N,t1=(q+1)/N;
                        if(Math.min(t1,lo)-t0>1e-7)segments++;
                        if(t1-Math.max(t0,hi)>1e-7)segments++;
                      }
                    }
                    return total+4+3*segments;
                },0);
                return layout.renderedMeshes===expected &&
                  layout.railCount===expected-4*components.length && expected>0;
            }"""), ("Native enclosure rail mesh budget differs from Farm footprints",mobile)
            # The model-derived coop portal must be physically OPEN; neither
            # opaque coop walls nor the real Three.js run rails may cover it.
            assert page.evaluate("""() => {
                const v=window.HomesteadApp.world(),p=v.nativeCoopLayout.portal;
                if(!p||p.axis!=="x"||p.width<2.4||
                   v.nativeCoopLayout.footprints.length!==1||v.nativeCoopLayout.meshCount<6)return false;
                if(v.nativeCoopLayout.walls.some(w=>w.label.startsWith("east wall")&&
                   w.z1>p.start+.05&&w.z0<p.end-.05))return false;
                return v.nativeEnclosureLayout.meshBounds.every(b=>
                  !(b.min.x<=p.plane+.03 && b.max.x>=p.plane-.03 &&
                    b.min.z<p.end-.08 && b.max.z>p.start+.08 &&
                    b.max.y-b.min.y<.65));
            }"""), ("Native chicken doorway is blocked by a modeled wall or rail",mobile)
            assert page.evaluate("""() => {
                const g=window.HomesteadApp.world().gardenLayout;
                const a=g.bounds,p=g.planBounds,eps=1e-5;
                return g.fenceClearanceM>1&&g.runOverlap===false &&
                  a.x0>=p.x0-eps&&a.x1<=p.x1+eps&&
                  a.z0>=p.z0-eps&&a.z1<=p.z1+eps&&
                  a.x0<a.x1&&a.z0<a.z1;
            }"""), ("Garden intersects livestock or property fence",mobile)
            # All three rendered rails per perimeter segment must meet
            # their terrain-sampled endpoints (not the segment midpoint).
            # railCount counts actual rail MESHES, not edge segments; each
            # enclosure also creates four corner posts.
            rail_result=page.evaluate("""() => {
                const l=window.HomesteadApp.world().nativeEnclosureLayout;
                const expectedRailMeshes=l.renderedMeshes-4*l.count;
                return {pass:Number.isFinite(l.railEndpointResidualM) &&
                    l.railEndpointResidualM<1e-6 &&
                    Number.isInteger(l.railCount) &&
                    l.railCount===expectedRailMeshes &&
                    l.railCount>0 && l.railCount%3===0,
                  measured:l.railCount,expected:expectedRailMeshes,
                  residualM:l.railEndpointResidualM};
            }""")
            assert rail_result["pass"], (
                "Farm rails do not meet terrain-sampled endpoints",mobile,rail_result)
            # Validate the actual Three.js mesh centers against authoritative
            # Farm footprint bounds; mesh-count checks alone miss displaced rails.
            assert page.evaluate("""() => {
                const l=window.HomesteadApp.world().nativeEnclosureLayout;
                const eps=1e-6;
                return l.meshCenters.length===l.renderedMeshes &&
                  l.meshCenters.every(p=>[p.x,p.y,p.z].every(Number.isFinite) &&
                    l.footprints.some(f=>p.x>=f.x0-eps&&p.x<=f.x1+eps&&
                      p.z>=f.z0-eps&&p.z<=f.z1+eps));
            }"""), ("Rendered enclosure mesh center outside Farm footprint",mobile)
            # Verify complete rotated Three.js geometry, not only mesh centers.
            # Posts have a 0.045 m radius and rails have a 0.036 m depth;
            # 0.06 m is a conservative allowance for illustrative thickness.
            assert page.evaluate("""() => {
                const l=window.HomesteadApp.world().nativeEnclosureLayout;
                const allowance=0.06;
                return l.meshBounds.length===l.renderedMeshes &&
                  l.meshBounds.every(b=>
                    [b.min.x,b.min.y,b.min.z,b.max.x,b.max.y,b.max.z]
                      .every(Number.isFinite) &&
                    b.min.x<=b.max.x && b.min.y<=b.max.y && b.min.z<=b.max.z &&
                    l.footprints.some(f=>
                      b.min.x>=f.x0-allowance && b.max.x<=f.x1+allowance &&
                      b.min.z>=f.z0-allowance && b.max.z<=f.z1+allowance));
            }"""), ("Rendered enclosure mesh extends outside Farm footprint",mobile)
            # The native Farm hutch bank floor is 2.05 ft above ground.
            # Unlike the old freestanding decorative hutches, these new
            # rendered wire-floor decks follow the exact Farm footprints.
            assert page.evaluate("""() => {
                const w=window.HomesteadApp.world();
                const l=w.nativeEnclosureLayout;
                const h=w.nativeHutchFloors;
                const hutches=l.footprints.filter(f=>f.type==="hutch");
                const eps=1e-6;
                return h.count===hutches.length && h.count>=2 &&
                  h.surfaces.length===h.count &&
                  Math.abs(h.heightAboveTerrainM-2.05*0.3048)<1e-10 &&
                  h.surfaces.every(s=>{
                    const f=hutches.find(x=>x.id===s.componentId);
                    return f&&s.visualOnly===true &&
                      [s.min.x,s.min.y,s.min.z,s.max.x,s.max.y,s.max.z]
                        .every(Number.isFinite) &&
                      s.min.x>=f.x0-eps&&s.max.x<=f.x1+eps &&
                      s.min.z>=f.z0-eps&&s.max.z<=f.z1+eps &&
                      s.min.y<s.max.y &&
                      s.max.y-s.min.y<1 &&
                      s.min.y>-.5;
                  });
            }"""), ("Raised native hutch floors do not match Farm footprints",mobile)
            # Four terrain-embedded load-bearing supports per authoritative
            # hutch footprint. Prevent a floating-deck visual regression.
            assert page.evaluate("""() => {
                const w=window.HomesteadApp.world();
                const h=w.nativeHutchSupports;
                const hutches=w.nativeEnclosureLayout.footprints.filter(f=>f.type==="hutch");
                const eps=1e-6;
                return h.count===4*hutches.length && h.count>0 &&
                  h.legs.length===h.count &&
                  h.legs.every(leg=>{
                    const f=hutches.find(x=>x.id===leg.componentId);
                    return f && leg.visualOnly===true &&
                      [leg.x,leg.z,leg.baseY,leg.groundY,leg.topY]
                        .every(Number.isFinite) &&
                      leg.x>=f.x0-eps && leg.x<=f.x1+eps &&
                      leg.z>=f.z0-eps && leg.z<=f.z1+eps &&
                      leg.baseY<=leg.groundY &&
                      leg.topY>leg.groundY &&
                      leg.topY-leg.groundY<1.5;
                  });
            }"""), ("Native hutch deck supports float or leave Farm footprints",mobile)
            # Independently raycast the ACTUAL rendered deck from each rendered
            # support top. A metadata-only height assertion misses mesh gaps.
            contact=page.evaluate("""() => {
                const w=window.HomesteadApp.world();
                return { ...w.nativeHutchMeshContact,
                    supports:w.nativeHutchSupports.count };
            }""")
            assert (contact["measured"]==contact["supports"] and
                    contact["supports"]>=8 and contact["missing"]==0 and
                    contact["maxGapM"]<1e-5), (
                "Rendered rabbit hutch support-to-deck contact failure",mobile,contact)
            light_out=ROOT/"tests"/"artifacts";light_out.mkdir(parents=True,exist_ok=True)
            # Visual sun and shadows are driven by coordinator hour, never
            # fed back into the Solar energy ledger. Check actual UI steps.
            initial_sun=page.evaluate("window.HomesteadApp.world().visualSun")
            initial_hour=page.evaluate("window.HomesteadApp.snapshot().clock.hourOfDay")
            assert initial_sun and initial_sun["hour"]==initial_hour, initial_sun
            assert initial_sun["date"]==page.evaluate("window.HomesteadApp.snapshot().clock.date")
            assert initial_sun["latitudeDeg"]==41.6
            assert abs(initial_sun["renderedElevationDeg"]-initial_sun["elevationDeg"])<1e-8, initial_sun
            az_error=(initial_sun["renderedAzimuthDeg"]-initial_sun["azimuthDeg"]+180)%360-180
            assert abs(az_error)<1e-8, initial_sun
            assert all(word in page.locator("#simPhase").inner_text() for word in
                       ("Daylight", "Sunrise", "Sunset")), "Seasonal daylight summary missing"
            if mobile:
                assert page.locator("#simPhase").is_visible(), "Mobile daylight summary must be visible"
                assert page.evaluate("""() => {
                    const r=document.querySelector('#simPhase').getBoundingClientRect();
                    const toolbar=document.querySelector('#toolbar').getBoundingClientRect();
                    return r.height>10&&r.width>100&&r.left>=toolbar.left-2 &&
                      r.right<=toolbar.right+2 && r.top>=toolbar.top &&
                      r.bottom<=toolbar.bottom;
                }"""), ("Mobile sunrise and sunset text clips outside the toolbar",mobile)
            assert 9<initial_sun["dayLengthHours"]<11, initial_sun
            assert page.evaluate("""async () => {
                const {seasonalSun}=await import('./src/seasonal-sun.mjs');
                const summer=seasonalSun('2026-06-21',12);
                const winter=seasonalSun('2026-12-21',12);
                return summer.dayLengthHours>15&&winter.dayLengthHours<9.5&&
                  summer.sunriseHour<6&&summer.sunsetHour>20&&
                  winter.sunriseHour>7&&winter.sunsetHour<17;
            }"""), ("Date-sensitive PA daylength must vary seasonally",mobile)
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
            assert page.evaluate("""() => JSON.stringify(
                window.HomesteadApp.world().nativeEnclosureLayout)""")==enclosure_baseline, (
                "Native Farm enclosure footprints changed across reset",mobile)
            assert page.evaluate("""() =>
                window.HomesteadApp.world().nativeEnclosureLayout.renderedMeshes""")==enclosure_meshes, (
                "Native Farm rail meshes accumulated or disappeared on reset",mobile)
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
                  && ["Home and utility loads","Feed and equipment storage barn","Solar inverter and battery",
                      "Water treatment and storage","Treated-water storage tank"]
                     .every(s=>g.foundationAssets.includes(s));
            }""")
            # Decorative cages were retired: no duplicate rabbit-housing meshes.
            # Native Farm footprints and raised hutch floors are checked above.
            assert page.evaluate("window.HomesteadApp.world().housingScreenCount") == 0
            assert page.evaluate("window.HomesteadApp.world().illustrativeCageDoors") == 0
            # Raycast the segmented facade geometry rather than relying on flags.
            routing=page.evaluate("window.HomesteadApp.world().utilityRouting")
            assert routing["farmElectricalFenceClearanceM"]>.36, routing
            assert routing["waterSupplyFenceClearanceM"]>.36, routing
            assert routing["gateSampleCount"]>=1, routing
            assert 28.35+.36<routing["gateCrossingX"]<31.65-.36, routing
            # Pipe and FLOW sheath/particles are buried below the real terrain
            # mesh through the gate; never leave a trip hazard or fence crossing.
            assert routing["gateBurialM"]>=routing["maxUtilityVisualRadiusM"]+.18, routing
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

            # Continuous time controls are local visual preview, not a model rewind.
            initial_model=page.evaluate("window.HomesteadApp.snapshot().clock.hours")
            page.locator("#timeSlider").fill("1195")
            assert page.locator("#simDate").inner_text().endswith("19:55 · Preview")
            assert page.evaluate("window.HomesteadApp.snapshot().clock.hours")==initial_model
            assert page.evaluate("window.HomesteadApp.time().preview") is True
            page.locator("#timeResume").click()
            assert page.evaluate("window.HomesteadApp.time().preview") is False
            # Editable visual props can be added, moved, swapped and undone.
            page.locator("#inspectBtn").click()
            page.locator("#objectType").select_option("compost")
            page.locator("#objectAdd").click()
            editor=page.evaluate("window.HomesteadApp.world().visualEditor")
            assert editor["props"]==1, editor
            before=page.evaluate("window.HomesteadApp.editList()")
            page.locator("#objectRight").click()
            moved=page.evaluate("window.HomesteadApp.editList()")
            assert moved[-1]["x"]==before[-1]["x"]+1,(before,moved)
            page.locator("#objectType").select_option("barrel")
            page.locator("#objectSwap").click()
            assert page.evaluate("window.HomesteadApp.editList().at(-1).type")=="barrel"
            page.locator("#objectUndo").click()
            assert page.evaluate("window.HomesteadApp.editList().at(-1).type")=="compost"
            assert page.evaluate("window.HomesteadApp.snapshot().clock.hours")==initial_model
            proof=page.evaluate("window.HomesteadApp.world().solarMount")
            assert proof["supportCount"]==16 and .05<=proof["minTopClearanceM"]<.06,proof
            # Read ray intersections against the real tilted Three.js rack meshes.
            # Metadata-only assertions would not catch post/mesh disagreement.
            assert proof["meshSamples"]==16 and proof["missingSamples"]==0,proof
            assert proof["postPenetrations"]==0,proof
            assert .04<=proof["minActualGapM"]<=proof["maxActualGapM"]<.07,proof
            proof=page.evaluate("window.HomesteadApp.world().rabbitHutchRoof")
            assert proof["source"]=="native-farm-components" and proof["decorativeCount"]==0,proof
            # Native utility must produce a genuine browser download in both layouts.
            # CSV numbers must match the current model snapshot without advancing time.
            csv_before=page.evaluate("window.HomesteadApp.snapshot()")
            with page.expect_download() as download_event:
                page.locator("#ledgerCsvBtn").click()
            download=download_event.value
            assert download.suggested_filename.startswith("homestead-resource-ledger-")
            csv_text=download.path().read_text(encoding="utf-8")
            import csv, io
            records=list(csv.reader(io.StringIO(csv_text)))
            assert len(records)==2,records
            fields=dict(zip(records[0],records[1]))
            assert float(fields["pv_generated_Wh"])==csv_before["cumulative"]["pvWh"]
            assert float(fields["water_stored_L"])==csv_before["waterStoredL"]
            assert int(fields["farm_animals"])==csv_before["farm"]["counts"]["n"]
            assert page.evaluate("window.HomesteadApp.snapshot().clock.hours")==csv_before["clock"]["hours"]
            page.locator("#closeInspector").click()
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
            # Software WebGL on shared CI runners can delay frames unpredictably.
            # Wait for a specific number of native FIXED-TIME physics steps and real
            # distance traveled; never infer motion from an arbitrary wall-clock sleep.
            # The same assertions below remain mandatory and the wait is bounded.
            try:
                page.wait_for_function("""limit => {
                    const w=window.HomesteadApp.world();
                    return w.playing === true &&
                      w.nativeFarm.visualSteps >= limit.steps + 12 &&
                      w.animalMotion.chickenTravelM > limit.travelM + .05;
                }""",arg={"steps":beforeNative["visualSteps"],
                            "travelM":beforeMotion["chickenTravelM"]},
                   polling=100,timeout=12000)
            except Exception as exc:
                diag=page.evaluate("""() => ({
                    visibility:document.visibilityState,
                    app:window.HomesteadApp.world(),
                    hours:window.HomesteadApp.snapshot().clock.hours,
                    errorText:document.querySelector('#errors')?.textContent
                })""")
                raise AssertionError(
                    f"Native motion stalled (mobile={mobile}); diagnostics={diag!r}; page errors={errors!r}"
                ) from exc
            afterMotion=page.evaluate("window.HomesteadApp.world().animalMotion")
            afterNative=page.evaluate("window.HomesteadApp.world().nativeFarm")
            # Native fixed-step physics must actually advance. A foraging chicken can
            # legitimately pause at the exact frame sampled; assess cumulative travel,
            # not whether the current animation frame happens to be a walking pose.
            assert afterNative["visualSteps"] >= beforeNative["visualSteps"] + 12, (beforeNative,afterNative)
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
            # Pausing freezes native poses. Chickens remain grounded, while
            # rabbits in raised hutches must retain original Farm floor height;
            # flattening all animals onto the ground was a visual bug.
            assert page.evaluate("""() => {
                const w=window.HomesteadApp.world();
                return Number.isFinite(w.pausedGroundErrorM)
                  && w.pausedGroundErrorM<1e-9;
            }""")
            page.wait_for_timeout(130)
            assert page.evaluate("window.HomesteadApp.world().pausedGroundErrorM") < 1e-9
            assert page.evaluate("""() => {
                const rabbits=window.HomesteadApp.world().rabbitElevation;
                return rabbits.length>0 &&
                  rabbits.some(r=>r.nativeHeightM>.6) &&
                  rabbits.every(r=>Number.isFinite(r.errorM)&&r.errorM<1e-6);
            }"""), ("Paused rabbits lost native raised floor elevation",mobile)
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
            # The previous screenshot set showed only a tiny distant solar array.
            # Record both the user-accessible Solar view and dedicated close angles.
            page.locator("[data-view=energy]").click()
            page.wait_for_timeout(950)
            assert page.evaluate("window.HomesteadApp.world().view")=="energy"
            page.screenshot(path=str(out/("mobile-solar.png" if mobile else "desktop-solar.png")))
            solar_before=page.evaluate("window.HomesteadApp.world().camera.requestedDistanceM")
            rect=page.locator("#world").bounding_box()
            assert rect and rect["width"]>200
            page.mouse.move(rect["x"]+rect["width"]/2,rect["y"]+rect["height"]/2)
            page.mouse.wheel(0,-450)
            page.wait_for_timeout(850)
            solar_after=page.evaluate("window.HomesteadApp.world().camera.requestedDistanceM")
            assert solar_after<solar_before, (solar_before,solar_after)
            page.screenshot(path=str(out/("mobile-solar-close.png" if mobile else "desktop-solar-close.png")))
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
            # Explicitly frame the actual Farm-derived rabbit-hutch bank,
            # rather than accepting chicken-coop images as hutch evidence.
            page.evaluate("window.HomesteadApp.focusHutch()")
            # A view label changes immediately, while the camera eases from its
            # prior zoomed coop position. Capture only after REAL convergence.
            page.wait_for_function("""() => {
                const w=window.HomesteadApp.world(),c=w.camera;
                return w.view==="hutch" && c.eyeTargetResidualM<0.025 &&
                    c.lookTargetResidualM<0.025 && c.hutchDecksInFrustum>0;
            }""", timeout=12000)
            hutch_camera=page.evaluate("window.HomesteadApp.world()")
            assert hutch_camera["view"]=="hutch", hutch_camera["view"]
            assert 3<hutch_camera["camera"]["requestedDistanceM"]<12, hutch_camera["camera"]
            assert hutch_camera["camera"]["hutchDecksInFrustum"]>0, hutch_camera["camera"]
            # Regression: the east-side camera allowed the chicken coop to
            # obscure the hutch despite passing all frustum assertions.
            assert page.evaluate("""() => {
                const w=window.HomesteadApp.world();
                const h=w.nativeEnclosureLayout.footprints.find(f=>f.type==="hutch");
                return !!h && w.camera.eyeX < (h.x0+h.x1)/2-1.5;
            }"""), ("Hutch camera is on chicken-coop side",mobile,
                page.evaluate("""() => {
                    const w=window.HomesteadApp.world();
                    return {camera:w.camera, hutch:w.nativeEnclosureLayout.footprints.find(f=>f.type==="hutch")};
                }"""))
            assert hutch_camera["nativeHutchMeshContact"]["missing"]==0
            page.screenshot(path=str(out/("mobile-hutch-close.png" if mobile else "desktop-hutch-close.png")))
            # Native Farm coop roof side profile: inspect actual pitched meshes,
            # not the decorative barn or a farm view cropped below the eaves.
            page.evaluate("window.HomesteadApp.focusCoopRoof()")
            page.wait_for_function("""() => {
                const w=window.HomesteadApp.world(),c=w.camera;
                return w.view==="coopRoof" && c.eyeTargetResidualM<.025 &&
                    c.lookTargetResidualM<.025 && c.coopRoofPanelsInFrustum===2;
            }""", timeout=12000)
            roof_view=page.evaluate("window.HomesteadApp.world()")
            assert roof_view["nativeCoopLayout"]["footprints"], (
                "Native Farm coop footprint missing",mobile)
            assert roof_view["camera"]["coopRoofPanelsInFrustum"]==2, (
                "Both actual pitched roof panels must be in camera frustum",mobile,roof_view["camera"])
            page.screenshot(path=str(out/("mobile-coop-roof-side.png" if mobile else "desktop-coop-roof-side.png")))
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
            metrics=page.evaluate("""() => {
                const w=window.HomesteadApp.world();
                return {animals:w.animals,qualityFps:w.qualityFps,
                  qualityPixelRatio:w.qualityPixelRatio,qualityTier:w.qualityTier,
                  physicsFrameMs:w.nativeFarm.physicsFrameMs,
                  nativeSteps:w.nativeFarm.visualSteps,
                  enclosureCount:w.nativeEnclosureLayout.count,
                  nativeActions:w.nativeAnimalActions};
            }""")
            assert metrics["animals"]>=0 and metrics["qualityPixelRatio"]>0, metrics
            assert metrics["nativeSteps"]>=0 and metrics["enclosureCount"]>=3
            print(f"3D visual performance mobile={mobile}: {metrics}",flush=True)
            page.close()
        # NARROW UTILITY DISCOVERY REGRESSION: six top-level actions remain
        # independently tappable at a 320 px viewport without clipped text.
        narrow=browser.new_page(viewport={"width":320,"height":720},device_scale_factor=1)
        narrow.goto("http://127.0.0.1:%d/"%server.server_port,wait_until="load")
        narrow.wait_for_function("window.HomesteadApp && window.HomesteadApp.snapshot().farm.counts.n>0",timeout=40000)
        buttons=narrow.locator("header nav button")
        assert buttons.count()==6
        for i in range(buttons.count()):
            rect=buttons.nth(i).bounding_box()
            assert rect and rect["x"]>=-1 and rect["x"]+rect["width"]<=321, (
                "Narrow utility navigation is clipped",i,rect)
            assert rect["height"]>=40,("Narrow navigation tap targets too short",i,rect)
        narrow.locator("#utilitiesBtn").click()
        assert narrow.locator("#inspector").is_visible()
        assert narrow.locator("#nativeUtilityList button").first.get_attribute("data-utility-id").startswith(
            "water.preset.")
        (ROOT/"tests"/"artifacts").mkdir(parents=True,exist_ok=True)
        narrow.screenshot(path=str(ROOT/"tests"/"artifacts"/"narrow-utility-hub.png"))
        narrow.close()
        browser.close()
    print("PASS: unified 3D site runs, both layouts step 25 model hours, no page exceptions")
finally:
    server.shutdown()
