import * as THREE from "three";
import "./style.css";

const root = document.querySelector("#game-root");
const loading = document.querySelector("#loading-screen");
const title = document.querySelector("#title-screen");
const hud = document.querySelector("#hud");
const pauseScreen = document.querySelector("#pause-screen");
const winScreen = document.querySelector("#win-screen");
const touchControls = document.querySelector("#touch-controls");
const coreCount = document.querySelector("#core-count");
const progressFill = document.querySelector("#progress-fill");
const objective = document.querySelector("#objective");
const toast = document.querySelector("#toast");
const isTouch = matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080d20);
scene.fog = new THREE.FogExp2(0x080d20, 0.014);
function gameViewport(){const rotateViewport=isTouch&&innerHeight>innerWidth&&innerWidth<=800;return rotateViewport?{width:innerHeight,height:innerWidth}:{width:innerWidth,height:innerHeight};}
const initialViewport=gameViewport();
const camera = new THREE.PerspectiveCamera(62, initialViewport.width / initialViewport.height, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: !isTouch, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2));
renderer.setSize(initialViewport.width, initialViewport.height);
renderer.shadowMap.enabled = !isTouch;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
root.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x9abaff, 0x101020, 1.7));
const keyLight = new THREE.DirectionalLight(0x83eaff, 2.5);
keyLight.position.set(-18, 35, 12);
keyLight.castShadow = !isTouch;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);
const pinkLight = new THREE.PointLight(0xff38d1, 65, 45); pinkLight.position.set(8, 7, -15); scene.add(pinkLight);
const cyanLight = new THREE.PointLight(0x21eaff, 75, 55); cyanLight.position.set(-12, 8, -42); scene.add(cyanLight);

const mat = (color, emissive = 0x000000, roughness = .55) => new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: emissive ? 1.4 : 0, roughness, metalness: .25 });
const floorMat = mat(0x17233c), wallMat = mat(0x202d49), darkMat = mat(0x0b1428), cyanMat = mat(0x45f6ef, 0x0b8f96), pinkMat = mat(0xff4fd8, 0x9c126f), goldMat = mat(0xffd66b, 0x8d5d08);
const boxGeo = new THREE.BoxGeometry(1,1,1);
const world = new THREE.Group(); scene.add(world);
const platforms = [];
function box(x,y,z,sx,sy,sz,material,collide=true){
  const mesh = new THREE.Mesh(boxGeo, material); mesh.position.set(x,y,z); mesh.scale.set(sx,sy,sz); mesh.castShadow = true; mesh.receiveShadow = true; world.add(mesh);
  if(collide) platforms.push({minX:x-sx/2,maxX:x+sx/2,minY:y-sy/2,maxY:y+sy/2,minZ:z-sz/2,maxZ:z+sz/2});
  return mesh;
}
function neonLine(x,y,z,sx,sz,material){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,.07,sz),material);m.position.set(x,y,z);world.add(m);return m;}

// Floating route through a compact neon district.
box(0,-.65,-12,18,1.2,34,floorMat);
box(0,-.65,-35,13,1.2,15,floorMat);
box(-4,-.65,-52,10,1.2,17,floorMat);
box(3,-.65,-70,13,1.2,18,floorMat);
box(0,-.65,-88,18,1.2,18,floorMat);
box(0,-.65,-106,22,1.2,18,floorMat);
box(0,-1.35,-58,160,1,160,darkMat,false);
for(let z=-5;z>-112;z-=8){neonLine(0,-.02,z,17,.12,cyanMat);}
for(let i=0;i<16;i++){
  const z=-i*7-7, h=5+(i*7%13), x=(i%2?1:-1)*(13+(i%3)*4);
  const b=box(x,h/2-0.3,z,5,h,6,i%3===0?mat(0x382144):wallMat,false);
  const strips=new THREE.Mesh(new THREE.BoxGeometry(5.04,.09,.08),i%2?cyanMat:pinkMat);
  for(let yy=1;yy<h;yy+=1.5){const s=strips.clone();s.position.set(x,yy,z-3.04);world.add(s);}
  b.material=wallMat;
}
for(let z=-12;z>-112;z-=16){for(let side of [-1,1]){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.11,5,8),darkMat);pole.position.set(side*8,2,z);world.add(pole);const lamp=new THREE.PointLight(side>0?0xff4fd8:0x32f5ff,16,13);lamp.position.set(side*8,4.5,z);world.add(lamp);}}
for(const [x,z] of [[-5,-19],[5,-28],[-4,-42],[4,-60],[-5,-76],[5,-94]]) box(x,1.1,z,3.4,.45,3.4,wallMat);
box(0,.3,-113,8,1.2,8,wallMat);
const portal = new THREE.Group();portal.position.set(0,1.5,-112);world.add(portal);
const ring=new THREE.Mesh(new THREE.TorusGeometry(2.1,.16,12,48),cyanMat);portal.add(ring);
const ring2=new THREE.Mesh(new THREE.TorusGeometry(1.65,.06,8,48),pinkMat);portal.add(ring2);
const portalLight=new THREE.PointLight(0x38f6ff,45,18);portalLight.position.set(0,1,0);portal.add(portalLight);

// Player character: stylised 3D runner.
const player = new THREE.Group(); world.add(player);
const body = new THREE.Mesh(new THREE.CapsuleGeometry(.48,.85,5,10),mat(0x222e4c)); body.position.y=1.05; body.castShadow=true;player.add(body);
const head = new THREE.Mesh(new THREE.SphereGeometry(.34,16,12),mat(0xffc7ad));head.position.y=1.95;player.add(head);
const hair = new THREE.Mesh(new THREE.SphereGeometry(.37,16,12,0,Math.PI*2,0,Math.PI*.62),mat(0x171326));hair.position.y=2.08;player.add(hair);
const visor = new THREE.Mesh(new THREE.BoxGeometry(.48,.12,.1),cyanMat);visor.position.set(0,1.99,-.3);player.add(visor);
const stripe = new THREE.Mesh(new THREE.BoxGeometry(.72,.13,.54),pinkMat);stripe.position.set(0,1.25,0);player.add(stripe);
const limbMat=mat(0x263653), jointMat=mat(0x111a2d);
const limbGeo=new THREE.CapsuleGeometry(.13,.48,4,8);
const arms=[],legs=[];
for(const side of [-1,1]){
  const arm=new THREE.Mesh(limbGeo,limbMat);arm.position.set(side*.48,1.25,0);arm.rotation.z=side*.12;player.add(arm);arms.push(arm);
  const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.16,.48,4,8),jointMat);leg.position.set(side*.22,.53,0);player.add(leg);legs.push(leg);
}
const footGeo=new THREE.BoxGeometry(.3,.18,.5);const feet=[];
for(const x of [-.25,.25]){const f=new THREE.Mesh(footGeo,mat(0x101827));f.position.set(x,.12,0);player.add(f);feet.push(f);}
const playerState={x:0,y:0,z:0,vx:0,vy:0,vz:0,grounded:true,cores:0,checkpoint:{x:0,y:0,z:0},active:false,paused:false,won:false};
player.position.set(0,0,1);

// Energy cores.
const cores=[];
for(const [x,y,z] of [[-3,1.5,-9],[3,1.5,-17],[-4,2.2,-27],[4,1.7,-37],[-4,1.7,-49],[4,2.4,-62],[-4,1.7,-78],[0,2.2,-96]]){
  const g=new THREE.Group();g.position.set(x,y,z);world.add(g);
  const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.58,0),goldMat);gem.rotation.y=Math.PI/4;g.add(gem);
  const aura=new THREE.Mesh(new THREE.TorusGeometry(.8,.035,8,24),cyanMat);aura.rotation.x=Math.PI/2;g.add(aura);
  const light=new THREE.PointLight(0xffc85a,8,5);g.add(light);cores.push({group:g,gem,active:true});
}

// Patrol drones are hazards to dodge, not combat targets.
const drones=[];
for(const [x,z,range,speed] of [[-2,-31,3,1.2],[2,-68,3.5,1.5],[0,-91,4,1.1]]){
  const d=new THREE.Group();d.position.set(x,1.4,z);world.add(d);
  const shell=new THREE.Mesh(new THREE.SphereGeometry(.62,16,12),mat(0x3a284f,0x7d174f));d.add(shell);
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8),pinkMat);eye.position.set(0,0,-.53);d.add(eye);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.85,.045,8,24),pinkMat);halo.rotation.x=Math.PI/2;d.add(halo);
  drones.push({group:d,baseX:x,baseZ:z,range,speed,phase:Math.random()*6.28});
}

// Atmospheric stars and distant skyline.
const starsGeo=new THREE.BufferGeometry(), starPos=[];
for(let i=0;i<600;i++)starPos.push((Math.random()-.5)*260,Math.random()*70+4,-Math.random()*180-5);
starsGeo.setAttribute("position",new THREE.Float32BufferAttribute(starPos,3));
scene.add(new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0x9bc9ff,size:.22,transparent:true,opacity:.8})));
const skyline=new THREE.Group();scene.add(skyline);
for(let i=0;i<80;i++){const h=5+Math.random()*30;const m=new THREE.Mesh(boxGeo,mat(i%4===0?0x1c1a37:0x111a30));m.scale.set(3+Math.random()*5,h,3+Math.random()*5);m.position.set((Math.random()-.5)*180,h/2-1,-Math.random()*150-15);skyline.add(m);}

// Phase 2 district dressing: layered rails, service conduits, rooftop units and holographic markers.
const detailGroup=new THREE.Group();world.add(detailGroup);
for(let z=-8;z>-112;z-=12){
  for(const side of [-1,1]){
    const rail=new THREE.Mesh(new THREE.BoxGeometry(.12,.72,10),cyanMat);rail.position.set(side*8.55,.34,z-3);detailGroup.add(rail);
    const support=new THREE.Mesh(new THREE.BoxGeometry(.18,.9,.18),darkMat);support.position.set(side*8.55,.2,z-7);detailGroup.add(support);
    const conduit=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,9,8),pinkMat);conduit.rotation.x=Math.PI/2;conduit.position.set(side*7.8,.12,z-3);detailGroup.add(conduit);
  }
}
for(let i=0;i<12;i++){
  const z=-10-i*8,side=i%2?1:-1,x=side*(6.7+(i%3)*.35);
  const unit=new THREE.Group();unit.position.set(x,.05,z);detailGroup.add(unit);
  const base=new THREE.Mesh(new THREE.BoxGeometry(1.15,.42,1.5),darkMat);unit.add(base);
  const glow=new THREE.Mesh(new THREE.BoxGeometry(.82,.035,1.08),i%2?pinkMat:cyanMat);glow.position.y=.23;unit.add(glow);
  const beacon=new THREE.PointLight(i%2?0xff3fd1:0x39f5ff,2.5,4);beacon.position.y=.8;unit.add(beacon);
}
for(let i=0;i<8;i++){
  const z=-16-i*12;
  const sign=new THREE.Group();sign.position.set(i%2?7.6:-7.6,3.2,z);world.add(sign);
  const frame=new THREE.Mesh(new THREE.BoxGeometry(1.45,1.05,.12),darkMat);sign.add(frame);
  const panel=new THREE.Mesh(new THREE.BoxGeometry(1.22,.78,.04),i%2?pinkMat:cyanMat);panel.position.z=-.09;sign.add(panel);
  const glyph=new THREE.Mesh(new THREE.BoxGeometry(.72,.08,.05),mat(0xeafcff,0x7acfff));glyph.position.z=-.13;sign.add(glyph);
}


// Input
const keys=new Set(), touch=new Set();
let cameraYaw=0, cameraPitch=.16, dragging=false,lastPointer=null;
addEventListener("keydown",e=>{if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if(e.key.toLowerCase()==="p"&&playerState.active)togglePause();});
addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
renderer.domElement.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"||e.pointerType==="touch"){dragging=true;lastPointer={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture?.(e.pointerId);}});
addEventListener("pointerup",()=>{dragging=false;lastPointer=null;});
addEventListener("pointercancel",()=>{dragging=false;lastPointer=null;});
addEventListener("pointermove",e=>{if(dragging&&lastPointer&&playerState.active&&!playerState.paused){cameraYaw-= (e.clientX-lastPointer.x)*.005;cameraPitch=THREE.MathUtils.clamp(cameraPitch+(e.clientY-lastPointer.y)*.0025,-.12,.68);lastPointer={x:e.clientX,y:e.clientY};}});
function bindHold(button,action){button.addEventListener("pointerdown",e=>{e.preventDefault();touch.add(action);button.setPointerCapture?.(e.pointerId);});for(const ev of ["pointerup","pointercancel","lostpointercapture"])button.addEventListener(ev,()=>touch.delete(action));}
document.querySelectorAll("[data-move]").forEach(b=>bindHold(b,b.dataset.move));
const jumpButton=document.querySelector("#jump-button");
let jumpQueued=false;jumpButton.addEventListener("pointerdown",e=>{e.preventDefault();jumpQueued=true;});

// Phase 2 character controller: swept vertical landing, separate horizontal resolution,
// stable ground support, buffered jumps, coyote time, and bounded acceleration.
const PLAYER_RADIUS=.34, PLAYER_HEIGHT=2.2, GRAVITY=25, JUMP_SPEED=10.2;
let coyoteTimer=0,jumpBuffer=0;
function overlapsBody(p,x,z,feetY){
  const horizontal=x+PLAYER_RADIUS>p.minX&&x-PLAYER_RADIUS<p.maxX&&z+PLAYER_RADIUS>p.minZ&&z-PLAYER_RADIUS<p.maxZ;
  const vertical=feetY<p.maxY-.025&&feetY+PLAYER_HEIGHT>p.minY+.025;
  return horizontal&&vertical;
}
function collidesAt(x,z,y){return platforms.some(p=>overlapsBody(p,x,z,y));}
function findLanding(x,z,oldY,newY){
  let top=-Infinity;
  for(const p of platforms){
    if(x+PLAYER_RADIUS>p.minX&&x-PLAYER_RADIUS<p.maxX&&z+PLAYER_RADIUS>p.minZ&&z-PLAYER_RADIUS<p.maxZ&&oldY>=p.maxY-.18&&newY<=p.maxY&&p.maxY>top)top=p.maxY;
  }
  return top;
}
function respawn(){playerState.x=playerState.checkpoint.x;playerState.z=playerState.checkpoint.z;playerState.y=playerState.checkpoint.y??0;playerState.vy=0;playerState.vx=0;playerState.vz=0;playerState.grounded=false;coyoteTimer=0;jumpBuffer=0;player.position.set(playerState.x,playerState.y,playerState.z);showToast("CHECKPOINT RESTORED");}
let toastTimer;
function showToast(text){toast.textContent=text;toast.style.opacity="1";clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.style.opacity="0",1400);}
function updateHUD(){coreCount.textContent=String(playerState.cores).padStart(2,"0")+" / 08";progressFill.style.width=(playerState.cores/8*100)+"%";objective.textContent=playerState.cores===8?"Reach the glowing grid portal":"Collect the "+(8-playerState.cores)+" remaining energy cores";}
async function requestLandscape(){try{if(screen.orientation?.lock)await screen.orientation.lock("landscape");}catch(_error){/* iOS Safari and some browsers use the CSS-rotated landscape fallback. */}}
function startGame(){requestLandscape();title.classList.add("hidden");pauseScreen.classList.add("hidden");winScreen.classList.add("hidden");hud.classList.remove("hidden");if(isTouch)touchControls.classList.remove("hidden");playerState.active=true;playerState.paused=false;playerState.won=false;}
function togglePause(force){if(!playerState.active)return;playerState.paused=force??!playerState.paused;pauseScreen.classList.toggle("hidden",!playerState.paused);}
function restart(){playerState.cores=0;cores.forEach(c=>{c.active=true;c.group.visible=true;});playerState.checkpoint={x:0,y:0,z:1};respawn();updateHUD();startGame();}
document.querySelector("#play-button").addEventListener("click",startGame);
document.querySelector("#pause-button").addEventListener("click",()=>togglePause());
document.querySelector("#resume-button").addEventListener("click",()=>togglePause(false));
document.querySelector("#restart-button").addEventListener("click",restart);
document.querySelector("#again-button").addEventListener("click",restart);
function resizeGame(){const viewport=gameViewport();camera.aspect=viewport.width/viewport.height;camera.updateProjectionMatrix();renderer.setSize(viewport.width,viewport.height);renderer.setPixelRatio(Math.min(devicePixelRatio,isTouch?1.5:2));}
addEventListener("resize",resizeGame);
addEventListener("orientationchange",()=>setTimeout(resizeGame,180));
function axisInput(){const f=(keys.has("w")||keys.has("arrowup")||touch.has("forward")?1:0)-(keys.has("s")||keys.has("arrowdown")||touch.has("back")?1:0);const r=(keys.has("d")||keys.has("arrowright")||touch.has("right")?1:0)-(keys.has("a")||keys.has("arrowleft")||touch.has("left")?1:0);return {f,r};}
const clock=new THREE.Clock();
function update(dt,time){
  cores.forEach((c,i)=>{if(c.active){c.group.rotation.y+=dt*.8;c.gem.rotation.y+=dt*1.4;c.group.position.y+=Math.sin(time*2+i)*.0015;}});
  drones.forEach(d=>{d.group.position.x=d.baseX+Math.sin(time*d.speed+d.phase)*d.range;d.group.position.y=1.5+Math.sin(time*2+d.phase)*.25;d.group.rotation.y+=dt*.8;});
  portal.rotation.y+=dt*.3;ring.rotation.z+=dt*.5;ring2.rotation.z-=dt*.4;
  if(!playerState.active||playerState.paused||playerState.won)return;
  const {f,r}=axisInput();const forward=new THREE.Vector3(Math.sin(cameraYaw),0,-Math.cos(cameraYaw));const right=new THREE.Vector3(Math.cos(cameraYaw),0,Math.sin(cameraYaw));
  const dir=forward.multiplyScalar(f).add(right.multiplyScalar(r));if(dir.lengthSq()>1)dir.normalize();
  const sprint=keys.has("shift")?1.28:1;const speed=7.4*sprint;
  const targetVX=dir.x*speed,targetVZ=dir.z*speed;
  const accel=playerState.grounded?19:8;
  playerState.vx=THREE.MathUtils.damp(playerState.vx,targetVX,accel,dt);
  playerState.vz=THREE.MathUtils.damp(playerState.vz,targetVZ,accel,dt);
  if(playerState.grounded)coyoteTimer=.12;else coyoteTimer=Math.max(0,coyoteTimer-dt);
  if(keys.has(" ")||keys.has("space")||jumpQueued)jumpBuffer=.14;else jumpBuffer=Math.max(0,jumpBuffer-dt);
  if(jumpBuffer>0&&coyoteTimer>0){playerState.vy=JUMP_SPEED;playerState.grounded=false;coyoteTimer=0;jumpBuffer=0;}
  jumpQueued=false;
  const oldY=playerState.y;playerState.vy-=GRAVITY*dt;
  let nextX=playerState.x+playerState.vx*dt,nextZ=playerState.z+playerState.vz*dt;
  if(collidesAt(nextX,playerState.z,playerState.y)){nextX=playerState.x;playerState.vx=0;}
  if(collidesAt(nextX,nextZ,playerState.y)){nextZ=playerState.z;playerState.vz=0;}
  let nextY=playerState.y+playerState.vy*dt;
  if(playerState.vy<=0){const landing=findLanding(nextX,nextZ,oldY,nextY);if(landing>-Infinity){nextY=landing;playerState.vy=0;playerState.grounded=true;}else playerState.grounded=false;}
  else {if(collidesAt(nextX,nextZ,nextY)){playerState.vy=0;nextY=playerState.y;}playerState.grounded=false;}
  playerState.x=nextX;playerState.z=nextZ;playerState.y=nextY;
  if(playerState.y< -8||playerState.z< -125)respawn();
  player.position.set(playerState.x,playerState.y,playerState.z);
  const moving=dir.lengthSq()>.04;const gait=time*(keys.has("shift")?15:11);
  if(moving){player.rotation.y=Math.atan2(dir.x,-dir.z);body.position.y=1.05+(playerState.grounded?Math.abs(Math.sin(gait))*.045:0);body.rotation.z=THREE.MathUtils.damp(body.rotation.z,-dir.x*.07,8,dt);}
  else {body.position.y=THREE.MathUtils.damp(body.position.y,1.05,8,dt);body.rotation.z=THREE.MathUtils.damp(body.rotation.z,0,8,dt);}
  const swing=playerState.grounded&&moving?Math.sin(gait)*.62:0;
  legs.forEach((limb,i)=>limb.rotation.x=i===0?swing:-swing);
  arms.forEach((limb,i)=>limb.rotation.x=i===0?-swing*.8:swing*.8);
  feet[0].rotation.x=swing*.7;feet[1].rotation.x=-swing*.7;
  if(!playerState.grounded){legs.forEach((limb,i)=>limb.rotation.x=i===0?-.35:.35);arms.forEach(limb=>limb.rotation.x=-.45);}
  cores.forEach(c=>{if(c.active&&player.position.distanceTo(c.group.position)<1.55){c.active=false;c.group.visible=false;playerState.cores++;if(playerState.cores%2===0)playerState.checkpoint={x:playerState.x,y:playerState.y,z:playerState.z};updateHUD();showToast("ENERGY CORE RECOVERED");}});
  drones.forEach(d=>{if(player.position.distanceTo(d.group.position)<1.15){respawn();}});
  if(playerState.cores===8&&player.position.distanceTo(portal.position)<3){playerState.won=true;playerState.active=false;hud.classList.add("hidden");touchControls.classList.add("hidden");winScreen.classList.remove("hidden");}
  const followDistance=isTouch?8.2:9.2;
  const target=new THREE.Vector3(player.position.x+Math.sin(cameraYaw)*followDistance,player.position.y+4.3+cameraPitch*5.2,player.position.z+Math.cos(cameraYaw)*followDistance);
  camera.position.lerp(target,1-Math.exp(-7*dt));camera.lookAt(player.position.x,player.position.y+1.15,player.position.z-1.15);
}
camera.position.set(0,6,11);camera.lookAt(0,1,-4);
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;update(dt,t);renderer.render(scene,camera);}
animate();
loading.classList.add("hidden");
updateHUD();
