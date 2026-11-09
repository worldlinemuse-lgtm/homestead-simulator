/**
 * Deterministic, model-read-only helpers for the Three.js visual layer.
 *
 * Timing here is real animation seconds, never scenario hours. The coordinator
 * owns every numerical Solar, Water and Farm transaction.
 */
export function frameDeltaSeconds(gapMs,hidden=false){
  if(hidden||!Number.isFinite(gapMs)||gapMs<=0||gapMs>1000)return 0;
  // Accurate elapsed time at 10, 15, 30 and 60 FPS; skip large tab-wake jumps.
  return Math.min(gapMs/1000,.25);
}
export function smoothAlpha(ratePerSecond,dtSeconds){
  if(!Number.isFinite(ratePerSecond)||ratePerSecond<=0||
     !Number.isFinite(dtSeconds)||dtSeconds<=0)return 0;
  // Group-invariant exponential interpolation:
  // a(dt1+dt2)=a(dt1)+(1-a(dt1))*a(dt2).
  return -Math.expm1(-ratePerSecond*dtSeconds);
}
export function gaitPose(playing,awake,youngKit,chicken,phase,index=0){
  const moving=Boolean(playing&&awake&&!youngKit);
  const wave=Math.sin(phase*(chicken?5.5:3.4)+index);
  return {
    moving,
    wave,
    // All rabbits land when paused. No visual motion generates biology.
    heightM:moving?(chicken?Math.abs(wave)*.018:Math.max(0,wave)*.19):0
  };
}

/**
 * Distance-driven chicken stride, adapted from the original Farm Simulator's
 * world/draw.js alternating walking legs and its world/physics.js movement.
 * Purely visual: no simulated force, biological activity or resource demand.
 * Stance spans 62% of each leg's stride; leg 1 is half a cycle behind leg 0.
 * A planted foot is held in world coordinates by the scene until toe-off.
 */
export const CHICKEN_STANCE_FRACTION=.62;
export function chickenFootPhase(distanceM,legIndex,strideLengthM=.26,offsetM=0){
  if(!Number.isFinite(distanceM)||distanceM<0||
     !Number.isFinite(strideLengthM)||strideLengthM<=0||
     !Number.isFinite(offsetM)||offsetM<0)
    throw new RangeError("Chicken visual stride requires nonnegative metres");
  const cycles=(distanceM+offsetM)/strideLengthM+(legIndex===0?0:.5);
  const cycle=Math.floor(cycles);
  const phase=cycles-cycle;
  return {cycle,phase,stance:phase<CHICKEN_STANCE_FRACTION};
}
export function chickenSwingLift(phase,heightM=.06){
  if(!Number.isFinite(phase)||phase<0||phase>1||
     !Number.isFinite(heightM)||heightM<0)
    throw new RangeError("Invalid chicken foot swing");
  if(phase<=CHICKEN_STANCE_FRACTION)return 0;
  const u=(phase-CHICKEN_STANCE_FRACTION)/(1-CHICKEN_STANCE_FRACTION);
  return heightM*Math.sin(Math.PI*u);
}
