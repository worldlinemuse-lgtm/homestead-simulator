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
    backgroundLoadW:85,pumpElectricalW:120,pumpPressurePsi:50, // ASSUMED electrical curve; user-controlled hydraulic pressure
    waterStorageCapacityL:250,waterStartL:60,
    batteryChemistry:"lfp",batteryBusVoltageV:24,batteryBankAh:416.6666666667,
    batteryTemperatureC:20,batteryBulkCurrentLimitA:30,
    initialFarmSeed:7,
    // Optional 24-hour measured/scenario irradiance and cell-temperature series.
    // Null preserves the explicitly illustrative sky; no synthetic data is labeled measured.
    solarHourlyWeather:null
  });
  function solarEnvelopeW(hour,c,dayIndex=0){
    must(Number.isSafeInteger(dayIndex)&&dayIndex>=0,"Invalid Solar weather day index");
    // Deterministic illustrative sky input (not NASA/NSRDB measured or forecast weather).
    const sun=Math.max(0,Math.sin(Math.PI*(hour+0.5-6)/12));
    const weatherIndex=dayIndex*24+hour;
    must(!c.solarHourlyWeather || weatherIndex<c.solarHourlyWeather.length,
      "Solar hourly weather exhausted; provide additional days before advancing");
    const record=c.solarHourlyWeather?.[weatherIndex];
    const irradiance=record?record.irradianceWm2:sun*1000*c.cloudTransmittance;
    const cellC=record?record.cellTemperatureC:18+sun*22;
    const provenance=record?"supplied_hourly_weather":"illustrative_sky";
    if(irradiance<0.01)return {envelopeW:0,irradiance,cellC,status:"no_sun",provenance};
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
    if(estimate.status!=="estimated")return {envelopeW:0,irradiance,cellC,status:estimate.status,reason:estimate.reason||"Unsupported",provenance};
    return {envelopeW:number("envelope",estimate.controllerMaximumEnvelopeW),irradiance,cellC,status:"estimated",provenance};
  }
  function allocateEnergy(params){
    const {pvWh,baseWh,pumpWh,initialBatteryWh,cfg}=params;
    const absorptionMinutes=number("absorptionMinutes",params.absorptionMinutes??0);
    // All sources, demands, and stores are watt-hours. Reject unsafe arithmetic
    // before computing state; non-finite values can invalidate conservation proofs.
    must(cfg && typeof cfg==="object","Energy config must be an object");
    for(const [name,value] of Object.entries({pvWh,baseWh,pumpWh,initialBatteryWh}))number(name,value);
    const etaD=number("dischargeEfficiency",cfg.dischargeEfficiency);
    const etaC=number("chargeEfficiency",cfg.chargeEfficiency);
    must(etaD>0&&etaD<=1&&etaC>0&&etaC<=1,"Energy efficiencies must be in (0,1]");
    // Native original Solar chemistry/rate/temperature and absorption functions.
    // A 1-hour dispatch uses DC bus amps for the source model; current limit is
    // a declared scenario assumption, not a manufacturer's charging certification.
    must(root.BATTMODEL && typeof root.BATTMODEL.drainMult==="function" &&
      typeof root.BATTMODEL.absorption==="function","Original Solar battery engine unavailable");
    const native=root.BATTMODEL;
    const voltage=number("batteryBusVoltageV",cfg.batteryBusVoltageV);
    const bankAh=number("batteryBankAh",cfg.batteryBankAh);
    const bulkLimitA=number("batteryBulkCurrentLimitA",cfg.batteryBulkCurrentLimitA);
    must(voltage>0&&bankAh>0&&bulkLimitA>0,"Battery electrical parameters must be positive");
    const temperature=cfg.batteryTemperatureC;
    must(Number.isFinite(temperature)&&temperature>=-30&&temperature<=60,"Battery temperature out of range");
    const chem=cfg.batteryChemistry;
    must(chem==="agm"||chem==="lfp","Unsupported battery chemistry");
    const expectedCurrentA=Math.max(0,baseWh+pumpWh-pvWh)/voltage;
    const discharge=native.drainMult(chem,expectedCurrentA,temperature);
    must(Number.isFinite(discharge.m)&&discharge.m>0,"Invalid native discharge factor");
    const nativeDischargeEfficiency=etaD/discharge.m;
    must(nativeDischargeEfficiency>0&&nativeDischargeEfficiency<=1,"Invalid effective discharge efficiency");
    const capacity=number("batteryCapacityWh",cfg.batteryCapacityWh);
    const reserve=number("batteryReserveWh",cfg.batteryReserveWh);
    must(capacity>0,"Battery capacity must be positive");
    must(reserve<=initialBatteryWh&&initialBatteryWh<=capacity,
      "Energy inventory outside battery capacity/reserve");
    must(Number.isFinite(initialBatteryWh+pvWh),"Energy input sum overflow");
    let batteryWh=initialBatteryWh, remainingPv=pvWh, batteryOutputWh=0, servedBaseWh=0, servedPumpWh=0;
    let directBaseWh=0,batteryBaseWh=0,directPumpWh=0,batteryPumpWh=0;
    const deliver=(need)=>{
      const direct=Math.min(need,remainingPv);remainingPv-=direct;
      const fromBattery=Math.min(need-direct,Math.max(0,batteryWh-reserve)*nativeDischargeEfficiency);
      batteryWh-=fromBattery/nativeDischargeEfficiency;
      batteryOutputWh+=fromBattery;
      return {direct,fromBattery,served:direct+fromBattery};
    };
    const baseDelivery=deliver(baseWh);
    directBaseWh=baseDelivery.direct;batteryBaseWh=baseDelivery.fromBattery;
    servedBaseWh=baseDelivery.served;
    // An electrically powered pump must have strictly positive demand AND
    // enough allocatable energy. No EPS subsidy for tiny pump requests.
    // Pump operation is atomic: a fractional watt-hour shortfall cannot
    // authorize a full hour of hydraulic pressure. Do not apply the general
    // conservation epsilon to equipment-start eligibility.
    const pumpEnabled=pumpWh>0 && servedBaseWh>=baseWh &&
        remainingPv+Math.max(0,batteryWh-reserve)*nativeDischargeEfficiency>=pumpWh;
    if(pumpEnabled){
      const pumpDelivery=deliver(pumpWh);
      directPumpWh=pumpDelivery.direct;batteryPumpWh=pumpDelivery.fromBattery;
      servedPumpWh=pumpDelivery.served;
    }
    const charge=native.absorption(chem,batteryWh/capacity,absorptionMinutes,bankAh);
    must(Number.isFinite(charge.mult)&&charge.mult>=0&&charge.mult<=1,
      "Invalid native charging multiplier");
    const sourceChargeLimitWh=bulkLimitA*voltage*charge.mult;
    must(Number.isFinite(sourceChargeLimitWh),"Battery charge limit overflow");
    const chargeInWh=Math.min(remainingPv,Math.max(0,capacity-batteryWh)/etaC,sourceChargeLimitWh);
    const chargeStoredWh=chargeInWh*etaC;
    // Native absorption timing accumulates only during active absorption charging.
    // Bulk and float reset the timer; a one-hour interval is 60 minutes.
    const nextAbsorptionMinutes=charge.phase==="absorption" && chargeInWh>EPS
      ? absorptionMinutes+60 : 0;
    batteryWh+=chargeStoredWh;
    const curtailedWh=remainingPv-chargeInWh;
    const chargeLossWh=chargeInWh*(1-etaC);
    const dischargeLossWh=batteryOutputWh*(1/nativeDischargeEfficiency-1);
    const residualWh=initialBatteryWh+pvWh-batteryWh-servedBaseWh-servedPumpWh-curtailedWh-chargeLossWh-dischargeLossWh;
    must(Number.isFinite(residualWh)&&Math.abs(residualWh)<1e-5,
      "Energy conservation failure "+residualWh);
    const unservedBaseWh=baseWh-servedBaseWh;
    for(const [name,value] of Object.entries({batteryWh,servedBaseWh,unservedBaseWh,
      servedPumpWh,curtailedWh,chargeLossWh,dischargeLossWh}))number(name,value);
    must(batteryWh<=capacity+EPS,"Energy inventory exceeds battery capacity");
    return {batteryWh,servedBaseWh,unservedBaseWh,servedPumpWh,pumpEnabled,
      pvWh,curtailedWh,chargeLossWh,dischargeLossWh,residualWh,
      directBaseWh,batteryBaseWh,directPumpWh,batteryPumpWh,chargeStoredWh,nextAbsorptionMinutes,
      nativeBattery:{source:"solar-sandbox/source/battery.js@871dd8c0ef03a05feb339c9761ead900875f16b5",
        chemistry:chem,temperatureC:temperature,dischargeCurrentA:expectedCurrentA,
        dischargeMultiplier:discharge.m,dischargeRateFactor:discharge.rate,
        dischargeTemperatureFactor:discharge.temp,chargePhase:charge.phase,
        chargeCurrentMultiplier:charge.mult,chargeLimitWh:sourceChargeLimitWh,
        absorptionMinutesBefore:absorptionMinutes,absorptionMinutesAfter:nextAbsorptionMinutes,
        effectiveDischargeEfficiency:nativeDischargeEfficiency}};
  }
  function configuration(overrides={}){
    const c={...configDefaults,...overrides};
    if(c.solarHourlyWeather!==null){
      must(Array.isArray(c.solarHourlyWeather)&&c.solarHourlyWeather.length>=24&&
        c.solarHourlyWeather.length%24===0,
        "solarHourlyWeather requires complete 24-hour days");
      c.solarHourlyWeather=c.solarHourlyWeather.map((record,i)=>{
        must(record&&typeof record==="object","Invalid solar weather record "+i);
        const irradianceWm2=number("irradianceWm2 hour "+i,record.irradianceWm2);
        must(irradianceWm2<=1200,"Irradiance exceeds design envelope hour "+i);
        must(Number.isFinite(record.cellTemperatureC)&&
          record.cellTemperatureC>=-25&&record.cellTemperatureC<=70,
          "Cell temperature outside design envelope hour "+i);
        return {irradianceWm2,cellTemperatureC:record.cellTemperatureC};
      });
    }
    for(const key of ["solarUtilization","cloudTransmittance","chargeEfficiency","dischargeEfficiency"]){
      number(key,c[key]);must(c[key]<=1,key+" must be <=1");
    }
    must(["agm","lfp"].includes(c.batteryChemistry),"Unsupported battery chemistry");
    must(Number.isFinite(c.batteryTemperatureC)&&c.batteryTemperatureC>=-30&&c.batteryTemperatureC<=60,
      "Battery temperature must be between -30 and 60 C");
    for(const key of ["batteryBusVoltageV","batteryBankAh","batteryBulkCurrentLimitA"])
      {number(key,c[key]);must(c[key]>0,key+" must be positive");}
    for(const key of ["batteryCapacityWh","batteryStartWh","batteryReserveWh","backgroundLoadW","pumpElectricalW","pumpPressurePsi","waterStorageCapacityL","waterStartL"]){
      number(key,c[key]);
    }
    must(c.batteryCapacityWh>0,"Battery capacity must be positive");
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
      this.absorptionMinutes=0;
      this.waterStoredL=this.cfg.waterStartL;
      this.cumulative={pvWh:0,baseWh:0,pumpWh:0,treatedL:0,waterConsumedL:0,overflowL:0,waterDeficitL:0,energyDeficitWh:0,farmElectricityServedWh:0,farmElectricityDeficitWh:0,farmWaterDeliveredL:0,farmWaterDeficitL:0,pumpElectricityRequestedWh:0,pumpElectricityDeficitWh:0,backgroundElectricityServedWh:0,backgroundElectricityDeficitWh:0};
      this.last=null;
      return this.snapshot();
    }
    configure(next={}){
      const updated=configuration({...this.cfg,...next});
      // Configuration cannot erase or manufacture physical inventory. Reject
      // incompatible edits *before* changing any state, including the config.
      must(Number.isFinite(this.batteryWh)&&this.batteryWh>=0,
        "Invalid current battery inventory");
      must(Number.isFinite(this.waterStoredL)&&this.waterStoredL>=0,
        "Invalid current water inventory");
      must(this.batteryWh<=updated.batteryCapacityWh,
        "Battery capacity below current stored energy; transfer energy first");
      must(this.batteryWh>=updated.batteryReserveWh,
        "Battery reserve exceeds current stored energy");
      must(this.waterStoredL<=updated.waterStorageCapacityL,
        "Water capacity below current stored volume; transfer water first");
      this.cfg=updated;
      return this.snapshot();
    }
    stepHour(){
      const cfg=this.cfg, hour=(this.hours+this.startHour)%24, dayRecord=this.farmSnapshot.daily;
      const farmDailyKWh=number("farm kWh",dayRecord?.kWh||0);
      const farmDailyWaterL=number("farm gal",dayRecord?.waterGal||0)*GALLON_TO_LITER;
      const weatherDay=Math.floor((this.hours+this.startHour)/24);
      const pv=solarEnvelopeW(hour,cfg,weatherDay);
      const pvWh=pv.envelopeW*cfg.solarUtilization; // 1h scenario power estimate (Wh)
      const farmDemandWh=farmDailyKWh*1000/24;
      const baseWh=cfg.backgroundLoadW+farmDemandWh; // hourly farm demand, background priority
      const requestedPumpWh=cfg.pumpPressurePsi>0?cfg.pumpElectricalW:0;
      const energy=allocateEnergy({pvWh,baseWh,pumpWh:requestedPumpWh,
        initialBatteryWh:this.batteryWh,absorptionMinutes:this.absorptionMinutes,cfg});
      // Explicit native Solar -> Farm transfer: allocate background load first.
      const backgroundServedWh=Math.min(cfg.backgroundLoadW,energy.servedBaseWh);
      const farmServedWh=Math.min(farmDemandWh,
        Math.max(0,energy.servedBaseWh-backgroundServedWh));
      const farmUnservedWh=farmDemandWh-farmServedWh;
      const backgroundDeficitWh=cfg.backgroundLoadW-backgroundServedWh;
      const pumpDeficitWh=requestedPumpWh-energy.servedPumpWh;
      must(pumpDeficitWh>=-EPS && backgroundDeficitWh>=-EPS &&
        Math.abs(backgroundDeficitWh+farmUnservedWh-energy.unservedBaseWh)<1e-6,
        "Electrical demand reconciliation failure");
      must(Math.abs(backgroundServedWh+farmServedWh-energy.servedBaseWh)<1e-6,
        "Farm electrical allocation conservation failure");
      // Execute hydraulic substeps against a working copy. A failed solver must
      // not partially advance the authoritative water state or scenario clock.
      const waterBefore=this.waterStoredL;
      must(Number.isFinite(this.water.produced) && this.water.produced>=0,
        "Invalid existing water production");
      const nextWater=root.HomesteadWaterCore.cloneWorld(this.water);
      must(nextWater && nextWater!==this.water && Number.isFinite(nextWater.produced),
        "Water solver cannot create an independent snapshot");
      const waterProducedBefore=nextWater.produced;
      const pump=nextWater.parts.find(p=>p.type==="pump_sky");
      must(!!pump,"Water reference preset is missing its pump");
      pump.params.psi=energy.pumpEnabled?cfg.pumpPressurePsi:0;
      // Original network solver; dynamic storage/filter updates. Exact result from water core,
      // not an assumed gallons-per-hour constant.
      let elapsed=0,iterations=0,previousProduced=waterProducedBefore;
      while(elapsed<3600-1e-7){
        const dt=Math.min(300,3600-elapsed);
        const r=root.HomesteadWaterCore.step(nextWater,dt,1);
        must(r && Number.isFinite(r.dt) && r.dt>0 && r.dt<=dt+1e-6,"Water solver returned invalid timestep");
        must(Number.isFinite(nextWater.produced) && nextWater.produced>=previousProduced-EPS,
          "Water solver returned non-finite or decreasing cumulative production");
        previousProduced=nextWater.produced;
        elapsed+=r.dt;
        if(++iterations>1000)throw new Error("Water solver exceeded substep limit");
      }
      const treatedL=nextWater.produced-waterProducedBefore;
      must(Number.isFinite(treatedL) && treatedL>=-EPS,"Invalid water production");
      const wantL=farmDailyWaterL/24;
      const beforeUse=waterBefore+treatedL;
      const consumedL=Math.min(beforeUse,wantL);
      const shortfallL=wantL-consumedL;
      // Source Farm daily demand is allocated from the physically available
      // treated-water inventory. No unmet liters enter Farm delivery.
      must(Math.abs(wantL-consumedL-shortfallL)<1e-7,
        "Farm water demand allocation failure");
      const afterUse=beforeUse-consumedL;
      const overflowL=Math.max(0,afterUse-cfg.waterStorageCapacityL);
      const nextWaterStoredL=afterUse-overflowL;
      const waterResidual=waterBefore+treatedL-consumedL-overflowL-nextWaterStoredL;
      must(Number.isFinite(nextWaterStoredL) && nextWaterStoredL>=-EPS &&
        Number.isFinite(waterResidual) && Math.abs(waterResidual)<1e-5,
        "Water conservation failure "+waterResidual);
      // Validate typed per-equipment transfers against the independently
      // computed energy/water inventories *before* any model state commits.
      must(root.HomesteadResourceContract &&
        typeof root.HomesteadResourceContract.auditHour==="function",
        "Resource transfer contract unavailable");
      const resourceAudit=root.HomesteadResourceContract.auditHour({
        hour:this.hours,energy,initialBatteryWh:this.batteryWh,
        waterBeforeL:waterBefore,treatedL,consumedL,overflowL,waterAfterL:nextWaterStoredL
      });
      // Hydraulic state, tank inventory and electricity commit together.
      this.water=nextWater;
      this.waterStoredL=nextWaterStoredL;
      this.batteryWh=energy.batteryWh;
      this.absorptionMinutes=energy.nextAbsorptionMinutes;
      this.cumulative.pvWh+=pvWh;
      this.cumulative.baseWh+=energy.servedBaseWh;
      this.cumulative.pumpWh+=energy.servedPumpWh;
      this.cumulative.treatedL+=treatedL;
      this.cumulative.waterConsumedL+=consumedL;
      this.cumulative.overflowL+=overflowL;
      this.cumulative.waterDeficitL+=shortfallL;
      this.cumulative.energyDeficitWh+=energy.unservedBaseWh;
      this.cumulative.farmElectricityServedWh+=farmServedWh;
      this.cumulative.farmElectricityDeficitWh+=farmUnservedWh;
      this.cumulative.farmWaterDeliveredL+=consumedL;
      this.cumulative.farmWaterDeficitL+=shortfallL;
      this.cumulative.pumpElectricityRequestedWh+=requestedPumpWh;
      this.cumulative.pumpElectricityDeficitWh+=pumpDeficitWh;
      this.cumulative.backgroundElectricityServedWh+=backgroundServedWh;
      this.cumulative.backgroundElectricityDeficitWh+=backgroundDeficitWh;
      this.hours++;
      if((this.hours+this.startHour)%24===0){
        this.farm.advanceDay();
        this.farmSnapshot=this.farm.snapshot();
      }
      this.last={hour,day:this.farmSnapshot.date,
        pv,energy,water:{treatedL,waterStoredL:this.waterStoredL,consumedL,shortfallL,overflowL,waterResidual},
        resourceAudit,
        electricalLoads:{backgroundRequestedWh:cfg.backgroundLoadW,backgroundServedWh,backgroundDeficitWh,
          pumpRequestedWh:requestedPumpWh,pumpServedWh:energy.servedPumpWh,pumpDeficitWh,
          farmRequestedWh:farmDemandWh,farmServedWh,farmDeficitWh:farmUnservedWh},
        farm:{dailyDemandWaterL:farmDailyWaterL,dailyDemandKWh:farmDailyKWh,
          hourlyElectricityDemandWh:farmDemandWh,electricityServedWh:farmServedWh,
          electricityDeficitWh:farmUnservedWh,
          hourlyWaterDemandL:wantL,waterDeliveredL:consumedL,waterDeficitL:shortfallL,
          counts:this.farmSnapshot.counts},
        warnings:[
          ...(energy.unservedBaseWh>EPS?["Essential energy demand was not met. Farm biological effects NOT modeled."]:[]),
          ...(shortfallL>EPS?["Farm water demand was not met. Farm biological effects NOT modeled."]:[]),
          ...(pv.status!=="estimated"&&pv.status!=="no_sun"?["Solar PV reference unavailable: "+pv.status]:[])
        ]};
      return this.snapshot();
    }
    snapshot(){
      return {schema:1,model:"experimental-coupled-scenario",clock:{hours:this.hours,hourOfDay:(this.hours+this.startHour)%24,startHour:this.startHour,date:this.farmSnapshot.date},
        batteryWh:this.batteryWh,absorptionMinutes:this.absorptionMinutes,waterStoredL:this.waterStoredL,config:{...this.cfg,solarHourlyWeather:this.cfg.solarHourlyWeather?.map(r=>({...r}))??null},farm:this.farmSnapshot,
        cumulative:{...this.cumulative},last:this.last};
    }
  }
  root.HomesteadCoordinator=Object.freeze({Coordinator,solarEnvelopeW,allocateEnergy,configuration});
})(globalThis);
