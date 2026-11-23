import test from "node:test";
import assert from "node:assert/strict";
import {originalSolarMinuteForFarmDate,
  initializeOriginalSolarForFarm} from "../src/native-solar-calendar.mjs";

test("source Solar TMY matches Farm civil month/day and model local hour",()=>{
  assert.equal(originalSolarMinuteForFarmDate("2026-01-01",0),0);
  assert.equal(originalSolarMinuteForFarmDate("2026-11-01",0),304*1440);
  assert.equal(originalSolarMinuteForFarmDate("2026-11-04",9),307*1440+540);
  assert.equal(originalSolarMinuteForFarmDate("2028-03-01",9),
    (31+28)*1440+540); // 365-day TMY explicitly excludes leap February
  assert.equal(originalSolarMinuteForFarmDate("2026-12-31",23),365*1440-60);
  for(const date of ["2026-02-29","2028-02-29","2026-13-01","2026-02-31",
    "bogus","2026-11-00"]){
    assert.throws(()=>originalSolarMinuteForFarmDate(date,9),/calendar|valid/);
  }
  for(const hour of [-1,24,1.5,NaN]){
    assert.throws(()=>originalSolarMinuteForFarmDate("2026-11-04",hour),/hour/);
  }
});
test("only the original Solar source catalog configures 4 × LONGi 435W panels",()=>{
  const S={cfg:{panel:"r200",ser:3,par:2},t:400,stats:{mins:0,startT:400},
    day:{d:0,pv:0,load:0}};
  const sim={
    S,
    grabState(){return {t:S.t,stats:S.stats,day:S.day,WXID:"tmy"};},
    putState(s){S.t=s.t;S.stats=structuredClone(s.stats);S.day=structuredClone(s.day);},
    useMyLongi(){S.cfg={panel:"lg435",ser:2,par:2};}
  };
  const a=initializeOriginalSolarForFarm({sim,farmDate:"2026-11-04",startHour:9});
  assert.equal(a.minute,307*1440+540);
  assert.equal(sim.S.t,a.minute);
  assert.equal(sim.S.stats.startT,a.minute);
  assert.equal(sim.S.day.d,307);
  assert.equal(sim.S.cfg.panel,"lg435");
  assert.equal(a.panels,4);
  assert.equal(a.sourceWeather,"tmy");
});
test("source calendar refuses reused advanced state and preserves it on failure",()=>{
  const S={cfg:{panel:"r200",ser:3,par:2},t:500,stats:{mins:10,startT:500},day:{d:0}};
  const sim={
    S,grabState(){return {t:S.t,stats:structuredClone(S.stats),day:structuredClone(S.day),WXID:"tmy"};},
    putState(o){S.t=o.t;S.stats=structuredClone(o.stats);S.day=structuredClone(o.day);},
    useMyLongi(){S.cfg={...S.cfg,panel:"lg435",ser:2,par:2};}
  };
  assert.throws(()=>initializeOriginalSolarForFarm({sim,farmDate:"2026-11-04",startHour:9}),/previously advanced/);
  assert.equal(S.t,500);
  assert.equal(S.stats.mins,10);
});
