import {createOriginalNativeWorld,createOriginalCoupledHour,createOriginalNativeController} from "./native-coupled-runtime.mjs";
import {mountNativeWorldConsole} from "./native-world-console.mjs";

/**
 * Opt-in browser bridge. Uses original runtime objects only; it will never
 * substitute the legacy HomesteadCoordinator or synthetic engine results.
 * One controller is shared between the scene and Utilities.
 */
export function mountOriginalNativeHomestead({
  solarSim,waterCore,farmCore,waterWorld,scene,utilitiesRoot,
  clockMinute=0,storedWaterL=0,waterCapacityL=250,
  backgroundLoadW=85,pumpLoadW=120,pumpPressurePsi=50,pumpId,
  onError=()=>{}
}) {
  if(!scene || typeof scene.renderNativeWorld!=="function")
    throw new TypeError("Scene must implement renderNativeWorld");
  if(!utilitiesRoot || typeof utilitiesRoot.append!=="function")
    throw new TypeError("Utilities root required");
  const initialState=createOriginalNativeWorld({
    solarSim,waterCore,farmCore,waterWorld,clockMinute,storedWaterL,waterCapacityL
  });
  const advanceHour=createOriginalCoupledHour({
    solarSim,waterCore,farmCore,solarOriginMinute:initialState.solar.t-clockMinute,
    backgroundLoadW,pumpLoadW,pumpPressurePsi,pumpId
  });
  const controller=createOriginalNativeController({initialState,advanceHour});
  const consoleView=mountNativeWorldConsole({
    controller,scene,root:utilitiesRoot,onError
  });
  return Object.freeze({
    controller,
    snapshot:()=>controller.snapshot(),
    advanceToMinute:(minute,options)=>consoleView.advanceToMinute(minute,options),
    editAsset:(id,mutator)=>consoleView.editAsset(id,mutator),
    dispose:()=>consoleView.dispose()
  });
}
