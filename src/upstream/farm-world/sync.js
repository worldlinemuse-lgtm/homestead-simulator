// world/sync.js
// Farm world. worldSync() compares the sprites with the model's animals after every change and adds,
// moves or removes them.
// ---------- reconcile the world with the model after every change ----------
function worldSync() {
  if (!WV.ctx || !S || !S.today) return;
  const reset = WV.lastS !== S || S.day < WV.lastDay;
  if (reset) {
    WV.agents.clear();
    WV.fx = [];
    WV.fly = [];
    WV.nest = {};
    WV.queue = [];
    WV.lastS = S;
    WV.lastDay = S.day;
    WV.farmer = null;
  }
  const days = S.day - WV.lastDay,
    lk = layoutKey();
  // pens that moved carry their animals with them
  for (const c of S.comps) {
    const o = WV.pos[c.id];
    if (o && (o[0] !== c.x || o[1] !== c.y)) {
      const dx = c.x - o[0],
        dy = c.y - o[1];
      for (const g of WV.agents.values())
        if (g.zone === c.id) {
          g.x += dx;
          g.y += dy;
          g.path.forEach(n => {
            if (!('zone' in n) || n.zone === c.id) {
              n.x += dx;
              n.y += dy;
            }
          });
        }
    }
    WV.pos[c.id] = [c.x, c.y];
  }
  if (reset || days || lk !== WV.layoutKey || WV.lastToday !== S.today) {
    buildCtx();
    buildVis();
    buildRoute();
    WV.layoutKey = lk;
    WV.lastToday = S.today;
  }
  const fast = !reset && (days > 1 || (CLOCK.running && clockRate() > 4.5));
  const ind = !reset && !fast && days === 1;
  const present = new Set(),
    births = new Map();
  const d = S.today.d;
  let setLeft = ind && d ? d.eggsSet : 0;
  for (const a of S.animals) {
    present.add(a.id);
    let g = WV.agents.get(a.id);
    if (!g) {
      if (reset || fast || (days === 0 && !a.mother && a.age > 1 && WV.agents.size === 0)) {
        spawn(a);
        continue;
      }
      if (a.sp === 'rabbit' && a.mother != null && a.age <= 1) {
        const mg = WV.agents.get(a.mother);
        g = spawn(a);
        if (mg) {
          const n = WV.K[a.enc] && WV.K[a.enc].nestOf && WV.K[a.enc].nestOf[a.mother];
          g.x = n ? n.x + 0.3 + vr() * (n.w - 0.6) : mg.x;
          g.y = n ? n.y + 0.3 + vr() * (n.d - 0.6) : mg.y;
          g.z = mg.z;
        }
        if (ind) {
          g.hidden = true;
          births.set(a.mother, (births.get(a.mother) || []).concat([g]));
        }
        continue;
      }
      if (a.sp === 'chicken' && a.age <= 1 && !a.mother) {
        const inc = pens('incubator')[0];
        g = spawn(a, inc ? [inc.x + 1, inc.y + 1, 3.4] : null);
        if (ind && inc) {
          g.hidden = true;
          later(vrr(7, 14), vrr(0.2, 1.5), () => {
            g.hidden = false;
            fxText(inc.x, inc.y, 4, 'chick hatched', '#ffe27a');
          });
        }
        continue;
      }
      if (days === 0 && !fast) {
        spawn(a, gatePt());
        fxText(60, PLOT.h, 1, 'new animal arrives', '#cfe8ff');
        continue;
      }
      spawn(a);
      continue;
    }
    g.ref = a;
    if (g.home !== a.enc && !g.leaving) {
      if (fast) {
        const c = a.enc && compById(a.enc);
        g.home = a.enc;
        g.zone = a.enc;
        g.path = [];
        if (c) {
          const p = rndIn(c);
          g.x = p[0];
          g.y = p[1];
          g.z = floorZ(c);
        }
      } else routeTo(g, a.enc);
    }
    if (a.sp === 'chicken' && a.eggs > g.eggs) {
      if (ind) {
        for (let i = 0; i < a.eggs - g.eggs; i++) {
          const dest = setLeft > 0 ? (setLeft--, 'inc') : 'nest';
          const gg = g;
          later(vrr(WV.sun ? WV.sun.rise + 0.5 : 7, WV.sun ? WV.sun.rise + 5 : 12), vrr(0, 2.5), () => {
            gg.layQ.push(dest);
          });
        }
      }
      g.eggs = a.eggs;
    }
  }
  for (const [mid, list] of births) {
    const mg = WV.agents.get(mid);
    later(vrr(1, 6), vrr(0.2, 1.5), () => {
      list.forEach(g => (g.hidden = false));
      if (mg) fxText(mg.x, mg.y, mg.z + 1.4, '+' + list.length + ' kits born', '#ffd1dc');
    });
  }
  for (const [id, g] of WV.agents) {
    if (present.has(id) || g.leaving) continue;
    depart(g, reset || fast);
  }
  if (fast) {
    for (const row of S.hist.filter(r => r.day > WV.lastDay && r.day <= S.day))
      for (const k of ['eggs', 'births', 'hatched', 'deaths', 'fryersSold'])
        WV.agg[k] = (WV.agg[k] || 0) + (row[k] || 0);
    const coop = pens('coop')[0];
    if (coop && d)
      WV.nest[coop.id] = Math.min(d.eggsSold || 0, ((WV.K[coop.id] && WV.K[coop.id].nests.length) || 4) * 3);
  }
  WV.lastDay = S.day;
}
// Starts animal g leaving the world: quick ones just fade; sold or retired animals wait for mid-morning, then
// walk out of their pen to the gate; others (deaths) play out as set below.
function depart(g, quick) {
  const a = g.ref;
  if (quick) {
    g.leaving = { kind: 'fade' };
    return;
  }
  if (a.sold || a.retired) {
    g.leaving = { kind: 'wait' };
    later(vrr(9, 11), vrr(0, 1), () => {
      g.leaving = { kind: 'gate' };
      const gp = gatePt();
      g.path = [];
      const cur = g.zone && compById(g.zone);
      if (cur) {
        const e = edgePt(cur, gp[0], gp[1]);
        g.path.push({ x: e[0], y: e[1], z: 0, zone: null });
      }
      g.path.push({ x: gp[0], y: gp[1] - 0.5, z: 0, zone: null }, { x: gp[0], y: gp[1] + 3, z: 0 });
      fxText(
        g.x,
        g.y,
        g.z + 1.4,
        a.retired
          ? 'retired'
          : a.sp === 'rabbit'
            ? 'fryer sold $' + (a.wt * P.pr_fryer).toFixed(2)
            : 'bird sold $' + (+P.pr_bird).toFixed(2),
        '#c8f7c5'
      );
    });
    return;
  }
  g.leaving = { kind: 'wait' };
  const cause = a.deathCause || (a.stress ? a.stress + ' stress' : 'background risk');
  later(vrr(0, 8), vrr(0, 1.2), () => {
    g.leaving = { kind: 'die' };
    g.path = [];
    fxText(g.x, g.y, g.z + 1.2, 'died: ' + cause, '#ffb4a8');
  });
}

// ---------- farmer walks the chore route the labor formula prices ----------
function updFarmer(dt) {
  const F = WV.farmer,
    R = WV.route;
  if (!F || !R) return;
  const sp = Math.max(0.5, P.lb_mph) * 1.46667;
  F.moving = false;
  if (!R.nodes.length || (WV.sun && WV.sun.night)) {
    const tgt = R.feed ? approach(R.feed, F.x, F.y) : [4, 4];
    goF(F, tgt, sp, dt);
    F.carry = null;
    return;
  }
  if (F.wait > 0) {
    F.wait -= dt;
    return;
  }
  const n = R.nodes[F.i % R.nodes.length],
    tgt = F.tgt || (F.tgt = approach(n.c, F.x, F.y));
  if (goF(F, tgt, sp, dt)) return;
  F.tgt = null;
  F.i = (F.i + 1) % R.nodes.length;
  F.wait = n.kind === 'pen' ? 1.4 : 0.9;
  if (n.kind === 'feed') F.carry = 'feed';
  else if (n.kind === 'water') F.carry = 'water';
  else {
    F.carry = null;
    if (n.c.type === 'coop' && WV.nest[n.c.id]) {
      fxText(n.c.x + n.c.w / 2, n.c.y + n.c.d, 3, WV.nest[n.c.id] + ' eggs collected to sell', '#fff4c2');
      WV.nest[n.c.id] = 0;
    }
  }
}
// Walks the farmer F toward point t at speed sp for dt seconds; false once there.
function goF(F, t, sp, dt) {
  const dx = t[0] - F.x,
    dy = t[1] - F.y,
    d = Math.hypot(dx, dy);
  if (d < 0.05) return false;
  const st = Math.min(d, sp * dt);
  F.x += (dx / d) * st;
  F.y += (dy / d) * st;
  F.ph += dt * 7;
  F.moving = true;
  if (Math.abs(dx - dy) > 0.01) F.face = dx - dy > 0 ? 1 : -1;
  return true;
}
