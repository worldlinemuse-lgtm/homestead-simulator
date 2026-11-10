// world/agents.js
// Farm world. One sprite per real animal; where it walks and what it does at the hour shown, driven by
// the model's numbers.
// ---- Contents (top-level functions, in file order; kept by tools/code_contents.py) ----
//   rndIn - A random point inside building c, at least ins ft (default 0.45) from its walls.
//   kindOf - Which of the four animal groups the world moves: rab (grown rabbits), kit, bird (grown chickens)
//         or chick.
//   gatePt - The farm gate, where bought animals walk in and sold ones walk out.
//   spawn - Adds animal a to the world (WV.agents): in its pen, or walking in from the gate or from a building
//         when from is given.
//   edgePt - The point on building c's wall nearest to x, y.
//   routeTo - Sends animal g to building id: out through its own door, along the ground and in, setting its
//         new home.
//   speedOf - Walking speed in ft a second: by kind, slower when unwell, faster when leaving the farm.
//   goIn - Adds to g's path the walk to point pt (height z) inside building zoneId: through its door first
//         when the path does not already end inside it (with no door to it, the animal is routed ho ...
//   reachPt - a spot the body can actually stand on (phase 24): at least its radius from the wire, walls and
//         fences, and, on the floor, outside the feeders, waterers and hopper lips it collides with ...
//   pick - Picks one key of ws at random, each with the chance of its weight (negative weights count as 0).
//   shadeOf - a resting spot in a tree's shade inside the run, if the tree's shade reaches the run (hot
//         hours).
//   shadeIn - A random point inside run o in the tree's shade at this hour when one can be found, else any
//         point in the run.
//   nearMate - a resting spot beside a pen-mate that is standing still on the floor (cold hours: they huddle)
//   clearPt - phase 30: of a few candidate spots, the one with the most room: farthest from the pen-mates on
//         the same level in the same cage, counting where a moving mate is heading.
//   clearAt - phase 43: the same as clearPt, but each candidate is first moved to where the animal can really
//         stand (reachPt, which goIn applies afterwards anyway).
//   floorRoom - phase 45: room at a floor point (x, y) of pen zc, against the pen-mates standing on the floor:
//         each counts at the last floor-level point it is walking to (a hen heading for the roost c ...
//   kitPile - phase 30: where an out-of-the-nest kit lies down.
//   dustOk - Dust bathing needs soft, dry material (Merck): not while rain or snow falls, not on snow or wet
//         ground.
//   mateDoing - Dust bathing and preening are synchronous social behaviours (Alabama Extension): a hen is
//         likelier to start when a pen-mate in the same pen is already doing it.
//   crowWindow - Roosters start crowing about 2 hours before dawn by their own clock (Shimmura and Yoshimura
//         2013).
//   furLevel - Fur in a doe's nest: none until 3 days before kindling, then more each day; kept as a blanket
//         over the kits while they nurse (FAO: she pulls fur from her abdomen before kindling).
//   chickDustF - Chicks dust-bathe too, starting at 1 to 2 weeks old (Merck Veterinary Manual, "Behavior of
//         Poultry").
//   broodRoomy - Crowded birds lack the room to dust-bathe (Merck); the brooder is crowded when its chicks
//         need more floor than it has at the floor-per-chick setting (the same rule the model's spa ...
//   dustSpotOf - Dust bathing is social and birds do it together, often touching (Merck): beside a pen-mate
//         that is already dust-bathing when there is one, else a free spot in the litter away from the lamp.
//   chickDusting - How strongly a chick is drawn to a bath: 12x when pen-mates are already at it (social), but
//         none once a third of the brooder's chicks (at least 2) are, so the whole brood does not p ...
//   dustMate - Places where a chick can join a dust bath already going in its brooder (6 round a bathing
//         chick, phase 50), or one free litter spot when nobody is bathing.
//   think - Chooses what animal g does next when it has nothing left to do: a task (eat, drink, rest, roost,
//         lay, dust bath, wander ...) picked from the hour, the weather, its feed and water left to ...
//   updAgent - Moves animal g on by dt seconds: plays out leaving the farm (death or sale), walks its path,
//         counts down its task, and calls think() when it is done.
//   sizeFt - Body length in ft as drawn: rabbits from weight (cube root of the share of adult weight), chicks
//         0.45, grown chickens growing to 1.1 by laying age.
//   fxText - Shows a short floating text at a farm point (for example "+1 egg"); at most 60 at once.
//   later - Runs fn when the world clock reaches hour h at the live speeds, else after d seconds (see
//         loop.js).
// ---- end of contents ----
// ---------- agents (one per real animal) ----------
const RAB = ['#efeae2', '#8b6a4e', '#3b3734', '#c9a27c', '#9c9c9c', '#efeae2'],
  HEN = ['#8a3f17', '#f3efe4', '#2a2a2a', '#c9a062', '#8a3f17'];
// A random point inside building c, at least ins ft (default 0.45) from its walls.
function rndIn(c, ins) {
  ins = ins == null ? 0.45 : ins;
  return [c.x + ins + vr() * Math.max(0.01, c.w - 2 * ins), c.y + ins + vr() * Math.max(0.01, c.d - 2 * ins)];
}
// Which of the four animal groups the world moves: rab (grown rabbits), kit, bird (grown chickens) or chick.
function kindOf(a) {
  return a.sp === 'rabbit' ? (a.st === 'kit' ? 'kit' : 'rab') : a.st === 'chick' ? 'chick' : 'bird';
}
// The farm gate, where bought animals walk in and sold ones walk out.
function gatePt() {
  return [60, PLOT.h + 0.2];
}
// Adds animal a to the world (WV.agents): in its pen, or walking in from the gate or from a building when from
// is given.
function spawn(a, from) {
  const home = a.enc && compById(a.enc);
  const g = {
    id: a.id,
    ref: a,
    home: a.enc,
    zone: a.enc,
    x: 0,
    y: 0,
    z: 0,
    path: [],
    act: 'idle',
    timer: vrr(0.2, 2),
    face: vr() < 0.5 ? 1 : -1,
    ph: vr() * 6,
    eggs: a.eggs,
    alpha: 1,
    leaving: null,
    task: null,
    layQ: [],
    col: (((a.id * 2654435761) >>> 0) % 997) / 997,
    hidden: false
  };
  if (home) {
    const p = rndIn(cageBox(g, home));
    g.x = p[0];
    g.y = p[1];
    g.z = floorZ(home);
  } else {
    g.x = PLOT.w * 0.5 + vrr(-6, 6);
    g.y = PLOT.h * 0.55 + vrr(-4, 4);
    g.zone = null;
  }
  if (from) {
    g.x = from[0];
    g.y = from[1];
    g.z = from[2] || 0;
    g.zone = null;
    routeTo(g, a.enc);
  }
  WV.agents.set(a.id, g);
  return g;
}
// The point on building c's wall nearest to x, y.
function edgePt(c, x, y) {
  const px = clamp(x, c.x, c.x + c.w),
    py = clamp(y, c.y, c.y + c.d),
    dl = px - c.x,
    dr = c.x + c.w - px,
    dt = py - c.y,
    db = c.y + c.d - py,
    m = Math.min(dl, dr, dt, db);
  if (m === db) return [px, c.y + c.d + 0.6];
  if (m === dr) return [c.x + c.w + 0.6, py];
  if (m === dl) return [c.x - 0.6, py];
  return [px, c.y - 0.6];
}
// Sends animal g to building id: out through its own door, along the ground and in, setting its new home.
function routeTo(g, id) {
  const tgt = id && compById(id),
    cur = g.zone && compById(g.zone);
  g.path = [];
  g.task = null;
  g.home = id;
  if (cur && (!tgt || cur.id !== tgt.id)) {
    const e = edgePt(cur, tgt ? tgt.x + tgt.w / 2 : g.x, tgt ? tgt.y + tgt.d / 2 : g.y);
    g.path.push({ x: e[0], y: e[1], z: 0, zone: null });
  }
  if (tgt) {
    const e = edgePt(tgt, g.x, g.y);
    g.path.push({ x: e[0], y: e[1], z: 0, zone: null });
    const p = rndIn(tgt);
    g.path.push({ x: p[0], y: p[1], z: floorZ(tgt), zone: id });
  } else
    g.path.push({
      x: clamp(g.x + vrr(-4, 4), 2, PLOT.w - 2),
      y: clamp(g.y + vrr(-4, 4), 2, PLOT.h - 2),
      z: 0,
      zone: null
    });
}
// Walking speed in ft a second: by kind, slower when unwell, faster when leaving the farm.
function speedOf(g) {
  const a = g.ref,
    k = kindOf(a),
    b = k === 'rab' ? 2.2 : k === 'kit' ? 0.9 : k === 'bird' ? 1.5 : 1.0;
  return b * (0.35 + 0.65 * clamp(a.health / 100, 0, 1)) * (g.leaving ? 1.3 : 1);
}
// move(g, dt) is in world/physics.js (steering, hops and jumps under gravity)

// Adds to g's path the walk to point pt (height z) inside building zoneId: through its door first when the
// path does not already end inside it (with no door to it, the animal is routed home instead); the end
// point is moved to where the body can stand (reachPt).
function goIn(g, zoneId, pt, z) {
  const zc = compById(zoneId);
  if (!zc) return;
  // phase 47: the zone the path already ends in (its last door hop), not only the one the animal stands
  // in. A hen in the run sent to a coop trough got two goIn calls, so her path went pop door, trough,
  // pop door again, trough: she walked in, turned back out to the door and came in a second time. A
  // second place in the same zone now follows on from the first without another door hop.
  let endZ = g.zone;
  for (const n of g.path) if ('zone' in n) endZ = n.zone;
  if (endZ !== zoneId) {
    const home = compById(g.home),
      K = home && WV.K[home.id];
    let door = null;
    if (K && K.runs) {
      const cand = K.runs.find(o => o.r.id === zoneId || o.r.id === g.zone);
      if (cand) door = cand.door;
    }
    if (door) g.path.push({ x: door[0], y: door[1], z: 0.2, zone: zoneId });
    else {
      routeTo(g, g.home);
      return;
    }
  }
  const zz = z != null ? z : floorZ(zc),
    q = reachPt(g, zc, pt, Math.abs(zz - floorZ(zc)) < 0.3);
  g.path.push({ x: q[0], y: q[1], z: zz });
}
// a spot the body can actually stand on (phase 24): at least its radius from the wire, walls and fences,
// and, on the floor, outside the feeders, waterers and hopper lips it collides with (nest boxes are
// left alone: kits and nesting does go inside). Before this, chicks aimed inside the brooder feeder and
// hens 0.25 ft from a trough, closer than their own body, so they stalled 1.2 s and gave up.
function reachPt(g, zc0, pt, floor) {
  // phase 28: in a hutch bank the spot stays inside the rabbit's own cage (zc is that cage's floor)
  const zc = cageBox(g, zc0),
    r = bodyR(g) + 0.02,
    ix = Math.min(Math.max(0.3, r), zc.w / 2),
    iy = Math.min(Math.max(0.3, r), zc.d / 2);
  let x = clamp(pt[0], zc.x + ix, zc.x + zc.w - ix),
    y = clamp(pt[1], zc.y + iy, zc.y + zc.d - iy);
  if (floor)
    for (let pass = 0; pass < 2; pass++)
      for (const b of obstaclesOf(zc0)) {
        const px = clamp(x, b.x, b.x + b.w),
          py = clamp(y, b.y, b.y + b.d),
          d = Math.hypot(x - px, y - py);
        // a spot inside a nest box is meant to be inside, but only for kits and a doe going in to pull
        // fur (phase 30: other rabbits' random spots landed in the box, which they may not enter, and
        // they gave up on them: 126 'nestbox' give-ups in the comfort replays)
        if (d >= r || (b.nest && d < 1e-6 && (kindOf(g.ref) === 'kit' || g.wantNest))) continue;
        if (d > 1e-6) {
          x = px + ((x - px) / d) * r;
          y = py + ((y - py) / d) * r;
        } else {
          // inside the box: out by the nearest side that stays in the pen
          const opts = [
            [b.x - r, y, x - b.x],
            [b.x + b.w + r, y, b.x + b.w - x],
            [x, b.y - r, y - b.y],
            [x, b.y + b.d + r, b.y + b.d - y]
          ].filter(o => o[0] >= zc.x + ix && o[0] <= zc.x + zc.w - ix && o[1] >= zc.y + iy && o[1] <= zc.y + zc.d - iy);
          if (opts.length) {
            opts.sort((a, b2) => a[2] - b2[2]);
            x = opts[0][0];
            y = opts[0][1];
          }
        }
        x = clamp(x, zc.x + ix, zc.x + zc.w - ix);
        y = clamp(y, zc.y + iy, zc.y + zc.d - iy);
      }
  return [x, y];
}
// Picks one key of ws at random, each with the chance of its weight (negative weights count as 0).
function pick(ws) {
  let s = 0;
  for (const k in ws) s += Math.max(0, ws[k]);
  let r = vr() * s;
  for (const k in ws) {
    r -= Math.max(0, ws[k]);
    if (r <= 0) return k;
  }
  return Object.keys(ws)[0];
}
// a resting spot in a tree's shade inside the run, if the tree's shade reaches the run (hot hours).
// The shade is the disc drawn under the tree (radius = the tree's shade radius, as in micro()).
// Phase 24: the old test compared centre distances, so a shade disc over one corner of a run was
// missed, and every bird aimed at the one point nearest the trunk; now a tree counts when its disc
// touches the run, and each bird picks its own spot in the inner 70% of the disc where it can.
function shadeOf(o) {
  let best = null,
    bd = 1e9;
  for (const t of pens('tree')) {
    const tc = ctr(t),
      px = clamp(tc[0], o.x, o.x + o.w),
      py = clamp(tc[1], o.y, o.y + o.d),
      d = Math.hypot(tc[0] - px, tc[1] - py);
    if (d < t.radius && d < bd) (bd = d), (best = t);
  }
  return best;
}
// A random point inside run o in the tree's shade at this hour when one can be found, else any point in the
// run.
function shadeIn(o) {
  const tr = shadeOf(o);
  if (!tr) return rndIn(o);
  const tc = ctr(tr);
  for (const f of [0.7, 0.95])
    for (let i = 0; i < 10; i++) {
      const p = rndIn(o);
      if (Math.hypot(p[0] - tc[0], p[1] - tc[1]) < tr.radius * f) return p;
    }
  return [clamp(tc[0], o.x + 0.5, o.x + o.w - 0.5) + vrr(-1, 1), clamp(tc[1], o.y + 0.5, o.y + o.d - 0.5) + vrr(-1, 1)];
}
// a resting spot beside a pen-mate that is standing still on the floor (cold hours: they huddle)
function nearMate(g, zc) {
  const L = [];
  for (const o of WV.agents.values())
    if (o !== g && o.zone === zc.id && !o.path.length && !o.leaving && !o.hidden && !o.jump && Math.abs(o.z - floorZ(zc)) < 0.3)
      if (cageBox(o, zc) === cageBox(g, zc)) L.push(o); // phase 28: not through a cage divider
  if (!L.length) return rndIn(cageBox(g, zc));
  // phase 24: lie down against a pen-mate that is itself lying down, so the pair stays together
  // (the comfort test found a cold rabbit often walked to a mate that then walked off)
  const R = L.filter(o => o.act === 'rest' || o.act === 'flop' || o.act === 'huddle' || o.act === 'roost'),
    LL = R.length ? R : L;
  const o = LL[Math.floor(vr() * LL.length)],
    an = vr() * Math.PI * 2,
    r = (sizeFt(o.ref) + sizeFt(g.ref)) * 0.4;
  return [o.x + Math.cos(an) * r, o.y + Math.sin(an) * r];
}
// phase 30: of a few candidate spots, the one with the most room: farthest from the pen-mates on the
// same level in the same cage, counting where a moving mate is heading. Kits and chicks aimed at
// spots a mate already filled and gave up on them (comfort replays: 836 kit and 662 chick give-ups
// of 2,002). Visual only; the model never sees it.
function clearPt(g, zc, cands) {
  clearPt.room = 3;
  if (cands.length < 2) return cands[0];
  const box = cageBox(g, zc),
    L = [];
  for (const o of WV.agents.values()) {
    if (o === g || o.zone !== zc.id || o.hidden || o.leaving || Math.abs(o.z - g.z) > 0.4) continue;
    if (box !== zc && cageBox(o, zc) !== box) continue;
    const t = o.path.length ? o.path[o.path.length - 1] : o;
    L.push([t.x, t.y, (sizeFt(o.ref) + sizeFt(g.ref)) * 0.38]);
  }
  let best = cands[0],
    bs = -1e9;
  for (const p of cands) {
    let m = 3;
    for (const q of L) m = Math.min(m, Math.hypot(p[0] - q[0], p[1] - q[1]) - q[2]);
    if (m > bs) (bs = m), (best = p);
  }
  clearPt.room = bs; // phase 32: how much room the chosen place has (below 0: it is taken)
  return best;
}
// phase 43: the same as clearPt, but each candidate is first moved to where the animal can really
// stand (reachPt, which goIn applies afterwards anyway). A kit judged the room at a point beside its
// mother or on a random spot, then goIn pushed it off the cage wall, the nest box or the hopper onto a
// point a littermate already held, and it gave up (phase 43 diagnostic: 45 of the 63 kit 'mate' give-ups
// while idling or resting came at points reachPt had moved, against 0 of 32 for rabbits at hoppers).
// Phase 42 did the same for brooder chicks at troughs and waterers. No dice, so the random sequence
// is only shifted by the animals' different choices. Visual only; the model never sees it.
function clearAt(g, zc, cands) {
  return clearPt(g, zc, cands.map(p => reachPt(g, zc, p, true)));
}
// phase 45: take-off points for the roost, [across the bar, along the bar] in ft from her place on it,
// the old point first. Both sides of the bar, a little either way along it; my choice, visual only.
const ROOST_FROM = [
  [0.25, 0],
  [-0.25, 0],
  [0.55, 0.3],
  [0.55, -0.3],
  [-0.55, 0.3],
  [-0.55, -0.3]
];
// phase 45: room at a floor point (x, y) of pen zc, against the pen-mates standing on the floor: each
// counts at the last floor-level point it is walking to (a hen heading for the roost counts at her
// take-off point, not at her place up on the bar), else where it stands. Below 0: taken. Same spacing
// rule as clearPt and separate(): (size + size) * 0.38 ft.
function floorRoom(g, zc, x, y) {
  const fz = floorZ(zc);
  let m = 3;
  for (const o of WV.agents.values()) {
    if (o === g || o.zone !== zc.id || o.hidden || o.leaving || o.jump || Math.abs(o.z - fz) > 0.4) continue;
    let t = o;
    for (let i = o.path.length - 1; i >= 0; i--)
      if (!('zone' in o.path[i]) && Math.abs((o.path[i].z != null ? o.path[i].z : fz) - fz) < 0.4) {
        t = o.path[i];
        break;
      }
    m = Math.min(m, Math.hypot(x - t.x, y - t.y) - (sizeFt(o.ref) + sizeFt(g.ref)) * 0.38);
  }
  return m;
}
// phase 30: where an out-of-the-nest kit lies down. FAO (x5082, thermoregulation): young rabbits that
// cannot yet curl up limit heat loss by huddling with the litter, moving apart when it is warm and
// huddling back when it cools. At 10 C (50 F) and below it lies against a resting littermate; the gap
// widens step by step up to 25 C (77 F), and above that it lies on a spot with room (also when hot).
// The two temperatures are FAO's for adults curling up and stretching out; using them for kits, and
// the straight-line widening between them, are choices.
function kitPile(g, home, tF) {
  const a = g.ref,
    cb = cageBox(g, home),
    free = () => clearAt(g, home, [rndIn(cb, 0.3), rndIn(cb, 0.3), rndIn(cb, 0.3)]);
  if (tF > 77 || g.hot) return free();
  const L = [];
  for (const o of WV.agents.values())
    if (o !== g && o.zone === home.id && o.ref.st === 'kit' && o.ref.mother === a.mother && !o.path.length && !o.jump)
      if (o.act === 'huddle' || o.act === 'rest') L.push(o);
  if (!L.length) return free();
  const o = L[Math.floor(vr() * L.length)],
    r = (sizeFt(o.ref) + sizeFt(a)) * (0.36 + 0.44 * Math.min(1, Math.max(0, (tF - 50) / 27))),
    c = [];
  for (let i = 0; i < 4; i++) {
    const an = vr() * Math.PI * 2;
    c.push([o.x + Math.cos(an) * r, o.y + Math.sin(an) * r]);
  }
  return clearAt(g, home, c);
}
// ---------- comfort behaviour and dawn crowing (phase 23, visual only) ----------
// Dust bathing needs soft, dry material (Merck): not while rain or snow falls, not on snow or wet ground.
function dustOk() {
  const w = typeof wxNow === 'function' ? wxNow() : null;
  return !w || (!(w.falling > 0) && !(w.depth > 0.3) && !(w.wetG > 0.3));
}
// Dust bathing and preening are synchronous social behaviours (Alabama Extension): a hen is likelier
// to start when a pen-mate in the same pen is already doing it.
function mateDoing(g, act) {
  for (const o of WV.agents.values()) if (o !== g && o.zone === g.zone && o.act === act && !o.hidden) return true;
  return false;
}
// Roosters start crowing about 2 hours before dawn by their own clock (Shimmura and Yoshimura 2013).
// The window here runs from 2 hours before sunrise to 1 hour after; how often is an illustration.
function crowWindow() {
  const sn = WV.sun;
  if (!sn) return false;
  const d = WV.hour - sn.rise;
  return d > -2 && d < 1;
}
// Fur in a doe's nest: none until 3 days before kindling, then more each day; kept as a blanket over
// the kits while they nurse (FAO: she pulls fur from her abdomen before kindling). Timing is an illustration.
function furLevel(a) {
  if (!a) return 0;
  if (a.preg != null && a.gestLen) {
    const left = a.gestLen - a.preg;
    return left > 3 ? 0 : clamp((4 - left) / 4, 0, 1);
  }
  if (a.kindle != null && S.day - a.kindle < P.rb_wean) return 1;
  return 0;
}
// ---------- chick dust bathing in the brooder (phase 26, visual only) ----------
// Chicks dust-bathe too, starting at 1 to 2 weeks old (Merck Veterinary Manual, "Behavior of Poultry").
// The brooder has no run, so they do it in its litter (wood shavings count as soft, dry material, Merck).
// The urge rises from none at 7 days to full at 14 days; that straight ramp is an illustration.
function chickDustF(a) {
  return clamp(((a && a.age) - 7) / 7, 0, 1);
}
// Crowded birds lack the room to dust-bathe (Merck); the brooder is crowded when its chicks need more
// floor than it has at the floor-per-chick setting (the same rule the model's space load uses).
function broodRoomy(home, K) {
  return !home || !K || (K.n || 0) * P.ck_brood_sqft <= home.w * home.d + 1e-9;
}
// Dust bathing is social and birds do it together, often touching (Merck): beside a pen-mate that is
// already dust-bathing when there is one, else a free spot in the litter away from the lamp.
// A chick counts as at it while it dust-bathes or while it is on its way to a bath (its task says so).
function dustSpotOf(o) {
  if (o.act === 'dust' && !o.moving) return [o.x, o.y];
  if (o.task && o.task.act === 'dust' && o.path.length) {
    const q = o.path[o.path.length - 1];
    return [q.x, q.y];
  }
  return null;
}
// How strongly a chick is drawn to a bath: 12x when pen-mates are already at it (social), but none
// once a third of the brooder's chicks (at least 2) are, so the whole brood does not pile in at once.
// The 12x and the one-third cap are an illustration.
function chickDusting(g) {
  let at = 0,
    n = 0;
  for (const o of WV.agents.values())
    if (o !== g && o.zone === g.zone && !o.hidden && o.ref.st === 'chick') {
      n++;
      if (dustSpotOf(o)) at++;
    }
  if (at >= Math.max(2, Math.ceil((n + 1) / 3))) return 0;
  return at ? 12 : 1;
}
// Places where a chick can join a dust bath already going in its brooder (6 round a bathing chick, phase 50),
// or one free litter spot when nobody is bathing.
function dustMate(g, zc, K) {
  const L = [];
  for (const o of WV.agents.values())
    if (o !== g && o.zone === zc.id && !o.hidden) {
      const q = dustSpotOf(o);
      if (q) L.push([o, q]);
    }
  if (L.length) {
    // phase 50: six places round the bather, a sixth of a turn apart from the one random angle (no new
    // dice); think() takes the one with most room where the chick will really stand (clearAt). Before,
    // the one random place often lay on another bather of the group or was moved by reachPt onto one,
    // and the chick gave up there (phase 50 diagnostic: 68 of 71 dust give-ups came when joining, the
    // nearest chick was the joined bather in only 6). Six places is my choice.
    const [o, q] = L[Math.floor(vr() * L.length)],
      an = vr() * Math.PI * 2,
      r = (sizeFt(o.ref) + sizeFt(g.ref)) * 0.45;
    return [0, 1, 2, 3, 4, 5].map(i => [q[0] + Math.cos(an + (i * Math.PI) / 3) * r, q[1] + Math.sin(an + (i * Math.PI) / 3) * r]);
  }
  let p = rndIn(zc, 0.3);
  if (K && K.lamp) {
    // the chicks under the lamp are resting; a bath is scraped out a little way from them
    for (let i = 0; i < 3 && Math.hypot(p[0] - K.lamp[0], p[1] - K.lamp[1]) < 0.7; i++) p = rndIn(zc, 0.3);
  }
  return [p];
}
// Chooses what animal g does next when it has nothing left to do: a task (eat, drink, rest, roost, lay, dust
// bath, wander ...) picked from the hour, the weather, its feed and water left today and its pen, and the path
// to walk there. Visual only: reads the model, never changes it.
function think(g) {
  // ==== Common set-up for every kind ====
  // Its pen and the pen's fixtures (K), the model's numbers for it (v: feed and water left, pen highs and
  // lows), health 0..1, night, hot and cold. Clears the old task and path. With no pen it ambles nearby.
  const a = g.ref,
    home = g.home && compById(g.home),
    K = home && WV.K[home.id],
    v = WV.vis.get(a.id) || { it: { feed: 0, water: 0 }, m: { tmax: 60, tmin: 40 } },
    h = clamp(a.health / 100, 0, 1),
    night = WV.sun && WV.sun.night,
    hot = hotNow(v),
    chill = coldNow(v),
    k = kindOf(a);
  g.hot = hot; // hot animals keep more space between them (physics.js)
  g.chill = chill;
  g.wantNest = 0;
  g.task = null;
  g.path = [];
  if (!home) {
    g.path = [{ x: clamp(g.x + vrr(-3, 3), 2, PLOT.w - 2), y: clamp(g.y + vrr(-3, 3), 2, PLOT.h - 2), z: 0 }];
    g.task = { act: 'idle', dur: vrr(1, 3) };
    return;
  }
  const jit = (p, r) => [p[0] + vrr(-r, r), p[1] + vrr(-r, r)];
  // ==== Kits (baby rabbits) ====
  // Under 18 days old they huddle in the nest box. Older kits rest (nest box or the litter pile), stay by
  // their mother, eat, drink or explore their cage; apart from resting they wait a second when every
  // place is taken (goOr).
  if (k === 'kit') {
    const mg = a.mother && WV.agents.get(a.mother),
      nest = K && K.nestOf && K.nestOf[a.mother],
      cb = cageBox(g, home),
      tF = hourTemp(v.m),
      inNest = () => [nest.x + 0.15 + vr() * (nest.w - 0.3), nest.y + 0.15 + vr() * (nest.d - 0.3)];
    if (a.age < 18 && nest) {
      goIn(g, home.id, inNest());
      g.task = { act: 'huddle', dur: vrr(3, 7) };
      return;
    }
    // phase 30: out of the nest. FAO (x5082): from the third week the young begin to move about, take
    // a little drinking water and, within a few days, more solid feed and water than milk. They rest in
    // the nest box while it is still there (until weaning, world/cages.js) or with their littermates,
    // and otherwise stay near their mother. The weights and nest-box shares are illustrations.
    const solid = a.age >= 21 ? Math.min(1, (a.age - 20) / 10) : 0,
      wk = {
        rest: 1.0 + (night ? 0.8 : 0) + (chill ? 0.5 : 0),
        mother: mg && mg.zone === g.zone ? 0.9 : 0,
        eat: 0.7 * solid,
        drink: a.age >= 21 ? 0.3 : 0,
        explore: 0.45 * h
      },
      c = pick(wk),
      [hop, bot] = rabFix(g, home, K),
      // phase 43: when every place it looked at is taken even where it would stand (clearAt), the kit
      // stays where it is and looks again a second later, as a chick waits its turn at a full trough
      // (phase 32/42), instead of walking onto a littermate and giving up there. Resting by the litter
      // is left out: kits lie touching there on purpose (kitPile). The task's dice are drawn either way.
      goOr = (p, t) => {
        if (clearPt.room < 0) g.task = { act: 'idle', dur: 1, waiting: 1 };
        else {
          goIn(g, home.id, p);
          g.task = t;
        }
      };
    if (c === 'rest') {
      // the nest box (fur-lined, warm) draws them less as it warms: 60% of rests at 50 F and below,
      // 20% at 77 F, none above or when hot (an illustration of FAO's move-apart-when-warm)
      const pNest = tF > 77 || g.hot ? 0 : 0.6 - 0.4 * Math.min(1, Math.max(0, (tF - 50) / 27));
      goIn(g, home.id, nest && vr() < pNest ? clearAt(g, home, [inNest(), inNest()]) : kitPile(g, home, tF));
      g.task = { act: 'huddle', dur: vrr(4, 9) };
    } else if (c === 'mother') {
      // beside her, not under her: a ring at the two bodies' spacing, on the side with most room
      const r = (sizeFt(mg.ref) + sizeFt(a)) * 0.45,
        mt = mg.path.length ? mg.path[mg.path.length - 1] : mg,
        cs = [];
      for (let i = 0; i < 5; i++) {
        const an = vr() * Math.PI * 2;
        cs.push([mt.x + Math.cos(an) * r, mt.y + Math.sin(an) * r]);
      }
      goOr(clearAt(g, home, cs), { act: vr() < 0.35 ? 'rest' : 'idle', dur: vrr(1.5, 4) });
    } else if (c === 'eat') {
      goOr(clearAt(g, home, [jit([hop[0], hop[1] - 0.3], 0.3), jit([hop[0], hop[1] - 0.3], 0.3), jit([hop[0], hop[1] - 0.3], 0.3)]), { act: 'eat', dur: vrr(1.5, 3.5) });
    } else if (c === 'drink') {
      goOr(clearAt(g, home, [jit([bot[0], bot[1] - 0.3], 0.2), jit([bot[0], bot[1] - 0.3], 0.2)]), { act: 'drink', dur: vrr(1, 2) });
    } else {
      goOr(clearAt(g, home, [rndIn(cb, 0.3), rndIn(cb, 0.3), rndIn(cb, 0.3)]), { act: 'idle', dur: vrr(0.6, 2) });
    }
    return;
  }
  // ==== Grown and growing rabbits ====
  // Eat, drink, rest, roam, groom, stretch or (a doe with a nest box) go to the nest, all inside its own
  // cage of the hutch bank. A fight in its grower group sends it to a random spot, and a crowded grower
  // hopper often makes it wait a little way off.
  if (k === 'rab') {
    const base = P.rb_feed_m / 16,
      w = {
        eat: 1.0 * Math.max(0.3, v.it.feed / base),
        drink: (0.7 * v.it.water) / 0.12,
        rest: 0.7 + 2.2 * (1 - h) + (hot ? 1.6 : 0) + (chill ? 0.8 : 0),
        roam: (a.st === 'grower' ? 1.7 : 1.1) * h * (K.dens > 1 ? 0.5 : 1),
        groom: 0.4,
        stretch: K.dens > 1 ? 0 : 0.12 * h
      };
    const nest = K.nestOf && K.nestOf[a.id];
    if (nest) w.nest = a.preg != null ? 1.3 + 2 * furLevel(a) : 0.9;
    const c = pick(w);
    const rg = rgOf(a);
    const cb = cageBox(g, home); // phase 28: its own cage in the bank (world/cages.js)
    if (rg && rg.fight && vr() < 0.35) {
      goIn(g, home.id, rndIn(cb));
      g.task = { act: 'idle', dur: vrr(0.2, 0.6) };
      return;
    }
    // each rabbit uses a hopper and bottle on its own cage's front wire (spread by id, no dice)
    const [hop, bot] = rabFix(g, home, K);
    if (c === 'eat' && rg && rg.crowded && vr() < 0.6) {
      const an = vr() * Math.PI * 2;
      goIn(g, home.id, [
        clamp(hop[0] + Math.cos(an) * 1.2, cb.x + 0.3, cb.x + cb.w - 0.3),
        clamp(hop[1] - 0.4 + Math.sin(an) * 0.6, cb.y + 0.3, cb.y + cb.d - 0.3)
      ]);
      g.task = { act: 'idle', dur: vrr(2, 4), waiting: 1 };
    } else if (c === 'eat') {
      // phase 49: growers sharing a cage all walked to the one point in front of its single hopper and
      // gave up on it when a cage-mate was already there (phase 49 diagnostic: 26 of 30 adult-rabbit
      // feeding give-ups had the nearest mate at the same hopper; 25 were growers, three to a cage). Now
      // it also looks at a place either side of the hopper, its head still at the lip, judges each where
      // it will really stand (clearAt) and waits a second where it is when all three are taken. A rabbit
      // alone in its cage takes the old point (clearPt keeps the first when nothing is near). The two side
      // places and the wait are my choices; visual only, the model never sees it.
      const p = clearAt(g, home, [jit([hop[0], hop[1] - 0.4], 0.2), [hop[0] - 0.38, hop[1] - 0.38], [hop[0] + 0.38, hop[1] - 0.38]]);
      if (clearPt.room < 0) g.task = { act: 'idle', dur: 1, waiting: 1 };
      else {
        goIn(g, home.id, p);
        g.task = { act: 'eat', dur: vrr(2.5, 5) };
      }
    } else if (c === 'drink') {
      // phase 49: the same at the drinker tube: straight in front of it or a little to either side
      const p = clearAt(g, home, [jit([bot[0], bot[1] - 0.35], 0.15), [bot[0] - 0.3, bot[1] - 0.3], [bot[0] + 0.3, bot[1] - 0.3]]);
      if (clearPt.room < 0) g.task = { act: 'idle', dur: 1, waiting: 1 };
      else {
        goIn(g, home.id, p);
        g.task = { act: 'drink', dur: vrr(1.5, 3) };
      }
    } else if (c === 'nest' && a.preg != null && furLevel(a) > 0) {
      // in the last days she sits in the box pulling fur from her belly to line it
      g.wantNest = 1;
      goIn(g, home.id, [nest.x + nest.w / 2, nest.y + nest.d * 0.55]);
      g.task = { act: 'pullfur', dur: vrr(4, 8) };
    } else if (c === 'nest') {
      goIn(g, home.id, [nest.x + nest.w / 2, nest.y + nest.d + 0.3]);
      g.task = { act: 'nest', dur: vrr(3, 6) };
    } else if (c === 'rest' && chill) {
      goIn(g, home.id, nearMate(g, home)); // cold: lies against a cage-mate on purpose
      g.task = { act: hot ? 'flop' : 'rest', dur: vrr(4, 9) };
    } else if (c === 'rest') {
      // phase 49: of two spots in the cage, the one with more room where it will really stand; when both
      // are taken it lies down where it is (rest and flop gave up 10 to 14 times a replay on taken spots)
      const p = clearAt(g, home, [rndIn(cb), rndIn(cb)]);
      if (clearPt.room >= 0) goIn(g, home.id, p);
      g.task = { act: hot ? 'flop' : 'rest', dur: vrr(4, 9) };
    } else if (c === 'groom') g.task = { act: 'groom', dur: vrr(3, 7), part: vr() < 0.55 ? 0 : 1 };
    else if (c === 'stretch') g.task = { act: 'stretch', dur: vrr(1.2, 2.2) };
    else {
      // phase 49: roaming the same way; when both spots are taken it stays where it is
      const p = clearAt(g, home, [rndIn(cb), rndIn(cb)]);
      if (clearPt.room >= 0) goIn(g, home.id, p);
      g.task = { act: 'idle', dur: vrr(0.4, 1.5) };
    }
    return;
  }
  // ==== Chicks ====
  // In a brooder: huddle under the lamp when cold or at night, else eat, drink, roam, rest or dust-bathe
  // at a place with room, waiting their turn when it is taken. Chicks in any other pen just idle there.
  if (k === 'chick') {
    if (home.type === 'brooder') {
      const l = K.lamp,
        cold = v.cold || night;
      if (cold) {
        const rr = v.cold ? 0.35 : 0.7;
        goIn(g, home.id, jit(l, rr));
        g.task = { act: 'huddle', dur: vrr(3, 6) };
        return;
      }
      const wc = { eat: 1, drink: 0.7, roam: 1.2, rest: 0.6 },
        df = chickDustF(a);
      // phase 26: dust baths in the litter from 1 to 2 weeks old, not when the brooder is crowded or
      // the chick is too hot; joining pen-mates already at it is likelier (weights are an illustration)
      if (df > 0 && !hot && broodRoomy(home, K)) wc.dust = 0.15 * df * h * chickDusting(g);
      const c = pick(wc);
      // a place round the feeder or drinker (they stand at its rim, not on it); reachPt keeps it clear
      // phase 30: of three places round the rim, the one with most room (clearPt)
      // phase 33: the rim is along either side of a trough or round a waterer, of the troughs and
      // waterers broodGear sized from the chick count; each place keeps the point it faces (o)
      const rimAt = (kind) => {
        const cs = [];
        for (let i = 0; i < 3; i++) {
          if (kind === 'eat') {
            // phase 36: a longer trough piece takes more chicks (one draw, so one trough picks as before)
            let rr = vr() * K.btr.reduce((s2, q) => s2 + Math.max(q.w, q.d), 0),
              t = K.btr[K.btr.length - 1];
            for (const q of K.btr) {
              rr -= Math.max(q.w, q.d);
              if (rr < 0) {
                t = q;
                break;
              }
            }
            const long = t.w >= t.d,
              u = vr(),
              side = vr() < 0.5;
            if (long) {
              const px = t.x + 0.08 + u * Math.max(0, t.w - 0.16);
              cs.push({ p: [px, side ? t.y - 0.17 : t.y + t.d + 0.17], o: [px, t.y + t.d / 2] });
            } else {
              const py = t.y + 0.08 + u * Math.max(0, t.d - 0.16);
              cs.push({ p: [side ? t.x - 0.17 : t.x + t.w + 0.17, py], o: [t.x + t.w / 2, py] });
            }
          } else {
            const f = K.bfo[Math.floor(vr() * K.bfo.length)],
              an = vr() * Math.PI * 2;
            cs.push({ p: [f.x + Math.cos(an) * (f.r + 0.17), f.y + Math.sin(an) * (f.r + 0.17)], o: [f.x, f.y] });
          }
        }
        // phase 42: each place is first moved to where the chick can really stand (reachPt, the same
        // move goIn makes), so the room is judged where it will stand; before, a place behind a trough
        // against the wall or on top of another trough was judged where it was drawn, the chick was sent
        // somewhere else, found it taken and gave up (130 feeder and 38 waterer give-ups in why.py)
        for (const q of cs) q.p = reachPt(g, home, q.p, true);
        const p = clearPt(g, home, cs.map(q => q.p));
        return cs.find(q => q.p === p);
      };
      // phase 32: when even the roomiest of the places is taken, it waits its turn a little way off
      // (a chick's length further out) instead of pushing in; it picks again a moment later
      const turn = (kind, act, dur) => {
        const q = rimAt(kind),
          p = q.p,
          o = q.o;
        if (clearPt.room < 0) {
          // phase 42: of three waiting spots a chick's length out (straight out and 0.6 rad either side),
          // the one with most room (the angles are a choice)
          const an = Math.atan2(p[1] - o[1], p[0] - o[0]),
            ws = [0, 0.6, -0.6].map(da => reachPt(g, home, [p[0] + Math.cos(an + da) * 0.35, p[1] + Math.sin(an + da) * 0.35], true));
          const wp = clearPt(g, home, ws);
          // phase 46: when every waiting spot is taken too, it waits where it stands. Before, it walked
          // to the least-crowded taken spot and gave up there (78 to 93 waiting give-ups a replay)
          if (clearPt.room >= 0 || g.zone !== home.id) goIn(g, home.id, wp);
          g.task = { act: 'idle', dur: vrr(0.6, 1.4), waiting: 1 };
        } else {
          goIn(g, home.id, p);
          g.task = { act, dur };
        }
      };
      if (c === 'eat' && K.btr && K.btr.length) {
        turn('eat', 'peck', vrr(1.5, 3));
      } else if (c === 'drink' && K.bfo && K.bfo.length) {
        turn('drink', 'drink', vrr(1, 2));
      } else if (c === 'dust') {
        // phase 50: when every place round the bather it joins is taken, it waits a second where it stands
        // (as at a full trough) and picks again; still walks when it is not in its brooder yet
        const ds = dustMate(g, home, K),
          dp = clearAt(g, home, ds);
        if (ds.length > 1 && clearPt.room < 0 && g.zone === home.id) {
          g.task = { act: 'idle', dur: 1, waiting: 1, dust: 1 };
        } else {
          goIn(g, home.id, dp);
          g.task = { act: 'dust', dur: vrr(4, 9) };
        }
      } else if (c === 'rest') {
        goIn(g, home.id, jit(l, 0.6));
        g.task = { act: 'huddle', dur: vrr(2, 5) };
      } else {
        // phase 46: the two places are judged where the chick will really stand (clearAt, as kits and hens
        // do since phases 43 and 44); when both are taken it stays where it is this turn. Before, about half
        // of its roaming give-ups came at a place reachPt had moved, and the rest at a place already taken
        const rp = clearAt(g, home, [rndIn(home, 0.3), rndIn(home, 0.3)]);
        if (clearPt.room >= 0 || g.zone !== home.id) goIn(g, home.id, rp);
        g.task = { act: 'idle', dur: vrr(0.3, 1) };
      }
      return;
    }
    goIn(g, home.id, rndIn(home));
    g.task = { act: 'idle', dur: vrr(1, 3) };
    return;
  }
  // ==== Grown and growing chickens ====
  // In this order: not in a coop (idle), laying, a rooster crowing before dawn, roosting at night, coming
  // in from the rain, then a daytime choice: forage, eat, drink, dust-bathe, watch the rain, preen,
  // stretch, flap, rest or roam.
  if (home.type !== 'coop') {
    goIn(g, home.id, rndIn(home));
    g.task = { act: 'idle', dur: vrr(1, 3) };
    return;
  }
  // ---- laying: a hen with an egg due walks to the front of a nest box and steps in (daytime) ----
  if (g.layQ.length && !night && K.nests.length) {
    const n = K.nests[Math.floor(vr() * K.nests.length)];
    goIn(g, home.id, [n.x + n.w / 2, n.y + n.d + 0.2]);
    g.path.push({ x: n.x + n.w / 2, y: n.y + n.d / 2, z: n.z });
    g.task = { act: 'lay', dur: vrr(2.2, 3.5), nest: n };
    return;
  }
  const ac = accessOf(a);
  // ---- a rooster may crow where he stands in the 2 hours before dawn (35% of his choices) ----
  if (a.st === 'rooster' && crowWindow() && vr() < 0.35) {
    // crows where he stands, on the perch before dawn
    g.task = { act: 'crow', dur: vrr(1.6, 2.6) };
    return;
  }
  // ---- night: floor sleepers lie down, the rest go to their place on the roost frame ----
  if (night) {
    // phase 47: a hen coming in from the run at dusk walks through the pop door straight to her floor
    // spot or take-off point (goIn adds the door). Before, she first walked to a random spot in the coop
    // and then, through a second door hop, back to the pop door and in again.
    const p = K.perch;
    if (ac && ac.floor) {
      goIn(g, home.id, [home.x + home.w * vrr(0.35, 0.9), home.y + home.d * vrr(0.55, 0.9)]);
      g.task = { act: 'rest', dur: vrr(5, 9), floor: 1 };
      return;
    }
    // roost frame: each bar holds (bar length / perch per bird) birds, filled from the first bar on
    const bars = K.perches && K.perches.length ? K.perches : [p],
      per = bars.map(b => Math.max(1, Math.floor((barLen(b) * 12) / Math.max(0.1, P.ck_perch)))),
      allSlots = per.reduce((s2, v2) => s2 + v2, 0);
    let idx = (ac ? ac.perchIdx : (g.col * 997) | 0) % allSlots,
      bi = 0;
    while (bi < bars.length - 1 && idx >= per[bi]) idx -= per[bi++];
    const bar = bars[bi],
      sp = barLen(bar) / per[bi];
    if (g.zone === home.id) {
      // phase 45: where she jumps up from. Each hen used to walk to one point 0.25 ft beside her own
      // place on the bar, but the places are only (perch per bird) apart, 0.5 to 0.6 ft on the default
      // coop, while two hens standing on the floor need 0.57 to 0.84 ft (separate()'s spacing), so at
      // dusk the hens heading for neighbouring places blocked each other there (phase 45 diagnostic:
      // every roost give-up in the replays, 12 to 16 each, came at that floor point with another
      // roost-bound hen beside it). Now she looks at six take-off points on both sides of the bar near
      // her place, each judged where she can really stand (reachPt), and takes the roomiest against the
      // coop-mates on the floor and the floor points they are heading for, keeping the old point while it
      // has room. When all six are taken she waits a second and looks again (at most twice, then she goes
      // anyway). The jump up is at most 0.63 ft. Her place on the bar is unchanged. No dice; visual only.
      const sx = bar.ax === 'x' ? bar.x0 + (idx + 0.5) * sp : bar.x,
        sy = bar.ax === 'x' ? bar.y : bar.y0 + (idx + 0.5) * sp;
      let best = null,
        bs = -1e9,
        br = -1e9;
      for (const o of ROOST_FROM) {
        const ox = bar.ax === 'x' ? o[1] : o[0],
          oy = bar.ax === 'x' ? o[0] : o[1],
          q = reachPt(g, home, [sx + ox, sy + oy], true),
          rm = floorRoom(g, home, q[0], q[1]),
          s = Math.min(rm, 0.2) - 0.2 * Math.hypot(ox, oy);
        if (s > bs) (bs = s), (best = q), (br = rm);
      }
      if (br < 0 && (g.roostWaits || 0) < 2) {
        g.roostWaits = (g.roostWaits || 0) + 1;
        g.task = { act: 'idle', dur: 1, waiting: 1 };
        return;
      }
      g.roostWaits = 0;
      g.path.push({ x: best[0], y: best[1], z: floorZ(home) });
      g.path.push(bar.ax === 'x' ? { x: sx + vrr(-0.03, 0.03), y: bar.y, z: bar.z } : { x: bar.x, y: sy + vrr(-0.03, 0.03), z: bar.z });
      g.task = { act: 'roost', dur: vrr(5, 9) };
      return;
    }
    if (bar.ax === 'x') {
      // phase 38: a bar of the second roost that runs along x
      const px = bar.x0 + (idx + 0.5) * sp;
      goIn(g, home.id, [px, bar.y + 0.25]);
      g.path.push({ x: px + vrr(-0.03, 0.03), y: bar.y, z: bar.z });
    } else {
      const py = bar.y0 + (idx + 0.5) * sp;
      goIn(g, home.id, [bar.x + 0.25, py]);
      g.path.push({ x: bar.x, y: py + vrr(-0.03, 0.03), z: bar.z });
    }
    g.task = { act: 'roost', dur: vrr(5, 9) };
    return;
  }
  // ---- rain or snow: a bird out in the run comes back in and shakes off ----
  // rain or snow falling (phase 25, visual only): hens use an outdoor range most at moderate
  // temperatures with low humidity, no drizzle and no strong wind (Deutsch et al. 2024, "Space use of
  // free-range laying hens on two outdoor ranges with different amounts of vegetation cover"), so a
  // bird out in the run comes back under the coop roof, and shakes the water off when it gets in.
  // In light rain (under 0.04 in an hour) a few still step out for a short forage; in heavier rain or
  // snow none do. The 0.12 share is an illustration.
  const fall = wxFallNow(),
    runs = K.runs || [];
  if (fall && g.zone !== home.id) {
    const zc = compById(g.zone);
    if (zc && zc.type === 'run') {
      goIn(g, home.id, rndIn(home, 0.8));
      g.task = { act: 'shake', dur: vrr(0.7, 1.2) };
      return;
    }
  }
  // ---- daytime choice: weights from feed and water left, health, heat, rain and crowding ----
  const w = {
    eat: Math.max(0.3, v.it.feed / P.ck_feed),
    drink: 0.7 * (hot ? 1.6 : 1),
    roam: 0.8 * h,
    rest: 0.4 + 2 * (1 - h) + (hot ? 1.2 : 0)
  };
  if (runs.length) w.forage = 1.8 * h * (fall ? (fall.snow || fall.rate >= 0.04 ? 0 : 0.12) : 1);
  // some hens stand just inside the pop door looking out while it rains; this and how often are an
  // illustration
  if (fall && runs.length) w.watch = 0.3;
  // comfort behaviour (Alabama Extension, Merck): preening, stretching, wing flapping and dust bathing;
  // crowded birds lack the room to flap or dust-bathe (Merck). Weights are an illustration.
  const roomy = !(ac && ac.crowded);
  w.preen = 0.35 * (mateDoing(g, 'preen') ? 2.5 : 1);
  w.stretch = 0.08;
  if (roomy) w.flap = 0.06;
  if (roomy && !hot && dustOk()) w.dust = 0.3 * h * (mateDoing(g, 'dust') ? 4 : 1);
  const c = pick(w);
  if (c === 'forage') {
    const o = runs[Math.floor(vr() * runs.length)].r;
    const p = hot ? shadeIn(o) : rndIn(o);
    goIn(g, o.id, p);
    g.task = { act: hot ? 'pant' : 'peck', dur: vrr(2, 6) };
    if (fall) g.rainCut = 1; // went out in light rain on purpose: no turning back at the door
  } else if (c === 'eat' || c === 'drink') {
    // a spot along a trough side or round a fount (troughs and founts from the coop's settings)
    let at = c === 'eat' ? K.feeder : K.water,
      judged = false;
    if (c === 'eat' && K.troughs && K.troughs.length) {
      const t = K.troughs[a.id % K.troughs.length];
      at = [t.x + t.w * vr(), a.id % 2 ? t.y - 0.25 : t.y + t.d + 0.25];
    } else if (c === 'drink' && K.founts && K.founts.length) {
      const f = K.founts[a.id % K.founts.length],
        an2 = vr() * Math.PI * 2;
      at = [f.x + Math.cos(an2) * (f.r + 0.25), f.y + Math.sin(an2) * (f.r + 0.25)];
    }
    // phase 44: a hen already in the coop and not crowded looks at three places (the one above, one
    // more along its own trough side or round its own fount, and one at the next trough side or fount),
    // each moved first to where she can really stand (clearAt: reachPt then clearPt), and takes the one
    // with most room. Before, she was sent to one place, reachPt pushed her off the trough onto a point
    // a flock-mate held, and she gave up there (phase 43 diagnostic: 12 of 16 'mate' give-ups at coop
    // troughs came at points reachPt had moved). When every place is taken she waits a second where she
    // is, as kits (phase 43) and brooder chicks (phase 32) do. Birds coming in from the run keep the old
    // single place (their pen-mates on the coop floor are on another level until they get in).
    // The three-place search is a choice. Visual only; the model never sees it.
    if (g.zone === home.id && !(ac && ac.crowded) && ((c === 'eat' && K.troughs && K.troughs.length) || (c === 'drink' && K.founts && K.founts.length))) {
      const cs = [jit(at, c === 'eat' ? 0.1 : 0.08)];
      if (c === 'eat') {
        const n = K.troughs.length,
          t1 = K.troughs[a.id % n],
          sd1 = a.id % 2,
          t2 = K.troughs[(a.id + (n > 1 ? 1 : 0)) % n],
          sd2 = n > 1 ? sd1 : 1 - sd1;
        cs.push(jit([t1.x + t1.w * vr(), sd1 ? t1.y - 0.25 : t1.y + t1.d + 0.25], 0.1));
        cs.push(jit([t2.x + t2.w * vr(), sd2 ? t2.y - 0.25 : t2.y + t2.d + 0.25], 0.1));
      } else {
        const n = K.founts.length,
          f1 = K.founts[a.id % n],
          f2 = K.founts[(a.id + 1) % n];
        for (const f of [f1, f2]) {
          const an3 = vr() * Math.PI * 2;
          cs.push(jit([f.x + Math.cos(an3) * (f.r + 0.25), f.y + Math.sin(an3) * (f.r + 0.25)], 0.08));
        }
      }
      at = clearAt(g, home, cs);
      judged = true;
      if (clearPt.room < 0) {
        g.task = { act: 'idle', dur: 1, waiting: 1 };
        return;
      }
    }
    // phase 47: a hen in the run gets one path, pop door then her place (goIn adds the door); the old
    // extra goIn here sent her to the trough, back out to the door and to the trough again.
    if (judged) {
      goIn(g, home.id, at);
      g.task = c === 'eat' ? { act: 'peck', dur: vrr(2, 4) } : { act: 'drink', dur: vrr(1, 2.5) };
    } else if (ac && ac.crowded) {
      const an = vr() * Math.PI * 2;
      goIn(g, home.id, [
        clamp(at[0] + Math.cos(an) * 1.5, home.x + 0.4, home.x + home.w - 0.4),
        clamp(at[1] + Math.sin(an) * 1.5, home.y + 0.4, home.y + home.d - 0.4)
      ]);
      g.task = { act: 'idle', dur: vrr(2, 4), waiting: 1 };
    } else if (c === 'eat') {
      goIn(g, home.id, jit(at, K.troughs ? 0.1 : 0.45));
      g.task = { act: 'peck', dur: vrr(2, 4) };
    } else {
      goIn(g, home.id, jit(at, K.founts ? 0.08 : 0.3));
      g.task = { act: 'drink', dur: vrr(1, 2.5) };
    }
  } else if (c === 'dust') {
    // in the run's soil when there is one, else in the coop litter
    const zc = runs.length ? runs[Math.floor(vr() * runs.length)].r : home;
    goIn(g, zc.id, rndIn(zc));
    g.task = { act: 'dust', dur: vrr(6, 12) };
  } else if (c === 'watch') {
    const o = runs[Math.floor(vr() * runs.length)],
      d = o.door,
      cc = [home.x + home.w / 2, home.y + home.d / 2],
      dl = Math.hypot(cc[0] - d[0], cc[1] - d[1]) || 1;
    goIn(g, home.id, [d[0] + ((cc[0] - d[0]) / dl) * 1.1 + vrr(-0.4, 0.4), d[1] + ((cc[1] - d[1]) / dl) * 1.1 + vrr(-0.4, 0.4)]);
    g.task = { act: 'idle', dur: vrr(3, 7) };
  } else if (c === 'preen') g.task = { act: 'preen', dur: vrr(3, 6) };
  else if (c === 'stretch') g.task = { act: 'stretch', dur: vrr(1.2, 2) };
  else if (c === 'flap') g.task = { act: 'flap', dur: vrr(0.8, 1.4) };
  else if (c === 'rest') {
    const zc = compById(g.zone) || home;
    goIn(g, zc.id, hot && zc.type === 'run' ? shadeIn(zc) : chill ? nearMate(g, zc) : rndIn(zc));
    g.task = { act: hot ? 'pant' : 'rest', dur: vrr(3, 7) };
  } else {
    const zc = compById(g.zone) || home;
    goIn(g, zc.id, rndIn(zc));
    g.task = { act: 'idle', dur: vrr(0.5, 2) };
  }
}
// Moves animal g on by dt seconds: plays out leaving the farm (death or sale), walks its path, counts down its
// task, and calls think() when it is done. A finished laying sitting puts the egg in the nest or sends it to
// the incubator.
function updAgent(g, dt) {
  if (g.hidden) return;
  // ---- leaving the farm: dying (fades from 1.2 s, gone at 3.2 s), fading out, or walking out of the gate ----
  if (g.leaving) {
    const L = g.leaving;
    if (L.kind === 'die') {
      L.t = (L.t || 0) + dt;
      g.act = 'dead';
      g.alpha = clamp(1 - (L.t - 1.2) / 2, 0, 1);
      if (L.t > 3.2) WV.agents.delete(g.id);
      return;
    }
    if (L.kind === 'fade') {
      L.t = (L.t || 0) + dt;
      g.alpha = clamp(1 - L.t / 0.6, 0, 1);
      if (L.t > 0.6) WV.agents.delete(g.id);
      return;
    }
    if (L.kind === 'gate') {
      if (!move(g, dt)) {
        g.alpha -= dt * 1.5;
        if (g.alpha <= 0) WV.agents.delete(g.id);
      }
      return;
    }
    return;
  }
  // rain or snow starting while a bird is out in the run (phase 25): it stops what it is doing and,
  // after its own short pause (0.2 to 1.5 s, by id, no dice), thinks again and heads in. Not while it
  // is jumping, passing the pop door or still stepping down from it to the ground.
  if (g.ref.sp !== 'rabbit' && g.zone && !g.jump && kindOf(g.ref) === 'bird') {
    const zc = compById(g.zone);
    if (zc && zc.type === 'run') {
      if (!wxFallNow()) g.rainCut = 0;
      else if (!g.rainCut && !(g.path.length && 'zone' in g.path[0]) && Math.abs(g.z - floorZ(zc)) < 0.04) {
        g.rainCut = 1;
        g.path = [];
        g.task = null;
        g.act = 'idle';
        g.timer = 0.2 + g.col * 1.3;
        g.moving = false;
        g.vx = g.vy = 0;
        return;
      }
    }
  }
  // ---- walking: follow the path (move() in world/physics.js) ----
  if (g.path.length) {
    g.moving = true;
    move(g, dt);
    return;
  }
  g.moving = false;
  g.vx = g.vy = 0;
  if (g.hz) hopStep(g, dt, false); // finish the hop in the air before standing still
  // ---- arrived: start the task that was waiting at the end of the path ----
  if (g.task) {
    g.act = g.task.act;
    g.timer = g.task.dur;
    g.curNest = g.task.nest;
    g.task = null;
    return;
  }
  // ---- doing the task: count it down; when it ends, lay the egg (laying) and choose the next (think) ----
  g.timer -= dt;
  if (g.timer > 0) return;
  if (g.act === 'lay' && g.layQ.length) {
    const dest = g.layQ.shift(),
      n = g.curNest,
      home = compById(g.home);
    if (n && home) {
      if (dest === 'inc') {
        const inc = pens('incubator').find(c => +c.on) || pens('incubator')[0];
        if (inc) {
          WV.fly.push({
            a: [n.x + n.w / 2, n.y + n.d / 2, n.z + 0.3],
            b: [inc.x + 1, inc.y + 1, 3.4],
            t: 0,
            dur: 1.4
          });
          fxText(n.x, n.y, 2.6, 'egg set to hatch', '#f6e7b0');
        }
      } else {
        WV.nest[home.id] = (WV.nest[home.id] || 0) + 1;
        fxText(n.x + 0.5, n.y, 2.4, '+1 egg', '#fff4c2');
      }
    }
  }
  think(g);
}
// separate() is in world/physics.js (circle-vs-circle, circle-vs-wall and circle-vs-box)

// Body length in ft as drawn: rabbits from weight (cube root of the share of adult weight), chicks 0.45,
// grown chickens growing to 1.1 by laying age.
function sizeFt(a) {
  return a.sp === 'rabbit'
    ? 1.35 * Math.cbrt(Math.max(0.12, a.wt) / P.rb_adult_wt)
    : a.st === 'chick'
      ? 0.45
      : 1.1 * (0.45 + 0.55 * clamp(a.age / P.ck_lay_age, 0, 1));
}
// Shows a short floating text at a farm point (for example "+1 egg"); at most 60 at once.
function fxText(x, y, z, text, col) {
  WV.fx.push({ x, y, z, text, col: col || '#fff', t: 0, life: 2.6 });
  if (WV.fx.length > 60) WV.fx.shift();
}
// Runs fn when the world clock reaches hour h at the live speeds, else after d seconds (see loop.js).
function later(h, d, fn) {
  let t = WV.t + d,
    timed = false;
  if (WV.live && CLOCK.running) {
    const sp = clockRate();
    let dh = h - WV.hour;
    if (dh < 0) dh = 0;
    t = WV.t + dh / 24 / sp;
    timed = true;
  }
  WV.queue.push({ t, fn, timed });
}
