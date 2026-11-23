#!/usr/bin/env python3
"""Actual original Solar SIM.step -> original Water step -> Farm integration in 3D.
No mock Solar engines. Standalone fast native-mode acceptance with screenshot.
"""
import os
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def log_message(self, *args):
        pass

def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    viewport = os.environ.get("HOMESTEAD_BROWSER_VIEWPORT", "desktop")
    if viewport not in ("desktop", "mobile"):
        raise ValueError("HOMESTEAD_BROWSER_VIEWPORT must be desktop/mobile")
    mobile = viewport == "mobile"
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=[
                "--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader",
                "--ignore-gpu-blocklist"
            ])
            page = browser.new_page(viewport={"width": 393 if mobile else 1280,
                                               "height": 851 if mobile else 800})
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto(f"http://127.0.0.1:{server.server_port}/?native=1",
                      wait_until="load", timeout=30000)
            try:
                page.wait_for_function(
                    "window.HomesteadApp?.nativeReady() === true",
                    timeout=90000)
            except Exception as e:
                status = page.locator("#nativeActivationStatus").inner_text() \
                    if page.locator("#nativeActivationStatus").count() else "(missing)"
                raise AssertionError(
                    f"Original Solar/Water/Farm bootstrap failed: status={status!r}; "
                    f"page errors={errors!r}") from e

            assert page.locator("#world").is_visible()
            assert page.locator("#nativeCoupledControls .nativeWorldConsole").count() == 1
            initial = page.evaluate("""() => ({
                native:window.HomesteadApp.nativeWorld(),
                view:window.HomesteadApp.snapshot()
            })""")
            assert initial["view"]["nativeOriginal"] is True
            assert initial["view"]["nativeMeter"] is None
            assert initial["native"]["solar"]["t"] >= 0
            # A single civil date/time and the depicted 4x435W hardware must
            # agree with the SOURCE Solar runtime, not a second PV model.
            import datetime
            date = datetime.date.fromisoformat(initial["view"]["clock"]["date"])
            nonleap_months = [31,28,31,30,31,30,31,31,30,31,30,31]
            source_day = sum(nonleap_months[:date.month-1]) + date.day - 1
            assert initial["native"]["solar"]["t"] == source_day*1440+9*60
            original_pv = page.evaluate("""() => {
                const iframe=document.querySelector('iframe[title="Original Solar Sandbox native electrical engine"]');
                const cfg=iframe?.contentWindow?.SIM?.S?.cfg;
                return cfg ? {panel:cfg.panel,series:cfg.ser,strings:cfg.par,mppt:cfg.mppt} : null;
            }""")
            assert original_pv == {"panel":"lg435","series":2,"strings":2,"mppt":"150/70"}
            assert not page.locator("#errors").is_visible(),                 page.locator("#errors").inner_text()
            assert initial["view"]["clock"]["hourOfDay"] == 9
            assert initial["view"]["farm"]["counts"]["n"] > 0

            # Use the ACTUAL 3D toolbar. Its active clock must dispatch to the
            # same controller and original Solar SIM.step as native Utilities.
            page.evaluate("() => window.HomesteadApp.step()")
            minute = page.evaluate("""() => ({
                native: window.HomesteadApp.nativeWorld(),
                meter:window.HomesteadApp.snapshot().nativeMeter,
                batch:window.HomesteadApp.nativeLastBatch(),
                scene:window.HomesteadApp.world()
            })""")
            assert minute["native"]["clockMinute"] == 600
            assert minute["meter"]["minutes"] == 60
            assert len(minute["batch"]["ledger"]) == 60
            rows = minute["batch"]["ledger"]
            assert [x["minute"] for x in rows] == list(range(540, 600))
            assert all(x["native"]["solar"]["source"] ==
                       "solar-sandbox/source/sim.js" for x in rows)
            assert all(x["native"]["water"]["source"] ==
                       "water-purification-simulator/source/engine.js" for x in rows)
            assert all(x["native"]["farm"]["source"] ==
                       "farm-sim/source/src/" for x in rows)
            for row in rows:
                assert abs(row["deliveredWh"] - (
                    row["baseServedWh"] + row["waterServedWh"] +
                    row["farmServedWh"])) < 1e-6
                assert row["deliveredWh"] <= row["requestedWh"] + 1e-6
            assert minute["meter"]["energyDeliveredWh"] <= \
                minute["meter"]["energyRequestedWh"] + 1e-6
            assert not page.locator("#errors").is_visible(), (
                "3D model reports failure after native step: " +
                page.locator("#errors").inner_text())


            # Change the NATIVE Water pump, through the existing live Utilities
            # input; no independent Water preview or old coordinator edit.
            page.evaluate("""() => {
                const input=document.getElementById("pumpPressure");
                input.value="0";
                input.dispatchEvent(new Event("input",{bubbles:true}));
            }""")
            pressure = page.evaluate("""() => window.HomesteadApp.nativeWorld()
                .water.parts.find(x=>x.type==="pump_sky").params.psi""")
            assert pressure == 0, f"3D/Utilities pump pressure edit did not reach source: {pressure}"
            # An edit must invalidate last committed meter, avoiding stale data.
            assert page.evaluate("() => window.HomesteadApp.nativeLastBatch()") is None

            page.evaluate("() => window.HomesteadApp.step()")
            next_hour = page.evaluate("""() => ({
                native:window.HomesteadApp.nativeWorld(),
                meter:window.HomesteadApp.snapshot().nativeMeter,
                batch:window.HomesteadApp.nativeLastBatch()
            })""")
            assert next_hour["native"]["clockMinute"] == 660
            assert next_hour["meter"]["waterRequestedWh"] == 0
            assert next_hour["meter"]["waterServedWh"] == 0
            assert all(not row["native"]["water"]["pumpEnabled"] for row in
                       next_hour["batch"]["ledger"])
            assert abs(next_hour["meter"]["waterStoredL"] -
                       next_hour["native"]["storedWaterL"]) < 1e-7
            # Existing scene readouts reflect the native model.
            assert "% SoC" in page.locator("#energyValue").inner_text()
            assert not page.locator("#errors").is_visible(), (
                "3D model reports failure after native resource edits: " +
                page.locator("#errors").inner_text())
            assert not errors, f"Browser exception(s): {errors!r}"
            dest = ROOT / "tests" / "artifacts"
            dest.mkdir(parents=True, exist_ok=True)
            png = dest / f"native-original-{viewport}.png"
            page.screenshot(path=str(png), full_page=True)
            print(f"NATIVE_ORIGINAL_3D_OK viewport={viewport} "
                  f"clock={next_hour['native']['clockMinute']} "
                  f"servedWh={next_hour['meter']['energyDeliveredWh']:.3f} "
                  f"waterL={next_hour['meter']['waterStoredL']:.3f} "
                  f"screenshot={png}", flush=True)
            browser.close()
    finally:
        server.shutdown()

if __name__ == "__main__":
    main()
