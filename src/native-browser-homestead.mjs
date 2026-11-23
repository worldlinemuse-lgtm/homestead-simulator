import {createOriginalNativeWorld,createOriginalCoupledHour,createOriginalNativeController} from "./native-coupled-runtime.mjs";
import {mountNativeWorldConsole} from "./native-world-console.mjs";
import {createNativeSceneBridge} from "./native-scene-bridge.mjs";

/**
 * Original-engine browser bootstrap. One authoritative controller serves both
 * the existing 3D editor and the Utilities panel. The caller must supply real
 * original engine instances; no approximate fallback is constructed.
 *
 * Scene equipment mappings are deliberately explicit. A mapping identifies a
 * native engine asset, and applyNativePatch must validate its native fields.
 */
export function mountOriginalNativeHomestead({
  solarSim,waterCore,farmCore,waterWorld,scene,utilitiesRoot,
  clockMinute=0,storedWaterL=0,waterCapacityL=250,
  backgroundLoadW=85,pumpLoadW=120,pumpPressurePsi=50,pumpId,
  assetMappings={},applyNativePatch=null,onSelection=()=>{},onSnapshot=()=>{},
  onError=()=>{}
}) {
  if(!scene || !scene.editor || typeof scene.editor.list!=="function" ||
     typeof scene.editor.selected!=="function")
    throw new TypeError("Existing 3D scene editor required");
  if(!utilitiesRoot || typeof utilitiesRoot.append!=="function")
    throw new TypeError("Utilities root required");
  if(applyNativePatch!==null && typeof applyNativePatch!=="function")
    throw new TypeError("Native equipment patch handler must be callable");
  const initialState=createOriginalNativeWorld({
    solarSim,waterCore,farmCore,waterWorld,clockMinute,storedWaterL,waterCapacityL
  });
  // Scenario load nameplates are explicit assumptions; original Solar owns
  // generation, original Water owns hydraulic pressure and original Farm owns
  // equipment demand. Edits to these settings are transactional world changes.
  for(const [name,value] of [["backgroundLoadW",backgroundLoadW],["pumpLoadW",pumpLoadW],["pumpPressurePsi",pumpPressurePsi]])
    if(!Number.isFinite(value)||value<0)throw new RangeError("Invalid native "+name);
  initialState.operatingSettings={backgroundLoadW,pumpLoadW};
  const pump=initialState.water.parts.find(p=>pumpId?p.id===pumpId:p.type==="pump_sky");
  if(!pump || !pump.params)throw new Error("Original Water pump part unavailable");
  pump.params.psi=pumpPressurePsi;
  const advanceHour=createOriginalCoupledHour({
    solarSim,waterCore,farmCore,
    solarOriginMinute:((initialState.solar.t-clockMinute)%(365*1440)+(365*1440))%(365*1440),
    backgroundLoadW,pumpLoadW,pumpPressurePsi,pumpId
  });
  const controller=createOriginalNativeController({initialState,advanceHour});
  // Bridge callbacks never mutate scientific state. Explicit edits flow back
  // through the same atomic controller used by the Utilities console.
  const bridge=createNativeSceneBridge({
    scene,assetMappings,onSelection,onSnapshot,
    editNativeAsset:applyNativePatch===null?null:(nativeId,patch)=>
      controller.edit(draft=>{
        const result=applyNativePatch(draft,nativeId,patch);
        return result===undefined?draft:result;
      })
  });
  let consoleView;
  try {
    consoleView=mountNativeWorldConsole({
      controller,scene:bridge,root:utilitiesRoot,onError
    });
  } catch(error) {
    bridge.dispose();
    throw error;
  }
  let disposed=false;
  const assertActive=()=>{if(disposed)throw new Error("Native Homestead disposed");};
  return Object.freeze({
    controller,sceneBridge:bridge,
    snapshot:()=>{assertActive();return controller.snapshot();},
    selectSceneAsset:id=>{assertActive();return bridge.select(id);},
    editSelectedSceneAsset:patch=>{assertActive();return bridge.editSelected(patch);},
    advanceToMinute:(minute,options)=>{assertActive();return consoleView.advanceToMinute(minute,options);},
    editAsset:(id,mutator)=>{assertActive();return consoleView.editAsset(id,mutator);},
    dispose(){
      if(disposed)return;
      disposed=true;
      consoleView.dispose();
      bridge.dispose();
    }
  });
}
