/**
 * Synchronize the original Solar Sandbox calendar and the existing Farm civil
 * date BEFORE constructing the one native Homestead world. The source Solar
 * engine is a 365-day typical-year system; never assume its October 30 default
 * represents the Farm calendar. Month/day and local hour share one timebase.
 *
 * Solar source is unchanged. useMyLongi() is the ORIGINAL source engine's own
 * 4x435W panel/2S2P SmartSolar 150/70 configuration, matching the depicted
 * four-module rack; no independently calculated PV outputs are introduced.
 */
const DAYS=[31,28,31,30,31,30,31,31,30,31,30,31];
const YEAR_MINUTES=365*1440;
export function originalSolarMinuteForFarmDate(date,hour){
  if(typeof date!=="string")throw new TypeError("Farm civil date must be ISO YYYY-MM-DD");
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if(!match)throw new RangeError("Original Solar requires a valid Farm civil date");
  const [year,month,day]=match.slice(1).map(Number);
  if(!Number.isSafeInteger(year)||year<1||month<1||month>12||
     day<1||day>DAYS[month-1])
    throw new RangeError("Original Solar typical-year calendar date invalid");
  if(!Number.isSafeInteger(hour)||hour<0||hour>=24)
    throw new RangeError("Original Solar local hour must be 0..23");
  const index=DAYS.slice(0,month-1).reduce((a,b)=>a+b,0)+day-1;
  return index*1440+hour*60;
}
export function initializeOriginalSolarForFarm({
  sim,farmDate,startHour,matchFourPanelRack=true
}){
  if(!sim || typeof sim.grabState!=="function" ||
     typeof sim.putState!=="function" || !sim.S)
    throw new TypeError("Original Solar state API required");
  if(matchFourPanelRack && typeof sim.useMyLongi!=="function")
    throw new TypeError("Original Solar four-panel source configuration required");
  const minute=originalSolarMinuteForFarmDate(farmDate,startHour);
  const before=structuredClone(sim.grabState());
  try{
    // Use the original SOURCE module's real PV module catalog, wiring and MPPT
    // configuration; its equations and source catalogs remain untouched.
    if(matchFourPanelRack)sim.useMyLongi();
    const input=structuredClone(sim.grabState());
    if(input.WXID!=="tmy")
      throw new Error("Original Solar typical-year weather required for native scenario");
    input.t=minute;
    if(!input.stats||!input.day)throw new Error("Original Solar metering state absent");
    // A fresh source model has zero elapsed minutes; retain true measured
    // statistics and move ONLY the source measurement/calendar anchor.
    if(input.stats.mins!==0)
      throw new Error("Cannot reinitialize a previously advanced Solar simulation");
    input.stats.startT=minute;
    input.day.d=Math.floor(minute/1440);
    sim.putState(input);
    const state=sim.grabState();
    if(state.t!==minute || (matchFourPanelRack &&
       (sim.S.cfg.panel!=="lg435"||sim.S.cfg.ser*sim.S.cfg.par!==4)))
      throw new Error("Original Solar calendar or four-panel source configuration failed");
    return {minute,dayOfYear:Math.floor(minute/1440),sourcePanelId:sim.S.cfg.panel,
      panels:sim.S.cfg.ser*sim.S.cfg.par,sourceWeather:"tmy",
      sourceCalendar:"365_day_typical_year"};
  }catch(error){
    try{sim.putState(before);}catch(restoreError){
      throw new Error("Original Solar state restore failed: "+restoreError.message,{cause:error});
    }
    throw error;
  }
}
