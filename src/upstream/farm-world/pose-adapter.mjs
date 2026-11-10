/** Read-only adapter for the ORIGINAL farm-sim WV.agents map.
 * Native world x/y/z are feet; Three.js uses metres, with Y vertical.
 * The adapter does not advance the model, synthesize behavior or mutate agents.
 * The enclosure-to-homestead placement must be supplied explicitly by caller.
 */
export const FEET_TO_METRES = 0.3048;
export function nativeFarmAgentPose(agent, origin={x:0,y:0,z:0}) {
  if (!agent || agent.id == null) throw new TypeError("Native agent id required");
  for (const key of ["x","y","z"]) {
    if (!Number.isFinite(agent[key])) throw new RangeError("Non-finite native "+key);
    if (!Number.isFinite(origin[key])) throw new RangeError("Non-finite origin "+key);
  }
  const path=Array.isArray(agent.path)?agent.path:[];
  const target=path.length?path[0]:null;
  // A queued destination is intent, not proof of locomotion. Native physics
  // velocity is the movement authority; jumping can move without a path.
  const vx=Number.isFinite(agent.vx)?agent.vx:0;
  const vy=Number.isFinite(agent.vy)?agent.vy:0;
  const moving=Math.hypot(vx,vy)>1e-4 || Boolean(agent.jump);
  return Object.freeze({
    id:String(agent.id),
    species:agent.ref?.sp ?? null,
    action:agent.act ?? "idle",
    position:Object.freeze({
      x:origin.x+agent.x*FEET_TO_METRES,
      y:origin.y+agent.z*FEET_TO_METRES,
      z:origin.z+agent.y*FEET_TO_METRES
    }),
    moving,
    heading: Number.isFinite(agent.face)?agent.face:null,
    // Native physics and agent behavior remain the sole position authority.
    provenance:"farm-sim/source/src/world/{agents,physics,sync}.js"
  });
}
export function nativeFarmWorldPoses(world,origin) {
  if (!(world?.agents instanceof Map)) throw new TypeError("Expected original WV.agents Map");
  return [...world.agents.values()].map(a=>nativeFarmAgentPose(a,origin));
}

/**
 * Read-only metre-space footprint from the Farm model's feet-space components.
 * This is shared by the 3D enclosure renderer and the henhouse placement.
 * It never adjusts the Farm model's own collision boxes.
 */
export function nativeFarmComponentFootprint(component,origin) {
  if (!component || !origin ||
      !["x","y","z"].every(k=>Number.isFinite(origin[k])) ||
      !["x","y","w","d"].every(k=>Number.isFinite(component[k])) ||
      component.w<=0 || component.d<=0) return null;
  const x0=origin.x+component.x*FEET_TO_METRES;
  const z0=origin.z+component.y*FEET_TO_METRES;
  const x1=x0+component.w*FEET_TO_METRES;
  const z1=z0+component.d*FEET_TO_METRES;
  return Object.freeze({id:component.id,type:component.type,x0,x1,z0,z1,unit:"m"});
}

/**
 * Place the existing detailed coop artwork over the native Farm coop, with its
 * illustrated front/ramp facing the attached run. The original Farm geometry
 * decides position, bounds and attachment; no visual structure changes physics.
 * Local authored coop width=9.35 m, depth=8.8 m (before scaling).
 */
export function nativeFarmCoopFrame(farm,origin) {
  const coop=farm?.components?.find(c=>c.type==="coop");
  const footprint=nativeFarmComponentFootprint(coop,origin);
  if(!footprint)return null;
  const width=footprint.x1-footprint.x0;
  const depth=footprint.z1-footprint.z0;
  const eps=1e-5;
  const candidates=[];
  for(const run of farm.components.filter(c=>c.type==="run")) {
    const p=nativeFarmComponentFootprint(run,origin);
    if(!p)continue;
    const overZ=Math.max(0,Math.min(footprint.z1,p.z1)-Math.max(footprint.z0,p.z0));
    const overX=Math.max(0,Math.min(footprint.x1,p.x1)-Math.max(footprint.x0,p.x0));
    if(overZ>eps && Math.abs(footprint.x1-p.x0)<eps)
      candidates.push({side:"east",overlap:overZ,doorX:footprint.x1,
        doorZ:(Math.max(footprint.z0,p.z0)+Math.min(footprint.z1,p.z1))/2});
    if(overZ>eps && Math.abs(footprint.x0-p.x1)<eps)
      candidates.push({side:"west",overlap:overZ,doorX:footprint.x0,
        doorZ:(Math.max(footprint.z0,p.z0)+Math.min(footprint.z1,p.z1))/2});
    if(overX>eps && Math.abs(footprint.z1-p.z0)<eps)
      candidates.push({side:"positiveZ",overlap:overX,doorZ:footprint.z1,
        doorX:(Math.max(footprint.x0,p.x0)+Math.min(footprint.x1,p.x1))/2});
    if(overX>eps && Math.abs(footprint.z0-p.z1)<eps)
      candidates.push({side:"negativeZ",overlap:overX,doorZ:footprint.z0,
        doorX:(Math.max(footprint.x0,p.x0)+Math.min(footprint.x1,p.x1))/2});
  }
  candidates.sort((a,b)=>b.overlap-a.overlap);
  const door=candidates[0]||null;
  const side=door?.side||"positiveZ";
  const rotationY={east:Math.PI/2,west:-Math.PI/2,positiveZ:0,negativeZ:Math.PI}[side];
  const lateral=side==="east"||side==="west";
  return Object.freeze({
    footprint,
    x:(footprint.x0+footprint.x1)/2,
    z:(footprint.z0+footprint.z1)/2,
    width,depth,side,rotationY,
    scaleX:(lateral?depth:width)/9.35,
    scaleZ:(lateral?width:depth)/8.8,
    // Off-centre overlaps require a later moveable hatch: reported, not hidden.
    door:door?Object.freeze({x:door.doorX,z:door.doorZ}):null,
    doorCentered:door?Math.hypot(door.doorX-
      (lateral?(side==="east"?footprint.x1:footprint.x0):((footprint.x0+footprint.x1)/2)),
      door.doorZ-(lateral?((footprint.z0+footprint.z1)/2):
        (side==="positiveZ"?footprint.z1:footprint.z0)))<0.05:false
  });
}
