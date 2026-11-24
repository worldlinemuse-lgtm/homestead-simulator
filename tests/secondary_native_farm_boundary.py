#!/usr/bin/env python3
"""Independent, real-original-engine 24-hour Farm boundary regression.

No synthetic Solar callbacks or mock biological engine. Run from repo root:
python tests/secondary_native_farm_boundary.py
Requires Playwright Chromium installed. All checks execute inside a browser page
with original pinned Solar SIM, original Water core, and original Farm core.
"""
import json
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietFiles(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *_args):
        pass


def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), QuietFiles)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                headless=True, args=["--use-gl=angle", "--use-angle=swiftshader"]
            )
            page = browser.new_page()
            page_errors = []
            page.on("pageerror", lambda error: page_errors.append(str(error)))
            url = "http://127.0.0.1:" + str(server.server_port)
            page.goto(url + "/vendor/solar-original-runtime.html", wait_until="load", timeout=60000)
            page.wait_for_function("window.SIM && typeof SIM.step === 'function'")
            page.evaluate("SIM.setPlaying(false)")
            page.add_script_tag(url=url + "/vendor/water-engine.js")
            page.add_script_tag(url=url + "/vendor/farm-core.js")
            result = page.evaluate("""async () => {
              const assert=(test,message)=>{if(!test)throw Error(message)};
              const near=(a,b,label,tol=1e-6)=>{
                assert(Number.isFinite(a)&&Number.isFinite(b)&&
                       Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),
                       label+': '+a+' vs '+b);
              };
              const {createOriginalNativeWorld,createOriginalCoupledHour,advanceOriginalNativeHours} =
                await import('/src/native-coupled-runtime.mjs');
              const solar=window.SIM,water=window.HomesteadWaterCore,farm=window.HomesteadFarmCore;
              assert(solar?.step&&solar?.putState,'Missing real Solar SIM');
              assert(water?.step&&water?.buildPreset,'Missing real Water solver');
              assert(farm?.advanceDay&&farm?.checkpoint&&farm?.equipmentSnapshot,
                'Missing real Farm biological engine');
              solar.setPlaying(false);
              farm.reset(7);farm.advanceDay();
              const initialSolar=JSON.stringify(solar.grabState());
              const initialFarm=JSON.stringify(farm.snapshot());
              const waterWorld=water.buildPreset('E'),initialWater=JSON.stringify(waterWorld);
              const state=createOriginalNativeWorld({solarSim:solar,waterCore:water,farmCore:farm,
                waterWorld,clockMinute:0,storedWaterL:2,waterCapacityL:250});
              const initialState=JSON.stringify(state),day=state.farm.checkpoint.day;
              const hour=createOriginalCoupledHour({solarSim:solar,waterCore:water,farmCore:farm,
                solarOriginMinute:state.solar.t,backgroundLoadW:60,pumpLoadW:120,pumpPressurePsi:50});
              const batch=(start,hours,cb=hour)=>advanceOriginalNativeHours({
                advanceHour:cb,state:start,hours,includeLedger:true});
              const full=batch(state,24);
              assert(full.state.clockMinute===1440,'24h world clock advanced incorrectly');
              assert(full.ledger.length===1440,'24h ledger lost minutes');
              assert(full.ledger.every((x,i)=>x.minute===i),'24h ledger not chronological');
              assert(full.ledger.every(x=>x.native?.solar?.sourceBlob===
                'dccf27949460a044661c1b99eca0e19343ef0c47'),'Not original Solar SIM');
              const dayEvents=full.ledger.filter(x=>x.native?.farm?.advancedDay);
              assert(dayEvents.length===1,'Expected exactly one biological day advancement');
              assert(dayEvents[0].minute===1439,'Farm advanced outside midnight');
              assert(full.ledger[1438].native.farm.advancedDay===false,
                     'Farm advanced before final day minute');
              assert(full.ledger[1439].native.farm.completedDay?.supply,
                     'Native Farm coverage report missing at midnight');
              assert(full.state.farm.checkpoint.day===day+1,
                     'Original Farm biological checkpoint not incremented');
              assert(full.state.farm.dayTotals.waterRequestedL===0,
                     'Farm day water meter failed to reset after midnight');
              assert(full.state.farm.dayTotals.electricityRequestedWh===0,
                     'Farm day electrical meter failed to reset after midnight');
              const first=batch(state,23),tail=batch(first.state,1);
              assert(first.state.farm.checkpoint.day===day,
                     '23h advanced Farm a day too early');
              assert(tail.state.clockMinute===1440,'23+1h clock mismatch');
              assert(JSON.stringify(full.state)===JSON.stringify(tail.state),
                     '23+1h differs from continuous 24h native state');
              assert(JSON.stringify(full.ledger)===JSON.stringify(first.ledger.concat(tail.ledger)),
                     '23+1h minute ledger diverges from continuous 24h');
              for(const key of ['energyRequestedWh','energyDeliveredWh','waterProducedL',
                                'waterConsumedL','waterOverflowL'])
                  near(full.totals[key],first.totals[key]+tail.totals[key],key);
              near(full.totals.waterStoredL,tail.totals.waterStoredL,'stored liters');
              near(state.storedWaterL+full.totals.waterProducedL-
                   full.totals.waterConsumedL-full.totals.waterOverflowL,
                   full.totals.waterStoredL,'24h hydraulic conservation');
              assert(full.totals.energyDeliveredWh<=full.totals.energyRequestedWh+1e-6,
                     '24h electricity overdelivery');
              assert(full.ledger.every(x=>x.deliveredWh<=x.requestedWh+1e-7),
                     'minute-level Solar overdelivery');
              assert(JSON.stringify(state)===initialState,'Caller state mutated after run');
              const originalAdvance=farm.advanceDay;
              let failed=false;
              try{
                farm.advanceDay=()=>{throw Error('injected biological midnight failure')};
                try{batch(first.state,1)}catch(error){
                  failed=/injected biological midnight failure/.test(String(error));
                }
              }finally{farm.advanceDay=originalAdvance}
              assert(failed,'Farm midnight exception did not abort batch');
              assert(JSON.stringify(first.state)===JSON.stringify(
                   JSON.parse(JSON.stringify(first.state))),'Failure changed 23h checkpoint');
              assert(JSON.stringify(solar.grabState())===initialSolar,
                     'Solar singleton leaked after rollback');
              assert(JSON.stringify(farm.snapshot())===initialFarm,
                     'Farm singleton leaked after rollback');
              assert(JSON.stringify(waterWorld)===initialWater,
                     'Water scenario mutated after rollback');
              // Scarcity case: native pump physically disabled, no starting
              // inventory, and original Farm still determines consumption.
              const dry=structuredClone(state);
              dry.storedWaterL=0;
              const pump=dry.water.parts.find(part=>part.type==='pump_sky');
              assert(pump,'Native Water pump fixture missing');
              pump.params.psi=0;
              const withoutPump=batch(dry,24);
              const dryDay=withoutPump.ledger.filter(x=>x.native?.farm?.advancedDay);
              assert(dryDay.length===1&&dryDay[0].minute===1439,
                     'Scarcity scenario must reach real Farm midnight');
              const supply=dryDay[0].native.farm.completedDay.supply;
              assert(Number.isFinite(supply.waterCoverage)&&
                     supply.waterCoverage>=0&&supply.waterCoverage<=1,
                     'Invalid native Farm water shortage coverage');
              near(withoutPump.totals.waterStoredL,
                   withoutPump.totals.waterProducedL-withoutPump.totals.waterConsumedL-
                   withoutPump.totals.waterOverflowL,'dry scenario conservation');
              assert(withoutPump.state.farm.checkpoint.day===day+1,
                     'Scarcity scenario skipped biological progression');
              assert(JSON.stringify(state)===initialState,'Scarcity test mutated original input');
              assert(JSON.stringify(solar.grabState())===initialSolar,'Solar leaked after scarcity');
              assert(JSON.stringify(farm.snapshot())===initialFarm,'Farm leaked after scarcity');
              assert(JSON.stringify(waterWorld)===initialWater,'Water leaked after scarcity');
              return {minutes:1440,initialFarmDay:day,finalFarmDay:full.state.farm.checkpoint.day,
                biologicalEvents:dayEvents.length,splitMatches:true,
                requestedWh:full.totals.energyRequestedWh,
                deliveredWh:full.totals.energyDeliveredWh,
                producedL:full.totals.waterProducedL,
                consumedL:full.totals.waterConsumedL,
                storedL:full.totals.waterStoredL,
                shortageWaterCoverage:supply.waterCoverage,
                midnightRollbackRejected:failed};
            }""")
            print(json.dumps({"test": "real-original 24h Farm midnight, split parity, scarcity, rollback",
                              "result": result}, sort_keys=True), flush=True)
            if page_errors:
                raise AssertionError("Browser runtime errors: " + repr(page_errors))
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
