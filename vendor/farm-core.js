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
return Object.freeze({reset,advanceDay,snapshot,setParameter});
})();
