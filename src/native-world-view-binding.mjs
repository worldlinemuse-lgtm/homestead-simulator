/**
 * Shared scene/Utilities binding for the original-engine world controller.
 * One controller instance owns time and resource state; both UI entrypoints
 * receive the same snapshots. This module deliberately does not simulate
 * Solar, Water or Farm or manufacture missing engine inputs.
 */
export function bindNativeWorldViews({controller,scene,utilities,onError=()=>{}}) {
  if (!controller || typeof controller.snapshot!=="function" ||
      typeof controller.subscribe!=="function" ||
      typeof controller.advanceToMinute!=="function" ||
      typeof controller.edit!=="function")
    throw new TypeError("Original native controller required");
  for (const [name,view] of [["scene",scene],["utilities",utilities]]) {
    if (!view || typeof view.renderNativeWorld!=="function")
      throw new TypeError(name+" must implement renderNativeWorld");
  }
  if (typeof onError!=="function") throw new TypeError("onError must be callable");
  let disposed=false;
  const render=(snapshot,revision)=>{
    if(disposed)return;
    for(const view of [scene,utilities]){
      try{view.renderNativeWorld(structuredClone(snapshot),revision);}
      catch(error){onError(error);}
    }
  };
  const unsubscribe=controller.subscribe(render);
  render(controller.snapshot(),controller.revision);
  const api=Object.freeze({
    snapshot:()=>controller.snapshot(),
    advanceToMinute(minute,options){
      if(disposed)throw new Error("Native world binding disposed");
      return controller.advanceToMinute(minute,options);
    },
    editAsset(assetId,mutator){
      if(disposed)throw new Error("Native world binding disposed");
      if(typeof assetId!=="string"||!assetId.trim())
        throw new TypeError("Native asset identity required");
      if(typeof mutator!=="function")throw new TypeError("Native asset mutator required");
      return controller.edit(draft=>mutator(draft,assetId));
    },
    dispose(){if(!disposed){disposed=true;unsubscribe();}}
  });
  return api;
}
