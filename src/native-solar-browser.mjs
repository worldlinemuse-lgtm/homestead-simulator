/**
 * Load the complete, source-pinned original Solar Sandbox browser app in an
 * isolated same-origin frame. Unlike shadowPv(), this exposes SIM.step() with
 * native weather, MPPT, inverter, battery, BMS and generator state.
 *
 * The frame is intentionally NOT auto-mounted by the production 3D app.
 * It is a development gateway for source-parity and browser verification.
 */
import {createOriginalSolarMinuteStep} from "./native-solar-minute.mjs";
import {createOriginalNativeWorld,createOriginalCoupledHour} from "./native-coupled-runtime.mjs";

export const PINNED_SOLAR_RUNTIME_URL =
  new URL("../vendor/solar-original-runtime.html",import.meta.url).href;

/**
 * @param {object} options
 * @param {Document} [options.documentRoot] same-origin DOM document
 * @returns {Promise<{frame:HTMLIFrameElement,sim:object,originMinute:number,dispose:Function}>}
 */
export function loadOriginalSolarBrowserRuntime({documentRoot=globalThis.document}={}) {
  if (!documentRoot || typeof documentRoot.createElement !== "function" ||
      !documentRoot.body?.appendChild)
    return Promise.reject(new TypeError("Browser document required for original Solar engine"));
  const frame=documentRoot.createElement("iframe");
  frame.title="Original Solar Sandbox native electrical engine";
  frame.setAttribute("aria-hidden","true");
  frame.style.cssText="position:absolute;width:1px;height:1px;left:-10000px;top:0;border:0;opacity:0;pointer-events:none";
  frame.src=PINNED_SOLAR_RUNTIME_URL;
  return new Promise((resolve,reject)=>{
    let settled=false;
    const fail=error=>{
      if(settled)return;
      settled=true;
      frame.remove();
      reject(error);
    };
    frame.addEventListener("error",()=>fail(new Error("Pinned original Solar runtime failed to load")),{once:true});
    frame.addEventListener("load",()=>{
      if(settled)return;
      try{
        const sim=frame.contentWindow?.SIM;
        if (!sim || typeof sim.step!=="function" ||
            typeof sim.grabState!=="function" || typeof sim.putState!=="function" ||
            !sim.S || !Number.isSafeInteger(sim.S.t))
          throw new Error("Original Solar SIM.step runtime unavailable or incomplete");
        sim.setPlaying(false);
        if(sim.S.playing)throw new Error("Original Solar runtime failed to pause");
        const originMinute=sim.S.t;
        // Fail fast at the adapter boundary before exposing a runtime handle.
        createOriginalSolarMinuteStep(sim,{originMinute});
        settled=true;
        resolve({frame,sim,originMinute,dispose:()=>frame.remove()});
      }catch(error){fail(error);}
    },{once:true});
    try{documentRoot.body.appendChild(frame);}catch(error){fail(error);}
  });
}

/**
 * Construct the three-engine coupled world from an already-loaded original
 * Solar frame, unchanged native Water core, and initialized native Farm.
 */
export function connectOriginalBrowserWorld({
  runtime,waterCore,farmCore,waterWorld,
  backgroundLoadW=85,pumpLoadW=120,pumpPressurePsi=50,
  waterCapacityL=250,storedWaterL=0,clockMinute=0,pumpId
}){
  if(!runtime || !runtime.sim || !Number.isSafeInteger(runtime.originMinute))
    throw new TypeError("Loaded, pinned Solar browser runtime required");
  const state=createOriginalNativeWorld({
    solarSim:runtime.sim,waterCore,farmCore,waterWorld,
    clockMinute,waterCapacityL,storedWaterL
  });
  const advanceHour=createOriginalCoupledHour({
    solarSim:runtime.sim,waterCore,farmCore,
    solarOriginMinute:runtime.originMinute,
    backgroundLoadW,pumpLoadW,pumpPressurePsi,pumpId
  });
  return {state,advanceHour};
}
