'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/coordinator.js'),'utf8');

function setup(mode){
  const water={produced:0,parts:[{type:'pump_sky',params:{psi:0}}]};
  const context={
    SolarNextCore:{shadowPv:()=>({status:'estimated',controllerMaximumEnvelopeW:0})},
    HomesteadFarmCore:{
      reset(){},advanceDay(){},
      snapshot(){return {date:'2026-11-08',daily:{kWh:0,waterGal:0},counts:{}};}
    },
    HomesteadWaterCore:{
      buildPreset:()=>water,
      step(state,dt){
        if(mode==='nan-production')state.produced=NaN;
        if(mode==='infinity-production')state.produced=Infinity;
        if(mode==='decrease-production')state.produced=-1;
        if(mode==='null-result')return null;
        return {dt};
      }
    }
  };
  context.globalThis=context;
  vm.runInNewContext(source,context,{filename:'coordinator.js'});
  return new context.HomesteadCoordinator.Coordinator({pumpElectricalW:0});
}

for(const mode of ['nan-production','infinity-production','decrease-production','null-result']){
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
