#!/usr/bin/env python3
"""Independent real-original Solar/Water/Farm browser parity, no synthetic Solar.

Run from repo root: python tests/secondary_original_solar_parity.py
Requires: pip install playwright && python -m playwright install chromium
"""
import json
import os
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

class QuietFiles(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def log_message(self, *_args):
        return

def verify(page, title, js):
    outcome = page.evaluate(js)
    print(json.dumps({"test": title, "result": outcome}, sort_keys=True), flush=True)
    return outcome

def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), QuietFiles)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                headless=True, args=["--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader"]
            )
            page = browser.new_page(viewport={"width": 1280, "height": 800})
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            base = f"http://127.0.0.1:{server.server_port}"
            page.goto(f"{base}/vendor/solar-original-runtime.html", wait_until="load", timeout=60000)
            page.wait_for_function(
                "window.SIM && typeof SIM.step==='function' && typeof SIM.grabState==='function'",
                timeout=60000
            )
            page.evaluate("SIM.setPlaying(false)")
            verify(page, "original Solar adapter parity against direct SIM.step", """async () => {
                const {createOriginalSolarMinuteStep, ORIGINAL_SOLAR_STEP_BLOB} =
                    await import('/src/native-solar-minute.mjs');
                const sim=window.SIM, baseline=structuredClone(sim.grabState());
                const quiet=sim.S.quiet, origin=baseline.t;
                const assert=(v,m)=>{if(!v)throw Error(m);};
                assert(ORIGINAL_SOLAR_STEP_BLOB==='dccf27949460a044661c1b99eca0e19343ef0c47','wrong original Solar blob');
                const adapter=createOriginalSolarMinuteStep(sim,{originMinute:origin});
                const requestedWh=2.4, actual=adapter({minute:0,requestedWh,state:baseline});
                assert(actual.native.source==='solar-sandbox/source/sim.js','native source substitution');
                assert(actual.deliveredWh>=0&&actual.deliveredWh<=requestedWh+1e-7,'Solar overdelivery');
                assert(JSON.stringify(sim.grabState())===JSON.stringify(baseline),'Solar singleton leaked');
                const input=structuredClone(baseline);
                input.loads=[{id:'homestead-demand',name:'Homestead AC demand',
                    short:'Homestead',w:requestedWh*60,qty:1,surge:1,mode:'on',
                    wins:[[0,0]],cyc:null,thermo:null,chg:null,off:0,volt:120,leg:1}];
                let direct;
                try {
                    sim.S.quiet=true;
                    sim.putState(input);
                    sim.step(false);
                    direct=structuredClone(sim.grabState());
                } finally {
                    sim.putState(structuredClone(baseline));
                    sim.S.quiet=quiet;
                }
                const near=(a,b,m)=>assert(Number.isFinite(a)&&Number.isFinite(b)&&
                    Math.abs(a-b)<1e-6*Math.max(1,Math.abs(a),Math.abs(b)),m);
                near(actual.deliveredWh,direct.stats.served-baseline.stats.served,'original delivered Wh mismatch');
                near(actual.state.soc,direct.soc,'battery SoC mismatch');
                near(actual.native.pvControllerWh,direct.live.mOut/60,'MPPT mismatch');
                near(actual.native.generatorAcWh,(direct.live.genAC||0)/60,'generator AC mismatch');
                assert(actual.state.t===direct.t&&direct.t===(origin+1)%(365*1440),'native minute mismatch');
                assert(JSON.stringify(sim.grabState())===JSON.stringify(baseline),'reference step leaked state');
                assert(sim.S.quiet===quiet,'quiet flag leaked');
                return {originalBlob:ORIGINAL_SOLAR_STEP_BLOB,deliveredWh:actual.deliveredWh,
                    pvControllerWh:actual.native.pvControllerWh,batterySoc:actual.state.soc};
            }""")
            verify(page, "60-minute deterministic native Solar replay and fault isolation", """async () => {
                const {createOriginalSolarMinuteStep}=await import('/src/native-solar-minute.mjs');
                const sim=window.SIM,start=structuredClone(sim.grabState()),quiet=sim.S.quiet;
                const step=createOriginalSolarMinuteStep(sim,{originMinute:start.t});
                const assert=(v,m)=>{if(!v)throw Error(m);};
                const run=()=>{
                    let state=structuredClone(start),deliveredWh=0;
                    for(let i=0;i<60;i++){
                        const requestedWh=[0,0.25,1.25,3][i%4];
                        const out=step({minute:i,requestedWh,state});
                        assert(out.deliveredWh<=requestedWh+1e-7,'overdelivery minute '+i);
                        state=out.state;deliveredWh+=out.deliveredWh;
                    }
                    return {state,deliveredWh};
                };
                const a=run(),b=run();
                assert(JSON.stringify(a)===JSON.stringify(b),'native deterministic replay differs');
                assert(a.state.t===(start.t+60)%(365*1440),'native Solar minute drift');
                for(const request of [
                    {minute:0,requestedWh:-1,state:start},
                    {minute:0,requestedWh:NaN,state:start},
                    {minute:7,requestedWh:1,state:start}
                ]) {
                    let rejected=false;
                    try{step(request);}catch(_){rejected=true;}
                    assert(rejected,'invalid request accepted');
                }
                assert(JSON.stringify(sim.grabState())===JSON.stringify(start),'Solar singleton mutated');
                assert(sim.S.quiet===quiet,'quiet mode mutated');
                return {minutes:60,deliveredWh:a.deliveredWh,finalSolarMinute:a.state.t};
            }""")
            page.add_script_tag(url=f"{base}/vendor/water-engine.js")
            page.add_script_tag(url=f"{base}/vendor/farm-core.js")
            verify(page, "real Solar-Water-Farm two-hour conservation and replay", """async () => {
                const {createOriginalNativeWorld,createOriginalCoupledHour,advanceOriginalNativeHours}=
                    await import('/src/native-coupled-runtime.mjs');
                const solar=window.SIM,water=window.HomesteadWaterCore,farm=window.HomesteadFarmCore;
                const assert=(v,m)=>{if(!v)throw Error(m);};
                assert(water?.buildPreset&&water?.cloneWorld&&water?.step,'original Water missing');
                assert(farm?.reset&&farm?.advanceDay&&farm?.snapshot,'original Farm missing');
                solar.setPlaying(false);
                farm.reset(7);farm.advanceDay();
                const solarBefore=JSON.stringify(solar.grabState());
                const farmBefore=JSON.stringify(farm.snapshot());
                const sourceWater=water.buildPreset('E'),waterBefore=JSON.stringify(sourceWater);
                const start=createOriginalNativeWorld({solarSim:solar,waterCore:water,farmCore:farm,
                    waterWorld:sourceWater,clockMinute:0,storedWaterL:2,waterCapacityL:250});
                const advanceHour=createOriginalCoupledHour({solarSim:solar,waterCore:water,farmCore:farm,
                    solarOriginMinute:start.solar.t,backgroundLoadW:60,pumpLoadW:120,pumpPressurePsi:50});
                const run=()=>advanceOriginalNativeHours({advanceHour,state:start,hours:2,includeLedger:true});
                const a=run(),b=run();
                assert(JSON.stringify(a)===JSON.stringify(b),'three-engine deterministic replay differs');
                assert(a.state.clockMinute===120&&a.ledger.length===120,'shared world clock mismatch');
                assert(a.totals.energyDeliveredWh<=a.totals.energyRequestedWh+1e-6,'energy overdelivery');
                const residual=2+a.totals.waterProducedL-a.totals.waterConsumedL-
                    a.totals.waterOverflowL-a.totals.waterStoredL;
                assert(Math.abs(residual)<1e-6,'water conservation mismatch '+residual);
                assert(a.ledger.every((x,i)=>x.minute===i),'minute ledger chronology');
                assert(a.ledger.every(x=>x.native?.solar?.sourceBlob===
                    'dccf27949460a044661c1b99eca0e19343ef0c47'),'synthetic Solar substituted');
                assert(JSON.stringify(solar.grabState())===solarBefore,'Solar singleton changed');
                assert(JSON.stringify(farm.snapshot())===farmBefore,'Farm singleton changed');
                assert(JSON.stringify(sourceWater)===waterBefore,'Water engine world changed');
                assert(start.clockMinute===0&&start.storedWaterL===2,'input world changed');
                return {minutes:120,requestedWh:a.totals.energyRequestedWh,
                    deliveredWh:a.totals.energyDeliveredWh,
                    waterProducedL:a.totals.waterProducedL,
                    waterConsumedL:a.totals.waterConsumedL,
                    storedWaterL:a.totals.waterStoredL,waterResidualL:residual};
            }""")
            if errors:
                raise AssertionError(f"Original Solar browser page errors: {errors}")
            if os.environ.get("WORLDLINE_QA_SCREENSHOT", "1") == "1":
                target=ROOT/"tests"/"artifacts"/"secondary-original-solar-native.png"
                target.parent.mkdir(parents=True,exist_ok=True)
                page.screenshot(path=str(target))
                print(f"Screenshot: {target}",flush=True)
            browser.close()
    finally:
        server.shutdown()
        server.server_close()

if __name__ == "__main__":
    main()
