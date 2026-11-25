import test from 'node:test';
import assert from 'node:assert/strict';
import {createOriginalWaterMinuteStep} from '../src/native-water-minute.mjs';

// A hydraulic protocol fixture isolates the adapter's power-state behavior.
// Source-solver numerical parity is checked by separate original-engine tests.
const core = {
  cloneWorld: world => structuredClone(world),
  step(world, seconds) {
    world.produced += world.parts[0].params.psi > 0 ? seconds / 60 : 0;
    return {dt:seconds};
  }
};
const initial = () => ({produced:0,parts:[{id:'pump-1',type:'pump_sky',params:{psi:50}}]});

test('a minute-long brownout cannot permanently erase the pump setting', () => {
  const step = createOriginalWaterMinuteStep(core,{pumpPressurePsi:50,pumpId:'pump-1'});
  const outage = step({minute:0,requestedWh:2,deliveredWh:0,state:initial()});
  assert.equal(outage.deliveredL,0);
  assert.equal(outage.native.pumpEnabled,false);
  assert.equal(outage.state.parts[0].params.psi,50);
  const restored = step({minute:1,requestedWh:2,deliveredWh:2,state:outage.state});
  assert.equal(restored.deliveredL,1);
  assert.equal(restored.native.pumpEnabled,true);
  assert.equal(restored.state.parts[0].params.psi,50);
  assert.equal(initial().parts[0].params.psi,50);
});

test('repeated unpowered minutes preserve the requested pressure without producing pumped water', () => {
  const step=createOriginalWaterMinuteStep(core,{pumpPressurePsi:50,pumpId:'pump-1'});
  let world=initial();
  for(let minute=0;minute<120;minute++){
    const result=step({minute,requestedWh:2,deliveredWh:0,state:world});
    assert.equal(result.deliveredL,0);
    assert.equal(result.state.parts[0].params.psi,50);
    world=result.state;
  }
  assert.equal(world.produced,0);
});

test('partial power cannot run the native pump and full restoration resumes output', () => {
  const step=createOriginalWaterMinuteStep(core,{pumpPressurePsi:35,pumpId:'pump-1'});
  const partial=step({minute:0,requestedWh:2,deliveredWh:1.99,state:initial()});
  assert.equal(partial.native.pumpEnabled,false);
  assert.equal(partial.deliveredL,0);
  assert.equal(partial.state.parts[0].params.psi,35);
  const recovered=step({minute:1,requestedWh:2,deliveredWh:2,state:partial.state});
  assert.equal(recovered.native.pumpEnabled,true);
  assert.equal(recovered.deliveredL,1);
  assert.equal(recovered.state.parts[0].params.psi,35);
});

test('a stale 3D pump identity fails closed even during an unpowered minute', () => {
  const wrongId=createOriginalWaterMinuteStep(core,{pumpPressurePsi:50,pumpId:'missing'});
  const wrongType=createOriginalWaterMinuteStep(core,{pumpPressurePsi:50,pumpId:'pump-1'});
  assert.throws(()=>wrongId({minute:0,requestedWh:0,deliveredWh:0,state:initial()}),/pump identity/);
  const invalid=initial();invalid.parts[0].type='tank';
  assert.throws(()=>wrongType({minute:0,requestedWh:0,deliveredWh:0,state:invalid}),/pump identity/);
  assert.equal(invalid.parts[0].params.psi,50);
});
