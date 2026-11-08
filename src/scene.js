import * as THREE from "three";
/**
 * One unified THREE.js world. No renderer is allowed to alter source engine state.
 * All material states, inventories, animations are derived from coordinator snapshots.
 * Procedural graphics illustrate layout, never claim hardware-installation precision.
 */
export function makeScene(canvas,onSelect=()=>{}){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0xb7d6e1);
  scene.fog=new THREE.Fog(0xb7d6e1,75,150);
  const camera=new THREE.PerspectiveCamera(49,1,.1,250);
  const hemi=new THREE.HemisphereLight(0xf2f7ff,0x536643,1.6);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff5d4,2.3);
  sun.position.set(-25,38,-19);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=55;sun.shadow.camera.bottom=-55;sun.shadow.camera.far=150;scene.add(sun);
  const M=(color,other={})=>new THREE.MeshStandardMaterial({color,roughness:.78,...other});
  const mats={
    ground:M(0x83a57e), soil:M(0x9c8465), metal:M(0x8c9da5,{metalness:.6,roughness:.3}),
    dark:M(0x1b303f), panel:M(0x17486e,{metalness:.4,roughness:.22}),
    glass:M(0x6cbae5,{metalness:.1,transparent:true,opacity:.66}), tank:M(0xe1e7df),
    water:M(0x47b9ec,{transparent:true,opacity:.72,roughness:.18}),
    barn:M(0xcb9573), roof:M(0x52656a), fence:M(0xd6c2a4),
    pipe:M(0x438aa7,{metalness:.35}), wire:M(0xe5ac54), green:M(0x5d8652),
    rabbit:M(0xe3dacf), chicken:M(0xd6a96d), red:M(0xd45a41), light:M(0xf8f2dd)
  };
  const box=(w,h,d,mat,x=0,y=0,z=0)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;return mesh};
  const cyl=(r1,r2,h,mat,x=0,y=0,z=0)=>{const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,18),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;return mesh};
  const group=(type,label,x,z)=>{const g=new THREE.Group();g.position.set(x,0,z);g.userData.kind=type;g.userData.label=label;scene.add(g);return g};
  const terrain=box(100,.5,62,mats.ground,0,-.36,0);terrain.receiveShadow=true;scene.add(terrain);
  scene.add(box(13,.06,52,M(0xb5b3a2),-8,-.07,0));
  // Terrain zones are spatial grouping, not physical acreage estimates.
  const zones=[
    {g:group("energy","Solar and battery yard",-24,-8),size:[27,23],mark:0x3d665f},
    {g:group("water","Water-treatment works",0,-8),size:[24,23],mark:0x678fa2},
    {g:group("farm","Rabbit and chicken area",26,-8),size:[30,23],mark:0x70935d}
  ];
  for(const z of zones){
    z.g.add(box(z.size[0],.08,z.size[1],M(z.mark),0,.01,0));
    z.g.add(box(z.size[0]+.2,.15,.18,mats.fence,0,.14,-z.size[1]/2));
  }
  const energy=zones[0].g,water=zones[1].g,farm=zones[2].g;
  // 4 actual Longi module visual representatives, 2S2P in scenario; size/spacing illustrative.
  energy.add(box(17,.22,6,M(0x535d59),0,.15,-1));
  const arrays=[];
  for(let i=0;i<4;i++){
    const col=i%2,row=Math.floor(i/2);
    const p=new THREE.Group();p.position.set(-4.4+col*8.8,2.2,-3.2+row*5.1);
    p.rotation.x=-.29;
    const frame=box(7.6,.17,3.7,mats.metal);
    const face=box(7.26,.08,3.35,mats.panel,0,.12,0);
    p.add(frame,face);
    for(let j=1;j<6;j++)p.add(box(.045,.01,3.2,mats.glass,-3.6+j*1.2,.17,0));
    for(let j=1;j<4;j++)p.add(box(7.18,.01,.035,mats.glass,0,.17,-1.65+j*.82));
    energy.add(p);
    energy.add(cyl(.11,.11,2.1,mats.metal,p.position.x,1.1,p.position.z-.9));
    arrays.push(p);
  }
  energy.add(box(3,4,2.2,mats.dark,-7,2,7));
  energy.add(box(2.4,3.3,2.3,mats.metal,-2.8,1.65,7));
  const batteryCharge=box(1.5,.15,.10,M(0x68efad),-7,3.7,8.14);energy.add(batteryCharge);
  const inverterLed=new THREE.PointLight(0x72efb8,0,5);inverterLed.position.set(-2.8,2.5,8.5);energy.add(inverterLed);
  // Water: gravity source, electric pump, RO stages, product tank and transfer line.
  water.add(box(5,.22,16,mats.soil,-8,.15,0));
  const stream=box(2,.09,15,M(0x3486b0,{transparent:true,opacity:.82}),-8,.28,0);water.add(stream);
  const pumpCase=box(2.3,1.5,1.7,mats.metal,-3,1.1,-2);water.add(pumpCase);
  const motor=cyl(.62,.62,2,mats.dark,-3,1.8,-2);motor.rotation.z=Math.PI/2;water.add(motor);
  const pumpLed=new THREE.PointLight(0x7dd9ff,0,8);pumpLed.position.set(-3,2.4,-2);water.add(pumpLed);
  const filters=[];
  for(let i=0;i<3;i++){
    const x=1+i*2.8;
    const unit=cyl(.78,.78,3.8,mats.tank,x,2,-2.7);water.add(unit);
    const cap=cyl(.84,.84,.38,mats.dark,x,4.05,-2.7);water.add(cap);
    filters.push(unit);
  }
  water.add(cyl(2.5,2.5,4.8,mats.tank,4.6,2.4,6));
  const fill=cyl(2.37,2.37,1,mats.water,4.6,.65,6);fill.material.side=THREE.DoubleSide;water.add(fill);
  water.add(box(4,.4,1.4,mats.dark,4.6,5.3,6));
  const cableCurve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(-18,1.2,-1),new THREE.Vector3(-10,1,-1),
    new THREE.Vector3(-4,1.2,-4),new THREE.Vector3(-3,1.9,-10)
  ]);
  const pipeCurve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(-8,.6,-8),new THREE.Vector3(-4,.65,-9),
    new THREE.Vector3(-1,1,-11),new THREE.Vector3(5,1,-11),
    new THREE.Vector3(5,4,0)
  ]);
  const farmPipe=new THREE.CatmullRomCurve3([
    new THREE.Vector3(4.6,3,6),new THREE.Vector3(9,3,6),
    new THREE.Vector3(14,2,6),new THREE.Vector3(24,1.5,4)
  ]);
  function tube(curve,radius,mat){const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,70,radius,9,false),mat);scene.add(mesh);return mesh}
  tube(cableCurve,.13,mats.wire);tube(pipeCurve,.17,mats.pipe);tube(farmPipe,.18,mats.pipe);
  // Farm housing with real model animal counts, while coordinates are illustrative.
  const coop=group("farm","Coop",28,-14);
  coop.add(box(9,5.5,7,mats.barn,0,2.75,0));
  const coopRoof=box(10,.5,8.2,mats.roof,0,5.7,0);coopRoof.rotation.z=.08;coop.add(coopRoof);
  coop.add(box(2.4,3.4,.1,mats.dark,0,1.7,3.55));
  for(let k=0;k<2;k++){
    const hutch=box(8,2.3,2.6,mats.barn,-7,2.4,k*4.2-2.5);farm.add(hutch);
    farm.add(box(8.3,.32,3,mats.roof,-7,3.66,k*4.2-2.5));
    for(let i=0;i<4;i++)farm.add(cyl(.09,.09,1.35,mats.metal,-10.4+i*2.25,.68,k*4.2-2.5));
  }
  farm.add(box(7,.12,5,mats.soil,3,.14,6));
  farm.add(cyl(.86,.86,1.8,mats.water,-2,.9,5));
  for(let i=0;i<18;i++){
    const a=i*.35;farm.add(cyl(.06,.06,1.4,mats.fence,-11+i*1.5,.7,11));
    farm.add(cyl(.06,.06,1.4,mats.fence,-11+i*1.5,.7,-11));
  }
  const agents=new THREE.Group();farm.add(agents);
  function drawAnimal(kind,id,index){
    const a=new THREE.Group();const chicken=kind==="chicken";
    const body=new THREE.Mesh(new THREE.SphereGeometry(chicken?.47:.52,9,7),chicken?mats.chicken:mats.rabbit);
    body.scale.set(1,.8,chicken?1.2:1.35);body.position.y=chicken?.72:.63;a.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(chicken?.27:.29,9,7),chicken?mats.chicken:mats.rabbit);
    head.position.set(0,chicken?1.07:.92,chicken?.38:.40);a.add(head);
    if(chicken){
      const beak=new THREE.Mesh(new THREE.ConeGeometry(.15,.3,6),mats.red);
      beak.rotation.x=Math.PI/2;beak.position.set(0,1.04,.7);a.add(beak);
      a.add(cyl(.12,.01,.27,mats.red,0,1.37,.44));
    }else{
      for(let e of [-.17,.17])a.add(box(.17,.65,.14,mats.rabbit,e,1.43,.42));
    }
    const nx=index%8,nz=Math.floor(index/8);
    a.position.set(-9+nx*2.4,0,-6+nz*3.0);
    a.userData={id,kind,baseX:a.position.x,baseZ:a.position.z};
    return a;
  }
  let prevSignature="";
  function syncAnimals(farmSnapshot){
    const animals=farmSnapshot.animals||[];
    const displayed=animals.filter(a=>a.sp==="rabbit"||a.sp==="chicken").slice(0,40);
    const signature=displayed.map(a=>a.id+":"+a.sp).join(",");
    if(signature===prevSignature)return;
    prevSignature=signature;
    while(agents.children.length)agents.remove(agents.children[0]);
    displayed.forEach((a,i)=>agents.add(drawAnimal(a.sp,a.id,i)));
  }
  const travelDots=[];
  function addFlowDots(curve,material,n,velocity){
    for(let i=0;i<n;i++){
      const dot=new THREE.Mesh(new THREE.SphereGeometry(.24,8,8),material);
      scene.add(dot);travelDots.push({mesh:dot,curve,offset:i/n,velocity,kind:curve===farmPipe?"water":curve===cableCurve?"energy":"water"});
    }
  }
  addFlowDots(cableCurve,M(0xffdd72,{emissive:0xb87028,emissiveIntensity:.45}),12,.08);
  addFlowDots(pipeCurve,M(0x70d6ff,{emissive:0x126f9c,emissiveIntensity:.65}),11,.11);
  addFlowDots(farmPipe,M(0x70d6ff,{emissive:0x126f9c,emissiveIntensity:.65}),9,.09);
  const positionTargets={
    overview:{eye:new THREE.Vector3(0,38,63),look:new THREE.Vector3(0,1,-1)},
    energy:{eye:new THREE.Vector3(-24,17,25),look:new THREE.Vector3(-24,1,-6)},
    water:{eye:new THREE.Vector3(2,19,25),look:new THREE.Vector3(1,1,-7)},
    farm:{eye:new THREE.Vector3(26,20,28),look:new THREE.Vector3(26,1,-6)}
  };
  let focus=positionTargets.overview;
  let eye=focus.eye.clone(),look=focus.look.clone();
  const targetEye=focus.eye.clone(),targetLook=focus.look.clone();
  camera.position.copy(eye);camera.lookAt(look);
  function go(type){const pos=positionTargets[type]||positionTargets.overview;targetEye.copy(pos.eye);targetLook.copy(pos.look)}
  let pointer=null;
  canvas.addEventListener("pointerdown",e=>{pointer={x:e.clientX,y:e.clientY,dragged:false};canvas.setPointerCapture?.(e.pointerId)});
  canvas.addEventListener("pointermove",e=>{
    if(!pointer)return;
    const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer.x=e.clientX;pointer.y=e.clientY;
    if(Math.abs(dx)+Math.abs(dy)>0.5)pointer.dragged=true;
    const offset=targetEye.clone().sub(targetLook);
    const sph=new THREE.Spherical().setFromVector3(offset);
    sph.theta-=dx*.006;sph.phi=THREE.MathUtils.clamp(sph.phi+dy*.006,.22,1.48);
    offset.setFromSpherical(sph);targetEye.copy(targetLook).add(offset);
  });
  canvas.addEventListener("pointerup",e=>{
    if(pointer&&!pointer.dragged){
      const rect=canvas.getBoundingClientRect(),p=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
      const ray=new THREE.Raycaster();ray.setFromCamera(p,camera);
      const hits=ray.intersectObjects([energy,water,farm,coop],true);
      let o=hits[0]?.object;
      while(o&&!o.userData.kind)o=o.parent;
      if(o?.userData.kind)onSelect(o.userData.kind,o.userData.label);
    }
    pointer=null;
  });
  canvas.addEventListener("wheel",e=>{e.preventDefault();const rel=targetEye.clone().sub(targetLook);rel.multiplyScalar(Math.exp(e.deltaY*.001));rel.clampLength(8,100);targetEye.copy(targetLook).add(rel)},{passive:false});
  function resize(){
    const r=canvas.getBoundingClientRect();const w=Math.max(1,r.width),h=Math.max(1,r.height);
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  let data=null;
  function update(snapshot){
    data=snapshot;syncAnimals(snapshot.farm);
    const c=snapshot.config,last=snapshot.last;
    const fillR=snapshot.waterStoredL/c.waterStorageCapacityL;
    fill.scale.y=Math.max(.002,fillR*4.3);
    fill.position.y=Math.max(.008,fillR*4.3)/2;
    batteryCharge.scale.x=Math.max(.01,snapshot.batteryWh/c.batteryCapacityWh);
    pumpLed.intensity=last?.energy.pumpEnabled?3:0;
    inverterLed.intensity=last?.energy.servedBaseWh?2:0;
    const dayHour=snapshot.clock.hourOfDay;
    const daylight=Math.max(0,Math.sin(Math.PI*(dayHour-6)/12));
    sun.intensity=.25+2*daylight;
    hemi.intensity=.85+.8*daylight;
    scene.background.setHSL(.55,.36,.20+.55*daylight);
    scene.fog.color.copy(scene.background);
  }
  let t0=performance.now();
  function animate(now){
    requestAnimationFrame(animate);
    const t=now*.001,dt=Math.max(0,Math.min(.05,(now-t0)/1000));t0=now;
    eye.lerp(targetEye,.08);look.lerp(targetLook,.08);
    camera.position.copy(eye);camera.lookAt(look);
    for(let i=0;i<agents.children.length;i++){
      const a=agents.children[i],v=a.userData;
      a.position.x=v.baseX+Math.sin(t*.63+i*3.2)*.34;
      a.position.z=v.baseZ+Math.cos(t*.49+i*2.1)*.22;
      a.rotation.y=Math.sin(t*.4+i)*.5;
    }
    for(const dot of travelDots){
      dot.mesh.visible=dot.kind==="energy"?!!data?.last?.energy.servedBaseWh:!!data?.last?.energy.pumpEnabled;
      dot.offset=((dot.offset+dt*dot.velocity)%1+1)%1;
      dot.mesh.position.copy(dot.curve.getPoint(dot.offset));
    }
    renderer.render(scene,camera);
  }
  requestAnimationFrame(animate);
  return {update,go,resize,dispose(){observer.disconnect();renderer.dispose()}};
}
