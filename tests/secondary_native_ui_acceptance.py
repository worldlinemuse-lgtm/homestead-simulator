import csv
import json
import threading
from pathlib import Path
from http.server import ThreadingHTTPServer
from playwright.sync_api import sync_playwright
from browser_native_original import Handler, ROOT

def main():
    server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-webgl"])
            for name,width,height in [("desktop",1280,800),("mobile",393,851)]:
                page=browser.new_page(viewport={"width":width,"height":height},accept_downloads=True)
                errors=[]
                page.on("pageerror",lambda e:errors.append(str(e)))
                page.goto(f"http://127.0.0.1:{server.server_port}/?native=1",wait_until="load")
                page.wait_for_function("window.HomesteadApp?.nativeReady() === true",timeout=90000)
                state=lambda:page.evaluate("HomesteadApp.nativeWorld()")
                before=state()
                page.locator("#dayBtn").click(timeout=15000)
                after=state()
                assert after["clockMinute"]==before["clockMinute"]+1440
                assert after["farm"]["checkpoint"]["day"]==before["farm"]["checkpoint"]["day"]+1
                batch=page.evaluate("HomesteadApp.nativeLastBatch()")
                rows=batch["ledger"]
                # Toolbar commits individual hours; lastBatch represents the last hour.
                assert len(rows)==60
                assert [r["minute"] for r in rows]==list(range(after["clockMinute"]-60,after["clockMinute"]))
                assert all(r["native"]["solar"]["source"]=="solar-sandbox/source/sim.js" for r in rows)
                page.locator("#utilitiesBtn").click()
                console=page.locator(".nativeWorldConsole")
                assert console.is_visible()
                assert console.locator("dt",has_text="World minute").locator("xpath=following-sibling::dd[1]").inner_text()==str(after["clockMinute"])
                # Utilities commits an atomic day with a complete ledger.
                console.get_by_role("button",name="Advance native world 24 hours",exact=True).click()
                day_state=state()
                assert day_state["clockMinute"]==after["clockMinute"]+1440
                assert day_state["farm"]["checkpoint"]["day"]==after["farm"]["checkpoint"]["day"]+1
                rows=page.evaluate("HomesteadApp.nativeLastBatch().ledger")
                assert len(rows)==1440
                assert [r["minute"] for r in rows]==list(range(after["clockMinute"],day_state["clockMinute"]))
                assert sum(bool(r["native"]["farm"]["advancedDay"]) for r in rows)==1
                after=day_state
                console.get_by_role("button",name="Advance native world 1 hour",exact=True).click()
                next_state=state()
                assert next_state["clockMinute"]==after["clockMinute"]+60
                with page.expect_download() as event:
                    console.get_by_role("button",name="Export last native minute ledger (CSV)").click()
                with open(event.value.path(),newline="") as file:
                    exported=list(csv.DictReader(file))
                assert len(exported)==60
                assert [int(r["minute"]) for r in exported]==list(range(after["clockMinute"],next_state["clockMinute"]))
                for r in exported:
                    assert abs(float(r["deliveredWh"])-sum(float(r[k]) for k in ["baseServedWh","waterServedWh","farmServedWh"]))<1e-6
                assert next_state["storedWaterL"]>0
                console.locator('input[name="waterCapacityL"]').fill("0")
                console.get_by_role("button",name="Apply native equipment settings").click()
                assert state()==next_state,"Rejected tank edit mutated native state"
                assert "rejected" in console.locator("output").first.inner_text().lower()
                dest=ROOT/"tests"/"artifacts"
                dest.mkdir(parents=True,exist_ok=True)
                page.screenshot(path=str(dest/f"secondary-ui-{name}.png"),full_page=True)
                assert not errors,errors
                print(json.dumps({"viewport":name,"dayMinutes":len(rows),"csvMinutes":len(exported),"clock":next_state["clockMinute"],"rollback":True}),flush=True)
                page.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()

if __name__=="__main__":
    main()
