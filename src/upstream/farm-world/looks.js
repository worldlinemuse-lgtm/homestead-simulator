// world/looks.js
// World context, visual only. How each animal looks: coat and plumage by the breed preset the
// settings match, body size from each animal's modelled weight, and chick down that feathers out
// as the chick ages. Reads P, the breed tables and the animal record; writes nothing in the model.
// Colour sources (descriptions, not model data): ARBA colour list for Flemish Giants and the
// Californian / New Zealand White descriptions as summarised by web search, Nov 5 2026; hen and
// chick colours from hatchery breed descriptions found the same day. Custom settings that match no
// preset keep the old mixed palette.
const FLEM_COATS = [
  // ARBA-recognised Flemish Giant colours: sandy, steel gray, light gray, fawn, black, blue, white
  { b: '#a9784a', d: '#6f4a2a', e: '#1b1410' },
  { b: '#55524f', d: '#34322f', e: '#1b1410' },
  { b: '#aaa49b', d: '#7d776f', e: '#1b1410' },
  { b: '#c99d5f', d: '#9c7442', e: '#1b1410' },
  { b: '#2d2b2a', d: '#1a1918', e: '#120e0c' },
  { b: '#5d6571', d: '#3e444d', e: '#120e0c' },
  { b: '#efebe3', d: '#cfc9be', e: '#1b1410' }
];
const LOOK = { rb: null, ck: null, key: '' }; // breed presets matched by looksNow(): rabbit, hen, and the settings key they were matched for
// The breeds the current settings match (re-read only when a breed setting changes), for colours and sizes.
function looksNow() {
  // breed keys are re-read only when a breed setting changes
  const key = P.rb_adult_wt + '|' + P.rb_sale_wt + '|' + P.rb_cage + '|' + P.ck_bw6 + '|' + P.ck_feed + '|' + P.ck_peak;
  if (key !== LOOK.key) {
    LOOK.key = key;
    LOOK.rb = breedOf(RB_BREEDS);
    LOOK.ck = breedOf(CK_BREEDS);
  }
  return LOOK;
}
// rabbit coat: body, darker shade, points (ears, nose, feet, tail), eye
function rabCoat(g) {
  const br = looksNow().rb;
  if (br === 'nzw') return { b: '#f6f3ec', d: '#dcd6cb', p: null, e: '#c23a52', tail: '#ffffff' };
  if (br === 'cal') return { b: '#f6f3ec', d: '#dcd6cb', p: '#2a2421', e: '#c23a52', tail: '#2a2421' };
  if (br === 'flem') {
    const c = FLEM_COATS[Math.floor(g.col * FLEM_COATS.length) % FLEM_COATS.length];
    return { b: c.b, d: c.d, p: null, e: c.e, tail: shd(c.b, 1.18) };
  }
  const b = RAB[Math.floor(g.col * RAB.length)];
  return { b, d: shd(b, 0.92), p: null, e: '#1b1b1b', tail: '#fbfbf7' };
}
// hen and rooster plumage: body, wing, neck hackles, tail, barred?
function birdCoat(g, male) {
  const br = looksNow().ck;
  if (br === 'white') return { b: '#f6f3ea', w: '#e3ded2', n: '#fbf8f0', t: '#f2eee4', bar: false };
  if (br === 'prock')
    return male
      ? { b: '#8d8d90', w: '#7a7a7e', n: '#9a9a9d', t: '#77777b', bar: true }
      : { b: '#6f6f73', w: '#5d5d62', n: '#7c7c80', t: '#5a5a5f', bar: true };
  if (br === 'brown')
    return male
      ? { b: '#a3451c', w: '#7c3314', n: '#e09a3a', t: '#1d4a35', bar: false }
      : { b: '#9a4a1f', w: '#7a3816', n: '#c47a35', t: '#f1ece2', bar: false };
  if (male) return { b: '#a3451c', w: '#7c3314', n: '#e09a3a', t: '#1d4a35', bar: false };
  const b = HEN[Math.floor(g.col * HEN.length)];
  return { b, w: shd(b, 0.78), n: b, t: shd(b, 0.8), bar: false };
}
// chick down: colour at hatch, belly colour, head spot
function chickDown() {
  const br = looksNow().ck;
  if (br === 'prock') return { b: '#2b2826', belly: '#e8cf6a', spot: '#f1e4a8' };
  if (br === 'brown') return { b: '#d9a865', belly: '#efd29a', spot: null };
  return { b: '#f6d55c', belly: '#f8e48c', spot: null };
}
// size factor from modelled weight (cube root keeps length in proportion to mass)
function birdScale(a) {
  const g = Math.max(30, (a.wt || 0) * 453.6),
    adult = Math.max(400, +P.ck_bw1 || 1800);
  return clamp(Math.cbrt(g / adult), 0.22, 1.15);
}
// barring: alternating dark and light bands clipped to an ellipse (Plymouth Rock)
function barred(x, y, rx, ry, rot, H) {
  const c = WV.ctx;
  if (rx < 3) return;
  c.save();
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, 7);
  c.clip();
  c.strokeStyle = 'rgba(245,245,240,0.55)';
  c.lineWidth = Math.max(0.6, H * 0.035);
  const step = Math.max(1.6, H * 0.08);
  c.beginPath();
  for (let k = -rx - ry; k < rx + ry; k += step) {
    c.moveTo(x + k, y - ry);
    c.lineTo(x + k - ry * 0.7, y + ry);
  }
  c.stroke();
  c.restore();
}
