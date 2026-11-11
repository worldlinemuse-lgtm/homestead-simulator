'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/coordinator.js'),'utf8');

function setup(mode){
  let steps=0;
  const water={produced:0,parts:[{type:'pump_sky',params:{psi:0}}]};
  const context={
    SolarNextCore:{shadowPv:()=>({status:'estimated',controllerMaximumEnvelopeW:0})},
    HomesteadFarmCore:{
      reset(){},advanceDay(){},
      snapshot(){return {date:'2026-11-08',daily:{kWh:0,waterGal:0},counts:{}};}
    },
    HomesteadWaterCore:{
      buildPreset:()=>water,
      cloneWorld:state=>JSON.parse(JSON.stringify(state)),
      step(state,dt){
        steps++;
        if(mode==='late-decrease-production')state.produced=steps===1?2:1;
        if(mode==='late-nan-production' && steps===2)state.produced=NaN;
        if(mode==='finite-production')state.produced++;
        if(mode==='nan-production')state.produced=NaN;
        if(mode==='infinity-production')state.produced=Infinity;
        if(mode==='decrease-production')state.produced=-1;
        if(mode==='null-result')return null;
        if(mode==='nan-timestep')return {dt:NaN};
        if(mode==='zero-timestep')return {dt:0};
        if(mode==='oversized-timestep')return {dt:dt+1};
        if(mode==='infinite-timestep')return {dt:Infinity};
        return {dt};
      }
    }
  };
  context.globalThis=context;
  vm.runInNewContext(source,context,{filename:'coordinator.js'});
  return new context.HomesteadCoordinator.Coordinator({pumpElectricalW:0});
}

for(const mode of ['nan-production','infinity-production','decrease-production','null-result','nan-timestep','zero-timestep','oversized-timestep','infinite-timestep','late-decrease-production','late-nan-production']){
  test('water solver rejects '+mode,()=>{
    const sim=setup(mode);
    assert.throws(()=>sim.stepHour(),/Water solver returned/);
  });
}
test('finite stationary hydraulic solver completes with zero production',()=>{
  const sim=setup('valid');
  const result=sim.stepHour();
  assert.equal(result.last.water.treatedL,0);
  assert.equal(result.last.water.waterResidual,0);
});

test('solver failure after an earlier successful substep leaves the scenario unchanged',()=>{
  for(const mode of ['late-decrease-production','late-nan-production','nan-timestep','null-result']){
    const sim=setup(mode);
    const beforeSnapshot=sim.snapshot();
    const beforeWater=JSON.stringify(sim.water);
    const beforeBattery=sim.batteryWh;
    assert.throws(()=>sim.stepHour(),/Water solver returned/);
    assert.equal(sim.snapshot().clock.hours,0,'a failed hour must not advance time');
    assert.equal(sim.batteryWh,beforeBattery,'failed water must not consume battery inventory');
    assert.equal(JSON.stringify(sim.water),beforeWater,'failed water must not mutate hydraulic model');
    assert.deepEqual(sim.snapshot(),beforeSnapshot,'failed hour must not record partial ledgers');
  }
});
test('valid hydraulic production commits model, tank inventory and clock once',()=>{
  const sim=setup('finite-production');
  const previousWater=sim.water;
  const snapshot=sim.stepHour();
  assert.equal(snapshot.clock.hours,1);
  assert.equal(snapshot.last.water.treatedL,12);
  assert.equal(snapshot.waterStoredL,72);
  assert.equal(sim.water.produced,12);
  assert.notEqual(sim.water,previousWater,'successful step commits a distinct working model');
  assert.equal(previousWater.produced,0,'previous model snapshot remains unchanged');
  assert.equal(snapshot.last.water.waterResidual,0);
});
