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
      // The original controller routes through the centre, but its flock
      // spans the shared wall while assembling/roosting. An open-front coop
      // attached directly to the run must not visually cut through those birds.
      const width=upper-lower;
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

/** 
 * Illustrative utility geometry in world metres.
 * The electrical feeder remains OUTSIDE the fenced livestock property.
 * The treated-water supply passes through the SOUTH GATE, buried beneath it.
 * These are visualization paths, not electrically/hydraulically certified designs.
 */
export const FARM_ELECTRICAL_ROUTE=Object.freeze([
  [6,8,.6],[10,2,.24],[14,-6,.24],[21,-11,.24],[28,-9,.55]
].map(p=>Object.freeze(p)));
export const FARM_WATER_SUPPLY_ROUTE=Object.freeze([
  [12,-17,.35],[18,-15,.26],[24,-11,.26],
  [29.7,-6,-.65],[30,-2,-.7],[29.7,1.3,-.65],[29,5,.8]
].map(p=>Object.freeze(p)));
function orient2(a,b,c){
 return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
}
function onSegment2(p,a,b){
 return p[0]>=Math.min(a[0],b[0])-1e-10&&p[0]<=Math.max(a[0],b[0])+1e-10&&
   p[1]>=Math.min(a[1],b[1])-1e-10&&p[1]<=Math.max(a[1],b[1])+1e-10;
}
function segmentsIntersect2(a,b,c,d){
 const o1=orient2(a,b,c),o2=orient2(a,b,d),o3=orient2(c,d,a),o4=orient2(c,d,b),eps=1e-10;
 if(((o1>eps&&o2< -eps)||(o1< -eps&&o2>eps))&&
    ((o3>eps&&o4< -eps)||(o3< -eps&&o4>eps)))return true;
 return (Math.abs(o1)<=eps&&onSegment2(c,a,b))||
    (Math.abs(o2)<=eps&&onSegment2(d,a,b))||
    (Math.abs(o3)<=eps&&onSegment2(a,c,d))||
    (Math.abs(o4)<=eps&&onSegment2(b,c,d));
}
/**
 * Minimum 2D distance from sampled actual 3D spline to rendered fence segments.
 * Returns zero for crossings and overlaps, including paths that cross between
 * sample points. Use many curve samples (>=192) to bound spline approximation.
 * Vertical burial clearance is audited separately against the real terrain mesh.
 */
export function utilityFenceClearance(points,fenceLines=FARM_PERIMETER){
 if(!Array.isArray(points)||points.length<2||!Array.isArray(fenceLines)||!fenceLines.length)
   throw new RangeError("Utility route and fence require segments");
 const finite2=p=>Array.isArray(p)&&p.length>=2&&
   Number.isFinite(p[0])&&Number.isFinite(p[1]);
 if(!points.every(finite2)||!fenceLines.every(([a,b])=>finite2(a)&&finite2(b)))
   throw new RangeError("Non-finite utility or fence coordinates");
 let minimum=Infinity;
 for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i];
   for(const [c,d] of fenceLines){
     if(segmentsIntersect2(a,b,c,d))return 0;
     minimum=Math.min(minimum,pointSegmentDistance(a[0],a[1],c,d),
       pointSegmentDistance(b[0],b[1],c,d),
       pointSegmentDistance(c[0],c[1],a,b),
       pointSegmentDistance(d[0],d[1],a,b));
   }
 }
 return minimum;
}
