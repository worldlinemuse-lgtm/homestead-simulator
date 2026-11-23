/**
 * Connect the existing 3D scene's selection/editor identity to the same native
 * controller used by Utilities. This adapter is intentionally read-only until
 * an explicit native asset mapping is provided; visual layout coordinates are
 * never mistaken for physical engine configuration.
 */
export function createNativeSceneBridge({scene,onSelection=()=>{},onSnapshot=()=>{},editNativeAsset=null,assetMappings={}}){
  if(!scene || !scene.editor || typeof scene.editor.list!=="function" ||
     typeof scene.editor.selected!=="function")
    throw new TypeError("Existing Homestead scene editor required");
  if(typeof onSelection!=="function"||typeof onSnapshot!=="function")
    throw new TypeError("Native scene callbacks must be functions");
  if(editNativeAsset!==null && typeof editNativeAsset!=="function")
    throw new TypeError("Native asset editor must be callable");
  if(!assetMappings || typeof assetMappings!=="object" || Array.isArray(assetMappings))
    throw new TypeError("Native asset mappings must be an object");
  let current=null,revision=-1,disposed=false;
  const find=(id)=>scene.editor.list().find(item=>item.id===id);
  const api={
    renderNativeWorld(snapshot,nextRevision){
      if(disposed)return;
      if(!snapshot || !Number.isSafeInteger(snapshot.clockMinute) ||
         !Number.isSafeInteger(nextRevision) || nextRevision<revision)
        throw new RangeError("Invalid or out-of-order native scene snapshot");
      current=structuredClone(snapshot);
      revision=nextRevision;
      onSnapshot(structuredClone(current),revision);
    },
    select(id){
      if(disposed)throw new Error("Native scene bridge disposed");
      if(typeof id!=="string" || !find(id))
        throw new RangeError("Unknown existing scene object identity");
      const item=structuredClone(find(id));
      // Keep native selection and the existing scene editor in agreement. The\n      // editor owns visual identity; native selection never invents an object.\n      if(typeof scene.editor.select==="function" && scene.editor.selected()?.id!==id)\n        scene.editor.select(id);\n      onSelection(item,current===null?null:structuredClone(current),revision);
      return item;
    },
    editSelected(patch){
      if(disposed)throw new Error("Native scene bridge disposed");
      if(!editNativeAsset)throw new Error("Native asset editing not connected");
      const selected=scene.editor.selected();
      const nativeId=selected?.id && Object.hasOwn(assetMappings,selected.id)
        ? assetMappings[selected.id] : null;
      if(typeof nativeId!=="string" || !nativeId.trim())
        throw new RangeError("Selected visual object has no verified native equipment mapping");
      if(!patch || typeof patch!=="object" || Array.isArray(patch) ||
         Object.keys(patch).length!==1)
        throw new TypeError("Provide exactly one native equipment property");
      const [key,value]=Object.entries(patch)[0];
      if(!/^[a-zA-Z][a-zA-Z0-9]*$/.test(key) ||
         (typeof value!=="boolean" && !(typeof value==="number" && Number.isFinite(value))))
        throw new TypeError("Invalid native equipment property or value");
      // The authoritative controller validates actual engine constraints.
      return editNativeAsset(nativeId,Object.freeze({[key]:value}));
    },
    selected(){
      if(disposed)throw new Error("Native scene bridge disposed");
      const item=scene.editor.selected();
      return item?.id?this.select(item.id):null;
    },
    get revision(){return revision;},
    snapshot(){return current===null?null:structuredClone(current);},
    dispose(){disposed=true;current=null;}
  };
  return Object.freeze(api);
}
