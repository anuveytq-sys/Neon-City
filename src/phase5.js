import * as THREE from "three";

/* Phase 5: persistent progression, customization, challenges and city restoration.
   All data is local to the player's browser; no account or paid service is required. */
export function installPhaseFive({THREE:T,scene,world,player,state,cores,platforms,showToast,updateHUD,updateVitals}) {
  const STORE="neon-velocity-phase5-v1";
  const defaults={levels:{speed:0,jump:0,energy:0,shield:0,hacking:0,combat:0,recovery:0},credits:0,inventory:[],achievements:[],outfit:"runner",visor:"#45f6ef",accessory:"none",district:0,checkpoint:null,challenge:{raceBest:null,timeTrialBest:null,hiddenFound:0,environmentSolved:0,bonusUnlocked:false,bonusComplete:false,relicCollected:false},restoration:0};
  let data=structuredClone(defaults), panel=null, challengeActive=null, challengeTime=0, autoSaveTimer=0, lastCheckpoint="";
  const costs={speed:2,jump:2,energy:2,shield:3,hacking:2,combat:3,recovery:2};
  const labels={speed:"SPEED",jump:"JUMP",energy:"ENERGY",shield:"SHIELD",hacking:"HACKING",combat:"COMBAT",recovery:"RECOVERY CORES"};
  const achievements=[
    ["first_core","First Spark","Recover your first energy core."],
    ["runner","Street Runner","Finish a rooftop time trial."],
    ["explorer","Off the Grid","Discover a hidden cache."],
    ["puzzle","Signal Solver","Solve an environmental challenge."],
    ["collector","Well Equipped","Collect four different item types."],
    ["restorer","City Guardian","Restore a city district."],
    ["boss","NEXUS Challenger","Defeat the final network boss."]
  ];
  const cacheObjects=[];
  const accent=new T.MeshStandardMaterial({color:0xff4fd8,emissive:0x7b164f,emissiveIntensity:1.2,metalness:.3,roughness:.4});
  const cyan=new T.MeshStandardMaterial({color:0x45f6ef,emissive:0x087d88,emissiveIntensity:1.3});
  const gold=new T.MeshStandardMaterial({color:0xffd66b,emissive:0x8d5d08,emissiveIntensity:1.1});
  const challengeGroup=new T.Group();world.add(challengeGroup);
  const restorationGroup=new T.Group();restorationGroup.visible=false;world.add(restorationGroup);
  const restorationLights=[];
  for(let i=0;i<6;i++){const g=new T.Group();g.position.set(i%2?12:-12,0,-18-i*14);restorationGroup.add(g);const stem=new T.Mesh(new T.CylinderGeometry(.08,.14,3.2,8),cyan);stem.position.y=1.6;g.add(stem);const glow=new T.Mesh(new T.SphereGeometry(.42,12,8),gold);glow.position.y=3.35;g.add(glow);const light=new T.PointLight(0x45f6ef,0,12);light.position.y=3.35;g.add(light);restorationLights.push({g,light});}
  function makeCache(x,y,z,kind){
    const g=new T.Group();g.position.set(x,y,z);challengeGroup.add(g);
    const core=new T.Mesh(new T.IcosahedronGeometry(.42,1),kind==="hidden"?accent:gold);g.add(core);
    const ring=new T.Mesh(new T.TorusGeometry(.66,.045,8,24),cyan);ring.rotation.x=Math.PI/2;g.add(ring);
    cacheObjects.push({group:g,kind,found:false,baseY:y});
  }
  // Optional discoveries and challenge markers are placed along the original city route.
  makeCache(-7,1.25,-24,"hidden");makeCache(7,1.35,-51,"hidden");makeCache(-7,1.3,-83,"hidden");
  makeCache(0,1.15,-33,"signal");makeCache(0,1.15,-72,"signal");
  const raceStart=new T.Vector3(-6,0,-12),raceEnd=new T.Vector3(6,0,-105);
  const marker=(pos,color)=>{const g=new T.Group();g.position.copy(pos);const r=new T.Mesh(new T.TorusGeometry(1.7,.12,10,32),color);g.add(r);const beam=new T.Mesh(new T.CylinderGeometry(.08,.08,4,8),color);beam.position.y=2;g.add(beam);challengeGroup.add(g);return g;};
  const raceGate=marker(raceStart,accent),finishGate=marker(raceEnd,cyan);finishGate.visible=false;
  const bonusGate=marker(new T.Vector3(0,1.5,-108),gold);bonusGate.visible=false;
  const newAreaGate=marker(new T.Vector3(8,1.5,-88),cyan);newAreaGate.visible=false;
  const newAreaGroup=new T.Group();newAreaGroup.visible=false;world.add(newAreaGroup);
  const areaFloor=new T.Mesh(new T.BoxGeometry(14,1.2,24),new T.MeshStandardMaterial({color:0x1a2940,metalness:.25,roughness:.65}));areaFloor.position.set(25,-.65,-88);newAreaGroup.add(areaFloor);
  const areaBridge=new T.Mesh(new T.BoxGeometry(11,.5,4),new T.MeshStandardMaterial({color:0x18364a,emissive:0x063b4a}));areaBridge.position.set(13.5,-.35,-88);newAreaGroup.add(areaBridge);
  for(let i=0;i<3;i++){const tower=new T.Mesh(new T.BoxGeometry(3,7+i*2,4),new T.MeshStandardMaterial({color:0x202b46,emissive:0x091b35}));tower.position.set(21+i*4.5,3.5+i,-83-i*5);newAreaGroup.add(tower);const strip=new T.Mesh(new T.BoxGeometry(3.05,.1,.08),i%2?accent:cyan);strip.position.set(21+i*4.5,5+i,-85.05-i*5);newAreaGroup.add(strip);}
  const areaRelic=new T.Mesh(new T.OctahedronGeometry(.48,1),gold);areaRelic.position.set(25,1.2,-88);newAreaGroup.add(areaRelic);
  let areaCollidersAdded=false,areaRelicTaken=false;
  const transitGroup=new T.Group();transitGroup.visible=false;world.add(transitGroup);const transitPods=[];
  for(let i=0;i<2;i++){const pod=new T.Group();const shell=new T.Mesh(new T.BoxGeometry(2.2,.65,3.8),new T.MeshStandardMaterial({color:0x1c3850,emissive:0x0b5260}));pod.add(shell);const windowMesh=new T.Mesh(new T.BoxGeometry(1.7,.28,.08),cyan);windowMesh.position.set(0,.12,-1.94);pod.add(windowMesh);transitGroup.add(pod);transitPods.push(pod);}
  const citizenGroup=new T.Group();citizenGroup.visible=false;world.add(citizenGroup);
  for(let i=0;i<4;i++){const person=new T.Group();const torso=new T.Mesh(new T.CapsuleGeometry(.18,.52,4,8),new T.MeshStandardMaterial({color:i%2?0x344b68:0x5a315d,emissive:i%2?0x082b40:0x32102b}));torso.position.y=.55;person.add(torso);const head=new T.Mesh(new T.SphereGeometry(.17,10,8),gold);head.position.y=1.05;person.add(head);person.position.set(i%2?10:-10,0,-25-i*17);citizenGroup.add(person);}
  const newAreaGlow=new T.PointLight(0x45f6ef,0,18);newAreaGlow.position.set(8,3,-88);world.add(newAreaGlow);
  let raceAvailable=true, raceComplete=false, finishToast=false, bonusActive=false, bonusTime=0, bonusCount=0, newAreaToast=false;
  const bonusTokens=[];
  for(const z of [-94,-101,-106]){const token=new T.Mesh(new T.OctahedronGeometry(.38,1),gold);token.position.set(0,1.1,z);token.visible=false;challengeGroup.add(token);bonusTokens.push({mesh:token,taken:false});}
  function openDB(){
    return new Promise(resolve=>{
      if(!("indexedDB" in window)){resolve(null);return;}
      const req=indexedDB.open("NeonVelocitySaves",1);
      req.onupgradeneeded=()=>req.result.createObjectStore("saves");
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>resolve(null);
    });
  }
  async function persist(){
    const snapshot={...data,checkpoint:{x:state.checkpoint.x,y:state.checkpoint.y,z:state.checkpoint.z},district:state.district||0,health:state.health,energy:state.energy,cores:state.cores,collectedCores:cores.map((c,i)=>c.active?null:i).filter(i=>i!==null),inventoryState:state.inventory};
    try{
      const db=await openDB();
      if(db){await new Promise(resolve=>{const tx=db.transaction("saves","readwrite");tx.objectStore("saves").put(snapshot,STORE);tx.oncomplete=resolve;tx.onerror=resolve;});db.close();}
      else localStorage.setItem(STORE,JSON.stringify(snapshot));
    }catch(_){try{localStorage.setItem(STORE,JSON.stringify(snapshot));}catch(__){}}
  }
  async function restore(){
    let saved=null;
    try{
      const db=await openDB();
      if(db){saved=await new Promise(resolve=>{const req=db.transaction("saves","readonly").objectStore("saves").get(STORE);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>resolve(null);});db.close();}
      if(!saved){const raw=localStorage.getItem(STORE);if(raw)saved=JSON.parse(raw);}
    }catch(_){}
    if(!saved)return;
    data={...defaults,...saved,levels:{...defaults.levels,...saved.levels},challenge:{...defaults.challenge,...saved.challenge}};
    if(saved.inventoryState)state.inventory={...state.inventory,...saved.inventoryState};
    if(Number.isFinite(saved.cores))state.cores=saved.cores;
    if(Array.isArray(saved.collectedCores))cores.forEach((c,i)=>{c.active=!saved.collectedCores.includes(i);c.group.visible=c.active;});
    if(Number.isFinite(saved.health))state.health=saved.health;
    if(Number.isFinite(saved.energy))state.energy=saved.energy;
    if(saved.checkpoint&&Number.isFinite(saved.checkpoint.x))state.checkpoint={...saved.checkpoint};
    cacheObjects.forEach(c=>{const group=cacheObjects.filter(x=>x.kind===c.kind);const index=group.indexOf(c);const foundCount=c.kind==="hidden"?data.challenge.hiddenFound:data.challenge.environmentSolved;if(index<foundCount){c.found=true;c.group.visible=false;}});
    raceComplete=data.challenge.raceBest!==null;
    areaRelicTaken=!!data.challenge.relicCollected;areaRelic.visible=!areaRelicTaken;
    bonusGate.visible=data.challenge.bonusUnlocked&&!data.challenge.bonusComplete;
    bonusTokens.forEach(t=>{t.taken=data.challenge.bonusComplete;t.mesh.visible=false;});
    applyCustomization();updateRestorationVisuals();updateHUD();updateVitals();renderPanel();
  }
  function award(id){
    if(data.achievements.includes(id))return;
    data.achievements.push(id);data.credits+=2;
    const a=achievements.find(x=>x[0]===id);showToast("ACHIEVEMENT UNLOCKED · "+(a?a[1]:id)+" · +2 CREDITS");renderPanel();persist();
  }
  function updateRestorationVisuals(){restorationGroup.visible=data.restoration>0;restorationLights.forEach((r,i)=>{const active=i<data.restoration;r.g.visible=active;r.light.intensity=active?5:0;});transitGroup.visible=data.restoration>=2;citizenGroup.visible=data.restoration>=3;newAreaGate.visible=data.restoration>=4;newAreaGroup.visible=data.restoration>=4;newAreaGlow.intensity=data.restoration>=4?8:0;if(data.restoration>=4&&!areaCollidersAdded){platforms.push({minX:8,maxX:19,minY:-.6,maxY:-.1,minZ:-90,maxZ:-86},{minX:18,maxX:32,minY:-1.25,maxY:-.05,minZ:-100,maxZ:-76});areaCollidersAdded=true;}}
  function collect(type){
    if(!data.inventory.includes(type))data.inventory.push(type);
    if(data.inventory.length>=4)award("collector");
    if(type==="core")award("first_core");
    persist();renderPanel();
  }
  function interact(){let nearest=null,dist=3.2;for(const c of cacheObjects){if(c.kind!=="signal"||c.found)continue;const d=player.position.distanceTo(c.group.position);if(d<dist){nearest=c;dist=d;}}if(!nearest)return false;nearest.progress=(nearest.progress||0)+1+Math.floor(level("hacking")/2);showToast("ENVIRONMENTAL SIGNAL "+Math.min(3,nearest.progress)+"/3");if(nearest.progress>=3){nearest.found=true;nearest.group.visible=false;data.challenge.environmentSolved++;data.credits+=2;award("puzzle");showToast("ENVIRONMENTAL PUZZLE SOLVED · +2 CREDITS");persist();renderPanel();}return true;}
  function level(name){return data.levels[name]||0;}
  function buy(name){
    if(!(name in data.levels))return;
    const cost=costs[name]+level(name);
    if(level(name)>=5){showToast("UPGRADE MAXIMUM REACHED");return;}
    if(data.credits<cost){showToast("NEED "+cost+" UPGRADE CREDITS");return;}
    data.credits-=cost;data.levels[name]++;showToast(labels[name]+" UPGRADED · LEVEL "+data.levels[name]);persist();renderPanel();updateVitals();
  }
  const suitMat=new T.MeshStandardMaterial({color:0x45f6ef,emissive:0x087d88,emissiveIntensity:.9,metalness:.4});
  const visorMat=new T.MeshStandardMaterial({color:0x45f6ef,emissive:0x087d88,emissiveIntensity:1.5});
  const wearables=new T.Group();player.add(wearables);
  const chestBadge=new T.Mesh(new T.BoxGeometry(.34,.4,.045),suitMat);chestBadge.position.set(0,1.22,-.34);wearables.add(chestBadge);
  const visor=new T.Mesh(new T.BoxGeometry(.34,.075,.035),visorMat);visor.position.set(0,1.98,-.25);wearables.add(visor);
  const halo=new T.Mesh(new T.TorusGeometry(.42,.055,8,28),gold);halo.position.set(0,2.34,0);halo.visible=false;wearables.add(halo);
  const trail=new T.Mesh(new T.TorusGeometry(.55,.035,8,28),accent);trail.rotation.x=Math.PI/2;trail.position.set(0,.12,.2);trail.visible=false;wearables.add(trail);
  function applyCustomization(){const suitColor=data.outfit==="stealth"?0x56627c:data.outfit==="pulse"?0x1b4560:0x18263d;const pantColor=data.outfit==="stealth"?0x222b3d:data.outfit==="pulse"?0x14283c:0x111a2b;if(player.children[0]?.material?.color)player.children[0].material.color.setHex(suitColor);if(player.children[1]?.material?.color)player.children[1].material.color.setHex(pantColor);suitMat.color.setHex(data.outfit==="stealth"?0x8392a8:data.outfit==="pulse"?0x2b9db0:0x45f6ef);suitMat.emissive.setHex(data.outfit==="stealth"?0x1a2538:0x087d88);visorMat.color.set(data.visor);visorMat.emissive.set(data.visor);halo.visible=data.accessory==="halo";trail.visible=data.accessory==="trail";}
  function outfit(name){data.outfit=name;applyCustomization();showToast("SUIT EQUIPPED · "+name.toUpperCase());persist();}
  function setVisor(color){data.visor=color;applyCustomization();showToast("VISOR COLOR UPDATED");persist();}
  function setAccessory(name){data.accessory=name;applyCustomization();showToast("ACCESSORY · "+name.toUpperCase());persist();}
  function mitigatedDamage(amount){return Math.max(1,amount*(1-level("shield")*.12));}
  function speedMultiplier(){return 1+level("speed")*.09;}
  function jumpMultiplier(){return 1+level("jump")*.08;}
  function energyMultiplier(){return 1+level("energy")*.2;}
  function combatBonus(){return level("combat")*8;}
  function hackingBonus(){return level("hacking");}
  function recoveryBonus(){return level("recovery");}
  function closePanel(){if(!panel)return;panel.classList.add("hidden");state.paused=false;}
  function openPanel(){if(!panel)return;const opening=panel.classList.contains("hidden");panel.classList.toggle("hidden");state.paused=opening;renderPanel();}
  function renderPanel(){
    if(!panel)return;
    const upgrades=Object.keys(labels).map(k=>'<div class="p5-upgrade"><span>'+labels[k]+' <b>LV '+level(k)+'/5</b></span><button data-upgrade="'+k+'">UPGRADE · '+(costs[k]+level(k))+' CR</button></div>').join("");
    const ach=achievements.map(a=>'<div class="p5-ach '+(data.achievements.includes(a[0])?'earned':'')+'"><b>'+a[1]+'</b><small>'+a[2]+'</small></div>').join("");
    panel.querySelector(".p5-content").innerHTML=
      '<div class="p5-summary"><b>'+data.credits+' CREDITS</b><span>CORES '+state.cores+' · INVENTORY '+data.inventory.length+'/4</span></div>'+
      '<h3>NEURAL UPGRADES</h3><div class="p5-upgrades">'+upgrades+'</div>'+
      '<h3>SUIT / VISOR CUSTOMIZATION</h3><div class="p5-options"><button data-outfit="runner">RUNNER SUIT</button><button data-outfit="stealth">STEALTH SUIT</button><button data-outfit="pulse">PULSE SUIT</button></div>'+
      '<div class="p5-options"><button data-visor="#45f6ef">CYAN VISOR</button><button data-visor="#ff4fd8">PINK VISOR</button><button data-visor="#ffd66b">GOLD VISOR</button></div>'+
      '<div class="p5-options"><button data-accessory="none">NO ACCESSORY</button><button data-accessory="halo">HOLO HALO</button><button data-accessory="trail">ENERGY TRAIL</button></div>'+
      '<h3>INVENTORY</h3><p class="p5-inventory">'+(data.inventory.length?data.inventory.join(" · ").toUpperCase():"No discoveries yet")+'</p>'+
      '<h3>ACHIEVEMENTS</h3><div class="p5-achievements">'+ach+'</div>'+
      '<h3>CHALLENGES / CITY STATUS</h3><p class="p5-inventory">HIDDEN CACHES '+data.challenge.hiddenFound+'/3 · ENVIRONMENTAL PUZZLES '+data.challenge.environmentSolved+'/2 · ROOFTOP RACE '+(data.challenge.raceBest===null?"NOT CLEARED":data.challenge.raceBest.toFixed(1)+"s")+' · TIME TRIAL '+(data.challenge.timeTrialBest===null?"NOT CLEARED":data.challenge.timeTrialBest.toFixed(1)+"s")+'</p>'+
      '<button class="p5-save">SAVE PROGRESS NOW</button><button class="p5-close">CLOSE</button>';
    panel.querySelectorAll("[data-upgrade]").forEach(b=>b.addEventListener("click",()=>buy(b.dataset.upgrade)));
    panel.querySelectorAll("[data-outfit]").forEach(b=>b.addEventListener("click",()=>outfit(b.dataset.outfit)));
    panel.querySelectorAll("[data-visor]").forEach(b=>b.addEventListener("click",()=>setVisor(b.dataset.visor)));
    panel.querySelectorAll("[data-accessory]").forEach(b=>b.addEventListener("click",()=>setAccessory(b.dataset.accessory)));
    panel.querySelector(".p5-save").addEventListener("click",()=>{persist();showToast("PROGRESS SAVED");});
    panel.querySelector(".p5-close").addEventListener("click",closePanel);
  }
  function buildPanel(){
    panel=document.createElement("section");panel.id="phase5-panel";panel.className="hidden";
    panel.innerHTML='<div class="p5-head"><div><small>NEON VELOCITY // PHASE 05</small><h2>PLAYER PROGRESSION</h2></div><button class="p5-x" aria-label="Close progression">×</button></div><div class="p5-content"></div>';
    document.querySelector("#app").appendChild(panel);
    panel.querySelector(".p5-x").addEventListener("click",closePanel);
  }
  function update(dt,time){
    autoSaveTimer+=dt;if(autoSaveTimer>12){autoSaveTimer=0;persist();}
    updateRestorationVisuals();
    if(newAreaGroup.visible&&!areaRelicTaken){areaRelic.rotation.y+=dt*1.5;if(player.position.distanceTo(areaRelic.position)<1.5){areaRelicTaken=true;data.challenge.relicCollected=true;areaRelic.visible=false;data.credits+=3;collect("district relic");showToast("SECRET DISTRICT RELIC RECOVERED · +3 CREDITS");}}
    if(data.restoration>=4&&!newAreaToast&&player.position.distanceTo(newAreaGate.position)<4){newAreaToast=true;showToast("RESTORED TRANSIT ACCESS OPEN · NEW CITY ROUTE AVAILABLE");}
    transitPods.forEach((p,i)=>{p.position.set(Math.sin(time*.35+i*Math.PI)*2.5,.9,-12-((time*3+i*45)%92));p.rotation.y=Math.PI;});
    for(const c of cacheObjects){
      c.group.rotation.y+=dt*.8;c.group.position.y=c.baseY+Math.sin(time*2+c.baseY)*.12;
      if(c.kind!=="signal"&&!c.found&&player.position.distanceTo(c.group.position)<1.5){
        c.found=true;c.group.visible=false;
        if(c.kind==="hidden"){data.challenge.hiddenFound++;data.credits+=2;award("explorer");showToast("HIDDEN DATA CACHE · +2 CREDITS");}
        persist();renderPanel();
      }
    }
    if(!raceComplete&&player.position.distanceTo(raceStart)<2.6&&state.active){
      if(!challengeActive){challengeActive="race";challengeTime=0;finishGate.visible=true;showToast("ROOFTOP RACE STARTED · REACH THE FAR GATE");}
    }
    if(challengeActive){challengeTime+=dt;if(challengeTime>90){challengeActive=null;finishGate.visible=false;showToast("TIME TRIAL EXPIRED");}
      else if(player.position.distanceTo(raceEnd)<3){
        const t=challengeTime;challengeActive=null;finishGate.visible=false;raceComplete=true;
        data.challenge.raceBest=data.challenge.raceBest===null?t:Math.min(t,data.challenge.raceBest);
        data.challenge.timeTrialBest=data.challenge.timeTrialBest===null?t:Math.min(t,data.challenge.timeTrialBest);
        data.credits+=4;award("runner");showToast("ROOFTOP TIME TRIAL COMPLETE · "+t.toFixed(1)+"s · +4 CREDITS");persist();renderPanel();
      }
    }
    if(data.challenge.hiddenFound>=3&&data.challenge.environmentSolved>=2&&!data.challenge.bonusUnlocked){data.challenge.bonusUnlocked=true;bonusGate.visible=true;showToast("BONUS LEVEL UNLOCKED · NEON OVERDRIVE");persist();renderPanel();}
    if(data.challenge.bonusUnlocked&&!data.challenge.bonusComplete&&!bonusActive&&player.position.distanceTo(bonusGate.position)<3){bonusActive=true;bonusTime=35;bonusCount=0;bonusTokens.forEach(t=>{t.taken=false;t.mesh.visible=true;});showToast("NEON OVERDRIVE BONUS LEVEL · COLLECT 3 SHARDS · 35 SEC");}
    if(bonusActive){bonusTime-=dt;bonusTokens.forEach(t=>{t.mesh.rotation.y+=dt*2;if(!t.taken&&player.position.distanceTo(t.mesh.position)<1.35){t.taken=true;t.mesh.visible=false;bonusCount++;showToast("BONUS DATA SHARD "+bonusCount+"/3");}});if(bonusCount>=3){bonusActive=false;data.challenge.bonusComplete=true;data.credits+=5;data.restoration=Math.min(6,data.restoration+1);award("restorer");updateRestorationVisuals();showToast("BONUS LEVEL CLEARED · DISTRICT RESTORED · +5 CREDITS");persist();renderPanel();}else if(bonusTime<=0){bonusActive=false;bonusTokens.forEach(t=>{t.taken=false;t.mesh.visible=false;});bonusCount=0;showToast("BONUS LEVEL TIME EXPIRED");}}
  }
  buildPanel();applyCustomization();restore();
  return {update,openPanel,closePanel,persist,collect,award,interact,level,speedMultiplier,jumpMultiplier,energyMultiplier,combatBonus,hackingBonus,recoveryBonus,mitigatedDamage,
    onBossDefeated(){award("boss");data.credits+=5;data.restoration=Math.min(6,data.restoration+1);updateRestorationVisuals();persist();renderPanel();},
    onDistrictRestored(){data.restoration=Math.min(6,data.restoration+1);updateRestorationVisuals();award("restorer");persist();},
    get data(){return data;}
  };
}
