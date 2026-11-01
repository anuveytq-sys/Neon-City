import * as THREE from "three";

/**
 * Phase 4 expansion: six connected districts, world-specific traversal,
 * interactable systems, hazards, enemy encounters and a multi-stage NEXUS boss.
 * Uses the existing scene/player/physics/combat systems rather than replacing them.
 */
export function installPhaseFour({THREE: T, scene, world, player, state, platforms, shots, showToast, updateVitals}) {
  const mat=(c,e=0)=>new T.MeshStandardMaterial({color:c,emissive:e,emissiveIntensity:e?1.5:0,metalness:.35,roughness:.48});
  const mobile=matchMedia("(pointer: coarse)").matches||navigator.maxTouchPoints>0;
  const palette=[
    [0x071b2e,0x20eaff,0xff42c8], [0x202638,0xffb64a,0x4ee7ff],
    [0x182b25,0x66ffb0,0x9d7bff], [0x241d36,0xff8c42,0x56eaff],
    [0x24152c,0xff3f86,0x67eaff], [0x10152e,0xa67bff,0xffd56a]
  ];
  const names=["NEON DISTRICT","ABANDONED METRO","CYBER LABORATORY","UNDERGROUND CORE","AI FORTRESS","FINAL NETWORK"];
  const themes=[
    "Restore rooftop power relays and cross the skyline.",
    "Navigate train platforms, moving rail hazards and signal controls.",
    "Recover research logs and override experimental security.",
    "Stabilise the reactor while crossing rotating machinery.",
    "Disable fortress surveillance and defeat elite security units.",
    "Defeat NEXUS through three attack phases and complete the final hack."
  ];
  const centers=names.map((_,i)=>new T.Vector3((i%3)*115-115,0,Math.floor(i/3)*-115-155));
  const districts=[], portals=[], systems=[], hazards=[], bosses=[];
  let active=0, finalHack=false, completed=false;
  const makeBox=(g,x,y,z,sx,sy,sz,m)=>{const o=new T.Mesh(new T.BoxGeometry(sx,sy,sz),m);o.position.set(x,y,z);o.castShadow=!mobile;o.receiveShadow=!mobile;g.add(o);return o;};
  const floor=(cx,cz)=>({minX:cx-25,maxX:cx+25,minY:-.72,maxY:-.05,minZ:cz-27,maxZ:cz+27});
  function portal(g,pos,color,label,index){
    const p=new T.Group();p.position.copy(pos);g.add(p);
    const ring=new T.Mesh(new T.TorusGeometry(2,.16,12,36),mat(color,color));ring.rotation.y=0;p.add(ring);
    const core=new T.Mesh(new T.CircleGeometry(1.65,32),new T.MeshBasicMaterial({color,transparent:true,opacity:.16,side:T.DoubleSide}));p.add(core);
    portals.push({group:p,index,label});
  }
  for(let i=0;i<6;i++){
    const c=centers[i],g=new T.Group();g.position.copy(c);g.visible=i===0;world.add(g);districts.push(g);
    const [base,glow,accent]=palette[i],bm=mat(base),gm=mat(glow,glow),am=mat(accent,accent);
    makeBox(g,0,-.62,0,50,1.2,54,bm);
    // Distinct architectural silhouettes and traversable rooftops.
    for(let n=0;n<9;n++){
      const x=((n%3)-1)*15, z=Math.floor(n/3)*-15+9, h=5+(n*7+i*3)%17;
      makeBox(g,x,h/2-.2,z,5+(n%2)*2,h,6,bm);
      makeBox(g,x,h-.25,z-3.04,5.1,.12,.12,n%2?gm:am);
    }
    for(let n=0;n<5;n++){
      const x=(n-2)*8,z=-18-(n%2)*6;
      makeBox(g,x,.35,z,4,.7,4,n%2?gm:am);
      platforms.push({minX:c.x+x-2,maxX:c.x+x+2,minY:-.05,maxY:.72,minZ:c.z+z-2,maxZ:c.z+z+2});
    }
    platforms.push(floor(c.x,c.z));
    const tower=makeBox(g,0,7,-23,8,14,7,am);tower.rotation.y=.15;
    for(let k=0;k<4;k++){const beam=makeBox(g,-23+k*15,1.2,-5,.14,2.4,42,gm);beam.material=gm;}
    for(let s=0;s<2;s++){
      const x=s?15:-15,z=-8-s*15;
      const unit=new T.Group();unit.position.set(x,1,z);g.add(unit);
      makeBox(unit,0,0,0,1.5,2.2,1.2,am);
      makeBox(unit,0,.2,-.66,.75,.22,.08,gm);
      systems.push({group:unit,world:i,solved:false,progress:0,sequence:[(i+s)%4,(i+s+1)%4,(i+s+3)%4],s});
    }
    if(i===1){for(let t=0;t<3;t++){const train=makeBox(g,0,1.2,-18-t*12,8,2.4,5,am);train.userData.train=true;hazards.push({mesh:train,world:i,baseZ:train.position.z,phase:t*2});}}
    if(i===2){for(let t=0;t<4;t++){const pod=makeBox(g,-18+t*12,2,-18,2,4,2,gm);pod.rotation.z=.2;}}
    if(i===3){const reactor=makeBox(g,0,4,-18,9,8,9,am);reactor.rotation.y=.25;for(let t=0;t<4;t++){const arm=makeBox(g,0,4,-18,1,1,23,gm);arm.rotation.y=t*Math.PI/4;}}
    if(i===4){for(let t=0;t<4;t++){const beam=makeBox(g,-18+t*12,1.5,-16,.22,3,25,am);hazards.push({mesh:beam,world:i,laser:true,phase:t*.8});}}
    if(i===5){for(let t=0;t<6;t++){const pylon=new T.Mesh(new T.CylinderGeometry(.5,.9,8,8),am);pylon.position.set(Math.cos(t*Math.PI/3)*17,4,Math.sin(t*Math.PI/3)*17-12);pylon.castShadow=!mobile;pylon.receiveShadow=!mobile;g.add(pylon);}}
    portal(g,new T.Vector3(0,1.8,22),glow,names[(i+1)%6],(i+1)%6);
    const bossGroup=new T.Group();bossGroup.position.set(0,0,-20);bossGroup.visible=true;g.add(bossGroup);
    const size=i===5?5:2.3;
    const shell=new T.Mesh(new T.IcosahedronGeometry(size,1),am);shell.position.y=size;bossGroup.add(shell);
    const eye=new T.Mesh(new T.SphereGeometry(size*.25,16,12),gm);eye.position.set(0,size,-size*.86);bossGroup.add(eye);
    const halo=new T.Mesh(new T.TorusGeometry(size*1.25,.13,8,32),gm);halo.position.y=size;halo.rotation.x=Math.PI/2;bossGroup.add(halo);
    bosses.push({group:bossGroup,shell,eye,halo,world:i,hp:i===5?420:100,maxHp:i===5?420:100,phase:0,cooldown:2,defeated:false,attack:0});
  }
  function enter(index){
    active=index;
    districts.forEach((d,i)=>{d.visible=i===index;});
    const c=centers[index];player.position.set(c.x,0,c.z+10);
    state.x=player.position.x;state.y=0;state.z=player.position.z;state.vx=state.vy=state.vz=0;
    state.checkpoint={x:state.x,y:0,z:state.z};
    showToast("ENTERING "+names[index]);
  }
  function interact(){
    if(!state.active||state.paused)return false;
    const p=player.position;
    let nearest=null,d=3.6;
    for(const s of systems){if(s.world!==active||s.solved)continue;const q=s.group.getWorldPosition(new T.Vector3()),dist=p.distanceTo(q);if(dist<d){d=dist;nearest=s;}}
    if(nearest){
      nearest.progress=(nearest.progress+1)%4;
      if(nearest.progress===nearest.sequence.length){nearest.solved=true;showToast(names[active]+" · SYSTEM OVERRIDE COMPLETE");}
      else showToast("OVERRIDE "+nearest.progress+"/3 · SIGNAL "+(nearest.sequence[nearest.progress]+1));
      return true;
    }
    if(active===5&&!finalHack&&systems.filter(s=>s.world===5&&s.solved).length===2){finalHack=true;showToast("NEXUS FIREWALL BREACHED · FINAL HACK COMPLETE");return true;}
    return false;
  }
  function update(dt,time){
    const p=player.position;
    for(const gate of portals){if(gate.index!==active&&p.distanceTo(gate.group.getWorldPosition(new T.Vector3()))<3.2){enter(gate.index);break;}}
    for(const h of hazards){if(h.world!==active)continue;if(h.mesh.userData.train){h.mesh.position.z=h.baseZ+Math.sin(time*1.7+h.phase)*5;if(p.distanceTo(h.mesh.getWorldPosition(new T.Vector3()))<3.3&&Math.abs(p.y)<1.2){state.health=Math.max(0,state.health-12*dt);updateVitals();}}else if(h.laser){h.mesh.visible=Math.sin(time*2+h.phase)>.05;if(h.mesh.visible&&Math.abs(p.x-(h.mesh.position.x+centers[active].x))<1&&Math.abs(p.z-(h.mesh.position.z+centers[active].z))<13&&p.y<3){state.health=Math.max(0,state.health-10*dt);updateVitals();}}}
    for(const b of bosses){if(b.world!==active||b.defeated)continue;b.cooldown-=dt;b.group.rotation.y+=dt*.35;b.halo.rotation.z+=dt*(1+b.phase*.25);const dist=p.distanceTo(b.group.getWorldPosition(new T.Vector3()));
      b.attack+=dt;if(b.attack>6){b.phase=(b.phase+1)%3;b.attack=0;showToast(b.world===5?"NEXUS · "+["SHIELD","CHARGE","EXPOSED"][b.phase]:"SECURITY BOSS · "+["GUARD","CHARGE","EXPOSED"][b.phase]);}
      if(b.cooldown<=0&&dist<24){const dir=p.clone().sub(b.group.getWorldPosition(new T.Vector3())).normalize();const orb=new T.Mesh(new T.SphereGeometry(.28,10,8),mat(0xff397d,0xff174f));orb.position.copy(b.group.position).add(new T.Vector3(centers[b.world].x,2,centers[b.world].z-1));world.add(orb);shots.push({mesh:orb,velocity:dir.multiplyScalar(9),life:3,enemy:true});b.cooldown=b.world===5?1.25:2.4;}
      for(let i=shots.length-1;i>=0;i--){const shot=shots[i];if(shot.enemy||shot._p4Hit)continue;const target=b.group.getWorldPosition(new T.Vector3());if(shot.mesh.position.distanceTo(target)<(b.world===5?6:3)){shot._p4Hit=true;if(b.phase===2){b.hp-=b.world===5?24:25;showToast((b.world===5?"NEXUS CORE ":"BOSS CORE ")+Math.max(0,b.hp)+" HP");}else showToast("BOSS SHIELD ACTIVE · WAIT FOR EXPOSED PHASE");if(b.hp<=0){b.defeated=true;b.group.visible=false;showToast(b.world===5?"NEXUS DEFEATED · COMPLETE FINAL HACK":"DISTRICT BOSS DEFEATED");}}}
      if(dist<3.2&&b.phase===1){state.health=Math.max(0,state.health-8*dt);updateVitals();}
    }
    if(active===5&&bosses[5].defeated&&finalHack&&!completed){completed=true;showToast("CHRONICLE COMPLETE · NEXUS NETWORK RESTORED");}
  }
  function begin(){enter(0);}
  function reset(){for(const s of systems){s.solved=false;s.progress=0;}for(const b of bosses){b.hp=b.maxHp;b.phase=0;b.defeated=false;b.group.visible=true;b.attack=0;b.cooldown=2;}finalHack=false;completed=false;enter(0);}
  return {begin,update,interact,reset,get activeWorld(){return active;},get completed(){return completed;}};
}