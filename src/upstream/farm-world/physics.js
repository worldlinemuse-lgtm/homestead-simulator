// world/physics.js
// Farm world (visual only). Movement physics for the sprites: a fixed 1/60 s step, steering with an
// acceleration limit, rabbit hops and level changes (hutch floor, perch, nest box) under gravity,
// circle-vs-wall collisions with cage wire, coop walls and run fences, circle-vs-box collisions with
// feeders, waterers and nest boxes, and circle-vs-circle collisions between animals.
// Like the rest of the world it reads the model and never writes it, and it uses the world's own dice
// (vr()), so a replay from the same seed moves every animal the same way and no simulated number can
// change. Gravity is the real 32.2 ft/s²; hop times are illustrative (visual only).
// ---- Contents (top-level functions, in file order; kept by tools/code_contents.py) ----
//   bodyR - collision radius, ft: the body half-width seen from above (never under the old 0.15 ft inset)
//   obstaclesOf - floor-level boxes an animal walks around, per pen (feeders, waterers, nest boxes on the
//         floor)
//   startJump - gravity arc from (x, y, z) to the node's level; lands at most 1.4 ft along the way
//   jumpStep - Moves a jumping animal on by h seconds along its arc: straight across, up and down under
//         gravity (PHYS.G).
//   arrive - Called when animal g reaches path point n: takes the point's zone (a door hop) and height, drops
//         it from the path and clears the stuck, squeeze and move-over counters.
//   hopStep - rabbits move in hops: airborne T s, then on the ground 0.35 T s; height from gravity
//   giveUpWhy - why a spot was given up (diagnostic only; counts in PHYS.why and PHYS.whyAct, never steers
//         anything)
//   shiftSpot - phase 32: the spot it was walking to is taken (a pen-mate stands on it or in the last foot of
//         the way), so it moves over to the nearest open spot beside it, as an animal at a crowded ...
//   move - one step along the path: steer, hop, jump between levels, give up on a spot that is blocked
//   pushOutBox - push a circle out of a box; returns the push normal or null
//   bounce - Bounces animal g off a wall with inward normal nx, ny and springiness e; returns how fast it hit
//         (0 when moving away).
//   onFloor - animals on the pen's floor (not mid-jump, not up on a perch or in a raised nest box)
//   atDoor - walking to a door or gate and within 1 ft of it
//   pressIn - phase 48: lying touching on purpose.
//   separate - keep animals apart and inside their pen; a hit shows as a bump in the space lens
//   physStep - one fixed step of every sprite
//   physFrame - run as many fixed steps as the frame's time covers; leftover time carries to the next frame
//   physReplay - test handle: rebuild every sprite from the model with the world's dice at a fixed seed, run n
//         fixed steps, and return a fingerprint of where every animal is (same seed and n give the ...
// ---- end of contents ----
const PHYS = {
  dt: 1 / 60, // fixed visual timestep, s
  maxSteps: 6, // most steps one frame may run (a 0.1 s frame needs 6)
  acc: 0, // frame time (s) not yet used up by a fixed step, carried to the next frame
  G: 32.2, // gravity, ft/s²
  accel: 5, // steering: reach full walking speed in 1/5 s
  restWall: 0.15, // bounce off wire, walls and fences (fraction of speed kept)
  restPair: 0.1, // bounce between animals
  steps: 0, // fixed steps run so far (counter)
  wallHits: 0, // hits on walls, wire and fences (counter)
  pairHits: 0, // animal-on-animal bumps faster than 0.4 ft/s (counter)
  jumps: 0, // jumps started (counter)
  hops: 0, // rabbit hops (counter)
  giveUps: 0, // spots given up on because a pen-mate, feeder or wall blocked them
  shifts: 0, // phase 32: taken spots swapped for an open one beside them
  why: {}, // give-ups by cause (phase 24 diagnostic): mate, fixture, wall, transit, long, other
  whyAct: {}, // give-ups by animal kind and the act it was walking to
  ms: 0 // ms the last physFrame took
};
// collision radius, ft: the body half-width seen from above (never under the old 0.15 ft inset)
function bodyR(g) {
  return clamp(sizeFt(g.ref) * 0.3, 0.15, 0.45);
}
// floor-level boxes an animal walks around, per pen (feeders, waterers, nest boxes on the floor)
function obstaclesOf(c) {
  const K = WV.K[c.id];
  if (!K) return [];
  if (K.obs && K.obsKey === WV.layoutKey) return K.obs;
  const o = [];
  if (c.type === 'coop' && K.feeder) {
    for (const t of K.troughs || []) o.push({ x: t.x, y: t.y, w: t.w, d: t.d });
    for (const f of K.founts || []) o.push({ x: f.x - f.r, y: f.y - f.r, w: 2 * f.r, d: 2 * f.r });
  }
  // phase 27: the legs of the nest-box stand and the roost frame (birds walk under the boxes and bars,
  // which are 24 in up, but not through their posts)
  if (c.type === 'coop') for (const l of K.legs || []) o.push({ x: l.x, y: l.y, w: l.w, d: l.d, leg: 1 });
  if (c.type === 'brooder' && K.btr) {
    // phase 33: troughs and waterers sized from the chick count (broodGear)
    for (const t of K.btr) o.push({ x: t.x, y: t.y, w: t.w, d: t.d });
    for (const f of K.bfo) o.push({ x: f.x - f.r, y: f.y - f.r, w: 2 * f.r, d: 2 * f.r });
  }
  if (c.type === 'hutch') {
    // each hopper's lip pokes through the front wire into the cage; bottles only put a nipple through
    for (const h of (K.hops || []).concat(K.ownHops || [])) o.push({ x: h[0] - 0.21, y: c.y + c.d - 0.22, w: 0.42, d: 0.22 });
    for (const n of K.nests || []) o.push({ x: n.x, y: n.y, w: n.w, d: n.d, nest: 1 });
  }
  K.obs = o;
  K.obsKey = WV.layoutKey;
  return o;
}
// gravity arc from (x, y, z) to the node's level; lands at most 1.4 ft along the way
function startJump(g, n) {
  const dx = n.x - g.x,
    dy = n.y - g.y,
    dd = Math.hypot(dx, dy),
    f = dd > 1.4 ? 1.4 / dd : 1,
    z0 = g.z,
    z1 = n.z,
    apex = Math.max(z0, z1) + 0.35,
    vz = Math.sqrt(2 * PHYS.G * (apex - z0)),
    T = vz / PHYS.G + Math.sqrt((2 * (apex - z1)) / PHYS.G);
  g.jump = { x0: g.x, y0: g.y, z0, x1: g.x + dx * f, y1: g.y + dy * f, z1, vz, T, t: 0, full: f === 1 };
  g.vx = g.vy = 0;
  g.hz = 0;
  PHYS.jumps++;
  if (Math.abs(dx) > 0.01) g.face = dx - dy > 0 ? 1 : -1;
}
// Moves a jumping animal on by h seconds along its arc: straight across, up and down under gravity (PHYS.G).
function jumpStep(g, h) {
  const J = g.jump;
  J.t = Math.min(J.T, J.t + h);
  const u = J.t / J.T;
  g.x = J.x0 + (J.x1 - J.x0) * u;
  g.y = J.y0 + (J.y1 - J.y0) * u;
  g.z = J.z0 + J.vz * J.t - 0.5 * PHYS.G * J.t * J.t;
  g.ph = Math.PI * u;
  if (J.t >= J.T) {
    g.z = J.z1;
    g.jump = null;
    if (J.full) arrive(g, g.path[0]);
  }
  return true;
}
// Called when animal g reaches path point n: takes the point's zone (a door hop) and height, drops it from the
// path and clears the stuck, squeeze and move-over counters.
function arrive(g, n) {
  if (!n) return;
  if ('zone' in n) g.zone = n.zone;
  if (n.z != null) g.z = n.z;
  g.path.shift();
  g.best = null;
  g.stuck = 0;
  g.squeeze = 0;
  g.shifts = 0;
}
// rabbits move in hops: airborne T s, then on the ground 0.35 T s; height from gravity
function hopStep(g, h, moving) {
  const k = kindOf(g.ref);
  if (k !== 'rab' && k !== 'kit') return 1;
  const Ta = (k === 'kit' ? 0.16 : 0.22) + 0.08 * clamp(sizeFt(g.ref) / 1.35, 0, 1.4),
    Tg = 0.35 * Ta;
  if (g.hopT == null) g.hopT = Ta; // start on the ground
  if (!moving && g.hopT >= Ta) {
    g.hz = 0;
    return 1;
  }
  if (g.hopT === Ta && moving) PHYS.hops++;
  g.hopT += h;
  if (g.hopT >= Ta + Tg) {
    g.hopT = moving ? 0 : Ta;
    if (moving) PHYS.hops++;
  }
  if (g.hopT < Ta) {
    const t = g.hopT,
      vz = (PHYS.G * Ta) / 2;
    g.hz = Math.max(0, vz * t - 0.5 * PHYS.G * t * t);
    g.ph = Math.PI * (t / Ta);
    return 1.15; // ground covered mostly in the air
  }
  g.hz = 0;
  return 0.55;
}
// why a spot was given up (diagnostic only; counts in PHYS.why and PHYS.whyAct, never steers anything)
function giveUpWhy(g, n, transit) {
  let why = 'other';
  const c = compById(g.zone),
    r = bodyR(g);
  if (transit) why = 'transit';
  else if (g.stuck > 4) why = 'long';
  else if (c) {
    if (n.x < c.x + r - 0.05 || n.x > c.x + c.w - r + 0.05 || n.y < c.y + r - 0.05 || n.y > c.y + c.d - r + 0.05)
      why = 'wall';
    else if (onFloor(g, c))
      for (const b of obstaclesOf(c)) {
        if (b.nest && (g.ref.st === 'kit' || g.wantNest || g.act === 'nest' || g.act === 'pullfur' || g.act === 'huddle')) continue;
        const px = clamp(n.x, b.x, b.x + b.w),
          py = clamp(n.y, b.y, b.y + b.d);
        if (Math.hypot(n.x - px, n.y - py) < r - 0.05) {
          why = b.nest ? 'nestbox' : 'fixture';
          break;
        }
      }
    if (why === 'other')
      for (const o of WV.agents.values()) {
        if (o === g || o.zone !== g.zone || o.hidden || o.leaving || Math.abs(o.z - g.z) > 0.4) continue;
        const m = (sizeFt(o.ref) + sizeFt(g.ref)) * 0.38 * (o.hot || g.hot ? 1.25 : 1);
        if (Math.hypot(o.x - n.x, o.y - n.y) < m + 0.1 || Math.hypot(o.x - g.x, o.y - g.y) < m + 0.1) {
          why = 'mate';
          break;
        }
      }
  }
  PHYS.why[why] = (PHYS.why[why] || 0) + 1;
  const key = kindOf(g.ref) + ':' + (g.task ? g.task.act : g.act || '?') + ':' + why;
  PHYS.whyAct[key] = (PHYS.whyAct[key] || 0) + 1;
  return why;
}
// phase 32: the spot it was walking to is taken (a pen-mate stands on it or in the last foot of the
// way), so it moves over to the nearest open spot beside it, as an animal at a crowded feeder or under
// a crowded lamp shuffles along to a gap. Candidates sit on rings round the spot at a half, one, one and
// a half and two body spacings (for eating and drinking at most one, so it stays at the rim); each is
// kept off the wire and fixtures by reachPt, and the one with most room, less a little for distance
// from the spot, wins if it really is clear. No dice (the angles start from the side it comes from),
// so the world's random sequence is untouched by the search itself. Visual only; the model never sees it.
function shiftSpot(g, n) {
  const c = compById(g.zone);
  if (!c || !onFloor(g, c) || (n.z != null && Math.abs(n.z - floorZ(c)) > 0.3)) return false;
  const box = c.type === 'hutch' ? cageBox(g, c) : c,
    sg = sizeFt(g.ref),
    L = [];
  for (const o of WV.agents.values()) {
    if (o === g || o.zone !== g.zone || o.hidden || o.leaving || o.jump || Math.abs(o.z - g.z) > 0.4) continue;
    if (pressIn(o)) continue; // they lie touching (separate() lets them); phase 48: or are pressing in to
    if (box !== c && cageBox(o, c) !== box) continue;
    const m = (sizeFt(o.ref) + sg) * 0.38 * (o.hot || g.hot ? 1.25 : 1);
    L.push([o.x, o.y, m]);
    const t = o.path.length ? o.path[o.path.length - 1] : null;
    if (t && !('zone' in t)) L.push([t.x, t.y, m]);
  }
  const room = (x, y) => {
    let m = 9;
    for (const q of L) m = Math.min(m, Math.hypot(x - q[0], y - q[1]) - q[2]);
    return m;
  };
  // phase 46: a kit under 18 days stays in its nest box (FAO x5082; agents.js sends it nowhere else), so a
  // place it shifts to must be in the box too. Before, a shift could leave it lying just outside the box
  const Kh = WV.K[g.home],
    nb = g.ref.st === 'kit' && g.ref.age < 18 && Kh && Kh.nestOf ? Kh.nestOf[g.ref.mother] : null,
    inNb = q => !nb || (q[0] >= nb.x + 0.1 && q[0] <= nb.x + nb.w - 0.1 && q[1] >= nb.y + 0.1 && q[1] <= nb.y + nb.d - 0.1);
  const act = g.task ? g.task.act : '',
    rings = act === 'eat' || act === 'peck' || act === 'drink' ? [0.5, 1] : [0.5, 1, 1.5, 2],
    sp = sg * 0.76,
    a0 = Math.atan2(g.y - n.y, g.x - n.x);
  let best = null,
    bs = -1e9;
  for (const f of rings)
    for (let i = 0; i < 8; i++) {
      const an = a0 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (Math.PI / 4),
        q = reachPt(g, c, [n.x + Math.cos(an) * f * sp, n.y + Math.sin(an) * f * sp], true),
        dq = Math.hypot(q[0] - n.x, q[1] - n.y),
        rm = room(q[0], q[1]),
        s = Math.min(rm, 0.15) - 0.35 * dq;
      // beside the spot: reachPt may push a place off a fixture, but not further than two spacings
      if (rm > 0.03 && dq <= 2 * sp && s > bs && inNb(q)) (bs = s), (best = q);
    }
  if (!best) return false;
  n.x = best[0];
  n.y = best[1];
  return true;
}
// one step along the path: steer, hop, jump between levels, give up on a spot that is blocked
function move(g, h) {
  const n = g.path[0];
  if (!n) return false;
  if (g.vx == null) g.vx = g.vy = 0;
  if (g.jump) return jumpStep(g, h);
  const sp = speedOf(g),
    dx = n.x - g.x,
    dy = n.y - g.y,
    dd = Math.hypot(dx, dy),
    nz = n.z != null ? n.z : g.z,
    dz = nz - g.z,
    last = g.path.length === 1,
    transit = 'zone' in n;
  // a change of level: jump down at once, jump up when within 1.5 ft
  if (dz < -0.25 || (dz > 0.25 && dd < 1.5)) {
    startJump(g, n);
    return jumpStep(g, h);
  }
  if (dd < 0.06 || (last && dd < 0.12)) {
    if (dz > 0.25) startJump(g, n);
    else arrive(g, n);
    return true;
  }
  // blocked (a pen-mate, a feeder or the wire is in the way): no progress for 1.2 s near the spot
  if (g.best == null || dd < g.best - 0.02) {
    g.best = dd;
    g.stuck = 0;
  } else g.stuck = (g.stuck || 0) + h;
  // farther than 1.2 ft from the spot (or heading for a door): after 1.2 s it squeezes between the
  // others (half the spacing) instead of stopping short; it gives up only after 4 s (phase 24)
  if (g.stuck > 1.2 && (dd >= 1.2 || transit)) g.squeeze = 1;
  // phase 32: near a taken spot it first moves over to an open one beside it (at most twice per spot)
  if (g.stuck > 1.2 && dd < 1.2 && !transit && last && (g.shifts || 0) < 2 && shiftSpot(g, n)) {
    g.shifts = (g.shifts || 0) + 1;
    PHYS.shifts++;
    g.best = null;
    g.stuck = 0;
    return true;
  }
  if ((g.stuck > 1.2 && dd < 1.2 && !transit) || g.stuck > 4) {
    if (transit) {
      g.x = n.x;
      g.y = n.y;
    }
    PHYS.giveUps++;
    const why = giveUpWhy(g, n, transit);
    // phase 32: no gap at the feeder or drinker: it stands and waits its turn instead of pecking or
    // drinking at nothing, and thinks again a second later
    // (only in a building with feeders: pecking in the run is foraging, not a place at a feeder)
    const zc = compById(g.zone);
    if (why === 'mate' && last && g.task && zc && zc.type !== 'run' && (g.task.act === 'eat' || g.task.act === 'peck' || g.task.act === 'drink'))
      g.task = { act: 'idle', dur: 1, waiting: 1 };
    if (dz > 0.25) startJump(g, n);
    else arrive(g, n);
    g.vx = g.vy = 0;
    return true;
  }
  // steer: full speed toward the point, slowing over the last 0.6 ft; acceleration is limited
  const want = last ? Math.min(sp, (sp * dd) / 0.6 + 0.15) : sp,
    amax = PHYS.accel * sp * h;
  let ax = (dx / dd) * want - g.vx,
    ay = (dy / dd) * want - g.vy;
  const am = Math.hypot(ax, ay);
  if (am > amax) {
    ax *= amax / am;
    ay *= amax / am;
  }
  g.vx += ax;
  g.vy += ay;
  const gait = hopStep(g, h, true),
    stx = g.vx * h * gait,
    sty = g.vy * h * gait,
    st = Math.hypot(stx, sty);
  g.x += stx;
  g.y += sty;
  if (Math.abs(dz) > 1e-4) g.z += dz * Math.min(1, st / Math.max(dd, 1e-3));
  if (Math.abs(g.vx - g.vy) > 0.05) g.face = g.vx - g.vy > 0 ? 1 : -1;
  const k = kindOf(g.ref);
  if (k !== 'rab' && k !== 'kit') g.ph += st * 3.4;
  return true;
}
// push a circle out of a box; returns the push normal or null
function pushOutBox(g, r, b) {
  const px = clamp(g.x, b.x, b.x + b.w),
    py = clamp(g.y, b.y, b.y + b.d);
  let nx = g.x - px,
    ny = g.y - py,
    d = Math.hypot(nx, ny);
  if (d >= r) return null;
  if (d < 1e-6) {
    // centre inside the box: leave by the nearest side
    const L = g.x - b.x,
      R = b.x + b.w - g.x,
      T = g.y - b.y,
      B = b.y + b.d - g.y,
      m = Math.min(L, R, T, B);
    if (m === L) (nx = -1), (ny = 0), (d = -L);
    else if (m === R) (nx = 1), (ny = 0), (d = -R);
    else if (m === T) (nx = 0), (ny = -1), (d = -T);
    else (nx = 0), (ny = 1), (d = -B);
  } else {
    nx /= d;
    ny /= d;
  }
  g.x += nx * (r - d);
  g.y += ny * (r - d);
  return [nx, ny];
}
// Bounces animal g off a wall with inward normal nx, ny and springiness e; returns how fast it hit (0 when
// moving away).
function bounce(g, nx, ny, e) {
  const vn = (g.vx || 0) * nx + (g.vy || 0) * ny;
  if (vn >= 0) return 0;
  g.vx -= (1 + e) * vn * nx;
  g.vy -= (1 + e) * vn * ny;
  return -vn;
}
// animals on the pen's floor (not mid-jump, not up on a perch or in a raised nest box)
function onFloor(g, c) {
  return !g.jump && Math.abs(g.z - floorZ(c)) < 0.3;
}
// walking to a door or gate and within 1 ft of it
function atDoor(g) {
  const n = g.path[0];
  return !!n && 'zone' in n && Math.abs(n.x - g.x) < 1 && Math.abs(n.y - g.y) < 1;
}
// phase 48: lying touching on purpose. An animal resting on the roost or huddling was already let lie
// against its pen-mates (separate() skips it). Now one walking in to huddle counts too once it is on the
// last leg and within 1.2 ft of its place, the window in which move() would otherwise give up: it presses
// in among the others the way chicks crowd together near the heat when they are cold (MU G8351). Before,
// two chicks heading for the lamp still pushed each other apart because neither was huddling yet, and
// one gave up (phase 48 diagnostic: the nearest chick at 46 of 101 lamp give-ups was another chick
// walking in to huddle, and every one came on the last leg). The 1.2 ft is move()'s window, not sourced.
function pressIn(g) {
  if (g.act === 'roost' || g.act === 'huddle') return true;
  if (!g.task || g.task.act !== 'huddle' || g.path.length !== 1) return false;
  const n = g.path[0];
  return !('zone' in n) && Math.hypot(n.x - g.x, n.y - g.y) < 1.2;
}
// keep animals apart and inside their pen; a hit shows as a bump in the space lens
function separate() {
  const by = {};
  for (const g of WV.agents.values()) {
    if (g.hidden || g.leaving || g.off || g.jump) continue;
    const z = g.zone || '_';
    (by[z] = by[z] || []).push(g);
  }
  for (const z in by) {
    const L = by[z],
      cz = compById(z),
      caged = cz && cz.type === 'hutch';
    for (let i = 0; i < L.length; i++) {
      const p = L[i];
      if (pressIn(p)) continue;
      for (let j = i + 1; j < L.length; j++) {
        const q = L[j];
        if (pressIn(q) || Math.abs(p.z - q.z) > 0.4) continue;
        // two animals passing the same pop door or gate squeeze by single file instead of
        // blocking it for each other (before phase 24 they stalled there and were moved through)
        if (atDoor(p) && atDoor(q)) continue;
        // phase 28: rabbits in neighbouring cages of a hutch bank have wire between them
        if (caged && cageBox(p, cz) !== cageBox(q, cz)) continue;
        const dx = q.x - p.x,
          dy = q.y - p.y,
          m = (sizeFt(p.ref) + sizeFt(q.ref)) * 0.38 * (p.hot || q.hot ? 1.25 : 1) * (p.squeeze || q.squeeze ? 0.5 : 1);
        if (Math.abs(dx) >= m || Math.abs(dy) >= m) continue;
        const d = Math.hypot(dx, dy);
        if (d >= m || d < 1e-4) continue;
        // heavier animals move less (mass ~ size cubed)
        const mp = Math.pow(sizeFt(p.ref), 3),
          mq = Math.pow(sizeFt(q.ref), 3),
          wp = mq / (mp + mq),
          wq = mp / (mp + mq),
          nx = dx / d,
          ny = dy / d,
          o = (m - d) * 0.4;
        p.x -= nx * o * wp;
        p.y -= ny * o * wp;
        q.x += nx * o * wq;
        q.y += ny * o * wq;
        const vn = ((q.vx || 0) - (p.vx || 0)) * nx + ((q.vy || 0) - (p.vy || 0)) * ny;
        if (vn < 0) {
          const jn = -(1 + PHYS.restPair) * vn,
            ip = 1 / mp,
            iq = 1 / mq,
            J = jn / (ip + iq);
          p.vx = (p.vx || 0) - J * ip * nx;
          p.vy = (p.vy || 0) - J * ip * ny;
          q.vx = (q.vx || 0) + J * iq * nx;
          q.vy = (q.vy || 0) + J * iq * ny;
          if (-vn > 0.4) PHYS.pairHits++;
        }
        p.bump = q.bump = WV.t;
      }
    }
    const c = compById(z);
    if (!c) continue;
    const obs = obstaclesOf(c);
    for (const g of L) {
      const transit = g.path.length && 'zone' in g.path[0];
      // phase 28: on the way to a door the posts and fixtures still block (a hen walked through a nest
      // post on her way across the coop); only the last foot through the doorway is left free
      if (transit && atDoor(g)) continue;
      const r = bodyR(g);
      if (onFloor(g, c)) {
        for (const b of obs) {
          if (b.nest && (g.ref.st === 'kit' || g.wantNest || g.act === 'nest' || g.act === 'pullfur' || g.act === 'huddle')) continue;
          const nn = pushOutBox(g, r, b);
          if (nn) bounce(g, nn[0], nn[1], PHYS.restWall);
        }
      }
      if (transit) continue; // passing a door or gate: no wall
      // cage wire, coop walls and run fences: the pen's rectangle, less the body radius. Phase 28: in a
      // hutch bank, the rabbit's own cage (the dividers are wire it cannot pass)
      const cb = caged ? cageBox(g, c) : c,
        x0 = cb.x + r,
        x1 = cb.x + cb.w - r,
        y0 = cb.y + r,
        y1 = cb.y + cb.d - r;
      let hit = 0;
      if (x0 > x1) g.x = cb.x + cb.w / 2;
      else if (g.x < x0) (g.x = x0), (hit = Math.max(hit, bounce(g, 1, 0, PHYS.restWall)));
      else if (g.x > x1) (g.x = x1), (hit = Math.max(hit, bounce(g, -1, 0, PHYS.restWall)));
      if (y0 > y1) g.y = cb.y + cb.d / 2;
      else if (g.y < y0) (g.y = y0), (hit = Math.max(hit, bounce(g, 0, 1, PHYS.restWall)));
      else if (g.y > y1) (g.y = y1), (hit = Math.max(hit, bounce(g, 0, -1, PHYS.restWall)));
      if (hit > 0.3) {
        PHYS.wallHits++;
        g.bump = WV.t;
      }
    }
  }
}
// one fixed step of every sprite
function physStep(h) {
  for (const g of WV.agents.values()) if (!g.off) updAgent(g, h);
  separate();
  PHYS.steps++;
}
// run as many fixed steps as the frame's time covers; leftover time carries to the next frame
function physFrame(dt) {
  const t0 = performance.now();
  PHYS.acc += dt;
  let n = 0;
  while (PHYS.acc >= PHYS.dt && n < PHYS.maxSteps) {
    physStep(PHYS.dt);
    PHYS.acc -= PHYS.dt;
    n++;
  }
  if (n === PHYS.maxSteps) PHYS.acc = 0;
  PHYS.ms = performance.now() - t0;
  return n;
}
// test handle: rebuild every sprite from the model with the world's dice at a fixed seed, run n fixed
// steps, and return a fingerprint of where every animal is (same seed and n give the same answer)
function physReplay(n, seed) {
  vSeed = seed || 20261104;
  WV.lastS = null;
  PHYS.acc = 0;
  WV.t = 0;
  worldSync();
  const c0 = { w: PHYS.wallHits, p: PHYS.pairHits, j: PHYS.jumps, h: PHYS.hops, u: PHYS.giveUps, s: PHYS.shifts };
  for (let i = 0; i < n; i++) physStep(PHYS.dt);
  let hsh = 0,
    out = 0,
    maxSpd = 0;
  const ids = [...WV.agents.keys()].sort((a, b) => a - b);
  for (const id of ids) {
    const g = WV.agents.get(id),
      s = Math.round(g.x * 1000) + ',' + Math.round(g.y * 1000) + ',' + Math.round(g.z * 1000);
    for (let i = 0; i < s.length; i++) hsh = (Math.imul(hsh, 31) + s.charCodeAt(i)) | 0;
    maxSpd = Math.max(maxSpd, Math.hypot(g.vx || 0, g.vy || 0));
    const c = g.zone && compById(g.zone);
    if (c && !g.leaving && !(g.path.length && 'zone' in g.path[0]) && !g.jump)
      if (g.x < c.x - 0.1 || g.x > c.x + c.w + 0.1 || g.y < c.y - 0.1 || g.y > c.y + c.d + 0.1) out++;
  }
  return {
    hash: hsh,
    n: ids.length,
    out,
    maxSpd,
    wallHits: PHYS.wallHits - c0.w,
    pairHits: PHYS.pairHits - c0.p,
    jumps: PHYS.jumps - c0.j,
    hops: PHYS.hops - c0.h,
    giveUps: PHYS.giveUps - c0.u,
    shifts: PHYS.shifts - c0.s
  };
}
