// world/draw.js
// Farm world. Drawing: ground, pens, fixtures, animals, sky, lights, overlays.
// ---- Contents (top-level functions, in file order; kept by tools/code_contents.py) ----
//   groundCanvas - The grass and soil picture under the farm, drawn once per grass colour step and cached in
//         WV.ground.
//   lensField - The ground overlay picture for lens kind (heat, crowding ...), drawn once per layout, day and
//         weather and cached in WV.lensCv.
//   drawGround - Draws the ground: the cached grass and soil picture, each building's footprint and shadow,
//         and the lens overlay when one is on.
//   lensTint - The colour wash the current lens gives building k (crowding from green to red, light hours from
//         dark to yellow ...), or null.
//   tank - a box-shaped container with a sight strip on its front face showing the fill level (0..1)
//   drawHopper - rabbit J-feeder hung on the outside of the front wire, its lip through the wire (Penn State)
//         phase 40, close in (zoom > 20): FAO x5082 (fao_x5082_0e.txt, feed troughs and racks) says ...
//   drawBottle - water bottle on the outside of the wire, nipple through it; clear, so the water shows
//   drawTrough - trough feeder: open top, so the feed surface shows inside it; lip at the hens' back height
//   drawFount - round fount: a clear-sided reservoir on a pan; the lip is the pan's rim at the hens' back
//         height phase 33: zp0 and H0 set a pan on the floor and the reservoir's height (chick waterers)
//   drawTray - droppings tray under a wire floor; specks scale with the pen's rabbit count (the model's head
//         count)
//   floorQuad - Fills building k's floor rectangle at height z.
//   drawBack - Draws the parts of building k that lie behind the animals in it: floor, litter, back walls and
//         the fixtures against them.
//   furHash - Fixed scatter from a hash, never vr(), so drawing does not move the animals' dice.
//   nestDoe - The doe a hutch nest box belongs to (from the world view when shown, else from the model), or
//         undefined.
//   furCol - The coat colour of rabbit a as drawn, for her pulled fur in the nest; a light default when she is
//         not shown.
//   nestLining - tufts of pulled fur on the straw: more each day of the last 3 before kindling
//   nestBlanket - after kindling: a blanket of fur over the kits, thinning from day 10 as they start to move
//         about (FAO)
//   cageDoor - a front door in the cage wire: a galvanized frame, two hinge rings on one side and a latch on
//         the other
//   nestShellItems - the nest box closed in: Penn State says a nest box is enclosed but for a small opening;
//         FAO x5082 gives a hole of about 15 cm for the doe, a ledge below it that keeps the young ...
//   nestShell - Draws a closed rabbit nest box over its litter: walls, lid, the doe's hole, ledge and top
//         trapdoor, faint when roofs are see-through.
//   drawFront - Draws the parts of building k that lie in front of the animals: front walls, wire, doors and
//         the roof.
//   drawRabbit - Draws a rabbit (kit, grower or adult) at screen point s with u pixels per foot: size from its
//         weight, coat from looks.js (pink and bare under 8 days), and its pose: hop, rest, flop, s ...
//   drawBird - Draws a grown chicken (hen, rooster, pullet) at screen point s with u pixels per foot: body,
//         tail, comb, legs and its current pose (peck, preen, dust bath, roost, flap ...).
//   drawChick - Draws a chick at screen point s with u pixels per foot: round downy body, sized from its
//         weight, hopping when it walks.
//   crownOver - is any shown animal's body inside this screen ellipse?
//   crownAlpha - a crown blob's opacity, eased over about a third of a second so it does not pop as animals
//         walk in and out under it (state kept in WV, never in the farm)
//   drawAgent - Draws one animal: works out its screen point, skips it when off screen, then draws its jump
//         shadow or lens ring and calls the rabbit, bird or chick drawing.
//   drawFarmer - Draws the farmer walking the chore route, with a swinging stride while moving.
//   glow - Draws a soft round glow (radial gradient) of radius r ft at a farm point; col holds an "A" where
//         the opacity goes.
//   drawWorld - Draws one whole frame: sky and light for the hour, ground, buildings and animals sorted back
//         to front, weather, effects, labels and the HUD.
//   overflow - Text for the HUD when some animals are not drawn (more than 90 in one pen), else an empty
//         string.
//   chip - Draws a building label chip at screen point x, y: a rounded box with its lines of text, or a
//         compact one- line chip when small is set.
//   labelLines - The lines of text on building k's full label (what it holds and the model's key numbers for
//         it).
//   compactLine - The one line on building k's compact label at the zoomed-out view (phase 39).
//   chipSize - Width and height in pixels of a label chip with these lines (compact when small).
//   labelItems - One label item per building that gets a label at this zoom: its lines, size and anchor point
//         on screen.
//   labelSpots - Candidate offsets for a label of size w by h around its anchor, nearest first, in four rings
//         (phase 22, more rings phase 41).
//   animalZones - A chip drawn over an animal hides it and takes its taps (a tap on a chip opens the
//         building), so at a phone's starting zoom about 5 of the 16 animals could not be picked wi ...
//   polyHitsBox - does a convex screen polygon touch a box?
//   layoutLabels - Places every label without overlaps: first a spot clear of the animal zones (phase 41),
//         else the nearest free spot (phase 22); hides what cannot fit.
//   drawLabels - Draws the placed labels: leader lines first, then the chips on top.
//   hitLabel - tapping a chip picks its building (used by input.js hitComp)
// ---- end of contents ----
// ---------- drawing ----------

// The grass and soil picture under the farm, drawn once per grass colour step and cached in WV.ground.
function groundCanvas() {
  // grass colour from the weather picture (world/weather.js): week-scale warmth and recent rain
  const g = WV.wx ? WV.wx.grass : 0.5,
    key = Math.round(g * 8);
  if (WV.ground && WV.groundKey === key) return WV.ground;
  const s = 5,
    X0 = -40,
    Y0 = -40,
    W = 160,
    H = 130,
    cv = WV.ground || document.createElement('canvas');
  cv.width = W * s;
  cv.height = H * s;
  const x = cv.getContext('2d');
  const grass = mix('#9a9363', '#5c9a45', g),
    field = mix('#8f8a5c', '#4f8a3c', g);
  x.fillStyle = field;
  x.fillRect(0, 0, cv.width, cv.height);
  x.fillStyle = grass;
  x.fillRect(-X0 * s, -Y0 * s, PLOT.w * s, PLOT.h * s);
  x.globalAlpha = 0.07;
  x.fillStyle = '#ffffff';
  for (let i = 0; i < PLOT.w; i += 4) x.fillRect((-X0 + i) * s, -Y0 * s, 2 * s, PLOT.h * s);
  x.globalAlpha = 1;
  let q = 12345;
  const rr = () => {
    q = (q * 1103515245 + 12345) & 0x7fffffff;
    return q / 0x7fffffff;
  };
  for (let i = 0; i < 14000; i++) {
    const px = rr() * W * s,
      py = rr() * H * s,
      t = rr();
    x.strokeStyle = t < 0.5 ? mix('#3e6f2c', '#6b6a3a', 1 - g, 0.35) : mix('#a9d27c', '#d8cf96', 1 - g, 0.35);
    x.lineWidth = 1;
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px + rr() * 2 - 1, py - 2 - rr() * 3);
    x.stroke();
  }
  WV.ground = cv;
  WV.groundKey = key;
  return cv;
}
// The ground overlay picture for lens kind (heat, crowding ...), drawn once per layout, day and weather and
// cached in WV.lensCv.
function lensField(kind) {
  const env = envNow(),
    key = kind + '|' + WV.layoutKey + '|' + S.day + '|' + env.tmax + '|' + env.tmin;
  if (WV.lensKey === key) return WV.lensCv;
  const cv = WV.lensCv || document.createElement('canvas');
  cv.width = PLOT.w;
  cv.height = PLOT.h;
  const g = cv.getContext('2d'),
    img = g.createImageData(PLOT.w, PLOT.h);
  for (let y = 0; y < PLOT.h; y++)
    for (let x = 0; x < PLOT.w; x++) {
      const m = micro({ type: 'hutch', x, y, w: 1, d: 1, lights: 0 }, env);
      let c;
      if (kind === 'heat') {
        const t = clamp((env.tmax - m.tmax) / 12, 0, 1);
        c = [228 + (61 - 228) * t, 87 + (139 - 87) * t, 46 + (253 - 46) * t];
      } else {
        c = m.heated ? [255, 150, 40] : [70, 120, 230];
      }
      const i = (y * PLOT.w + x) * 4;
      img.data[i] = c[0];
      img.data[i + 1] = c[1];
      img.data[i + 2] = c[2];
      img.data[i + 3] = 150;
    }
  g.putImageData(img, 0, 0);
  WV.lensCv = cv;
  WV.lensKey = key;
  return cv;
}
// Draws the ground: the cached grass and soil picture, each building's footprint and shadow, and the lens
// overlay when one is on.
function drawGround() {
  const c = WV.ctx,
    env = envNow();
  planeT(0);
  c.imageSmoothingEnabled = true;
  c.drawImage(groundCanvas(), -40, -40, 160, 130);
  for (const k of S.comps) {
    const K = WV.K[k.id] || {};
    if (k.type === 'run') {
      const ratio = S.today.run ? S.today.run.ratio : 0;
      c.fillStyle = mix('#7f9a4f', '#8a6b47', clamp(ratio, 0, 1.2) / 1.2, 0.85);
      c.fillRect(k.x, k.y, k.w, k.d);
      if (!K.attached) {
        c.setLineDash([0.6, 0.4]);
        c.strokeStyle = '#e04b3a';
        c.lineWidth = 0.15;
        c.strokeRect(k.x, k.y, k.w, k.d);
        c.setLineDash([]);
      }
    }
    if (k.type === 'tree') {
      const p = ctr(k),
        on = env.tmax > 70,
        gr = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], k.radius);
      gr.addColorStop(0, 'rgba(10,30,10,' + (on ? 0.38 : 0.12) + ')');
      gr.addColorStop(1, 'rgba(10,30,10,0)');
      c.fillStyle = gr;
      c.beginPath();
      c.arc(p[0], p[1], k.radius, 0, 7);
      c.fill();
    }
    if (k.type === 'fan') {
      const p = ctr(k),
        on = env.tmax > k.trigger;
      if (on) {
        const gr = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], k.radius);
        gr.addColorStop(0, 'rgba(120,190,255,0.32)');
        gr.addColorStop(1, 'rgba(120,190,255,0)');
        c.fillStyle = gr;
        c.beginPath();
        c.arc(p[0], p[1], k.radius, 0, 7);
        c.fill();
      }
      c.setLineDash([0.5, 0.5]);
      c.strokeStyle = 'rgba(120,190,255,0.5)';
      c.lineWidth = 0.08;
      c.beginPath();
      c.arc(p[0], p[1], k.radius, 0, 7);
      c.stroke();
      c.setLineDash([]);
    }
    if (k.type === 'heater') {
      const p = ctr(k),
        on = tempAtHour(env.tmin, env.tmax, WV.hour, riseOf(env.day)) < k.setpoint;
      c.fillStyle = 'rgba(255,140,50,' + (on ? 0.16 : 0) + ')';
      c.beginPath();
      c.arc(p[0], p[1], k.radius, 0, 7);
      c.fill();
      c.setLineDash([0.5, 0.5]);
      c.strokeStyle = 'rgba(255,150,60,0.55)';
      c.lineWidth = 0.08;
      c.stroke();
      c.setLineDash([]);
    }
    if (['coop', 'feed', 'hutch', 'water', 'incubator', 'brooder'].includes(k.type)) {
      c.fillStyle = 'rgba(0,0,0,0.16)';
      c.fillRect(k.x - 0.2, k.y - 0.2, k.w + 0.9, k.d + 0.9);
    }
  }
  if (WV.wx) wxGround(WV.wx);
  if (WV.lens === 'heat' || WV.lens === 'cold') {
    c.globalAlpha = 0.6;
    c.drawImage(lensField(WV.lens), 0, 0, PLOT.w, PLOT.h);
    c.globalAlpha = 1;
  }
  // plot fence footprint line
  c.strokeStyle = 'rgba(60,40,20,0.35)';
  c.lineWidth = 0.1;
  c.strokeRect(0, 0, PLOT.w, PLOT.h);
  if (WV.lens === 'chores' && WV.route) {
    const R = WV.route;
    c.lineWidth = 0.18;
    for (const s of R.stops) {
      if (R.feed) {
        c.strokeStyle = 'rgba(255,210,90,0.9)';
        c.setLineDash([0.8, 0.5]);
        c.beginPath();
        c.moveTo(s.p[0], s.p[1]);
        const f = ctr(R.feed);
        c.lineTo(f[0], f[1]);
        c.stroke();
      }
      if (R.water) {
        c.strokeStyle = 'rgba(110,190,255,0.9)';
        c.beginPath();
        c.moveTo(s.p[0], s.p[1]);
        const w = ctr(R.water);
        c.lineTo(w[0], w[1]);
        c.stroke();
      }
      c.setLineDash([]);
    }
  }
  const hs = (WV.hover && WV.hover.c) || null,
    ss = sel && compById(sel);
  for (const k of [hs, ss]) {
    if (!k) continue;
    c.strokeStyle = k === ss ? '#ffd84d' : 'rgba(255,255,255,0.7)';
    c.lineWidth = 0.18;
    if (TYPES[k.type].round) {
      c.beginPath();
      c.arc(k.x + 1, k.y + 1, 1.3, 0, 7);
      c.stroke();
    } else c.strokeRect(k.x - 0.1, k.y - 0.1, k.w + 0.2, k.d + 0.2);
  }
  screenT();
}
// The colour wash the current lens gives building k (crowding from green to red, light hours from dark to
// yellow ...), or null.
function lensTint(k) {
  const K = WV.K[k.id];
  if (!K) return null;
  if (WV.lens === 'space' && TYPES[k.type].pen)
    return mix('#3fbf5a', '#e0402f', clamp((K.dens - 0.6) / 0.6, 0, 1), 0.45);
  if (WV.lens === 'light' && (k.type === 'coop' || k.type === 'hutch'))
    return mix('#2a3550', '#ffe066', clamp((K.m.light - 8) / 8, 0, 1), 0.55);
  if (WV.lens === 'health' && TYPES[k.type].pen) {
    const L = S.animals.filter(a => a.enc === k.id);
    if (!L.length) return null;
    const h = L.reduce((s, a) => s + a.health, 0) / L.length;
    return mix('#e0402f', '#3fbf5a', clamp((h - 50) / 50, 0, 1), 0.45);
  }
  return null;
}
// ---------- feeders, waterers and fittings (visual only) ----------
const FEED_COL = { rabbit: '#8c7a3c', hen: '#c9a24a', chick: '#d8b45a' };
// a box-shaped container with a sight strip on its front face showing the fill level (0..1)
function tank(x, y, z, w, d, h, col, level, fillCol, win, al) {
  box(x, y, z, w, d, h, col, al);
  const wf = win == null ? 0.4 : win,
    x0 = x + (w * (1 - wf)) / 2,
    x1 = x + (w * (1 + wf)) / 2,
    zb = z + h * 0.06,
    zt = z + h * 0.94,
    zl = zb + (zt - zb) * clamp(level, 0, 1);
  if (WV.zoom < 7) return;
  poly(
    [
      [x0, y + d + 0.001, zb],
      [x1, y + d + 0.001, zb],
      [x1, y + d + 0.001, zt],
      [x0, y + d + 0.001, zt]
    ],
    'rgba(30,30,30,0.55)'
  );
  if (zl > zb + 1e-3)
    poly(
      [
        [x0, y + d + 0.002, zb],
        [x1, y + d + 0.002, zb],
        [x1, y + d + 0.002, zl],
        [x0, y + d + 0.002, zl]
      ],
      fillCol
    );
}
// rabbit J-feeder hung on the outside of the front wire, its lip through the wire (Penn State)
// phase 40, close in (zoom > 20): FAO x5082 (fao_x5082_0e.txt, feed troughs and racks) says the hopper
// is filled from outside without opening the door, has a trap to keep the young out, and its feed box is
// split by partitions about 7-8 cm apart for medium breeds. So the lip inside the cage shows the pellets,
// partitions (the 5 in lip holds 2 places of 6.4 cm, a little under FAO's figure because the lip width
// is my choice) and an inturned rim as the kit guard; the top has a lid hinged at the back for filling.
function drawHopper(px, yf, z0, level, kind) {
  const w = 0.42,
    d = 0.3,
    h = 0.62,
    x = px - w / 2,
    fine = WV.zoom > 20 && !WV.noHopDetail && (kind || 'rabbit') === 'rabbit';
  box(x, yf - 0.12, z0 + 0.12, w, 0.22, 0.12, '#9aa3ab');
  if (fine) {
    const zt = z0 + 0.241,
      y0 = yf - 0.105;
    poly(
      [
        [x + 0.025, y0, zt],
        [x + w - 0.025, y0, zt],
        [x + w - 0.025, yf - 0.005, zt],
        [x + 0.025, yf - 0.005, zt]
      ],
      level > 0.02 ? FEED_COL.rabbit : '#5f666c'
    );
    const n = Math.max(1, Math.round((w * 30.48) / 7.5));
    for (let i = 1; i < n; i++) box(x + (w * i) / n - 0.008, yf - 0.12, z0 + 0.12, 0.016, 0.12, 0.135, '#7d868e');
    line3([x, yf - 0.12, z0 + 0.255], [x + w, yf - 0.12, z0 + 0.255], '#c3cad0', lw(0.02));
  }
  tank(x, yf, z0 + 0.15, w, d, h, '#a7b0b8', level, FEED_COL[kind || 'rabbit'], 0.45);
  if (WV.zoom > 14) line3([x, yf + d, z0 + 0.15 + h], [x + w, yf + d, z0 + 0.15 + h], '#d8dde2', lw(0.025));
  if (fine) {
    const zl = z0 + 0.15 + h;
    poly(
      [
        [x - 0.015, yf - 0.005, zl + 0.012],
        [x + w + 0.015, yf - 0.005, zl + 0.012],
        [x + w + 0.015, yf + d + 0.02, zl + 0.012],
        [x - 0.015, yf + d + 0.02, zl + 0.012]
      ],
      '#b9c1c8',
      '#7d868e',
      lw(0.01)
    );
    for (const t of [0.2, 0.8]) box(x + w * t - 0.03, yf - 0.02, zl, 0.06, 0.03, 0.03, '#6f777e');
    box(px - 0.04, yf + d + 0.005, zl - 0.03, 0.08, 0.02, 0.03, '#6f777e');
  }
}
// water bottle on the outside of the wire, nipple through it; clear, so the water shows
function drawBottle(px, yf, z0, level) {
  const w = 0.2,
    d = 0.2,
    h = 0.85,
    x = px - w / 2,
    zb = z0 + 0.5;
  line3([px, yf, zb + 0.02], [px, yf - 0.18, zb - 0.06], '#888', lw(0.03));
  box(x, yf, zb, w, d, h, '#cfe6f5', 0.35);
  const lv = clamp(level, 0, 1);
  if (lv > 0.01) box(x + 0.02, yf + 0.02, zb + 0.02, w - 0.04, d - 0.04, (h - 0.1) * lv, '#4f95d0', 0.75);
  box(px - 0.05, yf + 0.05, zb + h, 0.1, 0.1, 0.08, '#d24a3a');
  // phase 40, close in: the wire clip that holds the bottle on the outside of the cage (Penn State: the
  // watering system attaches to the outside of the cage) and the ball tip of the drinking tube; the clip's
  // shape is my illustration
  if (WV.zoom > 20 && !WV.noHopDetail) {
    const c = '#8e969c',
      e = lw(0.012);
    for (const zc of [zb + h * 0.3, zb + h * 0.72]) {
      line3([x, yf, zc], [x, yf + d + 0.01, zc], c, e);
      line3([x, yf + d + 0.01, zc], [x + w, yf + d + 0.01, zc], c, e);
      line3([x + w, yf + d + 0.01, zc], [x + w, yf, zc], c, e);
    }
    const tip = iso(px, yf - 0.18, zb - 0.06);
    E(tip[0], tip[1], WV.zoom * 0.018, WV.zoom * 0.018, 0, '#b8bec3');
  }
}
// trough feeder: open top, so the feed surface shows inside it; lip at the hens' back height
function drawTrough(t, level, kind) {
  const h = kind === 'chick' ? 0.25 : 0.95,
    lip = 0.22,
    z1 = h,
    z0 = h - lip;
  // phase 33: a trough may run along y (brooder troughs on a short wall); its legs sit at its ends
  if (t.w >= t.d) for (const lx of [t.x + 0.05, t.x + t.w - 0.12]) box(lx, t.y + t.d / 2 - 0.04, 0, 0.07, 0.08, z0, '#6b6b6b');
  else for (const ly of [t.y + 0.05, t.y + t.d - 0.12]) box(t.x + t.w / 2 - 0.04, ly, 0, 0.08, 0.07, z0, '#6b6b6b');
  wallY(t.y, t.y + t.d, t.x, z0, z1, '#9aa3ab');
  wallX(t.x, t.x + t.w, t.y, z0, z1, '#a7b0b8');
  const zf = z0 + 0.02 + (lip - 0.04) * clamp(level, 0, 1);
  poly(
    [
      [t.x, t.y, z0 + 0.01],
      [t.x + t.w, t.y, z0 + 0.01],
      [t.x + t.w, t.y + t.d, z0 + 0.01],
      [t.x, t.y + t.d, z0 + 0.01]
    ],
    '#5f666c'
  );
  if (level > 0.01)
    poly(
      [
        [t.x + 0.03, t.y + 0.03, zf],
        [t.x + t.w - 0.03, t.y + 0.03, zf],
        [t.x + t.w - 0.03, t.y + t.d - 0.03, zf],
        [t.x + 0.03, t.y + t.d - 0.03, zf]
      ],
      FEED_COL[kind] || FEED_COL.hen
    );
  wallX(t.x, t.x + t.w, t.y + t.d, z0, z1, '#b3bcc4');
  wallY(t.y, t.y + t.d, t.x + t.w, z0, z1, '#8e979f');
  if (WV.zoom > 12) {
    if (t.w >= t.d) line3([t.x, t.y + t.d / 2, z1 + 0.12], [t.x + t.w, t.y + t.d / 2, z1 + 0.12], '#c3cad0', lw(0.03));
    else line3([t.x + t.w / 2, t.y, z1 + 0.12], [t.x + t.w / 2, t.y + t.d, z1 + 0.12], '#c3cad0', lw(0.03));
  }
}
// round fount: a clear-sided reservoir on a pan; the lip is the pan's rim at the hens' back height
// phase 33: zp0 and H0 set a pan on the floor and the reservoir's height (chick waterers)
function drawFount(f, level, zp0, H0) {
  const u = WV.zoom,
    zp = zp0 == null ? 0.7 : zp0,
    H = H0 == null ? Math.max(0.5, f.r * 2.2) : H0,
    b = iso(f.x, f.y, zp),
    lv = clamp(level, 0, 1);
  if (zp > 0.1) box(f.x - 0.05, f.y - 0.05, 0, 0.1, 0.1, zp, '#6b6b6b');
  E(b[0], b[1], u * f.r, u * f.r * 0.5, 0, '#8fa3b0');
  E(b[0], b[1] - u * 0.03, u * f.r * 0.85, u * f.r * 0.42, 0, '#4f95d0');
  const rr = f.r * 0.7,
    top = iso(f.x, f.y, zp + H),
    wl = iso(f.x, f.y, zp + 0.05 + (H - 0.1) * lv),
    c = WV.ctx;
  c.fillStyle = 'rgba(205,230,245,0.35)';
  c.fillRect(b[0] - u * rr, top[1], u * rr * 2, b[1] - top[1]);
  if (lv > 0.01) {
    c.fillStyle = 'rgba(70,140,200,0.75)';
    c.fillRect(b[0] - u * rr, wl[1], u * rr * 2, b[1] - wl[1]);
    E(wl[0], wl[1], u * rr, u * rr * 0.5, 0, 'rgba(110,175,225,0.9)');
  }
  E(top[0], top[1], u * rr, u * rr * 0.5, 0, '#d24a3a');
}
// droppings tray under a wire floor; specks scale with the pen's rabbit count (the model's head count)
function drawTray(k, n) {
  const x = k.x + 0.1,
    y = k.y + 0.1,
    w = k.w - 0.2,
    d = k.d - 0.2;
  poly(
    [
      [x, y, 1.15],
      [x + w, y, 1.15],
      [x + w, y + d, 0.95],
      [x, y + d, 0.95]
    ],
    '#8d969c',
    '#5e666c',
    lw(0.02)
  );
  if (WV.zoom < 7) return;
  const m = Math.min(160, n * 6);
  for (let i = 0; i < m; i++) {
    const fx = (i * 0.6180339887) % 1,
      fy = (i * 0.7548776662 + 0.3) % 1,
      o = iso(x + 0.1 + fx * (w - 0.2), y + 0.1 + fy * (d - 0.2), 1.15 - 0.2 * fy + 0.01);
    E(o[0], o[1], WV.zoom * 0.035, WV.zoom * 0.025, 0, '#4a3a22');
  }
}
// Fills building k's floor rectangle at height z.
function floorQuad(k, z, col) {
  poly(
    [
      [k.x, k.y, z],
      [k.x + k.w, k.y, z],
      [k.x + k.w, k.y + k.d, z],
      [k.x, k.y + k.d, z]
    ],
    col
  );
}
// ---------- buildings, back half (drawn before the animals in them) ----------
// drawBack(k) by building type: hutch bank, coop, run, brooder. roofA is the roof opacity both halves use.
const roofA = () => (WV.roofs === 2 ? 1 : WV.roofs === 1 ? 0.22 : 0);
// Draws the parts of building k that lie behind the animals in it: floor, litter, back walls and the fixtures
// against them. Its front half is drawFront, sorted in after the animals.
function drawBack(k) {
  const env = envNow(),
    K = WV.K[k.id] || {},
    x = k.x,
    y = k.y,
    w = k.w,
    d = k.d,
    tint = lensTint(k);
  // ---- rabbit hutch bank ----
  if (k.type === 'hutch') {
    const z0 = 2,
      z1 = 4.1,
      wood = '#a8743f';
    for (const lx of [x + 0.15, x + w / 2, x + w - 0.35]) box(lx, y + 0.15, 0, 0.2, 0.2, z0, '#6e4a28');
    drawTray(k, K.rabN || 0);
    // frame only: Penn State's wire floor (0.5 by 1 in mesh) lets droppings fall through to the tray
    box(x, y, 1.8, w, 0.18, 0.25, wood);
    box(x, y, 1.8, 0.18, d, 0.25, wood);
    box(x, y + d - 0.18, 1.8, w, 0.18, 0.25, wood);
    box(x + w - 0.18, y, 1.8, 0.18, d, 0.25, wood);
    floorQuad(k, 2.05, 'rgba(201,191,174,0.55)');
    if (tint) floorQuad(k, 2.06, tint);
    if (WV.zoom > 9) {
      // drawn at true mesh size when close (0.5 x 1 in), coarser further out so it stays a texture
      const sx = WV.zoom > 60 ? 1 / 24 : WV.zoom > 30 ? 0.25 : 0.5,
        sy = WV.zoom > 60 ? 1 / 12 : WV.zoom > 30 ? 0.25 : 0.5,
        mc = 'rgba(90,90,90,0.3)';
      for (let t = x; t <= x + w + 1e-6; t += sx) line3([t, y, 2.06], [t, y + d, 2.06], mc, lw(0.012));
      for (let t = y; t <= y + d + 1e-6; t += sy) line3([x, t, 2.06], [x + w, t, 2.06], mc, lw(0.012));
    }
    wallX(x, x + w, y, z0, z1, '#b98450');
    wallY(y, y + d, x, z0, z1, '#9b6c3e');
    for (const n of K.nests || []) {
      box(n.x, n.y, 2.05, n.w, n.d, 0.25, '#c79a62');
      wallX(n.x, n.x + n.w, n.y, 2.05, 2.9, '#c79a62');
      wallY(n.y, n.y + n.d, n.x, 2.05, 2.9, '#b88a55');
      poly(
        [
          [n.x + 0.05, n.y + 0.05, 2.3],
          [n.x + n.w - 0.05, n.y + 0.05, 2.3],
          [n.x + n.w - 0.05, n.y + n.d - 0.05, 2.3],
          [n.x + 0.05, n.y + n.d - 0.05, 2.3]
        ],
        '#d9c38a'
      );
      nestLining(n);
    }
  }
  // ---- chicken coop ----
  if (k.type === 'coop') {
    const H = 6;
    box(x, y, 0, w, d, 0.35, '#8a6a3e');
    floorQuad(k, 0.36, '#d9c27a');
    if (tint) floorQuad(k, 0.37, tint);
    wallX(x, x + w, y, 0.35, H, '#b5763c');
    wallY(y, y + d, x, 0.35, H, '#9a6131');
    poly(
      [
        [x, y, H],
        [x, y + d, H],
        [x, y + d / 2, H + 2.4]
      ],
      shd('#9a6131', 1),
      shd('#9a6131', 0.5)
    );
    if (K.lightOn) E(...iso(x + w / 2, y + d / 2, H - 0.3), WV.zoom * 0.25, WV.zoom * 0.25, 0, '#fff3b0');
    const eggs = WV.nest[k.id] || 0;
    // phase 27: nest-box stand (Penn State: nests 24 in above the floor), posts and a shelf board
    for (const l of K.legs || [])
      if (l.kind === 'nest') {
        box(l.x, k.y + 0.1, 0.35, l.w, l.w, l.top - 0.35, '#6e4a28');
        box(l.x, l.y, 0.35, l.w, l.d, l.top - 0.35, '#7a5532');
      }
    if ((K.nests || []).length) {
      const n0 = K.nests[0],
        nL = K.nests[K.nests.length - 1];
      box(n0.x, n0.y, n0.z - 0.22, nL.x + nL.w - n0.x, n0.d, 0.08, '#8a5d33');
    }
    (K.nests || []).forEach((n, i) => {
      box(n.x, n.y, n.z - 0.15, n.w, n.d, 0.95, '#c58b4c');
      const o = iso(n.x + n.w / 2, n.y + n.d, n.z + 0.35);
      E(o[0], o[1], WV.zoom * 0.32, WV.zoom * 0.22, 0, '#3a2412');
      const here = Math.floor(eggs / K.nests.length) + (i < eggs % K.nests.length ? 1 : 0);
      for (let e = 0; e < Math.min(here, 4); e++)
        E(
          o[0] + (e - 1.5) * WV.zoom * 0.16,
          o[1] + WV.zoom * 0.08,
          WV.zoom * 0.07,
          WV.zoom * 0.09,
          0,
          '#f3e6cf'
        );
    });
    // roost frame (phase 27, Penn State): 2 x 2 in bars 12 in apart and 24 in above the floor, a post
    // at each end of every bar and a side rail joining the bar ends
    const bars = K.perches || (K.perch ? [K.perch] : []);
    const no2 = WV.noRoost2; // tests: hide the second roost (phase 38)
    for (const l of K.legs || [])
      if (l.kind === 'perch' && !(no2 && l.more)) box(l.x, l.y, 0.35, l.w, l.d, l.top - 0.35 - 0.17, '#6e4a28');
    // side rails join the bar ends of each frame (phase 38: the second roost has its own frames)
    for (const fr of K.roostFrames || [{ ax: 'y', bars }]) {
      const fb = fr.bars;
      if (fb.length < 2 || (no2 && fb[0].more)) continue;
      const b0 = fb[0],
        bL = fb[fb.length - 1],
        zr = b0.z - 0.34;
      if (fr.ax === 'x') {
        const xS = Math.max(...fb.map(b => b.x0)),
          xE = Math.min(...fb.map(b => b.x1));
        box(xS, b0.y - 0.085, zr, 0.12, bL.y - b0.y + 0.17, 0.12, '#7a5532');
        box(xE - 0.12, b0.y - 0.085, zr, 0.12, bL.y - b0.y + 0.17, 0.12, '#7a5532');
      } else {
        const yS = Math.max(...fb.map(b => b.y0)),
          yE = Math.min(...fb.map(b => b.y1));
        box(b0.x - 0.085, yS, zr, bL.x - b0.x + 0.17, 0.12, 0.12, '#7a5532');
        box(b0.x - 0.085, yE - 0.12, zr, bL.x - b0.x + 0.17, 0.12, 0.12, '#7a5532');
      }
    }
    for (const p of bars)
      if (no2 && p.more) continue;
      else if (p.ax === 'x') box(p.x0, p.y - 0.085, p.z - 0.17, p.x1 - p.x0, 0.17, 0.17, '#8a5d33');
      else box(p.x - 0.085, p.y0, p.z - 0.17, 0.17, p.y1 - p.y0, 0.17, '#8a5d33');
    const lv = fillLeft(k);
    for (const t of K.troughs || []) drawTrough(t, 0.5 * lv, 'hen');
    for (const f of K.founts || []) drawFount(f, 0.85 * lv);
  }
  // ---- chicken run ----
  if (k.type === 'run') {
    for (const [a0, a1, yy] of [[x, x + w, y]]) {
      mesh(true, a0, a1, yy, 0, 4);
    }
    mesh(false, y, y + d, x, 0, 4);
    for (let t = x; t <= x + w + 0.01; t += w / Math.max(1, Math.round(w / 4)))
      box(t - 0.1, y - 0.1, 0, 0.2, 0.2, 4.2, '#7a5532');
    for (let t = y; t <= y + d + 0.01; t += d / Math.max(1, Math.round(d / 4)))
      box(x - 0.1, t - 0.1, 0, 0.2, 0.2, 4.2, '#7a5532');
    box(x, y - 0.06, 3.95, w, 0.12, 0.12, '#8a6038');
    box(x - 0.06, y, 3.95, 0.12, d, 0.12, '#8a6038');
    box(x, y - 0.04, 0, w, 0.08, 0.35, '#7a5532');
    box(x - 0.04, y, 0, 0.08, d, 0.35, '#7a5532');
  }
  // ---- brooder ----
  if (k.type === 'brooder') {
    box(x, y, 0, w, d, 0.3, '#bfa070');
    floorQuad(k, 0.31, '#ead9b0');
    if (tint) floorQuad(k, 0.32, tint);
    wallX(x, x + w, y, 0.3, 1.6, '#d8b98a');
    wallY(y, y + d, x, 0.3, 1.6, '#c8a878');
    if (+k.indoor) {
      for (const [px, py] of [
        [x - 0.3, y - 0.3],
        [x + w + 0.3, y - 0.3],
        [x - 0.3, y + d + 0.3]
      ])
        line3([px, py, 0], [px, py, 6], 'rgba(110,80,50,0.8)', lw(0.08));
    }
    if (K.lamp) {
      line3([x + 0.2, y + 0.2, 1.6], [x + 0.2, y + 0.2, 3.6], '#555', lw(0.05));
      line3([x + 0.2, y + 0.2, 3.6], [K.lamp[0], K.lamp[1], 3.6], '#555', lw(0.04));
      line3([K.lamp[0], K.lamp[1], 3.6], [K.lamp[0], K.lamp[1], 3.0], '#333', lw(0.02));
    }
    if (K.btr) {
      // phase 33: chick troughs and floor waterers sized from the chick count (broodGear), drawn
      // back to front; levels follow the model's daily intake as before
      const lv = fillLeft(k),
        G = K.btr.map(t => ({ t, s: t.x + t.w / 2 + t.y + t.d / 2 })).concat(K.bfo.map(f => ({ f, s: f.x + f.y })));
      G.sort((p, q) => p.s - q.s);
      for (const o of G) {
        if (o.t) drawTrough(o.t, 0.5 * lv, 'chick');
        else drawFount(o.f, 0.85 * lv, 0.02, o.f.H);
      }
    }
  }
}
// ---------- fur-lined nests (phase 23, visual only) ----------
// Fixed scatter from a hash, never vr(), so drawing does not move the animals' dice.
function furHash(i) {
  const t = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return t - Math.floor(t);
}
// The doe a hutch nest box belongs to (from the world view when shown, else from the model), or undefined.
function nestDoe(n) {
  const g = n && WV.agents.get(n.doe);
  return g ? g.ref : S.animals.find(a => a.id === (n && n.doe));
}
// The coat colour of rabbit a as drawn, for her pulled fur in the nest; a light default when she is not shown.
function furCol(a) {
  const g = a && WV.agents.get(a.id);
  return g ? rabCoat(g).b : '#ece6dc';
}
// tufts of pulled fur on the straw: more each day of the last 3 before kindling
function nestLining(n) {
  const a = nestDoe(n),
    f = furLevel(a);
  if (!f || WV.zoom < 4 || WV.noFur) return;
  const col = furCol(a),
    m = Math.round(4 + 14 * f);
  for (let i = 0; i < m; i++) {
    const px = n.x + 0.12 + furHash(n.doe * 31 + i) * (n.w - 0.24),
      py = n.y + 0.12 + furHash(n.doe * 57 + i * 3) * (n.d - 0.24),
      o = iso(px, py, 2.32);
    E(o[0], o[1], WV.zoom * (0.07 + 0.05 * furHash(i * 7 + n.doe)), WV.zoom * 0.045, furHash(i) * 3, mix(col, '#f2ede4', 0.35));
  }
}
// after kindling: a blanket of fur over the kits, thinning from day 10 as they start to move about (FAO)
function nestBlanket(n) {
  const a = nestDoe(n);
  if (WV.noFur || !a || a.kindle == null || a.preg != null || furLevel(a) < 1) return;
  if (!S.animals.some(b => b.mother === a.id && b.st === 'kit' && b.age < 18)) return;
  const age = S.day - a.kindle,
    al = age < 10 ? 0.93 : clamp(0.93 - ((age - 10) / 8) * 0.6, 0.33, 0.93),
    col = furCol(a),
    cx = n.x + n.w / 2,
    cy = n.y + n.d / 2,
    o = iso(cx, cy, 2.45);
  WV.ctx.save();
  WV.ctx.globalAlpha = al;
  E(o[0], o[1], WV.zoom * n.w * 0.42, WV.zoom * n.d * 0.26, 0, mix(col, '#f2ede4', 0.35));
  for (let i = 0; i < 9; i++) {
    const q = iso(n.x + 0.15 + furHash(a.id * 13 + i) * (n.w - 0.3), n.y + 0.15 + furHash(a.id * 29 + i * 5) * (n.d - 0.3), 2.5);
    E(q[0], q[1], WV.zoom * 0.11, WV.zoom * 0.07, furHash(i * 3) * 3, mix(col, '#ffffff', 0.5));
  }
  WV.ctx.restore();
}
// ---------- phase 37: cage doors and closed nest boxes (visual only) ----------
// a front door in the cage wire: a galvanized frame, two hinge rings on one side and a latch on the other
function cageDoor(dr, yf) {
  const y = yf + 0.02,
    fr = 'rgba(150,156,162,0.95)',
    { x0, x1, z0, z1 } = dr;
  poly(
    [
      [x0, y, z0],
      [x1, y, z0],
      [x1, y, z1],
      [x0, y, z1]
    ],
    'rgba(215,220,226,0.10)',
    fr,
    lw(0.035)
  );
  if (WV.zoom < 14) return;
  for (const z of [z0 + 0.2, z1 - 0.2]) box(x0 - 0.04, y, z - 0.04, 0.08, 0.03, 0.08, '#6f747a');
  box(x1 - 0.1, y + 0.01, (z0 + z1) / 2 - 0.05, 0.14, 0.04, 0.1, '#8e949a');
  line3([x1 - 0.03, y + 0.05, (z0 + z1) / 2 + 0.05], [x1 + 0.06, y + 0.05, (z0 + z1) / 2 + 0.12], '#5d6268', lw(0.025));
}
// the nest box closed in: Penn State says a nest box is enclosed but for a small opening; FAO x5082 gives
// a hole of about 15 cm for the doe, a ledge below it that keeps the young in, and a trapdoor in the top
// for checking the litter. Drawn after the kits and the fur so it sits over them; with see-through roofs
// the walls and lid are faint and the litter shows through.
function nestShellItems(k, items) {
  const K = WV.K[k.id];
  if (!K || !K.nests || WV.noShell) return;
  for (const n of K.nests) items.push({ k: n.x + n.w + n.y + n.d - 0.02, f: () => nestShell(n) });
}
// Draws a closed rabbit nest box over its litter: walls, lid, the doe's hole, ledge and top trapdoor, faint
// when roofs are see-through.
function nestShell(n) {
  nestBlanket(n);
  const ra = WV.roofs === 2 ? 1 : WV.roofs === 1 ? 0.3 : 0,
    z0 = 2.05,
    z1 = 2.9,
    col = '#c79a62',
    ed = 'rgba(105,70,38,0.85)',
    yf = n.y + n.d,
    xr = n.x + n.w,
    hw = Math.min(0.5, n.w - 0.3),
    hx0 = n.hole === 'l' ? n.x + 0.12 : xr - 0.12 - hw,
    hx1 = hx0 + hw,
    hz0 = z0 + 0.3,
    hz1 = Math.min(z1 - 0.08, hz0 + 0.5);
  if (ra) {
    wallY(n.y, yf, xr, z0, z1, '#b88a55', ra);
    wallX(n.x, hx0, yf, z0, z1, col, ra);
    wallX(hx1, xr, yf, z0, z1, col, ra);
    wallX(hx0, hx1, yf, z0, hz0, col, ra);
    wallX(hx0, hx1, yf, hz1, z1, col, ra);
    poly(
      [
        [n.x, n.y, z1],
        [xr, n.y, z1],
        [xr, yf, z1],
        [n.x, yf, z1]
      ],
      shd(col, 1.05, ra * 0.9)
    );
  }
  const e = lw(0.02),
    tf = n.y + n.d * 0.45;
  for (const s of [
    [[n.x, yf, z1], [xr, yf, z1]],
    [[xr, n.y, z1], [xr, yf, z1]],
    [[n.x, n.y, z1], [xr, n.y, z1]],
    [[n.x, n.y, z1], [n.x, yf, z1]],
    [[xr, yf, z0], [xr, yf, z1]],
    [[n.x, yf, z0], [n.x, yf, z1]]
  ])
    line3(s[0], s[1], ed, e);
  // the access hole and its ledge
  poly(
    [
      [hx0, yf, hz0],
      [hx1, yf, hz0],
      [hx1, yf, hz1],
      [hx0, yf, hz1]
    ],
    null,
    ed,
    e
  );
  line3([hx0, yf + 0.01, hz0], [hx1, yf + 0.01, hz0], shd('#8a5d33', 1, Math.max(0.5, ra)), lw(0.04));
  if (WV.zoom < 14) return;
  // the trapdoor: the front part of the lid, hinged along its back edge, with a small knob
  line3([n.x + 0.05, tf, z1 + 0.005], [xr - 0.05, tf, z1 + 0.005], ed, e);
  for (const t of [0.25, 0.75]) box(n.x + n.w * t - 0.05, tf - 0.02, z1, 0.1, 0.04, 0.02, '#6f747a', Math.max(0.5, ra));
  const kn = iso(n.x + n.w / 2, yf - 0.12, z1 + 0.03);
  E(kn[0], kn[1], WV.zoom * 0.035, WV.zoom * 0.025, 0, 'rgba(90,60,32,0.9)');
}
// ---------- buildings, front half (drawn after the animals in them) ----------
// drawFront(k) by building type: hutch bank, coop, run, brooder, incubator, shade tree, fan, heater, feed
// shed, water point.

// Draws the parts of building k that lie in front of the animals: front walls, wire, doors and the roof.
function drawFront(k) {
  const env = envNow(),
    K = WV.K[k.id] || {},
    x = k.x,
    y = k.y,
    w = k.w,
    d = k.d,
    ra = roofA();
  // ---- rabbit hutch bank ----
  if (k.type === 'hutch') {
    const z0 = 2,
      z1 = 4.1;
    for (const lx of [x + 0.15, x + w / 2, x + w - 0.35]) box(lx, y + d - 0.35, 0, 0.2, 0.2, z0, '#6e4a28');
    const lv = fillLeft(k);
    mesh(true, x, x + w, y + d, z0, z1, true);
    if (!WV.noDoors && WV.zoom >= 6) for (const dr of K.doors || []) cageDoor(dr, y + d);
    for (const h of (K.hops || []).concat(K.ownHops || [])) drawHopper(h[0], y + d, z0, 0.85 * lv, 'rabbit');
    for (const b of (K.drinks || []).concat(K.ownDrinks || [])) drawBottle(b[0], y + d, z0, 0.9 * lv);
    mesh(false, y, y + d, x + w, z0, z1, true);
    for (const c of [
      [x, y + d],
      [x + w, y + d],
      [x + w, y]
    ])
      line3([c[0], c[1], z0], [c[0], c[1], z1], '#8a5d33', lw(0.08));
    line3([x, y + d, z1], [x + w, y + d, z1], '#8a5d33', lw(0.08));
    line3([x + w, y, z1], [x + w, y + d, z1], '#8a5d33', lw(0.08));
    if (ra)
      poly(
        [
          [x - 0.2, y - 0.1, z1 + 0.6],
          [x + w + 0.2, y - 0.1, z1 + 0.6],
          [x + w + 0.2, y + d + 0.4, z1 + 0.1],
          [x - 0.2, y + d + 0.4, z1 + 0.1]
        ],
        shd('#6d7f8c', 1, ra),
        shd('#3c4650', 1, Math.max(0.4, ra))
      );
    if (ra)
      snowCap(
        [
          [x - 0.2, y - 0.1, z1 + 0.6],
          [x + w + 0.2, y - 0.1, z1 + 0.6],
          [x + w + 0.2, y + d + 0.4, z1 + 0.1],
          [x - 0.2, y + d + 0.4, z1 + 0.1]
        ],
        ra
      );
    if (K.lightOn) E(...iso(x + w / 2, y + d / 2, z1 - 0.1), WV.zoom * 0.2, WV.zoom * 0.2, 0, '#fff3b0');
  }
  // ---- chicken coop ----
  if (k.type === 'coop') {
    const H = 6,
      fh = WV.roofs === 2 ? H : 1.0;
    wallX(x, x + w, y + d, 0.35, fh, '#b5763c');
    wallY(y, y + d, x + w, 0.35, fh, '#9a6131');
    for (const o of K.runs || []) {
      // pop door: a framed opening with a sliding shutter, raised by day and dropped at dusk
      // (visual only; the model has no door), and a cleated ramp down to the run
      const dp = o.door,
        onX = Math.abs(dp[0] - (x + w)) < 0.05 || Math.abs(dp[0] - x) < 0.05,
        hw = 0.5,
        zb = 0.4,
        zt = 1.45,
        shut = WV.sun && WV.sun.night,
        q = (a, z) => (onX ? [dp[0] + 0.01, dp[1] + a, z] : [dp[0] + a, dp[1] + 0.01, z]);
      poly([q(-hw - 0.08, zb - 0.05), q(hw + 0.08, zb - 0.05), q(hw + 0.08, zt + 0.08), q(-hw - 0.08, zt + 0.08)], '#6e4a28');
      poly([q(-hw, zb), q(hw, zb), q(hw, zt), q(-hw, zt)], '#2a1a0c');
      const so = shut ? 0 : zt - zb - 0.05;
      poly([q(-hw, zb + so), q(hw, zb + so), q(hw, zt + so), q(-hw, zt + so)], '#a8743f', '#5a3a1a', lw(0.015));
      const ox = o.r.x >= x + w - 1 ? 1 : 0,
        oy = o.r.y >= y + d - 1 ? 1 : 0,
        rl = 1.4,
        pa = (t, side) =>
          ox
            ? [dp[0] + t * rl, dp[1] + side * 0.42, zb * (1 - t)]
            : [dp[0] + side * 0.42, dp[1] + (oy ? 1 : 0) * t * rl, zb * (1 - t)];
      poly([pa(0, -1), pa(0, 1), pa(1, 1), pa(1, -1)], '#9b7748', '#5a3a1a', lw(0.015));
      if (WV.zoom > 10) for (let t = 0.15; t < 0.95; t += 0.2) line3(pa(t, -0.9), pa(t, 0.9), '#5a3a1a', lw(0.03));
    }
    if (ra) {
      const R = H + 2.4;
      poly(
        [
          [x - 0.3, y - 0.3, H - 0.2],
          [x + w + 0.3, y - 0.3, H - 0.2],
          [x + w + 0.3, y + d / 2, R],
          [x - 0.3, y + d / 2, R]
        ],
        shd('#7b3b2b', 0.9, ra),
        shd('#3a1d14', 1, Math.max(0.4, ra))
      );
      snowCap(
        [
          [x - 0.3, y - 0.3, H - 0.2],
          [x + w + 0.3, y - 0.3, H - 0.2],
          [x + w + 0.3, y + d / 2, R],
          [x - 0.3, y + d / 2, R]
        ],
        ra
      );
      poly(
        [
          [x + w, y, H],
          [x + w, y + d, H],
          [x + w, y + d / 2, R]
        ],
        shd('#9a6131', 0.8, ra),
        shd('#5a3a1a', 1, ra)
      );
      poly(
        [
          [x - 0.3, y + d / 2, R],
          [x + w + 0.3, y + d / 2, R],
          [x + w + 0.3, y + d + 0.3, H - 0.2],
          [x - 0.3, y + d + 0.3, H - 0.2]
        ],
        shd('#8f4a35', 1, ra),
        shd('#3a1d14', 1, Math.max(0.4, ra))
      );
      snowCap(
        [
          [x - 0.3, y + d / 2, R],
          [x + w + 0.3, y + d / 2, R],
          [x + w + 0.3, y + d + 0.3, H - 0.2],
          [x - 0.3, y + d + 0.3, H - 0.2]
        ],
        ra
      );
    }
  }
  // ---- chicken run ----
  if (k.type === 'run') {
    const K2 = WV.K[k.id];
    const coops = pens('coop').filter(c => touches(c, k));
    const skipX = coops.some(c => Math.abs(c.x - (x + w)) < 1.01),
      skipY = coops.some(c => Math.abs(c.y - (y + d)) < 1.01);
    if (!skipY) mesh(true, x, x + w, y + d, 0, 4);
    if (!skipX) mesh(false, y, y + d, x + w, 0, 4);
    for (let t = x; t <= x + w + 0.01; t += w / Math.max(1, Math.round(w / 4)))
      box(t - 0.1, y + d - 0.1, 0, 0.2, 0.2, 4.2, '#7a5532');
    for (let t = y; t <= y + d + 0.01; t += d / Math.max(1, Math.round(d / 4)))
      box(x + w - 0.1, t - 0.1, 0, 0.2, 0.2, 4.2, '#7a5532');
    // top rail and kick board along the open sides (visual only)
    if (!skipY) {
      box(x, y + d - 0.06, 3.95, w, 0.12, 0.12, '#8a6038');
      box(x, y + d - 0.04, 0, w, 0.08, 0.35, '#7a5532');
    }
    if (!skipX) {
      box(x + w - 0.06, y, 3.95, 0.12, d, 0.12, '#8a6038');
      box(x + w - 0.04, y, 0, 0.08, d, 0.35, '#7a5532');
    }
    // run waterer: the hens' water, so it drains with the coop's (see fillLeft)
    if (K2 && K2.water) {
      const lvR = coops.length ? fillLeft(coops[0]) : 1;
      tank(K2.water[0] - 0.3, K2.water[1] - 0.3, 0, 0.6, 0.6, 0.7, '#d5e6f0', 0.85 * lvR, '#4f95d0', 0.7, 0.85);
    }
  }
  // ---- brooder ----
  if (k.type === 'brooder') {
    wallX(x, x + w, y + d, 0.3, 1.6, '#d8b98a', 0.35);
    wallY(y, y + d, x + w, 0.3, 1.6, '#c8a878', 0.35);
    if (K.lamp) {
      const o = iso(K.lamp[0], K.lamp[1], 3.0);
      WV.ctx.fillStyle = '#4a4a4a';
      WV.ctx.beginPath();
      WV.ctx.ellipse(o[0], o[1], WV.zoom * 0.55, WV.zoom * 0.25, 0, Math.PI, 0);
      WV.ctx.fill();
      if (K.n)
        E(
          o[0],
          o[1] + WV.zoom * 0.05,
          WV.zoom * 0.18,
          WV.zoom * 0.12,
          0,
          'rgba(255,' + ((120 + 80 * (1 - K.duty)) | 0) + ',60,1)'
        );
    }
    if (+k.indoor && ra)
      poly(
        [
          [x - 0.3, y - 0.3, 6],
          [x + w + 0.3, y - 0.3, 6],
          [x + w + 0.3, y + d + 0.3, 6],
          [x - 0.3, y + d + 0.3, 6]
        ],
        'rgba(160,170,180,' + ra * 0.6 + ')',
        'rgba(80,70,60,0.7)'
      );
  }
  // ---- incubator ----
  if (k.type === 'incubator') {
    for (const [lx, ly] of [
      [x + 0.1, y + 0.1],
      [x + w - 0.25, y + 0.1],
      [x + 0.1, y + d - 0.25],
      [x + w - 0.25, y + d - 0.25]
    ])
      box(lx, ly, 0, 0.15, 0.15, 2.2, '#6b6b6b');
    box(x, y, 2.2, w, d, 1.1, '#ecebe6');
    poly(
      [
        [x + 0.2, y + 0.2, 3.31],
        [x + w - 0.2, y + 0.2, 3.31],
        [x + w - 0.2, y + d - 0.2, 3.31],
        [x + 0.2, y + d - 0.2, 3.31]
      ],
      'rgba(40,60,70,0.55)'
    );
    const eg = S.eggsInc.filter(e => e.inc === k.id),
      n = Math.min(eg.length, 36),
      cols = Math.ceil(Math.sqrt(Math.max(1, n)));
    for (let i = 0; i < n; i++) {
      const ex = x + 0.35 + ((i % cols) * (w - 0.7)) / Math.max(1, cols - 1 || 1),
        ey = y + 0.35 + (Math.floor(i / cols) * (d - 0.7)) / Math.max(1, cols - 1 || 1),
        o = iso(ex, ey, 3.32),
        near = eg[i].hatchDay - S.day < 1.5;
      E(o[0], o[1], WV.zoom * 0.09, WV.zoom * 0.07, 0, near ? '#fff7d6' : '#efe1c6');
    }
    const o = iso(x + w, y + d / 2, 2.9);
    E(o[0], o[1], WV.zoom * 0.08, WV.zoom * 0.08, 0, +k.on ? '#4cff7a' : '#ff4d4d');
  }
  // ---- shade tree ----
  if (k.type === 'tree') {
    const p = ctr(k),
      b = iso(p[0], p[1], 0),
      t = iso(p[0], p[1], 6.5),
      c = WV.ctx,
      u = WV.zoom;
    c.fillStyle = '#5b3d26';
    c.beginPath();
    c.moveTo(b[0] - u * 0.45, b[1]);
    c.lineTo(t[0] - u * 0.22, t[1]);
    c.lineTo(t[0] + u * 0.22, t[1]);
    c.lineTo(b[0] + u * 0.45, b[1]);
    c.fill();
    // leaves by season (illustration): leaf-out from late April, autumn colour from late September,
    // bare from early November; each crown blob turns its own colour (yellow, orange or red)
    const doy = doyOf(S.day),
      green = clamp((doy - 110) / 25, 0, 1),
      turn = clamp((doy - 266) / 22, 0, 1),
      fall = clamp((doy - 286) / 22, 0, 1),
      leaf = green * (1 - fall),
      R = Math.min(k.radius * 0.33, 6),
      al = WV.roofs === 2 ? 0.95 : WV.roofs === 1 ? 0.7 : 0.3,
      wx = WV.wx;
    c.strokeStyle = '#5b3d26';
    c.lineWidth = u * 0.12;
    const tips = [];
    for (let i = 0; i < 7; i++) {
      const a = i * 0.9 + 0.3,
        e = iso(p[0] + Math.cos(a) * R * 0.8, p[1] + Math.sin(a) * R * 0.8, 8 + (i % 3));
      tips.push(e);
      c.beginPath();
      c.moveTo(t[0], t[1]);
      c.lineTo(e[0], e[1]);
      c.stroke();
      if (leaf < 0.3 && WV.zoom > 5) {
        // twigs on the bare crown
        c.lineWidth = u * 0.05;
        for (const s2 of [-0.5, 0.5]) {
          const f = iso(p[0] + Math.cos(a + s2) * R, p[1] + Math.sin(a + s2) * R, 9.5 + (i % 3));
          c.beginPath();
          c.moveTo(e[0], e[1]);
          c.lineTo(f[0], f[1]);
          c.stroke();
        }
        c.lineWidth = u * 0.12;
      }
    }
    const AUT = ['#d9a52b', '#c9692a', '#a8322a', '#e0b13a', '#b8501f'];
    if (leaf > 0.05)
      for (let i = 0; i < 9; i++) {
        const a = i * 0.7,
          rr = R * (0.35 + (0.4 * ((i * 37) % 10)) / 10),
          e = iso(p[0] + Math.cos(a) * rr, p[1] + Math.sin(a) * rr, 9 + (i % 4) * 0.8 - fall * 0.6),
          sz = 0.55 + 0.45 * leaf,
          rx = u * R * 0.45 * sz,
          ry = u * R * 0.4 * sz,
          // phase 31: with see-through roofs, a leaf blob over an animal fades to the see-through
          // roof level so the animal under it stays visible (at night the dark crown hid it)
          ab = crownAlpha(k.id + ':' + i, e[0], e[1], rx, ry, al),
          lc = mix('#3f7f35', AUT[(i * 3 + Math.round(k.x)) % AUT.length], clamp(turn * 1.2 - (i % 3) * 0.1, 0, 1), ab);
        E(e[0], e[1], rx, ry, 0, lc);
      }
    // fallen leaves under the tree in autumn
    if (turn > 0.3 && doy < 330 && !(wx && wx.depth > 1))
      for (let i = 0; i < 26; i++) {
        const a = wxHash(i, 31 + k.x) * 6.28,
          rr = R * 1.3 * Math.sqrt(wxHash(i, 32 + k.y)),
          e = iso(p[0] + Math.cos(a) * rr, p[1] + Math.sin(a) * rr, 0.02);
        if (wxHash(i, 33) > turn) continue;
        E(e[0], e[1], u * 0.22, u * 0.12, 0, mix('#8a5a2a', AUT[i % AUT.length], 0.6 - fall * 0.3));
      }
    // snow lying on bare branches
    if (wx && wx.depth > 0.5 && leaf < 0.3)
      for (const e of tips) E(e[0], e[1] - u * 0.1, u * 0.35, u * 0.14, 0, 'rgba(248,250,255,0.9)');
  }
  // ---- fan ----
  if (k.type === 'fan') {
    const p = ctr(k),
      on = tempAtHour(env.tmin, env.tmax, WV.hour, riseOf(env.day)) > k.trigger;
    box(p[0] - 0.12, p[1] - 0.12, 0, 0.24, 0.24, 2.4, '#777');
    const o = iso(p[0], p[1], 3.1),
      c = WV.ctx,
      u = WV.zoom;
    c.strokeStyle = '#cfd5da';
    c.lineWidth = u * 0.08;
    c.beginPath();
    c.arc(o[0], o[1], u * 0.85, 0, 7);
    c.stroke();
    k._rot = (k._rot || 0) + (on ? 0.5 : 0);
    for (let i = 0; i < 3; i++) {
      const a = k._rot + i * 2.094;
      E(o[0] + Math.cos(a) * u * 0.4, o[1] + Math.sin(a) * u * 0.4, u * 0.38, u * 0.14, a, '#9fb3c2');
    }
    E(o[0], o[1], u * 0.12, u * 0.12, 0, '#555');
  }
  // ---- heater ----
  if (k.type === 'heater') {
    const p = ctr(k);
    box(p[0] - 0.45, p[1] - 0.25, 0, 0.9, 0.5, 1.2, '#4b4f55');
    const tNow = tempAtHour(env.tmin, env.tmax, WV.hour, riseOf(env.day)),
      on = tNow < k.setpoint,
      duty = on ? clamp((k.setpoint - tNow) / 30, 0, 1) : 0,
      o = iso(p[0], p[1] + 0.25, 0.65);
    E(
      o[0],
      o[1],
      WV.zoom * 0.32,
      WV.zoom * 0.42,
      0,
      on ? 'rgba(255,' + ((160 - 80 * duty) | 0) + ',40,' + (0.4 + 0.6 * duty) + ')' : '#2b2d30'
    );
  }
  // ---- feed shed ----
  if (k.type === 'feed') {
    const H = 7;
    box(x, y, 0, w, d, H, '#8f6239');
    const dr = iso(x + w / 2, y + d, 1.6);
    WV.ctx.fillStyle = '#3a2615';
    WV.ctx.fillRect(dr[0] - WV.zoom * 0.9, dr[1] - WV.zoom * 1.5, WV.zoom * 1.8, WV.zoom * 3.1);
    poly(
      [
        [x - 0.3, y - 0.3, H],
        [x + w + 0.3, y - 0.3, H],
        [x + w + 0.3, y + d / 2, H + 2],
        [x - 0.3, y + d / 2, H + 2]
      ],
      '#5d6b73',
      '#2f383d'
    );
    poly(
      [
        [x + w, y, H],
        [x + w, y + d, H],
        [x + w, y + d / 2, H + 2]
      ],
      shd('#8f6239', 0.7),
      '#4a3220'
    );
    poly(
      [
        [x - 0.3, y + d / 2, H + 2],
        [x + w + 0.3, y + d / 2, H + 2],
        [x + w + 0.3, y + d + 0.3, H],
        [x - 0.3, y + d + 0.3, H]
      ],
      '#6b7a83',
      '#2f383d'
    );
    const wk =
        (((S.today.d && S.today.d.rFeed) || 0) +
          ((S.today.d && S.today.d.cFeed) || 0) +
          ((S.today.d && S.today.d.sFeed) || 0)) *
        7,
      bags = Math.min(12, Math.ceil(wk / 50));
    for (let i = 0; i < bags; i++)
      box(
        x + w + 0.4 + (i % 3) * 0.75,
        y + 0.4 + Math.floor(i / 3) * 1.1,
        i >= 6 ? 0.5 : 0,
        0.7,
        1.0,
        0.5,
        '#e6dbbf'
      );
  }
  // ---- water point ----
  if (k.type === 'water') {
    const p = ctr(k),
      b = iso(p[0], p[1], 0),
      t = iso(p[0], p[1], 3),
      c = WV.ctx,
      u = WV.zoom;
    c.fillStyle = '#3d7fb5';
    c.fillRect(b[0] - u * 0.7, t[1], u * 1.4, b[1] - t[1]);
    E(b[0], b[1], u * 0.7, u * 0.35, 0, '#2f6896');
    E(t[0], t[1], u * 0.7, u * 0.35, 0, '#6fb2e6');
    box(p[0] + 0.8, p[1] - 0.4, 0, 1.2, 0.8, 0.5, '#8a9aa6');
  }
}
// ---------- animals ----------
// Shapes and colours are visual only (world/looks.js). Size comes from each animal's modelled weight;
// what each animal is doing (g.act) comes from the model's decisions in agents.js.

// Draws a rabbit (kit, grower or adult) at screen point s with u pixels per foot: size from its weight, coat
// from looks.js (pink and bare under 8 days), and its pose: hop, rest, flop, stretch, groom, pull fur,
// nest, huddle, curled up in the cold or dead.
function drawRabbit(g, s, u) {
  const a = g.ref,
    c = WV.ctx,
    L = 1.35 * Math.cbrt(Math.max(0.12, a.wt) / P.rb_adult_wt) * u,
    pink = a.st === 'kit' && a.age < 8,
    coat = rabCoat(g),
    col = pink ? '#e7b3ac' : coat.b,
    dk = pink ? '#d9a199' : coat.d,
    pts = pink ? null : a.st === 'kit' && a.age < 21 ? null : coat.p;
  let hop = 0,
    st = 1,
    fl = 1;
  // hop height comes from the gravity arc in physics.js (feet, drawn at the world's scale)
  hop = (g.hz || 0) * u;
  if (g.moving || g.jump) st = 1 + 0.12 * Math.abs(Math.cos(g.ph));
  if (g.act === 'rest' || g.act === 'huddle' || g.act === 'nest' || g.act === 'pullfur') fl = 0.85;
  // stretch: long and low, front paws pushed forward (comfort behaviour, visual only)
  const stretching = g.act === 'stretch' && !g.moving;
  if (stretching) {
    st = 1.32;
    fl = 0.72;
  }
  const groomPart = g.act === 'groom' && g.task ? g.task.part || 0 : -1;
  // phase 30: curled up in the cold. FAO (x5082, thermoregulation): below 10 C (50 F) rabbits curl up
  // to cut the area losing heat; this applies to young rabbits from about 1 month, and newborns cannot
  // curl up (they huddle with the litter instead, kitPile in agents.js). Resting rabbits at the pen's
  // temperature for the hour shown draw short, round and tucked, head in. The ears laid flat are an
  // illustration. Visual only.
  const vv = WV.vis.get(a.id),
    curl =
      !WV.noCurl && !g.moving && (g.act === 'rest' || g.act === 'huddle') && !(a.st === 'kit' && a.age < 28) && vv && vv.m && hourTemp(vv.m) < 50;
  if (curl) {
    st = 0.84;
    fl = 0.98;
  }
  if (g.act === 'flop') {
    fl = 0.62;
    st = 1.3;
  }
  if (g.act === 'dead') {
    fl = 0.5;
    st = 1.2;
  }
  const breathe = g.act === 'rest' || g.act === 'nest' || g.act === 'pullfur' || g.act === 'huddle' ? 1 + Math.sin(WV.t * 2.2 + g.col * 9) * 0.025 : 1;
  // shadow shrinks as the rabbit leaves the ground mid-hop
  const sh = 1 - Math.min(0.4, hop / Math.max(1, L));
  E(s[0], s[1], 0.55 * L * sh, 0.2 * L * sh, 0, 'rgba(0,0,0,0.22)');
  c.save();
  c.translate(s[0], s[1] - hop);
  c.scale(g.face, 1);
  const preg = a.preg != null ? clamp(a.preg / Math.max(1, a.gestLen), 0, 1) : 0,
    bw = 0.48 * L * st,
    bh = 0.3 * L * fl * (1 + 0.2 * preg) * breathe;
  // ---- body ----
  // hind leg / haunch, back body, front body
  if (!pink && L > 6) {
    const kick = g.moving ? Math.cos(g.ph) * 0.12 * L : 0;
    E(-0.28 * L * st - kick * 0.4, -0.1 * L, 0.2 * L, 0.08 * L, 0.2, pts || dk);
  }
  E(-0.12 * L, -bh * 0.95, bw * 0.62, bh * 0.95, 0, dk);
  E(0.05 * L, -bh, bw, bh * 0.85, 0, col);
  if (!pink && L > 6) {
    // soft top highlight
    E(0.02 * L, -bh * 1.45, bw * 0.55, bh * 0.25, 0, shd(col, 1.08, 0.55));
    // front paws
    const step = g.moving ? Math.sin(g.ph) * 0.06 * L : 0;
    if (groomPart !== 0 && !curl) E(0.33 * L * st + step + (stretching ? 0.08 * L : 0), -0.03 * L, 0.07 * L, 0.04 * L, 0, pts || shd(col, 0.9));
  }
  E(-0.45 * L * st, -bh * 1.05, 0.09 * L, 0.09 * L, 0, pink ? dk : coat.tail);
  // ---- head (grooming, ears, eye, nose) ----
  // grooming: face-washing with both front paws (part 0) or head turned back to lick a flank (part 1);
  // pulling fur: head down at the belly. Visual only.
  let hx = 0.4 * L * st,
    hy = -bh * 1.45 - (groomPart === 0 ? Math.sin(WV.t * 8) * 0.04 * L : 0);
  if (groomPart === 1) {
    hx = -0.02 * L;
    hy = -bh * 1.7 + Math.sin(WV.t * 7) * 0.02 * L;
  } else if (g.act === 'pullfur') {
    hx = 0.28 * L;
    hy = -bh * 0.75 + Math.abs(Math.sin(WV.t * 3)) * 0.04 * L;
  } else if (stretching) {
    hx = 0.52 * L * st * 0.8;
    hy = -bh * 1.05;
  } else if (curl) {
    // head pulled in against the body
    hx = 0.3 * L * st;
    hy = -bh * 1.3;
  }
  if (!pink || a.age > 4) {
    const ear = curl ? 1.4 : g.act === 'rest' || g.act === 'flop' || g.act === 'dead' ? 1.15 : 0.35,
      twitch = g.act === 'idle' || g.act === 'eat' ? Math.sin(WV.t * 6 + g.col * 7) * 0.08 : 0;
    for (const o of [-0.05, 0.06]) {
      const ex = hx - 0.06 * L + o * L,
        ey = hy - 0.22 * L,
        rot = -ear + o * 2 + twitch;
      E(ex, ey, 0.06 * L, 0.22 * L, rot, pts || shd(col, 0.95));
      if (!pts && L > 8) E(ex, ey, 0.03 * L, 0.16 * L, rot, 'rgba(230,160,160,0.55)');
    }
  }
  E(hx, hy, 0.2 * L, 0.16 * L, 0, col);
  if (pts) E(hx + 0.15 * L, hy + 0.02 * L, 0.07 * L, 0.06 * L, 0, pts);
  if (groomPart === 0 && L > 5) {
    // both front paws rubbing over the face
    const rub = Math.sin(WV.t * 8) * 0.05 * L;
    E(hx + 0.1 * L, hy + 0.1 * L + rub, 0.06 * L, 0.08 * L, 0.3, pts || shd(col, 0.92));
    E(hx + 0.05 * L, hy + 0.12 * L - rub, 0.06 * L, 0.08 * L, 0.3, pts || shd(col, 0.88));
  }
  if (g.act === 'pullfur' && L > 5) E(hx + 0.2 * L, hy + 0.05 * L, 0.09 * L, 0.05 * L, 0.4, mix(col, '#f2ede4', 0.4));
  if (g.act !== 'dead') {
    const blink = g.act === 'rest' || g.act === 'nest' || (Math.sin(WV.t * 0.9 + g.col * 40) > 0.985);
    if (blink) {
      c.strokeStyle = '#2a2020';
      c.lineWidth = Math.max(0.6, 0.02 * L);
      c.beginPath();
      c.moveTo(hx + 0.05 * L, hy - 0.03 * L);
      c.lineTo(hx + 0.11 * L, hy - 0.03 * L);
      c.stroke();
    } else {
      E(hx + 0.08 * L, hy - 0.03 * L, 0.035 * L, 0.035 * L, 0, pink ? '#a06060' : coat.e);
      if (L > 10) E(hx + 0.09 * L, hy - 0.045 * L, 0.01 * L, 0.01 * L, 0, 'rgba(255,255,255,0.8)');
    }
  }
  const twitchN = g.act === 'eat' || g.moving ? Math.sin(WV.t * 14) * 0.006 * L : 0;
  E(hx + 0.19 * L, hy + 0.03 * L + twitchN, 0.03 * L, 0.025 * L, 0, pts ? '#3a2d2a' : '#d88');
  if (g.act === 'eat') {
    E(hx + 0.24 * L, hy + 0.05 * L, 0.05 * L, 0.03 * L, 0, '#7b5c2e');
  }
  c.restore();
}
// Draws a grown chicken (hen, rooster, pullet) at screen point s with u pixels per foot: body, tail, comb,
// legs and its current pose (peck, preen, dust bath, roost, flap ...).
function drawBird(g, s, u) {
  const a = g.ref,
    c = WV.ctx,
    male = a.sex === 'M',
    grown = clamp(a.age / P.ck_lay_age, 0, 1),
    H = (male ? 1.4 : 1.2) * birdScale(a) * u,
    v = WV.vis.get(a.id) || {},
    cold = coldNow(v),
    pl = birdCoat(g, male);
  const body = pl.b,
    still = !g.moving,
    dusting = g.act === 'dust' && still,
    sit = g.act === 'roost' || g.act === 'lay' || g.act === 'rest' || g.act === 'dead' || dusting,
    peck0 = g.act === 'peck' || g.act === 'eat',
    // pecking birds alternate between raking the litter and pecking at it (visual only)
    scratch = g.act === 'peck' && g.moving === false && Math.sin(WV.t * 0.7 + g.col * 11) > 0.35,
    peck = peck0 && !scratch,
    bob = g.moving ? Math.sin(g.ph * 2) * 0.04 * H : 0;
  // dust bath: a hollow scraped in the soil or litter under her (Merck); colour from the pen she is in
  const dz = dusting ? compById(g.zone) : null,
    dcol = dz && dz.type === 'run' ? '#8f7650' : '#cdb57a';
  if (dusting) E(s[0], s[1] - 0.02 * H, 0.5 * H, 0.17 * H, 0, shd(dcol, 0.8));
  E(s[0], s[1], 0.4 * H, 0.14 * H, 0, 'rgba(0,0,0,0.22)');
  c.save();
  c.translate(s[0], s[1]);
  c.scale(g.face, 1);
  if (g.act === 'dead') c.rotate(1.3);
  // she rolls onto her side and back while rubbing the dust in
  if (dusting) c.rotate(0.35 * Math.sin(WV.t * 1.6 + g.col * 5));
  // shaking the rain off when she gets in (phase 25): a fast wobble with the feathers fluffed out
  const shaking = g.act === 'shake' && still;
  if (shaking) c.rotate(0.14 * Math.sin(WV.t * 38 + g.col * 5));
  const by = sit ? -0.3 * H : -0.55 * H,
    fl = cold || g.act === 'roost' || dusting ? 1.15 : shaking ? 1.12 : 1;
  if (shaking && H > 6)
    for (let i = 0; i < 4; i++) {
      const an = WV.t * 9 + i * 1.57 + g.col * 6,
        rr = (0.42 + 0.12 * Math.sin(WV.t * 13 + i)) * H;
      E(Math.cos(an) * rr, by + Math.sin(an) * rr * 0.55, 0.035 * H, 0.035 * H, 0, 'rgba(196,220,242,0.85)');
    }
  if (!sit) {
    c.strokeStyle = '#e0a91c';
    c.lineWidth = Math.max(1, H * 0.05);
    let sw = g.moving ? Math.sin(g.ph * 2) * 0.1 * H : 0;
    // scratching: one foot rakes back while the other stands
    const rake = scratch ? Math.max(0, Math.sin(WV.t * 7 + g.col * 5)) * 0.18 * H : 0;
    c.beginPath();
    c.moveTo(-0.05 * H, by);
    c.lineTo(-0.05 * H + sw, 0);
    c.moveTo(0.08 * H, by);
    c.lineTo(0.08 * H - sw - rake, -rake * 0.3);
    c.stroke();
    if (H > 14) {
      // toes
      c.lineWidth = Math.max(0.6, H * 0.025);
      c.beginPath();
      c.moveTo(-0.05 * H + sw, 0);
      c.lineTo(0.05 * H + sw, 0.01 * H);
      c.moveTo(0.08 * H - sw - rake, -rake * 0.3);
      c.lineTo(0.18 * H - sw - rake, -rake * 0.3 + 0.01 * H);
      c.stroke();
    }
  }
  // ---- body: tail, then wing ----
  // tail
  c.fillStyle = male ? pl.t : pl.t;
  c.beginPath();
  c.moveTo(-0.25 * H, by - 0.05 * H);
  c.quadraticCurveTo(-0.55 * H, by - 0.5 * H, -0.42 * H, by - 0.62 * H);
  c.quadraticCurveTo(-0.3 * H, by - 0.3 * H, -0.1 * H, by - 0.15 * H);
  c.fill();
  if (male) {
    c.strokeStyle = shd(pl.t, 0.75);
    c.lineWidth = H * 0.06;
    c.beginPath();
    c.moveTo(-0.3 * H, by - 0.1 * H);
    c.quadraticCurveTo(-0.7 * H, by - 0.6 * H, -0.55 * H, by + 0.05 * H);
    c.stroke();
  }
  E(0, by, 0.36 * H * fl, 0.27 * H * fl, -0.15, body);
  if (pl.bar) barred(0, by, 0.36 * H * fl, 0.27 * H * fl, -0.15, H);
  // wing: lifts and spreads when panting (heat), tucked otherwise
  const wingUp = g.act === 'pant' ? 0.1 * H : 0,
    flapping = g.act === 'flap' && still,
    stretchW = g.act === 'stretch' && still;
  if (flapping) {
    // wing flapping: both wings raised and beating (comfort behaviour)
    const fa = Math.sin(WV.t * 22 + g.col * 3) * 0.5;
    E(-0.08 * H, by - 0.22 * H, 0.26 * H, 0.09 * H, -1.1 + fa, shd(pl.w, 0.9));
    E(0.0 * H, by - 0.2 * H, 0.26 * H, 0.09 * H, -0.9 + fa, pl.w);
  } else if (stretchW) {
    // wing-and-leg stretch: one wing fanned down and back with the leg on that side
    c.strokeStyle = '#e0a91c';
    c.lineWidth = Math.max(1, H * 0.05);
    c.beginPath();
    c.moveTo(-0.08 * H, by + 0.1 * H);
    c.lineTo(-0.35 * H, by + 0.35 * H);
    c.stroke();
    E(-0.2 * H, by + 0.12 * H, 0.32 * H, 0.1 * H, 0.55, pl.w);
    if (pl.bar) barred(-0.2 * H, by + 0.12 * H, 0.32 * H, 0.1 * H, 0.55, H);
  } else {
    E(-0.05 * H, by + 0.02 * H - wingUp * 0.3, 0.2 * H, 0.12 * H, -0.2 - (wingUp ? 0.25 : 0), pl.w);
    if (pl.bar) barred(-0.05 * H, by + 0.02 * H - wingUp * 0.3, 0.2 * H, 0.12 * H, -0.2, H);
  }
  if (g.act === 'pant') {
    E(0.05 * H, by + 0.05 * H, 0.26 * H, 0.08 * H, 0.3, shd(body, 0.7));
  }
  // ---- head: pecking or raised, comb, beak and crowing ----
  let hx = peck ? 0.42 * H : 0.28 * H,
    hy = peck ? by + 0.15 * H + Math.abs(Math.sin(WV.t * 9 + g.ph)) * 0.12 * H : by - 0.38 * H + bob;
  const crowing = g.act === 'crow' && still,
    // crow: two short calls a cycle, head thrown up and forward
    crowUp = crowing ? Math.max(0, Math.sin(WV.t * 3.2)) : 0;
  if (g.act === 'preen' && still) {
    // preening: head turned back to run the beak through the wing feathers
    hx = -0.02 * H + Math.sin(WV.t * 5 + g.col) * 0.03 * H;
    hy = by - 0.12 * H;
  } else if (crowing) {
    hx = 0.34 * H + crowUp * 0.06 * H;
    hy = by - 0.5 * H - crowUp * 0.14 * H;
  } else if (dusting) {
    hx = 0.32 * H;
    hy = by - 0.02 * H;
  }
  if (!peck) {
    c.fillStyle = pl.n;
    c.beginPath();
    c.moveTo(0.12 * H, by - 0.15 * H);
    c.lineTo(hx - 0.08 * H, hy);
    c.lineTo(hx + 0.06 * H, hy + 0.05 * H);
    c.lineTo(0.28 * H, by - 0.05 * H);
    c.fill();
  }
  E(hx, hy, 0.13 * H, 0.12 * H, 0, pl.n);
  const comb = (male ? 0.12 : 0.06) * (0.4 + 0.6 * grown) * H;
  if (H > 10 && grown > 0.6) {
    // single comb with points
    c.fillStyle = '#d62828';
    c.beginPath();
    const cx0 = hx - 0.1 * H,
      cy0 = hy - 0.08 * H,
      n = 5,
      wd = 0.2 * H;
    c.moveTo(cx0, cy0);
    for (let i = 0; i <= n; i++) {
      const xx = cx0 + (wd * i) / n;
      c.lineTo(xx - wd / (2 * n), cy0 - comb * (i % 2 ? 0.6 : 1.5));
      c.lineTo(xx, cy0 - comb * 0.4);
    }
    c.lineTo(cx0 + wd, cy0);
    c.fill();
  } else E(hx - 0.01 * H, hy - 0.12 * H, comb * 0.9, comb * 0.6, 0, '#d62828');
  E(hx + 0.07 * H, hy + 0.1 * H, 0.035 * H, (male ? 0.07 : 0.04) * H, 0, '#d62828');
  c.fillStyle = '#f0b429';
  c.beginPath();
  c.moveTo(hx + 0.1 * H, hy - 0.02 * H);
  c.lineTo(hx + 0.23 * H, hy + (g.act === 'pant' ? 0.04 : 0.02) * H - crowUp * 0.05 * H);
  c.lineTo(hx + 0.1 * H, hy + 0.04 * H);
  c.fill();
  if (crowing && crowUp > 0.2) {
    // open lower beak and sound rings: the dawn crow, drawn only (the sim has no sound)
    c.fillStyle = '#d99a1a';
    c.beginPath();
    c.moveTo(hx + 0.1 * H, hy + 0.04 * H);
    c.lineTo(hx + 0.21 * H, hy + 0.1 * H);
    c.lineTo(hx + 0.1 * H, hy + 0.07 * H);
    c.fill();
    if (H > 6) {
      c.strokeStyle = 'rgba(255,255,255,' + (0.35 + 0.4 * crowUp).toFixed(2) + ')';
      c.lineWidth = Math.max(0.8, H * 0.025);
      for (let r = 1; r <= 3; r++) {
        c.beginPath();
        c.arc(hx + 0.2 * H, hy + 0.03 * H, r * 0.13 * H * (0.7 + 0.3 * crowUp), -0.7, 0.7);
        c.stroke();
      }
    }
  }
  if (g.act === 'roost' && WV.sun && WV.sun.night) {
    c.strokeStyle = '#222';
    c.lineWidth = Math.max(0.6, H * 0.02);
    c.beginPath();
    c.moveTo(hx + 0.015 * H, hy - 0.03 * H);
    c.lineTo(hx + 0.065 * H, hy - 0.03 * H);
    c.stroke();
  } else E(hx + 0.04 * H, hy - 0.03 * H, 0.022 * H, 0.022 * H, 0, '#111');
  c.restore();
  if (dusting && H > 4) {
    // dust thrown up and shaken out of the feathers (fixed phases from the bird's colour seed, not vr())
    for (let i = 0; i < 6; i++) {
      const ph = (WV.t * 0.9 + i / 6 + g.col * 3) % 1,
        an = (i / 6) * Math.PI * 2 + g.col * 7,
        rr = (0.25 + 0.45 * ph) * H;
      E(s[0] + Math.cos(an) * rr, s[1] - 0.2 * H - ph * 0.35 * H + Math.sin(an) * rr * 0.35, (0.06 + 0.1 * ph) * H, (0.05 + 0.07 * ph) * H, 0, shd(dcol, 1.05, 0.55 * (1 - ph)));
    }
  }
}
// Draws a chick at screen point s with u pixels per foot: round downy body, sized from its weight, hopping
// when it walks.
function drawChick(g, s, u) {
  const c = WV.ctx,
    a = g.ref,
    // chicks are drawn rounder than adults, so their outline is about 1.3x a hen of the same mass
    H = clamp(1.2 * birdScale(a) * 1.3, 0.3, 1.05) * u,
    hop = g.moving ? Math.abs(Math.sin(g.ph * 1.5)) * 0.1 * H : 0,
    dn = chickDown(),
    pl = birdCoat(g, a.sex === 'M'),
    // down gives way to feathers from about week 3 to the end of brooding
    fe = clamp((a.age - 21) / Math.max(7, P.ck_brood_days - 21), 0, 1),
    bcol = fe > 0 ? mix(dn.b, pl.b, fe) : dn.b,
    belly = fe > 0 ? mix(dn.belly, pl.b, fe) : dn.belly;
  // phase 26: a dust bath in the brooder's wood-shavings litter (Merck: chicks from 1 to 2 weeks old):
  // a scraped hollow under the chick, the chick low and rolling, litter flicked up (visual only)
  const dusting = g.act === 'dust' && !g.moving,
    LIT = '#cdb57a';
  if (dusting) E(s[0], s[1] - 0.02 * H, 0.46 * H, 0.16 * H, 0, shd(LIT, 0.78));
  E(s[0], s[1], 0.32 * H, 0.12 * H, 0, 'rgba(0,0,0,0.2)');
  c.save();
  c.translate(s[0], s[1] - hop + (dusting ? 0.1 * H : 0));
  c.scale(g.face, 1);
  if (g.act === 'dead') c.rotate(1.3);
  if (dusting) c.rotate(0.4 * Math.sin(WV.t * 1.9 + g.col * 5));
  const huddle = g.act === 'huddle' || g.act === 'rest' || dusting;
  if (dusting) {
    // one wing held out and down, rubbing litter into the down
    const wf = 0.5 + 0.5 * Math.sin(WV.t * 6 + g.col * 3);
    E(-0.16 * H, -0.26 * H, (0.2 + 0.05 * wf) * H, 0.09 * H, 0.5, mix(bcol, pl.w || bcol, 0.35));
  }
  E(0, -0.35 * H, 0.33 * H * (huddle ? 1.08 : 1), 0.28 * H * (huddle ? 0.9 : 1), 0, bcol);
  E(0.05 * H, -0.25 * H, 0.2 * H, 0.13 * H, 0, belly);
  if (fe > 0.3) {
    // wing feathers coming in
    E(-0.06 * H, -0.36 * H, 0.17 * H, 0.1 * H, -0.2, mix(bcol, pl.w, 0.6));
    if (pl.bar && H > 8) barred(-0.06 * H, -0.36 * H, 0.17 * H, 0.1 * H, -0.2, H);
  }
  const pk = g.act === 'peck' || g.act === 'eat',
    hx = pk ? 0.3 * H : dusting ? 0.3 * H : 0.22 * H,
    hy = pk ? -0.2 * H + Math.abs(Math.sin(WV.t * 10 + g.ph)) * 0.08 * H : dusting ? -0.4 * H : -0.72 * H;
  E(hx, hy, 0.2 * H, 0.19 * H, 0, bcol);
  if (dn.spot && fe < 0.7) E(hx - 0.03 * H, hy - 0.12 * H, 0.07 * H, 0.05 * H, 0, dn.spot);
  c.fillStyle = '#e8892b';
  c.beginPath();
  c.moveTo(hx + 0.17 * H, hy - 0.03 * H);
  c.lineTo(hx + 0.32 * H, hy + 0.01 * H);
  c.lineTo(hx + 0.17 * H, hy + 0.05 * H);
  c.fill();
  E(hx + 0.06 * H, hy - 0.05 * H, 0.035 * H, 0.035 * H, 0, '#111');
  c.restore();
  if (dusting && H > 3) {
    // litter flicked up and shaken out (fixed phases from the chick's colour seed, not vr())
    for (let i = 0; i < 4; i++) {
      const ph = (WV.t * 1.1 + i / 4 + g.col * 3) % 1,
        an = (i / 4) * Math.PI * 2 + g.col * 7,
        rr = (0.22 + 0.4 * ph) * H;
      E(s[0] + Math.cos(an) * rr, s[1] - 0.15 * H - ph * 0.3 * H + Math.sin(an) * rr * 0.35, (0.05 + 0.08 * ph) * H, (0.04 + 0.06 * ph) * H, 0, shd(LIT, 1.05, 0.55 * (1 - ph)));
    }
  }
}
// is any shown animal's body inside this screen ellipse? (phase 31, tree crown fade; uses the
// screen point each animal had when last drawn)
function crownOver(x, y, rx, ry) {
  for (const g of WV.agents.values()) {
    if (g.hidden || g.off || g.sx == null) continue;
    const m = sizeFt(g.ref) * WV.zoom * 0.6, // the whole body, not just its centre
      dx = (g.sx - x) / (rx + m),
      dy = (g.sy - WV.zoom * 0.3 - y) / (ry + m);
    if (dx * dx + dy * dy < 1) return true;
  }
  return false;
}
// a crown blob's opacity, eased over about a third of a second so it does not pop as animals
// walk in and out under it (state kept in WV, never in the farm)
function crownAlpha(key, x, y, rx, ry, al) {
  const tgt = WV.roofs === 1 && crownOver(x, y, rx, ry) ? Math.min(al, 0.22) : al,
    M = WV.crownFade || (WV.crownFade = new Map());
  let o = M.get(key);
  if (!o) M.set(key, (o = { a: tgt, t: WV.t }));
  const dt = Math.max(0, WV.t - o.t);
  o.t = WV.t;
  o.a += (tgt - o.a) * Math.min(1, dt * 3);
  return o.a;
}
// Draws one animal: works out its screen point, skips it when off screen, then draws its jump shadow or lens
// ring and calls the rabbit, bird or chick drawing.
function drawAgent(g) {
  const s = iso(g.x, g.y, g.z),
    u = WV.zoom,
    c = WV.ctx;
  g.sx = s[0];
  g.sy = s[1];
  if (s[0] < -60 || s[0] > WV.w + 60 || s[1] < -60 || s[1] > WV.h + 60) return;
  c.globalAlpha = g.alpha;
  if (g.jump) {
    // mid-jump (hutch floor, perch, nest box): a shadow stays on the surface below
    const fz = iso(g.x, g.y, Math.min(g.jump.z0, g.jump.z1));
    E(fz[0], fz[1], u * 0.3, u * 0.13, 0, 'rgba(0,0,0,0.18)');
  }
  if (WV.lens === 'health') {
    E(
      s[0],
      s[1],
      u * 0.5,
      u * 0.22,
      0,
      mix('#e0402f', '#3fbf5a', clamp((g.ref.health - 50) / 50, 0, 1), 0.85)
    );
  }
  if (!g.home && !g.leaving) {
    c.strokeStyle = '#ff4d3a';
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(s[0], s[1], u * 0.6, u * 0.28, 0, 0, 7);
    c.stroke();
  }
  if (WV.lens === 'space' && WV.t - (g.bump || -9) < 0.4) {
    c.strokeStyle = 'rgba(255,90,60,0.9)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.ellipse(s[0], s[1], u * 0.45, u * 0.2, 0, 0, 7);
    c.stroke();
  }
  if (u < 4.5) {
    E(s[0], s[1] - 2, 2.2, 2.2, 0, g.ref.sp === 'rabbit' ? rabCoat(g).b : g.ref.st === 'chick' ? chickDown().b : birdCoat(g, g.ref.sex === 'M').b);
    c.globalAlpha = 1;
    return;
  }
  const k = kindOf(g.ref);
  if (k === 'rab' || k === 'kit') drawRabbit(g, s, u);
  else if (k === 'chick') drawChick(g, s, u);
  else drawBird(g, s, u);
  const v = WV.vis.get(g.id);
  if (u > 16 && v && g.ref.stress && g.ref.health < 85) {
    const t = iso(g.x, g.y, g.z + 1.6);
    c.font = '600 ' + Math.round(u * 0.45) + 'px system-ui';
    c.fillStyle = g.ref.stress === 'heat' ? '#ff7a45' : g.ref.stress === 'cold' ? '#7cc4ff' : '#ffd84d';
    c.textAlign = 'center';
    c.fillText(g.ref.stress === 'heat' ? '≈' : g.ref.stress === 'cold' ? '*' : '!', t[0], t[1]);
  }
  const isSel = WV.selA === g.id,
    hov = WV.hover && WV.hover.g === g;
  if (isSel || hov) {
    c.strokeStyle = isSel ? '#ffd84d' : 'rgba(255,255,255,0.85)';
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(s[0], s[1], u * 0.55, u * 0.25, 0, 0, 7);
    c.stroke();
  }
  c.globalAlpha = 1;
}
// Draws the farmer walking the chore route, with a swinging stride while moving.
function drawFarmer() {
  const F = WV.farmer;
  if (!F) return;
  const s = iso(F.x, F.y, 0),
    u = WV.zoom,
    c = WV.ctx,
    sw = F.moving ? Math.sin(F.ph) * 0.25 * u : 0;
  E(s[0], s[1], u * 0.4, u * 0.16, 0, 'rgba(0,0,0,0.25)');
  c.strokeStyle = '#2d3e5c';
  c.lineWidth = u * 0.16;
  c.beginPath();
  c.moveTo(s[0] - u * 0.1, s[1] - u * 1.2);
  c.lineTo(s[0] - u * 0.1 + sw, s[1]);
  c.moveTo(s[0] + u * 0.1, s[1] - u * 1.2);
  c.lineTo(s[0] + u * 0.1 - sw, s[1]);
  c.stroke();
  c.fillStyle = '#3e5f8a';
  c.fillRect(s[0] - u * 0.28, s[1] - u * 2.3, u * 0.56, u * 1.15);
  c.fillStyle = '#c84b31';
  c.fillRect(s[0] - u * 0.3, s[1] - u * 2.6, u * 0.6, u * 0.45);
  E(s[0], s[1] - u * 2.9, u * 0.22, u * 0.24, 0, '#e0b48c');
  E(s[0], s[1] - u * 3.08, u * 0.48, u * 0.1, 0, '#d9b45a');
  E(s[0], s[1] - u * 3.2, u * 0.24, u * 0.16, 0, '#d9b45a');
  if (F.carry) {
    const bx = s[0] + F.face * u * 0.45;
    c.fillStyle = F.carry === 'water' ? '#5aa8e6' : '#b08a4a';
    c.fillRect(bx - u * 0.18, s[1] - u * 1.5, u * 0.36, u * 0.4);
  }
}
// Draws a soft round glow (radial gradient) of radius r ft at a farm point; col holds an "A" where the opacity
// goes.
function glow(x, y, z, r, col, a) {
  const c = WV.ctx,
    o = iso(x, y, z),
    R = r * WV.zoom,
    g = c.createRadialGradient(o[0], o[1], 0, o[0], o[1], R);
  g.addColorStop(0, col.replace('A', a));
  g.addColorStop(1, col.replace('A', 0));
  c.fillStyle = g;
  c.fillRect(o[0] - R, o[1] - R, 2 * R, 2 * R);
}
// Draws one whole frame: sky and light for the hour, ground, buildings and animals sorted back to front,
// weather, effects, labels and the HUD.
function drawWorld() {
  const c = WV.ctx;
  if (!c || !S || !S.today) return;
  screenT();
  const env = envNow(),
    sun = (WV.sun = sunInfo()),
    wx = (WV.wx = wxNow());
  // ==== 1. Ground: grass (browner when dry), snow cover, then drawGround (pens, lens tints, plot line) ====
  c.fillStyle = mix('#7d7a52', '#4b7f3a', wx.grass);
  c.fillRect(0, 0, WV.w, WV.h);
  if (wx.depth > 2) {
    c.fillStyle = 'rgba(240,245,252,' + clamp((wx.depth - 2) / 3, 0, 1) * 0.85 + ')';
    c.fillRect(0, 0, WV.w, WV.h);
  }
  drawGround();
  // ==== 2. Which pen lights are on this hour ====
  // lights per pen: on before dawn for (target - natural) hours, the hours the power formula charges
  for (const k of S.comps) {
    const K = WV.K[k.id];
    if (!K) continue;
    K.lightOn = false;
    if ((k.type === 'coop' || k.type === 'hutch') && +k.lights && k.lightHours > sun.day) {
      const on0 = sun.rise - (k.lightHours - sun.day);
      K.lightOn = WV.hour >= on0 && WV.hour < sun.rise + 0.5;
    }
  }
  // ==== 3. Everything that stands up, sorted back to front by x + y and drawn in that order ====
  // fence back half, building back and front halves (hutch cage wire and nest shells between them),
  // animals, the farmer on the chore route, fence front half
  const items = [];
  const fence = back => {
    const z = 3,
      col = '#7a5532';
    if (back) {
      for (let t = 0; t <= PLOT.w; t += 5) box(t - 0.12, -0.12, 0, 0.24, 0.24, z, col);
      for (let t = 5; t <= PLOT.h; t += 5) box(-0.12, t - 0.12, 0, 0.24, 0.24, z, col);
      line3([0, 0, z - 0.3], [PLOT.w, 0, z - 0.3], col, lw(0.1));
      line3([0, 0, z - 0.3], [0, PLOT.h, z - 0.3], col, lw(0.1));
      line3([0, 0, 1.3], [PLOT.w, 0, 1.3], col, lw(0.1));
      line3([0, 0, 1.3], [0, PLOT.h, 1.3], col, lw(0.1));
    } else {
      const gp = gatePt();
      for (let t = 0; t <= PLOT.w; t += 5) {
        if (Math.abs(t - gp[0]) < 2.6 && t !== gp[0] - 2.5 && t !== gp[0] + 2.5) continue;
        box(t - 0.12, PLOT.h - 0.12, 0, 0.24, 0.24, z, col);
      }
      for (let t = 0; t < PLOT.h; t += 5) box(PLOT.w - 0.12, t - 0.12, 0, 0.24, 0.24, z, col);
      for (const zz of [1.3, z - 0.3]) {
        line3([0, PLOT.h, zz], [gp[0] - 2.5, PLOT.h, zz], col, lw(0.1));
        line3([gp[0] + 2.5, PLOT.h, zz], [PLOT.w, PLOT.h, zz], col, lw(0.1));
        line3([PLOT.w, 0, zz], [PLOT.w, PLOT.h, zz], col, lw(0.1));
      }
      line3([gp[0] + 2.5, PLOT.h, 1.5], [gp[0] + 2.5 + 1.8, PLOT.h + 1.8, 1.5], '#8a6542', lw(0.12));
      line3([gp[0] + 2.5, PLOT.h, 2.6], [gp[0] + 2.5 + 1.8, PLOT.h + 1.8, 2.6], '#8a6542', lw(0.12));
    }
  };
  items.push({ k: -1, f: () => fence(true) });
  const cull = WV.zoom > 14 && !WV.noCull; // zoomed in: skip buildings wholly off screen (perf.js)
  for (const k of S.comps) {
    if (cull && !compNear(k)) continue;
    if (TYPES[k.type].round) {
      const p = ctr(k);
      items.push({ k: p[0] + p[1], f: () => drawFront(k) });
    } else {
      items.push({ k: k.x + k.y - 0.01, f: () => drawBack(k) });
      items.push({ k: k.x + k.w + k.y + k.d, f: () => drawFront(k) });
      if (k.type === 'hutch') {
        cageWireItems(k, items); // phase 28: wire between the cages
        nestShellItems(k, items); // phase 37: closed nest boxes over the litter
      }
    }
  }
  for (const g of WV.agents.values())
    if (!g.hidden && !g.off) items.push({ k: g.x + g.y + (g.z > 1.5 ? 0 : 0), f: () => drawAgent(g) });
  if (WV.farmer && WV.route && (!sun.night || WV.route.nodes.length))
    items.push({ k: WV.farmer.x + WV.farmer.y, f: drawFarmer });
  items.push({ k: 1e5, f: () => fence(false) });
  items.sort((a, b) => a.k - b.k);
  for (const it of items) it.f();
  // ==== 4. On top of the scene: the picked-animal marker, eggs flying to the incubator, fan air ====
  drawSelMark(); // marker over the picked animal (camera.js)
  for (const f of WV.fly) {
    const t = clamp(f.t / f.dur, 0, 1),
      x = f.a[0] + (f.b[0] - f.a[0]) * t,
      y = f.a[1] + (f.b[1] - f.a[1]) * t,
      z = f.a[2] + (f.b[2] - f.a[2]) * t + Math.sin(t * Math.PI) * 3,
      o = iso(x, y, z);
    E(o[0], o[1], WV.zoom * 0.09, WV.zoom * 0.12, 0, '#f6ead2');
  }
  for (const p of WV.air) {
    const o = iso(p.x, p.y, 0.6);
    c.strokeStyle = 'rgba(200,230,255,' + 0.6 * (1 - p.t / p.life) + ')';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(o[0], o[1]);
    const o2 = iso(p.x - p.vx * 0.3, p.y - p.vy * 0.3, 0.6);
    c.lineTo(o2[0], o2[1]);
    c.stroke();
  }
  // ==== 5. Night darkness, then pen lights over it ====
  // night: darkness from the sun's elevation; lights are drawn on top of it
  const dark = clamp((4 - sun.el) / 14, 0, 1) * 0.62;
  if (dark > 0.01) {
    c.fillStyle = 'rgba(12,20,48,' + dark + ')';
    c.fillRect(0, 0, WV.w, WV.h);
  }
  if (sun.el > -4 && sun.el < 8) {
    c.fillStyle = 'rgba(255,140,60,' + 0.08 * (1 - Math.abs(sun.el - 2) / 6) + ')';
    c.fillRect(0, 0, WV.w, WV.h);
  }
  c.globalCompositeOperation = 'lighter';
  const L = Math.max(0.25, dark * 1.4);
  for (const k of S.comps) {
    const K = WV.K[k.id];
    if (!K) continue;
    if (K.lightOn)
      glow(
        k.x + k.w / 2,
        k.y + k.d / 2,
        k.type === 'coop' ? 5 : 3.5,
        Math.max(k.w, k.d) * 0.7,
        'rgba(255,230,150,A)',
        0.55 * L
      );
    if (k.type === 'brooder' && K.n && K.lamp)
      // the lamp glow is additive; in daylight it is kept faint so it does not wash out the chicks under it
      glow(K.lamp[0], K.lamp[1], 2.6, 2.6, 'rgba(255,110,50,A)', (0.25 + 0.6 * K.duty) * (dark > 0.15 ? Math.max(0.5, L) : 0.2));
    const tNow = tempAtHour(env.tmin, env.tmax, WV.hour, riseOf(env.day));
    if (k.type === 'heater' && tNow < k.setpoint) {
      const p = ctr(k);
      glow(p[0], p[1], 0.8, 3, 'rgba(255,120,40,A)', clamp((k.setpoint - tNow) / 30, 0, 1) * 0.7 * L);
    }
    if (k.type === 'incubator' && +k.on)
      glow(k.x + k.w, k.y + k.d / 2, 2.9, 0.9, 'rgba(80,255,120,A)', 0.6 * L);
  }
  c.globalCompositeOperation = 'source-over';
  // ==== 6. Sky weather (wxSky in weather.js), labels, chore distances, floating text, overflow note, fps ====
  wxSky(wx);
  if (WV.labels) drawLabels(); // laid out so chips never overlap (phase 22)
  if (WV.lens === 'chores' && WV.route && WV.route.feed)
    for (const s of WV.route.stops) {
      for (const [o, dd, col] of [
        [WV.route.feed, s.df, '#ffd25a'],
        [WV.route.water, s.dw, '#6ebeff']
      ]) {
        if (!o) continue;
        const q = ctr(o),
          m = iso((s.p[0] + q[0]) / 2, (s.p[1] + q[1]) / 2, 0.3);
        chip(m[0], m[1], [Math.round(dd) + ' ft'], col);
      }
    }
  for (const f of WV.fx) {
    const o = iso(f.x, f.y, f.z + f.t * 0.8);
    c.globalAlpha = clamp(1.6 - (f.t / f.life) * 1.6, 0, 1);
    c.font = '700 12px system-ui';
    c.textAlign = 'center';
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(0,0,0,0.6)';
    c.strokeText(f.text, o[0], o[1]);
    c.fillStyle = f.col;
    c.fillText(f.text, o[0], o[1]);
    c.globalAlpha = 1;
  }
  const over = overflow();
  if (over) chip(12 + 60, WV.h - 18, [over], '#fff');
  drawFps(); // frame rate readout when it is switched on (perf.js)
}
// Text for the HUD when some animals are not drawn (more than 90 in one pen), else an empty string.
function overflow() {
  const n = [...WV.agents.values()].filter(g => g.off).length;
  return n ? n + ' animals not drawn (90 per pen shown)' : '';
}
// Draws a building label chip at screen point x, y: a rounded box with its lines of text, or a compact one-
// line chip when small is set.
function chip(x, y, lines, col, fw, small) {
  const c = WV.ctx;
  if (small) {
    // compact one-line chip for the zoomed-out view (phase 39)
    c.font = LSMALL.font;
    const w = fw || c.measureText(lines[0]).width + LSMALL.pad,
      h = LSMALL.h;
    c.fillStyle = 'rgba(18,22,28,0.74)';
    c.beginPath();
    c.roundRect ? c.roundRect(x - w / 2, y - h, w, h, 4) : c.rect(x - w / 2, y - h, w, h);
    c.fill();
    c.textAlign = 'center';
    c.fillStyle = col || '#fff';
    c.fillText(lines[0], x, y - 4);
    return;
  }
  c.font = '600 11px system-ui';
  const w = fw || Math.max(...lines.map(l => c.measureText(l).width)) + 10,
    h = lines.length * 13 + 5;
  c.fillStyle = 'rgba(18,22,28,0.74)';
  c.beginPath();
  c.roundRect ? c.roundRect(x - w / 2, y - h, w, h, 5) : c.rect(x - w / 2, y - h, w, h);
  c.fill();
  c.textAlign = 'center';
  lines.forEach((l, i) => {
    c.fillStyle = i ? 'rgba(235,240,245,0.85)' : col || '#fff';
    c.font = (i ? '500 10px' : '600 11px') + ' system-ui';
    c.fillText(l, x, y - h + 13 + i * 13 - 1);
  });
}
// r0(v): v rounded to a whole number, for label text.
const r0 = v => Math.round(v);
// The lines of text on building k's full label (what it holds and the model's key numbers for it).
function labelLines(k) {
  const K = WV.K[k.id] || {},
    env = envNow(),
    n = S.animals.filter(a => a.enc === k.id).length;
  switch (k.type) {
    case 'hutch':
      return [
        'Hutch · ' + n + ' rabbits',
        r0(K.dens * 100) + '% space · ' + r0(K.m.tmin) + '–' + r0(K.m.tmax) + '°F'
      ].concat(K.cg && K.cg.doubled ? [(K.cg.over ? 'Over-full: ' : 'No free cage: ') + K.cg.doubled + ' share'] : []);
    case 'coop':
      return ['Coop · ' + n + ' birds', r0(K.dens * 100) + '% space · light ' + K.m.light.toFixed(1) + ' h'];
    case 'run':
      return K.attached
        ? ['Run · ' + r0((S.today.run.ratio || 0) * 100) + '% used']
        : ['Run · not attached', 'birds can’t use it'];
    case 'brooder':
      return [
        'Brooder · ' + n + ' chicks',
        n ? 'lamp spot ' + r0(K.t) + '°F, need ' + r0(K.need) + '°F' : +k.indoor ? 'indoors' : 'outdoors'
      ];
    case 'incubator': {
      const eg = S.eggsInc.filter(e => e.inc === k.id);
      const nx = eg.length ? Math.max(0, Math.ceil(Math.min(...eg.map(e => e.hatchDay)) - S.day)) : null;
      return [
        'Incubator · ' + eg.length + '/' + k.capacity + ' eggs',
        nx != null ? 'next hatch in ' + nx + ' d' : +k.on ? 'on, empty' : 'off'
      ];
    }
    case 'tree':
      return ['Shade tree', env.tmax > 70 ? 'shading pens today' : 'no shade effect under 70°F'];
    case 'fan':
      return [
        'Fan · ' +
          (tempAtHour(env.tmin, env.tmax, WV.hour, riseOf(env.day)) > k.trigger ? 'on now' : 'off now') +
          ' · ' +
          hoursAbove(env.tmin, env.tmax, env.day, k.trigger) +
          ' h today'
      ];
    case 'heater':
      return [
        'Heater · ' +
          r0(heaterDuty(env.tmin, env.tmax, env.day, k.setpoint) * 100) +
          '% of full power over today'
      ];
    case 'feed': {
      const d = S.today.d || {};
      return ['Feed shed', ((d.rFeed || 0) + (d.cFeed || 0) + (d.sFeed || 0)).toFixed(1) + ' lb/day'];
    }
    case 'water': {
      const d = S.today.d || {};
      return ['Water', (d.water || 0).toFixed(1) + ' gal/day'];
    }
  }
  return [k.name];
}
// HT: drawn height of each building type (ft), used to place its label, its tap target and the camera.
const HT = {
  hutch: 5,
  coop: 9,
  run: 4.5,
  brooder: 2,
  incubator: 3.6,
  tree: 13,
  fan: 4.2,
  heater: 1.6,
  feed: 9.5,
  water: 3.4
};
// ---- Label layout (phase 22, visual only) ----
// Building labels are laid out each frame so no two chips overlap. Bigger buildings are placed first
// (the selected one before all), each at its own spot if it is free, else at the nearest free spot
// around it with a thin leader line back to the building; a two-line label that cannot fit is cut to
// its first line, and one that still cannot fit is left out until you zoom in or tap the building
// (the selected building's label is always drawn). Reads the model only through labelLines().
const LPRI = { hutch: 1, coop: 1, brooder: 2, run: 3, incubator: 3, feed: 4, water: 4, tree: 5, fan: 5, heater: 5 };
// Zoomed out (phase 39). Below LZOOM the full labels used to hide, so a phone, which opens at zoom 3,
// showed no labels at all. Now, below LZOOM, the main buildings (LPRI up to LSMALL.pri: hutch banks,
// coop, brooder, run, incubator) get a compact one-line chip with a short count, in a smaller font,
// laid out by the same no-overlap rules; feed shed, water point, tree, fans and heaters wait for
// LZOOM. The selected building keeps its full label.
const LZOOM = 5.5;
const LSMALL = { pri: 3, font: '600 10px system-ui', pad: 8, h: 14 }; // compact chips: types up to LPRI pri get one, font, padding (px), height (px)
// The one line on building k's compact label at the zoomed-out view (phase 39).
function compactLine(k) {
  const K = WV.K[k.id] || {},
    n = S.animals.filter(a => a.enc === k.id).length;
  if (WV.lens === 'light' && K.m && (k.type === 'coop' || k.type === 'hutch'))
    return (k.type === 'coop' ? 'Coop' : 'Hutch') + ' · ' + K.m.light.toFixed(1) + ' h light';
  switch (k.type) {
    case 'hutch':
      return 'Hutch · ' + n + ' rabbits';
    case 'coop':
      return 'Coop · ' + n + ' birds';
    case 'brooder':
      return 'Brooder · ' + n + ' chicks';
    case 'run':
      return K.attached ? 'Run · ' + r0((S.today.run.ratio || 0) * 100) + '%' : 'Run · not attached';
    case 'incubator':
      return 'Incubator · ' + S.eggsInc.filter(e => e.inc === k.id).length + ' eggs';
  }
  return labelLines(k)[0];
}
// Width and height in pixels of a label chip with these lines (compact when small).
function chipSize(lines, small) {
  const c = WV.ctx;
  if (small) {
    c.font = LSMALL.font;
    return { w: Math.ceil((c.measureText(lines[0]).width + LSMALL.pad) / 4) * 4, h: LSMALL.h };
  }
  let w = 0;
  lines.forEach((l, i) => {
    c.font = (i ? '500 10px' : '600 11px') + ' system-ui';
    w = Math.max(w, c.measureText(l).width);
  });
  c.font = '600 11px system-ui';
  w = Math.max(w, c.measureText(lines[0]).width);
  // layout width is rounded up to 8 px so a count ticking over does not move the chip
  return { w: Math.ceil((w + 10) / 8) * 8, h: lines.length * 13 + 5 };
}
// One label item per building that gets a label at this zoom: its lines, size and anchor point on screen.
function labelItems() {
  const out = [];
  const small = WV.zoom < LZOOM;
  for (const k of S.comps) {
    if (small && sel !== k.id && !((LPRI[k.type] || 6) <= LSMALL.pri)) continue;
    const p = ctr(k),
      o = iso(p[0], p[1], HT[k.type] + 0.6);
    if (small && sel !== k.id) {
      out.push({ k, ax: o[0], ay: o[1] - 3, L: [compactLine(k)], pri: LPRI[k.type], small: true });
      continue;
    }
    let L = labelLines(k);
    if (WV.zoom < 8 && sel !== k.id) L = L.slice(0, 1);
    if (WV.lens === 'light' && WV.K[k.id] && WV.K[k.id].m && (k.type === 'coop' || k.type === 'hutch'))
      L = [k.name, 'light ' + WV.K[k.id].m.light.toFixed(1) + ' h/day'];
    out.push({ k, ax: o[0], ay: o[1] - 4, L, pri: sel === k.id ? 0 : LPRI[k.type] || 6 });
  }
  // bigger buildings first, then top of the screen first, then by id so the order never flips
  out.sort((a, b) => a.pri - b.pri || a.ay - b.ay || (a.k.id < b.k.id ? -1 : 1));
  return out;
}
// Candidate offsets for a label of size w by h around its anchor, nearest first, in four rings (phase 22, more
// rings phase 41).
function labelSpots(w, h) {
  // nearest first: own spot, straight up, straight down, then the sides and diagonals, two rings
  // (phase 41: two more rings after them, used only to find a spot clear of the animals; the first
  // 17 spots are the same as before, so a label that never needs the new rings sits where it did)
  const up = h + 3,
    sd = w / 2 + 6,
    sp = [[0, 0]];
  for (const r of [1, 2, 3, 4])
    sp.push([0, -up * r], [0, up * r], [-sd * r, 0], [sd * r, 0], [-sd * r, -up * r], [sd * r, -up * r], [-sd * r, up * r], [sd * r, up * r]);
  return sp;
}
// ---- Labels kept off the animals (phase 41, visual only) ----
// A chip drawn over an animal hides it and takes its taps (a tap on a chip opens the building), so
// at a phone's starting zoom about 5 of the 16 animals could not be picked without zooming in. Each
// building that holds shown animals (a coop also claims its attached runs) gets a screen zone: its
// floor outline from the floor up to where its animals can stand (a coop's roost bars and nest boxes
// are 2 ft up), raised 0.3 ft to the body's middle as hitAgent measures it. A chip goes to the
// nearest free spot that misses every zone (grown by an animal's tap radius); only when there is none
// does it fall back to the phase 22 rule. The zones follow the buildings, not the animals' live
// positions, so a chip does not hop as animals walk; they change only with the camera and when a
// building gains or loses its last animal. Reads only the world's own state (WV.agents, WV.K).
function animalZones() {
  const homes = new Set();
  for (const g of WV.agents.values()) if (!g.hidden && !g.off && g.ref) homes.add(g.ref.enc);
  const ids = new Set();
  for (const id of homes) {
    const k = compById(id);
    if (!k) continue;
    ids.add(k.id);
    const K = WV.K[k.id];
    if (k.type === 'coop' && K && K.runs) for (const r of K.runs) ids.add(r.r.id);
  }
  const Z = [];
  for (const id of ids) {
    const k = compById(id);
    if (!k || TYPES[k.type].round) continue;
    const fz = floorZ(k),
      z0 = fz + 0.3,
      z1 = fz + (k.type === 'coop' ? 2.0 : 0) + 0.8, // 0.5 ft slack for hops and jumps
      T = iso(k.x, k.y, z1),
      R1 = iso(k.x + k.w, k.y, z1),
      R0 = iso(k.x + k.w, k.y, z0),
      B = iso(k.x + k.w, k.y + k.d, z0),
      L0 = iso(k.x, k.y + k.d, z0),
      L1 = iso(k.x, k.y + k.d, z1);
    Z.push({ id: k.id, P: [T, R1, R0, B, L0, L1] });
  }
  return Z;
}
// does a convex screen polygon touch a box? (separating axes)
function polyHitsBox(P, b) {
  const bx = [b.x, b.x + b.w, b.x + b.w, b.x],
    by = [b.y, b.y, b.y + b.h, b.y + b.h];
  let a = Infinity,
    c = -Infinity,
    d = Infinity,
    e = -Infinity;
  for (const p of P) {
    a = Math.min(a, p[0]);
    c = Math.max(c, p[0]);
    d = Math.min(d, p[1]);
    e = Math.max(e, p[1]);
  }
  if (c < b.x || a > b.x + b.w || e < b.y || d > b.y + b.h) return false;
  for (let i = 0; i < P.length; i++) {
    const p = P[i],
      q = P[(i + 1) % P.length],
      nx = p[1] - q[1],
      ny = q[0] - p[0];
    let pm = Infinity,
      pM = -Infinity,
      bm = Infinity,
      bM = -Infinity;
    for (const r of P) {
      const v = r[0] * nx + r[1] * ny;
      pm = Math.min(pm, v);
      pM = Math.max(pM, v);
    }
    for (let j = 0; j < 4; j++) {
      const v = bx[j] * nx + by[j] * ny;
      bm = Math.min(bm, v);
      bM = Math.max(bM, v);
    }
    if (bM < pm || bm > pM) return false;
  }
  return true;
}
// Places every label without overlaps: first a spot clear of the animal zones (phase 41), else the nearest
// free spot (phase 22); hides what cannot fit. Remembers spots so labels do not jump.
function layoutLabels() {
  const items = labelItems(),
    placed = [],
    shown = [],
    hidden = [],
    M = 3,
    prev = WV.labPrev || (WV.labPrev = {});
  const free = b => !placed.some(q => b.x < q.x + q.w + M && q.x < b.x + b.w + M && b.y < q.y + q.h + M && q.y < b.y + b.h + M);
  const selOn = items.some(it => !it.pri);
  const zones = WV.noLabelDodge ? [] : animalZones(),
    rr = WV.zoom * 0.6 + 1; // an animal's body tap radius (hitAgent)
  const clearOf = b => {
    const g = { x: b.x - rr, y: b.y - rr, w: b.w + 2 * rr, h: b.h + 2 * rr };
    return !zones.some(z => polyHitsBox(z.P, g));
  };
  for (const it of items) {
    const { w: w0 } = chipSize(it.L, it.small);
    // a building whose spot is well off the map takes no room
    if (it.pri && (it.ax < -w0 / 2 || it.ax > WV.w + w0 / 2 || it.ay < -20 || it.ay > WV.h + 40)) continue;
    let got = null;
    const tries = it.pri && it.L.length > 1 ? [it.L, it.L.slice(0, 1)] : [it.L];
    // first pass (unselected buildings only): a free spot on the map clear of the animals (all lines,
    // then one line); second pass: the phase 22 rule (first free spot in the two inner rings, clamped
    // onto the map). The selected building's label keeps its own spot, as before.
    // the selected building's label stays centred where its chip was when it was picked (the offset
    // from its anchor is kept in pixels), so the label does not jump away from the finger that tapped
    // it; with no moved chip to follow it keeps its own spot, as before
    const pk = prev[it.k.id];
    if (!it.pri && pk && pk.mv) {
      const { w, h } = chipSize(it.L, it.small);
      const x = clamp(it.ax + pk.ox - w / 2, 4, WV.w - w - 4),
        y = clamp(it.ay + pk.oy - h / 2, 4, WV.h - h - 4);
      got = { it, lines: it.L, b: { x, y, w, h }, i: pk.i, keep: true };
    }
    for (const pass of got ? [] : zones.length && it.pri ? [1, 2] : [2]) {
      for (const lines of tries) {
        const { w, h } = chipSize(lines, it.small),
          spots = labelSpots(w, h),
          n = pass === 1 ? spots.length : 17,
          pi = prev[it.k.id];
        // own spot first; then the spot it used last frame, so labels do not hop between equal choices
        const order = [0];
        if (pi && pi.n === lines.length && pi.i > 0 && pi.i < n) order.push(pi.i);
        for (let i = 1; i < n; i++) if (i !== order[1]) order.push(i);
        for (const i of order) {
          let x = it.ax + spots[i][0] - w / 2,
            y = it.ay + spots[i][1] - h;
          if (pass === 1) {
            // a spot clear of the animals must lie on the map as it is (clamping would slide it
            // somewhere else entirely)
            if (x < 4 || y < 4 || x > WV.w - w - 4 || y > WV.h - h - 4) continue;
          } else if (it.pri) {
            // keep the chip on the map
            x = clamp(x, 4, WV.w - w - 4);
            y = clamp(y, 4, WV.h - h - 4);
          }
          const b = { x, y, w, h };
          if (pass === 1 ? (!it.pri || free(b)) && clearOf(b) : !it.pri || free(b)) {
            got = { it, lines, b, i, clear: pass === 1 };
            break;
          }
        }
        if (got) break;
      }
      if (got) break;
    }
    if (!got) {
      hidden.push(it.k.id);
      delete prev[it.k.id];
      continue;
    }
    placed.push(got.b);
    const cx = got.b.x + got.b.w / 2,
      by = got.b.y + got.b.h;
    // while a building is selected, the other labels do not remember the spots its full label pushed
    // them to, so closing its card puts them back where they were
    if (!selOn || !it.pri) prev[it.k.id] = { i: got.i, n: got.lines.length, ox: cx - it.ax, oy: got.b.y + got.b.h / 2 - it.ay, mv: Math.hypot(cx - it.ax, by - it.ay) > 2 };
    shown.push({
      id: it.k.id,
      type: it.k.type,
      lines: got.lines,
      cut: got.lines.length < it.L.length,
      box: got.b,
      ax: it.ax,
      ay: it.ay,
      moved: Math.hypot(cx - it.ax, by - it.ay) > 2,
      sel: !it.pri,
      small: !!it.small,
      clear: !!got.clear || !zones.length
    });
  }
  WV.labelLayout = { zoom: WV.zoom, shown, hidden, zones: zones.length };
  return WV.labelLayout;
}
// Draws the placed labels: leader lines first, then the chips on top.
function drawLabels() {
  const c = WV.ctx,
    Lay = layoutLabels();
  // leader lines first, under every chip
  for (const s of Lay.shown) {
    if (!s.moved) continue;
    const b = s.box,
      ex = clamp(s.ax, b.x + 6, b.x + b.w - 6),
      ey = s.ay < b.y ? b.y : s.ay > b.y + b.h ? b.y + b.h : b.y + b.h / 2;
    c.strokeStyle = 'rgba(18,22,28,0.7)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(ex, ey);
    c.lineTo(s.ax, s.ay);
    c.stroke();
    c.strokeStyle = s.sel ? '#ffd84d' : 'rgba(235,240,245,0.85)';
    c.lineWidth = 1.2;
    c.stroke();
    c.fillStyle = c.strokeStyle;
    c.beginPath();
    c.arc(s.ax, s.ay, 2.2, 0, Math.PI * 2);
    c.fill();
  }
  for (const s of Lay.shown)
    chip(s.box.x + s.box.w / 2, s.box.y + s.box.h, s.lines, s.sel ? '#ffd84d' : '#fff', s.box.w, s.small);
}
// tapping a chip picks its building (used by input.js hitComp)
function hitLabel(sx, sy) {
  const L = WV.labels && WV.labelLayout;
  if (!L || L.zoom !== WV.zoom) return null;
  for (let i = L.shown.length - 1; i >= 0; i--) {
    const b = L.shown[i].box;
    if (sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h) return compById(L.shown[i].id);
  }
  return null;
}
