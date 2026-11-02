import * as THREE from "three";

/* Phase 5: persistent progression, customization, challenges and city restoration.
   All data is local to the player's browser; no account or paid service is required. */
export function installPhaseFive({THREE:T,scene,world,player,state,showToast,updateHUD,updateVitals}) {
  const STORE="neon-velocity-phase5-v1";
  const defaults={levels:{speed:0,jump:0,energy:0,shield:0,hacking:0,combat:0,recovery:0},credits:0,inventory:[],achievements:[],outfit:"runner",visor:"#45f6ef",accessory:"none",district:0,checkpoint:null,challenge:{raceBest:null,timeTrialBest:null,hiddenFound:0,environmentSolved:0,bonusUnlocked:false,bonusComplete:false},restoration:0};
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
  const restorationGroup=new T.Group();world.add(restorationGroup);
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
  makeCache(0,1.15,-33,"challenge");makeCache(0,1.15,-72,"challenge");
  const raceStart=new T.Vector3(-6,0,-12),raceEnd=new T.Vector3(6,0,-105);
  const marker=(pos,color)=>{const g=new T.Group();g.position.copy(pos);const r=new T.Mesh(new T.TorusGeometry(1.7,.12,10,32),color);g.add(r);const beam=new T.Mesh(new T.CylinderGeometry(.08,.08,4,8),color);beam.position.y=2;g.add(beam);challengeGroup.add(g);return g;};
  const raceGate=marker(raceStart,accent),finishGate=marker(raceEnd,cyan);finishGate.visible=false;
  const bonusGate=marker(new T.Vector3(0,1.5,-108),gold);bonusGate.visible=false;
  let raceAvailable=true, raceComplete=false, finishToast=false, bonusActive=false, bonusTime=0, bonusCount=0;\n  const bonusTokens=[];\n  for(const z of [-94,-101,-106]){const token=new T.Mesh(new T.OctahedronGeometry(.38,1),gold);token.position.set(0,1.1,z);challengeGroup.add(token);bonusTokens.push({mesh:token,taken:false});}
  function openDB(){
    return new Promise(resolve=>{
      if(!("indexedDB" in window)){resolve(null);return;}
      const req=indexedDB.open("NeonVelocitySaves",1);
      req.onupgradeneeded=()=>req.result.createObjectStore("saves");
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>resolve(null);
    });
  }
  async function persist(){
    const snapshot={...data,checkpoint:{x:state.checkpoint.x,y:state.checkpoint.y,z:state.checkpoint.z},district:state.district||0,health:state.health,energy:state.energy,cores:state.cores,inventoryState:state.inventory};
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
    if(Number.isFinite(saved.health))state.health=saved.health;
    if(Number.isFinite(saved.energy))state.energy=saved.energy;
    if(saved.checkpoint&&Number.isFinite(saved.checkpoint.x)){
      state.checkpoint={...saved.checkpoint};state.x=saved.checkpoint.x;state.y=saved.checkpoint.y;state.z=saved.checkpoint.z;
      player.position.set(state.x,state.y,state.z);
    }
    updateHUD();updateVitals();renderPanel();
  }
  function award(id){
    if(data.achievements.includes(id))return;
    data.achievements.push(id);data.credits+=2;
    const a=achievements.find(x=>x[0]===id);showToast("ACHIEVEMENT UNLOCKED · "+(a?a[1]:id)+" · +2 CREDITS");renderPanel();persist();
  }
  function updateRestorationVisuals(){restorationLights.forEach((r,i)=>{const active=i<data.restoration;r.g.visible=active;r.light.intensity=active?5:0;});}\n  function collect(type){
    if(!data.inventory.includes(type))data.inventory.push(type);
    if(data.inventory.length>=4)award("collector");
    if(type==="core")award("first_core");
    persist();renderPanel();
  }
  function level(name){return data.levels[name]||0;}
  function buy(name){
    if(!(name in data.levels))return;
    const cost=costs[name]+level(name);
    if(level(name)>=5){showToast("UPGRADE MAXIMUM REACHED");return;}
    if(data.credits<cost){showToast("NEED "+cost+" UPGRADE CREDITS");return;}
    data.credits-=cost;data.levels[name]++;showToast(labels[name]+" UPGRADED · LEVEL "+data.levels[name]);persist();renderPanel();updateVitals();
  }
  const suitMat=new T.MeshStandardMaterial({color:0x45f6ef,emissive:0x087d88,emissiveIntensity:.9,metalness:.4});\n  const visorMat=new T.MeshStandardMaterial({color:0x45f6ef,emissive:0x087d88,emissiveIntensity:1.5});\n  const wearables=new T.Group();player.add(wearables);\n  const chestBadge=new T.Mesh(new T.BoxGeometry(.34,.4,.045),suitMat);chestBadge.position.set(0,1.22,-.34);wearables.add(chestBadge);\n  const visor=new T.Mesh(new T.BoxGeometry(.34,.075,.035),visorMat);visor.position.set(0,1.98,-.25);wearables.add(visor);\n  const halo=new T.Mesh(new T.TorusGeometry(.42,.055,8,28),gold);halo.position.set(0,2.34,0);halo.visible=false;wearables.add(halo);\n  const trail=new T.Mesh(new T.TorusGeometry(.55,.035,8,28),accent);trail.rotation.x=Math.PI/2;trail.position.set(0,.12,.2);trail.visible=false;wearables.add(trail);\n  function applyCustomization(){suitMat.color.setHex(data.outfit==="stealth"?0x56627c:data.outfit==="pulse"?0x1b4560:0x45f6ef);suitMat.emissive.setHex(data.outfit==="stealth"?0x1a2538:data.outfit==="pulse"?0x087d88:0x087d88);visorMat.color.set(data.visor);visorMat.emissive.set(data.visor);halo.visible=data.accessory==="halo";trail.visible=data.accessory==="trail";}\n  function outfit(name){data.outfit=name;applyCustomization();showToast("SUIT EQUIPPED · "+name.toUpperCase());persist();}
  function setVisor(color){data.visor=color;showToast("VISOR COLOR UPDATED");persist();}
  function setAccessory(name){data.accessory=name;showToast("ACCESSORY · "+name.toUpperCase());persist();}
  function mitigatedDamage(amount){return Math.max(1,amount*(1-level("shield")*.12));}
  function speedMultiplier(){return 1+level("speed")*.09;}
  function jumpMultiplier(){return 1+level("jump")*.08;}
  function energyMultiplier(){return 1+level("energy")*.2;}
  function combatBonus(){return level("combat")*8;}
  function hackingBonus(){return level("hacking");}
  function recoveryBonus(){return level("recovery");}
  function openPanel(){if(!panel)return;panel.classList.toggle("hidden");renderPanel();}
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
    panel.querySelector(".p5-close").addEventListener("click",()=>panel.classList.add("hidden"));
  }
  function buildPanel(){
    panel=document.createElement("section");panel.id="phase5-panel";panel.className="hidden";
    panel.innerHTML='<div class="p5-head"><div><small>NEON VELOCITY // PHASE 05</small><h2>PLAYER PROGRESSION</h2></div><button class="p5-x" aria-label="Close progression">×</button></div><div class="p5-content"></div>';
    document.querySelector("#app").appendChild(panel);
    panel.querySelector(".p5-x").addEventListener("click",()=>panel.classList.add("hidden"));
  }
  function update(dt,time){
    autoSaveTimer+=dt;if(autoSaveTimer>12){autoSaveTimer=0;persist();}
    for(const c of cacheObjects){
      c.group.rotation.y+=dt*.8;c.group.position.y=c.baseY+Math.sin(time*2+c.baseY)*.12;
      if(!c.found&&player.position.distanceTo(c.group.position)<1.5){
        c.found=true;c.group.visible=false;
        if(c.kind==="hidden"){data.challenge.hiddenFound++;data.credits+=2;award("explorer");showToast("HIDDEN DATA CACHE · +2 CREDITS");}
        else {data.challenge.environmentSolved++;data.credits+=1;award("puzzle");showToast("ENVIRONMENTAL SIGNAL SOLVED · +1 CREDIT");}
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
    if(data.challenge.bonusUnlocked&&!data.challenge.bonusComplete&&player.position.distanceTo(bonusGate.position)<3){
      data.challenge.bonusComplete=true;data.credits+=5;data.restoration=Math.min(6,data.restoration+1);updateRestorationVisuals();award("restorer");showToast("BONUS LEVEL CLEARED · DISTRICT RESTORED · +5 CREDITS");persist();renderPanel();
    }
    if(bonusActive){bonusTime-=dt;bonusTokens.forEach(t=>{t.mesh.rotation.y+=dt*2;if(!t.taken&&player.position.distanceTo(t.mesh.position)<1.35){t.taken=true;t.mesh.visible=false;bonusCount++;showToast("BONUS DATA SHARD "+bonusCount+"/3");}});if(bonusCount>=3){bonusActive=false;data.challenge.bonusComplete=true;data.credits+=5;data.restoration=Math.min(6,data.restoration+1);award("restorer");updateRestorationVisuals();showToast("BONUS LEVEL CLEARED · DISTRICT RESTORED · +5 CREDITS");persist();renderPanel();}else if(bonusTime<=0){bonusActive=false;bonusTokens.forEach(t=>{t.taken=false;t.mesh.visible=true;});bonusCount=0;showToast("BONUS LEVEL TIME EXPIRED");}}
  }
  buildPanel();applyCustomization();restore();
  return {update,openPanel,persist,collect,award,level,speedMultiplier,jumpMultiplier,energyMultiplier,combatBonus,hackingBonus,recoveryBonus,mitigatedDamage,
    onBossDefeated(){award("boss");data.credits+=5;data.restoration=Math.min(6,data.restoration+1);persist();renderPanel();},
    onDistrictRestored(){data.restoration=Math.min(6,data.restoration+1);updateRestorationVisuals();award("restorer");persist();},
    get data(){return data;}
  };
}
