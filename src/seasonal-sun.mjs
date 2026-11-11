/**
 * Deterministic visual-only solar geometry, using NOAA's fractional-year
 * declination/equation-of-time approximation and standard -0.833° sunrise.
 * NOT measured irradiance, a weather forecast, or Solar Sandbox dispatch.
 * Coordinates intentionally fixed to the homestead scenario near Honesdale PA.
 */
export const SITE=Object.freeze({latitudeDeg:41.6,longitudeDeg:-75.25,timeZone:"America/New_York"});
const RAD=Math.PI/180,DEG=180/Math.PI;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function nthSunday(year,month,firstSundayWeek){
  const first=new Date(Date.UTC(year,month-1,1)).getUTCDay();
  return 1+(7-first)%7+7*(firstSundayWeek-1);
}
export function localUtcOffsetHours(dateISO,hour){
  const date=new Date(dateISO+"T00:00:00Z");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)||!Number.isFinite(date.getTime())||
    date.toISOString().slice(0,10)!==dateISO)throw new RangeError("Invalid scenario date");
  if(!Number.isFinite(hour)||hour<0||hour>=24)throw new RangeError("Invalid local hour");
  const y=date.getUTCFullYear(),m=date.getUTCMonth()+1,d=date.getUTCDate();
  // U.S. daylight-saving rules effective 2007 onwards. This scene models 2026+.
  if(y<2007)throw new RangeError("Local offset unsupported before 2007");
  const start=nthSunday(y,3,2),end=nthSunday(y,11,1);
  const daylight=m>3&&m<11||(m===3&&(d>start||(d===start&&hour>=2)))||
    (m===11&&(d<end||(d===end&&hour<2)));
  return daylight?-4:-5;
}
export function seasonalSun(dateISO,hour,site=SITE){
  const offset=localUtcOffsetHours(dateISO,hour);
  const day=new Date(dateISO+"T00:00:00Z");
  const year=day.getUTCFullYear();
  const doy=Math.round((day-new Date(Date.UTC(year,0,1)))/86400000)+1;
  const yearLength=Date.UTC(year+1,0,1)-Date.UTC(year,0,1)>365*86400000?366:365;
  const gamma=2*Math.PI/yearLength*(doy-1+(hour-12)/24);
  const eqMin=229.18*(.000075+.001868*Math.cos(gamma)-.032077*Math.sin(gamma)-
    .014615*Math.cos(2*gamma)-.040849*Math.sin(2*gamma));
  const dec=.006918-.399912*Math.cos(gamma)+.070257*Math.sin(gamma)-
    .006758*Math.cos(2*gamma)+.000907*Math.sin(2*gamma)-
    .002697*Math.cos(3*gamma)+.00148*Math.sin(3*gamma);
  const lat=site.latitudeDeg*RAD,lon=site.longitudeDeg;
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>=Math.PI/2||Math.abs(lon)>180)
    throw new RangeError("Invalid visual site coordinates");
  const cosRise=(Math.cos(90.833*RAD)/(Math.cos(lat)*Math.cos(dec))-
    Math.tan(lat)*Math.tan(dec));
  const halfDay=Math.acos(clamp(cosRise,-1,1))*DEG*4/60;
  const noon=(720-4*lon-eqMin+offset*60)/60;
  const sunriseHour=clamp(noon-halfDay,0,24);
  const sunsetHour=clamp(noon+halfDay,0,24);
  const hourAngle=(hour-noon)*15*RAD;
  const sinElevation=clamp(Math.sin(lat)*Math.sin(dec)+
    Math.cos(lat)*Math.cos(dec)*Math.cos(hourAngle),-1,1);
  const elevationDeg=Math.asin(sinElevation)*DEG;
  const azimuthDeg=(Math.atan2(Math.sin(hourAngle),
    Math.cos(hourAngle)*Math.sin(lat)-Math.tan(dec)*Math.cos(lat))*DEG+180+360)%360;
  const daylight=hour>=sunriseHour&&hour<sunsetHour;
  return Object.freeze({date:dateISO,hour,latitudeDeg:site.latitudeDeg,
    longitudeDeg:lon,timeZone:site.timeZone,utcOffsetHours:offset,
    sunriseHour,sunsetHour,dayLengthHours:sunsetHour-sunriseHour,
    solarNoonHour:noon,azimuthDeg,elevationDeg,daylight,
    sunLevel:Math.max(0,sinElevation),
    twilightLevel:clamp((elevationDeg+8)/12,0,1),
    source:"NOAA approximate visual ephemeris; NOT model irradiance"});
}
