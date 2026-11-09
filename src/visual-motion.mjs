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
