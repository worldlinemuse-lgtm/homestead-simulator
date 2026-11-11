// world/perf.js
// Farm world (visual only). Drawing quality and frame-rate tools for phones. Nothing here reads or
// writes the model: quality changes only how many screen pixels are drawn and how many falling rain
// and snow streaks are drawn, never a count, a sale or a planner number.
//  - Quality: Auto (default), High, Medium, Low. High draws at the screen's own sharpness up to 2x,
//    Medium up to 1.5x, Low at 1x (a quarter of the pixels of High on most phones). Rain and snow
//    streaks: all, 60%, 35%.
//  - Auto starts at High and steps down one level when the farm plays below about 40 frames a second
//    for 2 seconds while you watch (paused or at a watching speed; skipping speeds spend their frames
//    on whole days on purpose, so they are not counted). Phase 34: it steps back up one level after
//    10 seconds in a row at 55 frames a second or more (a slow moment, such as a snowstorm at High, no
//    longer keeps a phone at Low for good). A level it has had to leave twice is not tried again until
//    you pick a quality, so a phone that really is too slow for it does not flicker between levels.
//    The 55 frames and 10 seconds are choices.
//  - Frame rate readout: frames a second, the drawing time of the last frames (JavaScript time only;
//    the browser's own pixel work comes after it) and the quality in use.
// ---- Contents (top-level functions, in file order; kept by tools/code_contents.py) ----
//   qTier - The quality level drawn now (0 low, 1 medium, 2 high).
//   qPart - share of rain and snow streaks drawn at this quality (weather.js)
//   qDpr - the canvas pixel ratio for this screen at this quality
//   qLoad - Reads the saved quality choice and FPS readout setting from the browser's storage.
//   qSave - Saves the quality choice and FPS readout setting in the browser's storage.
//   setQuality - mode: 'auto' or 0..2; resizes the canvas to the new pixel ratio
//   qApply - Applies a quality change: resizes the canvas to the new pixel ratio and updates the controls.
//   qUi - Brings the quality list and FPS button in line with the setting.
//   setFpsShow - Shows or hides the frame rate readout and saves the choice.
//   perfFrame - called once a frame by frame() with the gap since the last frame and the world drawing time
//   drawFps - the readout in the map's top right corner
//   initPerf - Sets up quality: reads saved settings, connects the controls, and watches whether the map is on
//         screen.
//   compNear - is a component's drawing anywhere near the screen?
// ---- end of contents ----
const QUALITY = [
  { label: 'Low', dpr: 1, part: 0.35 },
  { label: 'Medium', dpr: 1.5, part: 0.6 },
  { label: 'High', dpr: 2, part: 1 }
];
const PERF = {
  mode: 'auto', // 'auto' or a fixed tier index 0..2
  tier: 2, // quality level drawn now: 0 low, 1 medium, 2 high
  gaps: [], // ms between frames while watching
  draw: [], // ms of world drawing (JavaScript) per frame
  lastCheck: 0, // time (ms) of the last check, made every 0.5 s
  cool: 0, // no level change before this time (ms)
  drops: 0, // times Auto stepped down
  ups: 0, // phase 34: steps back up
  fails: {}, // phase 34: times Auto had to leave each level
  goodSince: 0, // phase 34: since when every check found 55 frames a second or more
  fps: 0, // frames a second at the last check (from the median gap)
  drawMs: 0, // median ms of world drawing at the last check
  show: false, // fps readout on screen (saved as farmsim.fps)
  onScreen: true // the world canvas is in view (IntersectionObserver)
};
// The quality level drawn now (0 low, 1 medium, 2 high).
function qTier() {
  return PERF.tier;
}
// share of rain and snow streaks drawn at this quality (weather.js)
function qPart() {
  return QUALITY[PERF.tier].part;
}
// the canvas pixel ratio for this screen at this quality
function qDpr() {
  return Math.min(QUALITY[PERF.tier].dpr, window.devicePixelRatio || 1);
}
// Reads the saved quality choice and FPS readout setting from the browser's storage.
function qLoad() {
  try {
    const v = localStorage.getItem('farmsim.quality');
    if (v === 'auto' || v === null) PERF.mode = 'auto';
    else if (/^[012]$/.test(v)) PERF.mode = +v;
    const f = localStorage.getItem('farmsim.fps');
    PERF.show = f === '1';
  } catch (e) {}
  PERF.tier = PERF.mode === 'auto' ? 2 : PERF.mode;
}
// Saves the quality choice and FPS readout setting in the browser's storage.
function qSave() {
  try {
    localStorage.setItem('farmsim.quality', String(PERF.mode));
    localStorage.setItem('farmsim.fps', PERF.show ? '1' : '0');
  } catch (e) {}
}
// mode: 'auto' or 0..2; resizes the canvas to the new pixel ratio
function setQuality(mode) {
  PERF.mode = mode === 'auto' ? 'auto' : clamp(Math.round(+mode), 0, 2);
  PERF.tier = PERF.mode === 'auto' ? 2 : PERF.mode;
  PERF.drops = 0;
  PERF.ups = 0;
  PERF.fails = {};
  PERF.goodSince = 0;
  PERF.gaps = [];
  PERF.cool = performance.now() + 1500;
  qSave();
  qApply();
}
// Applies a quality change: resizes the canvas to the new pixel ratio and updates the controls.
function qApply() {
  if (WV.resize) WV.resize();
  qUi();
}
// Brings the quality list and FPS button in line with the setting.
function qUi() {
  const s = $('quality');
  if (s) {
    s.value = String(PERF.mode);
    const o = s.querySelector('option[value="auto"]');
    if (o) o.textContent = 'Quality: Auto' + (PERF.mode === 'auto' ? ' (' + QUALITY[PERF.tier].label + ')' : '');
  }
  const b = $('bFps');
  if (b) b.classList.toggle('on', PERF.show);
}
// Shows or hides the frame rate readout and saves the choice.
function setFpsShow(on) {
  PERF.show = !!on;
  qSave();
  qUi();
}
// med(a): the median of a list of numbers (0 for an empty list).
const med = a => {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? s[s.length >> 1] : 0;
};
// called once a frame by frame() with the gap since the last frame and the world drawing time
function perfFrame(gapMs, drawMs) {
  const now = performance.now();
  PERF.draw.push(drawMs);
  if (PERF.draw.length > 60) PERF.draw.shift();
  const watching = !CLOCK.running || clockLive();
  const seen = document.visibilityState !== 'hidden' && PERF.onScreen;
  if (gapMs > 0 && gapMs < 500 && watching && seen) {
    PERF.gaps.push(gapMs);
    if (PERF.gaps.length > 120) PERF.gaps.shift();
  }
  if (now - PERF.lastCheck < 500) return;
  PERF.lastCheck = now;
  const g = med(PERF.gaps);
  PERF.fps = g ? 1000 / g : 0;
  PERF.drawMs = med(PERF.draw);
  if (PERF.mode !== 'auto') return;
  if (PERF.tier > 0 && now > PERF.cool && PERF.gaps.length >= 60 && g > 25) {
    PERF.fails[PERF.tier] = (PERF.fails[PERF.tier] || 0) + 1;
    PERF.tier--;
    PERF.drops++;
    PERF.gaps = [];
    PERF.goodSince = 0;
    PERF.cool = now + 3000;
    qApply();
    return;
  }
  // phase 34: step back up after 10 s in a row at 55 frames a second or more
  const good = PERF.gaps.length >= 60 && g > 0 && g < 1000 / 55;
  if (!good) PERF.goodSince = 0;
  else if (!PERF.goodSince) PERF.goodSince = now;
  if (good && PERF.tier < 2 && now > PERF.cool && now - PERF.goodSince >= 10000 && (PERF.fails[PERF.tier + 1] || 0) < 2) {
    PERF.tier++;
    PERF.ups++;
    PERF.gaps = [];
    PERF.goodSince = 0;
    PERF.cool = now + 3000;
    qApply();
  }
}
// the readout in the map's top right corner
function drawFps() {
  if (!PERF.show) return;
  const c = WV.ctx;
  screenT();
  const t1 = (PERF.fps ? PERF.fps.toFixed(0) : '–') + ' fps',
    t2 = 'draw ' + PERF.drawMs.toFixed(1) + ' ms · ' + QUALITY[PERF.tier].label + ', ' + WV.dpr + 'x pixels';
  c.font = '600 11px system-ui';
  const w = Math.max(c.measureText(t1).width, c.measureText(t2).width) + 12;
  c.fillStyle = 'rgba(18,22,28,0.74)';
  c.fillRect(WV.w - w - 6, 6, w, 32);
  c.textAlign = 'left';
  c.fillStyle = PERF.fps && PERF.fps < 40 ? '#ffb4a8' : '#c8f7c5';
  c.fillText(t1, WV.w - w, 19);
  c.font = '500 10px system-ui';
  c.fillStyle = 'rgba(235,240,245,0.85)';
  c.fillText(t2, WV.w - w, 33);
}
// Sets up quality: reads saved settings, connects the controls, and watches whether the map is on screen.
function initPerf() {
  qLoad();
  const s = $('quality');
  if (s) s.onchange = e => setQuality(e.target.value === 'auto' ? 'auto' : +e.target.value);
  const b = $('bFps');
  if (b) b.onclick = () => setFpsShow(!PERF.show);
  if (window.IntersectionObserver && WV.cv) new IntersectionObserver(es => (PERF.onScreen = es[es.length - 1].isIntersecting)).observe(WV.cv);
  qApply();
}
// is a component's drawing anywhere near the screen? Footprint widened by its radius and 3 ft, up to
// 20 ft high, plus 80 px; used to skip buildings that are wholly off screen when zoomed in.
function compNear(k) {
  const m = (+k.radius || 0) + 3,
    x0 = k.x - m,
    y0 = k.y - m,
    x1 = k.x + (k.w || 2) + m,
    y1 = k.y + (k.d || 2) + m;
  let a = 1e9,
    b = -1e9,
    c = 1e9,
    d = -1e9;
  for (const [x, y] of [
    [x0, y0],
    [x1, y0],
    [x0, y1],
    [x1, y1]
  ])
    for (const z of [0, 20]) {
      const o = iso(x, y, z);
      a = Math.min(a, o[0]);
      b = Math.max(b, o[0]);
      c = Math.min(c, o[1]);
      d = Math.max(d, o[1]);
    }
  return b > -80 && a < WV.w + 80 && d > -80 && c < WV.h + 80;
}
