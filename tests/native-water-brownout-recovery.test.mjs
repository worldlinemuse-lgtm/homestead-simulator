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
