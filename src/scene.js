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
  renderer.toneMappingExposure=1.22;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0xaecbd2,.004);
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
    creek:mat(0x4d838a,{metalness:.08,roughness:.32,transparent:true,opacity:.92,side:THREE.DoubleSide}),
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
  // Small, deterministic procedural PBR maps: locally generated, no external textures.
  // Wood grain, standing-seam roof, and solar cells are visual detail, NOT equipment specs.
  function illustratedTexture(kind){
    const side=512,canvas=document.createElement("canvas");canvas.width=canvas.height=side;
    const ctx=canvas.getContext("2d");let seed=kind.length*2391+97;
    const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
    if(kind==="cedar"||kind==="wood"){
      ctx.fillStyle=kind==="cedar"?"#97785b":"#8d6b4a";ctx.fillRect(0,0,side,side);
      for(let row=0;row<18;row++){
        const y=row*30,light=Math.floor(110+rnd()*48);
        ctx.fillStyle="rgba(240,209,160,.075)";ctx.fillRect(0,y+2,side,24);
        ctx.fillStyle="rgba(30,22,15,.35)";ctx.fillRect(0,y+29,side,2);
        const shift=(row%2)*120;
        for(let x=-shift;x<side;x+=150){
          ctx.fillStyle="rgba(43,32,21,.26)";ctx.fillRect(x,y+2,2,26);
          for(let j=0;j<15;j++){
            ctx.fillStyle=rnd()>.56?"rgba(255,232,180,.09)":"rgba(38,29,18,.09)";
            ctx.fillRect(x+rnd()*150,y+2+rnd()*24,15+rnd()*85,.5+rnd()*1.3);
          }
        }
      }
    }else if(kind==="roof"){
      ctx.fillStyle="#485560";ctx.fillRect(0,0,side,side);
      for(let j=0;j<13;j++){
        const y=j*40,shift=j%2?28:0;
        ctx.fillStyle="rgba(8,19,22,.25)";ctx.fillRect(0,y+38,side,2);
        for(let x=-shift;x<side;x+=60){
          const g=Math.floor(77+rnd()*28);ctx.fillStyle="rgb("+g+","+(g+7)+","+(g+12)+")";
          ctx.fillRect(x+1,y+2,57,35);
          ctx.fillStyle="rgba(232,242,239,.045)";ctx.fillRect(x+4,y+4,51,2);
        }
      }
    }else if(kind==="grass"||kind==="gravel"||kind==="river"){
      const base=kind==="grass"?"#79945d":kind==="gravel"?"#968b73":"#5a98a3";
      ctx.fillStyle=base;ctx.fillRect(0,0,side,side);
      const count=kind==="grass"?23000:kind==="gravel"?15000:2300;
      for(let i=0;i<count;i++){
        const x=rnd()*side,y=rnd()*side,v=rnd();
        if(kind==="grass"){
          ctx.strokeStyle=v>.5?"rgba(43,82,40,.20)":"rgba(204,213,130,.17)";
          ctx.lineWidth=.6+rnd()*.85;ctx.beginPath();
          ctx.moveTo(x,y);ctx.lineTo(x+(rnd()-.5)*3,y-2-rnd()*5);ctx.stroke();
        }else if(kind==="gravel"){
          ctx.fillStyle=v>.5?"rgba(42,41,34,.25)":"rgba(239,234,216,.20)";
          const sz=.3+rnd()*2.4;ctx.fillRect(x,y,sz,sz*.75);
        }else{
          ctx.strokeStyle=v>.5?"rgba(225,250,243,.21)":"rgba(17,88,122,.21)";
          ctx.lineWidth=.6+rnd()*1.6;ctx.beginPath();
          ctx.moveTo(x,y);ctx.quadraticCurveTo(x+4,y-1,x+13+rnd()*23,y);ctx.stroke();
        }
      }
    }else if(kind==="solar"){
      ctx.fillStyle="#131c35";ctx.fillRect(0,0,side,side);
      for(let row=0;row<6;row++)for(let col=0;col<10;col++){
        const x=col*51.2,y=row*85.3;
        const a=Math.floor(25+rnd()*12),b=Math.floor(42+rnd()*11);
        ctx.fillStyle="rgb("+a+","+(b+4)+","+(b+23)+")";ctx.fillRect(x+2,y+2,47,80);
        ctx.strokeStyle="rgba(138,175,205,.26)";ctx.lineWidth=.7;
        for(let k=1;k<5;k++){ctx.beginPath();ctx.moveTo(x+2+k*9.4,y+4);ctx.lineTo(x+2+k*9.4,y+80);ctx.stroke()}
        ctx.fillStyle="rgba(181,206,218,.22)";ctx.fillRect(x+1,y+41,49,.7);
      }
    }
    const tex=new THREE.CanvasTexture(canvas);
    tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
    tex.wrapS=THREE.RepeatWrapping;tex.wrapT=THREE.RepeatWrapping;
    return tex;
  }
  m.cedar.map=illustratedTexture("cedar");m.cedar.color.set(0xffffff);m.cedar.needsUpdate=true;
  m.wood.map=illustratedTexture("wood");m.wood.color.set(0xffffff);m.wood.needsUpdate=true;
  m.roof.map=illustratedTexture("roof");m.roof.color.set(0xffffff);m.roof.needsUpdate=true;
  m.roofAlt.map=m.roof.map;m.roofAlt.color.set(0xd4bcb0);m.roofAlt.needsUpdate=true;
  m.solar.map=illustratedTexture("solar");m.solar.color.set(0xffffff);m.solar.needsUpdate=true;
  m.grass.map=illustratedTexture("grass");m.grass.color.set(0xf0f8ec);m.grass.needsUpdate=true;
  m.path.map=illustratedTexture("gravel");m.path.needsUpdate=true;
  m.creek.map=illustratedTexture("river");m.creek.needsUpdate=true;

  const seeded=(n)=>{const x=Math.sin(n*128.213)*43758.5453;return x-Math.floor(x)};
  // Depress the actual terrain under the existing creek; the stream no longer floats
  // above grass. Stream location is artwork, not a hydrological catchment model.
  const creekNodes=[[-53,-23],[-46,-29],[-36,-34],[-25,-33],[-17,-30],[-8,-34],[0,-41],[14,-45]];
  function creekDistance(x,z){
    let distance=Infinity;
    for(let i=1;i<creekNodes.length;i++){
      const [ax,az]=creekNodes[i-1],[bx,bz]=creekNodes[i];
      const vx=bx-ax,vz=bz-az;
      const t=THREE.MathUtils.clamp(((x-ax)*vx+(z-az)*vz)/(vx*vx+vz*vz),0,1);
      distance=Math.min(distance,Math.hypot(x-(ax+t*vx),z-(az+t*vz)));
    }
    return distance;
  }
  const terrainY=(x,z)=>{
    const edge=Math.max(0,(Math.abs(x)-39)/26,(Math.abs(z)-28)/22);
    const base=.18*Math.sin(x*.12)+.22*Math.cos(z*.11)+.15*Math.sin((x+z)*.16)+edge*edge*2.4;
    const channel=THREE.MathUtils.clamp(1-creekDistance(x,z)/8,0,1);
    return base-.80*channel*channel;
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
    const nx=156,nz=122,v=[],uv=[],colors=[],indices=[],cc=new THREE.Color();
    for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
      const x=-150+i*300/nx,z=-125+j*250/nz;
      v.push(x,terrainY(x,z)-.2,z);uv.push(i/nx*26,j/nz*23);
      const n=.5+seeded(i*91+j*307)*.5;
      cc.setHSL(.275+(n-.5)*.045,.24+n*.1,.31+n*.085);colors.push(cc.r,cc.g,cc.b);
    }
    for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
      const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;indices.push(a,c,b,b,c,d);
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute("position",new THREE.Float32BufferAttribute(v,3));
    g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
    g.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
    const ground=mesh(g,m.grass,0,0,0,false);ground.castShadow=false;scene.add(ground);
  }
  // Curving, terrain-following track and stepping paths; not rectangular zoning.
  function ribbon(nodes,width,material,salt=1){
    const curve=new THREE.CatmullRomCurve3(nodes.map(([x,z])=>V(x,0,z)),false,"centripetal",.24);
    const N=110,verts=[],uv=[],colors=[],indices=[];
    const cl=new THREE.Color();
    for(let k=0;k<=N;k++){
      const t=k/N,p=curve.getPoint(t),tan=curve.getTangent(t),len=Math.hypot(tan.x,tan.z)||1;
      const nx=-tan.z/len,nz=tan.x/len;
      for(let side of [-1,1]){
        const w=width*(.93+.09*Math.sin(t*25+salt));
        const x=p.x+side*nx*w*.5,z=p.z+side*nz*w*.5;
        verts.push(x,terrainY(x,z)+.045+(material===m.creek?0.15:0),z);
        uv.push(t*14,side===-1?0:1);
        const n=seeded(k*7+salt*29+side*3),h=material===m.bank?0.30:0.10;
        cl.setRGB(.78+(n-.5)*h,.78+(n-.5)*h,.78+(n-.5)*h);
        colors.push(cl.r,cl.g,cl.b);
      }
      if(k<N){const i=k*2;indices.push(i,i+2,i+1,i+1,i+2,i+3)}
    }
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));
    g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
    g.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
    const out=mesh(g,material,0,0,0,false);out.castShadow=false;scene.add(out);return curve;
  }
  ribbon([[-53,20],[-44,13],[-31,8],[-15,10],[2,14],[17,17],[38,21]],4.6,m.path,4);
  ribbon([[2,14],[2,4],[-4,-6],[-8,-15]],2.1,m.path,8);
  ribbon([[2,14],[16,6],[23,-4],[30,-14]],2.1,m.path,5);
  ribbon([[-8,-15],[-17,-20],[-27,-18]],1.5,m.path,2);
  // Separate shoreline strips: a full-width bank ribbon would render OVER the
  // recessed water and visually erase it (caught in desktop/mobile CI images).
  function shoreline(offset){
    return creekNodes.map(([x,z],i)=>{
      const before=creekNodes[Math.max(i-1,0)],after=creekNodes[Math.min(i+1,creekNodes.length-1)];
      const dx=after[0]-before[0],dz=after[1]-before[1],len=Math.hypot(dx,dz)||1;
      return [x-dz/len*offset,z+dx/len*offset];
    });
  }
  ribbon(shoreline(3.5),1.4,m.bank,11);
  ribbon(shoreline(-3.5),1.4,m.bank,12);
  const streamCurve=ribbon(creekNodes,4.65,m.creek,11);
  // Natural riverbank stones and scattered ground cover.
  const stoneGeometry=new THREE.DodecahedronGeometry(1,0);
  // Multi-blade foliage clumps: a small instanced mesh replaces the black-looking
  // single cones seen in CI screenshots. Natural variation is geometry/color only.
  function grassClumpGeometry(){
    const points=[],colors=[];
    const palette=[0x6a945c,0x7ba05c,0x5e8554,0x8ba96a,0x648c4c];
    for(let b=0;b<5;b++){
      const a=b*Math.PI*2/5,dx=Math.cos(a),dz=Math.sin(a);
      const sideX=-dz*.067,sideZ=dx*.067;
      const px=dx*.085,pz=dz*.085,tip=.13+(b%2)*.11;
      points.push(px-sideX,0,pz-sideZ,px+sideX,0,pz+sideZ,px+dx*tip,.40+(b%3)*.13,pz+dz*tip);
      const tint=new THREE.Color(palette[b]);
      for(let i=0;i<3;i++)colors.push(tint.r,tint.g,tint.b);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute("position",new THREE.Float32BufferAttribute(points,3));
    geo.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
    geo.computeVertexNormals();return geo;
  }
  const vegetationGeo=grassClumpGeometry();
  const vegetationMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.97,side:THREE.DoubleSide,vertexColors:true});
  const stones=new THREE.InstancedMesh(stoneGeometry,m.stone,110),herbs=new THREE.InstancedMesh(vegetationGeo,vegetationMaterial,2800);
  const dummy=new THREE.Object3D();
  for(let i=0;i<110;i++){
    const t=seeded(i*5.66),p=streamCurve.getPoint(t);
    const angle=i%2?Math.PI/2:-Math.PI/2;
    const tangent=streamCurve.getTangent(t);
    const normal=V(-tangent.z,0,tangent.x).multiplyScalar((3+seeded(i*2.4)*2)* (i%2?1:-1));
    const x=p.x+normal.x,z=p.z+normal.z;
    dummy.position.copy(at(x,z,.12));dummy.rotation.set(seeded(i)*1.4,seeded(i+30)*Math.PI,seeded(i+70));
    const s=.18+seeded(i*13)*.52;dummy.scale.set(s,s*.6,s*1.2);dummy.updateMatrix();stones.setMatrixAt(i,dummy.matrix);
  }
  stones.castShadow=false;scene.add(stones);
  let herbCount=0;
  for(let i=0;i<2800;i++){
    const x=-74+seeded(i*47.5)*148,z=-54+seeded(i*72.2)*108;
    if(creekDistance(x,z)<3.7||(x>-43&&x<-17&&z>-23&&z<2)||(x>-14&&x<16&&z>-27&&z<0)||(x>18&&x<49&&z>-20&&z<20))continue;
    const s=.5+seeded(i*9)*1.8;dummy.position.copy(at(x,z,.025));
    dummy.rotation.set(0,seeded(i*8)*Math.PI*2,0);dummy.scale.set(s,s,s);dummy.updateMatrix();herbs.setMatrixAt(herbCount++,dummy.matrix);
  }
  herbs.count=herbCount;herbs.instanceMatrix.needsUpdate=true;herbs.castShadow=false;scene.add(herbs);

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
      // Clustered irregular canopy and woody branches: no perfect "lollipop" spheres.
      for(let k=0;k<13;k++){
        const a=k*2.39996,rad=(1.1+seeded(k*.73+x)*1.65)*scale;
        const spread=V(Math.sin(a)*rad,0,Math.cos(a)*rad);
        const branch=cyl(.07*scale,.13*scale,rad*1.5,m.bark,spread.x*.32,(3.8+seeded(k+z)*.6)*scale,spread.z*.32,6);
        branch.rotation.z=-Math.sin(a)*.56;branch.rotation.x=Math.cos(a)*.56;root.add(branch);
        const leaf=mesh(crownGeometry,k%3?m.foliage:m.foliage2,spread.x,(4.2+seeded(k+x)*1.1)*scale,spread.z);
        const r=(.86+seeded(k*5+x)*.66)*scale;
        leaf.scale.set(r*1.13,r*.87,r);leaf.rotation.set(seeded(k*18)*.8,k*.7,.17);root.add(leaf);
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
  // Traditional framed window divisions avoid untextured billboard rectangles.
  for(const px of [-4.15,4.15]){
    homestead.add(box(.075,2.8,.11,m.trim,px,3.35,5.04));
    homestead.add(box(2.92,.075,.11,m.trim,px,3.35,5.04));
  }
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
  // Water Simulator source/ui.js buildPart('pump'/'ro'): upgrade its simple
  // cylinder + rotor vocabulary into an illustrative motor/pump and RO assembly.
  // These are NOT manufacturer-specific dimensions or additional modeled stages.
  const motorShell=mat(0x718b91,{metalness:.78,roughness:.36});
  const motorEnd=mat(0x394b55,{metalness:.72,roughness:.44});
  const roShell=mat(0xe6ebeb,{metalness:.12,roughness:.36});
  const roCollar=mat(0x2c5365,{metalness:.38,roughness:.40});
  const brass=mat(0xb99c62,{metalness:.68,roughness:.31});
  const motorFins=new THREE.Group();
  motorFins.position.set(-.4,1.65,-1.7);
  // Fins follow the existing horizontal motor silhouette without changing the pump curve.
  for(let i=0;i<11;i++){
    const x=-.95+i*.19;
    for(let k=0;k<12;k++){
      const a=k*Math.PI/6;
      const fin=box(.065,.17,.24,motorShell,x,.74*Math.cos(a),.74*Math.sin(a));
      fin.rotation.x=a;motorFins.add(fin);
    }
  }
  water.add(motorFins);
  const pumpFan=new THREE.Group();pumpFan.position.set(-1.60,1.65,-1.7);
  pumpFan.add(cyl(.18,.18,.10,motorEnd,0,0,0,16));
  for(let k=0;k<7;k++){
    const blade=box(.08,.39,.07,motorShell,.25*Math.cos(k*Math.PI*2/7),.25*Math.sin(k*Math.PI*2/7),0);
    blade.rotation.z=k*Math.PI*2/7;pumpFan.add(blade);
  }
  water.add(pumpFan);
  const motorGuard=cyl(.80,.80,.16,motorEnd,-1.69,1.65,-1.7,24);
  motorGuard.rotation.z=Math.PI/2;water.add(motorGuard);
  for(let i=0;i<4;i++){
    const foot=box(.44,.12,.46,motorEnd,-1.20+i*.46,.38,-1.7);
    water.add(foot);
  }
  // Visible flange and bolts are presentation details, not hydraulic junctions.
  const pumpFlange=cyl(.53,.53,.14,brass,.90,1.45,-1.7,18);
  pumpFlange.rotation.z=Math.PI/2;water.add(pumpFlange);
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;
    const bolt=cyl(.07,.07,.14,m.steel,1.0,1.45+.40*Math.sin(a),-1.7+.40*Math.cos(a),8);
    bolt.rotation.z=Math.PI/2;water.add(bolt);
  }
  // Gauge face is intentionally uncalibrated; a fixed pointer must not imply psi.
  const gauge= new THREE.Group();gauge.position.set(.65,2.48,-1.7);
  gauge.add(cyl(.25,.25,.12,m.steel,0,0,0,24));
  gauge.add(cyl(.20,.20,.13,roShell,0,0,.06,24));
  gauge.add(box(.025,.17,.015,m.darkWood,0,.02,.142));
  water.add(gauge);

  // The source model is pump -> reverse osmosis. Visible cartridges represent stages,
  // not three additional treatment units in the numerical solver.

  const skids=[];
  // Three parallel visual housings stand for one modeled RO unit. They are
  // not separate solver nodes and do not promise a three-stage treatment train.
  water.add(box(7.4,.32,2.8,m.steel,4.0,.4,-1));
  for(let i=0;i<3;i++){
    const x=2.1+i*1.75;
    const cartridge=cyl(.52,.52,2.85,roShell,x,1.90,-1.0,28);
    water.add(cartridge);skids.push(cartridge);
    water.add(cyl(.60,.60,.27,roCollar,x,3.47,-1.0,28));
    water.add(cyl(.60,.60,.25,roCollar,x,.39,-1.0,28));
    water.add(cyl(.17,.17,.19,brass,x,3.66,-1.0,12));
    water.add(cyl(.17,.17,.17,brass,x,.26,-1.0,12));
    for(const z of [-1.63,-.37]){
      water.add(box(.13,3.0,.11,m.steel,x,1.95,z));
    }
    // Opaque service stripes improve legibility from an oblique camera.
    for(const y of [1.05,2.9])water.add(cyl(.535,.535,.08,roCollar,x,y,-1.0,28));
  }
  // Service manifolds and return line visually connect the housings, rather
  // than suggesting three unrelated independent filter devices.
  function localTube(points,radius,material){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>V(...p)),false,"centripetal");
    const pipe=mesh(new THREE.TubeGeometry(curve,32,radius,10),material,0,0,0,false);
    pipe.castShadow=false;water.add(pipe);
  }
  localTube([[2.1,3.78,-1],[3.85,3.78,-1],[5.6,3.78,-1]],.095,m.pipe);
  localTube([[2.1,.17,-1],[3.85,.17,-1],[5.6,.17,-1]],.085,m.pipe);
  localTube([[.9,1.5,-1.7],[1.1,1.5,-1.7],[1.1,3.78,-1],[2.1,3.78,-1]],.085,m.pipe);
  localTube([[5.6,.17,-1],[6.6,.17,-1],[6.6,.6,.1]],.08,m.pipe);
  for(const x of [2.1,3.85,5.6]){
    water.add(cyl(.17,.17,.16,brass,x,3.8,-1,12));
  }
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
  // Water Simulator source/ui.js: water surfaces respond to measured inventory and solver output.
  // These subdued concentric rings are purely visual; they do not calculate hydraulic flow.
  const tankRipples=[];
  for(let i=0;i<3;i++){
    const ring=new THREE.Mesh(
      new THREE.RingGeometry(1.0,1.045,48),
      new THREE.MeshBasicMaterial({color:0xd1f4ff,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false})
    );
    ring.rotation.x=-Math.PI/2;ring.visible=false;tank.add(ring);tankRipples.push(ring);
  }

  // Physical visually connected hose route (just above ground).
  const intakeLine=route([[-18,-31,.1],[-14,-30,.24],[-11,-27,.24],[-8,-25,1.1]],m.pipe,.16);
  const filterLine=route([[-8,-25,1.12],[-5,-24,.95],[-2,-24,1.45],[-1,-23,2.1]],m.pipe,.14);
  const fillLine=route([[-1,-23,2.1],[3,-22,.65],[8,-19,.72],[12,-17,5.65]],m.pipe,.13);
  const supplyLine=route([[12,-17,.35],[19,-15,.26],[23,-7,.27],[25,3,.26],[29,5,.8]],m.pipe,.13);
  // Farm-sim world/draw.js: represent actual enclosure features (battens,
  // ventilators, pop-door, ramp, nest access and fixtures) without inventing
  // extra biological model entities. All fixture levels are intentionally
  // UNSPECIFIED because they are not supplied per fixture by this snapshot.
  const screenWire=new THREE.LineBasicMaterial({color:0xb7c5c3,transparent:true,opacity:.64,depthWrite:false});
  const bottleGlass=mat(0xb6e2eb,{metalness:.05,roughness:.12,transparent:true,opacity:.42,depthWrite:false});
  let housingScreenCount=0,illustrativeCageDoors=0;
  function enclosureScreen(target,x0,y0,z,w,h,dx=.27,dy=.26){
    const v=[];
    const nx=Math.ceil(w/dx),ny=Math.ceil(h/dy);
    for(let n=0;n<=nx;n++){
      const x=x0+w*n/nx;v.push(x,y0,z,x,y0+h,z);
    }
    for(let n=0;n<=ny;n++){
      const y=y0+h*n/ny;v.push(x0,y,z,x0+w,y,z);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.Float32BufferAttribute(v,3));
    const screen=new THREE.LineSegments(geometry,screenWire);
    screen.castShadow=false;screen.receiveShadow=false;
    target.add(screen);housingScreenCount++;
    return screen;
  }
  const barn=group("farm","Henhouse",30,-10);
  // Continuous siding is textured wood; trim gives the coop construction-scale detail.
  barn.add(box(9.35,.32,8.8,m.stone,0,.16,0));
  barn.add(box(9,5.5,8.4,m.cedar,0,2.8,0));
  for(const x of [-4.4,-3.55,-2.7,-1.85,1.85,2.7,3.55,4.4]){
    barn.add(box(.07,5.05,.095,m.trim,x,2.87,4.27));
  }
  for(const z of [-3.99,4.28]){
    barn.add(box(9.25,.19,.14,m.darkWood,0,.49,z));
    barn.add(box(9.25,.14,.14,m.trim,0,5.43,z));
  }
  const coopDoor=box(2.48,3.5,.15,m.darkWood,0,1.89,4.30);barn.add(coopDoor);
  for(const x of [-1.28,1.28])barn.add(box(.14,3.55,.19,m.trim,x,1.91,4.39));
  barn.add(box(2.70,.17,.19,m.trim,0,3.72,4.39));
  barn.add(cyl(.09,.09,.09,m.metal,.91,1.98,4.48,10));
  // Correct the original inverted (valley) roof: ridge higher than eaves.
  for(const side of [-1,1]){
    const roof=box(5.35,.32,9.35,m.roofAlt,side*2.43,6.35,0);
    roof.rotation.z=-side*.35;barn.add(roof);
    const fascia=box(.22,.24,9.5,m.trim,side*4.93,5.48,0);
    fascia.rotation.z=-side*.35;barn.add(fascia);
  }
  barn.add(box(.37,.26,9.7,m.roof,0,7.12,0));
  // Gable ventilation louvers, roof eaves and illuminated-looking windows.
  for(const y of [5.47,5.66,5.85]){
    barn.add(box(1.24,.08,.14,m.darkWood,0,y,4.31));
  }
  for(const x of [-2.65,2.65]){
    barn.add(box(1.83,1.53,.12,m.trim,x,3.93,4.33));
    barn.add(box(1.58,1.27,.11,m.glass,x,3.93,4.41));
    barn.add(box(.08,1.36,.12,m.trim,x,3.93,4.49));
    barn.add(box(1.66,.07,.12,m.trim,x,3.93,4.49));
    barn.add(box(2.03,.14,.30,m.wood,x,3.12,4.46));
  }
  // Illustration of the exterior nest-access hatch; boxes do not alter egg count.
  for(const z of [-2.1,0,2.1]){
    barn.add(box(1.12,1.23,1.57,m.wood,4.96,2.60,z));
    const lid=box(1.50,.16,1.92,m.roofAlt,5.01,3.27,z);
    lid.rotation.z=-.18;barn.add(lid);
    barn.add(box(.62,.11,.11,m.metal,5.60,2.48,z));
  }
  // Cleated entry ramp into the fenced run. Static facade: no automatic-door claim.
  const ramp=box(2.15,.17,4.25,m.wood,0,.82,6.38);
  ramp.rotation.x=.235;barn.add(ramp);
  for(const zz of [4.95,5.58,6.21,6.84,7.47]){
    const yy=.82-(zz-6.38)*Math.sin(.235)+.12;
    const rung=box(2.08,.10,.19,m.trim,0,yy,zz);
    rung.rotation.x=.235;barn.add(rung);
  }
  for(const x of [-1.08,1.08]){
    const sideRail=box(.12,.25,4.36,m.darkWood,x,.99,6.36);
    sideRail.rotation.x=.235;barn.add(sideRail);
  }
  // A small illustrative feed trough; its contents are deliberately not drawn
  // because this coordinator exposes aggregate feed demand, not fixture inventory.
  barn.add(box(2.5,.25,.67,m.steel,2.9,.64,6.0));
  barn.add(box(2.24,.055,.48,m.darkWood,2.9,.79,6.0));
  for(const x of [1.87,3.93])barn.add(box(.16,.65,.20,m.wood,x,.33,6.0));
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
  // Reuse Farm's raised wire-floor hutches, outside feeders/water bottles,
  // nest boxes and cage-door hinge/latch vocabulary. The geometries represent
  // illustrative fixtures, NOT individually inventoried or calibrated cages.
  for(const z of [-2.5,2.5]){
    hutches.add(box(7.45,.19,3.05,m.wood,0,1.35,z)); // raised wire floor support
    hutches.add(box(7.35,.22,3.05,m.steel,0,1.02,z)); // removable dropping tray
    hutches.add(box(7.24,1.78,.15,m.cedar,0,2.38,z-1.45)); // windward back wall
    for(const x of [-3.55,3.55]){
      hutches.add(box(.15,1.73,2.85,m.wood,x,2.38,z));
    }
    const roof=box(7.85,.24,3.58,m.roof,0,3.48,z);
    roof.rotation.x=-.09;hutches.add(roof);
    hutches.add(box(7.85,.14,.13,m.trim,0,3.33,z+1.77));
    for(const x of [-3.40,-1.15,1.15,3.40]){
      hutches.add(box(.14,2.12,.17,m.wood,x,2.36,z+1.44));
      hutches.add(cyl(.105,.12,2.92,m.wood,x,1.51,z-1.1,9));
      hutches.add(cyl(.105,.12,2.92,m.wood,x,1.51,z+1.10,9));
    }
    for(const xx of [-1.14,1.14]){
      hutches.add(box(.13,1.66,2.8,m.cedar,xx,2.39,z));
    }
    // One continuous screen, then three framed service doors and hinged latches.
    enclosureScreen(hutches,-3.42,1.52,z+1.48,6.84,1.68,.24,.27);
    for(const cx of [-2.27,0,2.27]){
      for(const x of [cx-1.01,cx+1.01]){
        hutches.add(box(.055,1.56,.078,m.steel,x,2.38,z+1.53));
      }
      for(const y of [1.61,3.15]){
        hutches.add(box(2.08,.063,.075,m.steel,cx,y,z+1.53));
      }
      for(const y of [1.94,2.91]){
        hutches.add(cyl(.071,.071,.105,m.metal,cx-.99,y,z+1.62,9));
      }
      hutches.add(box(.22,.075,.16,m.metal,cx+.88,2.31,z+1.62));
      illustrativeCageDoors++;
      // Feed hopper is shown empty: aggregate farm feed allocation is not a
      // per-hopper fill measurement.
      hutches.add(box(.54,.66,.38,m.steel,cx-.64,2.52,z+1.77));
      hutches.add(box(.60,.07,.44,m.metal,cx-.64,2.88,z+1.77));
      hutches.add(box(.48,.11,.20,m.darkWood,cx-.64,2.19,z+1.59));
      // Wall-mounted translucent bottle + exterior clip + drinking nipple.
      hutches.add(cyl(.18,.18,.67,bottleGlass,cx+.57,2.64,z+1.72,16));
      hutches.add(cyl(.21,.21,.09,m.steel,cx+.57,3.01,z+1.72,16));
      hutches.add(box(.10,.12,.19,m.metal,cx+.57,2.30,z+1.55));
      const nipple=cyl(.048,.048,.32,m.metal,cx+.57,2.26,z+1.42,8);
      nipple.rotation.x=Math.PI/2;hutches.add(nipple);
      // A modest closed nest compartment visible behind the wired door.
      hutches.add(box(.73,.73,.81,m.wood,cx+.68,1.92,z-.72));
      hutches.add(box(.34,.35,.025,m.darkWood,cx+.68,1.93,z-.29));
      hutches.add(box(.87,.09,.96,m.roof,cx+.68,2.34,z-.72));
    }
  }
  const trough=group("farm","Livestock waterer",29,5);
  trough.add(cyl(.95,.95,.88,m.steel,0,.48,0,16));
  const troughWater=cyl(.84,.84,.05,m.water,0,.90,0,16);trough.add(troughWater);
  trough.add(cyl(.13,.13,2.0,m.pipe,-.2,1.08,0,10));
  const garden=group("farm","Pasture forage patch",39,10);
  for(let row=0;row<5;row++){
    const bed=box(1.4,.12,9.4,m.earth,row*1.65-3.25,.12,0);garden.add(bed);
    for(let i=0;i<9;i++){
      const x=row*1.65-3.25,z=-4+i;
      garden.add(cyl(.1,.03,.4,m.foliage2,x,.43,z,5));
      for(const side of [-1,1]){
        const leaf=ell(.24,.085,.43,m.foliage2,x+side*.16,.62,z+side*.13);
        leaf.rotation.z=side*.35;garden.add(leaf);
      }
    }
  }

  // Visual animals use the real farm population: species/stage are model fields.
  // Their tiny idle motions are deliberately visual-only (never RNG for biology).
  const agents=new THREE.Group();scene.add(agents);
  // Visual vocabulary adapted from the user's Farm Simulator:
  // source/src/world/agents.js (RAB / HEN palettes and species movement) and
  // world/looks.js (life-stage distinctions) and world/physics.js (rabbit hopping).
  // This is a distinct Three.js illustration layer. It does NOT run or alter farm biology.
  const rabbitColors=[0xefeae2,0x8b6a4e,0x3b3734,0xc9a27c,0x9c9c9c];
  const chickenColors=[0x8a3f17,0xf3efe4,0x2a2a2a,0xc9a062];
  const animalMaterialCache=new Map(),eyeGeo=new THREE.SphereGeometry(.055,9,7);
  function coat(species,id,shade=false){
    const palette=species==="chicken"?chickenColors:rabbitColors;
    const slot=Math.floor(seeded(id*3.71)*palette.length);
    const key=species+":"+slot+":"+shade;
    if(!animalMaterialCache.has(key)){
      const color=new THREE.Color(palette[slot]);
      if(shade)color.multiplyScalar(.77);
      animalMaterialCache.set(key,mat(color,{roughness:.96}));
    }
    return animalMaterialCache.get(key);
  }
  function animal(a,index){
    const species=a.sp,id=Number(a.id)||index+1,chicken=species==="chicken";
    const o=new THREE.Group(),base=coat(species,id),darker=coat(species,id,true);
    const head=new THREE.Group(),limbs=[],wings=[],ears=[];
    o.add(head);
    if(chicken){
      o.add(ell(.46,.43,.65,base,0,.65,0));
      const tail=new THREE.Group();tail.position.set(0,.75,-.54);
      for(const side of [-1,0,1]){
        const feather=ell(.105,.26,.20,darker,side*.13,.12,-.10);
        feather.rotation.x=-.35;tail.add(feather);
      }
      o.add(tail);
      head.position.set(0,.83,.37);
      head.add(ell(.29,.31,.30,base,0,.19,.11));
      const beak=mesh(new THREE.ConeGeometry(.145,.34,7),m.beak,0,.11,.44);
      beak.rotation.x=Math.PI/2;head.add(beak);
      head.add(ell(.105,.20,.09,m.comb,0,.52,.08));
      for(const side of [-1,1]){
        const wing=ell(.21,.18,.43,darker,side*.34,.75,-.08);
        o.add(wing);wings.push(wing);
        head.add(mesh(eyeGeo,m.eyes,side*.252,.24,.29,false));
        const leg=new THREE.Group();leg.position.set(side*.19,.35,.10);
        leg.add(cyl(.045,.053,.30,m.beak,0,-.16,0,7));
        for(const toe of [-1,0,1])leg.add(box(.055,.045,.22,m.beak,toe*.075,-.30,.12));
        o.add(leg);limbs.push(leg);
      }
    }else{
      o.add(ell(.56,.42,.80,base,0,.52,0));
      o.add(ell(.23,.23,.22,base,0,.56,-.77)); // tail
      head.position.set(0,.67,.56);
      head.add(ell(.36,.33,.34,base,0,.08,.07));
      for(const side of [-1,1]){
        const ear=new THREE.Group();ear.position.set(side*.20,.37,.00);
        const fur=ell(.14,.46,.17,base,0,.36,0);fur.rotation.z=-side*.09;ear.add(fur);
        const inside=ell(.076,.34,.055,m.pink,0,.36,.145);inside.rotation.z=-side*.09;ear.add(inside);
        head.add(ear);ears.push(ear);
        head.add(mesh(eyeGeo,m.eyes,side*.295,.14,.31,false));
        head.add(ell(.19,.12,.16,base,side*.15,-.09,.29));
        const paw=new THREE.Group();paw.position.set(side*.36,.28,.27);
        paw.add(ell(.17,.11,.25,darker,0,0,.08));o.add(paw);limbs.push(paw);
      }
      head.add(ell(.09,.075,.09,m.pink,0,.005,.41));
    }
    const h=seeded(id*31+index*7);
    const ax=chicken?30+(h-.5)*14:21+(h-.5)*5;
    const az=chicken?4+(seeded(id*8+43)-.5)*9:11+(seeded(id*9+50)-.5)*7;
    o.userData={kind:species,id,ax,az,phase:seeded(id*13+50)*Math.PI*2,
      head,limbs,wings,ears,health:100,stage:a.st,age:Number(a.age)||0};
    o.position.copy(at(ax,az));
    return o;
  }
  let populationSignature="";
  function syncAnimals(farm){
    // Match ONLY actual model records, including entry/exit. Never instantiate invented livestock.
    const present=(farm?.animals||[]).filter(a=>a.sp==="rabbit"||a.sp==="chicken").slice(0,50);
    const signature=present.map(a=>a.id+":"+a.sp+":"+a.st).join(",");
    if(signature!==populationSignature){
      populationSignature=signature;
      while(agents.children.length)agents.remove(agents.children[0]);
      present.forEach((a,i)=>agents.add(animal(a,i)));
    }
    const lookup=new Map(present.map(a=>[String(a.id),a]));
    for(const creature of agents.children){
      const a=lookup.get(String(creature.userData.id));if(!a)continue;
      const u=creature.userData;u.stage=a.st;u.age=Number(a.age)||0;
      u.health=Number.isFinite(a.health)?THREE.MathUtils.clamp(a.health,0,100):100;
      // Stage size is a visual class, not a fabricated breed-specific weight curve.
      const scale=a.st==="kit"?.46:a.st==="chick"?.51:
        a.st==="grower"?.76:a.st==="pullet"||a.st==="cockerel"?.84:1;
      creature.scale.setScalar(scale);
    }
  }

  // Resource flows follow actual coordinator data and are laid along visible connections.
  // Water Simulator source/ui.js buildPipe()/frame(): instanced particles, flow-aware speed,
  // wet-line highlighting. The coordinator exposes *hourly aggregate* transfers, not
  // per-pipe L/min, so speed/brightness here is a bounded VISUAL encoding, not a
  // claim of physically measured velocity inside a particular diameter.
  const flows=[],flowDummy=new THREE.Object3D();
  function addFlow(curve,kind,n,size=.13){
    const electrical=["pv","pumpPower","buildingPower"].includes(kind);
    const particles=new THREE.InstancedMesh(
      new THREE.SphereGeometry(size,8,6),
      new THREE.MeshBasicMaterial({color:electrical?0xffd48b:0x8adafa,transparent:true,opacity:.88,depthWrite:false}),n);
    particles.visible=false;particles.frustumCulled=false;scene.add(particles);
    // The status sheath is deliberately subtle, unlike a permanently glowing pipe.
    const sheath=new THREE.Mesh(
      new THREE.TubeGeometry(curve,56,electrical?.119:.177,8,false),
      new THREE.MeshBasicMaterial({color:electrical?0xe6ba72:0x72bfe0,transparent:true,opacity:.20,depthWrite:false}));
    sheath.visible=false;sheath.castShadow=false;scene.add(sheath);
    flows.push({mesh:particles,sheath,curve,kind,n,phase:0,size});
  }
  addFlow(pvCable,"pv",8);
  addFlow(pumpCable,"pumpPower",7);
  addFlow(homeCable,"buildingPower",8);
  addFlow(farmCable,"buildingPower",8);
  addFlow(intakeLine,"rawWater",6,.11);
  addFlow(filterLine,"rawWater",5,.11);
  addFlow(fillLine,"treatedWater",8,.10);
  addFlow(supplyLine,"animalWater",10,.10);
  function flowAmount(kind,e,w){
    let amount=0;
    if(kind==="pv")amount=e?.pvWh;
    else if(kind==="pumpPower")amount=e?.servedPumpWh;
    else if(kind==="buildingPower")amount=e?.servedBaseWh;
    else if(kind==="rawWater"||kind==="treatedWater")amount=w?.treatedL;
    else if(kind==="animalWater")amount=w?.consumedL;
    return Number.isFinite(amount)&&amount>0?amount:0;
  }

  // Waypoints frame locations inside one walkable-looking landscape, not tiles.
  const views={
    overview:{eye:V(16,59,91),look:V(0,1.5,-8)},
    energy:{eye:V(-29,21,17),look:V(-29,2,-9)},
    water:{eye:V(17,24,-1),look:V(0,2,-23)},
    farm:{eye:V(53,23,33),look:V(31,2,3)}
  };
  let view="overview",moving=false;
  const eye=views.overview.eye.clone(),focus=views.overview.look.clone();
  const toEye=eye.clone(),toLook=focus.clone();
  camera.position.copy(eye);camera.lookAt(focus);
  function go(kind){view=views[kind]?kind:"overview";toEye.copy(views[view].eye);toLook.copy(views[view].look)}
  const ray=new THREE.Raycaster(),pointerMap=new Map();
  let gestureMoved=false,pinchDistance=null;
  canvas.addEventListener("pointerdown",e=>{pointerMap.set(e.pointerId,{x:e.clientX,y:e.clientY});gestureMoved=false;canvas.setPointerCapture(e.pointerId);if(pointerMap.size===2){const p=[...pointerMap.values()];pinchDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}});
  canvas.addEventListener("pointermove",e=>{
    const p=pointerMap.get(e.pointerId);if(!p)return;
    const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    if(Math.abs(dx)+Math.abs(dy)>1)gestureMoved=true;
    if(pointerMap.size===2){
      const pair=[...pointerMap.values()];
      const d=Math.max(2,Math.hypot(pair[0].x-pair[1].x,pair[0].y-pair[1].y));
      if(pinchDistance!==null){
        const direction=THREE.MathUtils.clamp(pinchDistance/d,.82,1.22);
        const offset=toEye.clone().sub(toLook).multiplyScalar(direction);
        offset.clampLength(9,155);toEye.copy(toLook).add(offset);
      }
      pinchDistance=d;
    }else if(pointerMap.size===1){
      const offset=toEye.clone().sub(toLook);
      const sph=new THREE.Spherical().setFromVector3(offset);
      sph.theta-=dx*.0048;sph.phi=THREE.MathUtils.clamp(sph.phi+dy*.0048,.24,1.43);
      offset.setFromSpherical(sph);toEye.copy(toLook).add(offset);
    }
  });
  canvas.addEventListener("pointerup",e=>{
    pointerMap.delete(e.pointerId);
    if(pointerMap.size<2)pinchDistance=null;
    if(gestureMoved)return;
    const r=canvas.getBoundingClientRect(),coords=new THREE.Vector2(
      (e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1
    );
    ray.setFromCamera(coords,camera);
    const hits=ray.intersectObjects([...selectable,agents],true);
    if(hits.length){
      let g=hits[0].object;
      while(g&&!g.userData.kind)g=g.parent;
      if(g?.userData.kind){
        const kind=g.userData.kind;
        if(kind==="chicken"||kind==="rabbit")onSelect("farm",(kind==="chicken"?"Chicken":"Rabbit")+" #"+g.userData.id);
        else onSelect(kind,g.userData.label);
      }
    }
  });
  canvas.addEventListener("pointercancel",e=>{pointerMap.delete(e.pointerId);pinchDistance=null});
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
  let data=null,disposed=false,playing=false,visualTime=0,lastModelHour=-1,visualTankFraction=0;
  function update(snapshot){
    // Physics/biology are read-only inputs. No animation can write into a model ledger.
    if(snapshot.clock.hours!==lastModelHour){
      if(lastModelHour>=0){visualTime+=.8;for(const f of flows)f.phase=(f.phase+.045)%1}
      lastModelHour=snapshot.clock.hours;
    }
    data=snapshot;syncAnimals(snapshot.farm);
    const last=snapshot.last,c=snapshot.config;
    const ratio=c.waterStorageCapacityL>0?THREE.MathUtils.clamp(snapshot.waterStoredL/c.waterStorageCapacityL,0,1):0;
    visualTankFraction=ratio;
    const height=ratio*4.85;
    tankFill.visible=ratio>1e-8;tankRim.visible=tankFill.visible;
    tankFill.scale.y=Math.max(.001,height);
    tankFill.position.y=.40+height*.5;
    tankRim.position.y=.40+height;
    const tankMoving=(last?.water?.treatedL||0)>0 && ratio>1e-8;
    tankRipples.forEach(r=>{r.visible=tankMoving;r.position.y=.407+height});
    troughWater.visible=(last?.water?.consumedL||0)>1e-8; // Hourly modeled allocation, not a livestock behavior claim.
    const br=c.batteryCapacityWh>0?THREE.MathUtils.clamp(snapshot.batteryWh/c.batteryCapacityWh,0,1):0;
    chargeRail.scale.x=Math.max(.015,br);chargeRail.visible=br>1e-8;
    inverterLed.intensity=last?.energy?.servedBaseWh>0?.85:0;
    pumpLight.intensity=last?.energy?.servedPumpWh>0?1.0:0;
    const sunLevel=Math.max(0,Math.sin(Math.PI*(snapshot.clock.hourOfDay-6)/12));
    // Cloud transmittance is an EXPLICIT synthetic-scenario assumption, not observed weather.
    const syntheticClarity=THREE.MathUtils.clamp(c.cloudTransmittance,0,1);
    skyLight.intensity=1.05+sunLevel*(.65+.35*syntheticClarity);
    direct.intensity=.38+2.30*sunLevel*syntheticClarity;
    scene.background.setHSL(.56,.28,.24+sunLevel*.53);
    scene.fog.color.copy(scene.background);
  }
  let previous=performance.now();
  function animate(now){
    if(disposed)return;
    requestAnimationFrame(animate);
    const dt=THREE.MathUtils.clamp((now-previous)/1000,0,.055);previous=now;
    if(playing)visualTime+=dt;
    eye.lerp(toEye,.095);focus.lerp(toLook,.095);
    camera.position.copy(eye);camera.lookAt(focus);
    // Farm Simulator world/agents.js and world/physics.js inspired species-specific
    // movement: chickens step and peck, rabbits hop; at night they settle.
    // No visual dice are shared with the Farm biological RNG.
    // The original water simulator animates its pump rotor only when modeled
    // throughput is positive; here we require delivered pump electricity AND
    // modeled water throughput to avoid a false pumping claim.
    const pumpActive=playing&&(data?.last?.energy?.servedPumpWh??0)>0&&
      (data?.last?.water?.treatedL??0)>0;
    if(pumpActive)pumpFan.rotation.z+=dt*10;
    const modelHour=data?.clock?.hourOfDay??9;
    const awake=modelHour>=6&&modelHour<20;
    for(let i=0;i<agents.children.length;i++){
      const a=agents.children[i],s=a.userData,chicken=s.kind==="chicken";
      const healthSpeed=.35+.65*THREE.MathUtils.clamp(s.health/100,0,1);
      const youngKit=!chicken&&s.stage==="kit"&&s.age<10;
      const active=awake&&!youngKit;
      const phase=visualTime*(chicken?1.65:1.2)*healthSpeed+s.phase;
      const dist=active?(chicken?.96:.40):0;
      const targetX=s.ax+Math.sin(phase*.56+i*.7)*dist;
      const targetZ=s.az+Math.cos(phase*.68+i*.9)*dist;
      const blend=Math.min(1,dt*4.5);
      const wasX=a.position.x,wasZ=a.position.z;
      a.position.x+=(targetX-a.position.x)*blend;
      a.position.z+=(targetZ-a.position.z)*blend;
      a.position.y=terrainY(a.position.x,a.position.z);
      const stepWave=Math.sin(phase*(chicken?5.5:3.4)+i);
      if(active){
        const dx=a.position.x-wasX,dz=a.position.z-wasZ;
        if(Math.hypot(dx,dz)>1e-5)a.rotation.y=Math.atan2(dx,dz);
        a.position.y+=chicken?Math.abs(stepWave)*.018:Math.max(0,stepWave)*.19;
      }
      s.head.rotation.x=active?(chicken?.16+Math.max(0,Math.sin(phase*3.2+i))*.57:
        .035+Math.sin(phase*1.8)*.075):-.09;
      s.head.rotation.y=active?Math.sin(phase*.8+i)*.06:0;
      for(let k=0;k<s.limbs.length;k++)
        s.limbs[k].rotation.x=active?(chicken?stepWave*(k?-.31:.31):Math.max(0,stepWave)*-.18):0;
      for(let k=0;k<s.wings.length;k++)
        s.wings[k].rotation.z=active?Math.sin(phase*1.8+k)*.035*(k?1:-1):0;
      for(let k=0;k<s.ears.length;k++)
        s.ears[k].rotation.z=active?Math.sin(phase*2.1+k)*.07:0;
    }
    const e=data?.last?.energy,w=data?.last?.water;
    for(const f of flows){
      const amount=flowAmount(f.kind,e,w);
      const active=amount>1e-8;
      f.mesh.visible=active;f.sheath.visible=active;
      if(!active)continue;
      // Magnitudes are hourly Wh or L; never mislabel these as instantaneous W or L/min.
      const activity=THREE.MathUtils.clamp(Math.log1p(amount)/Math.log1p(
        f.kind==="pv"||f.kind==="buildingPower"||f.kind==="pumpPower"?2000:200),0,1);
      if(playing)f.phase=(f.phase+dt*(.055+.22*activity))%1;
      for(let i=0;i<f.n;i++){
        f.curve.getPointAt((f.phase+i/f.n)%1,flowDummy.position);
        const size=.65+.55*activity;
        flowDummy.scale.setScalar(size);
        flowDummy.updateMatrix();f.mesh.setMatrixAt(i,flowDummy.matrix);
      }
      f.mesh.instanceMatrix.needsUpdate=true;
    }
    for(let i=0;i<tankRipples.length;i++){
      const ring=tankRipples[i];if(!ring.visible)continue;
      const u=(visualTime*.26+i/tankRipples.length)%1;
      ring.scale.setScalar(.43+u*1.75);
      ring.material.opacity=.23*(1-u);
    }
    if(playing&&m.creek.map)m.creek.map.offset.y=(m.creek.map.offset.y+dt*.012)%1;
    renderer.render(scene,camera);
  }
  requestAnimationFrame(animate);
  return {
    update,go,setPlayback(on){playing=Boolean(on)},resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()},
    dispose(){disposed=true;observer.disconnect();renderer.dispose();scene.traverse(obj=>{if(obj.geometry)obj.geometry.dispose()})},
    stats(){return {animals:agents.children.length,paths:flows.length,view,meshes:selectable.length,playing,
      activeFlowPaths:flows.filter(f=>flowAmount(f.kind,data?.last?.energy,data?.last?.water)>1e-8).length,
      tankFillFraction:visualTankFraction,visualFarmHour:data?.clock?.hourOfDay??null,housingScreenCount,illustrativeCageDoors}}
  };
}
