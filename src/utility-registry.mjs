// Explicit, versioned utility capability registry for the unified application.
// This describes available executable integrations, not all upstream features.
export const UTILITY_REGISTRY_SCHEMA=1;
const nonBlankString=value=>typeof value==="string"&&value.trim().length>0;
const capabilities=[
  {
    id:"cross-domain.resource-ledger.csv",version:1,kind:"inspection-export",
    implementation:"src/native-ledger.mjs",entrypoint:"nativeLedgerCsv",
    ui:"ledgerCsvBtn",model:"experimental-coupled-scenario",snapshotSchema:1,
    sources:Object.freeze([
      Object.freeze({domain:"solar",interface:"coordinator.cumulative.pvWh",unit:"Wh",fidelity:"experimental-assumption-adjusted"}),
      Object.freeze({domain:"water",interface:"coordinator.cumulative.treatedL",unit:"L",fidelity:"original-hydraulic-solver-coupled"}),
      Object.freeze({domain:"farm",interface:"coordinator.farm.counts.n",unit:"count",fidelity:"original-biological-snapshot"})
    ]),
    mutatesModel:false,advancesClock:false,tests:"tests/native-ledger.test.mjs",
    limitations:"One cumulative snapshot, not a time series; no original Solar dispatcher or biological shortage feedback"
  }
];
export const UTILITY_CAPABILITIES=Object.freeze(capabilities.map(c=>Object.freeze(c)));
export function utilityCapability(id){
  if(typeof id!=="string")throw new TypeError("Capability id must be a string");
  return UTILITY_CAPABILITIES.find(c=>c.id===id)??null;
}
export function assertUtilityRegistry(registry=UTILITY_CAPABILITIES){
  if(!Array.isArray(registry))throw new TypeError("Registry must be an array");
  const seen=new Set();
  for(const c of registry){
    if(!c||typeof c.id!=="string"||!/^[-a-z0-9.]+$/.test(c.id)||seen.has(c.id))
      throw new TypeError("Duplicate or invalid capability id");
    seen.add(c.id);
    if(!Number.isSafeInteger(c.version)||c.version<1||
       ![c.kind,c.implementation,c.entrypoint,c.ui,c.tests,c.limitations].every(nonBlankString)||
       c.model!=="experimental-coupled-scenario"||c.snapshotSchema!==1||c.mutatesModel!==false||
       c.advancesClock!==false||!Array.isArray(c.sources)||c.sources.length===0)
      throw new TypeError("Incomplete capability contract: "+c.id);
    const domains=new Set();
    for(const s of c.sources){
      if(!s||typeof s!=="object"||Array.isArray(s)||
         !["solar","water","farm"].includes(s.domain)||!nonBlankString(s.interface)||
         !["Wh","L","count"].includes(s.unit)||!nonBlankString(s.fidelity))
        throw new TypeError("Invalid source contract: "+c.id);
      if(domains.has(s.domain))throw new TypeError("Duplicate source domain: "+c.id);
      domains.add(s.domain);
    }
  }
  return true;
}
