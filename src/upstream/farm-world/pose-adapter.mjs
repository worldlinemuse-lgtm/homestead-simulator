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
  const position={
    x:origin.x+agent.x*FEET_TO_METRES,
    y:origin.y+agent.z*FEET_TO_METRES,
    z:origin.z+agent.y*FEET_TO_METRES
  };
  if (!Object.values(position).every(Number.isFinite))
    throw new RangeError("Native Farm pose exceeds finite world coordinates");
  return Object.freeze({
    id:String(agent.id),
    species:agent.ref?.sp ?? null,
    action:agent.act ?? "idle",
    position:Object.freeze(position),
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
 * Read-only footprint of an original Farm component in the Homestead world.
 * Farm components use x/y/w/d in feet; Homestead uses x/z in metres.
 * This function does not edit source collision geometry or fabricate fixtures.
 */
export function nativeFarmComponentFootprint(component, origin) {
  if (!component || !origin) return null;
  if (!["x","y","z"].every(k=>Number.isFinite(origin[k]))) return null;
  if (!["x","y","w","d"].every(k=>Number.isFinite(component[k]))) return null;
  if (component.w<=0 || component.d<=0) return null;
  const x0=origin.x+component.x*FEET_TO_METRES;
  const z0=origin.z+component.y*FEET_TO_METRES;
  const x1=x0+component.w*FEET_TO_METRES;
  const z1=z0+component.d*FEET_TO_METRES;
  if (![x0,x1,z0,z1].every(Number.isFinite) || x1<=x0 || z1<=z0) return null;
  return Object.freeze({id:component.id,type:component.type,x0,x1,z0,z1,unit:"m"});
}
