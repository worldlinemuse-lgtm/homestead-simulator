import {bindNativeWorldViews} from "./native-world-view-binding.mjs";

/**
 * Browser-facing native execution console. Receives real original-engine
 * snapshots; does not compute or substitute any simulation results.
 * The scene and Utilities always observe the same controller revision.
 */
export function mountNativeWorldConsole({controller,scene,root,onError=()=>{}}) {
  if (!root || typeof root.append !== "function")
    throw new TypeError("Native Utilities root element required");
  if (!scene || typeof scene.renderNativeWorld !== "function")
    throw new TypeError("Native scene adapter required");
  const doc=root.ownerDocument;
  const container=doc.createElement("section");
  container.className="nativeWorldConsole";
  const heading=doc.createElement("h3");
  heading.textContent="Original Solar → Water → Farm";
  const status=doc.createElement("output");
  status.setAttribute("aria-live","polite");
  const advance=doc.createElement("button");
  advance.type="button";
  advance.textContent="Advance native world 1 hour";
  const day=doc.createElement("button");
  day.type="button";
  day.textContent="Advance native world 24 hours";
  const metering=doc.createElement("output");
  metering.setAttribute("aria-live","polite");
  const table=doc.createElement("dl");
  container.append(heading,status,advance,day,metering,table);
  root.append(container);
  let disposed=false;
  let latestMinute=null;
  const utilities={
    renderNativeWorld(snapshot,revision){
      latestMinute=snapshot.clockMinute;
      const fields=[
        ["Revision",revision],
        ["World minute",snapshot.clockMinute],
        ["Treated water stored (L)",snapshot.storedWaterL],
        ["Treated water capacity (L)",snapshot.waterCapacityL],
        ["Original Solar state",snapshot.solar==null?"Unavailable":"Connected"],
        ["Original Water state",snapshot.water==null?"Unavailable":"Connected"],
        ["Original Farm state",snapshot.farm==null?"Unavailable":"Connected"]
      ];
      table.replaceChildren();
      for(const [name,value] of fields){
        const dt=doc.createElement("dt"),dd=doc.createElement("dd");
        dt.textContent=name;dd.textContent=String(value);
        table.append(dt,dd);
      }
      status.textContent="Native world synchronized";
    }
  };
  let binding;
  try{
    binding=bindNativeWorldViews({controller,scene,utilities,onError});
  }catch(error){container.remove();throw error;}
  const runHours=(hours)=>{
    if(disposed)return;
    try{
      advance.disabled=true;
      // Always use the controller's authoritative clock, not a UI timer.
      binding.advanceToMinute(binding.snapshot().clockMinute+60);
    }catch(error){
      status.textContent="Native advance failed: "+error.message;
      onError(error);
    }finally{advance.disabled=day.disabled=false;}
  };
  const onAdvance=()=>runHours(1);
  const onDay=()=>runHours(24);
  advance.addEventListener("click",onAdvance);
  day.addEventListener("click",onDay);
  return Object.freeze({
    snapshot:()=>binding.snapshot(),
    advanceToMinute:(minute,options)=>binding.advanceToMinute(minute,options),
    editAsset:(id,mutator)=>binding.editAsset(id,mutator),
    get clockMinute(){return latestMinute;},
    dispose(){
      if(disposed)return;
      disposed=true;
      advance.removeEventListener("click",onAdvance);
      day.removeEventListener("click",onDay);
      binding.dispose();
      container.remove();
    }
  });
}
