import {nativeFarmComponentFootprint} from "./upstream/farm-world/pose-adapter.mjs";

/** All distances are metres in the shared 3D world, not Farm's source feet. */
export const FARM_PERIMETER=Object.freeze([
  [[19,-2],[28.35,-2]],[[31.65,-2],[44,-2]],
  [[44,-2],[52,28]],[[52,28],[18,28]],[[18,28],[19,-2]]
].map(([a,b])=>Object.freeze([Object.freeze(a),Object.freeze(b)])));
export const GARDEN_PLAN=Object.freeze({
  x:42,z:20,rows:5,rowSpacingM:1.65,bedWidthM:1.4,bedLengthM:9.4,
  plantsPerRow:9,plantSpacingM:1,leafReachM:.30
});
export function gardenBounds(plan=GARDEN_PLAN){
  const halfX=(plan.rows-1)*plan.rowSpacingM/2+
    plan.bedWidthM/2+plan.leafReachM;
  const halfZ=Math.max(plan.bedLengthM/2,
    (plan.plantsPerRow-1)*plan.plantSpacingM/2+plan.leafReachM);
  return Object.freeze({x0:plan.x-halfX,x1:plan.x+halfX,
    z0:plan.z-halfZ,z1:plan.z+halfZ});
}
/** Actual shared wall and centered portal of the original Farm coop and run. */
export function nativeCoopRunPortal(components,origin){
  const coop=components?.find(c=>c.type==="coop");
  const run=components?.find(c=>c.type==="run");
  const a=nativeFarmComponentFootprint(coop,origin);
  const b=nativeFarmComponentFootprint(run,origin);
  if(!a||!b)return null;
  const e=1e-6;
  const overlap=(a0,a1,b0,b1)=>[Math.max(a0,b0),Math.min(a1,b1)];
  for(const [plane,axis,lower,upper] of [
    [a.x1,"x",...overlap(a.z0,a.z1,b.z0,b.z1)],
    [a.x0,"x",...overlap(a.z0,a.z1,b.z0,b.z1)],
    [a.z1,"z",...overlap(a.x0,a.x1,b.x0,b.x1)],
    [a.z0,"z",...overlap(a.x0,a.x1,b.x0,b.x1)]
  ]){
    const matching=axis==="x"
      ?(Math.abs(plane-b.x0)<e||Math.abs(plane-b.x1)<e)
      :(Math.abs(plane-b.z0)<e||Math.abs(plane-b.z1)<e);
    if(matching&&upper-lower>0.75){
      const center=(lower+upper)/2;
      const width=Math.min(1.08,upper-lower-.3);
      return Object.freeze({axis,plane,center,width,
        start:center-width/2,end:center+width/2,
        coopId:coop.id,runId:run.id,coop:a,run:b,unit:"m"});
    }
  }
  return null;
}
export function aabbOverlap(a,b,margin=0){
  return a.x0<b.x1+margin && a.x1>b.x0-margin &&
    a.z0<b.z1+margin && a.z1>b.z0-margin;
}
function segmentIntersectsBox(a,b,r){
  // Liang-Barsky clipping, including a segment running through a rectangle.
  let enter=0,leave=1;
  const dx=b[0]-a[0],dz=b[1]-a[1];
  for(const [p,q] of [
    [-dx,a[0]-r.x0],[dx,r.x1-a[0]],
    [-dz,a[1]-r.z0],[dz,r.z1-a[1]]
  ]){
    if(Math.abs(p)<1e-12){if(q<0)return false;continue;}
    const t=q/p;
    if(p<0)enter=Math.max(enter,t);else leave=Math.min(leave,t);
    if(enter>leave)return false;
  }
  return true;
}
function pointSegmentDistance(x,z,a,b){
  const dx=b[0]-a[0],dz=b[1]-a[1];
  const length2=dx*dx+dz*dz;
  const t=length2?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/length2)):0;
  return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);
}
export function fenceToGardenClearance(lines=FARM_PERIMETER,bounds=gardenBounds()){
  const corners=[[bounds.x0,bounds.z0],[bounds.x0,bounds.z1],
    [bounds.x1,bounds.z0],[bounds.x1,bounds.z1]];
  let minimum=Infinity;
  for(const [a,b] of lines){
    if(segmentIntersectsBox(a,b,bounds))return 0;
    for(const [x,z] of corners)minimum=Math.min(minimum,pointSegmentDistance(x,z,a,b));
    for(const [x,z] of [a,b]){
      const px=Math.max(bounds.x0,Math.min(bounds.x1,x));
      const pz=Math.max(bounds.z0,Math.min(bounds.z1,z));
      minimum=Math.min(minimum,Math.hypot(px-x,pz-z));
    }
  }
  return minimum;
}
