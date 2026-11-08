import * as THREE from "three";

/**
 * Homestead 3D landscape v2: a single physical site, NOT isolated simulation stages.
 * Geometry is illustrative: dimensions/electrical wiring are not installation plans.
 * All animation highlighting comes exclusively from the coordinator snapshot.
 * The original physics and biological models are untouched by this renderer.
 */
export function makeScene(canvas,onSelect=()=>{}){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.setClearColor(0xb9d8e6);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.15;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0xaecbd2,.007);
  scene.background=new THREE.Color(0xb9d8e6);
  const camera=new THREE.PerspectiveCamera(46,1,.15,350);
  const skyLight=new THREE.HemisphereLight(0xe4f5ff,0x667b58,1.85);
  scene.add(skyLight);
  const direct=new THREE.DirectionalLight(0xfff1d9,2.5);
  direct.position.set(-38,60,12);direct.castShadow=true;
  direct.shadow.mapSize.set(2048,2048);
  direct.shadow.camera.left=-86;direct.shadow.camera.right=86;
  direct.shadow.camera.top=75;direct.shadow.camera.bottom=-75;
  direct.shadow.camera.near=1;direct.shadow.camera.far=200;
  direct.shadow.bias=-.00018;scene.add(direct);
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const mat=(color,o={})=>new THREE.MeshStandardMaterial({color,roughness:.86,...o});
  const m={
    grass:mat(0x72965f,{vertexColors:true,side:THREE.DoubleSide}),
    earth:mat(0x9a8a72), path:mat(0xa69b83,{vertexColors:true,side:THREE.DoubleSide}),
    bank:mat(0x6b8971,{vertexColors:true,side:THREE.DoubleSide}),
    creek:mat(0x347f98,{metalness:.12,roughness:.22,transparent:true,opacity:.9,side:THREE.DoubleSide}),
    wood:mat(0x8b6548),cedar:mat(0x9c7856),darkWood:mat(0x5f4939),trim:mat(0xe8d6bc),
    roof:mat(0x46525a,{metalness:.18,roughness:.67}),roofAlt:mat(0x72504b),glass:mat(0xb6ced1,{metalness:.05,roughness:.18}),
    metal:mat(0x91a4a9,{metalness:.71,roughness:.34}),steel:mat(0x353f46,{metalness:.75,roughness:.31}),
    solar:mat(0x101d31,{metalness:.36,roughness:.19}),frame:mat(0x5a636c,{metalness:.66,roughness:.35}),
    pipe:mat(0x55757f,{metalness:.37,roughness:.45}),electric:mat(0x715d40,{metalness:.35}),
    water:mat(0x46a9d0,{metalness:.12,roughness:.16,transparent:true,opacity:.8,side:THREE.DoubleSide}),
    tank:mat(0xc0d0ca,{metalness:.28,roughness:.34,transparent:true,opacity:.48,side:THREE.DoubleSide,depthWrite:false}),
    concrete:mat(0x999f9d),stone:mat(0x85867b),bark:mat(0x564c35),
    foliage:mat(0x426b42,{roughness:.92}),foliage2:mat(0x5c8250,{roughness:.94}),
    straw:mat(0xd0b784),feather:mat(0xcdb394),featherWhite:mat(0xdad5cb),rabbit:mat(0xcfc5ae),pink:mat(0xb28e8b),
    eyes:mat(0x2c2b26,{roughness:.23}),comb:mat(0xb54437),beak:mat(0xc7a25b),
    glow:mat(0xffcf74,{emissive:0xd59c42,emissiveIntensity:.7}),
    flow:mat(0x7ce7f7,{emissive:0x49a4d2,emissiveIntensity:.75})
  };
  const seeded=(n)=>{const x=Math.sin(n*128.213)*43758.5453;return x-Math.floor(x)};
  const terrainY=(x,z)=>{
    const edge=Math.max(0,(Math.abs(x)-39)/26,(Math.abs(z)-28)/22);
    return .18*Math.sin(x*.12)+.22*Math.cos(z*.11)+.15*Math.sin((x+z)*.16)+edge*edge*2.4;
  };
  const at=(x,z,offset=0)=>V(x,terrainY(x,z)+offset,z);
  function mesh(geo,material,x=0,y=0,z=0,cast=true){
    const v=new THREE.Mesh(geo,material);v.position.set(x,y,z);v.castShadow=cast;v.receiveShadow=true;return v;
  }
  const box=(w,h,d,material,x=0,y=0,z=0)=>mesh(new THREE.BoxGeometry(w,h,d),material,x,y,z);
  const cyl=(top,bottom,h,material,x=0,y=0,z=0,n=20)=>mesh(new THREE.CylinderGeometry(top,bottom,h,n),material,x,y,z);
  const ell=(a,b,c,material,x=0,y=0,z=0)=>{const o=mesh(new THREE.SphereGeometry(1,12,9),material,x,y,z);o.scale.set(a,b,c);return o};
  function group(kind,label,x,z){const o=new THREE.Group();o.position.copy(at(x,z));o.userData={kind,label};scene.add(o);return o}
  const selectable=[];
  function select(g){g.traverse(o=>{if(o.isMesh)selectable.push(o)});return g}
  // Continuous, softly undulating and naturally mottled terrain.
  {
    const nx=112,nz=86,v=[],colors=[],indices=[],cc=new THREE.Color();
    for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
      const x=-69+i*138/nx,z=-52+j*104/nz;
      v.push(x,terrainY(x,z)-.2,z);
      const n=.5+seeded(i*91+j*307)*.5;
      cc.setHSL(.275+(n-.5)*.045,.24+n*.1,.31+n*.085);colors.push(cc.r,cc.g,cc.b);
    }
    for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
      const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;indices.push(a,c,b,b,c,d);
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute("position",new THREE.Float32BufferAttribute(v,3));
    g.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
    const ground=mesh(g,m.grass,0,0,0,false);ground.castShadow=false;scene.add(ground);
  }
  // Curving, terrain-following track and stepping paths; not rectangular zoning.
  function ribbon(nodes,width,material,salt=1){
    const curve=new THREE.CatmullRomCurve3(nodes.map(([x,z])=>V(x,0,z)),false,"centripetal",.24);
    const N=110,verts=[],colors=[],indices=[];
    const cl=new THREE.Color();
    for(let k=0;k<=N;k++){
      const t=k/N,p=curve.getPoint(t),tan=curve.getTangent(t),len=Math.hypot(tan.x,tan.z)||1;
      const nx=-tan.z/len,nz=tan.x/len;
      for(let side of [-1,1]){
        const w=width*(.93+.09*Math.sin(t*25+salt));
        const x=p.x+side*nx*w*.5,z=p.z+side*nz*w*.5;
        verts.push(x,terrainY(x,z)+.045+(material===m.creek?.15:0),z);
        const n=seeded(k*7+salt*29+side*3),h=material===m.bank?.30:.10;
        cl.setRGB(.78+(n-.5)*h,.78+(n-.5)*h,.78+(n-.5)*h);
        colors.push(cl.r,cl.g,cl.b);
      }
      if(k<N){const i=k*2;indices.push(i,i+2,i+1,i+1,i+2,i+3)}
    }
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));
    g.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
    const out=mesh(g,material,0,0,0,false);out.castShadow=false;scene.add(out);return curve;
  }
  ribbon([[-53,20],[-44,13],[-31,8],[-15,10],[2,14],[17,17],[38,21]],4.6,m.path,4);
  ribbon([[2,14],[2,4],[-4,-6],[-8,-15]],2.1,m.path,8);
  ribbon([[2,14],[16,6],[23,-4],[30,-14]],2.1,m.path,5);
  ribbon([[-8,-15],[-17,-20],[-27,-18]],1.5,m.path,2);
  const creekNodes=[[-53,-23],[-46,-29],[-36,-34],[-25,-33],[-17,-30],[-8,-34],[0,-41],[14,-45]];
  ribbon(creekNodes,7.1,m.bank,11);
  const streamCurve=ribbon(creekNodes,4.65,m.creek,11);
  // Natural riverbank stones and scattered ground cover.
  const stoneGeometry=new THREE.DodecahedronGeometry(1,0);
  const vegetationGeo=new THREE.ConeGeometry(.12,.72,3);
  const stones=new THREE.InstancedMesh(stoneGeometry,m.stone,110),herbs=new THREE.InstancedMesh(vegetationGeo,m.foliage2,650);
  const dummy=new THREE.Object3D();
  for(let i=0;i<110;i++){
    const t=seeded(i*5.66),p=streamCurve.getPoint(t);
    const angle=i%2?Math.PI/2:-Math.PI/2;
    const tangent=streamCurve.getTangent(t);
    const normal=V(-tangent.z,0,tangent.x).multiplyScalar((3+seeded(i*2.4)*2)* (i%2?1:-1));
    const x=p.x+normal.x,z=p.z+normal.z;
    dummy.position.copy(at(x,z,.12));dummy.rotation.set(seeded(i)*1.4,seedeD(i+30)*Math.PI,seeded(i+70));
    const s=.18+seeded(i*13)*.52;dummy.scale.set(s,s*.6,s*1.2);dummy.updateMatrix();stones.setMatrixAt(i,dummy.matrix);
  }
  function seedeD(x){return seeded(x)}
  stones.castShadow=false;scene.add(stones);
  for(let i=0;i<650;i++){
    const x=-59+seeded(i*47.5)*118,z=-42+seeded(i*72.2)*84;
    if((x>-43&&x<-17&&z>-23&&z<2)||(x>-14&&x<16&&z>-27&&z<0)||(x>18&&x<49&&z>-20&&z<20))continue;
    const s=.5+seeded(i*9)*1.8;dummy.position.copy(at(x,z,.18));
    dummy.rotation.set(0,seeded(i*8)*Math.PI*2,0);dummy.scale.set(s,s,s);dummy.updateMatrix();herbs.setMatrixAt(i,dummy.matrix);
  }
  herbs.instanceMatrix.needsUpdate=true;herbs.castShadow=false;scene.add(herbs);

  // Tree geometry uses shared materials. Placement preserves sightlines across the working systems.
  const trunkGeometry=new THREE.CylinderGeometry(.22,.36,4,7);
  const crownGeometry=new THREE.IcosahedronGeometry(1,1);
  function tree(x,z,scale=1,evergreen=false){
    const root=new THREE.Group();root.position.copy(at(x,z));
    if(evergreen){
      root.add(cyl(.19*scale,.31*scale,3.4*scale,m.bark,0,1.7*scale,0,7));
      for(let k=0;k<3;k++)root.add(mesh(new THREE.ConeGeometry((2.1-k*.39)*scale,(4.7-k*.5)*scale,8),k%2?m.foliage:m.foliage2,0,(3.1+k*.85)*scale,0));
    }else{
      const trunk=mesh(trunkGeometry,m.bark,0,1.9*scale,0);trunk.scale.set(scale,scale,scale);root.add(trunk);
      for(let k=0;k<4;k++){
        const a=k*Math.PI*.64;const leaf=mesh(crownGeometry,k%2?m.foliage:m.foliage2,Math.sin(a)*1.5*scale,(4.0+seeded(k+x)*.7)*scale,Math.cos(a)*1.3*scale);
        leaf.scale.set((1.8+seeded(k*5+x)) *scale,1.75*scale,1.6*scale);root.add(leaf);
      }
    }
    scene.add(root);
  }
  const treeSites=[[-58,39,1.4,1],[-49,35,1.25,1],[-40,43,1.3,0],[-22,40,1.1,0],
    [-4,42,1.4,0],[14,43,1.1,0],[38,39,1.2,1],[52,29,1.25,0],
    [-60,-11,1.4,1],[-54,-42,1.5,1],[-43,-47,1.1,0],[-27,-44,1.0,0],
    [37,-37,1.2,1],[53,-30,1.45,1],[60,-3,1.25,0],[-54,0,1.2,1],
    [56,8,1.3,0],[47,40,1.2,0],[-5,-48,.9,0]];
  treeSites.forEach(([x,z,s,ever])=>tree(x,z,s,!!ever));

  // House and utility outbuilding belong to the same farmyard; no visual boxes as zones.
  const homestead=group("overview","Home and utility loads",6,12);
  homestead.add(box(13,6.0,9.6,m.cedar,0,3,0));
  for(const px of [-4.15,4.15])homestead.add(box(3.2,3.2,.1,m.trim,px,3.3,4.87));
  for(const px of [-4.15,4.15])homestead.add(box(2.75,2.65,.12,m.glass,px,3.35,4.94));
  homestead.add(box(2.2,4,.19,m.darkWood,0,2.1,4.94));
  for(const side of [-1,1]){
    const roof=box(7.6,.36,10.4,m.roof,side*3.2,7.1,0);roof.rotation.z=side*.37;homestead.add(roof);
  }
  homestead.add(box(1.1,3.8,1.1,m.stone,-4,9,0));
  homestead.add(box(14,.3,3.8,m.wood,0,.18,6.5));
  for(const x of [-6,6])for(const z of [5.4,7.65])homestead.add(cyl(.12,.12,1.8,m.wood,x,1.0,z,8));
  const warmWindows=[];
  for(const x of [-4.15,4.15]){
    const w=homestead.children.find(o=>o.isMesh&&Math.abs(o.position.x-x)<.1&&Math.abs(o.position.y-3.35)<.2);
    if(w)warmWindows.push(w);
  }

  // Utility shed with a roof, door, vents; energy equipment is attached to its wall.
  const power=group("energy","Solar inverter and battery", -18,-7);
  power.add(box(8,4.1,6.5,m.wood,0,2.05,0));
  const powerRoof=box(9.2,.35,7.6,m.roof,0,4.5,0);powerRoof.rotation.z=.10;power.add(powerRoof);
  power.add(box(2.3,3.2,.12,m.darkWood,0,1.6,3.31));
  power.add(box(2.5,.09,.12,m.steel,0,3.23,3.39));
  const batteryBox=box(1.65,2.25,1.1,m.steel,-2.5,1.4,3.65);power.add(batteryBox);
  const chargeRail=box(1.13,.13,.075,m.glow,-2.5,2.07,4.27);power.add(chargeRail);
  const inverter=box(1.75,1.5,.65,m.metal,2.4,2.2,3.62);power.add(inverter);
  power.add(box(1.35,.34,.08,m.steel,2.4,2.27,4.01));
  const inverterLed=new THREE.PointLight(0xa3f1e3,0,5);inverterLed.position.set(2.4,2.45,4.4);power.add(inverterLed);
  // Four 435 W panel references, visually grouped 2x2. Dimensions illustrative.
  const panels=group("energy","Ground-mounted solar array",-35,-11);
  function panel(x,z){
    const mount=new THREE.Group();mount.position.set(x,0,z);
    const height=2.15;
    const rack=box(5.35,.22,3.00,m.frame,0,height,0);rack.rotation.x=-.34;mount.add(rack);
    const face=box(5.08,.11,2.76,m.solar,0,height+.12,-.04);face.rotation.x=-.34;mount.add(face);
    for(const dx of [-1.62,0,1.62])mount.add(box(.035,.015,2.7,m.metal,dx,height+.19,-.09));
    for(const dz of [-.72,.72])mount.add(box(5.07,.025,.035,m.metal,0,height+.20,dz));
    for(const dx of [-2,2]){
      mount.add(cyl(.11,.14,1.85,m.steel,dx,.92,-.75,8));
      mount.add(cyl(.11,.14,2.6,m.steel,dx,1.3,.88,8));
    }
    panels.add(mount);
  }
  for(let i=0;i<4;i++)panel((i%2?3.5:-3.5),Math.floor(i/2)*5.8-3);
  // Solar cable and AC feeders — low-profile conceptual routes, not wiring guidance.
  function route(nodes,material,r=.095){
    const curve=new THREE.CatmullRomCurve3(nodes.map(([x,z,h])=>at(x,z,h??.24)),false,"centripetal",.35);
    const o=mesh(new THREE.TubeGeometry(curve,48,r,7,false),material,0,0,0,false);o.castShadow=false;scene.add(o);return curve;
  }
  const pvCable=route([[-35,-9,.23],[-31,-6,.23],[-26,-6,.23],[-22,-4,.55],[-20,-4,1.5]],m.electric,.09);
  const pumpCable=route([[-16,-4,.45],[-12,-9,.24],[-9,-18,.24],[-8,-25,1.0]],m.electric,.09);
  const homeCable=route([[-16,-4,.45],[-10,3,.24],[0,8,.26],[6,8,.6]],m.electric,.09);
  const farmCable=route([[6,8,.6],[15,8,.26],[22,2,.25],[28,-9,.55]],m.electric,.09);

  // Stream intake, pump, vertically arranged filter skids, elevated treated water tank.
  const water=group("water","Water treatment and storage",-7,-23);
  const intake=at(-18,-31,.16),pumpPos=at(-8,-25,.5);
  water.add(box(9,.3,5.8,m.concrete,-.5,.18,0));
  water.add(box(2.8,1.0,2.0,m.steel,-.4,.88,-1.7));
  const motor=cyl(.75,.75,2.3,m.metal,-.4,1.65,-1.7);motor.rotation.z=Math.PI/2;water.add(motor);
  water.add(cyl(.29,.29,.6,m.steel,.7,1.45,-1.7));
  const pumpLight=new THREE.PointLight(0x8bcbd5,0,6);pumpLight.position.set(-.4,1.9,-1.6);water.add(pumpLight);
  // The source model is pump -> reverse osmosis. Visible cartridges represent stages,
  // not three additional treatment units in the numerical solver.
  const skids=[];
  for(let i=0;i<3;i++){
    const cartridge=cyl(.53,.53,3.0,m.tank,2.1+i*1.75,1.78,-1.0);
    water.add(cartridge);
    water.add(cyl(.59,.59,.3,m.steel,2.1+i*1.75,3.4,-1.0));
    skids.push(cartridge);
  }
  water.add(box(7.4,.32,2.8,m.steel,4.0,.4,-1));
  water.add(box(2.0,.8,.28,m.darkWood,4.0,1.95,1.15));
  // Tank positioned uphill from the farm, stainless jacket and actual model water level.
  const tankX=12,tankZ=-17;
  const tank=group("water","Treated-water storage tank",tankX,tankZ);
  tank.add(cyl(3.1,3.1,.28,m.concrete,0,.18,0));
  tank.add(cyl(2.8,2.8,5.2,m.tank,0,2.95,0,30));
  tank.add(cyl(2.95,2.95,.32,m.steel,0,5.64,0,30));
  for(let i=0;i<4;i++)tank.add(cyl(.095,.095,5.1,m.steel,2.67*Math.cos(i*Math.PI/2),2.95,2.67*Math.sin(i*Math.PI/2),8));
  const tankFill=cyl(2.55,2.55,1,m.water,0,1.0,0,30);tank.add(tankFill);
  const tankRim=cyl(2.6,2.6,.03,m.flow,0,1.0,0,30);tank.add(tankRim);
  // Physical visually connected hose route (just above ground).
  const intakeLine=route([[-18,-31,.1],[-14,-30,.24],[-11,-27,.24],[-8,-25,1.1]],m.pipe,.16);
  const filterLine=route([[-8,-25,1.12],[-5,-24,.95],[-2,-24,1.45],[-1,-23,2.1]],m.pipe,.14);
  const fillLine=route([[-1,-23,2.1],[3,-22,.65],[8,-19,.72],[12,-17,5.65]],m.pipe,.13);
  const supplyLine=route([[12,-17,.35],[19,-15,.26],[23,-7,.27],[25,3,.26],[29,5,.8]],m.pipe,.13);
  // Farm coops, animal runs, feeders and hutches share the landscape and treated water.
  const barn=group("farm","Henhouse",30,-10);
  barn.add(box(9,5.5,8.4,m.cedar,0,2.8,0));
  barn.add(box(3.0,3.8,.15,m.darkWood,0,1.9,4.28));
  for(const side of [-1,1]){
    const roof=box(5.3,.38,9.2,m.roofAlt,side*2.4,6.3,0);roof.rotation.z=side*.35;barn.add(roof);
  }
  barn.add(box(2.0,1.7,.12,m.trim,-2.6,3.9,4.3));
  barn.add(box(1.7,1.45,.13,m.glass,-2.6,3.9,4.4));
  barn.add(box(2,1.2,.12,m.trim,2.7,3.9,4.3));
  barn.add(box(1.7,1.0,.13,m.glass,2.7,3.9,4.4));
  const animalArea=group("farm","Pasture, hutches and livestock",30,5);
  const fenceLines=[[[19,-2],[44,-2]],[[44,-2],[47,20]],[[47,20],[18,20]],[[18,20],[19,-2]]];
  function woodFence(a,b){
    const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),num=Math.ceil(len/2.2);
    const dir=V(dx/len,0,dz/len);
    for(let i=0;i<=num;i++){
      const t=i/num,x=a[0]+t*dx,z=a[1]+t*dz,h=terrainY(x,z);
      const post=cyl(.10,.11,1.65,m.wood,x,h+.8,z,7);scene.add(post);
    }
    for(const height of [.55,1.18]){
      const curve=route([[a[0],a[1],height],[b[0],b[1],height]],m.darkWood,.065);
      void curve;
    }
  }
  fenceLines.forEach(([a,b])=>woodFence(a,b));
  const hutches=group("farm","Rabbit hutches",21,11);
  for(const z of [-2.5,2.5]){
    hutches.add(box(7.2,2.15,2.8,m.wood,0,2.2,z));
    hutches.add(box(7.75,.26,3.3,m.roof,0,3.42,z));
    hutches.add(box(6.7,1.35,.09,m.steel,0,2.3,z+1.46));
    for(const x of [-3.2,-1.1,1.1,3.2])hutches.add(cyl(.09,.09,1.2,m.wood,x,.62,z,8));
  }
  const trough=group("farm","Livestock waterer",29,5);
  trough.add(cyl(.95,.95,.88,m.steel,0,.48,0,16));
  trough.add(cyl(.84,.84,.05,m.water,0,.90,0,16));
  trough.add(cyl(.13,.13,2.0,m.pipe,-.2,1.08,0,10));
  const garden=group("farm","Pasture forage patch",39,10);
  for(let row=0;row<5;row++){
    const bed=box(1.4,.12,9.4,m.earth,row*1.65-3.25,.12,0);garden.add(bed);
    for(let i=0;i<9;i++){
      const x=row*1.65-3.25,z=-4+i;
      garden.add(cyl(.1,.03,.4,m.foliage2,x,.43,z,5));
    }
  }

  // Visual animals use the real farm population: species/stage are model fields.
  // Their tiny idle motions are deliberately visual-only (never RNG for biology).
  const agents=new THREE.Group();scene.add(agents);
  const eyeGeo=new THREE.SphereGeometry(.05,6,5);
  function animal(species,id,index){
    const chicken=species==="chicken",o=new THREE.Group();
    const feather=index%3===0?m.featherWhite:m.feather;
    if(chicken){
      o.add(ell(.41,.47,.64,feather,0,.66,0));
      o.add(ell(.28,.29,.29,feather,0,1.02,.39));
      o.add(mesh(new THREE.ConeGeometry(.16,.38,6),m.beak,0,.99,.76).rotateX(Math.PI/2));
      o.add(ell(.10,.22,.09,m.comb,0,1.36,.38));
      for(const side of [-1,1]){
        o.add(ell(.27,.17,.37,feather,side*.30,.69,-.06));
        o.add(cyl(.045,.045,.27,m.beak,side*.17,.2,.07,6));
        o.add(mesh(eyeGeo,m.eyes,side*.245,1.07,.54,false));
      }
      for(let j=0;j<3;j++)o.add(ell(.1,.24,.14,feather,(j-1)*.16,.9,-.59));
    }else{
      o.add(ell(.56,.45,.82,m.rabbit,0,.5,0));
      o.add(ell(.37,.33,.35,m.rabbit,0,.74,.58));
      for(const side of [-1,1]){
        const ear=ell(.13,.45,.16,m.rabbit,side*.2,1.25,.60);ear.rotation.z=side*.15;o.add(ear);
        o.add(ell(.075,.35,.06,m.pink,side*.2,1.28,.74));
        o.add(mesh(eyeGeo,m.eyes,side*.30,.82,.83,false));
        o.add(ell(.27,.2,.32,m.rabbit,side*.34,.25,-.40));
      }
      o.add(ell(.24,.26,.25,m.rabbit,0,.56,-.83));
    }
    const h=seeded(id*31+index*7);
    const ax=chicken?30+(h-.5)*14:21+(h-.5)*5;
    const az=chicken?4+(seeded(id*8+43)-.5)*9:11+(seeded(id*9+50)-.5)*7;
    o.userData={kind:species,id,ax,az,phase:seeded(id*13+50)*Math.PI*2};
    o.position.copy(at(ax,az));
    return o;
  }
  let populationSignature="";
  function syncAnimals(farm){
    const present=(farm?.animals||[]).filter(a=>a.sp==="rabbit"||a.sp==="chicken").slice(0,50);
    const signature=present.map(a=>a.id+":"+a.sp+":"+a.st).join(",");
    if(signature===populationSignature)return;
    populationSignature=signature;
    while(agents.children.length)agents.remove(agents.children[0]);
    present.forEach((a,i)=>{
      const creature=animal(a.sp,Number(a.id)||i+1,i);
      const young=a.st==="kit"||a.st==="chick";creature.scale.setScalar(young?.68:1);
      agents.add(creature);
    });
  }

  // Resource flows follow actual coordinator data and are laid along visible connections.
  const flows=[];
  function addFlow(curve,kind,n,size=.13){
    const geo=new THREE.SphereGeometry(size,7,6);
    const material=kind==="pv"||kind==="pumpPower"||kind==="buildingPower"?m.glow:m.flow;
    for(let i=0;i<n;i++){
      const dot=mesh(geo,material,0,0,0,false);dot.castShadow=false;
      scene.add(dot);flows.push({mesh:dot,curve,kind,phase:i/n,speed:.085+seeded(i+kind.length)*.025});
    }
  }
  addFlow(pvCable,"pv",8);
  addFlow(pumpCable,"pumpPower",7);
  addFlow(homeCable,"buildingPower",8);
  addFlow(farmCable,"buildingPower",8);
  addFlow(intakeLine,"rawWater",6,.11);
  addFlow(filterLine,"rawWater",5,.11);
  addFlow(fillLine,"treatedWater",8,.10);
  addFlow(supplyLine,"animalWater",10,.10);

  // Waypoints frame locations inside one walkable-looking landscape, not tiles.
  const views={
    overview:{eye:V(16,59,91),look:V(0,1.5,-8)},
    energy:{eye:V(-29,21,17),look:V(-29,2,-9)},
    water:{eye:V(5,19,15),look:V(1,2,-23)},
    farm:{eye:V(53,23,33),look:V(31,2,3)}
  };
  let view="overview",moving=false;
  const eye=views.overview.eye.clone(),focus=views.overview.look.clone();
  const toEye=eye.clone(),toLook=focus.clone();
  camera.position.copy(eye);camera.lookAt(focus);
  function go(kind){view=views[kind]?kind:"overview";toEye.copy(views[view].eye);toLook.copy(views[view].look)}
  const ray=new THREE.Raycaster(),pointerMap=new Map();
  let gestureMoved=false;
  canvas.addEventListener("pointerdown",e=>{pointerMap.set(e.pointerId,{x:e.clientX,y:e.clientY});gestureMoved=false;canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener("pointermove",e=>{
    const p=pointerMap.get(e.pointerId);if(!p)return;
    const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    if(Math.abs(dx)+Math.abs(dy)>1)gestureMoved=true;
    if(pointerMap.size===1){
      const offset=toEye.clone().sub(toLook);
      const sph=new THREE.Spherical().setFromVector3(offset);
      sph.theta-=dx*.0048;sph.phi=THREE.MathUtils.clamp(sph.phi+dy*.0048,.24,1.43);
      offset.setFromSpherical(sph);toEye.copy(toLook).add(offset);
    }
  });
  canvas.addEventListener("pointerup",e=>{
    pointerMap.delete(e.pointerId);
    if(gestureMoved)return;
    const r=canvas.getBoundingClientRect(),coords=new THREE.Vector2(
      (e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1
    );
    ray.setFromCamera(coords,camera);
    const hits=ray.intersectObjects(selectable,false);
    if(hits.length){
      let g=hits[0].object;
      while(g&&!g.userData.kind)g=g.parent;
      if(g?.userData.kind)onSelect(g.userData.kind,g.userData.label);
    }
  });
  canvas.addEventListener("pointercancel",e=>pointerMap.delete(e.pointerId));
  canvas.addEventListener("wheel",e=>{
    e.preventDefault();const delta=Math.exp(e.deltaY*.0011);
    const d=toEye.clone().sub(toLook);d.multiplyScalar(delta);d.clampLength(10,140);toEye.copy(toLook).add(d);
  },{passive:false});

  [homestead,power,panels,water,tank,barn,animalArea,hutches,trough,garden].forEach(select);
  const observer=new ResizeObserver(()=>{
    const rect=canvas.getBoundingClientRect();
    const width=Math.max(1,rect.width),height=Math.max(1,rect.height);
    renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
  });observer.observe(canvas);
  let data=null,disposed=false;
  function update(snapshot){
    data=snapshot;syncAnimals(snapshot.farm);
    const last=snapshot.last,c=snapshot.config;
    const ratio=Math.max(0,Math.min(1,snapshot.waterStoredL/Math.max(1,c.waterStorageCapacityL)));
    const height=Math.max(.025,ratio*4.85);
    tankFill.scale.y=height;tankFill.position.y=.40+height*.5;
    tankRim.position.y=.40+height;
    const br=Math.max(.02,snapshot.batteryWh/Math.max(1,c.batteryCapacityWh));
    chargeRail.scale.x=br;
    inverterLed.intensity=last?.energy?.servedBaseWh>0?.85:0;
    pumpLight.intensity=last?.energy?.pumpEnabled?1.0:0;
    const sunLevel=Math.max(0,Math.sin(Math.PI*(snapshot.clock.hourOfDay-6)/12));
    skyLight.intensity=.7+1.25*sunLevel;
    direct.intensity=.18+2.4*sunLevel;
    scene.background.setHSL(.56,.28,.13+sunLevel*.62);
    scene.fog.color.copy(scene.background);
  }
  let previous=performance.now();
  function animate(now){
    if(disposed)return;
    requestAnimationFrame(animate);
    const dt=THREE.MathUtils.clamp((now-previous)/1000,0,.055);previous=now;
    eye.lerp(toEye,.095);focus.lerp(toLook,.095);
    camera.position.copy(eye);camera.lookAt(focus);
    for(let i=0;i<agents.children.length;i++){
      const a=agents.children[i],s=a.userData,phase=now*.0004+s.phase;
      const dist=a.userData.kind==="chicken"?.62:.19;
      const x=s.ax+Math.sin(phase*.8+i)*dist,z=s.az+Math.cos(phase*.9+i*.8)*dist;
      a.position.copy(at(x,z));
      a.rotation.y=phase*.44+i*.35;
      a.position.y+=Math.max(0,Math.sin(phase*4+i))*.028;
    }
    const e=data?.last?.energy,w=data?.last?.water;
    for(const f of flows){
      let present=false;
      if(f.kind==="pv")present=(e?.pvWh||0)>0;
      else if(f.kind==="pumpPower")present=!!e?.pumpEnabled;
      else if(f.kind==="buildingPower")present=(e?.servedBaseWh||0)>0;
      else if(f.kind==="rawWater"||f.kind==="treatedWater")present=(w?.treatedL||0)>0;
      else if(f.kind==="animalWater")present=(w?.consumedL||0)>0;
      f.mesh.visible=present;
      if(present){
        f.phase=((f.phase+dt*f.speed)%1+1)%1;
        f.mesh.position.copy(f.curve.getPoint(f.phase));
      }
    }
    renderer.render(scene,camera);
  }
  requestAnimationFrame(animate);
  return {
    update,go,resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()},
    dispose(){disposed=true;observer.disconnect();renderer.dispose();scene.traverse(obj=>{if(obj.geometry)obj.geometry.dispose()})},
    stats(){return {animals:agents.children.length,paths:flows.length,view,meshes:selectable.length}}
  };
}
