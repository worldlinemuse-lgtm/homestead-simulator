import test from "node:test";
import assert from "node:assert/strict";
import {nativeLedgerCsv} from "../src/native-ledger.mjs";

function snapshot(date){
  return {schema:1,model:"experimental-coupled-scenario",
    clock:{date,hours:0},batteryWh:0,waterStoredL:0,
    farm:{counts:{n:0}},cumulative:{pvWh:0,baseWh:0,pumpWh:0,
      energyDeficitWh:0,treatedL:0,waterConsumedL:0,overflowL:0,waterDeficitL:0}};
}

test("CSV export rejects syntactically valid but impossible Gregorian dates",()=>{
  for(const date of ["2026-02-29","2026-04-31","2026-13-01","2026-00-10",
    "2026-01-00","2026-11-31","0000-01-01","9999-12-32"]){
    assert.throws(()=>nativeLedgerCsv(snapshot(date)),/Invalid scenario date/,date);
  }
});
test("CSV export accepts leap days, year boundaries and years before 0100",()=>{
  for(const date of ["2024-02-29","2000-02-29","2026-12-31","2027-01-01",
    "0001-01-01","0099-12-31","9999-12-31"]){
    assert.match(nativeLedgerCsv(snapshot(date)),new RegExp(date),date);
  }
});
test("date validation is read-only and rejects malformed clock dates",()=>{
  for(const date of [null,undefined,20261112,"2026-1-1","2026-01-01T00:00:00Z"]){
    assert.throws(()=>nativeLedgerCsv(snapshot(date)),/Invalid scenario date/);
  }
  const s=snapshot("2024-02-29"),before=JSON.stringify(s);
  nativeLedgerCsv(s);assert.equal(JSON.stringify(s),before);
});
