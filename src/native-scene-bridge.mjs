/**
 * Connect the existing 3D scene's selection/editor identity to the same native
 * controller used by Utilities. This adapter is intentionally read-only until
 * an explicit native asset mapping is provided; visual layout coordinates are
 * never mistaken for physical engine configuration.
 */
export function createNativeSceneBridge({scene,onSelection=()=>{},onSnapshot=()=>{}}){
  if(!scene || !scene.editor || typeof scene.editor.list!=="function" ||
     typeof scene.editor.selected!=="function")
    throw new TypeError("Existing Homestead scene editor required");
  if(typeof onSelection!=="function"||typeof onSnapshot!=="function")
    throw new TypeError("Native scene callbacks must be functions");
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
      onSelection(item,current===null?null:structuredClone(current),revision);
      return item;
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
