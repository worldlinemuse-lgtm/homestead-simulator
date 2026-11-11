/** Visual-only equipment mounting dimensions (metres), not construction specs. */
export const SOLAR_RACK=Object.freeze({heightM:2.15,tiltRad:-.34,halfThicknessM:.11,postGapM:.10});
export function solarPostMount(zRelativeM,terrainRelativeM){
 if(!Number.isFinite(zRelativeM)||!Number.isFinite(terrainRelativeM))
   throw new RangeError("Invalid solar support coordinates");
 const undersideM=SOLAR_RACK.heightM+Math.sin(SOLAR_RACK.tiltRad)*zRelativeM-
   SOLAR_RACK.halfThicknessM;
 const postTopM=undersideM-SOLAR_RACK.postGapM;
 const postBottomM=Math.min(-.12,terrainRelativeM-.22);
 if(postTopM<=postBottomM)throw new RangeError("Solar post would be inverted");
 return Object.freeze({undersideM,postTopM,postBottomM,
  lengthM:postTopM-postBottomM,centerM:(postTopM+postBottomM)/2,
  clearanceM:undersideM-postTopM});
}
/** Decorative rabbit-hutch roof overhang on either side of the actual cage. */
export const RABBIT_HUTCH_ROOF=Object.freeze({cageWidthM:7.45,roofWidthM:7.65,
 cageDepthM:3.05,roofDepthM:3.27,heightM:3.43});
