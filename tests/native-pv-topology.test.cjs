// Run: node tests/native-pv-topology.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const calls=[];
const context={SolarNextCore:{shadowPv(input){
  calls.push({...input,stringsByController:[...input.stringsByController]});
  return {status:'estimated',controllerMaximumEnvelopeW:input.series*
    input.stringsByController.reduce((a,b)=>a+b,0)*input.irradianceWm2};
}}};
context.globalThis=context;
vm.runInNewContext(fs.readFileSync('src/coordinator.js','utf8'),context);
const {configuration,solarEnvelopeW}=context.HomesteadCoordinator;
const baseline=configuration({solarUtilization:1});
const changed=configuration({solarSeries:3,solarStringsByController:[1,2],
  solarPanelId:'r200',solarControllerId:'150/70',solarBusVoltageV:48});
const a=solarEnvelopeW(12,baseline),b=solarEnvelopeW(12,changed);
assert.equal(a.status,'estimated');
assert.equal(b.status,'estimated');
assert.ok(b.envelopeW>a.envelopeW);
assert.equal(calls[1].panelId,'r200');
assert.equal(calls[1].busVoltageV,48);
assert.equal(calls[1].series,3);
assert.deepEqual(Array.from(calls[1].stringsByController),[1,2]);
changed.solarStringsByController[0]=99;
assert.deepEqual(Array.from(baseline.solarStringsByController),[2]);
for(const bad of [{solarSeries:0},{solarSeries:1.5},
  {solarStringsByController:[]},{solarStringsByController:[0]},
  {solarMpptCurrentLimitA:0},{solarBusVoltageV:0}])
  assert.throws(()=>configuration(bad));

// The native engine must never silently turn a malformed result into a zero
// supply reading: this would conceal a broken source integration.
for(const result of [null,{}, {status:'estimated',controllerMaximumEnvelopeW:NaN},
  {status:'estimated',controllerMaximumEnvelopeW:-1},
  {status:'unrecognized'}]){
  context.SolarNextCore.shadowPv=()=>result;
  assert.throws(()=>solarEnvelopeW(12,baseline));
}
context.SolarNextCore.shadowPv=()=>({status:'unsupported',reason:'incompatible topology'});
const unsupported=solarEnvelopeW(12,baseline);
assert.equal(unsupported.status,'unsupported');
assert.equal(unsupported.envelopeW,0);
assert.equal(unsupported.reason,'incompatible topology');

console.log('Native Solar PV topology configuration and hourly coupling: passed');
