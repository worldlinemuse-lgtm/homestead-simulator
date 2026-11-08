#!/usr/bin/env python3
"""3D WebGL + all-source-coupling browser smoke. Run from repository root."""
import threading
import base64
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
            assert page.evaluate("window.HomesteadApp.world().animals") > 0
            assert page.evaluate("window.HomesteadApp.world().paths") >= 8
            assert page.evaluate("window.HomesteadApp.world().meshes") >= 30
            assert page.evaluate("getComputedStyle(document.querySelector('#inspector')).display") == "none"
            assert page.evaluate("window.HomesteadApp.snapshot().clock.hours")==0
            page.locator("#stepBtn").click()
            assert page.evaluate("window.HomesteadApp.snapshot().clock.hours")==1
            page.locator("[data-view=water]").click()
            page.locator("#dayBtn").click()
            assert page.evaluate("window.HomesteadApp.snapshot().clock.hours")==25
            assert page.locator("#energyValue").inner_text().endswith("kWh")
            assert page.locator("#waterValue").inner_text().endswith("L")
            assert page.evaluate("document.getElementById('errors').style.display")!="block"
            assert not errors,errors
            out=ROOT/"tests"/"artifacts";out.mkdir(exist_ok=True)
            page.screenshot(path=str(out/("mobile.png" if mobile else "desktop.png")))
            if not mobile:
                print("VISUAL_AUDIT_JPEG="+base64.b64encode(page.screenshot(type="jpeg",quality=33)).decode("ascii"),flush=True)
            page.close()
        browser.close()
    print("PASS: unified 3D site runs, both layouts step 25 model hours, no page exceptions")
finally:
    server.shutdown()
