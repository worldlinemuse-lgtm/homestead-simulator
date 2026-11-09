// world/weather.js
// Weather picture (VISUAL ONLY): rain, snow, snow on the ground, frost, overcast light, wet ground and
// grass colour. The model's weather is the daily high and low (core/environment.js); no formula reads
// anything in this file, and nothing here writes to S or P.
// How often it is wet, how much falls, whether it falls as snow and how long snow lies are worked out
// from the NOAA GHCN-Daily record for Hawley 1 E (USC00363758), 1991 to mid-2017
// (raw/noaa/ghcnd_USC00363758.csv; scripts tools/weather_fit_precip_fit.py and pack_fit.py). Snow or rain and
// the snow depth use the model's own daily high and low, so a cold spell in the model is a snowy spell
// on the screen. The dice are a hash of the weather seed and the day, never the model's random stream.
// ---- Contents (top-level functions, in file order; kept by tools/code_contents.py) ----
//   wxHash - A fixed random number 0 to 1 for a day and a salt, from the weather seed.
//   wxQ - Rain amount for a random number u, from the fitted amount table WX.q (straight lines between
//         points).
//   wxTemps - the day's high and low: today from the model, past days from the model's daily log, days before
//         the run started from the NOAA normals
//   wxSync - Brings the weather picture up to the model day: starts over on a new farm, seed or time jump,
//         then steps the wet/dry chain one day at a time.
//   wxDay - one day of the weather picture.
//   wxStep - Moves the weather picture on one day d: wet or dry from the NOAA wet-after-wet and wet-after-dry
//         chances, the amount, rain or snow from the day's temperatures, and snow cover melting.
//   wxNow - the picture at the hour shown
//   wxFallNow - Is rain or snow falling at the hour shown (phase 25)?
//   wxWords - A few words for the weather shown, like "Light snow" or "Wet ground".
//   wxNoise - patchy snow mask for shallow snow: smooth value noise, thresholded at the cover level
//   snowMask - A cached speckled snow-cover picture for cover share 0 to 1 (in 12 steps).
//   wxGround - on the ground plane (planeT(0) set by drawGround): wet ground and puddles, frost, snow cover,
//         cloud shadows
//   snowCap - a white cap on a roof, drawn over the roof polygon (pts in plot feet); heated roofs are not
//         melted
//   wxSky - falling rain and snow in screen space, after the night shade so it shows at night too
// ---- end of contents ----
const WX = {
  // chance a day is wet (0.01 in or more) after a wet day and after a dry day, January to December
  pww: [0.432, 0.417, 0.445, 0.49, 0.54, 0.495, 0.409, 0.45, 0.49, 0.482, 0.448, 0.437],
  pdw: [0.311, 0.291, 0.284, 0.314, 0.314, 0.332, 0.326, 0.276, 0.248, 0.269, 0.249, 0.337],
  // mean water on a wet day by month (in), and the wet-day amounts at every 5th percentile (all months)
  mean: [0.3, 0.3, 0.34, 0.33, 0.28, 0.41, 0.36, 0.38, 0.44, 0.4, 0.33, 0.32],
  allMean: 0.347,
  q: [0.01, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1, 0.13, 0.16, 0.2, 0.25, 0.3, 0.38, 0.46, 0.57, 0.7, 0.88, 1.26, 2.5],
  // share of wet days that bring snow: logistic in the day's high, 50% at 35.75°F, scale 5°F (fitted, 1,577 wet days)
  t50: 35.75,
  ts: 5.0,
  // inches of snow per inch of water, lower on milder days: 8.5 + 0.4 x (30 - high °F), kept between 2 and 16.
  // Fitted so the snow share above, fed the station's own highs and rain gauge, gives its monthly snowfall
  // (tools/weather_fit_ratio_fit.py: 13.5/12.9/8.0 in for Jan/Feb/Mar against 12.2/14.4/9.4 measured)
  rA: 8.5,
  rB: 0.4,
  // snow depth: loses 0.3 in per °F-day of daily mean above 32°F and settles 6% a day. Tuned on the
  // model's own weather (6 seeds x 6 years, tools/weather_fit_depth_tune.py) against the station's Jan-Feb snow
  // depth: median, 75th, 90th and 99th percentiles 2.0, 6.1, 10.4 and 21.3 in, against 2.0, 7.0, 11.0
  // and 21.0 measured
  melt: 0.3,
  settle: 0.06,
  memo: new Map(), // weather-picture state by model day (wxDay)
  hist: new Map(), // the model's S.hist rows by day, for each day's high and low
  lastDay: -1e9, // newest day copied into hist
  key: '', // weather seed | farm start; a change starts the picture over
  top: -1e9, // latest past day worked out; going back before it starts over
  mask: null, // cached snow-cover picture (snowMask)
  maskKey: '' // cover share (in twelfths) the mask was drawn for
};
// A fixed random number 0 to 1 for a day and a salt, from the weather seed. The same day always gives the same
// weather picture.
function wxHash(day, salt) {
  let h = ((+P.env_seed >>> 0 || 7) ^ Math.imul(day + 100003, 0x9e3779b1) ^ Math.imul(salt + 1, 0x85ebca77)) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
// Rain amount for a random number u, from the fitted amount table WX.q (straight lines between points).
function wxQ(u) {
  const f = clamp(u, 0, 0.9999) * (WX.q.length - 1),
    i = Math.floor(f);
  return WX.q[i] + (WX.q[i + 1] - WX.q[i]) * (f - i);
}
// the day's high and low: today from the model, past days from the model's daily log, days before the
// run started from the NOAA normals
function wxTemps(d) {
  if (d === S.day) {
    // rounded to 0.1°F as the model's daily log stores them, so today's picture and the same day
    // re-made later from the log come out identical
    const e = envNow();
    return [Math.round(e.tmax * 10) / 10, Math.round(e.tmin * 10) / 10];
  }
  const r = WX.hist.get(d);
  if (r) return [r.tmax, r.tmin];
  const n = normAt(d);
  return [n.tx, n.tn];
}
// Brings the weather picture up to the model day: starts over on a new farm, seed or time jump, then steps the
// wet/dry chain one day at a time.
function wxSync() {
  // a new farm, a load, a new weather seed or going back in time starts the picture over. The model's
  // log keeps the last 3,650 days, so new rows are found by day, not by count
  const key = (+P.env_seed >>> 0) + '|' + S.start;
  if (key !== WX.key || WX.histRef !== S.hist || S.day < WX.top || S.day < WX.lastDay) {
    WX.key = key;
    WX.histRef = S.hist;
    WX.memo.clear();
    WX.hist.clear();
    WX.lastDay = -1e9;
    WX.top = -1e9;
  }
  let i = Math.max(0, S.hist.length - 1);
  while (i > 0 && S.hist[i - 1].day > WX.lastDay) i--;
  for (; i < S.hist.length; i++) if (S.hist[i].day > WX.lastDay) WX.hist.set(S.hist[i].day, S.hist[i]);
  if (S.hist.length) WX.lastDay = S.hist[S.hist.length - 1].day;
  // keep the cache small: days more than 30 days back are re-made from the log on demand
  if (WX.memo.size > 4000) for (const d of [...WX.memo.keys()]) if (d < S.day - 30) WX.memo.delete(d);
}
// one day of the weather picture. Days chain from 75 days before day 0, so a day always comes out the same
function wxDay(d) {
  wxSync();
  if (WX.memo.has(d)) return WX.memo.get(d);
  let s = null,
    a = Math.min(d, -75);
  for (let t = d - 1; t >= a; t--)
    if (WX.memo.has(t)) {
      s = WX.memo.get(t);
      a = t + 1;
      break;
    }
  if (!s) s = { wet: false, d1: 0, t14: normAt(a - 1).tx / 2 + normAt(a - 1).tn / 2, wetAvg: 0.35, h0: 0, dur: 0 };
  for (let t = a; t <= d; t++) {
    s = wxStep(s, t);
    if (t <= S.day) WX.memo.set(t, s);
  }
  if (d <= S.day) WX.top = Math.max(WX.top, d);
  return s;
}
// Moves the weather picture on one day d: wet or dry from the NOAA wet-after-wet and wet-after-dry chances,
// the amount, rain or snow from the day's temperatures, and snow cover melting.
function wxStep(p, d) {
  const m = dateOf(d).getMonth(),
    [tx, tn] = wxTemps(d),
    tm = (tx + tn) / 2,
    wet = wxHash(d, 1) < (p.wet ? WX.pww[m] : WX.pdw[m]);
  let amt = 0,
    snow = false;
  if (wet) {
    // colder days bring less water: on the station's wet days with a high below 20°F the mean is 0.55 of
    // the all-days mean and the wettest was 0.96 in (tools/weather_fit_amt_by_t.py), so the amount shrinks
    // from 30°F down to 15°F and is capped at 1 in below 20°F
    amt = ((wxQ(wxHash(d, 2)) * WX.mean[m]) / WX.allMean) * clamp(0.55 + (tx - 15) * 0.03, 0.55, 1);
    if (tx < 20) amt = Math.min(amt, 1);
    snow = wxHash(d, 3) < 1 / (1 + Math.exp((tx - WX.t50) / WX.ts));
  }
  const snowIn = snow ? amt * clamp(WX.rA + WX.rB * (30 - tx), 2, 16) : 0,
    d0 = p.d1,
    d1 = Math.max(0, d0 * (1 - WX.settle) + snowIn - WX.melt * Math.max(0, tm - 32));
  // when it falls in the day and for how long is an illustration (the record is daily)
  const h0 = wxHash(d, 4) * 24,
    dur = wet ? clamp(2 + amt * 10, 1.5, 16) : 0;
  return {
    d,
    m,
    tx,
    tn,
    wet,
    amt,
    snow,
    snowIn,
    d0,
    d1,
    h0,
    dur,
    spill: p.wet ? Math.max(0, p.h0 + p.dur - 24) : 0,
    spillSnow: !!p.snow,
    spillRate: p.dur ? p.amt / p.dur : 0,
    t14: p.t14 + (tm - p.t14) / 7,
    wetAvg: p.wetAvg + ((wet ? 1 : 0) - p.wetAvg) / 10,
    cloud: wxHash(d, 5)
  };
}
// the picture at the hour shown
function wxNow() {
  const s = wxDay(S.day),
    h = WV.hour,
    env = envNow(),
    tNow = tempAtHour(env.tmin, env.tmax, h, riseOf(env.day));
  let falling = 0,
    snowing = false,
    since = 99;
  if (s.wet && h >= s.h0 && h < s.h0 + s.dur) {
    falling = s.amt / s.dur;
    snowing = s.snow;
    since = 0;
  } else if (s.spill && h < s.spill) {
    falling = s.spillRate;
    snowing = s.spillSnow;
    since = 0;
  } else if (s.wet && h >= s.h0 + s.dur) since = h - s.h0 - s.dur;
  else if (s.spill) since = h - s.spill;
  else {
    const y = wxDay(S.day - 1);
    if (y.wet && !y.snow) since = h + 24 - Math.min(24, y.h0 + y.dur);
  }
  // snow on the ground: from the start-of-day depth to the end-of-day depth, with today's snow added as it falls
  const frac = s.snow ? clamp((h - s.h0) / Math.max(0.1, s.dur), 0, 1) : 0,
    depth = Math.max(0, s.d0 + ((s.d1 - s.d0 - s.snowIn) * h) / 24 + s.snowIn * frac);
  const wetG = depth < 0.3 ? clamp(1 - since / 6, 0, 1) * (falling || s.amt > 0.05 || since < 99 ? 1 : 0) : 0;
  // frost: dry ground and air at or below freezing on the hourly curve
  const frost = depth < 0.5 && !falling && since > 3 ? clamp((33 - tNow) / 4, 0, 1) : 0;
  // grass: green with a week-scale mean temperature (dormant below about 40°F), browner after a dry
  // spell in warm weather. Illustration, not a growth model
  const g = clamp((s.t14 - 40) / 22, 0, 1) * (s.t14 > 60 ? 0.6 + 0.4 * clamp(s.wetAvg / 0.3, 0, 1) : 1);
  const over = falling ? 1 : s.wet && Math.abs(h - (s.h0 + s.dur / 2)) < s.dur / 2 + 2 ? 0.7 : s.cloud * 0.35;
  return { s, falling, snowing, depth, wetG, frost, grass: g, over, tNow, ice: tNow <= 32 };
}
// Is rain or snow falling at the hour shown (phase 25)? Every bird out in a run asks this on each
// physics step, so the answer is kept for the same day, hour and weather-day record. Returns null when
// dry, else { rate: inches of water an hour, snow: true when it falls as snow }. Visual only.
function wxFallNow() {
  const c = WX.fall,
    s0 = WX.memo.get(S.day);
  if (c && s0 && c.day === S.day && c.hour === WV.hour && c.s === s0) return c.v;
  const n = wxNow(),
    v = n.falling > 0 ? { rate: n.falling, snow: !!n.snowing } : null;
  WX.fall = { day: S.day, hour: WV.hour, s: WX.memo.get(S.day), v };
  return v;
}
// A few words for the weather shown, like "Light snow" or "Wet ground".
function wxWords(n) {
  const r = n.falling,
    k = n.snowing ? 'snow' : 'rain',
    w = n.snowing ? (r < 0.03 ? 'Light ' : r < 0.08 ? '' : 'Heavy ') : r < 0.04 ? 'Light ' : r < 0.12 ? '' : 'Heavy ';
  const parts = [];
  if (r) parts.push(w ? w + k : k[0].toUpperCase() + k.slice(1));
  else if (n.s.wet) {
    const a = n.s.h0,
      b = n.s.h0 + n.s.dur;
    parts.push((n.s.snow ? 'Snow' : 'Rain') + ' ' + (WV.hour < a ? 'from ' + hh(a) : 'ended ' + hh(Math.min(b, 24))));
  } else parts.push(n.over > 0.2 ? 'Dry, some cloud' : 'Dry');
  if (n.depth >= 0.5) parts.push(Math.round(n.depth) + ' in of snow on the ground');
  else if (n.frost > 0.3) parts.push('frost');
  else if (n.wetG > 0.3) parts.push('ground wet');
  return parts.join(' · ');
}
// patchy snow mask for shallow snow: smooth value noise, thresholded at the cover level
function wxNoise(x, y) {
  const f = (i, j) => wxHash(i * 7919 + j * 104729, 77),
    i = Math.floor(x),
    j = Math.floor(y),
    u = x - i,
    v = y - j,
    s = t => t * t * (3 - 2 * t);
  const a = f(i, j),
    b = f(i + 1, j),
    c = f(i, j + 1),
    e = f(i + 1, j + 1);
  return a + (b - a) * s(u) + (c - a) * s(v) + (a - b - c + e) * s(u) * s(v);
}
// A cached speckled snow-cover picture for cover share 0 to 1 (in 12 steps).
function snowMask(cover) {
  const key = Math.round(cover * 12);
  if (WX.mask && WX.maskKey === key) return WX.mask;
  const W = 320,
    H = 260,
    cv = WX.mask || document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  if (!WX.field) {
    WX.field = new Float32Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        WX.field[y * W + x] = 0.55 * wxNoise(x / 18, y / 18) + 0.3 * wxNoise(x / 7 + 50, y / 7) + 0.15 * wxNoise(x / 3, y / 3 + 50);
  }
  const g = cv.getContext('2d'),
    img = g.createImageData(W, H),
    th = 1 - key / 12;
  for (let i = 0; i < W * H; i++) {
    const a = clamp((WX.field[i] - th) / 0.06 + 0.5, 0, 1);
    img.data[i * 4] = 244;
    img.data[i * 4 + 1] = 248;
    img.data[i * 4 + 2] = 255;
    img.data[i * 4 + 3] = Math.round(a * 235);
  }
  g.putImageData(img, 0, 0);
  WX.mask = cv;
  WX.maskKey = key;
  return cv;
}
// on the ground plane (planeT(0) set by drawGround): wet ground and puddles, frost, snow cover, cloud shadows
function wxGround(n) {
  const c = WV.ctx;
  if (n.wetG > 0.02) {
    c.fillStyle = 'rgba(40,36,26,' + 0.2 * n.wetG + ')';
    c.fillRect(-40, -40, 160, 130);
    if (n.s.amt > 0.25 || n.falling > 0.06)
      for (let i = 0; i < 14; i++) {
        const x = wxHash(i, 91) * PLOT.w,
          y = wxHash(i, 92) * PLOT.h,
          r = 0.5 + wxHash(i, 93) * 1.4 * clamp(n.s.amt, 0.3, 1.5);
        c.fillStyle = n.ice ? 'rgba(210,225,240,' + 0.55 * n.wetG + ')' : 'rgba(120,135,150,' + 0.5 * n.wetG + ')';
        c.beginPath();
        c.ellipse(x, y, r * 1.5, r, wxHash(i, 94) * 3, 0, 6.2832);
        c.fill();
      }
  }
  if (n.frost > 0.02) {
    c.fillStyle = 'rgba(232,242,255,' + 0.32 * n.frost + ')';
    c.fillRect(-40, -40, 160, 130);
  }
  if (n.depth > 0.05) {
    const cover = clamp(n.depth / 2, 0, 1);
    c.imageSmoothingEnabled = true;
    c.drawImage(snowMask(cover), -40, -40, 160, 130);
    if (n.depth > 2) {
      c.fillStyle = 'rgba(240,245,252,' + clamp((n.depth - 2) / 3, 0, 1) * 0.6 + ')';
      c.fillRect(-40, -40, 160, 130);
    }
  }
  if (n.over > 0.05 && !(WV.sun && WV.sun.night)) {
    // cloud shadows drifting across the plot (illustration)
    const t = WV.t * 1.5;
    for (let i = 0; i < 5; i++) {
      const x = ((wxHash(i, 61 + n.s.d) * 220 + t * (0.7 + wxHash(i, 62) * 0.6)) % 220) - 60,
        y = wxHash(i, 63 + n.s.d) * 150 - 40,
        r = 12 + wxHash(i, 64) * 14,
        gr = c.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(20,30,45,' + 0.16 * Math.min(1, n.over * 1.4) + ')');
      gr.addColorStop(1, 'rgba(20,30,45,0)');
      c.fillStyle = gr;
      c.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  }
}
// a white cap on a roof, drawn over the roof polygon (pts in plot feet); heated roofs are not melted
function snowCap(pts, ra) {
  const n = WV.wx;
  if (!n || n.depth < 0.3 || !ra) return;
  poly(pts, 'rgba(246,249,255,' + Math.min(0.95, 0.35 + n.depth / 4) * Math.max(0.5, ra) + ')');
}
// falling rain and snow in screen space, after the night shade so it shows at night too
function wxSky(n) {
  const c = WV.ctx,
    W = WV.w,
    H = WV.h,
    t = performance.now() / 1000;
  if (n.over > 0.05) {
    const day = !(WV.sun && WV.sun.night);
    if (day) {
      c.fillStyle = 'rgba(70,80,95,' + 0.2 * n.over + ')';
      c.fillRect(0, 0, W, H);
    }
  }
  if (!n.falling) return;
  const area = (W * H) / (900 * 560),
    wind = (wxHash(n.s.d, 7) - 0.5) * 0.8;
  if (n.snowing) {
    const N = Math.round(clamp(60 + n.falling * 3000, 60, 420) * area * qPart());
    c.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < N; i++) {
      const sp = 25 + wxHash(i, 11) * 30,
        r = 0.8 + wxHash(i, 12) * 1.8,
        y = (wxHash(i, 13) * (H + 20) + t * sp) % (H + 20) - 10,
        x = (((wxHash(i, 14) * W + t * sp * wind + Math.sin(t * 1.3 + i) * 8) % W) + W) % W;
      c.beginPath();
      c.arc(x, y, r, 0, 6.2832);
      c.fill();
    }
  } else {
    const N = Math.round(clamp(60 + n.falling * 2500, 60, 520) * area * qPart());
    c.strokeStyle = 'rgba(205,220,240,0.42)';
    c.lineWidth = 1;
    c.beginPath();
    for (let i = 0; i < N; i++) {
      const sp = 520 + wxHash(i, 21) * 260,
        L = 9 + wxHash(i, 22) * 9,
        y = (wxHash(i, 23) * (H + 40) + t * sp) % (H + 40) - 20,
        x = (((wxHash(i, 24) * W + t * sp * wind * 0.3) % W) + W) % W;
      c.moveTo(x, y);
      c.lineTo(x - L * wind * 0.3, y - L);
    }
    c.stroke();
  }
}
