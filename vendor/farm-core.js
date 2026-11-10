/* Vendored unmodified model source from worldlinemuse-lgtm/farm-sim; see README provenance. Only adapter wrapper added. */
var HomesteadFarmCore = (function(){

// Original: source/src/core/sources.js (blob e1708f1cb3cb63169cdbd272d10144581865982a)
// core/sources.js
// Settings context. The source table: short names for every Extension, FAO, vet-manual and supplier
// page the settings cite. Read by the settings table and the planner's formula notes. Changes nothing.
const SRC = {
  ukyF: ['Univ. of Kentucky ASC-191, How Much Will My Chickens Eat?', 'https://publications.mgcafe.uky.edu/files/ASC191.pdf'],
  fao4: ['FAO Rabbit, Table 10', 'https://www.fao.org/4/x5082e/X5082E04.htm'],
  psuB: [
    'Penn State sample fryer budget',
    'https://extension.psu.edu/downloadable/download/sample/sample_id/154487/'
  ],
  psu: ['Penn State', 'https://extension.psu.edu/rabbit-production'],
  psuL: ['Penn State', 'https://extension.psu.edu/management-requirements-for-laying-flocks'],
  usu: [
    'Utah State',
    'https://extension.usu.edu/small-acreage-livestock/research/rabbit-breeding-and-management-a-guide-for-producers'
  ],
  aces: [
    'Alabama Ext.',
    'https://www.aces.edu/blog/topics/farming/backyard-small-poultry-flock-management-series-feeding-the-laying-hen/'
  ],
  miz: [
    'Missouri Ext.',
    'https://extension.missouri.edu/media/wysiwyg/Extensiondata/CountyPages/Osage/Docs/Hatch-IncubatorTemp.pdf'
  ],
  msu4h: [
    'Michigan State 4-H, Summer Rabbit Care (archive)',
    'https://archive.lib.msu.edu/DMC/extension_publications/4H1440/4H1440.pdf'
  ],
  msu: [
    'Mississippi State',
    'https://extension.msstate.edu/agriculture/livestock/poultry/important-incubation-factors'
  ],
  fao5: ['FAO Rabbit, digestion', 'https://www.fao.org/4/x5082e/X5082E05.htm'],
  fao6: ['FAO Rabbit, feeding', 'https://www.fao.org/4/x5082e/X5082E06.htm'],
  fao7: ['FAO Rabbit, reproduction', 'https://www.fao.org/4/x5082e/X5082E07.htm'],
  fao9: ['FAO Rabbit, Table 34', 'https://www.fao.org/4/x5082e/X5082E09.htm'],
  faoS: ['FAO Rabbit, production systems', 'https://www.fao.org/4/x5082e/X5082E03.htm'],
  faoH: ['FAO Rabbit, housing', 'https://www.fao.org/4/x5082e/X5082E0e.htm'],
  faoT49: ['FAO Rabbit, Table 49 (density and fattening)', 'https://www.fao.org/4/x5082e/X5082E0e.htm'],
  faoN: ['FAO Rabbit, environment (newborn kits: nest at least 28°C, huddling)', 'https://www.fao.org/4/x5082e/X5082E0e.htm'],
  faoM: ['FAO Rabbit, management', 'https://www.fao.org/4/x5082e/X5082E0g.htm'],
  merck: [
    'Merck Vet Manual',
    'https://www.merckvetmanual.com/poultry/nutrition-and-management-poultry/nutritional-requirements-of-poultry'
  ],
  ufl: ['Univ. of Florida', 'https://ask.ifas.ufl.edu/publication/PS029/pdf'],
  hyline: ['Hy-Line heat guide', 'https://www.hyline.com/Upload/Resources/TU%20HEAT%20ENG.pdf'],
  faoP: ['FAO Rabbit, pathology', 'https://www.fao.org/4/x5082e/X5082E0c.htm'],
  noaa: [
    'NOAA 1991-2020 normals, Hawley 1 E',
    'https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/access/USC00363758.csv'
  ],
  ghcn: [
    'NOAA daily records 1991-2020, Hawley 1 E',
    'https://www.ncei.noaa.gov/data/global-historical-climatology-network-daily/access/USC00363758.csv'
  ],
  tamu: [
    'Texas A&M AgriLife',
    'https://cdn-de.agrilife.org/extension/departments/posc/posc-pu-018/publications/files/incubating-and-hatching-eggs.pdf'
  ],
  hlA: ['Hy-Line Brown guide', 'https://hylinena.com/wp-content/uploads/2019/10/Brown_Alt_English.pdf'],
  msuV: [
    'Mississippi State',
    'https://extension.msstate.edu/publications/broiler-house-ventilation-during-cold-weather'
  ],
  eia: [
    'EIA, PA residential, Aug 2026',
    'https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epm_table_5_06_a'
  ],
  tscR: ['Tractor Supply, Nov 4 2026', 'https://www.tractorsupply.com/tsc/search/rabbit-feed-50-lb'],
  tscL: ['Tractor Supply, Nov 4 2026', 'https://www.tractorsupply.com/tsc/search/layer-feed-50-lb'],
  tscS: ['Tractor Supply, Nov 4 2026', 'https://www.tractorsupply.com/tsc/search/chick-starter-50-lb'],
  fao8: ['FAO Rabbit, breeds', 'https://www.fao.org/4/x5082e/X5082E08.htm'],
  pmcFR: [
    'Vet Med Int 2011, feed restriction in pregnant NZW does (PMC3166777)',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC3166777/'
  ],
  wurR: ['Wageningen Univ., Rommers thesis, rearing of rabbit does (2003)', 'https://edepot.wur.nl/121483'],
  fao3: ['FAO Rabbit, history', 'https://www.fao.org/4/x5082e/X5082E03.htm'],
  osuA: ['Ohio State 4-H (Animal Welfare Act cage sizes)', 'https://ohioline.osu.edu/factsheet/4h-31'],
  usuC: [
    'Utah State, laying breeds',
    'https://extension.usu.edu/small-acreage-livestock/research/managing-chickens-from-chicks-to-peak-egg-production'
  ],
  lcPR: [
    'Livestock Conservancy, Plymouth Rock',
    'https://livestockconservancy.org/heritage-breeds/heritage-breeds-list/plymouth-rock-chicken/'
  ],
  mizB: ['Missouri Extension G8353, incubating eggs', 'https://extension.missouri.edu/publications/g8353'],
  attra: [
    'ATTRA, Pastured Poultry Nutrition and Forages (reprinted by The Poultry Site)',
    'https://www.thepoultrysite.com/articles/advantages-of-forage-consumption-by-poultry'
  ],
  dv: ['worked out from sources', ''],
  as: ['assumption', ''],
  pr: ['placeholder', ''],
  ch: ['your choice', '']
};



// Original: source/src/core/settings.js (blob 6a78d328a260b4d9abe8a6054b2f330e524e523b)
// core/settings.js
// Settings context. PARAMS is every editable assumption with its group, unit, source and whether it is
// sourced, worked out or a guess; P holds the live values. TYPES lists the pens and fixtures you can
// place, with their editable properties. Only commands (app/commands.js) change P after start-up.
// [key, group, label, value, unit, source, type]
// Columns: key (read as P[key]); group (the settings panel section: Management, Feeding, Planner, Rabbits,
// Health & behaviour, Chickens, Environment, Labor, Prices); label shown in the panel; default
// value; unit; source tag, a key of SRC in core/sources.js (dv = worked out from sources, as = assumption,
// pr = placeholder price, ch = your choice); type (none = number, bool = yes/no switch, sel = a choice list).
const PARAMS = [
  ['mg_does', 'Management', 'Breeding does to keep', 6, 'does', 'ch'],
  ['mg_sell_fryers', 'Management', 'Sell fryers at sale age', 1, 'yes/no', 'ch', 'bool'],
  ['mg_hens', 'Management', 'Laying hens to keep', 12, 'hens', 'ch'],
  ['mg_roosters', 'Management', 'Roosters to keep', 1, 'birds', 'ch'],
  ['mg_set', 'Management', 'Eggs set in incubator per week', 5, 'eggs/wk', 'ch'],
  ['mg_sell_birds', 'Management', 'Sell surplus young birds', 1, 'yes/no', 'ch', 'bool'],
  ['mg_spare_buck', 'Management', 'Spare bucks kept as backup', 1, 'bucks', 'ch'],
  ['mg_rebal', 'Management', 'Move rabbits out of an over-full hutch bank when another has room', 1, 'yes/no', 'ch', 'bool'],
  [
    'mg_rsv_does',
    'Management',
    'Reserve does held back to step in for lost breeders (FAO: rabbits kept past sale age form a reserve for stock renewal; only pays off when the hutch banks have spare floor)',
    0,
    'does',
    'faoM'
  ],
  [
    'mg_restock',
    'Management',
    'Buy breeders when the herd cannot refill itself (no buck on hand, or under 2 does with no young does coming)',
    1,
    'yes/no',
    'ch',
    'bool'
  ],
  [
    'mg_rsv_look',
    'Management',
    'Before holding back a reserve doe, count the floor coming litters will need (kits now nursing, plus the expected weaned kits of pregnant does)',
    1,
    'yes/no',
    'ch',
    'bool'
  ],
  [
    'fd_rab',
    'Feeding',
    'Young rabbits (weaning on): what they are fed',
    0,
    'diet',
    'ch',
    'sel',
    ['Pellets only', 'Pellets + free-choice straw or hay', 'Alfalfa hay + corn, no pellets']
  ],
  ['fd_rough_pel', 'Feeding', 'Pellets eaten when straw/hay is free-choice, vs pellets alone (88.3 vs 94.7 g/day)', 93.2, '%', 'fao6'],
  ['fd_rough_eat', 'Feeding', 'Straw/hay eaten, as a share of pellets eaten (7.4 vs 88.3 g/day)', 8.4, '%', 'fao6'],
  ['fd_rough_gain', 'Feeding', 'Growth with free-choice straw/hay, vs pellets alone (31.0 vs 31.7 g/day)', 97.8, '%', 'fao6'],
  ['fd_alf_gain', 'Feeding', 'Growth on alfalfa + corn, vs pellets (wean at 30 d; 2.2 kg at 88 vs 78 d)', 82.8, '%', 'fao4'],
  ['fd_alf_fcr', 'Feeding', 'Feed per lb gained on alfalfa + corn, vs pellets (4.80 vs 3.92, dry matter)', 122.4, '%', 'fao4'],
  ['fd_alf_hay', 'Feeding', 'Alfalfa share of the alfalfa + corn diet (rabbits choose 65:35)', 65, '%', 'fao5'],
  ['fd_range', 'Feeding', 'Hens and roosters range on pasture by day', 0, 'yes/no', 'ch', 'bool'],
  ['fd_range_pct', 'Feeding', 'Share of the diet found on pasture in the best months (ATTRA: 5-20%)', 12.5, '%', 'attra'],
  ['pl_micro', 'Planner', 'Planner uses your pens\' shade, fans, heaters and coop insulation, as the day-by-day sim does', 1, 'yes/no', 'ch', 'bool'],
  ['pl_cal', 'Planner', 'Mating calendar: planner averages conception over the matings a doe really has, as the day-by-day sim does (off = average over calendar days)', 1, 'yes/no', 'ch', 'bool'],
  ['pl_heat', 'Planner', 'Heat-sterile bucks: planner counts the days every buck is sterile from summer heat, drawn from the same day-to-day weather as the day-by-day sim (off = bucks fertile all year)', 1, 'yes/no', 'msu4h', 'bool'],
  ['pl_heat_yrs', 'Planner', 'Simulated weather years behind the heat-sterile buck days (one year varies a lot: SD about 27 days on the default farm)', 100, 'years', 'as'],
  ['rb_gest', 'Rabbits', 'Gestation', 31, 'days', 'psu'],
  ['rb_gest_var', 'Rabbits', 'Gestation spread (±)', 2, 'days', 'usu'],
  ['rb_litter', 'Rabbits', 'Mean litter size at birth', 9, 'kits', 'psu'],
  ['rb_litter_sd', 'Rabbits', 'Litter size SD', 2, 'kits', 'as'],
  ['rb_loss', 'Rabbits', 'Kit loss before weaning, average litter', 20, '%', 'faoM'],
  ['rb_wean', 'Rabbits', 'Weaning age', 30, 'days', 'psu'],
  ['rb_rebreed', 'Rabbits', 'Rebreed after kindling', 35, 'days', 'usu'],
  ['rb_doe_age', 'Rabbits', 'Doe breeding age', 180, 'days', 'psu'],
  ['rb_buck_age', 'Rabbits', 'Buck breeding age', 210, 'days', 'psu'],
  ['rb_dpb', 'Rabbits', 'Does per buck (max)', 10, 'does', 'psu'],
  ['rb_buck_week', 'Rabbits', 'Matings per buck per 7 days (max)', 3, 'matings', 'psu'],
  [
    'rb_concep',
    'Rabbits',
    'Kindlings per mating (FAO survey avg; best units 81, poorest 49)',
    67,
    '%',
    'faoM'
  ],
  ['rb_pseudo', 'Rabbits', 'Failed matings that cause false pregnancy (FAO: "very uncommon")', 3, '%', 'as'],
  ['rb_pseudo_days', 'Rabbits', 'False pregnancy length', 16, 'days', 'fao7'],
  ['rb_season', 'Rabbits', 'Fertility dip, Aug to Nov', 15, '%', 'as'],
  ['rb_mate_every', 'Rabbits', 'Days between mating checks', 7, 'days', 'usu'],
  ['rb_light', 'Rabbits', 'Light target for breeding', 14, 'h/day', 'usu'],
  ['rb_sale_age', 'Rabbits', 'Fryer sale age', 70, 'days', 'psu'],
  ['rb_sale_wt', 'Rabbits', 'Live weight at sale age', 5, 'lb', 'psu'],
  ['rb_adult_wt', 'Rabbits', 'Mature weight (breed)', 10, 'lb', 'psu'],
  ['rb_birth_wt', 'Rabbits', 'Birth weight', 0.13, 'lb', 'as'],
  ['rb_cage', 'Rabbits', 'Floor per adult or doe+litter', 6.25, 'sq ft', 'psu'],
  ['rb_grower', 'Rabbits', 'Floor per weaned grower', 1.1, 'sq ft', 'faoH'],
  ['rb_grp_max', 'Rabbits', 'Growers per group cage (FAO: 5-10 in France and Spain)', 8, 'rabbits', 'faoS'],
  [
    'rb_hop_n',
    'Rabbits',
    'Growers per feed hopper (FAO: 10; at least 2 hoppers per group)',
    10,
    'rabbits',
    'fao6'
  ],
  ['rb_drink_n', 'Rabbits', 'Growers per watering point (FAO: 10-15)', 12, 'rabbits', 'fao6'],
  [
    'rb_split',
    'Rabbits',
    'Split growers at the split age: bucks to own cages, does to roomier group',
    1,
    'yes/no',
    'faoM',
    'bool'
  ],
  [
    'rb_sep_age',
    'Rabbits',
    'Split age (FAO: bucks kept past 3 months must be caged alone or castrated)',
    90,
    'days',
    'faoM'
  ],
  [
    'rb_doe_grp',
    'Rabbits',
    'Floor per young doe in a group after the split age (FAO: 0.5 m2)',
    5.4,
    'sq ft',
    'faoH'
  ],
  ['rb_pub_wt', 'Rabbits', 'Doe puberty weight (FAO: 70-75% of mature weight)', 72, '% of mature', 'fao7'],
  ['rb_male_fert', 'Rabbits', 'Age a young buck is fertile (FAO: usable from 20 weeks)', 140, 'days', 'fao7'],
  [
    'rb_early',
    'Health & behaviour',
    'Chance per week that a pubertal doe is bred by a fertile young buck in an unsplit group',
    50,
    '%',
    'as'
  ],
  [
    'rb_crowd_g',
    'Rabbits',
    'Grower growth under crowding follows FAO Table 49 (full growth down to 0.69 sq ft a grower, 12% slower at 0.58); off: growth × 1 / density',
    1,
    'yes/no',
    'faoT49',
    'bool'
  ],
  [
    'rb_cf_health',
    'Rabbits',
    'Doe health lowers conception: chance per mating × health/100 (size unsourced; off = health ignored at mating)',
    1,
    'yes/no',
    'as',
    'bool'
  ],
  [
    'rb_cf_crowd',
    'Rabbits',
    'Over-full hutch bank lowers conception: chance per mating × 1/density, floor 0.3 (size unsourced; off = space ignored at mating)',
    1,
    'yes/no',
    'as',
    'bool'
  ],
  [
    'rb_ls_health',
    'Rabbits',
    'Doe health shrinks the litter: kits × (0.7 + 0.3 × health/100) at kindling (size unsourced; off = full-size litters whatever her health)',
    1,
    'yes/no',
    'as',
    'bool'
  ],
  [
    'rb_g_health',
    'Rabbits',
    'Poor health slows growth: daily gain × health/100 (size unsourced, and health already falls from the crowding, heat and cold the FAO growth rules count; off = gain set by the FAO rules alone)',
    1,
    'yes/no',
    'as',
    'bool'
  ],
  ['rb_kit_cold', 'Health & behaviour', 'Cold limit (kits, birth to weaning)', 20, '°F', 'as'],
  [
    'rb_nest_cold',
    'Health & behaviour',
    'Kits still in the nest box lose health below the kit cold limit (unsourced; off = nest kits skip cold, since FAO\'s pre-weaning loss already includes nest chilling and a bedded nest holds 86-95°F)',
    1,
    'yes/no',
    'as',
    'bool'
  ],
  ['rb_kit_h0', 'Health & behaviour', 'Health score of a newborn kit (recovers at the daily recovery rate)', 85, 'pts', 'as'],
  [
    'rb_grp_loss',
    'Health & behaviour',
    'Feed and growth lost by growers pushed off a short hopper or drinker',
    25,
    '%',
    'as'
  ],
  [
    'hl_fight',
    'Health & behaviour',
    'Health lost per day per rival, young bucks past split age left in a group',
    1.5,
    'pts/day',
    'as'
  ],
  ['rb_feed_m', 'Rabbits', 'Pellets, bucks and open does', 7, 'oz/day', 'psu'],
  ['rb_de', 'Rabbits', 'Pellet energy', 2500, 'kcal DE/kg', 'fao6'],
  ['rb_e_grow', 'Rabbits', 'Energy eaten, growing rabbit', 230, 'kcal/kg^0.75', 'fao6'],
  ['rb_e_lact', 'Rabbits', 'Energy eaten, nursing doe at peak', 360, 'kcal/kg^0.75', 'fao6'],
  ['rb_e_preg', 'Rabbits', 'Energy eaten, pregnant doe', 230, 'kcal/kg^0.75', 'as'],
  ['rb_late_drop', 'Rabbits', 'Feed drop, last 3 days of pregnancy', 40, '%', 'as'],
  ['rb_solid_start', 'Rabbits', 'Kits start eating pellets', 18, 'days old', 'faoM'],
  ['rb_solid_30', 'Rabbits', 'Share of kit diet from pellets at 30 days', 80, '%', 'faoM'],
  ['rb_water_nurse', 'Rabbits', 'Water, nursing doe', 225, 'g per kg body wt', 'fao5'],
  ['rb_tf41', 'Rabbits', 'Feed eaten at 41°F vs 64°F', 115, '%', 'fao5'],
  ['rb_tf86', 'Rabbits', 'Feed eaten at 86°F vs 64°F', 78, '%', 'fao5'],
  ['rb_tg41', 'Rabbits', 'Growth at 41°F vs 64°F', 94, '%', 'fao5'],
  ['rb_tg86', 'Rabbits', 'Growth at 86°F vs 64°F', 68, '%', 'fao5'],
  ['rb_tw41', 'Rabbits', 'Water to feed ratio at 41°F', 1.8, 'lb/lb', 'fao5'],
  ['rb_tw64', 'Rabbits', 'Water to feed ratio at 64°F', 1.71, 'lb/lb', 'fao5'],
  ['rb_tw86', 'Rabbits', 'Water to feed ratio at 86°F', 3.14, 'lb/lb', 'fao5'],
  ['rb_heat_hl', 'Rabbits', 'Heat stress starts (health)', 86, '°F', 'faoH'],
  ['rb_heat_sev', 'Rabbits', 'Heat prostration (health ×3)', 95, '°F', 'faoH'],
  ['rb_heat', 'Rabbits', 'Heat limit (buck sterility)', 85, '°F', 'usu'],
  ['rb_heat_days', 'Rabbits', 'Hot days in a row to sterilize (MSU: "4 or 5 days in a row" over 85°F)', 4, 'days', 'msu4h'],
  ['rb_sterile', 'Rabbits', 'Buck recovery time (MSU: "up to 60 days")', 45, 'days', 'as'],
  ['rb_retire', 'Rabbits', 'Doe retirement age', 1100, 'days', 'as'],
  ['ck_incub', 'Chickens', 'Incubation period', 21, 'days', 'msu'],
  ['ck_opt', 'Chickens', 'Incubator optimum', 100, '°F', 'miz'],
  ['ck_shift', 'Chickens', 'Hatch shift per °F off optimum', 10.8, 'hours', 'miz'],
  ['ck_hatch', 'Chickens', 'Hatch rate of fertile eggs, good conditions', 75, '%', 'as'],
  ['ck_store', 'Chickens', 'Average egg age when set (collected all week, set weekly)', 3.5, 'days', 'dv'],
  ['ck_store_loss', 'Chickens', 'Hatch lost per day of storage past 7 days (0.5-1.5)', 1, '%/day', 'tamu'],
  ['ck_rh', 'Chickens', 'Best incubator humidity, days 1-18', 58, '% RH', 'tamu'],
  ['ck_rh_loss', 'Chickens', 'Hatch lost per % RH beyond ±3 of best', 2, '%/pt', 'as'],
  ['ck_fert', 'Chickens', 'Fertility with enough roosters', 85, '%', 'as'],
  ['ck_hpr', 'Chickens', 'Hens per rooster', 10, 'hens', 'as'],
  ['ck_lay_age', 'Chickens', 'Age at first egg', 140, 'days', 'psuL'],
  ['ck_peak', 'Chickens', 'Peak lay rate (purebreds lay less)', 90, '%', 'ufl'],
  ['ck_peak_wk', 'Chickens', 'Weeks from first egg to peak', 7, 'weeks', 'ufl'],
  ['ck_lay52', 'Chickens', 'Lay rate after 52 weeks of lay', 65, '%', 'ufl'],
  ['ck_molt_after', 'Chickens', 'Weeks of lay before a fall molt can start', 50, 'weeks', 'ufl'],
  ['ck_molt_max', 'Chickens', 'Weeks of lay before molt regardless', 60, 'weeks', 'ufl'],
  ['ck_molt_days', 'Chickens', 'Molt length (no eggs)', 77, 'days', 'psuL'],
  ['ck_cycle_drop', 'Chickens', 'Lower peak each later laying cycle', 10, '%', 'as'],
  ['ck_feed', 'Chickens', 'Feed per adult bird', 0.25, 'lb/day', 'aces'],
  ['ck_bw0', 'Chickens', 'Chick weight at hatch', 40, 'g', 'as'],
  ['ck_bw6', 'Chickens', 'Pullet weight at 6 weeks', 500, 'g', 'merck'],
  ['ck_bw12', 'Chickens', 'Pullet weight at 12 weeks', 1100, 'g', 'merck'],
  ['ck_bw18', 'Chickens', 'Pullet weight at 18 weeks', 1500, 'g', 'merck'],
  ['ck_bw1', 'Chickens', 'Weight at first egg (feed scale)', 1600, 'g', 'merck'],
  ['ck_coop', 'Chickens', 'Coop floor per bird', 1.5, 'sq ft', 'psuL'],
  ['ck_run', 'Chickens', 'Run per bird', 5, 'sq ft', 'psuL'],
  ['ck_brood_sqft', 'Chickens', 'Brooder floor per chick', 0.5, 'sq ft', 'psuL'],
  ['ck_brood_days', 'Chickens', 'Days in brooder', 49, 'days', 'psuL'],
  ['ck_brood_t', 'Chickens', 'Brooder temp, week 1', 93, '°F', 'psuL'],
  ['ck_brood_drop', 'Chickens', 'Brooder temp drop per week', 5, '°F', 'psuL'],
  ['ck_lamp', 'Chickens', 'Heat added per 250 W lamp', 40, '°F', 'as'],
  ['ck_light', 'Chickens', 'Light target for full lay', 14, 'h/day', 'psuL'],
  ['ck_light_min', 'Chickens', 'Light where laying stops', 10, 'h/day', 'as'],
  ['ck_heat', 'Chickens', 'Day-average temp where laying drops', 77, '°F', 'hyline'],
  ['ck_heat_loss', 'Chickens', 'Lay loss per °F above that', 3, '%/°F', 'as'],
  ['ck_hpn', 'Chickens', 'Hens per nest box', 4, 'hens', 'psuL'],
  ['ck_w70', 'Chickens', 'Water to feed ratio at 70°F', 2, 'lb/lb', 'hyline'],
  ['ck_w100', 'Chickens', 'Water to feed ratio at 100°F', 8, 'lb/lb', 'hyline'],
  ['ck_heat_hl', 'Chickens', 'Heat stress starts (health)', 91, '°F', 'hyline'],
  ['ck_sale_age', 'Chickens', 'Surplus young bird sale age', 112, 'days', 'as'],
  ['ck_retire', 'Chickens', 'Hen retirement age', 1095, 'days', 'as'],
  ['hl_crowd', 'Health & behaviour', 'Health loss at 150% density', 2, 'pts/day', 'as'],
  ['hl_heat', 'Health & behaviour', 'Health loss per °F over heat limit', 0.5, 'pts/day', 'as'],
  ['hl_cold_lim', 'Health & behaviour', 'Cold limit (adults)', 10, '°F', 'as'],
  ['hl_cold', 'Health & behaviour', 'Health loss per °F under cold limit', 0.3, 'pts/day', 'as'],
  ['hl_expo', 'Health & behaviour', 'Health loss with no pen', 3, 'pts/day', 'as'],
  ['hl_rec', 'Health & behaviour', 'Recovery when unstressed', 1.5, 'pts/day', 'as'],
  ['hl_mort', 'Health & behaviour', 'Baseline death risk, adult rabbits', 0.02, '%/day', 'as'],
  ['ck_mort', 'Health & behaviour', 'Baseline death risk, hens 18-90 wk (93% live)', 0.0144, '%/day', 'hlA'],
  [
    'ck_mort_r',
    'Health & behaviour',
    'Baseline death risk, chicks/pullets 0-17 wk (98% live)',
    0.017,
    '%/day',
    'hlA'
  ],
  [
    'rb_gdis',
    'Health & behaviour',
    'Grower losses to diarrhoea, weaning to sale (FAO "usual" 10-15%)',
    10,
    '%',
    'faoP'
  ],
  [
    'rb_nest_crowd',
    'Health & behaviour',
    'Kits in the nest feel pen crowding (1=yes)',
    0,
    'yes/no',
    'as',
    'bool'
  ],
  ['hl_mort_low', 'Health & behaviour', 'Extra death risk at health 0', 3, '%/day', 'as'],
  ['hl_feed_cold', 'Health & behaviour', 'Chickens: extra feed per °F under 50°F', 0.8, '%', 'as'],
  ['hl_feed_hot', 'Health & behaviour', 'Chickens: less feed per °F over 80°F', 1, '%', 'as'],
  ['ck_me', 'Chickens', 'Layer feed energy (ME)', 2800, 'kcal/kg', 'hlA'],
  ['ck_sens', 'Chickens', "Share of a bird's heat given off as sensible (warming) heat", 0.6, 'share', 'as'],
  ['env_lat', 'Environment', 'Latitude (Honesdale, PA ≈ 41.6)', 41.6, '°N', 'as'],
  ['env_indoor', 'Environment', 'Indoor temperature, for a brooder set indoors', 55, '°F', 'as'],
  ['env_shift', 'Environment', 'Warmer (+) or colder (-) than the 1991-2020 normals', 0, '°F', 'ch'],
  ['env_sdx', 'Environment', 'Day-to-day weather swings (1 = as observed)', 1, '×', 'ghcn'],
  ['env_ar', 'Environment', 'Day-to-day persistence of warm/cold spells', 0.68, 'r', 'ghcn'],
  ['env_seed', 'Environment', 'Random seed (on reset)', 7, '', 'as'],
  ['lb_trips', 'Labor', 'Chore trips per pen per day', 2, 'trips', 'as'],
  ['lb_mph', 'Labor', 'Walking speed', 3, 'mph', 'as'],
  ['lb_hands', 'Labor', 'Hands-on time per animal', 0.5, 'min/day', 'as'],
  ['pr_rfeed', 'Prices', "Rabbit pellets, 50 lb bag (Producer's Pride 15%)", 21.99, '$', 'tscR'],
  ['pr_cfeed', 'Prices', "Layer pellets, 50 lb bag (Producer's Pride 16%)", 16.49, '$', 'tscL'],
  ['pr_sfeed', 'Prices', 'Chick starter, 50 lb bag (Kent Home Fresh)', 21.99, '$', 'tscS'],
  ['pr_egg', 'Prices', 'Eggs, farm-gate (US store avg Sep 2026 was $2.27)', 4, '$/dozen', 'pr'],
  ['pr_fryer', 'Prices', 'Fryer, live weight', 4, '$/lb', 'pr'],
  ['pr_bird', 'Prices', 'Surplus young bird', 5, '$/bird', 'pr'],
  ['pr_kwh', 'Prices', 'Electricity (PA residential average)', 0.2177, '$/kWh', 'eia'],
  ['pr_hay', 'Prices', 'Hay or straw for rabbits', 0.3, '$/lb', 'pr'],
  ['pr_grain', 'Prices', 'Whole or cracked corn, 50 lb bag', 15, '$', 'pr'],
  ['pr_rstock', 'Prices', 'Breeding rabbit (bought)', 40, '$/head', 'psu'],
  ['pr_cstock', 'Prices', 'Chicken (bought)', 20, '$/bird', 'pr'],
  ['ck_perch', 'Chickens', 'Perch per bird', 6, 'in', 'psuL'],
  ['ck_feeder_in', 'Chickens', 'Feeder space per bird', 3, 'in', 'psuL'],
  ['ck_water_in', 'Chickens', 'Waterer space per bird', 1, 'in', 'psuL'],
  ['ck_water_min', 'Chickens', 'Minimum water to supply', 5, 'gal per 100 birds/day', 'psuL'],
  [
    'ck_rank_loss',
    'Health & behaviour',
    'Feed and lay lost by birds pushed off a short feeder or waterer (pecking order)',
    25,
    '%',
    'as'
  ]
];
// P: the live value of every setting, by its PARAMS key (P.rb_wean, P.pr_kwh ...). Filled by resetParams() and
// by loading a saved farm; the settings panel writes here. Every model formula reads its numbers from P.
const P = {};
// Puts every setting in P back to its default (the 4th column of its PARAMS row). Runs once at load and again
// when the user resets the settings.
function resetParams() {
  PARAMS.forEach(p => (P[p[0]] = p[3]));
}
resetParams();

// TYPES: every kind of building or fixture that can go on the plot, by type key. label: the name shown;
// w, d: default footprint (ft across, ft deep); cost: purchase price ($) counted in the ledger; pen: 1 for
// buildings that house animals (they get a density and a space lens); round: 1 for things drawn and placed
// as a 2 x 2 ft circle (tree, fan, heater); props: editable settings copied onto each new one by comp(),
// labelled in the panel by PROPLAB.
const TYPES = {
  hutch: {
    label: 'Rabbit hutch bank',
    pen: 1,
    w: 12,
    d: 3,
    cost: 300,
    props: { lights: 0, lightHours: 14, lightWatts: 20, hoppers: 4, drinkers: 4 }
  },
  coop: {
    label: 'Chicken coop',
    pen: 1,
    w: 8,
    d: 6,
    cost: 600,
    props: {
      lights: 0,
      lightHours: 14,
      lightWatts: 40,
      wallR: 1,
      ventCfm: 10,
      height: 6,
      nests: 4,
      perchFt: 8,
      feederIn: 48,
      waterIn: 24
    }
  },
  run: { label: 'Chicken run', w: 12, d: 10, cost: 150, props: {} },
  brooder: { label: 'Brooder', pen: 1, w: 4, d: 3, cost: 60, props: { lampWatts: 250 } },
  incubator: {
    label: 'Incubator',
    w: 2,
    d: 2,
    cost: 150,
    props: { capacity: 24, setpoint: 100, watts: 60, on: 1, rh: 58 }
  },
  tree: { label: 'Shade tree', round: 1, w: 2, d: 2, cost: 0, props: { radius: 15, shade: 8 } },
  fan: {
    label: 'Fan',
    round: 1,
    w: 2,
    d: 2,
    cost: 40,
    props: { radius: 12, cooling: 6, watts: 100, trigger: 80 }
  },
  heater: { label: 'Heater', round: 1, w: 2, d: 2, cost: 60, props: { radius: 8, setpoint: 35, watts: 250 } },
  feed: { label: 'Feed shed', w: 6, d: 6, cost: 200, props: {} },
  water: { label: 'Water point', w: 2, d: 2, cost: 50, props: {} }
};
// PROPLAB: the panel label (with units) for each building setting key used in TYPES[...].props.
const PROPLAB = {
  hoppers: 'Grower feed hoppers',
  drinkers: 'Grower watering points',
  nests: 'Nest boxes',
  perchFt: 'Perch length (ft)',
  feederIn: 'Feeder space (in of trough or rim)',
  waterIn: 'Waterer space (in of lip)',
  wallR: 'Wall/roof R-value (R-1 bare, R-11 batt)',
  ventCfm: 'Winter ventilation (cfm)',
  height: 'Height (ft)',
  rh: 'Humidity (% RH)',
  lights: 'Lights on (0/1)',
  lightHours: 'Lighting target (h)',
  lightWatts: 'Light watts',
  lampWatts: 'Heat lamp watts',
  capacity: 'Capacity (eggs)',
  setpoint: 'Setpoint (°F)',
  watts: 'Watts',
  on: 'On (0/1)',
  radius: 'Radius (ft)',
  shade: 'Shade cooling (°F)',
  cooling: 'Cooling (°F)',
  trigger: 'Runs above (°F)'
};
// PLOT: the size of the plot in ft (80 across, 50 deep). The planner keeps new buildings inside it.
const PLOT = { w: 80, h: 50 };



// Original: source/src/core/breeds.js (blob 6519ca16bc57bb7e6c5d27564644f3834b5826b5)
// core/breeds.js
// Settings context. Breed presets. Picking a breed writes a set of ordinary settings (mature weight,
// growth, breeding age, cage floor, feed, pullet weights, laying curve). The formulas do not change,
// and every value can still be edited by hand afterwards. Each value carries its own source tag:
// SRC key, plus 'dv' (worked out from sources) or 'as' (assumption) where it is not printed anywhere.
// The first preset of each kind equals the default settings, so a farm that never picks a breed
// runs exactly as before.
const RB_BREEDS = {
  nzw: {
    refs: ['psu'],
    label: 'New Zealand White (medium, meat)',
    set: { rb_adult_wt: 10, rb_sale_wt: 5, rb_doe_age: 180, rb_buck_age: 210, rb_cage: 6.25, rb_feed_m: 7 },
    tag: { rb_adult_wt: 'psu', rb_sale_wt: 'psu', rb_doe_age: 'psu', rb_buck_age: 'psu', rb_cage: 'psu', rb_feed_m: 'psu' },
    why: {
      rb_adult_wt: 'Penn State breed table: New Zealand 9-12 lb',
      rb_sale_wt: 'Penn State: fryers sold at 5 lb, about 10 weeks',
      rb_doe_age: 'Penn State: medium breeds start breeding at 6-7 months',
      rb_buck_age: 'Penn State: males mature one month later than females',
      rb_cage: 'Penn State: 30 × 30 in cage for mature bucks and does',
      rb_feed_m: 'Penn State: bucks and does without litters need 6 to 8 oz of pellets a day'
    },
    note: 'Penn State: "For meat production, medium-weight New Zealand Whites are best, followed by Californians."'
  },
  cal: {
    refs: ['psu', 'fao8', 'osuA'],
    label: 'Californian (medium, meat)',
    set: { rb_adult_wt: 9.5, rb_sale_wt: 4.75, rb_doe_age: 180, rb_buck_age: 210, rb_cage: 6.25, rb_feed_m: 6.7 },
    tag: { rb_adult_wt: 'psu', rb_sale_wt: 'as', rb_doe_age: 'psu', rb_buck_age: 'psu', rb_cage: 'osuA', rb_feed_m: 'dv' },
    why: {
      rb_adult_wt: 'Penn State breed table: Californian 8-11 lb (midpoint); FAO gives 3.6-4 kg (7.9-8.8 lb)',
      rb_sale_wt: 'assumption: same share of mature weight at 10 weeks (50%) as the Penn State New Zealand figure',
      rb_doe_age: 'Penn State: medium breeds start breeding at 6-7 months',
      rb_buck_age: 'Penn State: males mature one month later than females',
      rb_cage: 'Animal Welfare Act class 8.8-11.9 lb is the same as New Zealand, so the Penn State 30 × 30 in cage stays',
      rb_feed_m: 'worked out: 7 oz × (9.5 / 10)^0.75, the same energy per kg^0.75 as the Penn State figure'
    },
    note: 'FAO: a synthetic American meat breed, adult weight 3.6-4 kg. Litter size is left at the shared setting: no source gave a separate Californian figure.'
  },
  flem: {
    refs: ['psu', 'fao8', 'fao7', 'fao3', 'osuA'],
    label: 'Flemish Giant (large)',
    set: { rb_adult_wt: 15, rb_sale_wt: 7.5, rb_doe_age: 240, rb_buck_age: 270, rb_cage: 7.8, rb_feed_m: 9.5 },
    tag: { rb_adult_wt: 'psu', rb_sale_wt: 'as', rb_doe_age: 'fao7', rb_buck_age: 'psu', rb_cage: 'dv', rb_feed_m: 'dv' },
    why: {
      rb_adult_wt: 'Penn State: Flemish Giants 13+ lb, large class 14-16 lb (midpoint); FAO: potential adult weight 7 kg',
      rb_sale_wt: 'assumption: 50% of mature weight at 10 weeks, as for New Zealand. Ohio State 4-H lists fryers at 3.5-5.5 lb (8-10 weeks), so 7.5 lb is above the fryer class',
      rb_doe_age: 'FAO: sexual maturity 5-8 months in large breeds against 4-6 in medium; 8 months sits where Penn State puts medium breeds in theirs',
      rb_buck_age: 'Penn State: males mature one month later than females',
      rb_cage: 'worked out: 6.25 sq ft × 5.0 / 4.0, the Animal Welfare Act step from the 8.8-11.9 lb class to the over 11.9 lb class',
      rb_feed_m: 'worked out: 7 oz × (15 / 10)^0.75, the same energy per kg^0.75 as the Penn State figure'
    },
    note: 'FAO (rabbit handbook, chapter 3): Flemish Giants and the other large European breeds find it hard to live on mesh cage floors as adults, because the pads of their paws are not adapted like those of New Zealand Whites and Californians. Give them a solid resting board. Sore hocks are not modelled.'
  }
};
// CK_BREEDS: the hen presets, laid out like RB_BREEDS above (label, refs, the settings each preset writes, notes).
const CK_BREEDS = {
  brown: {
    refs: ['psuL', 'ufl', 'aces', 'merck'],
    label: 'Commercial brown-egg hybrid (Hy-Line Brown type)',
    set: { ck_lay_age: 140, ck_peak: 90, ck_peak_wk: 7, ck_lay52: 65, ck_feed: 0.25, ck_bw6: 500, ck_bw12: 1100, ck_bw18: 1500, ck_bw1: 1600 },
    tag: { ck_lay_age: 'psuL', ck_peak: 'ufl', ck_peak_wk: 'ufl', ck_lay52: 'ufl', ck_feed: 'aces', ck_bw6: 'merck', ck_bw12: 'merck', ck_bw18: 'merck', ck_bw1: 'merck' },
    why: {
      ck_lay_age: 'Penn State: pullets come into production at around 20 weeks',
      ck_peak: 'Univ. of Florida: production peaks at about 90%',
      ck_peak_wk: 'Univ. of Florida: peak 6-8 weeks after laying starts',
      ck_lay52: 'Univ. of Florida laying curve',
      ck_feed: 'Alabama Extension: about 0.25 lb of feed per hen per day',
      ck_bw6: 'Merck (NRC) brown-egg pullet weights', ck_bw12: 'Merck (NRC) brown-egg pullet weights',
      ck_bw18: 'Merck (NRC) brown-egg pullet weights', ck_bw1: 'Merck (NRC) brown-egg weight at first egg'
    },
    note: 'Penn State: brown-egg Reds and sex-linked hybrids "tend to be more docile and are usually preferred for small family flocks."'
  },
  white: {
    refs: ['psuL', 'ufl', 'merck', 'usuC', 'mizB'],
    label: 'Commercial white-egg hybrid (White Leghorn type)',
    set: { ck_lay_age: 140, ck_peak: 90, ck_peak_wk: 7, ck_lay52: 65, ck_feed: 0.235, ck_bw6: 450, ck_bw12: 980, ck_bw18: 1375, ck_bw1: 1475 },
    tag: { ck_lay_age: 'psuL', ck_peak: 'ufl', ck_peak_wk: 'ufl', ck_lay52: 'ufl', ck_feed: 'dv', ck_bw6: 'merck', ck_bw12: 'merck', ck_bw18: 'merck', ck_bw1: 'merck' },
    why: {
      ck_lay_age: 'Penn State: pullets come into production at around 20 weeks',
      ck_peak: 'Univ. of Florida curve, kept: Utah State lists White Leghorns at 280-320 eggs a year',
      ck_peak_wk: 'Univ. of Florida: peak 6-8 weeks after laying starts',
      ck_lay52: 'Univ. of Florida laying curve',
      ck_feed: 'worked out: 0.25 lb × (1475 / 1600)^0.75, the Alabama figure scaled to the lighter bird',
      ck_bw6: 'Merck (NRC) white-egg pullet weights', ck_bw12: 'Merck (NRC) white-egg pullet weights',
      ck_bw18: 'Merck (NRC) white-egg pullet weights', ck_bw1: 'Merck (NRC) white-egg weight at first egg'
    },
    note: 'Penn State: Leghorns are "much more flighty". Missouri Extension: Leghorns "seldom become broody". Utah State lists them for hot weather.'
  },
  prock: {
    refs: ['lcPR', 'usuC', 'ufl', 'ukyF', 'merck', 'hlA'],
    label: 'Heritage dual-purpose (Plymouth Rock)',
    set: { ck_lay_age: 154, ck_peak: 67, ck_peak_wk: 7, ck_lay52: 48, ck_feed: 0.28, ck_bw6: 865, ck_bw12: 1900, ck_bw18: 2595, ck_bw1: 2770 },
    tag: { ck_lay_age: 'dv', ck_peak: 'dv', ck_peak_wk: 'ufl', ck_lay52: 'dv', ck_feed: 'ukyF', ck_bw6: 'dv', ck_bw12: 'dv', ck_bw18: 'dv', ck_bw1: 'dv' },
    why: {
      ck_lay_age: 'worked out: 22 weeks, the late end of Florida\'s "18-22 weeks of age, depending on the breed"',
      ck_peak: 'worked out: sized so the first 52 weeks of lay give about 200 eggs (Livestock Conservancy: "around 200"; Utah State: 200-250)',
      ck_peak_wk: 'Univ. of Florida: peak 6-8 weeks after laying starts',
      ck_lay52: 'worked out: same fall from peak as the Florida curve (65/90 of peak)',
      ck_feed: 'Univ. of Kentucky: 25 "Dual purpose-type hens" eat "4-4½ bags each month" of 50 lb, which is 0.26-0.30 lb a hen a day; 0.28 is the middle (white-shell layers: 3-3½ bags, brown-shell: 3-4)',
      ck_bw6: 'worked out: Merck brown-egg weight × 1.73', ck_bw12: 'worked out: Merck brown-egg weight × 1.73',
      ck_bw18: 'worked out: Merck brown-egg weight × 1.73',
      ck_bw1: 'worked out: Merck brown-egg weight × 1.73. 1.73 = 7.5 lb Plymouth Rock hen (Livestock Conservancy) / 1.97 kg, the midpoint of the Hy-Line Brown guide range of 1.91-2.03 kg at 72 weeks'
    },
    note: 'Livestock Conservancy: hens 7.5 lb, "usually good sitters and mothers", "strong for the first few years". Broody spells are not modelled: no Extension source gave a rate.'
  }
};
// Which preset the current settings match, or null when any value was edited by hand.
function breedOf(table) {
  for (const [k, b] of Object.entries(table))
    if (Object.entries(b.set).every(([p, v]) => Math.abs(+P[p] - v) < 1e-9)) return k;
  return null;
}



// Original: source/src/core/state.js (blob b5f56f71daa8699b1be29c32962a12932c5b8915)
// core/state.js
// Time and randomness context. The model's random stream (rngNext, gauss: the only dice in the
// program), the farm state S, newState() for the starting farm, the model calendar (S.day, dateOf) and
// the event log.
// ---------- RNG ----------
function rngNext() {
  let t = (S.rs += 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
// One standard normal number (mean 0, spread 1) from two draws of the model stream (Box-Muller). Used for size
// and growth scatter between animals.
function gauss() {
  let u = 0,
    v = 0;
  while (!u) u = rngNext();
  v = rngNext();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
// clamp(x, a, b): x held between a and b.
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// S: the whole farm state (day, animals, buildings in S.comps, eggs in incubators, totals in S.tot, the daily
// history in S.hist, the event log). Made by newState(), changed only by step() and the commands; saved and
// loaded as one object.
let S = null;
// Makes a new building or fixture of the given type at (x, y) ft: a fresh id (c1, c2 ...), the size and cost
// from TYPES, a deep copy of its default properties, then any extra fields given. Does not add it to S.comps.
function comp(type, x, y, extra) {
  const T = TYPES[type];
  return Object.assign(
    { id: 'c' + S.nextC++, type, name: T.label, x, y, w: T.w, d: T.d, cost: T.cost },
    JSON.parse(JSON.stringify(T.props)),
    extra || {}
  );
}
// Makes a new animal record (species, sex, age in days, then any extra fields) with the next id and the
// starting health and counters. Does not add it to S.animals.
function animal(sp, sex, age, extra) {
  const a = {
    id: S.nextId++,
    sp,
    sex,
    age,
    health: 90,
    enc: null,
    st: 'adult',
    wt: 0,
    preg: null,
    gestLen: 0,
    kindle: null,
    nextMate: 0,
    mother: null,
    hot: 0,
    sterileUntil: -1,
    keep: 0,
    eggs: 0,
    born: S.day - age
  };
  if (sp === 'rabbit') {
    a.st = age < P.rb_wean ? 'kit' : age < (sex === 'F' ? P.rb_doe_age : P.rb_buck_age) ? 'grower' : 'adult';
    a.wt = rabCurve(age);
  } else {
    a.st =
      age < P.ck_brood_days
        ? 'chick'
        : age < P.ck_lay_age
          ? sex === 'F'
            ? 'pullet'
            : 'cockerel'
          : sex === 'F'
            ? 'hen'
            : 'rooster';
    a.wt = ckWtG(age) / 453.6;
  }
  return Object.assign(a, extra || {});
}
// Builds the starting farm into S: day 0 is Nov 4 2026, the random stream seeded from the env_seed setting,
// the default buildings and the starting rabbits and hens, empty log and totals.
function newState() {
  S = {
    day: 0,
    start: new Date(2026, 10, 4),
    rs: P.env_seed >>> 0 || 7,
    noise: 0,
    nextId: 1,
    nextC: 1,
    animals: [],
    comps: [],
    eggsInc: [],
    hist: [],
    log: [],
    setWeek: 0,
    tot: {
      rev: 0,
      feedCost: 0,
      powerCost: 0,
      stock: 0,
      eggsLaid: 0,
      eggsSold: 0,
      hatched: 0,
      born: 0,
      fryers: 0,
      deaths: 0,
      causes: {}
    },
    today: null
  };
  const c = S.comps;
  c.push(
    comp('feed', 2, 2),
    comp('water', 11, 2),
    comp('hutch', 4, 14),
    comp('coop', 40, 10, { w: 8, d: 8 }),
    comp('run', 48, 10, { w: 12, d: 14 }),
    comp('tree', 22, 22),
    comp('brooder', 40, 32, { indoor: 1 }),
    comp('incubator', 47, 32),
    comp('hutch', 4, 20)
  );
  const hutch = c[2].id;
  for (let i = 0; i < 4; i++) {
    const d = animal('rabbit', 'F', 300 + i * 20, { enc: hutch });
    S.animals.push(d);
  }
  S.animals[0].preg = 20;
  S.animals[0].gestLen = 31;
  S.animals[1].preg = 6;
  S.animals[1].gestLen = 32;
  S.animals.push(animal('rabbit', 'M', 400, { enc: hutch }));
  for (let i = 0; i < 10; i++) S.animals.push(animal('chicken', 'F', 230 + i * 5, { enc: c[3].id }));
  S.animals.push(animal('chicken', 'M', 300, { enc: c[3].id }));
  S.bought = { r: 5, c: 11 }; // head bought; S.tot.stock is these times today's stock prices
  S.tot.stock = S.bought.r * P.pr_rstock + S.bought.c * P.pr_cstock;
  S.today = computeDay(true);
  logE('Farm set up: 4 does (2 already bred), 1 buck, 10 hens, 1 rooster.');
}
// The calendar date of model day n (day 0 = the start date in S.start).
function dateOf(day) {
  const d = new Date(S.start);
  d.setDate(d.getDate() + day);
  return d;
}
// Model day n as a short readable date, for example "Wed, Nov 4, 2026".
function fmtDate(day) {
  return dateOf(day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
// Adds one line to the top of the event log, stamped with the model day and date.
function logE(s) {
  S.log.unshift(
    'Day ' +
      S.day +
      ' (' +
      dateOf(S.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      '): ' +
      s
  );
  if (S.log.length > 200) S.log.length = 200;
}



// Original: source/src/core/environment.js (blob c5cdf160ed33f8c88329a0b8d46097ae5ca4210f)
// core/environment.js
// Environment context. Daily weather built from NOAA 1991-2020 normals for Hawley, PA, day length and
// sun times from latitude, and the hour-by-hour temperature curve used only for what you see. Reads P
// and S.day. Changes nothing but the random stream.
// ---------- environment ----------
function doyOf(day) {
  const d = dateOf(day);
  return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
}
// Hours of daylight on day-of-year doy at the farm's latitude (env_lat), from the sun's declination.
function dayLength(doy) {
  const lat = (P.env_lat * Math.PI) / 180,
    dec = ((23.44 * Math.PI) / 180) * Math.sin((2 * Math.PI * (284 + doy)) / 365);
  const x = clamp(-Math.tan(lat) * Math.tan(dec), -1, 1);
  return (2 * Math.acos(x) * 180) / Math.PI / 15;
}
// Temperature at an hour of the day, for display and animal behavior only: no formula uses it, so
// the daily numbers can't drift from it. A cosine curve that is at the day's low at sunrise and its
// high at 3 PM, then falls back toward the low by the next sunrise. It passes through the same low
// and high the daily formulas use, so the hour shown always belongs to the day they come from.
const PEAK_HOUR = 15;
// Air temperature at a clock hour, from the day's low (at sunrise, hour rise) and high (at PEAK_HOUR) along
// cosine curves. Display and animal behaviour only.
function tempAtHour(tmin, tmax, hour, rise) {
  const h = ((hour % 24) + 24) % 24,
    r = clamp(rise, 3, 9);
  if (h >= r && h <= PEAK_HOUR) return tmin + ((tmax - tmin) * (1 - Math.cos((Math.PI * (h - r)) / (PEAK_HOUR - r)))) / 2;
  const s = (h - PEAK_HOUR + 24) % 24,
    span = r + 24 - PEAK_HOUR;
  return tmax - ((tmax - tmin) * (1 - Math.cos((Math.PI * s) / span))) / 2;
}
// Sun time: sunrise is half a day length before noon. (Clock time runs about 20 minutes behind sun
// time in winter here and 40 minutes ahead in summer; the sim keeps sun time throughout.)
function riseOf(dayLen) {
  return 12 - dayLen / 2;
}
// Hours of the day the hourly curve spends above a trigger, in quarter-hour steps. Used for fan
// running time, so the fan you see turning and the fan on the power bill are the same fan.
function hoursAbove(tmin, tmax, dayLen, thr) {
  if (tmax <= thr) return 0;
  let n = 0;
  for (let h = 0.125; h < 24; h += 0.25) if (tempAtHour(tmin, tmax, h, riseOf(dayLen)) > thr) n += 0.25;
  return n;
}
// Average share of full power a thermostat heater draws over the day: at each quarter hour it
// covers the gap to its setpoint, reaching full power at 30°F below it (the old daily rule, now
// applied hour by hour instead of to the day's low all day long).
function heaterDuty(tmin, tmax, dayLen, setpoint) {
  if (tmin >= setpoint) return 0;
  let s = 0;
  for (let h = 0.125; h < 24; h += 0.25) s += clamp((setpoint - tempAtHour(tmin, tmax, h, riseOf(dayLen))) / 30, 0, 1);
  return s / 96;
}
// NOAA 1991-2020 monthly normals, Hawley 1 E (USC00363758, 10 mi S of Honesdale, 889 ft). °F
const NORM_TX = [33.0, 35.7, 44.6, 57.5, 68.9, 76.7, 81.3, 79.4, 72.8, 60.8, 48.6, 37.9];
const NORM_TN = [13.5, 14.2, 22.0, 32.1, 43.0, 52.5, 56.8, 54.7, 47.7, 36.4, 27.4, 20.0]; // normal daily low by month, °F
// Worked out from the station's 1991-2020 daily records (GHCN-Daily) against its daily normals, by month:
// SD of daily high and low departures (°F), and how strongly a day's high and low departures move together.
const NORM_SDX = [11.1, 10.5, 11.5, 11.2, 9.7, 7.7, 6.1, 6.3, 7.1, 9.0, 10.0, 9.8];
const NORM_SDN = [12.1, 11.0, 9.5, 7.5, 7.9, 6.6, 6.1, 6.7, 8.0, 8.1, 8.2, 9.7]; // SD of daily low departures by month, °F
const NORM_RHO = [0.72, 0.64, 0.64, 0.48, 0.48, 0.48, 0.47, 0.32, 0.4, 0.42, 0.56, 0.65]; // correlation of high and low departures by month
// The normal (average) daily high and low for model day n and their spread and correlation, blended between
// this month and the nearest neighbouring month (NOAA tables above).
function normAt(day) {
  const d = dateOf(day),
    m = d.getMonth(),
    dim = new Date(d.getFullYear(), m + 1, 0).getDate(),
    f = (d.getDate() - 0.5) / dim - 0.5;
  const m2 = (m + (f >= 0 ? 1 : 11)) % 12,
    w = Math.abs(f);
  const L = A => A[m] * (1 - w) + A[m2] * w;
  return { tx: L(NORM_TX), tn: L(NORM_TN), sdx: L(NORM_SDX), sdn: L(NORM_SDN), rho: L(NORM_RHO) };
}
// Today's weather: the normal for the date plus a slowly wandering random departure (one shared part and one
// each for the high and the low). With advance true it first moves the departures on one day, using the model
// stream; with false it only reads them. Returns high, low, mean, day length and the departure.
function weather(advance) {
  const doy = doyOf(S.day);
  for (const k of ['noise', 'nzx', 'nzn']) if (!isFinite(S[k]) || Math.abs(S[k]) > 6) S[k] = 0;
  const r = clamp(P.env_ar, 0, 0.99),
    q = Math.sqrt(1 - r * r);
  if (advance) {
    S.noise = r * S.noise + q * gauss();
    S.nzx = r * S.nzx + q * gauss();
    S.nzn = r * S.nzn + q * gauss();
  }
  const n = normAt(S.day),
    a = Math.sqrt(n.rho),
    b = Math.sqrt(1 - n.rho);
  const ax = (a * S.noise + b * S.nzx) * n.sdx * P.env_sdx + P.env_shift,
    ann = (a * S.noise + b * S.nzn) * n.sdn * P.env_sdx + P.env_shift;
  const tmax = Math.max(n.tx + ax, n.tn + ann + 2),
    tmin = Math.min(n.tn + ann, tmax - 2);
  return {
    doy,
    tmean: (tmax + tmin) / 2,
    tmax,
    tmin,
    day: dayLength(doy),
    normTx: n.tx,
    normTn: n.tn,
    anom: (ax + ann) / 2
  };
}



// Original: source/src/core/housing.js (blob 0152eed43ba0ca381cc56c53670a93abca137a9d)
// core/housing.js
// Housing and layout context. Pen geometry, shade, fans, heaters, coop body heat and insulation, light
// hours: each pen's microclimate for the day. Reads S.comps and P. Changes nothing.
// ---------- geometry ----------
const ctr = c => (TYPES[c.type].round ? [c.x + 1, c.y + 1] : [c.x + c.w / 2, c.y + c.d / 2]);
// dist(a, b): straight-line distance between two [x, y] points, ft. ctr above gives a building's centre.
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// True when two buildings touch or stand within 1 ft of each other (used to find the runs attached to a coop).
function touches(a, b) {
  return a.x <= b.x + b.w + 1 && b.x <= a.x + a.w + 1 && a.y <= b.y + b.d + 1 && b.y <= a.y + a.d + 1;
}
// plan (optional, planner only): { n, lb } = birds in this coop and feed per bird, used in place of the
// birds now housed there for the coop's body-heat lift. Without it nothing changes.
function micro(pen, env, plan) {
  let shade = 0,
    cool = 0,
    heatTo = -999,
    fans = [],
    heaters = [];
  const p = ctr(pen);
  for (const c of S.comps) {
    if (!TYPES[c.type].round) continue;
    const r = dist(p, ctr(c));
    if (r > c.radius) continue;
    const f = 1 - r / c.radius;
    if (c.type === 'tree' && env.tmax > 70) shade += c.shade * f;
    if (c.type === 'fan' && env.tmax > c.trigger) {
      cool += c.cooling * f;
      fans.push(c);
    }
    if (c.type === 'heater') {
      heatTo = Math.max(heatTo, c.setpoint);
      heaters.push(c);
    }
  }
  let lift = 0,
    coopQ = null;
  if (pen.type === 'coop') {
    coopQ = coopHeat(pen, plan);
    lift = coopQ.lift;
  }
  const tmax = env.tmax - shade - cool;
  let tmin = env.tmin + lift,
    heated = false;
  if (heatTo > tmin) {
    tmin = Math.min(heatTo, Math.max(tmax, heatTo));
    heated = true;
  }
  const light = pen.lights && +pen.lights ? Math.max(env.day, pen.lightHours) : env.day;
  return { tmax, tmin, shade, cool, heated, light, lift, coopQ };
}
// Night heat balance of a closed coop: lift (°F) = birds' sensible heat / (conduction UA + ventilation).
// UA = envelope area / R (MSU: curtain R-1, 3.5 in batt wall R-11). Air: 1.08 BTU/h per cfm per °F. 1 W = 3.412 BTU/h.
// Bird heat = ME intake (feed lb x 0.4536 x ME kcal/kg) / 20.64 kcal per W-day, egg energy not subtracted.
function coopHeat(pen, plan) {
  const h = +pen.height || 6,
    area = 2 * (pen.w + pen.d) * h + 2 * pen.w * pen.d,
    R = Math.max(0.5, +pen.wallR || 1),
    cfm = Math.max(0, +pen.ventCfm || 0);
  let W = 0,
    n = 0;
  if (plan) {
    n = Math.max(0, plan.n);
    W = (n * plan.lb * 0.4536 * P.ck_me) / 20.64;
  } else
  for (const a of S.animals)
    if (a.sp === 'chicken' && a.enc === pen.id) {
      n++;
      const lb = a.feedLb != null ? a.feedLb : P.ck_feed;
      W += (lb * 0.4536 * P.ck_me) / 20.64;
    }
  const q = W * P.ck_sens * 3.412,
    UA = area / R,
    V = 1.08 * cfm;
  return { n, W, q, UA, V, area, R, cfm, lift: q / Math.max(1, UA + V) };
}



// Original: source/src/core/biology.js (blob 46cb5cccbfb8283da7f198983f19a5fd8daef34c)
// core/biology.js
// Rabbits and chickens contexts. Growth curves, pullet weights and the energy-based daily intake
// shared by the daily step, the planner and the animation.
// ---- Contents (top-level functions, in file order; kept by tools/code_contents.py) ----
//   rabK - Daily rate k for rabbit growth, chosen so that growth from birth weight toward adult weight (W = A
//         - (A - B) e^(-k t)) reaches the sale weight at the sale age.
//   gomp - Gompertz growth: W = A*exp(-b*exp(-c*t)), forced through birth weight and sale weight at sale age
//         (Penn State: 5 lb at ~10 weeks)
//   rabCurve - Expected live weight of a rabbit at this age (Gompertz growth curve, parameters from gomp() for
//         the chosen breed).
//   lerp3 - piecewise-linear through values at 41, 64, 86 °F (FAO Table 19); extends at most half a step past
//         each end
//   rabTemp - How the day's mean temperature changes a rabbit's feed, gain and water (FAO Table 19 points at
//         41, 64 and 86 F, drawn straight between).
//   energyFeedLb - feed (lb/day) that supplies e kcal DE per kg^0.75 (FAO) from pellets of P.rb_de kcal/kg
//   maintE - Maintenance energy for an adult rabbit (kcal per kg^0.75 a day), from the Penn State daily feed
//         for the adult weight and the pellet's energy.
//   lactShape - lactation intake shape (FAO): rises to peak at days 15-20, then falls; averages ~0.86 of peak
//         over 30 days
//   kitSolid - Share of a kit's food that is solid feed at this age: 0 before rb_solid_start, rising in a
//         straight line to rb_solid_30 at 30 days.
//   kitSurv - Share of a litter of n kits expected alive at weaning (FAO Table 34), scaled by the rb_loss
//         setting.
//   ckWtG - NRC brown-egg pullet weights via Merck (g)
//   ckWaterRatio - Water to feed ratio for chickens at temperature T F: ck_w70 up to 70 F, rising toward
//         ck_w100 at 100 F.
//   layCurve - University of Florida laying curve, per laying cycle
// ---- end of contents ----
// ---------- growth ----------

// Daily rate k for rabbit growth, chosen so that growth from birth weight toward adult weight
// (W = A - (A - B) e^(-k t)) reaches the sale weight at the sale age.
function rabK() {
  const bw = P.rb_birth_wt,
    aw = P.rb_adult_wt,
    sw = P.rb_sale_wt;
  const fr = clamp((sw - bw) / (aw - bw), 0.01, 0.99);
  return -Math.log(1 - fr) / Math.max(1, P.rb_sale_age);
}
// Gompertz growth: W = A*exp(-b*exp(-c*t)), forced through birth weight and sale weight at sale age (Penn State: 5 lb at ~10 weeks)
function gomp() {
  const A = P.rb_adult_wt,
    b = Math.log(A / Math.max(0.01, P.rb_birth_wt));
  const r = Math.log(A / Math.min(A * 0.99, P.rb_sale_wt)) / b;
  return { A, b, c: -Math.log(Math.max(1e-6, r)) / Math.max(1, P.rb_sale_age) };
}
// Expected live weight of a rabbit at this age (Gompertz growth curve, parameters from gomp() for the chosen
// breed).
function rabCurve(age) {
  const g = gomp();
  return g.A * Math.exp(-g.b * Math.exp(-g.c * Math.max(0, age)));
}
// tMean(m): the day's mean temperature (°F) for microclimate m, the average of its high and low.
const tMean = m => (m.tmax + m.tmin) / 2;
// piecewise-linear through values at 41, 64, 86 °F (FAO Table 19); extends at most half a step past each end
function lerp3(T, a, b, c) {
  return T <= 64 ? b + (a - b) * clamp((64 - T) / 23, 0, 1.5) : b + (c - b) * clamp((T - 64) / 22, 0, 1.4);
}
// How the day's mean temperature changes a rabbit's feed, gain and water (FAO Table 19 points at 41, 64 and 86
// F, drawn straight between).
function rabTemp(m) {
  const T = tMean(m);
  return {
    T,
    feed: lerp3(T, P.rb_tf41 / 100, 1, P.rb_tf86 / 100),
    gain: Math.max(0.2, lerp3(T, P.rb_tg41 / 100, 1, P.rb_tg86 / 100)),
    wr: lerp3(T, P.rb_tw41, P.rb_tw64, P.rb_tw86)
  };
}
const LB = 0.4536; // kg in one lb
// feed (lb/day) that supplies e kcal DE per kg^0.75 (FAO) from pellets of P.rb_de kcal/kg
function energyFeedLb(e, wtLb) {
  return (e * Math.pow(Math.max(0.05, wtLb * LB), 0.75)) / Math.max(500, P.rb_de) / LB;
}
// Maintenance energy for an adult rabbit (kcal per kg^0.75 a day), from the Penn State daily feed for the
// adult weight and the pellet's energy.
function maintE() {
  return ((P.rb_feed_m / 16) * LB * P.rb_de) / Math.pow(P.rb_adult_wt * LB, 0.75);
} // Penn State oz/day as kcal/kg^0.75
// lactation intake shape (FAO): rises to peak at days 15-20, then falls; averages ~0.86 of peak over 30 days
function lactShape(d) {
  if (d < 17) return 0.6 + (0.4 * d) / 17;
  if (d <= 21) return 1;
  return Math.max(0.8, 1 - (0.2 * (d - 21)) / 9);
}
// Share of a kit's food that is solid feed at this age: 0 before rb_solid_start, rising in a straight line to
// rb_solid_30 at 30 days.
function kitSolid(age) {
  if (age < P.rb_solid_start) return 0;
  return clamp(((P.rb_solid_30 / 100) * (age - P.rb_solid_start)) / Math.max(1, 30 - P.rb_solid_start), 0, 1);
}
// FAO Table 34: share of kits alive at weaning by litter size (1..14)
const KIT_V = [0.35, 0.35, 0.68, 0.81, 0.81, 0.81, 0.84, 0.83, 0.83, 0.82, 0.78, 0.75, 0.71, 0.66, 0.61];
// Share of a litter of n kits expected alive at weaning (FAO Table 34), scaled by the rb_loss setting.
function kitSurv(n) {
  const v = KIT_V[clamp(Math.round(n || 8), 1, 14)];
  return clamp(1 - ((1 - v) * P.rb_loss) / 20, 0.01, 1);
}
// NRC brown-egg pullet weights via Merck (g)
function ckWtG(age) {
  const pts = [
    [0, P.ck_bw0],
    [42, P.ck_bw6],
    [84, P.ck_bw12],
    [126, P.ck_bw18],
    [Math.max(127, P.ck_lay_age), P.ck_bw1]
  ];
  if (age >= pts[4][0]) return P.ck_bw1;
  for (let i = 1; i < pts.length; i++)
    if (age <= pts[i][0]) {
      const [a0, w0] = pts[i - 1],
        [a1, w1] = pts[i];
      return w0 + ((w1 - w0) * (age - a0)) / (a1 - a0);
    }
  return P.ck_bw1;
}
// Water to feed ratio for chickens at temperature T F: ck_w70 up to 70 F, rising toward ck_w100 at 100 F.
function ckWaterRatio(T) {
  return T <= 70 ? P.ck_w70 : P.ck_w70 + (P.ck_w100 - P.ck_w70) * Math.min(1.2, (T - 70) / 30);
}
// University of Florida laying curve, per laying cycle
function layCurve(a) {
  if (a.age < P.ck_lay_age || a.molt > 0) return 0;
  const w = (a.age - (a.cycStart != null ? a.cycStart : P.ck_lay_age)) / 7;
  const peak0 = P.ck_peak / 100,
    peak = peak0 * Math.pow(1 - P.ck_cycle_drop / 100, Math.max(0, (a.cycle || 1) - 1));
  if (w < P.ck_peak_wk) return peak * (0.15 + (0.85 * w) / Math.max(0.5, P.ck_peak_wk));
  const fall = ((1 - P.ck_lay52 / P.ck_peak) * (w - P.ck_peak_wk)) / Math.max(1, 52 - P.ck_peak_wk);
  return peak * Math.max(0.3, 1 - fall);
}



// Original: source/src/core/loads.js (blob 1b77f70a18e8d550b482021a7322a370735e0416)
// core/loads.js
// Housing context. How full each pen is, space per animal, best pen for a newcomer and rehouse(),
// which moves animals that have no fitting pen.
// ---------- loads ----------
function pens(type) {
  return S.comps.filter(c => c.type === type);
}
// True when this young rabbit has reached the split age and the "split growers" setting is on, so it needs a
// cage of its own.
function rabSplit(a) {
  return +P.rb_split && a.st === 'grower' && a.age >= P.rb_sep_age;
}
// Cage floor (sq ft) this rabbit takes: kits 0 (they count with their mother), growers by group or single-cage
// size, adults by breeding cage size.
function rabSpace(a) {
  return a.st === 'kit'
    ? 0
    : a.st === 'grower'
      ? rabSplit(a)
        ? a.sex === 'M'
          ? P.rb_cage
          : P.rb_doe_grp
        : P.rb_grower
      : P.rb_cage;
}
// Floor space in use in every building, by building id: rabbits by rabSpace, chicks by the brooder allowance,
// hens by the coop allowance.
function loads() {
  const L = {};
  S.comps.forEach(c => (L[c.id] = 0));
  const hasBrooder = pens('brooder').length > 0;
  for (const a of S.animals) {
    if (!a.enc || !(a.enc in L)) continue;
    if (a.sp === 'rabbit') L[a.enc] += rabSpace(a);
    else {
      const t = compById(a.enc).type;
      L[a.enc] += t === 'brooder' ? P.ck_brood_sqft : P.ck_coop;
    }
  }
  return L;
}
// The building or fixture with this id, or undefined.
function compById(id) {
  return S.comps.find(c => c.id === id);
}
// How full a building is: floor in use (from loads) per sq ft of its area. A missing building counts as 3
// (over-full).
function density(id, L) {
  const c = compById(id);
  if (!c) return 3;
  return L[id] / Math.max(0.1, c.w * c.d);
}
// Of all buildings of this type, the one with the least floor in use per sq ft (where a newcomer goes), or
// null when there are none.
function bestPen(type, L) {
  let best = null,
    bd = 1e9;
  for (const c of pens(type)) {
    const dd = L[c.id] / (c.w * c.d);
    if (dd < bd) {
      bd = dd;
      best = c;
    }
  }
  return best;
}
// Run space for the flock: area of runs touching a coop, number of grown birds, the area they need and the
// ratio need / area (9 when there is no run at all).
function runInfo() {
  const coops = pens('coop'),
    runs = pens('run');
  let area = 0;
  for (const r of runs) if (coops.some(c => touches(c, r))) area += r.w * r.d;
  const birds = S.animals.filter(
    a =>
      (a.sp === 'chicken' && a.st !== 'chick') ||
      (a.sp === 'chicken' && a.st === 'chick' && a.enc && compById(a.enc) && compById(a.enc).type === 'coop')
  ).length;
  return { area, birds, need: birds * P.ck_run, ratio: area > 0 ? (birds * P.ck_run) / area : birds ? 9 : 0 };
}
// Moves every animal that is not in a building of the right type (rabbits in a hutch bank, chicks in a brooder
// when there is one, hens in a coop) to the least full fitting one, then lets rebalance() even out over-full
// hutch banks when that setting is on.
function rehouse() {
  const L = loads();
  for (const a of S.animals) {
    const c = a.enc && compById(a.enc);
    let want;
    if (a.sp === 'rabbit') want = 'hutch';
    else want = a.st === 'chick' && pens('brooder').length ? 'brooder' : 'coop';
    if (!c || c.type !== want) {
      const p = bestPen(want, L);
      const old = a.enc;
      a.enc = p ? p.id : null;
      if (p) {
        L[p.id] += a.sp === 'rabbit' ? rabSpace(a) : want === 'brooder' ? P.ck_brood_sqft : P.ck_coop;
      }
      if (old && L[old] != null && c) L[old] -= 0;
    }
  }
  if (+P.mg_rebal) rebalance(L);
}
// A keeper moves rabbits out of an over-full hutch bank into another bank that still has room
// after the move. Bucks and growers go first, then does with no unweaned kits; a nursing doe stays
// with her litter. No dice: the same farm always gives the same moves.
function rebalance(L) {
  const hutches = pens('hutch');
  if (hutches.length < 2) return;
  const nursing = new Set(S.animals.filter(k => k.st === 'kit' && k.mother != null).map(k => k.mother));
  for (const c of hutches) {
    const movable = S.animals
      .filter(a => a.sp === 'rabbit' && a.enc === c.id && a.st !== 'kit' && !nursing.has(a.id))
      .sort((x, y) => (x.sex === 'F' && x.st === 'adult') - (y.sex === 'F' && y.st === 'adult') || x.id - y.id);
    for (const a of movable) {
      if (L[c.id] / (c.w * c.d) <= 1) break;
      const sp = rabSpace(a);
      let to = null,
        bd = 1e9;
      for (const o of hutches) {
        if (o === c) continue;
        const dd = (L[o.id] + sp) / (o.w * o.d);
        if (dd <= 1 && dd < bd) {
          bd = dd;
          to = o;
        }
      }
      if (!to) break;
      a.enc = to.id;
      L[c.id] -= sp;
      L[to.id] += sp;
    }
  }
}



// Original: source/src/core/access.js (blob 7427ff168179b75293d8c1fd620317d1e5f9a24d)
// core/access.js
// Feeding access context. Pecking order at coop feeders, waterers and perches, and young rabbit groups
// at hoppers and drinkers, with fights and early pregnancies. No dice. Results are cached per day;
// commands clear the cache when the whole state is replaced.
// ---------- pecking order at the feeder, waterer and perch ----------
// Penn State space allowances: 3 in of feeder, 1 in of waterer and 6 in of perch per bird.
// Birds are ranked by a fixed per-bird number (the flock's pecking order). When the feeder or waterer
// is shorter than the flock needs, the lowest-ranked birds are the ones pushed off. How much feed and
// lay they lose (ck_rank_loss) is an assumption. A short perch only changes where birds sleep.
const ACC = { key: '', map: new Map(), coop: {} };
// Bumped by every user edit and whenever S is replaced (load, range check). The cache keys below
// only see the day, the head count and the fixtures, so without this an edit that moved animals
// between pens on the same day (or loading another farm on the same day) reused stale results.
let ACCESS_GEN = 0;
// Clears the cached pecking order and grower groups (bumps ACCESS_GEN). Called by every user edit and when S
// is replaced.
function invalidateAccess() {
  ACCESS_GEN++;
}
// A bird's fixed place in the pecking order, 0 to 1, from its id (no dice, so it never changes).
function rankOf(a) {
  return (a.id * 0.6180339887) % 1;
}
// Works out, once per day and farm, every grown bird's rank in its coop and whether it is pushed off a short
// feeder or waterer (crowded) or off a short perch (floor). Cached in ACC.
function accessCalc() {
  const cps = pens('coop');
  const key =
    ACCESS_GEN +
    '|' +
    S.day +
    '|' +
    S.animals.length +
    '|' +
    P.ck_feeder_in +
    ',' +
    P.ck_water_in +
    ',' +
    P.ck_perch +
    '|' +
    cps.map(c => [c.id, c.feederIn, c.waterIn, c.perchFt].join(',')).join(';');
  if (key === ACC.key) return ACC;
  ACC.key = key;
  ACC.map = new Map();
  ACC.coop = {};
  for (const c of cps) {
    const birds = S.animals
        .filter(a => a.sp === 'chicken' && a.enc === c.id && a.st !== 'chick')
        .sort((x, y) => rankOf(x) - rankOf(y)),
      n = birds.length;
    const fIn = coopFix(c, 'feederIn'),
      wIn = coopFix(c, 'waterIn'),
      pFt = coopFix(c, 'perchFt');
    const fs = n ? Math.min(1, fIn / (n * Math.max(0.1, P.ck_feeder_in))) : 1,
      ws = n ? Math.min(1, wIn / (n * Math.max(0.1, P.ck_water_in))) : 1,
      share = Math.min(fs, ws);
    const atFeed = Math.min(n, Math.floor(share * n + 1e-9)),
      perchCap = Math.floor((pFt * 12) / Math.max(0.1, P.ck_perch));
    birds.forEach((a, i) =>
      ACC.map.set(a.id, {
        rank: i + 1,
        n,
        crowded: i >= atFeed,
        floor: i >= perchCap,
        perchIdx: i,
        perchCap,
        coop: c.id
      })
    );
    ACC.coop[c.id] = {
      n,
      fs,
      ws,
      share,
      atFeed,
      perchCap,
      crowded: n - atFeed,
      floor: Math.max(0, n - perchCap),
      fIn,
      wIn,
      pFt
    };
  }
  return ACC;
}
// This bird's entry from accessCalc (rank, crowded, floor, perch place), or null for rabbits.
function accessOf(a) {
  return a && a.sp === 'chicken' ? accessCalc().map.get(a.id) : null;
}
// Feed and lay factor for a bird: 1, or less by the ck_rank_loss setting when it is pushed off the feeder or
// waterer.
function accessF(a) {
  const r = accessOf(a);
  return r && r.crowded ? 1 - clamp(P.ck_rank_loss, 0, 100) / 100 : 1;
}
// ---------- rabbit grower groups: hoppers, watering points, fights ----------
// FAO: one feed hopper per 10 growers (at least 2 per group), one watering point per 10-15 growers.
// Growers stay in groups until the split age; with the split on, young bucks then go to their own cages.
// Left unsplit, young bucks past the split age fight (health loss hl_fight, an assumption) and
// pubertal does can be bred early by fertile young bucks (rb_early, an assumption). No dice are used here.
const RG = { key: '', map: new Map(), hutch: {} };
// A hutch bank's fixture value k (hoppers, drinkers ...): its own when set, else the default from TYPES.
function hutchFix(c, k) {
  return c && c[k] != null ? +c[k] : TYPES.hutch.props[k];
}
// True for a young rabbit that still lives in a grower group (not yet split off as a buck).
function inGroup(a) {
  return a.sp === 'rabbit' && a.st === 'grower' && !(+P.rb_split && a.sex === 'M' && a.age >= P.rb_sep_age);
}
// Works out, once per day and farm, the grower groups in each hutch bank: hopper and drinker places per
// rabbit, who is crowded off, fights and early pregnancies. Cached.
function rgCalc() {
  const hs = pens('hutch');
  const key =
    ACCESS_GEN +
    '|' +
    S.day +
    '|' +
    S.animals.length +
    '|' +
    [P.rb_hop_n, P.rb_drink_n, P.rb_split, P.rb_sep_age, P.rb_male_fert].join(',') +
    '|' +
    hs.map(c => [c.id, c.hoppers, c.drinkers].join(',')).join(';');
  if (key === RG.key) return RG;
  RG.key = key;
  RG.map = new Map();
  RG.hutch = {};
  for (const c of hs) {
    const g = S.animals.filter(a => a.enc === c.id && inGroup(a)).sort((x, y) => rankOf(x) - rankOf(y)),
      n = g.length;
    const hop = hutchFix(c, 'hoppers'),
      dr = hutchFix(c, 'drinkers');
    const fs = n ? Math.min(1, (hop * Math.max(0.1, P.rb_hop_n)) / n) : 1,
      ws = n ? Math.min(1, (dr * Math.max(0.1, P.rb_drink_n)) / n) : 1,
      share = Math.min(fs, ws),
      atFeed = Math.min(n, Math.floor(share * n + 1e-9));
    const rivals = +P.rb_split ? [] : g.filter(a => a.sex === 'M' && a.age >= P.rb_sep_age),
      fertM = +P.rb_split ? 0 : g.filter(a => a.sex === 'M' && a.age >= P.rb_male_fert).length;
    g.forEach((a, i) =>
      RG.map.set(a.id, {
        rank: i + 1,
        n,
        crowded: i >= atFeed,
        fight: rivals.length > 1 && rivals.includes(a) ? rivals.length - 1 : 0,
        hutch: c.id
      })
    );
    RG.hutch[c.id] = {
      n,
      hop,
      dr,
      fs,
      ws,
      share,
      atFeed,
      crowded: n - atFeed,
      rivals: rivals.length,
      fertM,
      groups: Math.ceil(n / Math.max(1, P.rb_grp_max)),
      lowHop: n > 0 && hop < 2
    };
  }
  return RG;
}
// This grower's group entry from rgCalc, or null for any other animal.
function rgOf(a) {
  return a && a.sp === 'rabbit' && a.st === 'grower' ? rgCalc().map.get(a.id) : null;
}
// Feed factor for a grower: 1, or less by the rb_grp_loss setting when it is crowded off the hopper or
// drinker.
function rgAccF(a) {
  const r = rgOf(a);
  return r && r.crowded ? 1 - clamp(P.rb_grp_loss, 0, 100) / 100 : 1;
}
// Nest boxes in a coop: its own count when set, else 1 per 12 sq ft of floor, at least 4.
function nestsFor(c) {
  return c.nests != null ? Math.max(0, Math.round(+c.nests)) : Math.max(4, Math.floor((c.w * c.d) / 12));
}



// Original: source/src/core/day.js (blob c848b0f8456ad524251384d15f416f26e5ab0f53)
// core/day.js
// Daily step context, part 1. computeDay(): today's numbers for every animal and pen, without moving
// time. refreshToday() recomputes them after an edit.
// ---- Contents (top-level functions, in file order; kept by tools/code_contents.py) ----
//   feedAdj - Feed factor for a pen's temperatures m: more feed below a 50 F low (hl_feed_cold % a degree),
//         less above an 80 F high (hl_feed_hot % a degree), kept between 0.5 and 1.6.
//   rabDiet - Feeding strategy.
//   rangeShare - Share of a ranging bird's feed found on pasture in month mo (0 to 11), or 0 when pasture is
//         off.
//   ranges - True for a grown bird housed in a coop while the pasture setting is on.
//   brooderBase - Brooder: the lamp adds ck_lamp °F per 250 W on top of the base temperature (outdoor low, or
//         the indoor temperature when the brooder is set as indoors).
//   brooderTemp - Brooder temperature for chicks today: the base temperature plus the lamp's lift, never more
//         than the chicks need.
//   hatchStoreF - Hatch factor for eggs stored before setting: falls by ck_store_loss % per day stored past 7
//         days.
//   hatchRhF - Hatch factor for incubator humidity: falls by ck_rh_loss % per point more than 3 points from
//         the target.
//   incTempF - Incubator temperature: hatch falls off above 103°F and below 97°F, and an incubator that is off
//         hatches nothing.
//   chickNeed - Temperature chicks of this age need (F): ck_brood_t, down ck_brood_drop each week, never below
//         70.
//   lampDuty - Share of the day the brooder lamp runs (0 to 1) to hold the youngest chicks' need over the base
//         temperature.
//   rabEnergy - A rabbit's energy need today, kcal DE per kg^0.75 a day, and the reason as text (kit on solid
//         feed, grower, adult, pregnant or nursing doe).
//   litterHealth - Litter size against doe health at kindling (phase 13, notes 2n).
//   growHealth - Daily gain against health (phase 14, notes 2o).
//   growTally - Where fryer weight goes (phase 14).
//   saleTally - at sale, in year 2 of the range check: add the fryer's tallies to S.gap.fw
//   hClass - Where health goes (phase 15, notes 2p).
//   healthTally - Adds one animal's day to the health accounting of the range check (S.gap.hl): days, health,
//         loss by cause, points taken off or given back.
//   pregDay - Moves a pregnant doe on one day; on her due day she kindles a litter (size from the litter
//         setting, its scatter and her health factor), which is added to born.
//   intake - One animal's feed (lb a day, split by feed type) and water (gal a day) today, from its energy
//         need, temperature, diet, access at the feeder and pasture.
//   layFactors - The parts of a hen's laying chance today: laying curve for her cycle, daylight, heat, cold,
//         crowding, nest boxes, run space and access.
//   crowdGrowth - Growth factor from pen crowding.
//   conceptionFactors - The parts of a doe's chance of taking when bred today: daylight, crowding, season, and
//         the health and crowding switches.
//   computeDay - Today's weather, floor in use and each building's microclimate and the run space, without
//         moving the day on.
//   refreshToday - Recompute today's numbers after an edit, keeping the results of the last stepped day.
// ---- end of contents ----
// ---------- daily computation ----------

// Feed factor for a pen's temperatures m: more feed below a 50 F low (hl_feed_cold % a degree), less
// above an 80 F high (hl_feed_hot % a degree), kept between 0.5 and 1.6.
function feedAdj(m) {
  let f = 1;
  if (m.tmin < 50) f += (P.hl_feed_cold / 100) * (50 - Math.max(m.tmin, -20));
  if (m.tmax > 80) f -= (P.hl_feed_hot / 100) * (m.tmax - 80);
  return clamp(f, 0.5, 1.6);
}
// Feeding strategy. Young rabbits (weaning to breeding or sale): 0 = pellets only; 1 = pellets plus
// free-choice dry roughage (FAO Table 20: NZW 5-9 wk, pellets 94.7 -> 88.3 g/d, straw 7.4 g/d, gain
// 31.7 -> 31.0 g/d); 2 = alfalfa hay plus corn, no pellets (FAO Table 10: 88 vs 78 days to 2.2 kg,
// 4.80 vs 3.92 kg feed per kg gain; rabbits choose 65% alfalfa to 35% maize). Daily intake on option 2
// is pellet-equivalent intake x growth ratio x feed-per-gain ratio, so it eats about as much per day
// and grows slower. Returns multipliers on the pellet amount the energy formula gives.
function rabDiet(a) {
  const m = Math.round(+P.fd_rab || 0);
  if (!a || a.st !== 'grower' || m <= 0) return { pel: 1, hay: 0, grain: 0, gain: 1, m: 0 };
  if (m === 1) {
    const pel = clamp(P.fd_rough_pel, 0, 200) / 100;
    return { pel, hay: (pel * clamp(P.fd_rough_eat, 0, 200)) / 100, grain: 0, gain: clamp(P.fd_rough_gain, 0, 200) / 100, m };
  }
  const gain = clamp(P.fd_alf_gain, 1, 200) / 100,
    mix = gain * (clamp(P.fd_alf_fcr, 1, 400) / 100),
    h = clamp(P.fd_alf_hay, 0, 100) / 100;
  return { pel: 0, hay: mix * h, grain: mix * (1 - h), gain, m: 2 };
}
// Ranging hens and roosters: share of the day's feed found on pasture. ATTRA (Mattocks): pastured
// poultry eat 5-20% of their diet from pasture; savings greatest in late spring and early fall.
// The month shape is an assumption: none in a Pennsylvania winter, peaks in May and September.
const RANGE_MONTH = [0, 0, 0, 0.5, 1, 0.75, 0.5, 0.5, 1, 0.75, 0.25, 0];
// Share of a ranging bird's feed found on pasture in month mo (0 to 11), or 0 when pasture is off.
function rangeShare(mo) {
  return +P.fd_range ? (clamp(P.fd_range_pct, 0, 60) / 100) * RANGE_MONTH[((mo % 12) + 12) % 12] : 0;
}
// True for a grown bird housed in a coop while the pasture setting is on.
function ranges(a) {
  if (!+P.fd_range || a.sp !== 'chicken' || (a.st !== 'hen' && a.st !== 'rooster') || !a.enc) return false;
  const c = compById(a.enc);
  return !!c && c.type === 'coop';
}
// Brooder: the lamp adds ck_lamp °F per 250 W on top of the base temperature (outdoor low, or the
// indoor temperature when the brooder is set as indoors). Chicks are fine within 3 °F of their need.
function brooderBase(pen, tmin) {
  return +pen.indoor ? P.env_indoor : tmin;
}
// Brooder temperature for chicks today: the base temperature plus the lamp's lift, never more than the chicks
// need.
function brooderTemp(pen, m, need) {
  return Math.min(need, brooderBase(pen, m.tmin) + (P.ck_lamp * pen.lampWatts) / 250);
}
// Hatch factor for eggs stored before setting: falls by ck_store_loss % per day stored past 7 days.
function hatchStoreF() {
  return clamp(1 - (P.ck_store_loss / 100) * Math.max(0, P.ck_store - 7), 0, 1);
}
// Hatch factor for incubator humidity: falls by ck_rh_loss % per point more than 3 points from the target.
function hatchRhF(inc) {
  const rh = inc && inc.rh != null ? +inc.rh : P.ck_rh;
  return clamp(1 - (P.ck_rh_loss / 100) * Math.max(0, Math.abs(rh - P.ck_rh) - 3), 0, 1);
}
// Incubator temperature: hatch falls off above 103°F and below 97°F, and an incubator that is off hatches nothing.
// Shared by the daily hatch and the planner so the two cannot disagree.
function incTempF(inc) {
  if (!inc) return 1;
  const sp = +inc.setpoint;
  let tm = 1;
  if (sp > 103) tm = Math.max(0, 1 - (sp - 103) / 2);
  else if (sp < 97) tm = Math.max(0, 1 - (97 - sp) / 7);
  if (!+inc.on) tm = 0;
  return tm;
}
// Temperature chicks of this age need (F): ck_brood_t, down ck_brood_drop each week, never below 70.
function chickNeed(age) {
  return Math.max(70, P.ck_brood_t - P.ck_brood_drop * Math.floor(age / 7));
}
// Share of the day the brooder lamp runs (0 to 1) to hold the youngest chicks' need over the base temperature.
function lampDuty(c, tmin, ch) {
  const need = chickNeed(Math.min(...ch.map(a => a.age)));
  return clamp((need - brooderBase(c, tmin)) / Math.max(1, (P.ck_lamp * c.lampWatts) / 250), 0, 1);
}
// A rabbit's energy need today, kcal DE per kg^0.75 a day, and the reason as text (kit on solid feed,
// grower, adult, pregnant or nursing doe). Feeds intake() below.
function rabEnergy(a) {
  // kcal DE per kg^0.75 per day, and why
  if (a.st === 'kit')
    return {
      e: P.rb_e_grow * kitSolid(a.age),
      why: 'kit, ' + Math.round(kitSolid(a.age) * 100) + '% of diet from pellets'
    };
  const me = maintE();
  if (a.st === 'grower') {
    const f = clamp((a.wt / P.rb_adult_wt - 0.7) / 0.3, 0, 1);
    return { e: P.rb_e_grow + (me - P.rb_e_grow) * f, why: f > 0 ? 'grower near adult size' : 'growing' };
  }
  if (a.sex === 'F') {
    const d = a.kindle != null ? S.day - a.kindle : 99;
    const kits = d < P.rb_wean && S.animals.some(k => k.mother === a.id);
    if (kits)
      return {
        e: P.rb_e_lact * lactShape(d),
        why: 'nursing, day ' + d + (a.preg != null ? ' (also pregnant)' : ''),
        nursing: true
      };
    if (a.preg != null) {
      const late = a.gestLen - a.preg <= 3;
      return {
        e: P.rb_e_preg * (late ? 1 - P.rb_late_drop / 100 : 1),
        why: late ? 'last days of pregnancy' : 'pregnant'
      };
    }
  }
  return { e: me, why: 'maintenance' };
}
// Litter size against doe health at kindling (phase 13, notes 2n). No Extension, FAO or university source
// gives this size: FAO ties smaller litters in heat to lower feed intake and body weight, a feed-restriction
// trial in pregnant NZW does found no significant change in litter size, and a Wageningen thesis sizes it
// only for underweight first-litter does. So it is a switch (rb_ls_health, on). raw is the factor it would
// be, kept for the range check's tally even when switched off.
function litterHealth(a) {
  const raw = 0.7 + (0.3 * a.health) / 100;
  return { f: +P.rb_ls_health ? raw : 1, raw };
}
// Daily gain against health (phase 14, notes 2o). The growth rule multiplies every rabbit's gain by
// health/100. No Extension, FAO or university source gives that size, and in this model health falls
// from crowding, heat and cold, which the FAO growth rules (Table 19 temperature, Table 49 density)
// already count, so it may count them twice. It is a switch (rb_g_health, on).
function growHealth(a) {
  return +P.rb_g_health ? a.health / 100 : 1;
}
// Where fryer weight goes (phase 14). While S.gw is set (the range check sets it 80 days before year 2,
// so every fryer sold in year 2 is followed from birth), each kit and grower adds up the gain each growth
// factor took away that day, removed in a fixed order: health, crowding, short-hopper push-off, then
// temperature. q is the potential gain (growth curve × diet), so the parts add up exactly to
// q × (1 − health × crowding × hopper × temperature). Accounting only: nothing here changes a result.
function growTally(a, q, h, c, t, ac) {
  const g =
    a.gw || (a.gw = { w0: a.wt, hK: 0, hG: 0, cK: 0, cG: 0, ac: 0, tK: 0, tG: 0, q: 0, hsK: 0, ndK: 0, hsG: 0, ndG: 0 });
  const dh = q * (1 - h) * c * t * ac,
    dc = q * (1 - c) * t * ac,
    da = q * (1 - ac) * t,
    dt = q * (1 - t);
  if (a.st === 'kit') {
    g.hK += dh;
    g.cK += dc;
    g.tK += dt;
    g.hsK += a.health / 100;
    g.ndK++;
  } else {
    g.hG += dh;
    g.cG += dc;
    g.tG += dt;
    g.hsG += a.health / 100;
    g.ndG++;
  }
  g.ac += da;
  g.q += q;
}
// at sale, in year 2 of the range check: add the fryer's tallies to S.gap.fw
function saleTally(a) {
  const f = S.gap.fw || (S.gap.fw = { n: 0, wt: 0 });
  f.n++;
  f.wt += a.wt;
  for (const k in a.gw) f[k] = (f[k] || 0) + a.gw[k];
}
// Where health goes (phase 15, notes 2p). While S.gap is set (year 2 of the range check), each animal's
// day adds to its class: animal-days, health, the loss from each cause before the 0.05 floor, the points
// actually taken off or given back, and days spent under 40 (where stress deaths start). Accounting only:
// nothing here changes a result.
function hClass(a) {
  if (a.sp === 'rabbit') return a.st === 'kit' ? 'kit' : a.st === 'grower' ? (a.keep || a.rsv ? 'keep' : 'grower') : a.sex === 'F' ? 'doe' : 'buck';
  return a.st;
}
// Adds one animal's day to the health accounting of the range check (S.gap.hl): days, health, loss by cause,
// points taken off or given back. Accounting only.
function healthTally(a, parts, loss, h0, h1) {
  const H = S.gap.hl || (S.gap.hl = {}),
    k = hClass(a),
    t = H[k] || (H[k] = { n: 0, h: 0, lo: 0, off: 0, rec: 0, under: 0 });
  t.n++;
  t.h += h0;
  if (h0 < 40) t.lo++;
  for (const c in parts) if (parts[c] > 0) t[c] = (t[c] || 0) + parts[c];
  if (loss > 0.05) t.off += h0 - h1;
  else {
    t.rec += h1 - h0;
    if (loss > 0) t.under += loss;
  }
}
// Moves a pregnant doe on one day; on her due day she kindles a litter (size from the litter setting, its
// scatter and her health factor), which is added to born.
function pregDay(a, born, d) {
  a.preg++;
  if (a.preg >= a.gestLen) {
    const lh = litterHealth(a);
    let n = Math.round((P.rb_litter + gauss() * P.rb_litter_sd) * lh.f);
    n = clamp(n, 0, 14);
    if (S.gap) {
      S.gap.kinN = (S.gap.kinN || 0) + 1;
      S.gap.lhSum = (S.gap.lhSum || 0) + lh.raw;
      S.gap.kitN = (S.gap.kitN || 0) + n;
    }
    for (let i = 0; i < n; i++) {
      born.push(
        animal('rabbit', rngNext() < 0.5 ? 'F' : 'M', 0, { enc: a.enc, mother: a.id, health: P.rb_kit_h0, litN: n })
      );
    }
    a.preg = null;
    a.kindle = S.day;
    a.lastLitter = n;
    d.births += n;
    S.tot.born += n;
    logE(
      (a.st === 'grower' ? 'Young doe #' : 'Doe #') +
        a.id +
        ' kindled ' +
        n +
        ' kits' +
        (n === 0 ? ' (none survived birth)' : '') +
        (a.early ? ' from an unplanned early mating' : '') +
        '.'
    );
    a.early = 0;
  }
}
// One animal's feed (lb a day, split by feed type) and water (gal a day) today, from its energy need,
// temperature, diet, access at the feeder and pasture.
function intake(a, m) {
  if (a.sp === 'rabbit') {
    const t = rabTemp(m),
      en = rabEnergy(a);
    const acc = rgAccF(a),
      dt = rabDiet(a),
      base = energyFeedLb(en.e, a.wt) * t.feed * acc,
      feed = dt.m ? base * dt.pel : base,
      hay = base * dt.hay,
      grain = base * dt.grain;
    let wLb = (dt.m ? feed + hay + grain : feed) * t.wr;
    if (en.nursing) wLb = Math.max(wLb, (P.rb_water_nurse / 1000) * a.wt);
    return {
      feed,
      water: wLb / 8.34,
      fa: t.feed,
      wr: t.wr,
      e: en.e,
      why: en.why,
      nursing: !!en.nursing,
      full: !!en.nursing || a.preg != null,
      acc,
      hay,
      grain,
      diet: dt
    };
  }
  const fa = feedAdj(m),
    bw = ckWtG(a.age),
    T = tMean(m),
    wr = ckWaterRatio(T);
  const acc = accessF(a),
    need = P.ck_feed * Math.pow(bw / P.ck_bw1, 0.75) * fa * acc,
    rs = ranges(a) ? rangeShare(dateOf(S.day).getMonth()) : 0,
    feed = rs ? need * (1 - rs) : need;
  // water follows the whole day's intake, pasture included
  return { feed, water: (need * wr) / 8.34, fa, wr, bw, acc, forage: need - feed, rs };
}
// The parts of a hen's laying chance today: laying curve for her cycle, daylight, heat, cold, crowding, nest
// boxes, run space and access. Returned separately so the panels can show each one.
function layFactors(a, m, L, nestF, run) {
  const base = layCurve(a),
    age = 1,
    wk = (a.age - (a.cycStart != null ? a.cycStart : P.ck_lay_age)) / 7;
  const light = clamp((m.light - P.ck_light_min) / Math.max(0.1, P.ck_light - P.ck_light_min), 0, 1);
  const T = tMean(m);
  let heat = T > P.ck_heat ? Math.max(0.2, 1 - (P.ck_heat_loss / 100) * (T - P.ck_heat)) : 1;
  if (m.tmin < P.hl_cold_lim) heat *= 0.85;
  const dens = a.enc ? density(a.enc, L) : 3;
  const crowd = dens > 1 ? 1 / dens : 1;
  const runF = run.ratio > 1 ? Math.max(0.7, 1 - 0.15 * (run.ratio - 1)) : 1;
  const health = a.health / 100;
  const access = accessF(a);
  return {
    base,
    age,
    wk,
    cycle: a.cycle || 1,
    molt: a.molt || 0,
    light,
    heat,
    health,
    nest: nestF,
    crowd: crowd * runF,
    access,
    p: base * light * heat * health * nestF * crowd * runF * access
  };
}
// Growth factor from pen crowding. Growers follow FAO Table 49 (Martin 1982, wire cages, 77 days):
// 12.5, 15.6 and 18.7 rabbits per m2 (0.861, 0.690 and 0.576 sq ft each) gave 36.5, 36.1 and
// 32.0 g a day. Floor per grower is the grower floor setting divided by the pen's density.
// Below 0.576 sq ft the last slope is carried on (assumption), never under 0.3.
// Other stages, and growers with rb_crowd_g off, keep the older 1 / density.
function crowdGrowth(a, dens) {
  if (!(dens > 1)) return 1;
  if (!(+P.rb_crowd_g && a.st === 'grower')) return 1 / dens;
  const f = P.rb_grower / dens,
    x0 = 0.861,
    x1 = 0.69,
    x2 = 0.576,
    y1 = 36.1 / 36.5,
    y2 = 32.0 / 36.5;
  if (f >= x0) return 1;
  if (f >= x1) return y1 + ((1 - y1) * (f - x1)) / (x0 - x1);
  if (f >= x2) return y2 + ((y1 - y2) * (f - x2)) / (x1 - x2);
  return Math.max(0.3, y2 - ((y1 - y2) / (x1 - x2)) * (x2 - f));
}
// The parts of a doe's chance of taking when bred today: daylight, crowding, season, and the health and
// crowding switches. Returned separately so the panels can show each one.
function conceptionFactors(a, m, L) {
  const light = 0.6 + 0.4 * clamp((m.light - 10) / Math.max(0.1, P.rb_light - 10), 0, 1);
  const dens = a.enc ? density(a.enc, L) : 3;
  const crowd = dens > 1 ? Math.max(0.3, 1 / dens) : 1;
  const doy = doyOf(S.day),
    season = doy >= 213 && doy <= 334 ? 1 - P.rb_season / 100 : 1;
  // Doe health and hutch-bank crowding: no Extension, FAO or university source gives the size of either
  // effect on conception for caged does (notes 2m), so each can be switched off (rb_cf_health, rb_cf_crowd).
  // hRaw and cRaw are what the factors would be, kept for the range check's tally even when switched off.
  const hv = +P.rb_cf_health ? a.health : 100,
    cv = +P.rb_cf_crowd ? crowd : 1;
  return {
    base: P.rb_concep / 100,
    light,
    season,
    health: hv / 100,
    crowd: cv,
    hRaw: a.health / 100,
    cRaw: crowd,
    p: (((P.rb_concep / 100) * light * season * hv) / 100) * cv
  };
}
// Today's weather, floor in use and each building's microclimate and the run space, without moving the day on.
// Used for display and by step().
function computeDay(preview) {
  // computes environment and per-pen info for display (and used by step)
  const env = weather(false);
  const L = loads();
  const M = {};
  S.comps.forEach(c => {
    M[c.id] = micro(c, env);
  });
  return { env, L, M, run: runInfo() };
}

// Recompute today's numbers after an edit, keeping the results of the last stepped day.
function refreshToday() {
  const d = S.today && S.today.d,
    env = S.today && S.today.env;
  S.today = computeDay();
  if (d) S.today.d = d;
  if (env) S.today.env = env;
}



// Original: source/src/core/step.js (blob bc38975969fafebfc8dab3a631d0fb5380ce3062)
// core/step.js
// Daily step context, part 2. step(): one model day. Weather, breeding, births, hatches, laying, molt,
// growth, sales, deaths, then the day's line in the ledger. The only place S.day moves; called by the
// clock, the jump buttons, the range check and tests.
function step() {
  // ==== 1. Start of the day: weather, housing and pen climates ====
  // Moves the day on, draws today's weather (weather(true)), re-houses the animals, counts the floor in
  // use per building (loads) and works out each building's microclimate (micro). d is the day's tally.
  S.day++;
  const env = weather(true); // today's weather: highs and lows (°F), day length (h), day of year ...
  if (S.day % 7 === 0) S.setWeek = 0;
  rehouse();
  let L = loads(); // floor in use (sq ft) in each building, by building id
  const M = {}; // each building's microclimate today, by building id (micro)
  S.comps.forEach(c => (M[c.id] = micro(c, env)));
  const ambient = { tmax: env.tmax, tmin: env.tmin, light: env.day, shade: 0, cool: 0, heated: false };
  const mOf = a => (a.enc && M[a.enc] ? M[a.enc] : ambient); // the microclimate an animal lives in: its building's, else the open air
  const run = runInfo(); // run space for the flock: area, birds, need and need / area
  const d = { // today's tally: feed, eggs, sales, deaths, kWh ...; summed into today's row in S.hist
    fryerLb: 0,
    eggs: 0,
    eggsSold: 0,
    eggsSet: 0,
    rFeed: 0,
    cFeed: 0,
    sFeed: 0,
    hay: 0,
    grain: 0,
    forage: 0,
    water: 0,
    kwh: 0,
    rev: 0,
    births: 0,
    hatch: 0,
    deaths: 0,
    fryers: 0,
    birdsSold: 0
  };
  // ==== 2. Flock-wide numbers every animal below uses ====
  // Who dies and who is born today, roosters and hens, hens per nest box, fertile bucks, working and
  // reserve does, spare hutch floor for a reserve doe, egg fertility and the incubators that are on.
  const dead = new Set(),
    born = [];
  const byId = new Map(S.animals.map(x => [x.id, x]));
  const roosters = S.animals.filter(a => a.sp === 'chicken' && a.st === 'rooster').length;
  const hens = S.animals.filter(a => a.sp === 'chicken' && a.st === 'hen');
  const nests = Math.max(
    1,
    pens('coop').reduce((s, c) => s + nestsFor(c), 0)
  );
  const nestF = hens.length / nests > P.ck_hpn ? 0.95 : 1;
  const fertileBucks = S.animals.filter(
    a => a.sp === 'rabbit' && a.sex === 'M' && a.st === 'adult' && a.sterileUntil < S.day
  );
  let bucksUsed = 0;
  // reserve does (FAO): kept adult does that wait, unmated, until a working doe is lost
  const rsvN = Math.max(0, Math.round(P.mg_rsv_does));
  let workingDoes = S.animals.filter(a => a.sp === 'rabbit' && a.sex === 'F' && a.st === 'adult' && !a.rsv).length;
  // a keeper only holds back a reserve doe when the hutch banks have floor to spare
  const hutchRoom =
    rsvN > 0 &&
    (() => {
      let need = 0,
        area = 0;
      for (const c of pens('hutch')) {
        need += L[c.id] || 0;
        area += c.w * c.d;
      }
      // look ahead: nursing kits and the expected weaned kits of pregnant does will each need grower floor
      if (+P.mg_rsv_look) {
        let coming = 0;
        for (const x of S.animals) {
          if (x.sp !== 'rabbit') continue;
          if (x.st === 'kit') coming++;
          else if (x.sex === 'F' && x.preg != null) coming += P.rb_litter * (1 - clamp(P.rb_loss, 0, 100) / 100);
        }
        need += coming * P.rb_grower;
      }
      return area > 0 && need + P.rb_cage <= area;
    })();
  const fertP = (P.ck_fert / 100) * Math.min(1, (roosters * P.ck_hpr) / Math.max(1, hens.length));
  const incs = pens('incubator').filter(c => +c.on);

  // ==== 3. Each animal, one day older ====
  // Health, then the chance it dies, then rabbit or chicken growth, feed, stage changes, sales,
  // breeding and laying. A sale or retirement adds it to dead and skips the rest (continue).
  for (const a of S.animals) {
    a.age++;
    const m = mOf(a); // this animal's microclimate today
    const dens = a.enc ? density(a.enc, L) : 3;
    // ---- 3a. Health: losses from crowding, heat, cold, having no pen and grower fights, else recovery ----
    let loss = 0;
    const parts = { crowding: 0, heat: 0, cold: 0, 'no pen': 0 };
    const inNest = a.sp === 'rabbit' && a.st === 'kit' && a.age < P.rb_solid_start && !+P.rb_nest_crowd;
    if (dens > 1 && !inNest) {
      parts.crowding = (P.hl_crowd * (dens - 1)) / 0.5;
      loss += parts.crowding;
    }
    const heatLim = a.sp === 'rabbit' ? P.rb_heat_hl : P.ck_heat_hl;
    if (m.tmax > heatLim) {
      parts.heat = P.hl_heat * (m.tmax - heatLim);
      if (a.sp === 'rabbit' && m.tmax > P.rb_heat_sev) parts.heat += 2 * P.hl_heat * (m.tmax - P.rb_heat_sev);
      loss += parts.heat;
    }
    let coldLim = P.hl_cold_lim;
    if (a.sp === 'chicken' && a.st === 'chick') {
      const need = Math.max(70, P.ck_brood_t - P.ck_brood_drop * Math.floor(a.age / 7));
      const pen = a.enc && compById(a.enc);
      let t = m.tmin;
      if (pen && pen.type === 'brooder') t = brooderTemp(pen, m, need);
      if (t < need - 3) {
        parts.cold += P.hl_cold * 2 * (need - t);
        loss += P.hl_cold * 2 * (need - t);
      }
    } else if (a.sp === 'rabbit' && a.st === 'kit') {
      // kits still in the nest box (younger than rb_solid_start) skip cold when rb_nest_cold is off: FAO's
      // pre-weaning loss (rb_loss) already includes nest chilling, and a bedded nest holds 30-35°C (notes 2p)
      coldLim = !+P.rb_nest_cold && a.age < P.rb_solid_start ? -1e9 : P.rb_kit_cold;
    }
    if (m.tmin < coldLim) {
      parts.cold += P.hl_cold * (coldLim - m.tmin);
      loss += P.hl_cold * (coldLim - m.tmin);
    }
    if (!a.enc) {
      parts['no pen'] = P.hl_expo;
      loss += P.hl_expo;
    }
    if (a.sp === 'rabbit' && a.st === 'grower' && P.hl_fight > 0) {
      const r = rgOf(a);
      if (r && r.fight) {
        parts.fighting = P.hl_fight * r.fight;
        loss += parts.fighting;
      }
    }
    if (loss > 0.05) {
      let best = 'crowding';
      for (const k in parts) if (parts[k] > parts[best]) best = k;
      a.stress = best;
    } else if (a.health >= 60) a.stress = '';
    const h0 = a.health; // health before today, for the health tally
    a.health = clamp(loss > 0.05 ? a.health - loss : a.health + P.hl_rec, 0, 100);
    if (S.gap) healthTally(a, parts, loss, h0, a.health);
    // ---- 3b. Death risk ----
    // competing risks: each source of death risk is kept separately, and the cause of a death is drawn in proportion to them
    const rp = {}; // today's death risk by cause (cause name -> probability)
    const add = (k, v) => {
      if (v > 0) rp[k] = (rp[k] || 0) + v;
    };
    add(
      'background risk',
      (a.sp === 'chicken' ? (a.st === 'hen' || a.st === 'rooster' ? P.ck_mort : P.ck_mort_r) : P.hl_mort) /
        100
    );
    if (a.health < 40)
      add(a.stress ? a.stress + ' stress' : 'poor health', ((P.hl_mort_low / 100) * (40 - a.health)) / 40);
    if (a.sp === 'rabbit' && a.st === 'kit') {
      add('kit loss (litter size)', 1 - Math.pow(kitSurv(a.litN), 1 / Math.max(1, P.rb_wean)));
      const mom = byId.get(a.mother);
      if ((!mom || dead.has(mom.id)) && a.age < 21) add('orphaned kit', 1);
    }
    if (a.sp === 'rabbit' && a.st === 'grower' && !a.keep)
      add(
        'diarrhoea (enteritis)',
        1 - Math.pow(1 - clamp(P.rb_gdis, 0, 99) / 100, 1 / Math.max(1, P.rb_sale_age - P.rb_wean))
      );
    let risk = 0;
    for (const k in rp) risk += rp[k];
    if (rngNext() < Math.min(1, risk)) {
      let u = rngNext() * risk, // u: a point along the summed risks; the cause it falls in is the cause of death
        c = 'background risk';
      if (rp['orphaned kit']) c = 'orphaned kit';
      else
        for (const k in rp) {
          c = k;
          u -= rp[k];
          if (u <= 0) break;
        }
      a.deathCause = c;
      dead.add(a.id);
      continue;
    }

    // ---- 3c. Rabbits ----
    if (a.sp === 'rabbit') {
      // growth and feed: the day's gain on the growth curve (rabCurve), scaled by health (growHealth),
      // crowding (crowdGrowth), pen temperature (rabTemp), hopper access (rgAccF) and the diet (rabDiet);
      // then feed, hay, grain and water from intake()
      const pot = rabCurve(a.age) - rabCurve(a.age - 1); // potential gain today (lb) from the breed's growth curve
      const dg = rabDiet(a).gain, // diet factor on gain (1 on pellets)
        hF = growHealth(a), // health factor
        cF = crowdGrowth(a, dens), // crowding factor
        tF = rabTemp(m).gain, // temperature factor
        aF = rgAccF(a), // hopper and drinker access factor
        gm0 = hF * cF * tF * aF, // all factors but the diet
        gm = dg === 1 ? gm0 : gm0 * dg; // the share of the potential gain this rabbit makes today
      if (S.gw && (a.st === 'kit' || a.st === 'grower')) growTally(a, dg === 1 ? pot : pot * dg, hF, cF, tF, aF);
      a.wt = Math.min(P.rb_adult_wt * 1.1, a.wt + pot * gm);
      {
        const it = intake(a, m); // today's feed, hay, grain, forage and water for this animal (lb, gal)
        d.rFeed += it.feed;
        d.hay += it.hay;
        d.grain += it.grain;
        d.water += it.water;
      }
      // stage changes, in this order: weaning, sale age, early breeding of young does, breeding age,
      // reserve does, heat-sterile bucks, then each adult doe's retirement, pregnancy or mating
      // weaning: the kit becomes a grower and moves to the hutch with the least floor in use (bestPen)
      if (a.st === 'kit' && a.age >= P.rb_wean) {
        a.st = 'grower';
        a.mother = null;
        const p = bestPen('hutch', L);
        a.enc = p ? p.id : null;
        if (p) L[p.id] += P.rb_grower;
      }
      // sale age: kept as a future breeding doe, reserve doe or buck when the herd needs one, else sold as a
      // fryer at its weight times the fryer price (when selling fryers is on)
      if (a.st === 'grower' && a.age === Math.round(P.rb_sale_age)) {
        const does = S.animals.filter(
          x => x.sp === 'rabbit' && x.sex === 'F' && (x.st === 'adult' || x.keep) && !dead.has(x.id)
        ).length;
        const bucks = S.animals.filter(
          x => x.sp === 'rabbit' && x.sex === 'M' && (x.st === 'adult' || x.keep) && !dead.has(x.id)
        ).length;
        const needB =
          Math.ceil(Math.max(does, P.mg_does) / Math.max(1, P.rb_dpb)) +
          Math.max(0, Math.round(P.mg_spare_buck));
        if (a.sex === 'F' && (does < P.mg_does || (does < P.mg_does + rsvN && hutchRoom))) {
          a.keep = 1;
          logE('Kept doeling #' + a.id + (does < P.mg_does ? ' as a future breeder.' : ' as a future reserve doe.'));
        } else if (a.sex === 'M' && bucks < needB) {
          a.keep = 1;
          logE('Kept buckling #' + a.id + ' as a future buck.');
        } else if (+P.mg_sell_fryers) {
          if (S.gap && a.gw) saleTally(a);
          d.rev += a.wt * P.pr_fryer;
          d.fryers++;
          d.fryerLb += a.wt;
          S.tot.fryers++;
          dead.add(a.id);
          a.sold = 1;
          continue;
        }
      }
      // a young doe goes on with a pregnancy, or, when the split-growers setting (rb_split) is off, can be bred early by a
      // fertile young buck in her group once she reaches puberty weight (rb_early is the chance per week)
      if (a.st === 'grower' && a.sex === 'F') {
        if (a.preg != null) pregDay(a, born, d);
        else if (
          !+P.rb_split &&
          P.rb_early > 0 &&
          a.kindle == null &&
          a.wt >= (P.rb_pub_wt / 100) * P.rb_adult_wt
        ) {
          const h = rgCalc().hutch[a.enc]; // this hutch bank's grower groups; fertM = fertile young bucks still in them
          if (h && h.fertM > 0 && rngNext() < 1 - Math.pow(1 - clamp(P.rb_early, 0, 100) / 100, 1 / 7)) {
            a.preg = 0;
            a.early = 1;
            a.gestLen = Math.round(P.rb_gest);
            d.early = (d.early || 0) + 1;
            S.tot.early = (S.tot.early || 0) + 1;
            logE(
              'Young doe #' +
                a.id +
                ' was bred early by a young buck in her group at ' +
                a.age +
                ' days (' +
                a.wt.toFixed(1) +
                ' lb).'
            );
          }
        }
      }
      // breeding age: the grower becomes an adult; a new doe joins the reserve when the working does are full
      if (a.st === 'grower' && a.age >= (a.sex === 'F' ? P.rb_doe_age : P.rb_buck_age)) {
        a.st = 'adult';
        a.keep = 0;
        if (a.sex === 'F' && rsvN > 0) {
          if (workingDoes >= P.mg_does) {
            a.rsv = 1;
            logE('Doe #' + a.id + ' reached breeding age and joins the reserve.');
          } else workingDoes++;
        }
      }
      // a reserve doe moves into a breeding cage when a working doe is missing or reserves are set to 0
      if (a.rsv && a.st === 'adult' && (workingDoes < P.mg_does || rsvN === 0)) {
        a.rsv = 0;
        workingDoes++;
        logE('Reserve doe #' + a.id + ' moved into a breeding cage.');
      }
      // bucks: rb_heat_days days in a row with the pen high over rb_heat F make him sterile for rb_sterile days
      if (a.st === 'adult' && a.sex === 'M') {
        if (m.tmax > P.rb_heat) a.hot++;
        else a.hot = 0;
        if (a.hot >= P.rb_heat_days && a.sterileUntil < S.day) {
          a.sterileUntil = S.day + P.rb_sterile;
          logE(
            'Buck #' +
              a.id +
              ' heat-sterile (pen high ' +
              m.tmax.toFixed(0) +
              '°F, ' +
              a.hot +
              ' hot days) until day ' +
              a.sterileUntil +
              '.'
          );
        }
      }
      // does: retire at rb_retire days (not while pregnant or nursing); else a pregnancy day (pregDay), waiting
      // as a reserve, or, when due, mating with the free fertile buck used least this week (conceptionFactors)
      if (a.st === 'adult' && a.sex === 'F') {
        if (a.age >= P.rb_retire && a.preg == null && !(a.kindle != null && S.day - a.kindle < P.rb_wean)) {
          dead.add(a.id);
          a.retired = 1;
          logE('Doe #' + a.id + ' retired at ' + a.age + ' days.');
          continue;
        }
        if (a.preg != null) {
          pregDay(a, born, d);
        } else if (a.rsv) {
          a.why = 'reserve doe: waits until a breeding doe is lost';
        } else if (
          a.age >= P.rb_doe_age &&
          (a.kindle == null || S.day - a.kindle >= P.rb_rebreed) &&
          S.day >= a.nextMate &&
          S.day >= (a.pseudo || 0)
        ) {
          a.nextMate = S.day + P.rb_mate_every;
          const fb = fertileBucks.length; // fertile bucks on the farm today
          const free = fertileBucks.filter(
            b => !dead.has(b.id) && (b.mates || []).filter(t => S.day - t < 7).length < P.rb_buck_week
          );
          if (fb === 0) {
            a.why = 'no fertile buck';
          } else if (!free.length) {
            a.why = 'every buck already used ' + P.rb_buck_week + ' times this week';
            a.nextMate = S.day + 1;
          } else {
            free.sort(
              (x, y) =>
                (x.mates || []).filter(t => S.day - t < 7).length -
                (y.mates || []).filter(t => S.day - t < 7).length
            );
            const b = free[0];
            b.mates = (b.mates || []).filter(t => S.day - t < 7);
            b.mates.push(S.day);
            bucksUsed++;
            const cf = conceptionFactors(a, m, L); // chance of conception and the factors behind it
            if (S.gap) {
              S.gap.matN = (S.gap.matN || 0) + 1;
              S.gap.hSum = (S.gap.hSum || 0) + cf.hRaw;
              S.gap.cSum = (S.gap.cSum || 0) + cf.cRaw;
              S.gap.hcSum = (S.gap.hcSum || 0) + cf.hRaw * cf.cRaw;
            }
            if (rngNext() < cf.p) {
              a.preg = 0;
              a.gestLen = Math.round(P.rb_gest + (rngNext() * 2 - 1) * P.rb_gest_var);
              a.why = '';
            } else if (rngNext() < P.rb_pseudo / 100) {
              a.pseudo = S.day + Math.round(P.rb_pseudo_days);
              a.why = 'false pregnancy until day ' + a.pseudo;
            } else a.why = 'mated, did not conceive';
          }
        }
      }
    } else {
      // ---- 3d. Chickens ----
      // feed (layer feed for hens and roosters, starter for the young), forage, water and weight from intake();
      // then brooder to coop, sale age, laying age, and for hens retirement, molt and the day's egg
      {
        const it = intake(a, m);
        if (a.st === 'hen' || a.st === 'rooster') d.cFeed += it.feed;
        else d.sFeed += it.feed;
        d.forage += it.forage;
        d.water += it.water;
        a.wt = it.bw / 453.6;
        a.feedLb = it.feed;
      }
      // out of the brooder: the chick becomes a pullet or cockerel and moves to the coop with the least floor in use
      if (a.st === 'chick' && a.age >= P.ck_brood_days) {
        a.st = a.sex === 'F' ? 'pullet' : 'cockerel';
        const p = bestPen('coop', L);
        a.enc = p ? p.id : null;
      }
      // sale age: kept when the flock is short of hens or roosters, else sold (when selling birds is on)
      if ((a.st === 'pullet' || a.st === 'cockerel') && a.age === Math.round(P.ck_sale_age)) {
        const hensKept = S.animals.filter(
          x => x.sp === 'chicken' && x.sex === 'F' && (x.st === 'hen' || x.keep) && !dead.has(x.id)
        ).length;
        const roosK = S.animals.filter(
          x => x.sp === 'chicken' && x.sex === 'M' && (x.st === 'rooster' || x.keep) && !dead.has(x.id)
        ).length;
        if (a.sex === 'F' && hensKept < P.mg_hens) a.keep = 1;
        else if (a.sex === 'M' && roosK < P.mg_roosters) a.keep = 1;
        else if (+P.mg_sell_birds) {
          d.rev += P.pr_bird;
          d.birdsSold++;
          dead.add(a.id);
          a.sold = 1;
          continue;
        }
      }
      // laying age: pullets become hens, cockerels roosters
      if ((a.st === 'pullet' || a.st === 'cockerel') && a.age >= P.ck_lay_age) {
        a.st = a.sex === 'F' ? 'hen' : 'rooster';
        a.keep = 0;
      }
      // hens: retire at ck_retire days; molt after ck_molt_max weeks of lay, or after ck_molt_after weeks when
      // days are shortening without extra light; else maybe an egg (layFactors), set in an incubator while
      // there is room and this week's setting quota (mg_set) is not used up, otherwise sold
      if (a.st === 'hen') {
        if (a.age >= P.ck_retire) {
          dead.add(a.id);
          a.retired = 1;
          logE('Hen #' + a.id + ' retired at ' + a.age + ' days.');
          continue;
        }
        if (a.cycle == null) {
          a.cycle = 1;
          a.cycStart = Math.min(a.age, Math.round(P.ck_lay_age));
        }
        if (a.molt > 0) {
          a.molt--;
          if (a.molt === 0) {
            a.cycle++;
            a.cycStart = a.age;
            logE('Hen #' + a.id + ' finished molting and started laying cycle ' + a.cycle + '.');
          }
        } else {
          const wk = (a.age - a.cycStart) / 7, // weeks into this laying cycle
            short = dayLength(env.doy) < dayLength(env.doy - 1); // true while the days are getting shorter
          if (wk >= P.ck_molt_max || (wk >= P.ck_molt_after && short && m.light < P.ck_light)) {
            a.molt = Math.round(P.ck_molt_days);
            logE(
              'Hen #' +
                a.id +
                ' began a molt after ' +
                Math.round(wk) +
                ' weeks of lay' +
                (wk >= P.ck_molt_max ? '' : ' (days shortening, no extra light)') +
                '.'
            );
          }
        }
        const lf = layFactors(a, m, L, nestF, run); // today's chance of an egg (lf.p) and the factors behind it
        if (rngNext() < lf.p) {
          a.eggs++;
          d.eggs++;
          S.tot.eggsLaid++;
          const inc = incs.find(c => S.eggsInc.filter(e => e.inc === c.id).length < c.capacity); // the first incubator with room for one more egg
          if (inc && S.setWeek < P.mg_set) {
            S.setWeek++;
            d.eggsSet++;
            S.eggsInc.push({
              inc: inc.id,
              set: S.day,
              fertile: rngNext() < fertP,
              hatchDay: S.day + P.ck_incub - ((inc.setpoint - P.ck_opt) * P.ck_shift) / 24
            });
          } else d.eggsSold++;
        }
      }
    }
  }
  // ==== 4. Incubator: eggs due today hatch (fertile ones, by hatch rate and incubator conditions) or are lost ====
  const keep = [];
  for (const e of S.eggsInc) {
    const inc = compById(e.inc);
    if (!inc) {
      continue;
    }
    if (S.day >= e.hatchDay) {
      let tm = incTempF(inc); // hatch factor: incubator temperature x egg storage x humidity
      tm *= hatchStoreF() * hatchRhF(inc);
      if (e.fertile && rngNext() < (P.ck_hatch / 100) * tm) {
        born.push(animal('chicken', rngNext() < 0.5 ? 'F' : 'M', 0, { health: 90 }));
        d.hatch++;
        S.tot.hatched++;
      }
    } else keep.push(e);
  }
  const lost = S.eggsInc.length - keep.length;
  if (lost > 0 && d.hatch >= 0) {
    const h = d.hatch;
    if (lost) logE('Incubator: ' + lost + ' egg(s) due, ' + h + ' hatched.');
  }
  S.eggsInc = keep;
  // ==== 5. Deaths: count and log the causes, then drop the dead, sold and retired, add the newborn, restock ====
  // (restock when the setting is on) and re-house
  const why = {}; // today's deaths by cause, for the log
  for (const a of S.animals)
    if (dead.has(a.id) && !a.sold && !a.retired) {
      d.deaths++;
      S.tot.deaths++;
      const k = a.deathCause || (a.stress ? a.stress + ' stress' : 'background risk');
      why[k] = (why[k] || 0) + 1;
      S.tot.causes[k] = (S.tot.causes[k] || 0) + 1;
      // optional tally by species and life stage, only kept while the planner's range check runs
      if (S.gap) {
        const g = a.sp + '|' + a.st + '|' + k; // tally key: species | life stage | cause
        S.gap.deaths[g] = (S.gap.deaths[g] || 0) + 1;
      }
    }
  if (d.deaths)
    logE(
      d.deaths +
        ' died: ' +
        Object.keys(why)
          .map(k => why[k] + ' ' + k)
          .join(', ') +
        '.'
    );
  S.animals = S.animals.filter(a => !dead.has(a.id)).concat(born);
  if (+P.mg_restock) restock(d);
  rehouse();
  // ==== 6. Power and money ====
  // kWh for hutch and coop lights, fans, heaters, brooder lamps and incubators; then feed, hay, grain and
  // power costs, egg sales and the running totals in S.tot
  for (const c of S.comps) {
    const m = M[c.id];
    if ((c.type === 'hutch' || c.type === 'coop') && +c.lights)
      d.kwh += (c.lightWatts * Math.max(0, c.lightHours - env.day)) / 1000;
    if (c.type === 'fan') d.kwh += (c.watts * hoursAbove(env.tmin, env.tmax, env.day, c.trigger)) / 1000;
    if (c.type === 'heater') d.kwh += (c.watts * 24 * heaterDuty(env.tmin, env.tmax, env.day, c.setpoint)) / 1000;
    if (c.type === 'brooder') {
      const ch = S.animals.filter(a => a.enc === c.id);
      if (ch.length) d.kwh += (c.lampWatts * 24 * lampDuty(c, env.tmin, ch)) / 1000;
    }
    if (c.type === 'incubator' && +c.on && S.eggsInc.some(e => e.inc === c.id))
      d.kwh += (c.watts * 24 * 0.5) / 1000; // half its rated watts around the clock while it holds eggs: an assumption, no source recorded
  }
  let feedCost = (d.rFeed * P.pr_rfeed) / 50 + (d.cFeed * P.pr_cfeed) / 50 + (d.sFeed * P.pr_sfeed) / 50;
  const powerCost = d.kwh * P.pr_kwh,
    useOpts = +P.fd_rab > 0 || +P.fd_range > 0 || d.hay > 0 || d.grain > 0 || d.forage > 0;
  if (d.hay > 0 || d.grain > 0) {
    const fc = d.hay * P.pr_hay + (d.grain * P.pr_grain) / 50; // hay is priced per lb, corn per 50 lb bag
    feedCost += fc;
    S.tot.hayLb = (S.tot.hayLb || 0) + d.hay;
    S.tot.grainLb = (S.tot.grainLb || 0) + d.grain;
    S.tot.forageFeedCost = (S.tot.forageFeedCost || 0) + fc;
  }
  if (d.forage > 0) S.tot.rangeLb = (S.tot.rangeLb || 0) + d.forage;
  d.rev += (d.eggsSold / 12) * P.pr_egg;
  d.feedCost = feedCost;
  d.powerCost = powerCost;
  S.tot.rev += d.rev;
  S.tot.feedCost += feedCost;
  S.tot.powerCost += powerCost;
  S.tot.eggsSold += d.eggsSold;
  // ==== 7. Today's summary (S.today) and the day's ledger row (S.hist, last 3,650 days kept) ====
  S.today = computeDay();
  S.today.d = d;
  S.today.env = env;
  const c = counts();
  const row = {
    day: S.day,
    date: dateOf(S.day).toISOString().slice(0, 10),
    tmax: +env.tmax.toFixed(1),
    tmin: +env.tmin.toFixed(1),
    daylen: +env.day.toFixed(2),
    does: c.does,
    bucks: c.bucks,
    kits: c.kits,
    growers: c.growers,
    hens: c.hens,
    pullets: c.pullets,
    chicks: c.chicks,
    roosters: c.roosters,
    eggs: d.eggs,
    eggsSold: d.eggsSold,
    eggsSet: d.eggsSet,
    inIncubator: S.eggsInc.length,
    births: d.births,
    hatched: d.hatch,
    deaths: d.deaths,
    fryersSold: d.fryers,
    fryerLb: +d.fryerLb.toFixed(2),
    rabbitFeedLb: +d.rFeed.toFixed(2),
    chickenFeedLb: +d.cFeed.toFixed(2),
    chickStarterLb: +d.sFeed.toFixed(2),
    waterGal: +d.water.toFixed(2),
    kWh: +d.kwh.toFixed(2),
    feedCost: +feedCost.toFixed(2),
    powerCost: +powerCost.toFixed(2),
    revenue: +d.rev.toFixed(2),
    cash: +cash().toFixed(2),
    avgHealth: +c.health.toFixed(1)
  };
  // feeding-option columns only appear once a feeding option is in use (old runs stay byte-identical)
  if (useOpts || S.histFeed) {
    S.histFeed = 1;
    row.hayLb = +d.hay.toFixed(2);
    row.cornLb = +d.grain.toFixed(2);
    row.pastureLb = +d.forage.toFixed(2);
  }
  // restocking column only appears once breeders have been bought (old runs stay byte-identical)
  if (d.restock || S.histRestock) {
    S.histRestock = 1;
    row.breedersBought = d.restock || 0;
  }
  S.hist.push(row);
  if (S.hist.length > 3650) S.hist.shift();
}

// Restocking (a management rule): when the herd can no longer refill itself, buy breeding-age stock,
// the way FAO advises bringing bucks in from another breeder. Bought at today's breeding-rabbit price.
function restock(d) {
  if (Math.round(P.mg_does) <= 0) return;
  const R = S.animals.filter(a => a.sp === 'rabbit');
  // bucks: only grown ones count, since a kept young buck can be months from working age
  const bucks = R.filter(a => a.sex === 'M' && a.st === 'adult').length;
  const does = R.filter(a => a.sex === 'F' && (a.st === 'adult' || a.keep)).length;
  const young = R.filter(a => a.sex === 'F' && (a.st === 'kit' || (a.st === 'grower' && !a.keep))).length;
  const nB = bucks === 0 ? 1 : 0, // bucks to buy: one when no grown buck is left
    nD = does < 2 && young === 0 ? 2 - does : 0; // does to buy: up to 2 when fewer than 2 are left and no young doe is coming on
  if (!nB && !nD) return;
  for (let i = 0; i < nB; i++) S.animals.push(animal('rabbit', 'M', Math.round(P.rb_buck_age)));
  for (let i = 0; i < nD; i++) S.animals.push(animal('rabbit', 'F', Math.round(P.rb_doe_age)));
  const n = nB + nD;
  if (S.bought) S.bought.r += n;
  S.tot.stock += n * P.pr_rstock;
  S.tot.restock = (S.tot.restock || 0) + n;
  d.restock = n;
  logE(
    'Bought ' +
      (nB ? nB + ' buck' : '') +
      (nB && nD ? ' and ' : '') +
      (nD ? nD + ' doe' + (nD > 1 ? 's' : '') : '') +
      ' of breeding age ($' +
      (n * P.pr_rstock).toFixed(0) +
      '), because the herd could not refill itself.'
  );
}



// Original: source/src/core/ledger.js (blob a913be02192499f35032173d9d73df150d8eec49)
// core/ledger.js
// Economics context. Setup cost, running totals and head counts read by the panels and the planner.
function setupCost() {
  return S.comps.reduce((s, c) => s + (+c.cost || 0), 0);
}
// Money so far: sales less feed, power, animals bought and the setup cost of the buildings.
function cash() {
  return S.tot.rev - S.tot.feedCost - S.tot.powerCost - S.tot.stock - setupCost();
}
// Head counts for the panels: does, pregnant, nursing, bucks, fertile bucks, kits, growers, hens, laying hens,
// chicks and more.
function counts() {
  const c = {
    does: 0,
    pregnant: 0,
    nursing: 0,
    bucks: 0,
    fertile: 0,
    kits: 0,
    growers: 0,
    hens: 0,
    pullets: 0,
    chicks: 0,
    roosters: 0,
    cockerels: 0,
    health: 0,
    n: S.animals.length
  };
  for (const a of S.animals) {
    c.health += a.health;
    if (a.sp === 'rabbit') {
      if (a.st === 'kit') c.kits++;
      else if (a.st === 'grower') c.growers++;
      else if (a.sex === 'F') {
        c.does++;
        if (a.preg != null) c.pregnant++;
        if (a.kindle != null && S.day - a.kindle < P.rb_wean) c.nursing++;
      } else {
        c.bucks++;
        if (a.sterileUntil < S.day) c.fertile++;
      }
    } else {
      if (a.st === 'hen') c.hens++;
      else if (a.st === 'pullet') c.pullets++;
      else if (a.st === 'chick') c.chicks++;
      else if (a.st === 'rooster') c.roosters++;
      else c.cockerels++;
    }
  }
  c.health = c.n ? c.health / c.n : 0;
  return c;
}
// Daily chore time: walking from each occupied building to the feed and water stores and back (lb_trips times
// a day at lb_mph), and hands-on minutes per animal.
function labor() {
  const feed = pens('feed')[0],
    water = pens('water')[0];
  let walk = 0;
  for (const c of S.comps) {
    if (!['hutch', 'coop', 'brooder', 'incubator'].includes(c.type)) continue;
    if (
      !S.animals.some(a => a.enc === c.id) &&
      !(c.type === 'incubator' && S.eggsInc.some(e => e.inc === c.id))
    )
      continue;
    const p = ctr(c);
    const df = feed ? dist(p, ctr(feed)) : 60,
      dw = water ? dist(p, ctr(water)) : 60;
    walk += (P.lb_trips * 2 * (df + dw)) / (Math.max(0.5, P.lb_mph) * 88);
  }
  return { walk, hands: S.animals.filter(a => a.st !== 'kit').length * P.lb_hands };
}


/* Source dependency from farm-sim/source/src/planner/planner.js: called by core/access.js. */
function coopFix(c,k){return c&&c[k]!=null?+c[k]:TYPES.coop.props[k];}
function reset(seed=7){P.env_seed=seed>>>0;newState();return snapshot();}
function advanceDay(){step();return snapshot();}
function snapshot(){const r=S.hist.length?S.hist[S.hist.length-1]:null;return {day:S.day,date:dateOf(S.day).toISOString().slice(0,10),animals:S.animals.map(a=>({id:a.id,sp:a.sp,st:a.st,health:a.health})),components:S.comps.map(c=>({id:c.id,type:c.type,x:c.x,y:c.y,w:c.w,d:c.d})),daily:r?{...r}:null,counts:counts()};}
function setParameter(key,value){if(!Object.prototype.hasOwnProperty.call(P,key))throw new Error('Unknown farm parameter '+key);if(!Number.isFinite(value))throw new Error('Parameter must be finite');P[key]=value;refreshToday();}

/* BEGIN native farm visual runtime: original farm-sim source (blobs pinned per file). */

// Original upstream file: source/src/app/clock.js (blob 7d36ad05a1fa2bfbc4be43a63579028761b9cd8a)
// app/clock.js
// ---------- clock: the one owner of playback time ----------
// Context: Clock (app layer). Reads: SPEEDS below. Calls into the model: step() only.
// Model time is whole days. S.day moves only inside step(), at midnight, and every formula is a
// daily formula. The clock adds a time of day for watching: CLOCK.frac is the fraction of the
// current model day that has passed (0 = midnight). At watching speeds it moves with real time and
// each midnight it crosses runs one step(). At skipping speeds the shown hour holds still and whole
// days are owed instead. Either way the model sees the same sequence of step() calls, so a seed and
// its settings give the same totals at any speed or frame rate.
const SPEEDS = [
  { label: 'Real time', rate: 1 / 86400 },
  { label: '1 minute per second', rate: 1 / 1440 },
  { label: '1 day in 2 minutes', rate: 1 / 120 },
  { label: '1 day in 20 seconds', rate: 1 / 20 },
  { label: '1 hour per second', rate: 1 / 24 },
  { label: '1 day in 5 seconds', rate: 1 / 5 },
  { label: '1 day per second', rate: 1 },
  { label: '4 days per second', rate: 4 },
  { label: '15 days per second', rate: 15 },
  { label: '60 days per second', rate: 60 },
  { label: '180 days per second', rate: 180 }
];
const WATCH_MAX = 0.2; // days per second; at or below this the day and night play live
// CLOCK: running: playing or paused; speed: index into SPEEDS (the default 7 is 4 days a second); frac: time of day
// shown, as a fraction of the day (13/24 = 1 PM); owed: model days still to step at fast speeds, carried
// between frames; done: [time ms, days stepped] for the last 2 s, for the days-per-second readout; frameMs:
// longest a frame may spend stepping days (ms; the speed test sets it very high).
const CLOCK = { running: false, speed: 7, frac: 13 / 24, owed: 0, done: [], frameMs: 30 };
// Model days per real second at the chosen speed.
function clockRate() {
  return SPEEDS[CLOCK.speed].rate;
}
// True at the slower speeds, where the world shows the time of day passing (rate up to WATCH_MAX).
function clockLive() {
  return clockRate() <= WATCH_MAX + 1e-12;
}
// The clock hour now shown in the world (0 to 24), from the share of the day gone.
function clockHour() {
  return CLOCK.frac * 24;
}
// Advance by dtReal seconds of real time. Returns the number of model days stepped.
function clockAdvance(dtReal) {
  if (!CLOCK.running) return 0;
  const rate = clockRate(),
    dt = Math.min(Math.max(0, dtReal), 0.25),
    t0 = performance.now();
  let n = 0;
  if (clockLive()) {
    CLOCK.frac += dt * rate;
    while (CLOCK.frac >= 1) {
      step();
      CLOCK.frac -= 1;
      n++;
    }
  } else {
    // owed days carry over to later frames when a frame runs out of time; the backlog is capped
    // at half a second of play so a slow computer plays slower instead of piling up work
    CLOCK.owed = Math.min(CLOCK.owed + dt * rate, Math.max(2, rate * 0.5));
    while (CLOCK.owed >= 1 && performance.now() - t0 < CLOCK.frameMs) {
      step();
      CLOCK.owed -= 1;
      n++;
    }
  }
  if (n) {
    const now = performance.now();
    CLOCK.done.push([now, n]);
    while (CLOCK.done.length && now - CLOCK.done[0][0] > 2000) CLOCK.done.shift();
  }
  return n;
}
// Days actually stepped per second over the last two seconds (shows when the computer is the limit).
function clockActualRate() {
  if (!CLOCK.running || CLOCK.done.length < 2) return 0;
  const span = (performance.now() - CLOCK.done[0][0]) / 1000;
  return span > 0.5 ? CLOCK.done.reduce((t, x) => t + x[1], 0) / span : 0;
}
// Starts or pauses the clock. Pausing redraws every panel.
function setRun(on) {
  CLOCK.running = !!on;
  CLOCK.owed = 0;
  CLOCK.done = [];
  clockUi();
  if (!CLOCK.running) {
    renderAll();
    if (sel) renderInsp();
  }
}
// Picks speed i from SPEEDS (clamped to the list).
function setSpeed(i) {
  CLOCK.speed = clamp(Math.round(i), 0, SPEEDS.length - 1);
  CLOCK.owed = 0;
  CLOCK.done = [];
  clockUi();
}
// Sets the time of day shown in the world (hour 0 to 23.99). Does not step the model.
function setHour(h) {
  CLOCK.frac = clamp(h, 0, 23.99) / 24;
}
// Jump: run n whole days now. The time of day shown stays where it is.
function stepN(n) {
  for (let i = 0; i < n; i++) step();
  renderAll();
  if (sel) renderInsp();
}
// Brings the Run / Pause button, the speed list and the slower / faster buttons in line with the clock.
function clockUi() {
  const b = $('bRun');
  if (!b) return;
  b.textContent = CLOCK.running ? 'Pause' : 'Run';
  b.classList.toggle('on', CLOCK.running);
  $('speed').value = CLOCK.speed;
  $('bSlow').disabled = CLOCK.speed === 0;
  $('bFast').disabled = CLOCK.speed === SPEEDS.length - 1;
}


// Original upstream file: source/src/world/base.js (blob b8d322100b14787dc4df831489a2454f08942300)
// world/base.js
// Farm world (read only). Shared view state WV, the isometric projection and small helpers. The world
// draws the model; it never changes S or P and never uses the model's dice (it has its own, vr()).
// =================== FARM WORLD: the visual layer ===================
// Formulas first. Every number the world shows is read from the model (S, P, micro, loads, density,
// intake, layFactors, brooderTemp, labor). The world never calls rngNext() and never writes to the
// simulation, so drawing can't change a simulated number at any frame rate.
// Illustrative only: exact spots, walking paths, and the hour of the day an event is shown.
// ---- Contents (top-level functions, in file order; kept by tools/code_contents.py) ----
//   vr - The world's own random number, 0 to 1 (xorshift32 on vSeed).
//   iso - Screen point (CSS pixels) of the farm point x, y (ft across the plot), z (ft up), in the isometric
//         view: x and y axes 30 degrees off horizontal, then camera centre and zoom.
//   unIso - The farm point (x, y in ft) under screen point sx, sy, on the level z ft up.
//   planeT - Sets the canvas transform so drawing in farm feet on the flat level z lands where iso would put
//         it (used for ground pictures and floor patterns).
//   screenT - Sets the canvas transform back to plain CSS pixels (for text, labels and the HUD).
//   rgb - The red, green, blue numbers of a "#rrggbb" colour (cached).
//   shd - A "#rrggbb" colour made lighter or darker by factor f, with opacity a, as an rgba() string.
//   mix - A blend of two "#rrggbb" colours, t of the way from the first to the second, with opacity a, as an
//         rgba() string.
//   lw - Line width in pixels for a line f ft wide at the current zoom, never under half a pixel.
//   poly - Fills and/or strokes a polygon given as farm points [x, y, z].
//   line3 - Draws a straight line between two farm points [x, y, z].
//   box - Draws a solid box (ground footprint x, y, w by d ft, bottom z, height h ft) with its three visible
//         faces shaded, colour col, opacity al.
//   wallX - Draws a flat wall along x from x0 to x1 at y, from height z0 to z1.
//   wallY - Draws a flat wall along y from y0 to y1 at x, from height z0 to z1.
//   wireStep - the spacing [across, up] drawn for cage side wire at the current zoom, in ft
//   meshLines - many wire segments in one stroke (the fine mesh has hundreds of them)
//   mesh - wire mesh along x (fixed y) or along y (fixed x); fine: rabbit cage wire (real size when close)
//   E - Fills an ellipse in screen pixels (centre x, y, radii rx, ry, turned rot).
//   floorZ - Height in ft of the floor animals stand on in building c: hutch wire floor 2.05, coop 0.35,
//         brooder 0.3, anything else the ground (0).
//   envNow - Today's weather from the model (S.today.env), or worked out without moving the day on when today
//         has not been run yet.
//   sunInfo - Sunrise and sunset hours, the sun's height above the horizon at the hour shown, and whether it
//         is night (sun more than 1 degree down).
// ---- end of contents ----
const WV = {
  cv: null, // canvas element the world draws on
  ctx: null, // its 2D drawing context
  dpr: 1, // device pixels per CSS pixel (screen sharpness)
  w: 900, // canvas width in CSS pixels
  h: 560, // canvas height in CSS pixels
  zoom: 9, // CSS pixels per foot
  cx: 13, // camera centre in projected units (see iso): across
  cy: 27, // camera centre in projected units: down
  agents: new Map(), // every animal in the world, by animal id: position, path, task (built in agents.js)
  fx: [], // floating text ("+1 egg") and puff effects
  fly: [], // eggs flying from a nest to the incubator
  air: [], // fan air particles
  nest: {}, // eggs lying in each coop's nests today, by coop id
  queue: [], // world events waiting for their hour of the day ({t, fn, timed}), run by loop.js
  lens: 'none', // overlay drawn on the ground (none, heat, crowding, light ...)
  roofs: 1, // roof drawing: 0 off, 1 see-through, 2 solid
  labels: 1, // building labels on or off
  hour: 13, // clock hour the world is showing
  follow: 0, // 1 while the camera follows the selected animal
  hover: null, // what the pointer is over: {g} an animal or {c} a building
  selA: null, // selected animal (its card is open)
  lastDay: -1, // model day the world last caught up with
  lastS: null, // the S object the world last saw (a new one means a load or reset)
  lastToday: null, // the S.today object the world last saw
  layoutKey: '', // buildings and their sizes as one string, to notice layout edits
  pos: {}, // last seen position of each building, by id, to notice drags
  t: 0, // world time in real seconds (animation clock)
  ground: null, // cached ground picture (a canvas)
  groundKey: '', // what the cached ground picture was drawn for
  lensCv: null, // cached lens overlay picture (a canvas)
  lensKey: '', // what the cached lens picture was drawn for
  K: {}, // per-building layout worked out once per layout: fixtures, nests, cages, doors, roosts (context.js)
  vis: new Map(), // today's visual state per animal id (fill levels, poses) read from the model
  farmer: null, // the farmer walking the chore route
  route: null, // chore route: stops, feed and water stores, nodes and the day's chore time from labor()
  agg: {}, // today's feed and water totals gathered for the HUD
  aggT: 0, // when the HUD totals were last shown
  hudT: 0, // when the HUD text was last refreshed
  live: false, // true at speeds where the time of day is shown passing (clockLive)
  sun: null // sunrise, sunset, sun height and night flag for the hour shown (sunInfo)
};
// vSeed: state of the world's own random stream (vr below). The start value is just a fixed date.
let vSeed = 20261104;
// The world's own random number, 0 to 1 (xorshift32 on vSeed). Used only for looks and movement, never by the
// model, so drawing can't change a simulated number. Note: the live animation and the test tools draw from the
// same sequence, so any change to how often an animal calls vr() shifts what every later animal does.
function vr() {
  vSeed ^= vSeed << 13;
  vSeed >>>= 0;
  vSeed ^= vSeed >>> 17;
  vSeed ^= vSeed << 5;
  vSeed >>>= 0;
  return vSeed / 4294967296;
}
// vrr(a, b): a random number between a and b from the world stream.
const vrr = (a, b) => a + (b - a) * vr();
// cos 30° and sin 30°, for the isometric view below.
const C30 = 0.8660254,
  S30 = 0.5;
// Screen point (CSS pixels) of the farm point x, y (ft across the plot), z (ft up), in the isometric view: x
// and y axes 30 degrees off horizontal, then camera centre and zoom.
function iso(x, y, z) {
  return [
    WV.w / 2 + ((x - y) * C30 - WV.cx) * WV.zoom,
    WV.h / 2 + ((x + y) * S30 - (z || 0) - WV.cy) * WV.zoom
  ];
}
// The farm point (x, y in ft) under screen point sx, sy, on the level z ft up. The inverse of iso.
function unIso(sx, sy, z) {
  const ix = (sx - WV.w / 2) / WV.zoom + WV.cx,
    iy = (sy - WV.h / 2) / WV.zoom + WV.cy + (z || 0);
  const a = ix / C30,
    b = iy / S30;
  return [(a + b) / 2, (b - a) / 2];
}
// Sets the canvas transform so drawing in farm feet on the flat level z lands where iso would put it (used for
// ground pictures and floor patterns).
function planeT(z) {
  const k = WV.zoom * WV.dpr;
  WV.ctx.setTransform(
    C30 * k,
    S30 * k,
    -C30 * k,
    S30 * k,
    (WV.w / 2 - WV.cx * WV.zoom) * WV.dpr,
    (WV.h / 2 - (WV.cy + (z || 0)) * WV.zoom) * WV.dpr
  );
}
// Sets the canvas transform back to plain CSS pixels (for text, labels and the HUD).
function screenT() {
  WV.ctx.setTransform(WV.dpr, 0, 0, WV.dpr, 0, 0);
}
// cache for rgb(): colour string -> [r, g, b].
const _cc = {};
// The red, green, blue numbers of a "#rrggbb" colour (cached).
function rgb(h) {
  if (_cc[h]) return _cc[h];
  const n = parseInt(h.slice(1), 16);
  return (_cc[h] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]);
}
// A "#rrggbb" colour made lighter or darker by factor f, with opacity a, as an rgba() string. Used for shaded
// faces.
function shd(h, f, a) {
  const c = rgb(h);
  return (
    'rgba(' +
    Math.min(255, (c[0] * f) | 0) +
    ',' +
    Math.min(255, (c[1] * f) | 0) +
    ',' +
    Math.min(255, (c[2] * f) | 0) +
    ',' +
    (a == null ? 1 : a) +
    ')'
  );
}
// A blend of two "#rrggbb" colours, t of the way from the first to the second, with opacity a, as an rgba()
// string.
function mix(h1, h2, t, a) {
  const p = rgb(h1),
    q = rgb(h2);
  t = clamp(t, 0, 1);
  return (
    'rgba(' +
    ((p[0] + (q[0] - p[0]) * t) | 0) +
    ',' +
    ((p[1] + (q[1] - p[1]) * t) | 0) +
    ',' +
    ((p[2] + (q[2] - p[2]) * t) | 0) +
    ',' +
    (a == null ? 1 : a) +
    ')'
  );
}
// Line width in pixels for a line f ft wide at the current zoom, never under half a pixel.
function lw(f) {
  return Math.max(0.5, WV.zoom * (f || 0.05));
}
// Fills and/or strokes a polygon given as farm points [x, y, z].
function poly(pts, fill, stroke, w) {
  const c = WV.ctx;
  c.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const s = iso(pts[i][0], pts[i][1], pts[i][2]);
    i ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]);
  }
  c.closePath();
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = w || lw();
    c.stroke();
  }
}
// Draws a straight line between two farm points [x, y, z].
function line3(a, b, stroke, w) {
  const c = WV.ctx,
    p = iso(a[0], a[1], a[2]),
    q = iso(b[0], b[1], b[2]);
  c.beginPath();
  c.moveTo(p[0], p[1]);
  c.lineTo(q[0], q[1]);
  c.strokeStyle = stroke;
  c.lineWidth = w || lw();
  c.stroke();
}
// Draws a solid box (ground footprint x, y, w by d ft, bottom z, height h ft) with its three visible faces
// shaded, colour col, opacity al.
function box(x, y, z, w, d, h, col, al) {
  const a = al == null ? 1 : al,
    st = shd(col, 0.5, a * 0.7);
  poly(
    [
      [x, y + d, z],
      [x + w, y + d, z],
      [x + w, y + d, z + h],
      [x, y + d, z + h]
    ],
    shd(col, 0.84, a),
    st
  );
  poly(
    [
      [x + w, y, z],
      [x + w, y + d, z],
      [x + w, y + d, z + h],
      [x + w, y, z + h]
    ],
    shd(col, 0.68, a),
    st
  );
  poly(
    [
      [x, y, z + h],
      [x + w, y, z + h],
      [x + w, y + d, z + h],
      [x, y + d, z + h]
    ],
    shd(col, 1.06, a),
    st
  );
}
// Draws a flat wall along x from x0 to x1 at y, from height z0 to z1.
function wallX(x0, x1, y, z0, z1, col, a) {
  poly(
    [
      [x0, y, z0],
      [x1, y, z0],
      [x1, y, z1],
      [x0, y, z1]
    ],
    shd(col, 0.84, a),
    shd(col, 0.5, a)
  );
  if (WV.zoom > 10 && (a == null || a > 0.5))
    for (let z = z0 + 0.5; z < z1; z += 0.5) line3([x0, y, z], [x1, y, z], shd(col, 0.62, 0.5), lw(0.02));
}
// Draws a flat wall along y from y0 to y1 at x, from height z0 to z1.
function wallY(y0, y1, x, z0, z1, col, a) {
  poly(
    [
      [x, y0, z0],
      [x, y1, z0],
      [x, y1, z1],
      [x, y0, z1]
    ],
    shd(col, 0.7, a),
    shd(col, 0.5, a)
  );
  if (WV.zoom > 10 && (a == null || a > 0.5))
    for (let z = z0 + 0.5; z < z1; z += 0.5) line3([x, y0, z], [x, y1, z], shd(col, 0.55, 0.5), lw(0.02));
}
// phase 40: the rabbit cage wire at its real size, from Penn State (psu_rabbit.txt: 1 by 2 in mesh for
// the sides and top, 0.5 by 1 in for the floor). Drawn at that size from zoom 60, where 1 in is 5 px or
// more; further out the coarser texture of earlier phases stays. Which way the 2 in runs (up) and the wire
// thickness (14 gauge, 0.083 in) are my choices. Visual only.
const WIRE_ZOOM = 60,
  WIRE_SIDE = [1 / 12, 1 / 6],
  WIRE_FLOOR = [1 / 24, 1 / 12],
  WIRE_T = 0.083 / 12,
  WIRE_COL = 'rgba(228,231,235,0.62)'; // at least 0.9 px wide so the thin wire still shows on a screen
// the spacing [across, up] drawn for cage side wire at the current zoom, in ft
function wireStep() {
  if (WV.zoom > WIRE_ZOOM && !WV.noFineWire) return WIRE_SIDE.slice();
  const st = WV.zoom > 40 ? 0.25 : WV.zoom > 16 ? 0.5 : 1;
  return [st, st];
}
// many wire segments in one stroke (the fine mesh has hundreds of them)
function meshLines(segs, stroke, w) {
  const c = WV.ctx;
  c.beginPath();
  for (const [a, b] of segs) {
    const p = iso(a[0], a[1], a[2]),
      q = iso(b[0], b[1], b[2]);
    c.moveTo(p[0], p[1]);
    c.lineTo(q[0], q[1]);
  }
  c.strokeStyle = stroke;
  c.lineWidth = w;
  c.stroke();
}
// wire mesh along x (fixed y) or along y (fixed x); fine: rabbit cage wire (real size when close)
function mesh(alongX, a0, a1, k, z0, z1, fine) {
  // phase 37: close in (zoom > 40) the wire is drawn at 3 in squares, lighter, so it reads as mesh
  const st = WV.zoom > 40 ? 0.25 : WV.zoom > 16 ? 0.5 : 1,
    col = WV.zoom > 40 ? 'rgba(225,228,232,0.42)' : 'rgba(225,228,232,0.55)',
    w = lw(0.018);
  if (alongX)
    poly(
      [
        [a0, k, z0],
        [a1, k, z0],
        [a1, k, z1],
        [a0, k, z1]
      ],
      'rgba(220,225,230,0.07)'
    );
  else
    poly(
      [
        [k, a0, z0],
        [k, a1, z0],
        [k, a1, z1],
        [k, a0, z1]
      ],
      'rgba(220,225,230,0.07)'
    );
  if (WV.zoom < 6) return;
  if (fine && WV.zoom > WIRE_ZOOM && !WV.noFineWire) {
    const [sa, sz] = WIRE_SIDE,
      segs = [];
    for (let t = a0; t <= a1 + 1e-6; t += sa) segs.push(alongX ? [[t, k, z0], [t, k, z1]] : [[k, t, z0], [k, t, z1]]);
    for (let z = z0; z <= z1 + 1e-6; z += sz) segs.push(alongX ? [[a0, k, z], [a1, k, z]] : [[k, a0, z], [k, a1, z]]);
    meshLines(segs, WIRE_COL, Math.max(0.9, lw(WIRE_T)));
    return;
  }
  for (let t = a0; t <= a1 + 1e-6; t += st) {
    alongX ? line3([t, k, z0], [t, k, z1], col, w) : line3([k, t, z0], [k, t, z1], col, w);
  }
  for (let z = z0; z <= z1 + 1e-6; z += st) {
    alongX ? line3([a0, k, z], [a1, k, z], col, w) : line3([k, a0, z], [k, a1, z], col, w);
  }
}
// Fills an ellipse in screen pixels (centre x, y, radii rx, ry, turned rot). Used for animal bodies and heads.
function E(x, y, rx, ry, rot, fill) {
  const c = WV.ctx;
  c.beginPath();
  c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, 6.2832);
  c.fillStyle = fill;
  c.fill();
}

// ---------- reading the model ----------
// Height in ft of the floor animals stand on in building c: hutch wire floor 2.05, coop 0.35, brooder
// 0.3, anything else the ground (0).
function floorZ(c) {
  if (!c) return 0;
  return c.type === 'hutch' ? 2.05 : c.type === 'coop' ? 0.35 : c.type === 'brooder' ? 0.3 : 0;
}
// Today's weather from the model (S.today.env), or worked out without moving the day on when today has not
// been run yet.
function envNow() {
  return (S.today && S.today.env) || weather(false);
}
// Sunrise and sunset hours, the sun's height above the horizon at the hour shown, and whether it is night (sun
// more than 1 degree down).
function sunInfo() {
  const env = envNow(),
    day = env.day,
    rise = 12 - day / 2,
    set = 12 + day / 2;
  const lat = (P.env_lat * Math.PI) / 180,
    dec = ((23.44 * Math.PI) / 180) * Math.sin((2 * Math.PI * (284 + doyOf(S.day))) / 365),
    H = ((WV.hour - 12) * 15 * Math.PI) / 180;
  const el =
    (Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H)) * 180) / Math.PI;
  return { rise, set, el, day, env, night: el < -1 };
}


// Original upstream file: source/src/world/cages.js (blob df970efce33baad6cd246b27ccee14aca4646afd)
// world/cages.js
// Farm world (visual only). Phase 28: the separate cages inside each rabbit hutch bank and the wire
// dividers between them. The model pools a bank's floor (rb_cage sq ft per adult or doe with her
// litter, rb_grower per weaned grower, at most rb_grp_max growers to a group cage) and never says which
// rabbit sits in which cage. cagePlan() works one out for the picture, from today's model state only
// (no memory, so a reload draws the same cages):
//  - the bank is cut into equal cages running its full depth, as many as fit at rb_cage sq ft each
//    (Penn State's all-wire hutch: one cage per breeding rabbit), never narrower than 1.5 ft;
//  - each adult (buck, doe) and each young buck kept apart (rb_split) gets a cage of its own; kits stay
//    with their mother; pooled growers go in groups of rb_grp_max (the model's own group count), and a
//    group that needs more floor than one cage gets neighbouring cages with the divider left out;
//  - single cages fill from the left end in id order (oldest rabbits first, so they keep their cage
//    from day to day), group cages from the right end, which keeps the free floor in one run;
//  - when the bank has no free cage left, the extra rabbits share a cage (growers with their own
//    mother or with other growers first) and the map says so (it never draws more cages than fit).
// Fixtures: the hoppers and bottles set for the bank are what the model shares out among the pooled
// growers (core/access.js rgCalc), so they are drawn in the group cages (in empty cages when there are
// no growers). Each cage with an adult or a single young buck also gets a hopper and bottle on its
// front wire (Penn State, psu_rabbit.txt: "Each cage should have a feed hopper and a watering system
// attached to the outside of the cage"; phase 40 found this sourced, it was marked my illustration).
// The model does not ration adults by hopper, so these change nothing.
// the first free run of n cages: from the left end, or from the right end when fromRight
function cageRun(owner, n, fromRight) {
  const N = owner.length,
    top = N - n + 1;
  if (top < 1) return -1;
  for (let j = 0; j < top; j++) {
    const s = fromRight ? top - 1 - j : j;
    let ok = true;
    for (let t = s; t < s + n; t++)
      if (owner[t] >= 0) {
        ok = false;
        break;
      }
    if (ok) return s;
  }
  return -1;
}
// The longest run of free places (owner below 0) in a row of cage places.
function cageLongest(owner) {
  let best = 0,
    run = 0;
  for (const o of owner) {
    run = o < 0 ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}
// builds K.spans (one per cage or merged group cage), K.cageOf (animal id -> span), K.divs (divider x),
// K.hops/K.drinks (the setting's fixtures), K.ownHops/K.ownDrinks, K.nests/K.nestOf and K.cg (summary)
function cagePlan(c, K) {
  const area = c.w * c.d,
    N = Math.max(1, Math.min(Math.floor(area / Math.max(0.5, +P.rb_cage) + 1e-9), Math.floor(c.w / 1.5))),
    cw = c.w / N,
    cageSq = cw * c.d,
    gmax = Math.max(1, Math.round(+P.rb_grp_max));
  const rs = S.animals.filter(a => a.enc === c.id && a.sp === 'rabbit').sort((p, q) => p.id - q.id),
    here = new Set(rs.map(a => a.id)),
    singles = [],
    pools = { g: [], f: [], k: [] };
  for (const a of rs) {
    if (a.st === 'kit' && a.mother != null && here.has(a.mother)) continue; // in its mother's cage
    if (a.st === 'kit') pools.k.push(a);
    else if (a.st === 'grower' && !(rabSplit(a) && a.sex === 'M')) pools[rabSplit(a) ? 'f' : 'g'].push(a);
    else
      singles.push({
        key: 'a' + a.id,
        ids: [a.id],
        kind: a.st === 'adult' ? (a.sex === 'M' ? 'buck' : 'doe') : 'single',
        sq: rabSpace(a),
        need: 1
      });
  }
  // groups: oldest first, rb_grp_max to a cage group (rgCalc's groups = ceil(n / rb_grp_max))
  const groups = [];
  for (const p of ['g', 'f', 'k']) {
    const L = pools[p].sort((x, y) => y.age - x.age || x.id - y.id);
    for (let i = 0; i < L.length; i += gmax) {
      const m = L.slice(i, i + gmax),
        sq = m.reduce((s, a) => s + rabSpace(a), 0);
      groups.push({ key: p + (i / gmax), ids: m.map(a => a.id), kind: 'group', sq, need: Math.max(1, Math.ceil(sq / cageSq - 1e-9)) });
    }
  }
  const owner = new Array(N).fill(-1),
    units = [],
    over = [];
  // singles first (one cage each, at their hashed spot), then groups in the longest free runs left
  for (const u of singles) {
    const s = cageRun(owner, 1, false);
    if (s < 0) {
      over.push(u);
      continue;
    }
    u.at = s;
    u.n = 1;
    owner[s] = units.push(u) - 1;
  }
  let squeezed = 0;
  for (const u of groups) {
    const best = cageLongest(owner);
    if (!best) {
      over.push(u);
      continue;
    }
    const n = Math.min(u.need, best);
    if (n < u.need) squeezed++;
    const s = cageRun(owner, n, true);
    u.at = s;
    u.n = n;
    const ui = units.push(u) - 1;
    for (let t = s; t < s + n; t++) owner[t] = ui;
  }
  // spans: neighbouring cages of one unit form one cage; each empty cage is its own
  const spans = [],
    spanAt = new Array(N);
  for (let t = 0; t < N; t++) {
    if (t > 0 && owner[t] >= 0 && owner[t] === owner[t - 1]) {
      spans[spans.length - 1].n++;
      spans[spans.length - 1].w += cw;
    } else {
      const u = owner[t] >= 0 ? units[owner[t]] : null;
      spans.push({ x: c.x + t * cw, y: c.y, w: cw, d: c.d, i0: t, n: 1, kind: u ? u.kind : 'empty', ids: u ? u.ids.slice() : [], sq: u ? u.sq : 0, hops: [], drinks: [] });
    }
    spanAt[t] = spans.length - 1;
  }
  // no free cage: the extra rabbits share the cage with the least floor in use per sq ft, growers
  // first with other growers, then with their own mother; adults away from bucks while there is a choice
  let doubled = 0;
  const momOf = {};
  for (const a of rs) momOf[a.id] = a.mother;
  for (const u of over) {
    const load = s => s.sq / (s.w * s.d),
      moms = new Set(u.ids.map(i => momOf[i]).filter(m => m != null)),
      rank = s => (u.kind === 'group' ? (s.kind === 'group' ? 0 : s.ids.some(i => moms.has(i)) ? 1 : 2) : 0);
    let cand = spans.filter(s => s.kind !== 'empty' && (u.kind === 'group' || s.kind !== 'buck'));
    if (u.kind === 'group') cand = cand.filter(s => s.kind !== 'buck');
    if (!cand.length) cand = spans.filter(s => s.kind !== 'empty');
    if (!cand.length) cand = spans;
    cand.sort((a, b) => rank(a) - rank(b) || load(a) - load(b) || a.i0 - b.i0);
    const s = cand[0];
    s.ids.push(...u.ids);
    s.sq += u.sq;
    s.shared = 1;
    if (s.kind === 'empty') s.kind = u.kind;
    doubled += u.ids.length;
  }
  const of = {};
  spans.forEach((s, i) => s.ids.forEach(id => (of[id] = i)));
  for (const a of rs) if (a.st === 'kit' && a.mother != null && of[a.mother] != null) of[a.id] = of[a.mother];
  // dividers between cages that are not one merged group cage
  const divs = [];
  for (let t = 1; t < N; t++) if (spanAt[t] !== spanAt[t - 1]) divs.push(c.x + t * cw);
  // the setting's hoppers and bottles (counts as before phase 28: as many as fit along the wire)
  const nh = Math.max(0, Math.round(hutchFix(c, 'hoppers'))),
    nd0 = Math.max(0, Math.round(hutchFix(c, 'drinkers'))),
    room = Math.max(2, Math.floor((c.w - 0.3) / 0.55)),
    dh = Math.min(nh, Math.ceil(room / 2)),
    dd = Math.min(nd0, room - dh);
  let tgt = spans.filter(s => s.kind === 'group');
  if (!tgt.length) tgt = spans.filter(s => s.kind === 'empty');
  if (!tgt.length) tgt = spans;
  // share the items out by cage width (largest remainder), then interleave hoppers and bottles
  const tot = dh + dd,
    wsum = tgt.reduce((s, x) => s + x.n, 0),
    cnt = tgt.map(s => Math.floor((tot * s.n) / wsum));
  let left = tot - cnt.reduce((s, x) => s + x, 0);
  tgt
    .map((s, i) => [((tot * s.n) / wsum) % 1, i])
    .sort((a, b) => b[0] - a[0] || a[1] - b[1])
    .forEach(([, i]) => {
      if (left > 0) cnt[i]++, left--;
    });
  K.hops = [];
  K.drinks = [];
  let ih = 0,
    id = 0;
  tgt.forEach((s, j) => {
    for (let i = 0; i < cnt[j]; i++) {
      const px = s.x + ((i + 0.5) * s.w) / cnt[j],
        wantH = ih < dh && (id >= dd || ih * dd <= id * dh);
      if (wantH) {
        const p = [px, c.y + c.d - 0.35];
        K.hops.push(p);
        s.hops.push(p);
        ih++;
      } else if (id < dd) {
        const p = [px, c.y + c.d - 0.3];
        K.drinks.push(p);
        s.drinks.push(p);
        id++;
      }
    }
  });
  // each cage with an adult or a single young buck: its own hopper and bottle on the front wire
  K.ownHops = [];
  K.ownDrinks = [];
  for (const s of spans) {
    if (s.kind === 'empty' || s.kind === 'group') continue;
    if (!s.hops.length) {
      const p = [s.x + s.w * 0.3, c.y + c.d - 0.35];
      K.ownHops.push(p);
      s.hops.push(p);
    }
    if (!s.drinks.length) {
      const p = [s.x + s.w * 0.74, c.y + c.d - 0.3];
      K.ownDrinks.push(p);
      s.drinks.push(p);
    }
  }
  K.hopDrawn = K.hops.length;
  K.drinkDrawn = K.drinks.length;
  K.feeder = K.hops[0] || K.ownHops[0] || [c.x + c.w * 0.25, c.y + c.d - 0.35];
  K.water = K.drinks[0] || K.ownDrinks[0] || [c.x + c.w * 0.62, c.y + c.d - 0.3];
  // nest boxes: in the back of each kindling or nursing doe's own cage (a second doe sharing an
  // over-full cage gets the other back corner when it fits)
  const nd = rs.filter(
    a =>
      a.sex === 'F' &&
      (a.st === 'adult' || a.st === 'grower') &&
      ((a.preg != null && a.preg >= a.gestLen - 5) || (a.kindle != null && S.day - a.kindle < P.rb_wean))
  );
  K.nestOf = {};
  K.nests = [];
  const used = {};
  for (const a of nd) {
    const si = of[a.id];
    if (si == null) continue;
    const s = spans[si],
      nw = Math.min(1.15, s.w - 0.5),
      k = used[si] || 0;
    if (nw < 0.6 || k > 1 || (k === 1 && s.w < 2 * nw + 0.45)) continue;
    const n = { x: k ? s.x + s.w - 0.12 - nw : s.x + 0.12, y: c.y + 0.15, w: nw, d: Math.min(1.4, c.d - 0.6), doe: a.id, hole: k ? 'l' : 'r' };
    used[si] = k + 1;
    K.nests.push(n);
    K.nestOf[a.id] = n;
  }
  K.doors = cageDoorPlan(spans);
  K.spans = spans;
  K.cageOf = of;
  K.divs = divs;
  K.cg = { N, cw, cageSq, over: K.dens > 1 + 1e-9, doubled, squeezed, groups: groups.length };
}
// the floor an animal may use: its cage in a hutch bank, else the whole pen (or an object with x,y,w,d)
function cageBox(g, zc) {
  if (!zc || zc.type !== 'hutch') return zc;
  const K = WV.K[zc.id],
    i = K && K.cageOf ? K.cageOf[g.ref ? g.ref.id : g.id] : null;
  return i != null && K.spans[i] ? K.spans[i] : zc;
}
// the hopper and bottle a rabbit uses: inside its own cage (spread by id, no dice)
function rabFix(g, home, K) {
  const s = cageBox(g, home),
    id = g.ref.id;
  if (s !== home) {
    const hop = s.hops.length ? s.hops[id % s.hops.length] : [s.x + s.w * 0.3, home.y + home.d - 0.35],
      bot = s.drinks.length ? s.drinks[id % s.drinks.length] : [s.x + s.w * 0.74, home.y + home.d - 0.3];
    return [hop, bot];
  }
  return [
    K.hops && K.hops.length ? K.hops[id % K.hops.length] : K.feeder,
    K.drinks && K.drinks.length ? K.drinks[id % K.drinks.length] : K.water
  ];
}
// one panel of divider wire, drawn in short lengths so each sorts with the rabbits on either side
function cageWire(xd, ya, yb, yFront) {
  const z0 = 2.05,
    z1 = 4.1;
  poly(
    [
      [xd, ya, z0],
      [xd, yb, z0],
      [xd, yb, z1],
      [xd, ya, z1]
    ],
    'rgba(220,225,230,0.07)'
  );
  if (WV.zoom < 6) {
    line3([xd, ya, z1], [xd, yb, z1], 'rgba(225,228,232,0.55)', lw(0.018));
    return;
  }
  // phase 40: from zoom 60 the divider is Penn State's 1 by 2 in wire at its real size (world/base.js)
  if (WV.zoom > WIRE_ZOOM && !WV.noFineWire) {
    const [sa, sz] = WIRE_SIDE,
      segs = [],
      b0 = yFront - Math.ceil((yFront - ya) / sa - 1e-6) * sa;
    for (let t = b0; t < yb - 1e-6; t += sa) if (t >= ya - 1e-6) segs.push([[xd, t, z0], [xd, t, z1]]);
    for (let z = z0; z <= z1 + 1e-6; z += sz) segs.push([[xd, ya, z], [xd, yb, z]]);
    meshLines(segs, WIRE_COL, Math.max(0.9, lw(WIRE_T)));
    line3([xd, ya, z1], [xd, yb, z1], 'rgba(150,155,160,0.8)', lw(0.03));
    if (Math.abs(yb - yFront) < 1e-6) line3([xd, yb, z0], [xd, yb, z1], 'rgba(150,155,160,0.8)', lw(0.03));
    return;
  }
  const st = WV.zoom > 40 ? 0.25 : WV.zoom > 16 ? 0.5 : 1,
    col = WV.zoom > 40 ? 'rgba(225,228,232,0.42)' : 'rgba(225,228,232,0.55)',
    w = lw(0.018),
    base = yFront - Math.ceil((yFront - ya) / st - 1e-6) * st;
  for (let t = base; t < yb - 1e-6; t += st) if (t >= ya - 1e-6) line3([xd, t, z0], [xd, t, z1], col, w);
  for (let z = z0; z <= z1 + 1e-6; z += st) line3([xd, ya, z], [xd, yb, z], col, w);
  line3([xd, ya, z1], [xd, yb, z1], 'rgba(150,155,160,0.8)', lw(0.03));
  if (Math.abs(yb - yFront) < 1e-6) line3([xd, yb, z0], [xd, yb, z1], 'rgba(150,155,160,0.8)', lw(0.03));
}
// phase 37: one front access door per cage (FAO x5082: access to the cage is through a door in the
// front), in the widest stretch of front wire clear of the hopper and the bottle, since FAO says feeders
// should be filled from outside without opening the door. Visual only; the door's size (up to 15 by 15
// in) and the raised door over a hopper are illustrations.
function cageDoorPlan(spans) {
  const out = [];
  // widest stretch of front wire between the given blocked intervals
  const widest = (s, blk) => {
    const end = s.x + s.w - 0.1;
    let a = s.x + 0.1,
      best = null;
    for (const b of blk.sort((p, q) => p[0] - q[0]).concat([[end, end]])) {
      const g1 = Math.min(b[0], end);
      if (g1 - a > (best ? best[1] - best[0] : 0)) best = [a, g1];
      a = Math.max(a, b[1]);
    }
    return best;
  };
  spans.forEach((s, i) => {
    const bot = s.drinks.map(p => [p[0] - 0.17, p[0] + 0.17]);
    let g = widest(s, s.hops.map(p => [p[0] - 0.3, p[0] + 0.3]).concat(bot)),
      z0 = 2.3,
      hmax = 1.25;
    // no room beside the hoppers: a door above them (hopper tops reach 0.77 ft over the floor)
    if (!g || g[1] - g[0] < 0.55) {
      g = widest(s, bot);
      z0 = 2.9;
      hmax = 1.05;
    }
    if (!g || g[1] - g[0] < 0.55) return;
    const dw = Math.min(1.25, g[1] - g[0] - 0.1),
      cx = (g[0] + g[1]) / 2;
    out.push({ x0: cx - dw / 2, x1: cx + dw / 2, z0, z1: z0 + Math.min(hmax, dw + 0.2), span: i, high: z0 > 2.5 });
  });
  return out;
}
// draw items for a bank's dividers: 0.5 ft lengths keyed by their own depth (x + y)
function cageWireItems(k, items) {
  const K = WV.K[k.id];
  if (!K || !K.divs) return;
  const n = Math.max(1, Math.ceil(k.d / 0.5)),
    sl = k.d / n;
  for (const xd of K.divs)
    for (let i = 0; i < n; i++) {
      const ya = k.y + i * sl,
        yb = k.y + (i + 1) * sl;
      items.push({ k: xd + (ya + yb) / 2, f: () => cageWire(xd, ya, yb, k.y + k.d) });
    }
}


// Original upstream file: source/src/world/context.js (blob 996a1a14e12f9d4acf0cf5acc8aadced5651eb44)
// world/context.js
// Farm world. Reads each pen's microclimate and each animal's daily stress from the model, plus the
// hourly posture helpers (hotNow, coldNow).
// ---- Contents (top-level functions, in file order; kept by tools/code_contents.py) ----
//   layoutKey - One string for everything that changes the drawn layout (each building's id, type, place, size
//         and fixtures, and the cage settings); the layout is worked out again only when it changes.
//   buildCtx - Works out every building's drawn layout once per layout change, into WV.K by building id: the
//         model's microclimate and density for it, hutch cages, coop nests, roost frames, troughs a ...
//   barLen - A perch setting longer than the first roost frame holds gets a second roost in the coop's free
//         floor space, with the same Penn State rules: 2 x 2 in bars 24 in above the floor and at l ...
//   roostMore - Places a second roost frame for perch that does not fit on the first one (phase 38): marks the
//         coop floor that must stay clear, then picks bar lines on a 0.1 ft grid.
//   penRation - Each feeder and waterer is drawn filled at the morning chore (sunrise) with the pen's modelled
//         feed and water for the day, shared evenly between the feeders, and it drains as the animals eat.
//   eatenShare - Share of the day's ration eaten by this hour: hens eat through the daylight hours, rabbits
//         eat twice as fast at night as by day, chicks evenly round the clock.
//   fillLeft - share of today's ration left in this pen's feeders and waterers at the hour shown (1 = just
//         filled)
//   doorBetween - The door point on the shared wall of building a and an attached building b (the middle of
//         the wall they share).
//   buildVis - Works out each animal's visual state for today from the model (WV.vis): its pen's microclimate,
//         feed and water intake, and the heat and cold limits that change its pose.
//   hourTemp - The pen's temperature at the hour shown.
//   hotNow - True when the animal's pen is above its heat limit at the hour shown.
//   coldNow - True when the animal feels the cold (cold limit setting) at the hour shown.
//   buildRoute - Works out the farmer's chore route: each occupied building with its approach point, the feed
//         and water stores, and the day's chore time from labor().
//   approach - The point just outside building c (front or side, whichever is nearer to x, y) where the farmer
//         stands to do its chores.
//   broodGear - Sizes the brooder's troughs and waterers from the chicks in it (Missouri Extension G8351,
//         tables above) and places them (phase 33, crowded layout phase 36 in broodPack).
//   broodPack - phase 36: a crowded brooder (more troughs and waterers than its two short walls hold).
//   broodEnds - Sets the brooder's feeder and water points (the first trough and waterer), used where older
//         code wants one of each.
// ---- end of contents ----

// One string for everything that changes the drawn layout (each building's id, type, place, size and
// fixtures, and the cage settings); the layout is worked out again only when it changes.
function layoutKey() {
  return S.comps
    .map(c =>
      [
        c.id,
        c.type,
        c.x,
        c.y,
        c.w,
        c.d,
        c.radius,
        c.lights,
        c.lightHours,
        c.indoor,
        c.lampWatts,
        c.on,
        c.hoppers,
        c.drinkers,
        c.nests,
        c.perchFt,
        c.feederIn,
        c.waterIn
      ].join(',')
    )
    .join('|') + '|cage:' + P.rb_cage + ',' + P.rb_grp_max; // phase 28: the drawn cages follow these settings
}
// Works out every building's drawn layout once per layout change, into WV.K by building id: the model's
// microclimate and density for it, hutch cages, coop nests, roost frames, troughs and waterers, brooder gear
// and the doors to attached runs. Read by drawing and by the animals' choices.
function buildCtx() {
  WV.K = {};
  const runs = pens('run');
  for (const c of S.comps) {
    const k = {
      c,
      m: (S.today.M && S.today.M[c.id]) || micro(c, envNow()),
      dens: TYPES[c.type].pen ? density(c.id, S.today.L || loads()) : 0
    };
    if (c.type === 'hutch') {
      // phase 28: the bank is drawn as separate cages (world/cages.js): the setting's hoppers and bottles
      // go in the growers' group cages, each single cage gets its own, nest boxes sit in the doe's cage
      k.hopN = Math.max(0, Math.round(hutchFix(c, 'hoppers')));
      k.drinkN = Math.max(0, Math.round(hutchFix(c, 'drinkers')));
      k.rabN = S.animals.filter(a => a.enc === c.id).length;
      cagePlan(c, k);
    }
    if (c.type === 'coop') {
      const n = nestsFor(c),
        fit = Math.max(1, Math.floor((c.w - 0.4) / 1.15));
      k.nestN = n;
      k.nests = [];
      // Penn State (Poultry Production, layers): "at least one 12-inch-by-12-inch nest for every four
      // hens ... Place nests 24 inches above the floor and away from the roosts." Phase 27: the nest
      // row sits on a stand 24 in (2.0 ft) above the coop floor, with legs that floor birds walk round
      // (visual only; it was 11 in up and hung in the air before).
      const fz0 = floorZ(c);
      for (let i = 0; i < Math.min(n, fit); i++)
        k.nests.push({ x: c.x + 0.25 + i * 1.15, y: c.y + 0.1, w: 1.05, d: 1.0, z: fz0 + 2.0 });
      k.legs = [];
      if (k.nests.length) {
        const n0 = k.nests[0],
          nL = k.nests[k.nests.length - 1],
          fy = n0.y + n0.d - 0.17;
        // front legs at both ends of the row and between every second box (2 by 2 in posts)
        const xs = [n0.x];
        for (let i = 2; i < k.nests.length; i += 2) xs.push(k.nests[i].x - 0.05);
        xs.push(nL.x + nL.w - 0.17);
        for (const lx of xs) k.legs.push({ x: lx, y: fy, w: 0.17, d: 0.17, top: n0.z - 0.15, kind: 'nest' });
      }
      // Perch: the coop's perch length setting, drawn as a roost frame. Penn State: "Place 2-inch-by-
      // 2-inch boards spaced 12 inches apart and 24 inches above the floor. Provide 6 linear inches of
      // perch space per bird." Merck: the lowest perch 18 to 36 in off the ground. Phase 27: every bar
      // 24 in up, 12 in apart, 2 x 2 in, on a frame whose legs are solid to birds on the floor (before:
      // a ladder at 26, 20 and 15 in, 11 in apart, legs walked through). The frame stands clear of the
      // nest boxes and of the trough. Bars that do not fit are counted in perchDrawnFt (shortfall).
      const y0 = c.y + 1.9,
        L = Math.max(1, c.d - 2.3),
        want = Math.max(0, coopFix(c, 'perchFt')),
        maxBars = Math.max(1, Math.floor((c.w * 0.42) / 1.0)),
        nb = Math.min(maxBars, Math.max(1, Math.ceil(want / L - 1e-9)));
      k.perches = [];
      let left = want;
      for (let b = 0; b < nb; b++) {
        const len = Math.max(0.5, Math.min(L, left));
        left -= len;
        k.perches.push({ x: c.x + 0.7 + b * 1.0, y0, y1: y0 + len, z: fz0 + 2.0 });
      }
      for (const p of k.perches)
        for (const ly of [p.y0, p.y1 - 0.17])
          k.legs.push({ x: p.x - 0.085, y: ly, w: 0.17, d: 0.17, top: p.z, kind: 'perch' });
      k.perch = k.perches[0];
      k.perchFt = want;
      k.perchDrawnFt = k.perches.reduce((s, p) => s + (p.y1 - p.y0), 0);
      k.roostFrames = [{ ax: 'y', bars: k.perches.slice() }];
      // Feeder: Penn State gives 3 in of feeder space per bird with a trough filled one-third to one-half
      // full and its lip at the birds' back height. Both sides of a trough count, so a trough is half the
      // feeder space long; long troughs are split so each fits the coop (visual only).
      const fIn = Math.max(1, coopFix(c, 'feederIn')),
        wIn = Math.max(1, coopFix(c, 'waterIn')),
        maxT = Math.max(1.0, c.w * 0.45),
        nt = Math.max(1, Math.ceil(fIn / 24 / maxT - 1e-9)),
        tl = fIn / 24 / nt;
      k.troughs = [];
      for (let i = 0; i < nt; i++)
        k.troughs.push({ x: c.x + c.w * 0.55 - tl / 2, y: c.y + c.d * 0.55 - 0.2 + i * 0.75, w: tl, d: 0.4 });
      // Waterer: round founts whose lip adds up to the waterer space (Penn State 1 in per bird);
      // a fount's lip is its circumference, at most 3 ft round each (visual only).
      const nf = Math.max(1, Math.ceil(wIn / 36 - 1e-9));
      k.founts = [];
      for (let i = 0; i < nf; i++)
        k.founts.push({
          x: c.x + c.w * 0.82 - i * 0.9,
          y: c.y + c.d * 0.75,
          r: wIn / nf / Math.PI / 12 / 2
        });
      // phase 38: perch the first frame cannot hold goes on a second roost in the free floor space
      if (want - k.perchDrawnFt > 0.25) roostMore(c, k, want - k.perchDrawnFt, fz0, runs);
      k.feederIn = fIn;
      k.waterIn = wIn;
      k.feeder = [k.troughs[0].x + tl / 2, k.troughs[0].y + 0.2];
      k.water = [k.founts[0].x, k.founts[0].y];
      k.runs = runs.filter(r => touches(c, r)).map(r => ({ r, door: doorBetween(c, r) }));
    }
    if (c.type === 'run') {
      k.attached = pens('coop').some(cp => touches(cp, c));
      k.water = [c.x + c.w - 0.8, c.y + 0.8];
    }
    if (c.type === 'brooder') {
      k.lamp = [c.x + c.w / 2, c.y + c.d / 2];
      const ch = S.animals.filter(a => a.enc === c.id);
      broodGear(c, k, ch);
      k.duty = ch.length ? lampDuty(c, k.m.tmin, ch) : 0;
      k.n = ch.length;
      if (ch.length) {
        const need = chickNeed(Math.min(...ch.map(a => a.age)));
        k.need = need;
        k.t = brooderTemp(c, k.m, need);
      }
    }
    WV.K[c.id] = k;
  }
}
// ---------- second roost (phase 38, visual only) ----------
// A perch setting longer than the first roost frame holds gets a second roost in the coop's free floor
// space, with the same Penn State rules: 2 x 2 in bars 24 in above the floor and at least 12 in apart.
// Penn State also says to keep nests away from the roosts, so bars stay 1 ft clear of the nest stand;
// they also stay clear of the first frame, the troughs and founts (where birds stand to eat and drink),
// the walls and the way in from each pop door. The bars may run along either side of the coop; the
// direction that holds more perch wins. A 1-D best-pick over grid lines (0.1 ft) chooses the bars.
// Bars shorter than 1.5 ft are not used. What still does not fit stays in the panel note.
function barLen(b) {
  return b.ax === 'x' ? b.x1 - b.x0 : b.y1 - b.y0;
}
// Places a second roost frame for perch that does not fit on the first one (phase 38): marks the coop floor
// that must stay clear, then picks bar lines on a 0.1 ft grid. Rules in the comment above.
function roostMore(c, k, need, fz0, runs) {
  const s = 0.1,
    nx = Math.floor(c.w / s + 1e-9),
    ny = Math.floor(c.d / s + 1e-9),
    bl = new Uint8Array(nx * ny),
    rects = [];
  const add = (x0, y0, x1, y1) => rects.push([x0 - c.x, y0 - c.y, x1 - c.x, y1 - c.y]);
  if (k.nests.length) {
    const n0 = k.nests[0],
      nL = k.nests[k.nests.length - 1];
    add(n0.x - 1.0, n0.y - 1.0, nL.x + nL.w + 1.0, n0.y + n0.d + 1.0);
  }
  for (const b of k.perches) add(b.x - 0.95, b.y0 - 0.5, b.x + 0.95, b.y1 + 0.5);
  for (const t of k.troughs) add(t.x - 0.6, t.y - 0.6, t.x + t.w + 0.6, t.y + t.d + 0.6);
  for (const f of k.founts) add(f.x - f.r - 0.6, f.y - f.r - 0.6, f.x + f.r + 0.6, f.y + f.r + 0.6);
  for (const r of runs || []) {
    if (!touches(c, r)) continue;
    const dr = doorBetween(c, r);
    if (!dr) continue;
    // the way in: 2 ft deep from the wall, 1.6 ft wide
    const [dx, dy] = dr,
      L = 2.0,
      W = 0.8;
    if (Math.abs(dx - c.x) < 0.01) add(dx, dy - W, dx + L, dy + W);
    else if (Math.abs(dx - c.x - c.w) < 0.01) add(dx - L, dy - W, dx, dy + W);
    else if (Math.abs(dy - c.y) < 0.01) add(dx - W, dy, dx + W, dy + L);
    else add(dx - W, dy - L, dx + W, dy);
  }
  const m = 0.5;
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++) {
      const px = (i + 0.5) * s,
        py = (j + 0.5) * s;
      let b = px < m || px > c.w - m || py < m || py > c.d - m;
      for (let r = 0; !b && r < rects.length; r++) {
        const q = rects[r];
        if (px > q[0] - 0.1 && px < q[2] + 0.1 && py > q[1] - 0.1 && py < q[3] + 0.1) b = true; // 0.1 ft clear of each
      }
      bl[i * ny + j] = b ? 1 : 0;
    }
  const minL = 1.5,
    gap = Math.round(1.0 / s);
  // free runs on each grid line: ax 'y' lines are columns (bars run along y), 'x' lines are rows
  const plan = ax => {
    const nl = ax === 'y' ? nx : ny,
      na = ax === 'y' ? ny : nx,
      lines = [];
    for (let l = 0; l < nl; l++) {
      const segs = [];
      let st = -1;
      for (let a = 0; a <= na; a++) {
        const free = a < na && !(ax === 'y' ? bl[l * ny + a] : bl[a * ny + l]);
        if (free && st < 0) st = a;
        if (!free && st >= 0) {
          if ((a - st) * s >= minL - 1e-9) segs.push([st * s, a * s]);
          st = -1;
        }
      }
      lines.push({ l, segs, len: segs.reduce((t, g) => t + g[1] - g[0], 0) });
    }
    // best total length with picked lines at least 'gap' apart
    const best = new Float64Array(nl + 1),
      pick = new Int8Array(nl + 1);
    for (let l = 1; l <= nl; l++) {
      const skip = best[l - 1],
        take = lines[l - 1].len + (l - gap >= 0 ? best[Math.max(0, l - gap)] : 0);
      if (lines[l - 1].len > 0 && take > skip + 1e-9) {
        best[l] = take;
        pick[l] = 1;
      } else best[l] = skip;
    }
    const chosen = [];
    for (let l = nl; l >= 1; ) {
      if (pick[l]) {
        chosen.unshift(lines[l - 1]);
        l -= gap;
      } else l--;
    }
    return { ax, total: best[nl], chosen };
  };
  const py = plan('y'),
    px = plan('x'),
    P = px.total > py.total + 1e-9 ? px : py;
  if (P.total <= 0) return;
  let left = need;
  const extra = [];
  for (const ln of P.chosen) {
    for (const sg of ln.segs) {
      if (left <= 0.25) break;
      const len = Math.max(0.5, Math.min(sg[1] - sg[0], left)),
        a0 = sg[0] + (sg[1] - sg[0] - len) / 2;
      left -= len;
      const at = (ln.l + 0.5) * s;
      extra.push(
        P.ax === 'y'
          ? { x: c.x + at, y0: c.y + a0, y1: c.y + a0 + len, z: fz0 + 2.0, line: ln.l, more: 1 }
          : { ax: 'x', y: c.y + at, x0: c.x + a0, x1: c.x + a0 + len, z: fz0 + 2.0, line: ln.l, more: 1 }
      );
    }
    if (left <= 0.25) break;
  }
  if (!extra.length) return;
  // frames: neighbouring bars exactly 12 in apart that overlap by 0.6 ft or more share side rails
  let fr = null;
  for (const b of extra) {
    const a0 = b.ax === 'x' ? b.x0 : b.y0,
      a1 = b.ax === 'x' ? b.x1 : b.y1;
    if (fr && b.line - fr.lastLine === gap && Math.min(fr.a1, a1) - Math.max(fr.a0, a0) >= 0.6) {
      fr.bars.push(b);
      fr.a0 = Math.max(fr.a0, a0);
      fr.a1 = Math.min(fr.a1, a1);
    } else {
      fr = { ax: P.ax, bars: [b], a0, a1 };
      k.roostFrames.push(fr);
    }
    fr.lastLine = b.line;
  }
  for (const b of extra) {
    k.perches.push(b);
    if (b.ax === 'x')
      for (const lx of [b.x0, b.x1 - 0.17]) k.legs.push({ x: lx, y: b.y - 0.085, w: 0.17, d: 0.17, top: b.z, kind: 'perch', more: 1 });
    else for (const ly of [b.y0, b.y1 - 0.17]) k.legs.push({ x: b.x - 0.085, y: ly, w: 0.17, d: 0.17, top: b.z, kind: 'perch', more: 1 });
  }
  k.perchDrawnFt = k.perches.reduce((t, b) => t + barLen(b), 0);
  k.roostN = k.roostFrames.length;
}
// ---------- feeder and waterer fill levels (visual only) ----------
// Each feeder and waterer is drawn filled at the morning chore (sunrise) with the pen's modelled feed and
// water for the day, shared evenly between the feeders, and it drains as the animals eat. The level shows
// the share of today's modelled intake still to be eaten at the hour shown. The model gives only daily
// totals, so the timing within the day is an illustration: hens eat in daylight; rabbits eat at any hour
// but much more in the dark (FAO, The Rabbit, ch. 4), drawn here as twice the rate of a daylight hour;
// chicks under the lamp eat around the clock. When a day's ration is eaten the feeder shows empty until
// the next morning's chore.
function penRation(c) {
  const K = WV.K[c.id];
  if (!K) return { feed: 0, water: 0, n: 0 };
  if (K.ration && K.rationOf === WV.vis) return K.ration;
  let feed = 0,
    water = 0,
    n = 0;
  for (const a of S.animals)
    if (a.enc === c.id) {
      const v = WV.vis && WV.vis.get(a.id);
      if (v && v.it) {
        feed += v.it.feed || 0;
        water += v.it.water || 0;
        n++;
      }
    }
  K.ration = { feed, water, n };
  K.rationOf = WV.vis;
  return K.ration;
}
// Share of the day's ration eaten by this hour: hens eat through the daylight hours, rabbits eat twice as fast
// at night as by day, chicks evenly round the clock. Picture only.
function eatenShare(kind, hour, rise, set) {
  const D = Math.max(0.5, set - rise),
    t = (((hour - rise) % 24) + 24) % 24;
  if (kind === 'hen') return Math.min(1, t / D);
  if (kind === 'rabbit') {
    const W = D + 2 * (24 - D);
    return (Math.min(t, D) + 2 * Math.max(0, t - D)) / W;
  }
  return t / 24;
}
// share of today's ration left in this pen's feeders and waterers at the hour shown (1 = just filled)
function fillLeft(c) {
  const s = WV.sun || sunInfo(),
    r = penRation(c),
    kind = c.type === 'hutch' ? 'rabbit' : c.type === 'coop' ? 'hen' : 'chick';
  const left = r.n ? 1 - eatenShare(kind, WV.hour, s.rise, s.set) : 1;
  const K = WV.K[c.id];
  if (K) {
    K.fillLeft = left;
    K.fillKind = kind;
  }
  return left;
}
// The door point on the shared wall of building a and an attached building b (the middle of the wall they
// share).
function doorBetween(a, b) {
  const ox0 = Math.max(a.x, b.x),
    ox1 = Math.min(a.x + a.w, b.x + b.w),
    oy0 = Math.max(a.y, b.y),
    oy1 = Math.min(a.y + a.d, b.y + b.d);
  if (ox1 - ox0 >= oy1 - oy0) return [(ox0 + ox1) / 2, b.y >= a.y + a.d - 1.01 ? a.y + a.d : a.y];
  return [b.x >= a.x + a.w - 1.01 ? a.x + a.w : a.x, (oy0 + oy1) / 2];
}
// Works out each animal's visual state for today from the model (WV.vis): its pen's microclimate, feed and
// water intake, and the heat and cold limits that change its pose.
function buildVis() {
  const env = envNow(),
    amb = { tmax: env.tmax, tmin: env.tmin, light: env.day, shade: 0, cool: 0, heated: false };
  WV.vis = new Map();
  for (const a of S.animals) {
    const m = a.enc && S.today.M && S.today.M[a.enc] ? S.today.M[a.enc] : amb;
    const v = { m, it: intake(a, m) };
    if (a.sp === 'chicken' && a.st === 'chick') {
      const pen = a.enc && compById(a.enc);
      v.need = chickNeed(a.age);
      v.t = pen && pen.type === 'brooder' ? brooderTemp(pen, m, v.need) : m.tmin;
      v.cold = v.t < v.need - 3;
    }
    v.heat = m.tmax > (a.sp === 'rabbit' ? P.rb_heat : P.ck_heat);
    v.coldS = m.tmin < P.hl_cold_lim;
    v.thr = a.sp === 'rabbit' ? P.rb_heat : P.ck_heat;
    WV.vis.set(a.id, v);
  }
}
// The pen's temperature at the hour shown. Daily stress (v.heat, v.coldS) is the model's; the
// posture at this hour (panting, flopping out, fluffing up) follows the hourly curve.
function hourTemp(m) {
  return tempAtHour(m.tmin, m.tmax, WV.hour, riseOf(envNow().day));
}
// True when the animal's pen is above its heat limit at the hour shown.
function hotNow(v) {
  return !!(v && v.heat && hourTemp(v.m) > v.thr);
}
// True when the animal feels the cold (cold limit setting) at the hour shown.
function coldNow(v) {
  return !!(v && v.coldS && hourTemp(v.m) < P.hl_cold_lim);
}
// Works out the farmer's chore route: each occupied building with its approach point, the feed and water
// stores, and the day's chore time from labor().
function buildRoute() {
  const feed = pens('feed')[0],
    water = pens('water')[0],
    stops = [];
  for (const c of S.comps) {
    if (!['hutch', 'coop', 'brooder', 'incubator'].includes(c.type)) continue;
    if (
      !S.animals.some(a => a.enc === c.id) &&
      !(c.type === 'incubator' && S.eggsInc.some(e => e.inc === c.id))
    )
      continue;
    const p = ctr(c);
    stops.push({ c, p, df: feed ? dist(p, ctr(feed)) : 60, dw: water ? dist(p, ctr(water)) : 60 });
  }
  const nodes = [];
  for (const s of stops) {
    nodes.push({ c: s.c, kind: 'pen' });
    if (feed) {
      nodes.push({ c: feed, kind: 'feed' });
      nodes.push({ c: s.c, kind: 'pen' });
    }
    if (water) {
      nodes.push({ c: water, kind: 'water' });
      nodes.push({ c: s.c, kind: 'pen' });
    }
  }
  WV.route = { stops, feed, water, nodes, lab: labor() };
  if (!WV.farmer)
    WV.farmer = {
      x: feed ? feed.x + feed.w / 2 : 4,
      y: feed ? feed.y + feed.d + 0.8 : 4,
      i: 0,
      wait: 0,
      carry: null,
      ph: 0,
      face: 1
    };
  if (WV.farmer.i >= nodes.length) WV.farmer.i = 0;
}
// The point just outside building c (front or side, whichever is nearer to x, y) where the farmer stands to do
// its chores.
function approach(c, x, y) {
  const a = [c.x + c.w / 2, c.y + c.d + 0.9],
    b = [c.x + c.w + 0.9, c.y + c.d / 2];
  if (TYPES[c.type].round) return [c.x + 1.8, c.y + 1.8];
  return Math.hypot(a[0] - x, a[1] - y) < Math.hypot(b[0] - x, b[1] - y) ? a : b;
}
// phase 33: the brooder's feeders and waterers, sized from the chicks inside it (drawing only; the
// model's feed and water do not depend on it). MU Extension G8351 (Small Flock Series: Brooding and
// Growing Chicks) gives, per 100 chicks: feeder space 0-4 wk 12 linear ft ("or two 3-foot feeders",
// so both sides of a trough count), 4-8 wk 20 ft, 8-12 wk 30 ft, 12 wk+ 40 ft; waterers 0-1 wk six
// 1-quart jars, 1-4 wk two 2-gallon, 4 wk+ two 5-gallon. Choices: each chick counts in the band of
// its own age, waterer counts round up, troughs are at least 1 ft long, and troughs and waterers stand
// along the two short walls with a chick's room (0.3 ft) round them; what does not fit is left off
// the picture and the card says so.
const BROOD_FEED = [
  [28, 0.12],
  [56, 0.2],
  [84, 0.3],
  [1e9, 0.4]
];
// BROOD_FEED rows: [age below (days), ft of trough per chick]. BROOD_WAT rows: chicks younger than upTo days, per =
// waterers per chick (MU), r = drawn radius (ft), H = drawn height (ft), name = the size shown on the card.
const BROOD_WAT = [
  { upTo: 7, per: 0.06, r: 0.24, H: 0.42, name: '1-quart jar' },
  { upTo: 28, per: 0.02, r: 0.4, H: 0.75, name: '2-gallon' },
  { upTo: 1e9, per: 0.02, r: 0.55, H: 1.0, name: '5-gallon' }
];
// Sizes the brooder's troughs and waterers from the chicks in it (Missouri Extension G8351, tables above) and
// places them (phase 33, crowded layout phase 36 in broodPack).
function broodGear(c, k, ch) {
  let lin = 0;
  const nb = [0, 0, 0];
  for (const a of ch) {
    lin += BROOD_FEED.find(b => a.age < b[0])[1];
    nb[BROOD_WAT.findIndex(b => a.age < b.upTo)]++;
  }
  // waterers: MU's units per chick of each age band, added up (e.g. 6 quart jars per 100 chicks in
  // their first week is 0.06 jar per chick); quart jars for the chicks under a week, and for the rest
  // the 2-gallon or 5-gallon size of whichever band needs more. One chick-size trough and one quart
  // jar stand ready in an empty brooder.
  const fw = [],
    f1 = nb[1] * BROOD_WAT[1].per,
    f2 = nb[2] * BROOD_WAT[2].per,
    big = f2 >= f1 ? BROOD_WAT[2] : BROOD_WAT[1];
  for (let j = 0; j < Math.ceil(f1 + f2 - 1e-9); j++) fw.push(big);
  for (let j = 0; j < Math.ceil(nb[0] * BROOD_WAT[0].per - 1e-9); j++) fw.push(BROOD_WAT[0]);
  if (!fw.length) fw.push(BROOD_WAT[0]);
  // the rows run along the two short walls, the walls farthest from the lamp in the middle that the
  // chicks huddle under: troughs along one, waterers along the other, each spilling into the other
  // row when its own is full, so the layout stays put from day to day
  const m = 0.3,
    gap = 0.4,
    along = c.w >= c.d ? 'y' : 'x',
    rowLen = Math.max(0.5, (along === 'y' ? c.d : c.w) - 2 * m),
    tl = Math.max(1, lin / 2),
    pieces = Math.max(1, Math.ceil(tl / rowLen - 1e-9)),
    items = [];
  for (let i = 0; i < pieces; i++) items.push({ t: 1, w: tl / pieces, d: 0.35 });
  for (const b of fw) items.push({ t: 0, w: 2 * b.r, d: 2 * b.r, b });
  const rows = [
      { used: 0, it: [] },
      { used: 0, it: [] }
    ],
    cut = [];
  items.sort((p, q) => q.t - p.t || q.w - p.w);
  const fit = (r, it) => {
    const add = (r.it.length ? gap : 0) + it.w;
    if (r.used + add > rowLen + 1e-9) return false;
    r.used += add;
    r.it.push(it);
    return true;
  };
  for (const it of items) {
    const own = it.t ? 0 : 1;
    if (!fit(rows[own], it) && !fit(rows[1 - own], it)) cut.push(it);
  }
  k.btr = [];
  k.bfo = [];
  // phase 36: when the two short walls cannot hold it all (a crowded brooder), go round all four walls
  if (cut.length) return broodPack(c, k, ch, fw, tl, lin, along);
  // in each row the waterers go to its ends (the corners), alternately, and troughs are centred
  // between them; u runs along the row, v across it from the wall
  const lo = along === 'y' ? c.y : c.x,
    hi = along === 'y' ? c.y + c.d : c.x + c.w;
  rows.forEach((r, ri) => {
    const W = r.it.filter(it => !it.t),
      T = r.it.filter(it => it.t),
      vOf = it => (along === 'y' ? (ri === 0 ? c.x + m : c.x + c.w - m - it.d) : ri === 0 ? c.y + c.d - m - it.d : c.y + m),
      put = (it, u) => {
        const v = vOf(it);
        if (it.t) k.btr.push(along === 'y' ? { x: v, y: u, w: it.d, d: it.w } : { x: u, y: v, w: it.w, d: it.d });
        else {
          const cu = u + it.w / 2,
            cv = v + it.d / 2;
          k.bfo.push({ x: along === 'y' ? cv : cu, y: along === 'y' ? cu : cv, r: it.b.r, H: it.b.H, name: it.b.name });
        }
      };
    let ul = lo + m,
      ur = hi - m;
    W.forEach((it, i) => {
      if (i % 2 === 0) put(it, ul), (ul += it.w + gap);
      else (ur -= it.w), put(it, ur), (ur -= gap);
    });
    const tw = T.reduce((s2, it) => s2 + it.w, 0) + gap * Math.max(0, T.length - 1);
    let u = (ul + ur) / 2 - tw / 2;
    for (const it of T) put(it, u), (u += it.w + gap);
  });
  const cutIn = cut.filter(it => it.t).reduce((s, it) => s + it.w * 24, 0);
  k.gear = {
    n: ch.length,
    needIn: lin * 12,
    drawnIn: k.btr.reduce((s, t) => s + Math.max(t.w, t.d) * 24, 0),
    cutIn,
    cutW: cut.filter(it => !it.t).map(it => it.b.name),
    founts: k.bfo.map(f => f.name)
  };
  broodEnds(c, k);
}
// phase 36: a crowded brooder (more troughs and waterers than its two short walls hold). The troughs
// and waterers go round all four walls instead, against the wall with a chick's room (0.3 ft) and
// 0.4 ft between them as before, water first: the biggest waterer, then the first trough, then the
// other waterers (corners first), then the rest of the trough length in pieces of at least 0.5 ft
// wherever a stretch of wall is free. None may reach into the lamp spot: MU Extension G8351 gives
// each chick about 6 or 7 square inches of space under the brooder, so a circle of 7 sq in per chick
// is kept clear under the lamp (and MU warns against splashing water on the lamp). What still does
// not fit is left off the picture and the card says so. Order, piece length and wall order are
// choices (illustration); the model's feed, water and crowding do not depend on any of it.
function broodPack(c, k, ch, fw, tl, lin, along) {
  const m = 0.3,
    gap = 0.4,
    st = 0.05,
    minL = 0.5,
    lx = k.lamp ? k.lamp[0] : c.x + c.w / 2,
    ly = k.lamp ? k.lamp[1] : c.y + c.d / 2,
    lampIn = ch.length * 7,
    R = Math.sqrt(lampIn / 144 / Math.PI),
    P = [];
  // walls: A (troughs) and B (waterers) are the short walls used before, then the two long walls
  const wall = (ax, side) => {
    const lo = ax === 'y' ? c.y : c.x,
      hi = ax === 'y' ? c.y + c.d : c.x + c.w;
    return {
      lo: lo + m,
      hi: hi - m,
      rect: (u, len, dep) =>
        ax === 'y'
          ? { x: side ? c.x + c.w - m - dep : c.x + m, y: u, w: dep, d: len }
          : { x: u, y: side ? c.y + c.d - m - dep : c.y + m, w: len, d: dep }
    };
  };
  const A = along === 'y' ? wall('y', 0) : wall('x', 1),
    B = along === 'y' ? wall('y', 1) : wall('x', 0),
    L1 = along === 'y' ? wall('x', 0) : wall('y', 0),
    L2 = along === 'y' ? wall('x', 1) : wall('y', 1);
  const ok = (r, noLamp) => {
    if (r.x < c.x + m - 1e-9 || r.y < c.y + m - 1e-9 || r.x + r.w > c.x + c.w - m + 1e-9 || r.y + r.d > c.y + c.d - m + 1e-9) return false;
    const dx = Math.max(r.x - lx, 0, lx - r.x - r.w),
      dy = Math.max(r.y - ly, 0, ly - r.y - r.d);
    if (!noLamp && Math.hypot(dx, dy) < R - 1e-9) return false;
    for (const q of P)
      if (r.x < q.x + q.w + gap - 1e-9 && q.x < r.x + r.w + gap - 1e-9 && r.y < q.y + q.d + gap - 1e-9 && q.y < r.y + r.d + gap - 1e-9)
        return false;
    return true;
  };
  // a waterer: the free spot on the first wall that has one, nearest a corner first
  const putW = (b, walls, noLamp) => {
    const s = 2 * b.r;
    for (const W of walls) {
      const us = [];
      for (let u = W.lo; u + s <= W.hi + 1e-9; u += st) us.push(u);
      us.sort((p, q) => Math.min(p - W.lo, W.hi - s - p) - Math.min(q - W.lo, W.hi - s - q));
      for (const u of us) {
        const r = W.rect(u, s, s);
        if (ok(r, noLamp)) {
          P.push(r);
          k.bfo.push({ x: r.x + b.r, y: r.y + b.r, r: b.r, H: b.H, name: b.name });
          return true;
        }
      }
    }
    return false;
  };
  // trough pieces: along each wall in turn, the longest free stretch from each free start, up to the
  // length still wanted
  let rem = tl;
  const putT = (walls, once, noLamp) => {
    for (const W of walls) {
      // no piece shorter than its own depth (0.35 ft): a leftover that short is left off ('no room')
      for (let u = W.lo; u + Math.min(minL, rem) <= W.hi + 1e-9 && rem >= 0.35 - 1e-9; u += st) {
        const l0 = Math.min(minL, rem);
        if (!ok(W.rect(u, l0, 0.35), noLamp)) continue;
        let len = l0;
        while (len + st <= rem + 1e-9 && ok(W.rect(u, len + st, 0.35), noLamp)) len += st;
        if (rem - len < st) len = rem;
        const r = W.rect(u, len, 0.35);
        if (!ok(r, noLamp)) continue;
        P.push(r);
        r.len = len;
        k.btr.push(r);
        rem -= len;
        u += len;
        if (once) return;
      }
    }
  };
  const ws = fw.slice().sort((p, q) => q.r - p.r),
    cutW = [];
  // the chicks always get one waterer and one trough: if the lamp spot leaves no room for them, they
  // stand in a corner anyway (lampHit)
  let lampHit = 0;
  if (!putW(ws[0], [B, A, L1, L2])) {
    if (putW(ws[0], [B, A, L1, L2], true)) lampHit++;
    else cutW.push(ws[0]);
  }
  const t1 = k.btr.length;
  putT([A, L1, L2, B], true);
  if (k.btr.length === t1) {
    putT([A, L1, L2, B], true, true);
    if (k.btr.length > t1) lampHit++;
  }
  for (const b of ws.slice(1)) if (!putW(b, [B, A, L1, L2])) cutW.push(b);
  putT([A, L1, L2, B], false);
  k.gear = {
    n: ch.length,
    needIn: lin * 12,
    drawnIn: k.btr.reduce((s, t) => s + t.len * 24, 0),
    cutIn: Math.max(0, rem) * 24,
    cutW: cutW.map(b => b.name),
    founts: k.bfo.map(f => f.name),
    packed: 1,
    lampIn,
    lampR: R,
    lampHit
  };
  broodEnds(c, k);
}
// Sets the brooder's feeder and water points (the first trough and waterer), used where older code wants one
// of each.
function broodEnds(c, k) {
  // the first trough and waterer stand for the old single feeder and drinker
  const t0 = k.btr[0],
    f0 = k.bfo[0];
  k.feeder = t0 ? [t0.x + t0.w / 2, t0.y + t0.d / 2] : [c.x + 0.5, c.y + c.d - 0.5];
  k.water = f0 ? [f0.x, f0.y] : [c.x + c.w - 0.5, c.y + c.d - 0.5];
}


// Original upstream file: source/src/world/agents.js (blob 196433487d8fff01dba492b015043d58fd72db6b)
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


// Original upstream file: source/src/world/physics.js (blob 69170e9be24ba97004d281cbce7cca3fe02e6f80)
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


// Original upstream file: source/src/world/sync.js (blob 5bd867f1775791710005dfcc133e7f03fc913e5b)
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

/* END original native farm visual source. */

/* Homestead-only adapter. Visual world state is separate from the biological RNG
 * and must never write to S, P, ledgers or model results.
 * Source: farm-sim/source/src/world/{base,cages,context,agents,physics,sync}.js
 */
const nativeVisual=(function(){
  let booted=false;
  function setHour(hour){
    if(!Number.isFinite(hour)||hour<0||hour>=24)throw new RangeError("Native Farm hour must be in [0,24)");
    WV.hour=hour;
    CLOCK.frac=hour/24;
    WV.sun=sunInfo();
  }
  function init(seed=20261104,hour=9){
    if(!Number.isSafeInteger(seed))throw new TypeError("Native visual seed must be an integer");
    vSeed=(seed>>>0)||20261104;
    WV.ctx={}; // non-drawing sentinel: original worldSync checks canvas readiness
    WV.agents.clear();
    WV.fx=[];WV.fly=[];WV.air=[];WV.nest={};WV.queue=[];
    WV.vis=new Map();WV.pos={};WV.K={};WV.route=null;WV.farmer=null;
    WV.lastS=null;WV.lastDay=-1;WV.lastToday=null;WV.layoutKey="";
    WV.t=0;WV.agg={};WV.aggT=0;WV.live=true;
    CLOCK.running=false;CLOCK.speed=4;CLOCK.owed=0;
    PHYS.acc=0;PHYS.steps=0;PHYS.wallHits=0;PHYS.pairHits=0;
    PHYS.hops=0;PHYS.jumps=0;PHYS.shifts=0;PHYS.giveUps=0;
    setHour(hour);
    booted=true;
    worldSync();
    return stats();
  }
  function sync(hour=9){
    if(!booted)init(20261104,hour);
    setHour(hour);
    worldSync();
    return WV;
  }
  function frame(dt,playing,hour=9){
    if(!Number.isFinite(dt)||dt<0)throw new RangeError("Invalid native Farm frame seconds");
    sync(hour);
    CLOCK.running=Boolean(playing);
    if(!playing||dt===0)return stats();
    // Match original world/loop.js frame caps, event queue and 90-agent display cap.
    const step=Math.min(0.1,dt);
    WV.t+=step;
    const q=WV.queue;
    for(let i=q.length-1;i>=0;i--){
      if(q[i].t<=WV.t||!WV.live){const e=q.splice(i,1)[0];e.fn();}
    }
    const cnt={};
    for(const g of WV.agents.values()){
      if(g.hidden||g.leaving){g.off=false;continue;}
      const z=g.zone||"_";
      cnt[z]=(cnt[z]||0)+1;
      g.off=cnt[z]>90;
    }
    physFrame(step); // original 1/60-second physics and original updAgent/think
    updFarmer(step);
    return stats();
  }
  function stats(){
    return {initialized:booted,agentCount:WV.agents.size,day:WV.lastDay,
      visualSteps:PHYS.steps,wallHits:PHYS.wallHits,pairHits:PHYS.pairHits,
      hops:PHYS.hops,jumps:PHYS.jumps,visualOnly:true};
  }
  return Object.freeze({init,sync,frame,world:()=>WV,stats});
})();

return Object.freeze({reset,advanceDay,snapshot,setParameter,nativeVisual});
})();
