import {loadOriginalSolarBrowserRuntime} from "./native-solar-browser.mjs";
import {mountOriginalNativeHomestead} from "./native-browser-homestead.mjs";
import {projectNativeSceneSnapshot} from "./native-scene-projection.mjs";
import {initializeOriginalSolarForFarm} from "./native-solar-calendar.mjs";

/**
 * Development-branch opt-in: activate the complete original Solar, Water and
 * Farm engines as one authoritative world behind the existing Three.js scene.
 * No second scientific clock runs while this mode is active.
 *
 * This preview deliberately refuses to initialize if any original model is
 * missing. It never substitutes solarEnvelopeW() or other fallback physics.
 */
export async function enableOriginalNative3D({
  coordinator,scene,utilitiesRoot,documentRoot=globalThis.document,
  onView=()=>{},onSelection=()=>{},onError=()=>{}
}){
  if(!coordinator || typeof coordinator.snapshot!=="function" ||
     !scene?.editor || !utilitiesRoot || typeof utilitiesRoot.append!=="function")
    throw new TypeError("Existing 3D coordinator, scene and Utilities host required");
  if([onView,onSelection,onError].some(fn=>typeof fn!=="function"))
    throw new TypeError("Native scene callbacks must be functions");
  const waterCore=globalThis.HomesteadWaterCore;
  const farmCore=globalThis.HomesteadFarmCore;
  if(!waterCore?.cloneWorld || !farmCore?.checkpoint ||
     !farmCore?.restoreCheckpoint || !farmCore?.equipmentSnapshot)
    throw new TypeError("Original Water and Farm source engines must be loaded");
  const legacy=structuredClone(coordinator.snapshot());
  const waterWorld=coordinator.water;
  if(!waterWorld?.parts?.length)
    throw new Error("Original Water world not available from existing scene");
  const pump=waterWorld.parts.find(part=>part.type==="pump_sky");
  if(!pump?.params || pump.id===undefined)
    throw new Error("Original Water pump asset identity unavailable");
  const nativePumpId=String(pump.id);
  const startHour=legacy.clock.startHour;
  if(!Number.isSafeInteger(startHour)||startHour<0||startHour>=24)
    throw new RangeError("Existing 3D scene start time must be an exact hour");

  // All physical edits act on the same controller transaction used by native
  // Utilities and scene-selected equipment. Native Water solver validates the
  // resulting hydraulic world on the next minute advance.
  const applyPumpEdit=(draft,nativeId,patch)=>{
    if(nativeId!==nativePumpId || Object.keys(patch).length!==1 ||
       !(Object.hasOwn(patch,"psi") || Object.hasOwn(patch,"pumpLoadW")))
      throw new RangeError("Native pump edit requires original pump identity and PSI or pumpLoadW");
    const [field,value]=Object.entries(patch)[0];
    if(!Number.isFinite(value)||value<0)
      throw new RangeError("Native pump setting must be finite and nonnegative");
    if(field==="pumpLoadW"){
      draft.operatingSettings={...draft.operatingSettings,pumpLoadW:value};
      return draft;
    }
    const part=draft.water.parts.find(x=>String(x.id)===nativePumpId && x.type==="pump_sky");
    if(!part?.params)throw new Error("Native Water pump identity changed");
    part.params.psi=value;
    return draft;
  };
  // The tank is a site inventory asset rather than a Water hydraulic part.
  // Its native identity is explicit and never aliases the original pump.
  const nativeTankId="native-treated-water-storage";
  const tankSceneAsset=scene.editor.list().find(item=>item.id==="site-water-storage");
  const applySiteEdit=(draft,nativeId,patch)=>{
    if(nativeId===nativeTankId && Object.keys(patch).length===1 &&
       Object.hasOwn(patch,"waterCapacityL")){
      const capacity=patch.waterCapacityL;
      if(!Number.isFinite(capacity)||capacity<draft.storedWaterL)
        throw new RangeError("Tank capacity must be finite and at least stored inventory");
      draft.waterCapacityL=capacity;
      return draft;
    }
    return applyPumpEdit(draft,nativeId,patch);
  };
  const frame=await loadOriginalSolarBrowserRuntime({documentRoot});
  let mounted=null,disposed=false;
  try{
    // Match the actual 3D four-panel installation to the ORIGINAL source
    // catalog and align Solar weather's local hour/date with Farm's civil day.
    initializeOriginalSolarForFarm({sim:frame.sim,
      farmDate:legacy.clock.date,startHour});
    mounted=mountOriginalNativeHomestead({
      solarSim:frame.sim,waterCore,farmCore,waterWorld,scene,utilitiesRoot,
      clockMinute:startHour*60,storedWaterL:legacy.waterStoredL,
      waterCapacityL:legacy.config.waterStorageCapacityL,
      backgroundLoadW:legacy.config.backgroundLoadW,
      pumpLoadW:legacy.config.pumpElectricalW,
      pumpPressurePsi:legacy.config.pumpPressurePsi,
      pumpId:nativePumpId,
      assetMappings:{"site-water-treatment":nativePumpId,
        ...(tankSceneAsset?{"site-water-storage":nativeTankId}:{})},
      applyNativePatch:applySiteEdit,
      onSelection,
      onSnapshot(){
        if(mounted&&!disposed)onView(project());
      },
      onError
    });
    const project=()=>projectNativeSceneSnapshot({
      world:mounted.snapshot(),legacy,farmCore,
      lastBatch:mounted.controller.lastBatch(),startHour
    });
    const api={
      snapshot:()=>{if(disposed)throw Error("Original native 3D mode disposed");return project();},
      stepHour(){
        if(disposed)throw Error("Original native 3D mode disposed");
        const before=mounted.snapshot().clockMinute;
        mounted.advanceToMinute(before+60,{includeLedger:true});
        return project();
      },
      selectSceneAsset(id){
        if(disposed)throw Error("Original native 3D mode disposed");
        return mounted.selectSceneAsset(id);
      },
      // Scene-selected pump edits share the Utilities controller and dispatch settings.
      editSelectedEquipment(patch){
        if(disposed)throw Error("Original native 3D mode disposed");
        return mounted.editSelectedSceneAsset(patch);
      },
      // Both scene selection and global Utilities call this same mapping.
      editPumpPressure(psi){
        if(disposed)throw Error("Original native 3D mode disposed");
        return mounted.controller.edit(draft=>applyPumpEdit(draft,nativePumpId,{psi}));
      },
      editTankCapacity(capacityL){
        if(disposed)throw Error("Original native 3D mode disposed");
        return mounted.controller.edit(draft=>applySiteEdit(draft,nativeTankId,{waterCapacityL:capacityL}));
      },
      configurePower(key,watts){
        if(disposed)throw Error("Original native 3D mode disposed");
        if(!["backgroundLoadW","pumpLoadW"].includes(key) ||
           !Number.isFinite(watts) || watts<0)
          throw new RangeError("Invalid native electrical scenario setting");
        return mounted.controller.edit(draft=>{
          draft.operatingSettings={...draft.operatingSettings,[key]:watts};
          return draft;
        });
      },
      get controller(){return mounted.controller;},
      get solarRuntime(){return frame.sim;},
      dispose(){
        if(disposed)return;
        disposed=true;
        mounted.dispose();
        frame.dispose();
      }
    };
    return Object.freeze(api);
  }catch(error){
    try{mounted?.dispose();}finally{frame.dispose();}
    throw error;
  }
}
