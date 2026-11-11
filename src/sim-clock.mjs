/** Separate minute-precision presentation time from authoritative hourly engines.
 * Time-of-day slider is a visual preview; forward stepping crosses real model hours.
 */
export const SPEEDS=Object.freeze([.25,1,5,15,60,120]); // simulated minutes / real second
export function formatHour(hour){
 if(!Number.isFinite(hour)||hour<0||hour>=24)throw new RangeError("Clock hour must be in [0,24)");
 const whole=Math.floor(hour*60+1e-7)%1440;
 return String(Math.floor(whole/60)).padStart(2,"0")+":"+String(whole%60).padStart(2,"0");
}
export class ScenarioTimeline {
 constructor(speed=5){
   this.fractionMinutes=0;this.previewMinuteOfDay=null;this.setSpeed(speed);
 }
 setSpeed(speed){
   if(!SPEEDS.includes(speed))throw new RangeError("Invalid simulated playback speed");
   this.speed=speed;return this.speed;
 }
 preview(minute){
   if(!Number.isSafeInteger(minute)||minute<0||minute>=1440)
     throw new RangeError("Visual preview minute must be 0..1439");
   this.previewMinuteOfDay=minute;
 }
 resume(){this.previewMinuteOfDay=null}
 reset(){this.fractionMinutes=0;this.previewMinuteOfDay=null}
 display(snapshot){
   if(!snapshot?.clock||!Number.isSafeInteger(snapshot.clock.hourOfDay))
     throw new TypeError("Authoritative model clock is unavailable");
   const modelMinute=snapshot.clock.hourOfDay*60;
   const minute=this.previewMinuteOfDay===null?
     modelMinute+this.fractionMinutes:this.previewMinuteOfDay;
   return Object.freeze({
     date:snapshot.clock.date,hour:minute/60,
     hourOfDay:Math.floor(minute/60)%24,minuteOfDay:minute,
     preview:this.previewMinuteOfDay!==null,
     modelHour:snapshot.clock.hourOfDay,
     speed:this.speed
   });
 }
 advance(minutes,onHour){
   if(!Number.isFinite(minutes)||minutes<0||minutes>24*60)
     throw new RangeError("Invalid forward simulated minutes");
   if(typeof onHour!=="function")throw new TypeError("Model hour callback required");
   this.resume(); // Preview never rewinds or silently replaces model history.
   const total=this.fractionMinutes+minutes;
   const hours=Math.floor((total+1e-9)/60);
   // Fail closed: only persist partial-minute progress after every model step succeeds.
   for(let i=0;i<hours;i++)onHour();
   this.fractionMinutes=total-hours*60;
   if(this.fractionMinutes<1e-8)this.fractionMinutes=0;
   return hours;
 }
 advanceRealSeconds(seconds,onHour){
   if(!Number.isFinite(seconds)||seconds<0)throw new RangeError("Invalid wall delta");
   return this.advance(Math.min(seconds,.25)*this.speed,onHour);
 }
}
