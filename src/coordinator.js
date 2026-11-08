/* Homestead Simulation Coordinator — v0.1 experimental linked scenario.
 * Reuses original vendored Water and Farm model code and Solar's published-reference
 * PV upper-envelope, while making ALL cross-domain assumptions explicit.
 * This does NOT substitute for the original full live Solar electrical engine.
 */
(function(root){
  "use strict";
  const GALLON_TO_LITER=3.78541, EPS=1e-8;
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const must=(ok,message)=>{if(!ok)throw new Error(message)};
  function number(name,x,lower=0){must(Number.isFinite(x)&&x>=lower,name+" must be finite and >= "+lower);return x}
  const configDefaults=Object.freeze({
    solarUtilization:0.72, // Assumed fraction of PV published-reference upper envelope
    cloudTransmittance:0.82, // Assumed clear-sky transmission; NOT weather data
    batteryCapacityWh:10000,batteryStartWh:6000,batteryReserveWh:1000,
    chargeEfficiency:0.95,dischargeEfficiency:0.92,
    backgroundLoadW:85,pumpElectricalW:120, // ASSUMED: maker pump electrical curve unavailable
    waterStorageCapacityL:250,waterStartL:60,
    initialFarmSeed:7
  });
  function solarEnvelopeW(hour,c){
    // Deterministic illustrative sky input (not NASA/NSRDB measured or forecast weather).
    const sun=Math.max(0,Math.sin(Math.PI*(hour+0.5-6)/12));
    const irradiance=sun*1000*c.cloudTransmittance;
    if(irradiance<0.01)return {envelopeW:0,irradiance,cellC:18,status:"no_sun"};
    const cellC=18+sun*22;
    const estimate=root.SolarNextCore.shadowPv({
      panelId:"lg435",controllerId:"150/70",
      irradianceWm2:irradiance,cellTemperatureC:cellC,
      coldDesignMinimumCellTemperatureC:-25,
      hotDesignMaximumCellTemperatureC:70,
      maximumDesignEffectiveIrradianceWm2:1200,
      series:2,stringsByController:[2],
      mpptCurrentLimitA:70,mpptAbsoluteVocV:150,mpptOperatingVocV:145,
      mpptIscLimitA:50,mpptEfficiency:0.98,
      pvCableLoopOhm:0.06,controllerCableLoopOhm:0.02,busVoltageV:24,
      legacyControllerOutputW:null,legacySnowFraction:0
    });
    if(estimate.status!=="estimated")return {envelopeW:0,irradiance,cellC,status:estimate.status,reason:estimate.reason||"Unsupported"};
    return {envelopeW:number("envelope",estimate.controllerMaximumEnvelopeW),irradiance,cellC,status:"estimated"};
  }
  function allocateEnergy(params){
    const {pvWh,baseWh,pumpWh,initialBatteryWh,cfg}=params;
    const etaD=cfg.dischargeEfficiency,etaC=cfg.chargeEfficiency;
    let batteryWh=initialBatteryWh, remainingPv=pvWh, batteryOutputWh=0, servedBaseWh=0, servedPumpWh=0;
    const reserve=cfg.batteryReserveWh;
    const deliver=(need)=>{
      const direct=Math.min(need,remainingPv);remainingPv-=direct;
      const fromBattery=Math.min(need-direct,Math.max(0,batteryWh-reserve)*etaD);
      batteryWh-=fromBattery/etaD;
      batteryOutputWh+=fromBattery;
      return direct+fromBattery;
    };
    servedBaseWh=deliver(baseWh);
    const pumpEnabled=servedBaseWh>=baseWh-EPS &&
        remainingPv+Math.max(0,batteryWh-reserve)*etaD>=pumpWh-EPS;
    if(pumpEnabled)servedPumpWh=deliver(pumpWh);
    const chargeInWh=Math.min(remainingPv,Math.max(0,cfg.batteryCapacityWh-batteryWh)/etaC);
    batteryWh+=chargeInWh*etaC;
    const curtailedWh=remainingPv-chargeInWh;
    const chargeLossWh=chargeInWh*(1-etaC);
    const dischargeLossWh=batteryOutputWh*(1/etaD-1);
    const residualWh=initialBatteryWh+pvWh-batteryWh-servedBaseWh-servedPumpWh-curtailedWh-chargeLossWh-dischargeLossWh;
    must(Math.abs(residualWh)<1e-5,"Energy conservation failure "+residualWh);
    return {batteryWh,servedBaseWh,unservedBaseWh:baseWh-servedBaseWh,servedPumpWh,pumpEnabled,
      pvWh,curtailedWh,chargeLossWh,dischargeLossWh,residualWh};
  }
  function configuration(overrides={}){
    const c={...configDefaults,...overrides};
    for(const key of ["solarUtilization","cloudTransmittance","chargeEfficiency","dischargeEfficiency"]){
      number(key,c[key]);must(c[key]<=1,key+" must be <=1");
    }
    for(const key of ["batteryCapacityWh","batteryStartWh","batteryReserveWh","backgroundLoadW","pumpElectricalW","waterStorageCapacityL","waterStartL"]){
      number(key,c[key]);
    }
    must(c.batteryReserveWh<=c.batteryStartWh&&c.batteryStartWh<=c.batteryCapacityWh,"Inconsistent battery inventory");
    must(c.waterStartL<=c.waterStorageCapacityL,"Inconsistent water inventory");
    must(c.chargeEfficiency>0&&c.dischargeEfficiency>0,"Efficiencies must be positive");
    return c;
  }
  class Coordinator {
    constructor(options={}){
      this.cfg=configuration(options);
      this.reset();
    }
    reset(){
      this.farm=root.HomesteadFarmCore;
      this.farm.reset(this.cfg.initialFarmSeed);
      this.farm.advanceDay(); // seed baseline: obtain a sourced daily consumption ledger
      this.farmSnapshot=this.farm.snapshot();
      this.water=root.HomesteadWaterCore.buildPreset("E"); // stream -> pump -> RO -> outlet
      // The illustrated site starts at 09:00 local scenario time for a useful daylight view.
      // Farm biology still advances only when this local timeline crosses midnight.
      this.startHour=9;
      this.hours=0;this.batteryWh=this.cfg.batteryStartWh;
      this.waterStoredL=this.cfg.waterStartL;
      this.cumulative={pvWh:0,baseWh:0,pumpWh:0,treatedL:0,waterConsumedL:0,overflowL:0,waterDeficitL:0,energyDeficitWh:0};
      this.last=null;
      return this.snapshot();
    }
    configure(next={}){
      const updated=configuration({...this.cfg,...next});
      this.cfg=updated;
      if(this.batteryWh>updated.batteryCapacityWh)this.batteryWh=updated.batteryCapacityWh;
      if(this.waterStoredL>updated.waterStorageCapacityL)this.waterStoredL=updated.waterStorageCapacityL;
      return this.snapshot();
    }
    stepHour(){
      const cfg=this.cfg, hour=(this.hours+this.startHour)%24, dayRecord=this.farmSnapshot.daily;
      const farmDailyKWh=number("farm kWh",dayRecord?.kWh||0);
      const farmDailyWaterL=number("farm gal",dayRecord?.waterGal||0)*GALLON_TO_LITER;
      const pv=solarEnvelopeW(hour,cfg);
      const pvWh=pv.envelopeW*cfg.solarUtilization; // 1h scenario power estimate (Wh)
      const baseWh=cfg.backgroundLoadW+farmDailyKWh*1000/24; // estimated uniform hourly farm demand
      const energy=allocateEnergy({pvWh,baseWh,pumpWh:cfg.pumpElectricalW,
        initialBatteryWh:this.batteryWh,cfg});
      const waterBefore=this.waterStoredL,waterProducedBefore=this.water.produced;
      const pump=this.water.parts.find(p=>p.type==="pump_sky");
      must(!!pump,"Water reference preset is missing its pump");
      pump.params.psi=energy.pumpEnabled?50:0;
      // Original network solver; dynamic storage/filter updates. Exact result from water core,
      // not an assumed gallons-per-hour constant.
      let elapsed=0,iterations=0;
      while(elapsed<3600-1e-7){
        const dt=Math.min(300,3600-elapsed);
        const r=root.HomesteadWaterCore.step(this.water,dt,1);
        must(r && Number.isFinite(r.dt) && r.dt>0 && r.dt<=dt+1e-6,"Water solver returned invalid timestep");
        must(Number.isFinite(this.water.produced) && this.water.produced>=waterProducedBefore-EPS,"Water solver returned non-finite or decreasing cumulative production");
        elapsed+=r.dt;
        if(++iterations>1000)throw new Error("Water solver exceeded substep limit");
      }
      const treatedL=this.water.produced-waterProducedBefore;
      must(Number.isFinite(treatedL) && treatedL>=-EPS,"Invalid water production");
      const wantL=farmDailyWaterL/24;
      const beforeUse=waterBefore+treatedL;
      const consumedL=Math.min(beforeUse,wantL);
      const shortfallL=wantL-consumedL;
      const afterUse=beforeUse-consumedL;
      const overflowL=Math.max(0,afterUse-cfg.waterStorageCapacityL);
      this.waterStoredL=afterUse-overflowL;
      const waterResidual=waterBefore+treatedL-consumedL-overflowL-this.waterStoredL;
      must(Math.abs(waterResidual)<1e-5,"Water conservation failure "+waterResidual);
      this.batteryWh=energy.batteryWh;
      this.cumulative.pvWh+=pvWh;
      this.cumulative.baseWh+=energy.servedBaseWh;
      this.cumulative.pumpWh+=energy.servedPumpWh;
      this.cumulative.treatedL+=treatedL;
      this.cumulative.waterConsumedL+=consumedL;
      this.cumulative.overflowL+=overflowL;
      this.cumulative.waterDeficitL+=shortfallL;
      this.cumulative.energyDeficitWh+=energy.unservedBaseWh;
      this.hours++;
      if((this.hours+this.startHour)%24===0){
        this.farm.advanceDay();
        this.farmSnapshot=this.farm.snapshot();
      }
      this.last={hour,day:this.farmSnapshot.date,
        pv,energy,water:{treatedL,waterStoredL:this.waterStoredL,consumedL,shortfallL,overflowL,waterResidual},
        farm:{dailyDemandWaterL:farmDailyWaterL,dailyDemandKWh:farmDailyKWh,counts:this.farmSnapshot.counts},
        warnings:[
          ...(energy.unservedBaseWh>EPS?["Essential energy demand was not met. Farm biological effects NOT modeled."]:[]),
          ...(shortfallL>EPS?["Farm water demand was not met. Farm biological effects NOT modeled."]:[]),
          ...(pv.status!=="estimated"&&pv.status!=="no_sun"?["Solar PV reference unavailable: "+pv.status]:[])
        ]};
      return this.snapshot();
    }
    snapshot(){
      return {schema:1,model:"experimental-coupled-scenario",clock:{hours:this.hours,hourOfDay:(this.hours+this.startHour)%24,startHour:this.startHour,date:this.farmSnapshot.date},
        batteryWh:this.batteryWh,waterStoredL:this.waterStoredL,config:{...this.cfg},farm:this.farmSnapshot,
        cumulative:{...this.cumulative},last:this.last};
    }
  }
  root.HomesteadCoordinator=Object.freeze({Coordinator,solarEnvelopeW,allocateEnergy,configuration});
})(globalThis);
