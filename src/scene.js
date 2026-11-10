import * as THREE from "three";
import {nativeFarmWorldPoses} from "./upstream/farm-world/pose-adapter.mjs";
import {frameDeltaSeconds,smoothAlpha,gaitPose,chickenFootPhase,chickenSwingLift,
  CHICKEN_STANCE_FRACTION} from "./visual-motion.mjs";

/**
 * Homestead 3D landscape v2: a single physical site, NOT isolated simulation stages.
 * Geometry is illustrative: dimensions/electrical wiring are not installation plans.
 * All animation highlighting comes exclusively from the coordinator snapshot.
 * The original physics and biological models are untouched by this renderer.
 */
export function makeScene(canvas,onSelect=()=>{}){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
  // Adapt Farm Simulator world/perf.js's visual-only Auto quality policy.
  // Device DPR is an upper bound, not a promise of smooth rendering.
  const deviceDpr=Math.max(1,window.devicePixelRatio||1);
  const qualityDpr=[1,1.25,1.5];
  let qualityTier=deviceDpr>1.25?2:0,qualityFps=0;
  const quality={gaps:[],windowStart:0,slowSince:0,fastSince:0,coolUntil:0,
    changes:0,failedHigh:0,lockedHigh:false,frameCount:0};
  function pixelRatio(){return Math.min(deviceDpr,qualityDpr[qualityTier])}
  renderer.setPixelRatio(pixelRatio());
  function setVisualTier(t,now){
    if(t===qualityTier)return;
    qualityTier=THREE.MathUtils.clamp(t,0,2);
    quality.changes++;quality.coolUntil=now+5000;
    quality.slowSince=quality.fastSince=0;
    quality.gaps.length=0;
    renderer.setPixelRatio(pixelRatio());
    const r=canvas.getBoundingClientRect();
    renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);
  }
  function observeFrameGap(now,gap){
    // Hidden tabs, debugging pauses and browser wakeups must not downgrade quality.
    if(document.hidden||gap>250||gap<=0){
      quality.gaps.length=0;quality.slowSince=quality.fastSince=0;
      quality.windowStart=now;return;
    }
    quality.gaps.push(gap);
    if(quality.gaps.length>90)quality.gaps.shift();
    if(now-quality.windowStart<600||quality.gaps.length<25)return;
    quality.windowStart=now;
    const ordered=[...quality.gaps].sort((a,b)=>a-b);
    const median=ordered[Math.floor(ordered.length/2)];
    qualityFps=1000/median;
    if(now<quality.coolUntil)return;
    if(qualityFps<39){
      quality.fastSince=0;
      if(!quality.slowSince)quality.slowSince=now;
      if(now-quality.slowSince>=2200&&qualityTier>0){
        if(qualityTier===2)quality.failedHigh++;
        if(quality.failedHigh>=2)quality.lockedHigh=true;
        setVisualTier(qualityTier-1,now);
      }
    }else if(qualityFps>55){
      quality.slowSince=0;
      if(!quality.fastSince)quality.fastSince=now;
      if(now-quality.fastSince>=10000&&qualityTier<2&&
         !(qualityTier===1&&quality.lockedHigh))setVisualTier(qualityTier+1,now);
    }else{quality.slowSince=quality.fastSince=0}
  }
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
  // One metre per scene unit (illustrative geometry, NOT certified hardware dimensions).
  // Terrain heights are sampled once; render vertices, resting contacts and future
  // terrain colliders all read this same triangulated heightfield, not a second
  // smooth function that disagrees with the triangles being drawn.
  const terrainSpec=Object.freeze({x0:-150,z0:-125,dx:300/156,dz:250/122,nx:156,nz:122,unit:"m"});
  function terrainSourceY(x,z){
    const edge=Math.max(0,(Math.abs(x)-39)/26,(Math.abs(z)-28)/22);
    const base=.18*Math.sin(x*.12)+.22*Math.cos(z*.11)+.15*Math.sin((x+z)*.16)+edge*edge*2.4;
    const channel=THREE.MathUtils.clamp(1-creekDistance(x,z)/8,0,1);
    return base-.80*channel*channel;
  }
  const groundHeights=new Float32Array((terrainSpec.nx+1)*(terrainSpec.nz+1));
  for(let j=0;j<=terrainSpec.nz;j++)for(let i=0;i<=terrainSpec.nx;i++){
    const x=terrainSpec.x0+i*terrainSpec.dx,z=terrainSpec.z0+j*terrainSpec.dz;
    groundHeights[j*(terrainSpec.nx+1)+i]=terrainSourceY(x,z);
  }
  function terrainY(x,z){
    const {x0,z0,dx,dz,nx,nz}=terrainSpec;
    const gx=THREE.MathUtils.clamp((x-x0)/dx,0,nx);
    const gz=THREE.MathUtils.clamp((z-z0)/dz,0,nz);
    const i=Math.min(nx-1,Math.floor(gx)),j=Math.min(nz-1,Math.floor(gz));
    const u=gx-i,v=gz-j,row=nx+1;
    const a=groundHeights[j*row+i],b=groundHeights[j*row+i+1];
    const cc=groundHeights[(j+1)*row+i],d=groundHeights[(j+1)*row+i+1];
    // The mesh uses triangles (a,c,b) and (b,c,d), separated by u+v=1.
    return u+v<=1?a*(1-u-v)+b*u+cc*v:
      d*(u+v-1)+b*(1-v)+cc*(1-u);
  }
  const at=(x,z,offset=0)=>V(x,terrainY(x,z)+offset,z);
  // Conservative support bounds over all terrain vertices in cells touched by
  // the footprint. By linear interpolation no triangle can exceed its corners.
  function footprintBounds(cx,cz,w,d){
    const {x0,z0,dx,dz,nx,nz}=terrainSpec;
    const xa=Math.max(0,Math.floor((cx-w/2-x0)/dx));
    const xb=Math.min(nx,Math.ceil((cx+w/2-x0)/dx));
    const za=Math.max(0,Math.floor((cz-d/2-z0)/dz));
    const zb=Math.min(nz,Math.ceil((cz+d/2-z0)/dz));
    let min=Infinity,max=-Infinity;
    for(let j=za;j<=zb;j++)for(let i=xa;i<=xb;i++){
      const h=groundHeights[j*(nx+1)+i];
      min=Math.min(min,h);max=Math.max(max,h);
    }
    return {min,max};
  }
  const foundations=[];
  function foundationFor(g,cx,cz,w,d,material=m.stone,{clearance=.04,embed=.32,round=false}={}){
    const bounds=footprintBounds(cx,cz,w,d);
    const top=bounds.max+clearance,bottom=bounds.min-embed,height=top-bottom;
    g.position.y=top;
    const pad=round?
      cyl(w/2,w/2,height,material,0,-height/2,0,32):
      box(w+.08,height,d+.08,material,0,-height/2,0);
    pad.name=g.userData.label+" foundation";
    pad.userData={assetId:g.userData.label,physicsRole:"fixed",collider:"static-support",unit:"m"};
    g.add(pad);
    foundations.push({asset:g.userData.label,top,bottom,minTerrain:bounds.min,
      maxTerrain:bounds.max,footprint:[w,d],minimumEmbedM:bounds.min-bottom});
    return g;
  }
  function mesh(geo,material,x=0,y=0,z=0,cast=true){
    const v=new THREE.Mesh(geo,material);v.position.set(x,y,z);v.castShadow=cast;v.receiveShadow=true;return v;
  }
  const box=(w,h,d,material,x=0,y=0,z=0)=>mesh(new THREE.BoxGeometry(w,h,d),material,x,y,z);
  const cyl=(top,bottom,h,material,x=0,y=0,z=0,n=20)=>mesh(new THREE.CylinderGeometry(top,bottom,h,n),material,x,y,z);
  const ell=(a,b,c,material,x=0,y=0,z=0)=>{const o=mesh(new THREE.SphereGeometry(1,12,9),material,x,y,z);o.scale.set(a,b,c);return o};
  // A single immutable feather silhouette buffer is shared across every bird.
  // Farm source world/perf.js advocates visual-only efficiency: this lowers
  // GPU buffer churn without changing animal identities, counts or biology.
  // The feathers remain separate draw calls (future material batching work).
  const plumageGeometry=new THREE.SphereGeometry(1,12,9);
  const featherEll=(a,b,c,material,x=0,y=0,z=0)=>{
    const o=mesh(plumageGeometry,material,x,y,z);
    o.scale.set(a,b,c);return o;
  };
  function group(kind,label,x,z){const o=new THREE.Group();o.position.copy(at(x,z));o.userData={kind,label};scene.add(o);return o}
  const selectable=[];
  function select(g){g.traverse(o=>{if(o.isMesh)selectable.push(o)});return g}
  // Continuous, softly undulating and naturally mottled terrain.
  let terrainMesh=null;
  {
    const nx=156,nz=122,v=[],uv=[],colors=[],indices=[],cc=new THREE.Color();
    for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
      const x=-150+i*300/nx,z=-125+j*250/nz;
      v.push(x,groundHeights[j*(nx+1)+i],z);uv.push(i/nx*26,j/nz*23);
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
    const ground=mesh(g,m.grass,0,0,0,false);
    ground.name="Unified homestead terrain (1 unit = 1 m)";
    ground.userData={physicsRole:"fixed",collider:"heightfield",unit:"m"};
    ground.castShadow=false;scene.add(ground);terrainMesh=ground;
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

  // Closed gable ends built as shallow triangular prisms; the roof remains
  // genuinely pitched rather than two rectangular slabs over an open attic.
  let closedGableCount=0;
  function gableEnd(parent,width,wallTop,ridgeHeight,z,material){
    const shape=new THREE.Shape();
    shape.moveTo(-width/2,wallTop);shape.lineTo(0,ridgeHeight);
    shape.lineTo(width/2,wallTop);shape.closePath();
    const g=new THREE.ExtrudeGeometry(shape,{depth:.13,bevelEnabled:false,curveSegments:1});
    const end=mesh(g,material,0,0,z,false);
    end.name="Enclosed gable wall";
    end.userData={physicsRole:"fixed",collider:"visual-only",unit:"m"};
    parent.add(end);closedGableCount++;return end;
  }

  // Construct real gaps in the front masonry; never paint doors or glass over
  // an opaque building box. Each solid band has a named fixed AABB proxy.
  function facadeWithOpenings(parent,label,w,h,z,openings,material,thickness=.28){
    const parts=[],ys=[0,h],half=w/2,eps=1e-6;
    for(const o of openings){
      if(o.w<=0||o.h<=0||Math.abs(o.x)+o.w/2>half+eps||
         o.y-o.h/2<0||o.y+o.h/2>h)throw Error("Invalid facade opening: "+o.name);
      ys.push(o.y-o.h/2,o.y+o.h/2);
    }
    const cuts=[...new Set(ys.map(y=>Number(y.toFixed(7))))].sort((a,b)=>a-b);
    for(let j=1;j<cuts.length;j++){
      const lower=cuts[j-1],upper=cuts[j],cy=(lower+upper)/2;
      if(upper-lower<eps)continue;
      const holes=openings.filter(o=>cy>o.y-o.h/2+eps&&cy<o.y+o.h/2-eps)
        .map(o=>[o.x-o.w/2,o.x+o.w/2]).sort((a,b)=>a[0]-b[0]);
      let cursor=-half;
      function addTo(right){
        if(right-cursor<=eps)return;
        const width=right-cursor;
        const wall=box(width,upper-lower,thickness,material,(right+cursor)/2,cy,z);
        wall.name=label+"/solid/"+parts.length;
        wall.userData={assetId:label,physicsRole:"fixed",
          collider:{type:"aabb",sizeM:[width,upper-lower,thickness]},unit:"m"};
        parent.add(wall);parts.push(wall);
      }
      for(const [left,right] of holes){if(left>cursor)addTo(left);cursor=Math.max(cursor,right)}
      addTo(half);
    }
    return {parts,openings,z};
  }
  function rearAndSides(parent,label,w,h,d,material){
    const parts=[
      box(w,h,.26,material,0,h/2,-d/2),
      box(.26,h,d,material,-w/2,h/2,0),
      box(.26,h,d,material,w/2,h/2,0)
    ];
    for(const [i,p] of parts.entries()){
      p.name=label+"/"+["rear-wall","west-wall","east-wall"][i];
      p.userData={physicsRole:"fixed",collider:{type:"aabb",
        sizeM:[p.geometry.parameters.width,p.geometry.parameters.height,p.geometry.parameters.depth]}};
      parent.add(p);
    }
    const base=box(w-.3,.14,d-.3,m.wood,0,.12,0);
    base.name=label+"/floor";parent.add(base);
  }
  // House and utility outbuilding belong to the same farmyard; no visual boxes as zones.
  const homestead=group("overview","Home and utility loads",6,12);
  foundationFor(homestead,6,12,13.1,9.7);

  const houseWindows=[-4.16,4.16].flatMap(x=>[1.63,4.43].map(y=>
    ({name:"window-"+x+"-"+y,x,y,w:1.56,h:1.38})));
  houseWindows.push({name:"upper-center",x:0,y:4.43,w:1.56,h:1.38});
  const houseFront=facadeWithOpenings(homestead,"house/front",13,6,4.8,
    [...houseWindows,{name:"door",x:0,y:1.23,w:1.20,h:2.18}],m.cedar);
  rearAndSides(homestead,"house",13,6,9.6,m.cedar);
  homestead.add(box(12.65,.18,9.2,m.wood,0,3.01,0));
  // A two-storey house with windows scaled as architectural openings,
  // not the previous 3.2 m tall single-pane billboards.
  // Shared material: warm glazing is an illustrative interior glow, not
  // evidence of a wired lighting circuit or a separately accounted load.
  const litWindowMaterial=m.glass.clone();
  litWindowMaterial.emissive.setHex(0xffb75e);
  litWindowMaterial.emissiveIntensity=0;
  const warmWindows=[];
  function houseWindow(px,y,pz=5.00){
    const trim=box(1.83,1.65,.13,m.trim,px,y,pz);homestead.add(trim);
    const glass=box(1.56,1.38,.09,litWindowMaterial,px,y,pz-.17);homestead.add(glass);
    homestead.add(box(.065,1.47,.12,m.trim,px,y,pz+.04));
    homestead.add(box(1.62,.07,.12,m.trim,px,y,pz+.04));
    homestead.add(box(2.06,.14,.35,m.stone,px,y-.88,pz+.06));
    warmWindows.push(glass);
  }
  for(const x of [-4.16,4.16]){
    houseWindow(x,1.63);houseWindow(x,4.43);
  }
  houseWindow(0,4.43);
  // Two low-cost unshadowed warm fixtures; keep light pools local, not a
  // second global sun. Visual only; supplied site energy gates their glow.
  const fixtureGlass=mat(0xffd39a,{emissive:0xff9d3d,emissiveIntensity:0});
  const porchFixtures=[];
  function addPorchFixture(parent,x,y,z){
    parent.add(box(.34,.28,.24,m.darkWood,x,y+.20,z-.09));
    parent.add(box(.25,.33,.23,fixtureGlass,x,y,z));
    const light=new THREE.PointLight(0xffb768,0,9,2);
    light.position.set(x,y-.18,z+.48);
    light.castShadow=false;
    parent.add(light);porchFixtures.push(light);
  }
  addPorchFixture(homestead,1.38,2.43,5.08);
  const frontDoor=box(1.20,2.18,.15,m.darkWood,0,1.23,4.91);
  frontDoor.name="Home entry door";homestead.add(frontDoor);
  for(const x of [-.66,.66])homestead.add(box(.105,2.37,.19,m.trim,x,1.25,5.03));
  homestead.add(box(1.45,.16,.19,m.trim,0,2.47,5.03));
  homestead.add(cyl(.075,.075,.07,m.metal,.42,1.25,5.05,12));
  homestead.add(box(1.70,.11,.70,m.stone,0,.20,5.33));
  for(const side of [-1,1]){
    const roof=box(7.6,.36,10.4,m.roof,side*3.2,7.1,0);
    roof.rotation.z=-side*.37;homestead.add(roof);
    homestead.add(box(.21,.13,10.57,m.trim,side*6.71,5.89,0));
  }
  gableEnd(homestead,12.8,5.94,8.36,4.77,m.cedar);
  gableEnd(homestead,12.8,5.94,8.36,-4.91,m.cedar);
  homestead.add(box(.36,.22,10.57,m.roof,0,8.35,0));
  // Plausible chimney proportion and cap; visual only, no stove or flue model.
  homestead.add(box(.92,2.15,.92,m.stone,-4.25,7.70,-1.0));
  homestead.add(box(1.16,.14,1.16,m.concrete,-4.25,8.83,-1.0));
  homestead.add(box(14,.3,3.8,m.wood,0,.18,6.5));
  for(const x of [-6,6])for(const z of [5.4,7.65])
    homestead.add(cyl(.12,.12,1.8,m.wood,x,1.0,z,8));
  for(const x of [-6,0,6])for(const z of [5.4,7.65]){
    const land=terrainY(6+x,12+z);
    const top=homestead.position.y+.16,bottom=land-.24;
    const height=Math.max(.01,top-bottom);
    const pier=box(.31,height,.31,m.stone,x,.16-height/2,z);
    pier.name="Porch pier";pier.userData.physicsRole="fixed";homestead.add(pier);
  }

  // Utility shed with a roof, door, vents; energy equipment is attached to its wall.
  const power=group("energy","Solar inverter and battery", -18,-7);
  foundationFor(power,-18,-7,8.2,6.7);
  power.add(box(8,4.1,6.5,m.wood,0,2.05,0));
  const powerRoof=box(9.2,.35,7.6,m.roof,0,4.5,0);powerRoof.rotation.z=.10;power.add(powerRoof);
  power.add(box(1.48,2.31,.12,m.darkWood,0,1.24,3.31));
  for(const x of [-.80,.80])power.add(box(.10,2.46,.13,m.trim,x,1.25,3.39));
  power.add(box(1.76,.12,.13,m.trim,0,2.48,3.39));
  for(const x of [-2.35,2.35]){
    power.add(box(1.03,.58,.09,m.darkWood,x,3.38,3.31));
    for(let n=0;n<3;n++)power.add(box(.94,.045,.10,m.metal,x,3.22+n*.14,3.39));
  }
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
      for(const [dz,length,center] of [[-.75,1.85,.92],[.88,2.6,1.3]]){
        mount.add(cyl(.11,.14,length,m.steel,dx,center,dz,8));
        // Footing continues beneath the exact heightfield on the downhill side.
        const floor=terrainY(panels.position.x+x+dx,panels.position.z+z+dz)-panels.position.y;
        const top=.23,bottom=Math.min(-.08,floor-.24);
        mount.add(cyl(.13,.16,top-bottom,m.concrete,dx,(top+bottom)/2,dz,9));
      }
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
  foundationFor(water,-7,-23,10.4,6.2,m.concrete);
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
  foundationFor(tank,tankX,tankZ,6.2,6.2,m.concrete,{round:true});
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
  foundationFor(barn,30,-10,9.25,8.5);
  // Continuous siding is textured wood; trim gives the coop construction-scale detail.
  barn.add(box(9.35,.32,8.8,m.stone,0,.16,0));
  
  const coopFront=facadeWithOpenings(barn,"coop/front",9,5.5,4.2,
    [{name:"person-door",x:-2.42,y:1.30,w:1.56,h:2.38},
     {name:"bird-door",x:0,y:1.24,w:.92,h:.79},
     ...[-2.65,2.65].map(x=>({name:"window-"+x,x,y:3.93,w:1.58,h:1.27}))],
     m.cedar,.26);
  rearAndSides(barn,"coop",9,5.5,8.4,m.cedar);
  for(const x of [-4.4,-3.55,-2.7,-1.85,1.85,2.7,3.55,4.4]){
    barn.add(box(.07,5.05,.095,m.trim,x,2.87,4.27));
  }
  for(const z of [-3.99,4.28]){
    barn.add(box(9.25,.19,.14,m.darkWood,0,.49,z));
    barn.add(box(9.25,.14,.14,m.trim,0,5.43,z));
  }
  // Full-size service door is separate from the chicken-scale pop hole;
  // the ramp reaches the latter, not an implausibly oversized service doorway.
  addPorchFixture(barn,-.95,2.68,4.55);
  const coopDoor=box(1.56,2.38,.15,m.darkWood,-2.42,1.30,4.30);
  barn.add(coopDoor);
  for(const x of [-3.27,-1.57])barn.add(box(.11,2.46,.18,m.trim,x,1.32,4.39));
  barn.add(box(1.79,.14,.18,m.trim,-2.42,2.55,4.39));
  barn.add(cyl(.075,.075,.09,m.metal,-1.91,1.31,4.45,10));
  // Open sliding chicken hatch: the slab is raised above its actual opening.
  // This is visual static geometry; it does not claim dynamic gate automation.
  const popDoor=box(.92,.79,.15,m.darkWood,0,2.08,4.34);
  popDoor.name="Coop raised chicken hatch";barn.add(popDoor);
  for(const x of [-.54,.54])barn.add(box(.06,1.65,.15,m.steel,x,1.62,4.45));
  for(const x of [-.52,.52])barn.add(box(.095,.97,.17,m.trim,x,1.23,4.39));
  barn.add(box(1.15,.12,.18,m.trim,0,1.76,4.39));
  barn.add(box(1.18,.11,.31,m.wood,0,.78,4.50));
  // Correct the original inverted (valley) roof: ridge higher than eaves.
  for(const side of [-1,1]){
    const roof=box(5.35,.32,9.35,m.roofAlt,side*2.43,6.35,0);
    roof.rotation.z=-side*.35;barn.add(roof);
    const fascia=box(.22,.24,9.5,m.trim,side*4.93,5.48,0);
    fascia.rotation.z=-side*.35;barn.add(fascia);
  }
  barn.add(box(.37,.26,9.7,m.roof,0,7.12,0));
  // Close both triangular openings behind the roof, including the rear face.
  gableEnd(barn,8.9,5.45,7.12,4.18,m.cedar);
  gableEnd(barn,8.9,5.45,7.12,-4.32,m.cedar);
  // Gable ventilation louvers, roof eaves and illuminated-looking windows.
  for(const y of [5.65,5.83,6.01]){
    barn.add(box(1.24,.08,.14,m.darkWood,0,y,4.31));
  }
  for(const x of [-2.65,2.65]){
    barn.add(box(1.83,1.53,.12,m.trim,x,3.93,4.33));
    barn.add(box(1.58,1.27,.08,m.glass,x,3.93,4.24));
    barn.add(box(.08,1.36,.12,m.trim,x,3.93,4.40));
    barn.add(box(1.66,.07,.12,m.trim,x,3.93,4.40));
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
  // South entrance remains open precisely where the coop ramp crosses the fence.
  // The surrounding rails do not intersect the ramp or form an invisible gate.
  const fenceLines=[[[19,-2],[28.35,-2]],[[31.65,-2],[44,-2]],
    [[44,-2],[47,20]],[[47,20],[18,20]],[[18,20],[19,-2]]];
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
  for(const gx of [28.35,31.65]){
    const y=terrainY(gx,-2);
    const post=cyl(.14,.16,1.83,m.darkWood,gx,y+.9,-2,9);
    post.name="Coop gate opening marker";scene.add(post);
  }
  // Move the hutches wholly within the fence (west edge is near x=18–19).
  const hutches=group("farm","Rabbit hutches",24.5,11);
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
      for(const dz of [-1.1,1.10]){
        hutches.add(cyl(.105,.12,2.92,m.wood,x,1.51,z+dz,9));
        const land=terrainY(hutches.position.x+x,hutches.position.z+z+dz)-hutches.position.y;
        if(land<.06){
          const top=.23,bottom=land-.2;
          hutches.add(cyl(.12,.15,top-bottom,m.wood,x,(top+bottom)/2,z+dz,9));
        }
      }
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
  // Closed, bounded walking circuits in clear areas of the shared farmyard.
  // These are visual roaming plans only; biological location/foraging activity
  // is NOT present in the Farm model snapshot and is not inferred here.
  function animal(a,index){
    const species=a.sp,id=Number(a.id)||index+1,chicken=species==="chicken";
    const o=new THREE.Group(),base=coat(species,id),darker=coat(species,id,true);
    const head=new THREE.Group(),torso=new THREE.Group(),limbs=[],wings=[],ears=[];
    o.add(torso);torso.add(head);
    if(chicken){
      torso.add(ell(.46,.43,.65,base,0,.65,0));
      // Layered scapulars, flight-feather tips and a swept tail replace the
      // smooth capsule silhouette. The palette and visual-only distinction
      // follow Farm Simulator world/looks.js; no breed identity is inferred
      // from the Farm snapshot's absent breed field.
      const featherCount=8;
      for(const side of [-1,1]){
        for(let row=0;row<3;row++){
          const plume=featherEll(.095,.105,.285,row===2?darker:base,
            side*(.395-row*.025),.78-row*.105,-.13-row*.125);
          plume.rotation.y=side*(.22+row*.06);
          plume.rotation.x=-.22-row*.12;
          torso.add(plume);
        }
        // Downward-pointing wing tips extend beyond the oval wing body.
        const flight=featherEll(.085,.09,.33,darker,side*.42,.63,-.32);
        flight.rotation.x=-.35;flight.rotation.y=side*.22;
        torso.add(flight);
      }
      const tail=new THREE.Group();tail.position.set(0,.75,-.54);
      for(const side of [-2,-1,0,1,2]){
        const feather=featherEll(.072,.29,.13,side===0?base:darker,
          side*.095,.15+(.10-Math.abs(side)*.045),-.13);
        feather.rotation.x=-.54;
        feather.rotation.z=-side*.12;
        tail.add(feather);
      }
      torso.add(tail);
      head.position.set(0,.83,.37);
      head.add(ell(.29,.31,.30,base,0,.19,.11));
      const beak=mesh(new THREE.ConeGeometry(.145,.34,7),m.beak,0,.11,.44);
      beak.rotation.x=Math.PI/2;head.add(beak);
      head.add(ell(.105,.20,.09,m.comb,0,.52,.08));
      for(const side of [-1,1]){
        const wing=ell(.21,.18,.43,darker,side*.34,.75,-.08);
        torso.add(wing);wings.push(wing);
        head.add(mesh(eyeGeo,m.eyes,side*.252,.24,.29,false));
        // Separate foot and shin rigs permit true world-planted stance.
        const leg=new THREE.Group(),foot=new THREE.Group();
        const shin=cyl(.035,.044,1,m.beak,0,0,0,9);
        for(const toe of [-1,0,1])
          foot.add(box(.054,.044,.19,m.beak,toe*.081,.022,.085));
        foot.add(box(.06,.043,.11,m.beak,0,.021,-.068));
        foot.add(ell(.082,.056,.094,m.beak,0,.051,0));
        leg.add(shin,foot);o.add(leg);
        leg.userData={side,shin,foot,state:"unset",cycle:-1,
          anchor:null,lastWorld:null,swingStart:null,plantedYaw:0,grounded:true};
        limbs.push(leg);
      }
    }else{
      torso.add(ell(.56,.42,.80,base,0,.52,0));
      torso.add(ell(.23,.23,.22,base,0,.56,-.77)); // tail
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
    // Native Farm controller owns movement; spawn is a stationary display placeholder.
    // Never synthesize a circular route while awaiting native world initialization.
    const p=species==="chicken"?V(35+(index%4)*.6,0,2+(Math.floor(index/4)%3)*.6):
      V(31+(index%4)*.45,0,13+(Math.floor(index/4)%3)*.45);
    o.userData={kind:species,id,plumageFeathers:chicken?13:0,
      phase:seeded(id*13+50)*Math.PI*2,
      head,torso,limbs,wings,ears,health:100,stage:a.st,age:Number(a.age)||0,
      travelM:0,
      footPhaseOffset:seeded(id*47.21),walking:false};
    o.position.copy(at(p.x,p.z));
    return o;
  }
  // In stance foot contact remains fixed in world X/Z and yaw. During
  // swing it advances toward a future step and samples the shared heightfield.
  // These visual poses do not create impulses or change farm biological state.
  const footUp=V(0,1,0);
  function stepChickenFeet(rig,s,active){
    rig.updateMatrixWorld(true);
    const scale=Math.max(.12,rig.scale.x/.44);
    const strideM=.25*scale,stepHeightM=.07*scale;
    for(let i=0;i<s.limbs.length;i++){
      const u=s.limbs[i].userData;
      const step=chickenFootPhase(s.travelM,i,strideM,s.footPhaseOffset*strideM);
      const under=rig.localToWorld(V(u.side*.19,0,.13));
      const next=rig.localToWorld(V(u.side*.19,0,.39));
      let x,z,lift=0;
      if(!active){
        x=under.x;z=under.z;u.anchor={x,z};
        u.plantedYaw=rig.rotation.y;
        u.state="stance";u.cycle=step.cycle;u.grounded=true;
      }else if(step.stance){
        if(u.state!=="stance"||u.cycle!==step.cycle||!u.anchor){
          const p=u.lastWorld||under;
          u.anchor={x:p.x,z:p.z};
          u.plantedYaw=rig.rotation.y;
        }
        x=u.anchor.x;z=u.anchor.z;
        u.state="stance";u.cycle=step.cycle;u.grounded=true;
      }else{
        if(u.state!=="swing"||u.cycle!==step.cycle||!u.swingStart)
          u.swingStart=u.lastWorld?{...u.lastWorld}:{x:under.x,z:under.z};
        const progress=(step.phase-CHICKEN_STANCE_FRACTION)/
          (1-CHICKEN_STANCE_FRACTION);
        const ease=progress*progress*(3-2*progress);
        x=u.swingStart.x+(next.x-u.swingStart.x)*ease;
        z=u.swingStart.z+(next.z-u.swingStart.z)*ease;
        lift=chickenSwingLift(step.phase,stepHeightM);
        u.state="swing";u.cycle=step.cycle;u.grounded=false;
      }
      const y=terrainY(x,z)+lift;
      const local=rig.worldToLocal(V(x,y,z));
      u.foot.position.copy(local);
      u.foot.rotation.y=u.grounded?u.plantedYaw-rig.rotation.y:0;
      const ankle=local.clone().add(V(0,.047,0));
      const hip=V(u.side*.19,.35,.10);
      const length=Math.max(.015,hip.distanceTo(ankle));
      u.shin.position.copy(hip).add(ankle).multiplyScalar(.5);
      u.shin.scale.set(1,length,1);
      u.shin.quaternion.setFromUnitVectors(footUp,
        hip.clone().sub(ankle).normalize());
      u.lastWorld={x,z};
    }
  }

  // Farm Simulator source/src/world/sync.js reconciles by immutable model ID.
  // Preserve each surviving Three.js rig, pose, and future physics body.
  const animalById=new Map(),ownedAnimalGeometry=new Set();
  let animalAdded=0,animalRemoved=0;
  function retireAnimal(key){
    const creature=animalById.get(key);
    if(!creature)return;
    agents.remove(creature);
    creature.traverse(node=>{
      if(!node.isMesh||!node.geometry||node.geometry===eyeGeo||
         node.geometry===plumageGeometry)return;
      // Every generated body part has its own geometry. Never dispose the
      // shared eye sphere or global coat/fixture materials.
      if(!ownedAnimalGeometry.has(node.geometry))return;
      node.geometry.dispose();
      ownedAnimalGeometry.delete(node.geometry);
    });
    animalById.delete(key);animalRemoved++;
  }
  function syncAnimals(farm){
    // Only actual farm records may create animals; no synthetic births/deaths.
    const present=(farm?.animals||[]).filter(a=>a.sp==="rabbit"||a.sp==="chicken").slice(0,50);
    const lookup=new Map();
    for(const a of present){
      const key=String(a.id);
      if(a.id==null||lookup.has(key))continue;
      lookup.set(key,a);
    }
    for(const key of [...animalById.keys()])if(!lookup.has(key))retireAnimal(key);
    for(const [key,a] of lookup){
      let creature=animalById.get(key);
      if(creature&&creature.userData.kind!==a.sp){
        retireAnimal(key);creature=null;
      }
      if(!creature){
        creature=animal(a,animalById.size);
        creature.name="Animal "+a.sp+" #"+key;
        creature.userData.modelId=key;
        creature.userData.physicsRole="moving";
        creature.traverse(node=>{
          if(node.isMesh&&node.geometry&&node.geometry!==eyeGeo&&
               node.geometry!==plumageGeometry)
            ownedAnimalGeometry.add(node.geometry);
        });
        animalById.set(key,creature);agents.add(creature);animalAdded++;
      }
    }
    for(const creature of agents.children){
      const a=lookup.get(creature.userData.modelId);if(!a)continue;
      const u=creature.userData;u.stage=a.st;u.age=Number(a.age)||0;
      u.health=Number.isFinite(a.health)?THREE.MathUtils.clamp(a.health,0,100):100;
      // Stage size is a visual class, not a fabricated breed-specific weight curve.
      const stageScale=a.st==="kit"?.29:a.st==="chick"?.30:
        a.st==="grower"?.76:a.st==="pullet"||a.st==="cockerel"?.84:1;
      // 1 scene unit = 1 m. Original arbitrary-scale chickens were ~1.56 m
      // high, which exceeded the farm fence. These are plausible illustrative
      // silhouettes, not manufacturer-grade or breed-measured morphometrics.
      creature.scale.setScalar((a.sp==="chicken"?.44:.40)*stageScale);
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
    farm:{eye:V(41.8,3.4,10.2),look:V(36.3,.52,2.3)}
  };
  let view="overview",moving=false,trackedAnimalId=null;
  const eye=views.overview.eye.clone(),focus=views.overview.look.clone();
  const toEye=eye.clone(),toLook=focus.clone();
  camera.position.copy(eye);camera.lookAt(focus);
  function cameraFloor(pos){pos.y=Math.max(pos.y,terrainY(pos.x,pos.z)+.75);return pos}
  function go(kind){
    view=views[kind]?kind:"overview";trackedAnimalId=null;
    toEye.copy(views[view].eye);toLook.copy(views[view].look);cameraFloor(toEye);
  }
  function focusAnimal(rig){
    const id=String(rig?.userData?.modelId??"");
    if(!id||!animalById.has(id))return;
    trackedAnimalId=id;
    const p=rig.position,scale=rig.scale.x;
    toLook.set(p.x,p.y+Math.max(.24,scale*.75),p.z);
    toEye.set(p.x+2.2,p.y+1.8,p.z+3.0);cameraFloor(toEye);
  }
  const ray=new THREE.Raycaster(),pointerMap=new Map();
  let gestureMoved=false,pinchDistance=null;
  canvas.addEventListener("pointerdown",e=>{pointerMap.set(e.pointerId,{x:e.clientX,y:e.clientY});gestureMoved=false;canvas.setPointerCapture(e.pointerId);if(pointerMap.size===2){const p=[...pointerMap.values()];pinchDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}});
  canvas.addEventListener("pointermove",e=>{
    const p=pointerMap.get(e.pointerId);if(!p)return;
    const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    if(Math.abs(dx)+Math.abs(dy)>1){
      gestureMoved=true;trackedAnimalId=null;
    }
    if(pointerMap.size===2){
      const pair=[...pointerMap.values()];
      const d=Math.max(2,Math.hypot(pair[0].x-pair[1].x,pair[0].y-pair[1].y));
      if(pinchDistance!==null){
        const direction=THREE.MathUtils.clamp(pinchDistance/d,.82,1.22);
        const offset=toEye.clone().sub(toLook).multiplyScalar(direction);
        offset.clampLength(view==="farm"?2.8:8,155);
        toEye.copy(toLook).add(offset);cameraFloor(toEye);
      }
      pinchDistance=d;
    }else if(pointerMap.size===1){
      const offset=toEye.clone().sub(toLook);
      const sph=new THREE.Spherical().setFromVector3(offset);
      sph.theta-=dx*.0048;sph.phi=THREE.MathUtils.clamp(sph.phi+dy*.0048,.24,1.43);
      offset.setFromSpherical(sph);
      toEye.copy(toLook).add(offset);cameraFloor(toEye);
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
        if(kind==="chicken"||kind==="rabbit"){
          onSelect("farm",(kind==="chicken"?"Chicken":"Rabbit")+" #"+g.userData.id);
          focusAnimal(g);
        }else onSelect(kind,g.userData.label);
      }
    }
  });
  canvas.addEventListener("pointercancel",e=>{pointerMap.delete(e.pointerId);pinchDistance=null});
  canvas.addEventListener("wheel",e=>{
    e.preventDefault();trackedAnimalId=null;
    const delta=Math.exp(e.deltaY*.0011);
    const d=toEye.clone().sub(toLook);
    d.multiplyScalar(delta).clampLength(view==="farm"?2.8:8,140);
    toEye.copy(toLook).add(d);cameraFloor(toEye);
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
    // Native farm-world motion is an explicit, read-only optional integration.
    // Never infer native agent positions from biological aggregates or invent them.
    // An actual WV.agents Map and calibrated origin must be supplied together.
    if(snapshot.farmWorld != null){
      const origin=snapshot.farmWorldOriginM;
      if(!origin || !["x","y","z"].every(k=>Number.isFinite(origin[k])))
        throw new TypeError("Native farm world requires finite farmWorldOriginM");
      const poses=nativeFarmWorldPoses(snapshot.farmWorld,origin);
      const next=new Map();
      for(const pose of poses){
        if(next.has(pose.id))throw new Error("Duplicate native farm agent ID: "+pose.id);
        next.set(pose.id,pose);
      }
      for(const rig of agents.children){
        const current=next.get(String(rig.userData.modelId));
        const prior=nativeAnimalPoses?.get(String(rig.userData.modelId));
        rig.userData.nativePoseChanged=Boolean(current&&(!prior||
          current.position.x!==prior.position.x||current.position.y!==prior.position.y||
          current.position.z!==prior.position.z));
      }
      nativeAnimalPoses=next;
    }else nativeAnimalPoses=null;
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
    // Illustrative day/night key-light and directional shadow animation.
    // Scenario clock, not ephemeris: never feed these visuals into Solar physics.
    const hour=Number(snapshot.clock.hourOfDay);
    const dayPhase=THREE.MathUtils.clamp((hour-6)/12,0,1);
    const sunLevel=Math.max(0,Math.sin(Math.PI*dayPhase));
    const isDay=hour>=6&&hour<=18;
    const azimuth=(dayPhase-.5)*Math.PI*.86;
    const elevation=(.075+.83*sunLevel)*Math.PI/2;
    const sunDistance=85;
    direct.position.set(
      Math.sin(azimuth)*sunDistance*Math.cos(elevation),
      sunDistance*Math.sin(elevation),
      20+Math.cos(azimuth)*sunDistance*.30*Math.cos(elevation)
    );
    direct.target.position.set(0,0,0);
    direct.target.updateMatrixWorld();
    // Synthetic cloud factor is a scenario assumption, not observed weather.
    const syntheticClarity=THREE.MathUtils.clamp(c.cloudTransmittance,0,1);
    const twilight=isDay?Math.pow(1-sunLevel,5):0;
    // The site-level servedBaseWh is an aggregate, not a lamp circuit meter.
    // These lights are strictly illustrative: no consumption is subtracted.
    // Without supplied base energy the fixtures cannot imply powered lighting.
    const baseSupplyWh=Number(last?.energy?.servedBaseWh)||0;
    const darkness=THREE.MathUtils.clamp((.45-sunLevel)/.45,0,1);
    const lampLevel=baseSupplyWh>0?darkness:0;
    for(const lamp of porchFixtures)lamp.intensity=lampLevel*1.55;
    fixtureGlass.emissiveIntensity=lampLevel*1.8;
    litWindowMaterial.emissiveIntensity=lampLevel*.75;
    skyLight.intensity=.42+sunLevel*(.9+.45*syntheticClarity);
    direct.intensity=isDay?(.08+2.62*sunLevel*syntheticClarity):0;
    direct.color.setHSL(.105-.045*sunLevel,.40+.08*twilight,.70+.19*sunLevel);
    skyLight.color.setHSL(.58,.24,.64+.24*sunLevel);
    scene.background.setHSL(.57+.025*twilight,.29+.16*sunLevel,.105+.59*sunLevel);
    scene.fog.color.copy(scene.background);
    visualSunState={hour,daylight:isDay,syntheticClarity,
      decorativeLighting:{lampCount:porchFixtures.length,intensity:porchFixtures[0].intensity,
        windowEmissive:litWindowMaterial.emissiveIntensity,baseSupplyWh,
        modeledLampLoad:false},
      elevationDeg:elevation*180/Math.PI,azimuthDeg:azimuth*180/Math.PI,
      directIntensity:direct.intensity};
  }
  let nativeAnimalPoses=null;
  let visualSunState=null;
  let previous=performance.now();
  function animate(now){
    if(disposed)return;
    requestAnimationFrame(animate);
    const gap=now-previous;
    const dt=frameDeltaSeconds(gap,document.hidden);previous=now;
    observeFrameGap(now,gap);
    if(playing)visualTime+=dt;
    // A clicked animal can be followed at eye level; drag/pinch/wheel releases
    // follow mode. No biological state or agent motion is driven by this camera.
    if(trackedAnimalId){
      const animalRig=animalById.get(trackedAnimalId);
      if(!animalRig)trackedAnimalId=null;
      else {
        const p=animalRig.position;
        toLook.set(p.x,p.y+Math.max(.24,animalRig.scale.x*.75),p.z);
        toEye.set(p.x+2.2,p.y+1.8,p.z+3.0);
        cameraFloor(toEye);
      }
    }
    // Exponential real-time camera easing is refresh-rate independent.
    const cameraBlend=smoothAlpha(6,dt);
    eye.lerp(toEye,cameraBlend);focus.lerp(toLook,cameraBlend);
    cameraFloor(eye);
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
      const youngRest=!chicken&&youngKit;
      const nativeActive=nativeAnimalPoses?.get(String(s.modelId))?.moving;
      const active=Boolean(playing&&nativeAnimalPoses&&nativeActive);
      // The visual agent traverses genuine horizontal distance around the pen,
      // rather than moving a few centimeters around a fixed sine-wave anchor.
      const nativePose=nativeAnimalPoses?.get(String(s.modelId));
      // A native pose takes priority over the legacy curve. No interpolation
      // can write back into WV.agents or the farm biological model.
      if(nativeAnimalPoses){
        if(!nativePose){
          // Fail closed: an unmatched native ID must never be assigned a
          // fabricated route, gait, or position by the renderer.
          s.walking=false;
          s.torso.position.y=0;
          s.torso.rotation.z=0;
          if(chicken)stepChickenFeet(a,s,false);
          continue;
        }
        const dx=nativePose.position.x-a.position.x;
        const dz=nativePose.position.z-a.position.z;
        const distance=Math.hypot(dx,dz);
        // Travel is derived only from successive native physics snapshots.
        // It must not accumulate again on repeated render frames.
        // The first native sample establishes the pose baseline; the distance
        // from a legacy spawn point is a coordinate-frame jump, not walking.
        if(s.nativePoseChanged&&s.nativePoseInitialized)s.travelM+=distance;
        s.nativePoseInitialized=true;
        a.position.set(nativePose.position.x,nativePose.position.y,nativePose.position.z);
        if(distance>1e-5)a.rotation.y=Math.atan2(dx,dz);
        s.nativePoseChanged=false;
      }
      // No native pose means stationary. Never generate a synthetic path.
      const phase=s.travelM*(chicken?19:11)+s.phase;
      const gait=gaitPose(playing,nativeAnimalPoses?active:awake,
        nativeAnimalPoses?false:youngRest,chicken,phase,i);
      const stepWave=gait.wave;
      // Chicken roots stay exactly on the triangulated ground; the torso bobs
      // over independently animated alternating feet (no helicopter movement).
      a.position.y=nativePose?nativePose.position.y:terrainY(a.position.x,a.position.z)+(chicken?0:gait.heightM);
      // Weight shift follows the same distance-based stance cycle as the feet,
      // not the old high-frequency sinusoidal gait (which made hens vibrate).
      if(chicken){
        const stride=.25*Math.max(.12,a.scale.x/.44);
        const footCycle=chickenFootPhase(s.travelM,0,stride,
          s.footPhaseOffset*stride).phase;
        const loadShift=Math.sin(footCycle*Math.PI*2);
        s.torso.position.y=active?Math.abs(loadShift)*.014:0;
        s.torso.rotation.z=active?loadShift*.025:0;
      }else{
        s.torso.position.y=0;s.torso.rotation.z=0;
      }
      s.walking=active;
      s.head.rotation.x=active?(chicken?.08+Math.max(0,Math.sin(phase*.4+i))*.19:
        .035+Math.sin(phase*.45)*.065):-.04;
      s.head.rotation.y=active?Math.sin(phase*.18+i)*.07:0;
      if(chicken)stepChickenFeet(a,s,active);
      else for(let k=0;k<s.limbs.length;k++){
        const legPhase=k%2?-stepWave:stepWave;
        s.limbs[k].rotation.x=active?Math.max(0,legPhase)*-.18:0;
      }
      for(let k=0;k<s.wings.length;k++)
        s.wings[k].rotation.z=active?Math.sin(phase*.42+k)*.02*(k?1:-1):0;
      for(let k=0;k<s.ears.length;k++)
        s.ears[k].rotation.z=active?Math.sin(phase*.54+k)*.07:0;
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

  function facadeProbe(parent,front,solidX,solidY){
    const ray=new THREE.Raycaster(),dir=V(0,0,-1);
    parent.updateMatrixWorld(true);
    function count(x,y){
      ray.set(V(parent.position.x+x,parent.position.y+y,
        parent.position.z+front.z+1.5),dir);
      return ray.intersectObjects(front.parts,false).length;
    }
    return {wallSegments:front.parts.length,openingCount:front.openings.length,
      blockedOpenings:front.openings.filter(o=>count(o.x,o.y)>0).map(o=>o.name),
      solidWallHits:count(solidX,solidY)};
  }
  let groundingCache=null;
  function chickenFootReport(){
    let chickens=0,planted=0,swinging=0,maxSlipM=0,maxPenetrationM=0;
    for(const rig of agents.children){
      if(rig.userData.kind!=="chicken")continue;
      chickens++;rig.updateMatrixWorld(true);
      for(const leg of rig.userData.limbs){
        const u=leg.userData;
        if(!u.lastWorld)continue;
        const p=u.foot.getWorldPosition(V(0,0,0));
        const floor=terrainY(p.x,p.z);
        maxPenetrationM=Math.max(maxPenetrationM,Math.max(0,floor-p.y));
        if(u.grounded){
          planted++;
          maxSlipM=Math.max(maxSlipM,
            Math.hypot(p.x-u.anchor.x,p.z-u.anchor.z),Math.abs(p.y-floor));
        }else swinging++;
      }
    }
    return {chickens,planted,swinging,maxPlantedSlipM:maxSlipM,
      maxPenetrationM,unit:"m"};
  }
  function animalLifecycleReport(){
    return {active:animalById.size,added:animalAdded,removed:animalRemoved,
      ownedGeometries:ownedAnimalGeometry.size,
      gpuGeometries:renderer.info.memory.geometries,
      stableIds:[...animalById.keys()]};
  }
  function groundingReport(){
    if(groundingCache)return groundingCache;
    // Raycast the actual triangle mesh, not the analytic terrain source.
    const raycaster=new THREE.Raycaster(),down=V(0,-1,0);
    let maxRayResidualM=0,misses=0;
    for(const x of [-56,-28,0,28,56])for(const z of [-40,-20,0,20,40]){
      raycaster.set(V(x,100,z),down);
      const hit=raycaster.intersectObject(terrainMesh,false)[0];
      if(!hit){misses++;continue}
      maxRayResidualM=Math.max(maxRayResidualM,Math.abs(hit.point.y-terrainY(x,z)));
    }
    groundingCache={unit:terrainSpec.unit,raycastMisses:misses,maxRayResidualM,
      foundationCount:foundations.length,
      minimumEmbedM:Math.min(...foundations.map(f=>f.minimumEmbedM)),
      coverViolations:foundations.filter(f=>f.top+1e-9<f.maxTerrain).length,
      foundationAssets:foundations.map(f=>f.asset)};
    return groundingCache;
  }
  requestAnimationFrame(animate);
  return {
    update,go,setPlayback(on){
      playing=Boolean(on);
      if(!playing)for(const rig of agents.children){
        rig.position.y=terrainY(rig.position.x,rig.position.z);
        rig.userData.walking=false;
        if(rig.userData.kind==="chicken"){
          rig.userData.torso.position.y=0;
          stepChickenFeet(rig,rig.userData,false);
        }
      }
    },resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()},
    dispose(){disposed=true;observer.disconnect();renderer.dispose();scene.traverse(obj=>{if(obj.geometry)obj.geometry.dispose()})},
    stats(){return {animals:agents.children.length,paths:flows.length,view,meshes:selectable.length,playing,
      plumage:{sharedGeometry:true,sharedFeatherGeometryCount:1,
        chickens:agents.children.filter(a=>a.userData.kind==="chicken").length,
        decorativeFeathers:agents.children.reduce((n,a)=>n+(a.userData.plumageFeathers||0),0)},
      camera:{requestedDistanceM:toEye.distanceTo(toLook),actualDistanceM:eye.distanceTo(focus),
        heightAboveGroundM:eye.y-terrainY(eye.x,eye.z),
        requestedHeightAboveGroundM:toEye.y-terrainY(toEye.x,toEye.z),
        followAnimalId:trackedAnimalId},
      visualSun:visualSunState?{...visualSunState}:null,
      activeFlowPaths:flows.filter(f=>flowAmount(f.kind,data?.last?.energy,data?.last?.water)>1e-8).length,
      tankFillFraction:visualTankFraction,visualFarmHour:data?.clock?.hourOfDay??null,housingScreenCount,illustrativeCageDoors,qualityTier,qualityPixelRatio:pixelRatio(),qualityFps:Math.round(qualityFps),qualityChanges:quality.changes,grounding:groundingReport(),animalLifecycle:animalLifecycleReport(),
      structureAudit:{houseFacade:facadeProbe(homestead,houseFront,6,3),
        coopFacade:facadeProbe(barn,coopFront,4.1,2.7),
        houseDoorHeightM:frontDoor.geometry.parameters.height,
        coopServiceDoorHeightM:coopDoor.geometry.parameters.height,
        coopPopDoorHeightM:popDoor.geometry.parameters.height,
        coopHatchClearanceM:popDoor.position.y-popDoor.geometry.parameters.height/2-
          (1.24+.79/2),
        closedGables:closedGableCount,
        gateOpeningM:31.65-28.35,
        rampWidthM:ramp.geometry.parameters.width,
        hutchWestWorldX:hutches.position.x-7.85/2,
        westFenceMaxX:19,
        hasRampClearance:(31.65-28.35)>ramp.geometry.parameters.width,
        hutchFenceClearanceM:hutches.position.x-7.85/2-19},
      chickenFootContact:chickenFootReport(),
      animalMotion:{walkingChickens:agents.children.filter(a=>a.userData.kind==="chicken"&&a.userData.walking).length,
        chickenTravelM:agents.children.filter(a=>a.userData.kind==="chicken").reduce((n,a)=>n+a.userData.travelM,0),
        maxRootGroundErrorM:agents.children.filter(a=>a.userData.kind==="chicken").reduce(
          (n,a)=>Math.max(n,Math.abs(a.position.y-terrainY(a.position.x,a.position.z))),0)},
      pausedGroundErrorM:playing?null:agents.children.reduce((e,a)=>Math.max(e,Math.abs(a.position.y-terrainY(a.position.x,a.position.z))),0)}}
  };
}
