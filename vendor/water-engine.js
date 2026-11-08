/* Vendored source snapshot. Original: worldlinemuse-lgtm/water-purification-simulator/source/engine.js, blob e3e516aa462272d83442acc7904e5592eeb9f6e7. Unmodified scientific functions inside closure. */
var HomesteadWaterCore = (function(){
// ===== Water purification simulator engine (no rendering) =====
const FT = 0.3048, M_PER_PSI = 2.31 * FT, LPG = 3.78541, MANUAL_PSI = 5;
const SRC = {
  S1: ['CDC: treatment when hiking, camping, traveling', 'https://www.cdc.gov/drinking-water/prevention/water-treatment-hiking-camping-traveling.html'],
  S2: ['CDC: choosing home water filters', 'https://www.cdc.gov/drinking-water/prevention/about-choosing-home-water-filters.html'],
  S3: ['EPA: emergency disinfection of drinking water', 'https://www.epa.gov/ground-water-and-drinking-water/emergency-disinfection-drinking-water'],
  S4: ['Minnesota Dept. of Health: home water treatment', 'https://www.health.state.mn.us/communities/environment/water/docs/factsheet/hometreatment.pdf'],
  S5: ['CAWST: biosand filter technical sheet', 'https://washresources.cawst.org/en/resources/7c47441f/biosand-filter-technical-information-sheet'],
  S6: ['Texas Manual on Rainwater Harvesting (TWDB)', 'https://www.twdb.texas.gov/publications/brochures/conservation/doc/RainwaterHarvestingManual_3rdEdition.pdf'],
  S7: ['Sawyer Squeeze product page', 'https://www.sawyer.com/product/squeeze-water-filter-system'],
  S8: ['LifeStraw Mission product page', 'https://lifestraw.com/products/lifestraw-mission'],
  S9: ['OutdoorGearLab: Sawyer Squeeze measured flow', 'https://www.outdoorgearlab.com/reviews/camping-and-hiking/backpacking-water-filter/sawyer-squeeze'],
  S10: ['The Prepared: Sawyer PointZeroTwo review', 'https://theprepared.com/blog/review-sawyer-point-zerotwo-bucket-system/'],
  S11: ['Hazen-Williams equation', 'https://en.wikipedia.org/wiki/Hazen%E2%80%93Williams_equation'],
  S12: ["Darcy's law", 'https://en.wikipedia.org/wiki/Darcy%27s_law'],
  S13: ['Activated carbon sizing guide (vendor)', 'https://activatedcarbonfactory.com/blog/activated-carbon-dosage-calculator-water-treatment'],
  S14: ['iSpring RCC7AK at Home Depot', 'https://www.homedepot.com/p/ISPRING-NSF-Certified-6-Stage-Reverse-Osmosis-System-w-Alkaline-Remineralization-Reduces-PFAS-Fluoride-Chromium-Lead-TDS-RCC7AK/206467327'],
  S15: ['Waterdrop WD-TSA-UF at Home Depot', 'https://www.homedepot.com/p/Waterdrop-WD-TSA-UF-0-01-m-Ultra-Filtration-Under-Sink-Water-Filter-System-9-Stage-Filtration-Extra-WD-10PP-Replacement-Filter-B-WD-TSA-UF-PP/335519432'],
  S16: ['Home Depot listings (sand, gravel, buckets, barrels, pumps, bleach)', 'https://www.homedepot.com/s/rain%20barrel?NCNI-5'],
  S17: ['Amazon listings (Sawyer)', 'https://www.amazon.com/s?k=sawyer+squeeze+water+filter+system'],
  S18: ['Walmart listings (coconut GAC)', 'https://www.walmart.com/search?q=granular+activated+carbon+coconut+shell+water+filter+media'],
  S19: ['Home Depot: Everbilt 1/2 in barb nylon tee $4.35', 'https://www.homedepot.com/s/1%2F2%20in%20barb%20tee'],
  S20: ['Home Depot: Orbit 27931 brass 2-way shut-off hose Y $10.98', 'https://www.homedepot.com/p/Orbit-Heavy-Duty-Brass-2-Way-Shut-Off-Hose-Faucet-Adapter-Hose-Fitting-27931/100659310'],
  S21: ['Home Depot: Valterra P23415LF brass 1/2 in check valve $10.99', 'https://www.homedepot.com/s/1%2F2%20in%20barb%20check%20valve'],
  S22: ['Home Depot: PLUMBFLEX 12615PV 1/2 in barb full-port ball valve $8.00', 'https://www.homedepot.com/s/1%2F2%20in%20barb%20ball%20valve'],
  S23: ['Home Depot: Everbilt 1/4 in OD x 0.170 in ID x 25 ft PE tubing $5.48', 'https://www.homedepot.com/p/Everbilt-1-4-IN-OD-x-0-170-IN-ID-x-25-ft-Natural-Polyethylene-Tubing-HKP003-PE002/336797063'],
  S24: ['Home Depot: Gilmour drinking-water-safe 5/8 in x 25 ft hose $30.95', 'https://www.homedepot.com/p/Gilmour-Drinking-Water-Safe-5-8-in-D-X-25-ft-L-RV-Marine-Hose-7006721/341840834'],
  S25: ['Home Depot: Rain Bird 3/4 in hose thread to 1/2 in tubing adapter $2.58', 'https://www.homedepot.com/s/3%2F4%20in%20hose%20thread%20x%201%2F2%20in%20barb'],
  S26: ['Engineering ToolBox: minor loss coefficients (elbow, tee, ball valve, check valve)', 'https://www.engineeringtoolbox.com/minor-loss-coefficients-pipes-d_626.html'],
  S27: ['Wikipedia: flow coefficient Cv, Q = Cv sqrt(dP/SG)', 'https://en.wikipedia.org/wiki/Flow_coefficient'],
  S28: ['Home Depot: Hessaire 6018058 water level float valve $19.70', 'https://www.homedepot.com/s/float%20valve']
};

// Earth-filter media. bagL and K are estimates; prices sourced Nov 4 2026.
const MEDIA = {
  gravel_pea: { name: 'Pea gravel (Vigoro, 0.5 cu ft)', usd: 5.44, shop: 'Home Depot', bagL: 14.16, K: 1e-2, rm: 0.3, color: 0x8d8a83 },
  pebble: { name: 'River pebble (Vigoro, 0.5 cu ft)', usd: 6.47, shop: 'Home Depot', bagL: 14.16, K: 3e-2, rm: 0.2, color: 0x9a8f80 },
  sand_filter: { name: 'Filter sand (50 lb)', usd: 29.99, shop: 'Home Depot', bagL: 14.2, K: 1e-4, rm: 0.7, color: 0xd8c08a },
  sand_pool: { name: 'AQUA JOE pool filter sand (50 lb)', usd: 32.97, shop: 'Home Depot', bagL: 14.2, K: 1e-4, rm: 0.7, color: 0xe2cc98 },
  sand_play: { name: 'Play sand (Quikrete, 50 lb), not graded for filtration', usd: 7.68, shop: 'Home Depot', bagL: 14.2, K: 5e-5, rm: 0.6, color: 0xe8d6a8, warn: 'Play sand is not graded for filtration: CAWST says sand choice and prep are crucial.' },
  gac: { name: 'Coconut-shell GAC 12x30 (5 lb)', usd: 33.89, shop: 'Walmart marketplace', bagL: 4.54, K: 2e-3, rm: 0.2, color: 0x222222, carbon: true },
  charcoal_free: { name: 'Fire charcoal (free, not activated carbon)', usd: 0, shop: 'scavenged', bagL: 1e9, K: 2e-3, rm: 0.2, color: 0x333030, warn: 'Fire charcoal is not rated activated carbon: no chemical credit.' },
  sand_free: { name: 'Local sand (free, unknown grading)', usd: 0, shop: 'scavenged', bagL: 1e9, K: 1e-4, rm: 0.5, color: 0xc9b38a },
  gravel_free: { name: 'Creek gravel (free)', usd: 0, shop: 'scavenged', bagL: 1e9, K: 1e-2, rm: 0.2, color: 0x7f7a70 }
};

const DEF = {
  stream: { name: 'Stream intake', cat: 'Water sources', kind: 'source', price: [], h: 0.15, elev: 0, params: { turb: 30, chem: 'unknown' },
    facts: [['Stream water needs a full treatment train before drinking', 'S1']], est: ['Turbidity 30 NTU is a placeholder: set it to your water'] },
  roof: { name: 'Roof catchment', cat: 'Water sources', kind: 'roof', price: [], h: 2.2, elev: 0, params: { area: 250, eff: 0.8, turb: 5, chem: 'unknown' },
    facts: [['Yield: 0.62 gal per sq ft per inch of rain', 'S6'], ['Avoid asphalt or composite shingle roofs for drinking water', 'S6'], ['Rainwater still needs treatment', 'S1']],
    est: ['Collection efficiency 80%', 'Roof runoff turbidity 5 NTU'] },
  bucket: { name: 'Food-grade bucket, 5 gal', cat: 'Containers', kind: 'store', price: [['Leaktite 5 gal food-grade bucket', 5.98, 'Home Depot']], opt: { lid: ['Leaktite lid', 2.98, 'Home Depot'] },
    capL: 18.93, h: 0.37, r: 0.15, elev: 0, params: { lid: true, init: 1 }, foodGrade: true, color: 0xf2f2f2,
    facts: [['Labeled food grade', 'S16']], est: ['Bucket height 0.37 m (not on listing)', 'Settling halves cloudiness every 2 h in still storage'] },
  bucket_o: { name: 'Homer bucket, 5 gal (not food grade)', cat: 'Containers', kind: 'store', price: [['Homer 5 gal bucket, orange', 3.98, 'Home Depot']], opt: { lid: ['HD orange lid', 1.98, 'Home Depot'] },
    capL: 18.93, h: 0.37, r: 0.15, elev: 0, params: { lid: false, init: 1 }, foodGrade: false, color: 0xf07a1a,
    facts: [['Not labeled food grade: non-potable stages only', 'S16']], est: ['Bucket height 0.37 m'] },
  barrel50: { name: 'Rain barrel, 50 gal (Algreen)', cat: 'Containers', kind: 'store', price: [['Algreen 50 gal rain barrel', 104.52, 'Home Depot']], opt: { stand: ['RTS rain barrel stand', 34.88, 'Home Depot'] },
    capL: 189.27, h: 0.9, r: 0.3, elev: 0, params: { stand: false, init: 1 }, foodGrade: true, color: 0x3d4a5a,
    facts: [['Listing does not say the plastic is drinking-water rated: barrel water counts as untreated', 'S16']], est: ['Barrel height 0.9 m', 'Stand adds 0.6 m of height'] },
  barrel55: { name: 'Rain barrel, 55 gal (Terra Cotta)', cat: 'Containers', kind: 'store', price: [['Terra Cotta 55 gal rain barrel', 109.0, 'Home Depot']], opt: { stand: ['RTS rain barrel stand', 34.88, 'Home Depot'] },
    capL: 208.2, h: 0.95, r: 0.31, elev: 0, params: { stand: false, init: 1 }, foodGrade: true, color: 0x9a5a3a,
    facts: [['Listing does not say the plastic is drinking-water rated', 'S16']], est: ['Barrel height 0.95 m', 'Stand adds 0.6 m'] },
  media: { name: 'Layered earth filter (bucket)', cat: 'Filters', kind: 'flow', price: [['Leaktite food-grade bucket', 5.98, 'Home Depot'], ['EarthMinded spigot kit', 15.97, 'Home Depot']], opt: { lid: ['Leaktite lid', 2.98, 'Home Depot'] },
    h: 0.37, elev: 0.35, params: { lid: true, bio: true, diaM: 0.28, layers: [{ m: 'gravel_pea', cm: 5 }, { m: 'sand_filter', cm: 20 }] }, hyd: 'media', foulCap: 200000,
    facts: [['Biosand: bacteria >90%, viruses >80%, protozoa >99% removed; not for chemicals', 'S5'], ['Household biosand flow 0.29 to 0.6 L/min; loading cap 0.4 m/h', 'S5'], ['Needs regular feeding; chlorinated feed harms the bio layer', 'S5'], ["Flow through each layer follows Darcy's law", 'S12']],
    est: ['Bucket inside diameter 0.28 m', 'Sand conductivity K and bag volumes', 'Clogging rate', 'GAC treats about 1,000 L per kg before it is spent'] },
  sediment: { name: 'Sediment cartridge 5 micron + housing', cat: 'Filters', kind: 'flow', price: [['iSpring FP15X8 5 micron, 8-pack', 29.21, 'Home Depot'], ['APEC HW-10 10 in housing', 24.79, 'Home Depot']],
    h: 0.35, elev: 0.2, params: {}, hyd: 'plin', rate: LPG, refPsi: 10, foulCap: 100000, rm: 0.8, color: 0x8fb6d8,
    facts: [['5 micron cartridges are sediment prefilters, not germ barriers', 'S6']], est: ['Flow 1 gpm at 10 psi, scaling with pressure', 'Removes 80% of cloudiness'] },
  carbon: { name: 'Carbon block cartridge + housing', cat: 'Filters', kind: 'flow', price: [['Anchor AF-1000-2 carbon block, 2-pack', 21.72, 'Home Depot'], ['APEC HW-10 10 in housing', 24.79, 'Home Depot']],
    h: 0.35, elev: 0.2, params: {}, hyd: 'plin', rate: LPG / 2, refPsi: 10, foulCap: 20000, rm: 0.3, carbonL: 2000, color: 0x334455,
    facts: [['Carbon: taste, odor, chlorine; certified products can cut listed chemicals', 'S4'], ['Carbon can saturate and stop working', 'S4']], est: ['Flow 0.5 gpm at 10 psi', 'Spent after 2,000 L'] },
  sawyer: { name: 'Sawyer Squeeze (0.1 micron)', cat: 'Purifiers', kind: 'flow', price: [['Sawyer SP129 Squeeze', 45.95, 'Amazon']], h: 0.22, elev: 0.4, params: { mode: 'squeeze' },
    hyd: 'sawyer', foulCap: 20000, rm: 0.99, backwash: true, color: 0x2f7fd0, cr: { b: 'S', p: 'S' },
    facts: [['0.1 micron absolute: 99.99999% bacteria, 99.9999% protozoa', 'S7'], ['Does not remove viruses (CDC)', 'S1'], ['Measured squeeze rate about 40 s per liter (1.5 L/min)', 'S9']],
    est: ['Squeeze range 1.2 to 1.8 L/min', 'Gravity mode 0.5 L/min at 1 m head (no published number)'] },
  sp160: { name: 'Sawyer gravity kit SP160 (Mini)', cat: 'Purifiers', kind: 'flow', price: [['Sawyer SP160 one-gallon gravity system', 37.59, 'Amazon']], h: 0.3, elev: 0.5, params: {},
    hyd: 'grav', rate: 0.25, refM: 1, foulCap: 15000, rm: 0.99, backwash: true, color: 0x2f7fd0, cr: { b: 'S', p: 'S' },
    facts: [['0.1 micron hollow fiber: bacteria and protozoa, not viruses', 'S1']], est: ['Gravity flow 0.25 L/min at 1 m head: Sawyer lists none'] },
  mission: { name: 'LifeStraw Mission (0.02 micron)', cat: 'Purifiers', kind: 'flow', price: [['LifeStraw Mission', 99.95, 'LifeStraw.com']], h: 0.4, elev: 0.5, params: {},
    hyd: 'grav', rate: 0.2, refM: 0.5, low: 0.75, life: 18000, foulCap: 60000, rm: 0.99, backwash: true, color: 0x1e90ff, cr: { b: 'S', v: 'S', p: 'S' },
    facts: [['Up to 12 L/h by gravity; 18,000 L life', 'S8'], ['NSF/ANSI P231: 99.999% viruses, 99.999999% bacteria, 99.999% parasites', 'S8']], est: ['Full rate reached at 0.5 m of head', 'Slow case 75% of rated'] },
  uf: { name: 'Waterdrop under-sink ultrafilter (0.01 micron)', cat: 'Purifiers', kind: 'flow', price: [['Waterdrop WD-TSA-UF', 149.98, 'Home Depot']], h: 0.42, elev: 0.1, params: {},
    hyd: 'pres', rate: LPG, minPsi: 10, maxPsi: 125, low: 0.75, foulCap: 150000, rm: 0.99, color: 0xe8eef4, cr: { b: 'S', p: 'S' },
    facts: [['Needs 10 to 125 psi; max 1 gpm', 'S15'], ['10 psi equals 23.1 ft of head', 'S6'], ['CDC lists only nanofiltration and RO as virus barriers for home filters', 'S2']],
    est: ['Flow held at 1 gpm inside the pressure range', 'Bacteria/parasite credit by pore class (CDC 0.3 micron rule); absolute rating not verified'] },
  ro: { name: 'Reverse osmosis, iSpring RCC7AK', cat: 'Purifiers', kind: 'flow', price: [['iSpring RCC7AK 6-stage RO', 211.49, 'Home Depot']], h: 0.42, elev: 0.1, params: { drain: 2 },
    hyd: 'pres', rate: 75 * LPG / 1440, minPsi: 40, maxPsi: 80, low: 0.75, foulCap: 300000, rm: 0.99, color: 0xdfe6ee, cr: { b: 'S', v: 'S', p: 'S' }, chem: { salts: 'S', nitrate: 'P', pfas: 'P' },
    facts: [['75 gallons per day at 40 to 80 psi; NSF 58', 'S14'], ['RO: germs, salt, lead, copper, chromium; may reduce arsenic, fluoride, nitrate', 'S2'], ['Sends part of the feed to drain', 'S4']],
    est: ['Drain water: 2 L per 1 L made (unit ratio not listed)', 'Flow held at rated output inside the pressure range'] },
  pump_sky: { name: '12 V pump, SKYSHALO 3 gpm', cat: 'Pumps and valves', kind: 'flow', price: [['SKYSHALO 12 V 3 gpm diaphragm pump', 50.99, 'Home Depot']], h: 0.18, elev: 0, params: { psi: 50 }, hyd: 'pump', gpm: 3, color: 0x222831,
    facts: [['3 gpm, 40 to 100 psi, auto switch', 'S16']], est: ['Delivers 50 psi (inside its 40 to 100 psi range)', '12 V power source not priced', 'Tubing pressure ratings not checked'] },
  pump_vevor: { name: '12 V pump, VEVOR 3.5 gpm', cat: 'Pumps and valves', kind: 'flow', price: [['VEVOR 12 V 3.5 gpm pump', 54.9, 'Home Depot']], h: 0.18, elev: 0, params: { psi: 50 }, hyd: 'pump', gpm: 3.5, color: 0x333a44,
    facts: [['3.5 gpm, 40 to 100 psi', 'S16']], est: ['Delivers 50 psi', '12 V power not priced'] },
  pump_chapin: { name: '12 V pump, Chapin 1 gpm', cat: 'Pumps and valves', kind: 'flow', price: [['Chapin 12 V 1.0 gpm pump', 14.65, 'Home Depot']], h: 0.16, elev: 0, params: { psi: 0 }, hyd: 'pump', gpm: 1, color: 0x2a5c2a,
    facts: [['1 gpm; pressure not listed: do not assume it can drive UF or RO', 'S16']], est: ['Pressure set to 0 psi until you enter one'] },
  valve: { name: 'Spigot with ball valve', cat: 'Pumps and valves', kind: 'flow', price: [['EarthMinded high-flow spigot kit', 15.97, 'Home Depot']], h: 0.12, elev: 0.1, params: { open: 100 }, hyd: 'valve', color: 0xb03030,
    facts: [['Listed up to 10 gpm', 'S16']], est: ['Flow scales with how far it is open'] },
  firstflush: { name: 'First-flush diverter', cat: 'Pumps and valves', kind: 'flow', price: [['Rain Harvesting First Flush Max, 3 in', 60.3, 'Home Depot']], h: 0.8, elev: 0.9, params: {}, hyd: 'pass', color: 0x555f66,
    facts: [['Diverts the dirtiest first runoff: 10 gal per 1,000 sq ft (TWDB low end)', 'S6']], est: ['Removes 60% of roof grit from what passes'], rm: 0.6 },
  tee: { name: 'Tee (1/2 in barb, splits or joins lines)', cat: 'Fittings', kind: 'flow', price: [['Everbilt 1/2 in barb nylon tee', 4.35, 'Home Depot']], h: 0.08, elev: 0.3, params: {}, hyd: 'tee', color: 0xdddddd, ports: { in: 2, out: 2 },
    facts: [['Line-through loss K = 0.9, branch K = 2.0 (threaded tee values; a barb tee is close)', 'S26'], ['Price', 'S19']], est: ['Lines into a tee share one node: flow splits by the resistance of each branch'] },
  ysplit: { name: 'Hose Y splitter, 2 shut-offs', cat: 'Fittings', kind: 'flow', price: [['Orbit 27931 brass 2-way shut-off hose adapter', 10.98, 'Home Depot']], h: 0.1, elev: 0.3, params: { a: true, b: true }, hyd: 'tee', color: 0xc9a227, ports: { in: 1, out: 2 },
    facts: [['Garden hose thread; each side has its own shut-off', 'S20']], est: ['Each open side treated as K = 2.0 (branch of a tee)'] },
  ballv: { name: 'Inline ball valve (1/2 in barb)', cat: 'Fittings', kind: 'flow', price: [['PLUMBFLEX 1/2 in full-port barb ball valve', 8.0, 'Home Depot']], h: 0.08, elev: 0.3, params: { open: 100 }, hyd: 'ballv', color: 0xcc3333,
    facts: [['Loss K: open 0.05, 1/3 closed 5.5, 2/3 closed 200', 'S26'], ['Price', 'S22']], est: ['K between those points is interpolated on a log scale'] },
  check: { name: 'Check valve (one-way)', cat: 'Fittings', kind: 'flow', price: [['Valterra P23415LF brass 1/2 in check valve', 10.99, 'Home Depot']], h: 0.08, elev: 0.3, params: {}, hyd: 'check', color: 0xb8860b,
    facts: [['Swing check loss K = 2 forward; blocks reverse flow', 'S26'], ['Price; threaded MPT both ends, needs barb adapters', 'S21']], est: ['Cracking pressure not listed: set to 0'] },
  bleach: { name: 'Bleach dose + 30 min hold', cat: 'Disinfection', kind: 'flow', price: [['Clorox concentrated bleach, 121 oz', 9.48, 'Home Depot']], h: 0.26, elev: 0.1, params: { strength: '6' }, hyd: 'pass', hold: 30, color: 0xffffff, cr: { b: 'S', v: 'S', p: 'P' },
    facts: [['8 drops of 6% or 6 drops of 8.25% per gallon; double if cloudy; stand 30 min', 'S3'], ['Chlorine does not work well on some parasites: filter first', 'S1']], est: [] },
  boil: { name: 'Boil pot (rolling boil)', cat: 'Disinfection', kind: 'flow', price: [], h: 0.3, elev: 0.3, params: { batch: 8, heat: 20, alt: false }, hyd: 'boil', color: 0x777777, cr: { b: 'S', v: 'S', p: 'S' },
    facts: [['Rolling boil 1 min, 3 min above 5,000 ft (EPA); kills all germ types', 'S3'], ['Boiling does nothing for chemicals', 'S1']], est: ['8 L pot, 20 min to reach a boil', 'Pot and stove you already own (not priced)'] },
  outlet: { name: 'Clean water out', cat: 'Outlet', kind: 'sink', price: [], h: 0.3, elev: 0, params: { container: 'none' }, color: 0xcfe8ff,
    facts: [], est: ['You draw water off as it arrives, so it never overflows'] }
};
const KINDSTORE = ['source', 'roof', 'store'];
const isUp = p => KINDSTORE.includes(DEF[p.type].kind);

let _id = 1;
function mkPart(type, x, z, o = {}) {
  const d = DEF[type];
  const p = { id: o.id || ('p' + (_id++)), type, x, z, elev: o.elev ?? d.elev, params: JSON.parse(JSON.stringify(d.params)), rt: {} };
  Object.assign(p.params, o.params || {});
  resetPart(p); return p;
}
function resetPart(p) {
  const d = DEF[p.type];
  p.rt = { vol: d.kind === 'store' ? d.capL * (p.params.init ?? 1) : 0, turb: d.kind === 'store' ? 10 : 0, load: 0, thru: 0, carbon: 0, ffDiv: 0, Q: 0 };
}
const baseElev = p => p.elev + ((p.params.stand) ? 0.6 : 0);
const capOf = p => DEF[p.type].capL || 0;
const surf = p => { const d = DEF[p.type]; if (d.kind === 'source') return baseElev(p); return baseElev(p) + d.h * (p.rt.vol / d.capL); };
const topOf = p => baseElev(p) + (DEF[p.type].kind === 'sink' ? 0.3 : DEF[p.type].h);

function mediaInfo(p) {
  const A = Math.PI * (p.params.diaM / 2) ** 2;
  let R = 0, gacKg = 0, gacL = 0; const bags = [];
  for (const l of p.params.layers) { const m = MEDIA[l.m]; const L = l.cm / 100; R += L / m.K; const vol = A * L * 1000;
    if (m.carbon) { gacL += vol; gacKg += vol * 0.5; }
    bags.push({ m: l.m, vol, n: m.usd ? Math.ceil(vol / m.bagL) : 0 }); }
  return { A, R, gacKg, gacL, bags };
}

function world0() { return { parts: [], pipes: [], t: 0, produced: 0, spilled: 0, drained: 0, diverted: 0, rain: { rate: 0, left: 0 } }; }

function graph(w) {
  const by = new Map(w.parts.map(p => [p.id, p])), outs = new Map(), ins = new Map();
  for (const pp of w.pipes) { if (!by.has(pp.from) || !by.has(pp.to)) continue; (outs.get(pp.from) || outs.set(pp.from, []).get(pp.from)).push(pp); (ins.get(pp.to) || ins.set(pp.to, []).get(pp.to)).push(pp); }
  return { by, outs, ins };
}
function pipeLenFt(w, pp) {
  if (pp.kind === 'direct' || pp.kind === 'hand') return 1;
  const g = w._by || new Map(w.parts.map(p => [p.id, p]));
  const a = g.get(pp.from), b = g.get(pp.to); if (!a || !b) return 1;
  const dy = (topOf(b)) - baseElev(a);
  const m = Math.hypot(a.x - b.x, a.z - b.z, dy) * 1.15 + 0.3;
  return m / FT;
}
// Hazen-Williams, US units, C=150, d=0.5 in (research example)
const HWK = 4.52 / (Math.pow(150, 1.852) * Math.pow(0.5, 4.8704));
const pipeDrop = (lpm, ft) => HWK * Math.pow(lpm / LPG, 1.852) * ft;
const pipeFlow = (psi, ft) => psi <= 0 ? 0 : Math.pow(psi / (HWK * ft), 1 / 1.852) * LPG;

const SCEN_K_ = 0;
const SCEN_K = [0.5, 1, 2], SCEN_FOUL = [3, 1.5, 0.5];
function foul(p, s) { const fc = DEF[p.type].foulCap; return fc ? 1 / (1 + SCEN_FOUL[s] * p.rt.load / fc) : 1; }

// returns {lin, max, zero, drive, manual}  (L/min)
function elemHyd(p, P, s) {
  const d = DEF[p.type], f = foul(p, s), hM = Math.max(0, P) * M_PER_PSI;
  switch (d.hyd) {
    case 'media': { const mi = mediaInfo(p); const lin = mi.A * hM / mi.R * 60000 * f / 1 * SCEN_K[s];
      const cap = [0.29, 0.4 * mi.A * 1000 / 60, 0.6][s]; return { lin, max: cap }; }
    case 'plin': return { lin: d.rate / d.refPsi * Math.max(0, P) * f };
    case 'sawyer': if (p.params.mode === 'squeeze') return { max: [1.2, 1.5, 1.8][s] * f, manual: true };
      return { lin: 0.5 * hM * f, max: 2 };
    case 'grav': { const r = d.rate * (s === 0 ? (d.low || 0.75) : 1) * f; return { lin: r * hM / d.refM, max: r }; }
    case 'pres': if (P < d.minPsi) return { zero: `needs at least ${d.minPsi} psi (${(d.minPsi * 2.31).toFixed(1)} ft of head); has ${P.toFixed(1)} psi` };
      return { max: d.rate * (s === 0 ? d.low : 1) * f, over: P > d.maxPsi ? `above its ${d.maxPsi} psi listed maximum` : null };
    case 'pump': return { max: d.gpm * LPG, drive: p.params.psi };
    case 'valve': if (p.params.open <= 0) return { zero: 'valve closed' }; return { max: 10 * LPG * p.params.open / 100 };
    case 'boil': return { max: p.params.batch / (p.params.heat + (p.params.alt ? 3 : 1)) };
    default: return {};
  }
}

function rainLps(w, roof) { return w.rain.left > 0 ? w.rain.rate / 3600 * roof.params.area * 0.62 * roof.params.eff * LPG : 0; }

// ===== v2: pipe kinds, connectors, nodal network solver =====
const G = 9.81, NU = 1.0e-6; // gravity m/s2, kinematic viscosity of water near 20 C, m2/s
const PIPE = {
  tube: { name: '1/2 in vinyl tubing', D: 0.0127, per: 10, usd: 7.56, item: 'Everbilt 1/2 in vinyl tubing, 10 ft', shop: 'Home Depot', src: 'S16', conn: 'barb12' },
  ro14: { name: '1/4 in PE tubing (RO/UF size)', D: 0.004318, per: 25, usd: 5.48, item: 'Everbilt 1/4 in OD PE tubing, 25 ft', shop: 'Home Depot', src: 'S23', conn: 'qc14' },
  hose: { name: '5/8 in drinking-water hose', D: 0.015875, per: 25, usd: 30.95, item: 'Gilmour drinking-water-safe hose, 5/8 in x 25 ft', shop: 'Home Depot', src: 'S24', conn: 'ght' },
  direct: { name: 'Kit hookup (fittings come with the parts, not priced)', D: 0.0127, conn: null },
  hand: { name: 'Carried by hand', conn: null }
};
const CONN_NAME = { barb12: '1/2 in barb', qc14: '1/4 in quick-connect', ght: '3/4 in garden hose thread', bottle28: '28 mm bottle thread', open: 'open top' };
function portConn(p, side) {
  const d = DEF[p.type];
  if (d.kind === 'source' || d.kind === 'roof' || d.kind === 'sink') return 'open';
  if (d.kind === 'store') return side === 'in' ? 'open' : 'ght';
  if (p.type === 'uf' || p.type === 'ro') return 'qc14';
  if (p.type === 'ysplit') return 'ght';
  if (p.type === 'sawyer') return 'bottle28';
  if (['media', 'boil', 'bleach'].includes(p.type) && side === 'in') return 'open';
  if (p.type === 'media') return 'ght';
  return 'barb12';
}
// adapter needed between a pipe kind and a port connector
function adapterFor(kind, conn) {
  const pc = PIPE[kind]?.conn; if (!pc || !conn || conn === 'open' || pc === conn) return null;
  const key = [pc, conn].sort().join('|');
  if (key === 'barb12|ght') return { name: 'Rain Bird 3/4 in hose thread to 1/2 in tubing adapter', usd: 2.58, shop: 'Home Depot', src: 'S25' };
  return { name: `${CONN_NAME[pc]} to ${CONN_NAME[conn]} adapter (no price found)`, usd: 0, unpriced: true };
}
function pipeEnds(w, pp) { const g = w._by || new Map(w.parts.map(p => [p.id, p])); return [g.get(pp.from), g.get(pp.to)]; }
function pipeAdapters(w, pp) {
  const [a, b] = pipeEnds(w, pp); if (!a || !b) return [];
  return [adapterFor(pp.kind, portConn(a, 'out')), adapterFor(pp.kind, portConn(b, 'in'))].filter(Boolean);
}
function pipeLenM(w, pp) { return pipeLenFt(w, pp) * FT; }
function pipeK(w, pp) { // minor losses: entrance 0.5 + exit 1.0 + two gentle bends 0.3 each (estimates) + 1.0 per tee end
  const [a, b] = pipeEnds(w, pp); let K = pp.kind === 'direct' ? 0.5 : 2.1;
  if (a && DEF[a.type].hyd === 'tee') K += 1.0; if (b && DEF[b.type].hyd === 'tee') K += 1.0; return K;
}
function pipeD(w, pp) {
  if (pp.kind !== 'direct') return PIPE[pp.kind]?.D || 0.0127;
  const [a, b] = pipeEnds(w, pp); return (a && portConn(a, 'out') === 'qc14') || (b && portConn(b, 'in') === 'qc14') ? 0.004318 : 0.0127;
}
const fricF = Re => Re < 1 ? 64 : Math.max(64 / Re, 0.316 * Math.pow(Re, -0.25)); // laminar or Blasius (smooth tube), whichever is larger
function pipeHead(v, L, D, K) { const Re = v * D / NU; return (fricF(Re) * L / D + K) * v * v / (2 * G); }
function pipeQ(dh, L, D, K) { // L/min, signed
  const a = Math.abs(dh); if (a < 1e-12) return 0; let lo = 0, hi = 30;
  for (let i = 0; i < 46; i++) { const m = (lo + hi) / 2; if (pipeHead(m, L, D, K) > a) hi = m; else lo = m; }
  return Math.sign(dh) * (lo + hi) / 2 * Math.PI * D * D / 4 * 60000;
}
function pipeInfo(Q, L, D, K) { const A = Math.PI * D * D / 4, v = Math.abs(Q) / 60000 / A, Re = v * D / NU, f = fricF(Re); return { v, Re, f, hf: f * L / D * v * v / (2 * G), hm: K * v * v / (2 * G), L, D, K, regime: Re < 2300 ? 'laminar' : Re < 4000 ? 'transitional' : 'turbulent' }; }
const A12 = Math.PI * 0.0127 * 0.0127 / 4;
const kC = (K, A = A12) => A * 60000 * Math.sqrt(2 * G / K); // L/min per sqrt(m)
const sqLaw = (dh, C) => C * dh / Math.sqrt(Math.abs(dh) + 1e-4);
const smin = (x, cap) => { const a = Math.abs(x); return Math.sign(x) * a * cap / Math.pow(Math.pow(a, 4) + Math.pow(cap, 4), 0.25) + 1e-4 * cap * x / Math.max(cap, 1e-9); };
const ramp = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
function ballK(open) { if (open <= 0) return Infinity; const lg = Math.log10;
  if (open >= 67) return Math.pow(10, lg(0.05) + (100 - open) / 33 * (lg(5.5) - lg(0.05)));
  if (open >= 33) return Math.pow(10, lg(5.5) + (67 - open) / 34 * (lg(200) - lg(5.5)));
  return 200 * Math.pow(10, (33 - open) / 33 * 3); }
const SPIGOT_CV = 4; // estimate: listed 10 gpm reached at about 6 psi

// element law: returns main flow (L/min, positive a->b) from heads ha, hb
function elemLaw(w, p, s) {
  const d = DEF[p.type], f = foul(p, s), P = dh => dh / M_PER_PSI;
  switch (d.hyd) {
    case 'media': { const mi = mediaInfo(p); const lin = mi.A / mi.R * 60000 * f * SCEN_K[s]; const cap = [0.29, 0.4 * mi.A * 1000 / 60, 0.6][s];
      return { q: (ha, hb) => smin(lin * (ha - hb), cap), cap, info: { lin, cap, A: mi.A, R: mi.R } }; }
    case 'plin': { const k = d.rate / d.refPsi * f; return { q: (ha, hb) => k * P(ha - hb), info: { k } }; }
    case 'sawyer': if (p.params.mode === 'squeeze') { const cap = [1.2, 1.5, 1.8][s] * f, Hm = MANUAL_PSI * M_PER_PSI; return { q: (ha, hb) => cap * ramp((ha - hb + Hm) / 0.3) + 1e-6 * (ha - hb), cap, manual: true, info: { cap, Hm } }; }
      return { q: (ha, hb) => smin(0.5 * f * (ha - hb), 2), cap: 2, info: { lin: 0.5 * f } };
    case 'grav': { const r = d.rate * (s === 0 ? (d.low || 0.75) : 1) * f; return { q: (ha, hb) => smin(r * (ha - hb) / d.refM, r), cap: r, info: { r, refM: d.refM } }; }
    case 'pres': { const r = d.rate * (s === 0 ? d.low : 1) * f; return { q: (ha, hb) => r * ramp(P(ha - hb) - (d.minPsi - 1)) + 1e-6 * (ha - hb), cap: r, pres: true, info: { r, minPsi: d.minPsi, maxPsi: d.maxPsi } }; }
    case 'pump': { const qm = d.gpm * LPG, H = (p.params.psi || 0) * M_PER_PSI; if (H <= 0) return { q: () => 0, cap: qm, pump: true, info: { qm, H } };
      const zin = baseElev(p) + d.h; return { q: (ha, hb) => qm * ramp(1 + (ha - hb) / H) * ramp((ha - zin + 7) / 2) + 1e-6 * (ha - hb), cap: qm, pump: true, info: { qm, H, suction: 7 } }; }
    case 'valve': { const op = p.params.open / 100; const C = LPG * SPIGOT_CV * op / Math.sqrt(M_PER_PSI); return { q: (ha, hb) => op <= 0 ? 1e-7 * (ha - hb) : sqLaw(ha - hb, C), info: { Cv: SPIGOT_CV * op } }; }
    case 'ballv': { const K = ballK(p.params.open); return { q: (ha, hb) => isFinite(K) ? sqLaw(ha - hb, kC(K)) : 1e-7 * (ha - hb), info: { K } }; }
    case 'check': { const C = kC(2); return { q: (ha, hb) => ha > hb ? sqLaw(ha - hb, C) : 1e-7 * (ha - hb), info: { K: 2 } }; }
    case 'pass': { const C = kC(1); return { q: (ha, hb) => sqLaw(ha - hb, C), info: { K: 1 } }; }
    case 'boil': { const cap = p.params.batch / (p.params.heat + (p.params.alt ? 3 : 1)); return { q: (ha, hb) => smin(cap * (ha - hb) / 0.05, cap), cap, info: { cap } }; }
    default: return { q: (ha, hb) => sqLaw(ha - hb, kC(1)), info: {} };
  }
}

function nodeOf(p, side) { return DEF[p.type].hyd === 'tee' ? p.id + ':j' : p.id + ':' + side; }
function buildNet(w, s) {
  const by = new Map(w.parts.map(p => [p.id, p])); w._by = by;
  const nodes = new Map(), els = [];
  const N = (id, z, o = {}) => { if (!nodes.has(id)) nodes.set(id, { id, z, fix: null, inj: 0, mode: 'free', ...o }); return nodes.get(id); };
  for (const p of w.parts) {
    const d = DEF[p.type], k = d.kind;
    if (k === 'source') N(p.id + ':out', baseElev(p), { fix: baseElev(p), mode: 'src', part: p });
    else if (k === 'roof') { const n = N(p.id + ':out', baseElev(p) + d.h, { mode: 'roof', part: p }); n.inj = rainLps(w, p) * 60; n.cap = baseElev(p) + d.h + 0.3; }
    else if (k === 'store') { N(p.id + ':out', baseElev(p), { mode: 'storeOut', part: p, fix: p.rt.vol > 1e-6 ? surf(p) : baseElev(p) }); N(p.id + ':in', topOf(p), { mode: 'absorb', part: p, fix: topOf(p) }); }
    else if (k === 'sink') N(p.id + ':in', topOf(p), { mode: 'absorb', part: p, fix: topOf(p) });
    else if (d.hyd === 'tee') N(p.id + ':j', baseElev(p) + d.h / 2, { part: p });
    else {
      const a = N(p.id + ':in', baseElev(p) + d.h, { part: p }), b = N(p.id + ':out', baseElev(p), { part: p }), L = elemLaw(w, p, s);
      if (p.type === 'firstflush' && p.rt.ffDiv < ffVol(w, p)) { const c = N(p.id + ':ff', baseElev(p), { mode: 'absorb', fix: baseElev(p), part: p, ff: true }); els.push({ part: p, nodes: [a.id, c.id], law: { q: (ha, hb) => sqLaw(ha - hb, kC(1)), info: { K: 1, diverting: true } } }); }
      else if (p.type === 'ro') { const dr = N(p.id + ':drain', baseElev(p), { mode: 'absorb', fix: baseElev(p), part: p, drain: true }); const r = p.params.drain;
        els.push({ part: p, nodes: [a.id, b.id, dr.id], law: L, f: h => { const q = L.q(h[0], h[1]); return [q * (1 + r), -q, -q * r]; } }); }
      else els.push({ part: p, nodes: [a.id, b.id], law: L });
    }
  }
  for (const pp of w.pipes) {
    const a = by.get(pp.from), b = by.get(pp.to); if (!a || !b) continue;
    const na = nodeOf(a, 'out'), nb = nodeOf(b, 'in'); if (!nodes.has(na) || !nodes.has(nb)) continue;
    if (pp.kind === 'hand') {
      const ok = (DEF[a.type].kind === 'source' || (DEF[a.type].kind === 'store' && a.rt.vol > 1e-6)) && !(DEF[b.type].kind === 'store' && b.rt.vol >= capOf(b) * 0.95);
      const q = ok ? 10 : 0; els.push({ pipe: pp, hand: true, nodes: [na, nb], law: { q: () => q, info: { forced: q } } }); continue;
    }
    if (a.type === 'ysplit') { const outs = w.pipes.filter(x => x.from === a.id && x.kind !== 'hand'); const side = outs.indexOf(pp) === 0 ? 'a' : 'b'; if (!a.params[side]) { els.push({ pipe: pp, closed: true, nodes: [na, nb], law: { q: (x, y) => 1e-7 * (x - y), info: { closed: true } } }); continue; } }
    const L = pipeLenM(w, pp), D = pipeD(w, pp), K = pipeK(w, pp);
    els.push({ pipe: pp, nodes: [na, nb], law: { q: (x, y) => pipeQ(x - y, L, D, K), info: { L, D, K } } });
  }
  // open outlets: a flow part's outlet with nothing attached pours onto the ground
  const deg = new Map(); for (const e of els) if (e.pipe) for (const n of e.nodes) deg.set(n, (deg.get(n) || 0) + 1);
  for (const n of nodes.values()) if (n.mode === 'free' && n.part && n.id.endsWith(':out') && !(deg.get(n.id) || 0) && !(n.part.type === 'firstflush' && n.part.rt.ffDiv < ffVol(w, n.part))) { n.mode = 'leak'; n.fix = n.z; }
  for (const e of els) if (!e.f) e.f = h => { const q = e.law.q(h[0], h[1]); return [q, -q]; };
  return { nodes, els };
}
function ffVol(w, p) { const roof = w.parts.find(r => r.type === 'roof' && w.pipes.some(pp => pp.from === r.id && pp.to === p.id)); return roof ? 10 * roof.params.area / 1000 * LPG : 0; }

function gaussSolve(A, b) { const n = b.length;
  for (let i = 0; i < n; i++) { let m = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[m][i])) m = r;
    [A[i], A[m]] = [A[m], A[i]]; [b[i], b[m]] = [b[m], b[i]]; const piv = A[i][i] || 1e-12;
    for (let r = i + 1; r < n; r++) { const k = A[r][i] / piv; if (!k) continue; for (let c = i; c < n; c++) A[r][c] -= k * A[i][c]; b[r] -= k * b[i]; } }
  const x = new Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let c = i + 1; c < n; c++) s -= A[i][c] * x[c]; x[i] = s / (A[i][i] || 1e-12); } return x; }

function solveNet(net, H0) {
  const { nodes, els } = net, REG = 1e-6; let h = new Map(), iters = 0, outer = 0, gsUsed = 0;
  for (const n of nodes.values()) if (!('fix0' in n)) n.fix0 = n.fix;
  for (const n of nodes.values()) h.set(n.id, n.fix != null ? n.fix : (H0 && H0[n.id] != null && isFinite(H0[n.id]) ? H0[n.id] : n.z));
  const bal = () => { const b = new Map(); for (const n of nodes.values()) b.set(n.id, n.inj);
    for (const e of els) { const hv = e.nodes.map(id => h.get(id)), fl = e.f(hv); e.flows = fl; e.nodes.forEach((id, i) => b.set(id, b.get(id) - fl[i])); } return b; };
  for (outer = 0; outer < 16; outer++) {
    const free = [...nodes.values()].filter(n => n.fix == null), idx = new Map(free.map((n, i) => [n.id, i])), nf = free.length;
    const resid = () => { const b = bal(); return free.map(n => b.get(n.id) - REG * (h.get(n.id) - n.z)); };
    let F = resid();
    for (let it = 0; it < 40 && nf; it++) {
      const nrm = Math.max(...F.map(Math.abs)); if (nrm < 1e-6) break; iters++;
      const J = free.map(() => new Array(nf).fill(0)); free.forEach((n, i) => J[i][i] -= REG);
      for (const e of els) { const hv = e.nodes.map(id => h.get(id)), f0 = e.f(hv);
        e.nodes.forEach((idj, j) => { const cj = idx.get(idj); if (cj == null) return; const eps = 1e-6 * Math.max(1, Math.abs(hv[j])); const hp = hv.slice(); hp[j] += eps; const f1 = e.f(hp);
          e.nodes.forEach((idk, k) => { const rk = idx.get(idk); if (rk == null) return; J[rk][cj] -= (f1[k] - f0[k]) / eps; }); }); }
      let dx = gaussSolve(J, F.map(v => -v)); const mx = Math.max(...dx.map(v => isFinite(v) ? Math.abs(v) : 1e9)); if (!isFinite(mx)) break; if (mx > 3) dx = dx.map(v => v * 3 / mx);
      const old = free.map(n => h.get(n.id)); let a = 1, ok = false;
      for (let ls = 0; ls < 12; ls++) { free.forEach((n, i) => h.set(n.id, old[i] + a * dx[i])); const F2 = resid(); if (Math.max(...F2.map(Math.abs)) < nrm * (1 - 1e-4 * a) || ls === 11) { F = F2; ok = true; break; } a /= 2; }
      if (!ok) break;
    }
    if (nf && Math.max(...F.map(Math.abs)) > 1e-5) { // fallback: nonlinear Gauss-Seidel, each node balance is monotone in its own head
      const adj = new Map(free.map(n => [n.id, els.filter(e => e.nodes.includes(n.id))]));
      const ri = n => { let r = n.inj - REG * (h.get(n.id) - n.z); for (const e of adj.get(n.id)) { const fl = e.f(e.nodes.map(id => h.get(id))); r -= fl[e.nodes.indexOf(n.id)]; } return r; };
      for (let sw = 0; sw < 150; sw++) { let worst = 0;
        for (const n of free) { const h0 = h.get(n.id); let r0 = ri(n); worst = Math.max(worst, Math.abs(r0)); if (Math.abs(r0) < 1e-9) continue;
          let lo, hi, w_ = 0.5; if (r0 > 0) { lo = h0; hi = h0 + w_; h.set(n.id, hi); while (ri(n) > 0 && w_ < 1e4) { lo = hi; w_ *= 2; hi = h0 + w_; h.set(n.id, hi); } }
          else { hi = h0; lo = h0 - w_; h.set(n.id, lo); while (ri(n) < 0 && w_ < 1e4) { hi = lo; w_ *= 2; lo = h0 - w_; h.set(n.id, lo); } }
          for (let i = 0; i < 44; i++) { const m = (lo + hi) / 2; h.set(n.id, m); if (ri(n) > 0) lo = m; else hi = m; } h.set(n.id, (lo + hi) / 2); }
        if (worst < 1e-6) break; }
      gsUsed++; F = resid();
    }
    // active set
    const b = bal(); let change = false;
    for (const n of nodes.values()) {
      const q = b.get(n.id); // net inflow from the network into a fixed node is -q (q = inj - outflow); inflow into boundary = -q
      if (n.mode === 'absorb' || n.mode === 'leak') { if (n.fix != null && q < -1e-7) { n.fix = null; change = true; } else if (n.fix == null && h.get(n.id) > n.z + 1e-9) { n.fix = n.z; h.set(n.id, n.z); change = true; } }
      else if (n.mode === 'storeOut' && n.part.rt.vol <= 1e-6) { if (n.fix != null && q < -1e-7) { n.fix = null; change = true; } }
      else if (n.mode === 'roof') { if (n.fix == null && h.get(n.id) > n.cap) { n.fix = n.cap; h.set(n.id, n.cap); change = true; } else if (n.fix != null && q < -1e-7) { n.fix = null; change = true; } }
    }
    if (!change) break;
  }
  const b = bal(), H = {}; for (const [k, v] of h) H[k] = v;
  let resid = 0; for (const n of nodes.values()) if (n.fix == null) resid = Math.max(resid, Math.abs(b.get(n.id) - REG * (h.get(n.id) - n.z)));
  if (resid > 1e-5 && H0 && !net._cold) { for (const n of nodes.values()) n.fix = n.fix0; net._cold = true; return solveNet(net, null); }
  return { h, H, b, iters, outer, gsUsed, resid };
}

function mixNodeTurb(w, net, sol) { // flow-weighted turbidity transport along solved flows
  const T = new Map(), rmOf = p => { const d = DEF[p.type]; let rm = d.rm || 0; if (p.type === 'media') { let keep = 1; for (const l of p.params.layers) keep *= 1 - MEDIA[l.m].rm; rm = 1 - keep; if (p.params.bio) rm = Math.max(rm, 0.9); } return rm; };
  for (const n of net.nodes.values()) if (n.mode === 'src' || n.mode === 'roof') T.set(n.id, n.part.params.turb ?? 5); else if (n.mode === 'storeOut') T.set(n.id, n.part.rt.turb);
  for (let pass = 0; pass < net.nodes.size + 2; pass++) {
    const acc = new Map();
    for (const e of net.els) { const fl = e.flows; if (!fl) continue; let qin = 0, tin = 0;
      e.nodes.forEach((id, i) => { if (fl[i] > 1e-9) { qin += fl[i]; tin += fl[i] * (T.get(id) ?? 0); } });
      if (qin <= 0) continue; let t = tin / qin; e.turbIn = t; if (e.part) t *= 1 - rmOf(e.part); e.turbOut = t;
      e.nodes.forEach((id, i) => { if (fl[i] < -1e-9) { const a = acc.get(id) || [0, 0]; a[0] += -fl[i]; a[1] += -fl[i] * t; acc.set(id, a); } }); }
    for (const [id, [q, qt]] of acc) { const n = net.nodes.get(id); if (n.mode === 'src' || n.mode === 'roof' || n.mode === 'storeOut') continue; T.set(id, qt / q); }
  }
  return { T, rmOf };
}

function chainsOf(w) { const by = w._by || new Map(w.parts.map(p => [p.id, p])); return w.pipes.filter(pp => by.has(pp.from) && by.has(pp.to)).map(pp => ({ up: by.get(pp.from), down: by.get(pp.to), elems: [], pipes: [pp], hand: pp.kind === 'hand' })); }

// one hydraulic solve of the current state, no time passes
function solveState(w, s) {
  const net = buildNet(w, s), sol = solveNet(net, w._H); w._H = sol.H;
  const pipeQ_ = new Map(), partQ = new Map(), info = {};
  for (const e of net.els) { const fl = e.flows || [0, 0]; const hv = e.nodes.map(id => sol.h.get(id));
    if (e.pipe) { pipeQ_.set(e.pipe.id, fl[0]); const I = e.law.info; info[e.pipe.id] = { Q: fl[0], ha: hv[0], hb: hv[1], dh: hv[0] - hv[1], ...(I.L ? pipeInfo(fl[0], I.L, I.D, I.K) : {}), hand: !!e.hand, closed: !!I.closed }; }
    else { const q = e.part.type === 'ro' ? -fl[1] : fl[0]; partQ.set(e.part.id, q); info[e.part.id] = { Q: q, ha: hv[0], hb: hv[1], dh: hv[0] - hv[1], Pin: (hv[0] - net.nodes.get(e.nodes[0]).z) / M_PER_PSI, drain: e.part.type === 'ro' ? -fl[2] : 0, law: e.law, diverting: !!e.law.info.diverting }; } }
  // tee junction heads
  for (const n of net.nodes.values()) if (n.id.endsWith(':j')) info[n.part.id] = { Q: Math.abs([...net.els].filter(e => e.nodes.includes(n.id) && e.flows).reduce((a, e) => a + Math.max(0, -e.flows[e.nodes.indexOf(n.id)]), 0)), ha: sol.h.get(n.id), hb: sol.h.get(n.id), dh: 0, Pin: (sol.h.get(n.id) - n.z) / M_PER_PSI, junction: true };
  let sinkQ = 0, spillQ = 0, drainQ = 0, ffQ = 0;
  for (const n of net.nodes.values()) { const inflow = sol.b.get(n.id);
    if (n.fix == null) continue;
    if (n.mode === 'absorb' && n.part && DEF[n.part.type].kind === 'sink') sinkQ += inflow;
    else if (n.mode === 'leak') spillQ += inflow; else if (n.drain) drainQ += inflow; else if (n.ff) ffQ += inflow;
    else if (n.mode === 'roof') spillQ += Math.max(0, sol.b.get(n.id)); }
  return { net, sol, pipeQ: pipeQ_, partQ, info, sinkQ, spillQ, drainQ, ffQ };
}

function diagnose(w, snap, s) {
  const out = { bott: null, why: null, over: [], leaks: [] };
  for (const e of snap.net.els) if (e.part && e.law.pres) { const I = snap.info[e.part.id]; const P = I.dh / M_PER_PSI; if (P > e.law.info.maxPsi + 0.5 && I.Q > 1e-4) out.over.push(`${DEF[e.part.type].name} sees ${P.toFixed(0)} psi, above its ${e.law.info.maxPsi} psi listed maximum`); }
  for (const n of snap.net.nodes.values()) if (n.mode === 'leak' && n.fix != null && snap.sol.b.get(n.id) > 1e-4) out.leaks.push(n.part.id);
  if (snap.sinkQ > 1e-5) {
    let best = null, bs = 0.9; for (const e of snap.net.els) if (e.part && e.law.cap) { const q = snap.info[e.part.id].Q; const r = q / e.law.cap; if (r > bs && !(e.law.pump && r < 0.999)) { bs = r; best = e.part.id; } }
    if (!best) { let mx = 0; for (const e of snap.net.els) { if (e.part?.type && DEF[e.part.type].hyd === 'pump') continue; const dh = Math.abs(snap.info[e.pipe ? e.pipe.id : e.part.id]?.dh || 0) * (Math.abs(e.flows?.[0] || 0) > 1e-6 ? 1 : 0); if (dh > mx) { mx = dh; best = e.pipe ? 'pipe' : e.part.id; } } }
    for (const e of snap.net.els) if (e.hand && (e.flows?.[0] || 0) > 0 && !best) best = 'hand';
    out.bott = best; return out;
  }
  if (!pathsOf(w).length) { out.why = 'no complete path from a water source to the outlet'; return out; }
  for (const e of snap.net.els) if (e.part) { const d = DEF[e.part.type], I = snap.info[e.part.id];
    if (d.hyd === 'pres') { const P = I.dh / M_PER_PSI; if (P < d.minPsi) { out.why = `${d.name} needs at least ${d.minPsi} psi (${(d.minPsi * 2.31).toFixed(1)} ft of head); it has ${Math.max(0, P).toFixed(1)} psi`; out.bott = e.part.id; return out; } }
    if (d.hyd === 'pump' && !e.part.params.psi) { out.why = `${d.name} has no pressure set`; out.bott = e.part.id; return out; }
    if ((d.hyd === 'valve' || d.hyd === 'ballv') && e.part.params.open <= 0) { out.why = `${d.name} is closed`; out.bott = e.part.id; return out; } }
  for (const e of snap.net.els) if (e.closed) { out.why = 'a Y splitter side is shut'; }
  const ups = w.parts.filter(p => DEF[p.type].kind === 'store'); if (ups.length && ups.every(p => p.rt.vol <= 1e-6) && !w.parts.some(p => ['source', 'roof'].includes(DEF[p.type].kind))) { out.why = 'the containers are empty'; return out; }
  if (w.parts.some(p => DEF[p.type].kind === 'roof') && !w.rain.left && !ups.some(p => p.rt.vol > 1e-6)) { out.why = 'waiting for rain (press Rain)'; return out; }
  out.why = out.why || 'no driving head: the water upstream sits too low to push through to the outlet';
  return out;
}

function step(w, dtMax, s) {
  const snap = solveState(w, s), { net, sol } = snap, by = w._by;
  // time step: never empty or overfill a container by more than ~15% in one step
  let dt = dtMax;
  const netIn = new Map(); for (const n of net.nodes.values()) if (n.part && DEF[n.part.type].kind === 'store' && n.fix != null) netIn.set(n.part.id, (netIn.get(n.part.id) || 0) + sol.b.get(n.id));
  for (const [id, q] of netIn) { const p = by.get(id); if (q < -1e-9 && p.rt.vol > 0.05) dt = Math.min(dt, Math.max(1, 0.15 * p.rt.vol / (-q / 60))); }
  if (w.rain.left > 0 && w.rain.rate > 0) dt = Math.min(dt, Math.max(1, w.rain.left / w.rain.rate * 3600));
  for (const p of w.parts) if (p.type === 'firstflush') { const rem = ffVol(w, p) - p.rt.ffDiv; if (rem > 0 && snap.ffQ > 1e-9) dt = Math.min(dt, Math.max(1, rem / (snap.ffQ / 60))); }
  // scale if a container would run dry inside the step
  let k = 1; for (const [id, q] of netIn) { const p = by.get(id); const need = -q / 60 * dt; if (need > p.rt.vol && need > 0) k = Math.min(k, p.rt.vol / need); }
  const { T, rmOf } = mixNodeTurb(w, net, sol);
  for (const p of w.parts) if (DEF[p.type].kind !== 'store') p.rt.Q = 0;
  let into = 0;
  for (const n of net.nodes.values()) { if (n.fix == null) continue; const V = sol.b.get(n.id) / 60 * dt * k, p = n.part; // V = volume into this boundary
    if (n.mode === 'storeOut' || (n.mode === 'absorb' && p && DEF[p.type].kind === 'store')) { const tin = incomingTurb(net, n.id, T); const nv = Math.max(0, p.rt.vol + V); if (V > 0) p.rt.turb = nv > 0 ? (p.rt.vol * p.rt.turb + V * tin) / nv : tin; p.rt.vol = nv; }
    else if (n.mode === 'absorb' && p && DEF[p.type].kind === 'sink') { w.produced += V; into += V; p.rt.Q += V / dt * 60; p.rt.turb = incomingTurb(net, n.id, T); }
    else if (n.mode === 'leak') w.spilled += Math.max(0, V);
    else if (n.drain) w.drained += Math.max(0, V);
    else if (n.ff) { p.rt.ffDiv += Math.max(0, V); w.diverted += Math.max(0, V); }
    else if (n.mode === 'roof') w.spilled += Math.max(0, sol.b.get(n.id)) / 60 * dt * k; }
  for (const p of w.parts) if (DEF[p.type].kind === 'store' && p.rt.vol > capOf(p)) { w.spilled += p.rt.vol - capOf(p); p.rt.vol = capOf(p); }
  for (const e of net.els) if (e.part) { const p = e.part, q = Math.abs(snap.partQ.get(p.id) || 0) * k, V = q / 60 * dt; p.rt.Q = q; p.rt.thru += V; p.rt.load += V * (e.turbIn || 0);
    if (p.type === 'media' && mediaInfo(p).gacKg) p.rt.carbon += V; if (DEF[p.type].carbonL) p.rt.carbon += V; }
  for (const n of net.nodes.values()) if (n.id.endsWith(':j')) n.part.rt.Q = snap.info[n.part.id].Q * k;
  for (const p of w.parts) if (DEF[p.type].kind === 'store') p.rt.turb = Math.max(0.5, p.rt.turb * Math.exp(-dt / (2 * 3600 / Math.LN2)));
  if (w.rain.left > 0) w.rain.left = Math.max(0, w.rain.left - w.rain.rate * dt / 3600);
  w.t += dt;
  const ch = chainsOf(w), dg = diagnose(w, snap, s);
  const res = ch.map(c => { const q = (snap.pipeQ.get(c.pipes[0].id) || 0) * k; return { Q: Math.max(0, q), Qs: q, bott: DEF[c.down.type].kind === 'sink' ? dg.bott : null, why: DEF[c.down.type].kind === 'sink' && snap.sinkQ <= 1e-5 ? dg.why : null, drain: 0 }; });
  return { res, ch, into, dt, snap, dg };
}
function incomingTurb(net, id, T) { let q = 0, qt = 0; for (const e of net.els) { const i = e.nodes.indexOf(id); if (i < 0 || !e.flows || e.flows[i] >= 0) continue; const j = e.flows.findIndex(v => v > 0); const t = e.turbOut ?? T.get(e.nodes[j]) ?? 0; q += -e.flows[i]; qt += -e.flows[i] * t; } return q > 0 ? qt / q : 0; }

function cloneWorld(w) { const c = JSON.parse(JSON.stringify({ ...w, _by: undefined, _H: undefined })); return c; }
function freshWorld(w) { const c = cloneWorld(w); c.parts.forEach(resetPart); c.t = c.produced = c.spilled = c.drained = c.diverted = 0; c.rain = { rate: 0, left: 0 }; return c; }

function holdMin(w) { // max over paths of bleach holds
  let m = 0; for (const path of pathsOf(w)) { let h = 0; for (const id of path) { const p = w.parts.find(q => q.id === id); h += DEF[p.type].hold || 0; } m = Math.max(m, h); } return m;
}
function* timeToGen(w, L, s, maxH = 24 * 7) {
  const c = freshWorld(w); let stall = 0, steps = 0;
  while (c.t < maxH * 3600 && steps < 20000) {
    const prev = c.produced, r = step(c, 300, s); steps++; if (steps % 4 === 0) yield null;
    if (c.produced >= L - 0.01) { const rate = Math.max(1e-12, (c.produced - prev) / r.dt); return { min: (c.t - Math.max(0, c.produced - L) / rate) / 60, steps }; }
    if (c.produced - prev < 1e-9 && !c.parts.some(p => DEF[p.type].kind === 'store' && p.rt.vol > 0.01) && !(c.rain.left > 0) && !c.parts.some(p => DEF[p.type].kind === 'source')) return { min: null, why: c.produced > 0.01 ? `the water runs out after ${c.produced.toFixed(1)} L` : (r.dg.why || 'no water reaches the outlet'), steps };
    if (c.produced - prev < 1e-9) { stall += r.dt; if (stall > 3600 * 2) return { min: null, why: c.produced > 0.01 ? `flow stops after ${c.produced.toFixed(1)} L (${r.dg.why || 'source empty or blocked'})` : (r.dg.why || 'no water reaches the outlet'), steps }; } else stall = 0;
  }
  return { min: null, why: `more than ${maxH / 24} days`, steps };
}
function timeTo(w, L, s, maxH) { const g = timeToGen(w, L, s, maxH); let r; do { r = g.next(); } while (!r.done); return r.value; }

function pathsOf(w) {
  const g = graph(w), out = [];
  const dfs = (id, path) => { if (path.length > 40 || path.includes(id)) return; const p = g.by.get(id); const np = [...path, id];
    if (DEF[p.type].kind === 'sink') { out.push(np); return; } for (const pp of (g.outs.get(id) || [])) dfs(pp.to, np); };
  for (const p of w.parts) if (['source', 'roof'].includes(DEF[p.type].kind)) dfs(p.id, []);
  // stores prefilled with no upstream source also count as sources (water of unknown origin)
  for (const p of w.parts) if (DEF[p.type].kind === 'store' && !(g.ins.get(p.id) || []).length) dfs(p.id, []);
  return out;
}
const GERM = { b: 'bacteria', v: 'viruses', p: 'parasites (protozoa)' };
const CHEM = { unknown: 'Unknown (assume anything)', none: 'None known', salts: 'Salt or metals (lead, copper)', nitrate: 'Nitrate, arsenic or fluoride', organics: 'Pesticides, fuel or solvents', pfas: 'PFAS' };
function credit(p) { const d = DEF[p.type]; if (p.type === 'media' && p.params.bio) return { b: 'P', v: 'P', p: 'P' }; return d.cr || {}; }
function chemCredit(p, k) { const d = DEF[p.type];
  if (d.chem && d.chem[k]) return d.chem[k];
  const isCarbon = p.type === 'carbon' || (p.type === 'media' && p.params.layers.some(l => MEDIA[l.m].carbon));
  if (isCarbon && (k === 'organics' || k === 'pfas')) return 'P';
  return null; }

function analyze(w) {
  w._by = new Map(w.parts.map(p => [p.id, p]));
  const g = graph(w), ch = chainsOf(w), warn = [], paths = pathsOf(w);
  // cost
  const lines = [];
  for (const p of w.parts) { const d = DEF[p.type];
    d.price.forEach(([n, u, shop]) => lines.push([n, u, shop]));
    if (d.opt) for (const k in d.opt) if (p.params[k]) lines.push(d.opt[k]);
    if (p.type === 'media') for (const b of mediaInfo(p).bags) if (b.n) lines.push([MEDIA[b.m].name + (b.n > 1 ? ` x${b.n}` : ''), MEDIA[b.m].usd * b.n, MEDIA[b.m].shop]);
    if (p.type === 'outlet' && p.params.container === 'bucket') lines.push(['Leaktite bucket + lid (clean water)', 8.96, 'Home Depot']); }
  let tubeFt = 0, unpriced = 0; const ftBy = {}, adapt = new Map();
  for (const pp of w.pipes) { if (PIPE[pp.kind]?.per) { const ft = pipeLenFt(w, pp); ftBy[pp.kind] = (ftBy[pp.kind] || 0) + ft; if (pp.kind === 'tube') tubeFt += ft; } else if (pp.kind === 'direct') unpriced++;
    if (pp.player) for (const a of pipeAdapters(w, pp)) { const e = adapt.get(a.name) || { ...a, n: 0 }; e.n++; adapt.set(a.name, e); } }
  for (const [k, ft] of Object.entries(ftBy)) { const P_ = PIPE[k], n = Math.ceil(ft / P_.per); lines.push([`${P_.item} x${n}`, P_.usd * n, P_.shop]); }
  for (const a of adapt.values()) { if (a.unpriced) unpriced += a.n; lines.push([a.name + (a.n > 1 ? ` x${a.n}` : ''), a.usd * a.n, a.shop || 'not priced']); }
  const cost = lines.reduce((a, l) => a + l[1], 0);
  // safety
  const sink = w.parts.find(p => DEF[p.type].kind === 'sink');
  const gaps = new Set(), chemGap = new Set(), chemPart = new Set(), cover = { b: new Set(), v: new Set(), p: new Set() };
  let chemNote = null;
  if (!paths.length) gaps.add('no complete path from a water source to the outlet');
  for (const path of paths) {
    const parts = path.map(id => g.by.get(id));
    for (const k of ['b', 'v', 'p']) { const c = parts.find(p => credit(p)[k] === 'S'); if (c) cover[k].add(DEF[c.type].name); else gaps.add(GERM[k] + (parts.some(p => credit(p)[k] === 'P') ? ' (only partly reduced)' : '')); }
    const src = parts[0]; const ck = src.params.chem || 'unknown';
    if (ck === 'unknown') chemGap.add('unknown chemicals: nothing here can clear an unknown, and boiling or disinfecting never removes chemicals (CDC)');
    else if (ck === 'none') chemNote = 'No chemical risk entered. That is your input, not a test result.';
    else { const best = parts.map(p => chemCredit(p, ck)).filter(Boolean); if (best.includes('S')) chemPart.add(CHEM[ck] + ': covered by RO per its NSF 58 claim list');
      else if (best.includes('P')) chemGap.add(CHEM[ck] + ': only "may reduce" or label-dependent here');
      else chemGap.add(CHEM[ck] + ': no stage here addresses it'); }
    // order checks
    let turb = DEF[src.type].kind === 'store' ? 10 : src.params.turb, sawBleach = false, sawGerm = false;
    for (const p of parts) { const d = DEF[p.type];
      if (p.type === 'bleach') { sawBleach = true; if (turb > 5) warn.push(`Bleach is dosing cloudy water (about ${turb.toFixed(0)} NTU): EPA says settle and filter first, and double the dose for cloudy water.`); }
      if (p.type === 'media' && sawBleach && p.params.bio) warn.push('The biosand filter sits after bleach: CAWST says chlorinated water harms its biological layer.');
      if (d.kind === 'store' && d.foodGrade === false && sawGerm) warn.push(`${d.name} holds treated water but is not labeled food grade.`);
      if (credit(p).b === 'S') sawGerm = true;
      let rm = d.rm || 0; if (p.type === 'media') { let k = 1; p.params.layers.forEach(l => k *= 1 - MEDIA[l.m].rm); rm = 1 - k; if (p.params.bio) rm = Math.max(rm, 0.9); }
      if (d.kind === 'store') rm = 0; turb *= 1 - rm; }
  }
  for (const p of w.parts) { const d = DEF[p.type];
    if (p.type === 'roof' && !w.pipes.some(pp => pp.from === p.id && g.by.get(pp.to)?.type === 'firstflush')) warn.push('Roof feeds without a first-flush diverter: TWDB recommends one.');
    if (p.type === 'pump_chapin' && !p.params.psi) warn.push('Chapin pump pressure is not listed: it is set to 0 psi. Enter a tested value to use it.');
    if (p.type === 'media') p.params.layers.forEach(l => MEDIA[l.m].warn && warn.push(MEDIA[l.m].warn));
    if (d.life && p.rt.thru > d.life) warn.push(`${d.name} is past its ${d.life.toLocaleString()} L rated life.`);
    if (d.kind === 'flow' && !(g.ins.get(p.id) || []).length) warn.push(`${d.name} has no water coming in.`);
    if (p.type === 'firstflush' && !(g.ins.get(p.id) || []).some(pp => g.by.get(pp.from)?.type === 'roof')) warn.push('First-flush diverter only works right after a roof.');
  }
  const snap = solveState(w, 1), dg = diagnose(w, snap, 1);
  const res = ch.map(c => { const q = snap.pipeQ.get(c.pipes[0].id) || 0; return { Q: Math.max(0, q), Qs: q, bott: DEF[c.down.type].kind === 'sink' ? dg.bott : null, why: DEF[c.down.type].kind === 'sink' && snap.sinkQ <= 1e-5 ? dg.why : null }; });
  if (snap.sinkQ <= 1e-5 && dg.why && !/empty|rain/.test(dg.why)) warn.push(`No flow: ${dg.why}.`);
  dg.over.forEach(o => warn.push(o + '.'));
  dg.leaks.forEach(id => warn.push(`${DEF[g.by.get(id).type].name} has an open outlet: water is pouring onto the ground. Connect it or cap it.`));
  for (const pp of w.pipes) if (pp.player) pipeAdapters(w, pp).filter(a => a.unpriced).forEach(a => warn.push(`Needs a ${a.name}.`));
  const germOK = ![...gaps].length;
  let level, title;
  if (!germOK) { level = 'bad'; title = 'Not safe to drink'; }
  else if (chemGap.size) { level = 'mid'; title = 'Germs covered on paper; chemicals not cleared'; }
  else { level = 'ok'; title = 'Every germ class has a listed treatment stage'; }
  return { cost, lines, unpriced, tubeFt, chains: ch, res, snap, dg, warn: [...new Set(warn)], safety: { level, title, gaps: [...gaps], chemGap: [...chemGap], chemPart: [...chemPart], chemNote, cover: { b: [...cover.b], v: [...cover.v], p: [...cover.p] } }, sink, hold: holdMin(w) };
}

// ===== presets =====
function P(type, x, z, o) { return { type, x, z, o: o || {} }; }
const PRESETS = {
  A: { name: 'A. Stream kit: settle, squeeze, bleach', note: 'Research build A, $64.39', parts: { s: P('stream', -4.2, 0), b: P('bucket', -2.6, 0, { params: { lid: true } }), f: P('sawyer', -1.1, 0), c: P('bleach', 0.3, 0), o: P('outlet', 1.7, 0) },
    pipes: [['s', 'b', 'hand'], ['b', 'f', 'direct'], ['f', 'c', 'direct'], ['c', 'o', 'direct']] },
  B: { name: 'B. Bucket earth filter + bleach', note: 'Research build B, $92.34', parts: { s: P('stream', -4.2, 0), b: P('bucket', -2.6, 0, { elev: 0.8, params: { lid: false } }), m: P('media', -1.1, 0, { elev: 0.4 }), c: P('bleach', 0.3, 0), o: P('outlet', 1.7, 0, { params: { container: 'bucket' } }) },
    pipes: [['s', 'b', 'hand'], ['b', 'm', 'tube'], ['m', 'c', 'direct'], ['c', 'o', 'direct']] },
  C: { name: 'C. Rain barrel into LifeStraw Mission', note: 'Research build C, $299.65', parts: { r: P('roof', -4, 0), f: P('firstflush', -2.4, 0), b: P('barrel50', -1.2, 0, { params: { stand: true } }), m: P('mission', 0.4, 0, { elev: 0.4 }), o: P('outlet', 1.7, 0) },
    pipes: [['r', 'f', 'direct'], ['f', 'b', 'direct'], ['b', 'm', 'direct'], ['m', 'o', 'direct']] },
  D: { name: 'D. Barrel, 12 V pump, ultrafilter, bleach', note: 'Research build D, $375.27', parts: { r: P('roof', -4.6, 0), f: P('firstflush', -3.0, 0), b: P('barrel50', -1.8, 0), p: P('pump_sky', -0.5, 0), u: P('uf', 0.6, 0), c: P('bleach', 1.7, 0), o: P('outlet', 2.8, 0) },
    pipes: [['r', 'f', 'direct'], ['f', 'b', 'direct'], ['b', 'p', 'direct'], ['p', 'u', 'direct'], ['u', 'c', 'direct'], ['c', 'o', 'direct']] },
  E: { name: 'E. Pump + reverse osmosis (chemical option)', note: 'Research build E, $262.48', parts: { s: P('stream', -4.2, 0), p: P('pump_sky', -2.6, 0), r: P('ro', -1.1, 0), o: P('outlet', 0.5, 0) },
    pipes: [['s', 'p', 'direct'], ['p', 'r', 'direct'], ['r', 'o', 'direct']] },
  F: { name: 'Rain barrel, earth filter with carbon, boil', note: 'Extra design', parts: { r: P('roof', -4.6, 0), f: P('firstflush', -3.0, 0), b: P('barrel50', -1.8, 0, { params: { stand: true } }), m: P('media', -0.3, 0, { elev: 0.4, params: { layers: [{ m: 'gravel_pea', cm: 5 }, { m: 'sand_filter', cm: 20 }, { m: 'gac', cm: 10 }] } }), k: P('boil', 1.0, 0), o: P('outlet', 2.2, 0) },
    pipes: [['r', 'f', 'direct'], ['f', 'b', 'direct'], ['b', 'm', 'tube'], ['m', 'k', 'direct'], ['k', 'o', 'direct']] },
  G: { name: 'Two LifeStraws in parallel from one barrel', note: 'A tee splits one barrel line into two purifiers', parts: { b: P('barrel50', -2.2, 0, { params: { stand: true } }), t: P('tee', -0.9, 0, { elev: 0.3 }), m1: P('mission', 0.3, -0.8, { elev: 0.4 }), m2: P('mission', 0.3, 0.8, { elev: 0.4 }), o: P('outlet', 1.8, 0) },
    pipes: [['b', 't', 'tube'], ['t', 'm1', 'tube'], ['t', 'm2', 'tube'], ['m1', 'o', 'direct'], ['m2', 'o', 'direct']] },
  H: { name: 'Empty sandbox (stream + outlet)', note: 'Build your own', parts: { s: P('stream', -4.2, 0), o: P('outlet', 1.7, 0) }, pipes: [] }
};
function buildPreset(key) {
  const pr = PRESETS[key], w = world0(), map = {};
  for (const k in pr.parts) { const q = pr.parts[k]; const p = mkPart(q.type, q.x, q.z, q.o); map[k] = p.id; w.parts.push(p); }
  pr.pipes.forEach(([a, b, kind]) => w.pipes.push({ id: 'e' + (_id++), from: map[a], to: map[b], kind }));
  return w;
}
if (typeof module !== 'undefined') module.exports = { timeToGen, DEF, MEDIA, PRESETS, PIPE, buildPreset, analyze, timeTo, step, solveState, diagnose, chainsOf, graph, mkPart, freshWorld, cloneWorld, pipeAdapters, portConn, LPG, M_PER_PSI };

return Object.freeze({buildPreset,analyze,step,solveState,diagnose,cloneWorld,freshWorld,DEF,PRESETS});
})();
