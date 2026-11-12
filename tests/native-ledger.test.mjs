import test from "node:test";
import assert from "node:assert/strict";
import {LEDGER_COLUMNS,nativeLedgerRow,nativeLedgerCsv} from "../src/native-ledger.mjs";
const snapshot=()=>({schema:1,model:"experimental-coupled-scenario",
 clock:{date:"2026-11-12",hours:24},batteryWh:4000,waterStoredL:50,
 farm:{counts:{n:8}},cumulative:{pvWh:5000,baseWh:3000,pumpWh:200,
 energyDeficitWh:0,treatedL:60,waterConsumedL:40,overflowL:30,waterDeficitL:0}});
test("native ledger preserves source units and exact coordinator totals",()=>{
 const s=snapshot(),row=nativeLedgerRow(s);
 assert.equal(row.length,LEDGER_COLUMNS.length);
 assert.equal(row[LEDGER_COLUMNS.indexOf("pv_generated_Wh")],5000);
 assert.equal(row[LEDGER_COLUMNS.indexOf("water_treated_L")],60);
 assert.equal(row[LEDGER_COLUMNS.indexOf("farm_animals")],8);
 assert.match(nativeLedgerCsv(s),/^"model","schema"/);
 assert.equal(nativeLedgerCsv(s).trim().split("\r\n").length,2);
});
test("inspection never mutates the coordinator snapshot",()=>{
 const s=snapshot(),before=JSON.stringify(s);
 nativeLedgerCsv(s);assert.equal(JSON.stringify(s),before);
});
test("rejects non-finite, negative and unsupported results",()=>{
 for(const bad of [NaN,Infinity,-1]){
  const s=snapshot();s.cumulative.treatedL=bad;
  assert.throws(()=>nativeLedgerCsv(s),/treatedL/);
 }
 const s=snapshot();s.schema=2;assert.throws(()=>nativeLedgerCsv(s),/Unsupported/);
});
