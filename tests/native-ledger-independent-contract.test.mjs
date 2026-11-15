// Independent black-box CSV serialization contract for the native cross-domain ledger.
// Does not modify or mock authoritative Solar, Water, or Farm engines.
import test from "node:test";
import assert from "node:assert/strict";
import {LEDGER_COLUMNS,nativeLedgerRow,nativeLedgerCsv} from "../src/native-ledger.mjs";

function fixture(){
 return {model:"experimental-coupled-scenario",schema:1,
  clock:{date:"2024-02-29",hours:48},batteryWh:4000.5,waterStoredL:27.125,
  farm:{counts:{n:9}},
  cumulative:{pvWh:8100.25,baseWh:5100,pumpWh:700.5,energyDeficitWh:0,
   treatedL:92.25,waterConsumedL:55.125,overflowL:10,waterDeficitL:0}};
}
function parseStrictQuotedCsv(csv){
 assert.match(csv,/\r\n$/,"CSV must end in CRLF");
 assert.equal(csv.replace(/\r\n/g,"").includes("\n"),false,"no bare LF");
 const rows=csv.slice(0,-2).split("\r\n");
 assert.equal(rows.length,2,"exactly header and one data record");
 return rows.map(row=>{
  assert.match(row,/^"(?:[^"]|"")*"(?:,"(?:[^"]|"")*")*$/);
  return row.slice(1,-1).split('","').map(value=>value.replace(/""/g,'"'));
 });
}
test("CSV header is a stable ordered engineering interface with explicit physical units",()=>{
 const s=fixture(),[header,data]=parseStrictQuotedCsv(nativeLedgerCsv(s));
 assert.deepEqual(header,LEDGER_COLUMNS);
 assert.equal(new Set(header).size,header.length);
 assert.equal(header.length,15);
 assert.deepEqual(data,[
  "experimental-coupled-scenario","1","2024-02-29","48","8100.25","5100",
  "700.5","4000.5","0","92.25","55.125","10","27.125","0","9"
 ]);
 assert.equal(LEDGER_COLUMNS[4],"pv_generated_Wh");
 assert.equal(LEDGER_COLUMNS[9],"water_treated_L");
 assert.equal(LEDGER_COLUMNS[14],"farm_animals");
});
test("read-only export is deterministic across repeated calls and frozen nested snapshots",()=>{
 const s=fixture(),before=JSON.stringify(s);
 Object.freeze(s.clock);Object.freeze(s.cumulative);Object.freeze(s.farm.counts);
 Object.freeze(s.farm);Object.freeze(s);
 const csv=nativeLedgerCsv(s);
 for(let i=0;i<12;i++){
  assert.equal(nativeLedgerCsv(s),csv);
  assert.deepEqual(nativeLedgerRow(s).map(String),parseStrictQuotedCsv(csv)[1]);
 }
 assert.equal(JSON.stringify(s),before);
});
test("zero-resource scenario remains valid and serializes exact zero quantities",()=>{
 const s=fixture();s.clock.hours=0;s.farm.counts.n=0;s.batteryWh=0;s.waterStoredL=0;
 for(const key of Object.keys(s.cumulative))s.cumulative[key]=0;
 const [,data]=parseStrictQuotedCsv(nativeLedgerCsv(s));
 assert.deepEqual(data.slice(3),Array(12).fill("0"));
});
test("non-finite, negative, absent and incorrectly typed ledger quantities fail closed",()=>{
 const base=fixture();
 const paths=[
  ["clock","hours"],["cumulative","pvWh"],["cumulative","baseWh"],
  ["cumulative","pumpWh"],["batteryWh"],["cumulative","energyDeficitWh"],
  ["cumulative","treatedL"],["cumulative","waterConsumedL"],
  ["cumulative","overflowL"],["waterStoredL"],["cumulative","waterDeficitL"],
  ["farm","counts","n"]
 ];
 for(const path of paths){
  for(const bad of [undefined,null,"0",NaN,Infinity,-Infinity,-1,{},[]]){
   const s=structuredClone(base);
   let node=s;
   for(const segment of path.slice(0,-1))node=node[segment];
   node[path.at(-1)]=bad;
   assert.throws(()=>nativeLedgerCsv(s),TypeError,`path ${path.join(".")} rejected ${String(bad)}`);
  }
 }
});
test("calendar validation covers leap boundaries and rejects invalid dates",()=>{
 for(const date of ["0001-01-01","0099-12-31","2000-02-29","2024-02-29","9999-12-31"]){
  const s=fixture();s.clock.date=date;
  assert.equal(parseStrictQuotedCsv(nativeLedgerCsv(s))[1][2],date);
 }
 for(const date of ["0000-01-01","2023-02-29","1900-02-29","2024-04-31",
  "2024-13-01","2024-00-01","2024-01-00","2024-01-32","2024-2-09",
  "2024-02-29T00:00:00Z","2024-02-29\n",null,undefined,20240229]){
  const s=fixture();s.clock.date=date;
  assert.throws(()=>nativeLedgerCsv(s),/Invalid scenario date/);
 }
});
test("unsupported snapshot schemas and model identities cannot be exported",()=>{
 for(const changes of [{schema:2},{schema:0},{model:"solar"},{model:null}]){
  assert.throws(()=>nativeLedgerCsv({...fixture(),...changes}),/Unsupported scenario snapshot/);
 }
 for(const s of [null,undefined,{},[]]){
  assert.throws(()=>nativeLedgerCsv(s),/Unsupported scenario snapshot/);
 }
});
