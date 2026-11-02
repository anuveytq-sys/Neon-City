/* Boss visual polish hook. Loaded before main.js so it can observe the elite Group as it is created. */
import * as THREE from 'three';
const originalAdd=THREE.Group.prototype.add;
let hooked=false;
THREE.Group.prototype.add=function(...objects){
  const result=originalAdd.apply(this,objects);
  if(!hooked && this.position && Math.abs(this.position.z+101)<0.01 && this.children.length>=1){
    hooked=true;
    const armor=new THREE.MeshStandardMaterial({color:0x151a2e,emissive:0x2e0b45,emissiveIntensity:.75,metalness:.72,roughness:.28});
    const edge=new THREE.MeshStandardMaterial({color:0x45f6ef,emissive:0x087d88,emissiveIntensity:2,metalness:.55,roughness:.2});
    const coreMat=new THREE.MeshStandardMaterial({color:0xff4fd8,emissive:0x9c126f,emissiveIntensity:2.5,metalness:.35,roughness:.18});
    const g=this;
    const shell=g.children[0];
    if(shell){shell.scale.set(1.08,1.05,1.05);shell.material=armor;}
    const chest=new THREE.Mesh(new THREE.BoxGeometry(1.0,.76,.16),armor);chest.position.set(0,1.0,-.55);g.add(chest);
    const core=new THREE.Mesh(new THREE.OctahedronGeometry(.25,1),coreMat);core.position.set(0,1.02,-.66);g.add(core);
    const coreRing=new THREE.Mesh(new THREE.TorusGeometry(.42,.045,10,28),edge);coreRing.rotation.x=Math.PI/2;coreRing.position.set(0,1.02,-.69);g.add(coreRing);
    const visor=new THREE.Mesh(new THREE.BoxGeometry(.86,.16,.11),edge);visor.position.set(0,1.64,-.49);g.add(visor);
    const crown=new THREE.Mesh(new THREE.TorusGeometry(.52,.055,10,24),edge);crown.rotation.x=Math.PI/2;crown.position.y=2.05;g.add(crown);
    const shoulderGeo=new THREE.SphereGeometry(.36,16,10);
    for(const side of [-1,1]){
      const sh=new THREE.Mesh(shoulderGeo,armor);sh.scale.set(1.15,.72,.9);sh.position.set(side*.88,1.25,0);g.add(sh);
      const edgeBlade=new THREE.Mesh(new THREE.BoxGeometry(.09,.7,.18),edge);edgeBlade.position.set(side*1.08,1.53,0);g.add(edgeBlade);
      const armRing=new THREE.Mesh(new THREE.TorusGeometry(.28,.035,8,18),edge);armRing.rotation.y=Math.PI/2;armRing.position.set(side*.76,.75,0);g.add(armRing);
    }
    const reactorRing=new THREE.Mesh(new THREE.TorusGeometry(.62,.06,10,30),edge);reactorRing.rotation.x=Math.PI/2;reactorRing.position.set(0,.58,0);g.add(reactorRing);
    const light=new THREE.PointLight(0xff4fd8,6,9);light.position.set(0,1.02,-.8);g.add(light);
    g.userData.bossDetailed=true;
  }
  return result;
};
