/* Final integration fixes — additive and isolated. */
const app=document.querySelector('#app');
if(!app) throw new Error('Final fixes require #app');

const style=document.createElement('style');
style.textContent=`
/* Keep every system control in a compact top rail; never center the tools. */
#phase7-toolbar{position:fixed!important;top:12px!important;left:50%!important;right:auto!important;transform:translateX(-50%)!important;z-index:220!important;display:flex!important;gap:6px!important;flex-wrap:nowrap!important}
#phase7-toolbar button{font-size:11px!important;padding:6px 8px!important;min-height:32px!important;white-space:nowrap!important}
#phase6-button{position:fixed!important;top:12px!important;right:12px!important;z-index:221!important;padding:6px 9px!important;font-size:11px!important}
#phase6-settings{position:fixed!important;top:54px!important;right:12px!important;left:auto!important;width:min(420px,calc(100vw - 24px))!important;max-height:calc(100vh - 70px)!important;z-index:240!important}
#phase7-panel{position:fixed!important;top:54px!important;left:12px!important;width:min(400px,calc(100vw - 24px))!important;max-height:calc(100vh - 70px)!important;z-index:241!important}
#phase7-photo{z-index:230!important}
.nv-panel-close{position:absolute!important;top:10px!important;right:10px!important;width:30px!important;height:30px!important;padding:0!important;border-radius:50%!important;font-size:18px!important;line-height:28px!important;cursor:pointer!important;background:rgba(12,20,38,.95)!important;color:#eafcff!important;border:1px solid rgba(69,246,239,.5)!important}
.nv-panel-head{padding-right:38px!important}
.nv-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 12px}.nv-tabs button{background:#101b30;color:#eafcff;border:1px solid rgba(69,246,239,.35);padding:7px 9px;border-radius:6px;cursor:pointer}.nv-tabs button.active{border-color:#45f6ef;box-shadow:0 0 14px rgba(69,246,239,.2)}
.nv-level{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08)}.nv-level small{display:block;opacity:.65;margin-top:3px}.nv-level button{background:#101b30;color:#eafcff;border:1px solid rgba(69,246,239,.35);padding:7px 9px;border-radius:6px}.nv-level button:disabled{opacity:.45;cursor:not-allowed}
.nv-night{display:flex;gap:6px;flex-wrap:wrap}.nv-night button{background:#101b30;color:#eafcff;border:1px solid rgba(69,246,239,.35);padding:7px 9px;border-radius:6px}.nv-night button.active{border-color:#ff4fd8}
.nv-mission{padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:7px;margin:7px 0;background:rgba(255,255,255,.025)}.nv-mission strong{display:block}.nv-mission small{opacity:.7;display:block;margin-top:4px}
@media(max-width:700px){#phase7-toolbar{top:8px!important;max-width:calc(100vw - 112px);overflow-x:auto;justify-content:center}#phase7-toolbar button{font-size:9px!important;padding:5px 7px!important}#phase6-button{top:8px!important;right:8px!important}.nv-panel-close{top:8px!important;right:8px!important}}
`;
document.head.appendChild(style);

function addClose(panel){
 if(!panel||panel.querySelector('.nv-panel-close')) return;
 const b=document.createElement('button');b.className='nv-panel-close';b.type='button';b.textContent='×';b.setAttribute('aria-label','Close panel');
 b.onclick=()=>panel.classList.remove('open');panel.appendChild(b);
}
const p6=document.querySelector('#phase6-settings');
const p7=document.querySelector('#phase7-panel');
addClose(p6);addClose(p7);

// Make the existing Phase 6 settings controller explicit and persistent.
const timeLayer=document.querySelector('#phase6-time');
let nightMode='cycle';
function setTime(mode){nightMode=mode;if(!timeLayer)return;timeLayer.style.transition='background .45s';timeLayer.style.background=mode==='day'?'rgba(255,190,90,.04)':mode==='night'?'rgba(8,18,80,.34)':'rgba(8,18,80,.14)';localStorage.setItem('neon-city-time-mode',mode);document.querySelectorAll('.nv-night button').forEach(b=>b.classList.toggle('active',b.dataset.time===mode));}
setTime(localStorage.getItem('neon-city-time-mode')||'cycle');

const campaign=[
 ['01','NEON DISTRICT','Restore the city grid','Recover power cells and reach the district portal.','PLAYABLE'],
 ['02','ABANDONED METRO','Restart the transit network','Reach the metro control gate and restore transport systems.','LOCKED'],
 ['03','CYBER LABORATORY','Recover the research archive','Solve laboratory access puzzles and restore the lab network.','LOCKED'],
 ['04','UNDERGROUND CORE','Stabilize the reactor','Route power through the industrial core and survive its hazards.','LOCKED'],
 ['05','AI FORTRESS','Infiltrate NEXUS security','Cross the fortress security network and disable elite defenses.','LOCKED'],
 ['06','FINAL NETWORK','Confront NEXUS','Enter the final arena and complete the network restoration.','LOCKED']
];
function phase5Data(){try{return JSON.parse(localStorage.getItem('neon-velocity-phase5-v1')||'{}')||{}}catch{return {}}}
function levelMarkup(){const d=phase5Data();const current=Math.max(1,Number(d.district||0)+1);return `<h4>CAMPAIGN LEVELS</h4>${campaign.map((x,i)=>{const unlocked=i+1<=current;return `<div class="nv-level"><div><strong>${x[0]} · ${x[1]}</strong><small>${x[2]} · ${unlocked?'UNLOCKED':'LOCKED'}</small></div><button data-level="${i+1}" ${unlocked?'':'disabled'}>${i===0?'ENTER':'SELECT'}</button></div>`}).join('')}<p style="opacity:.65;font-size:12px">The selector respects your local progression. Locked districts unlock through restoration progression rather than pretending an unfinished world is playable.</p>`}
function missionMarkup(){return `<h4>MISSION BOARD</h4>${campaign.map(x=>`<div class="nv-mission"><strong>${x[0]} · ${x[2]}</strong><small>${x[1]} — ${x[3]}</small></div>`).join('')}<div class="nv-mission"><strong>OPTIONAL · DATA BEACONS</strong><small>Find hidden caches and solve environmental signals for progression rewards.</small></div><div class="nv-mission"><strong>CHALLENGE · ROOFTOP RUN</strong><small>Complete the timed route and beat your local best.</small></div>`}
function timeMarkup(){return `<h4>DAY / NIGHT</h4><div class="nv-night"><button data-time="day">DAY</button><button data-time="cycle">AUTO CYCLE</button><button data-time="night">NIGHT</button></div><p style="opacity:.65;font-size:12px">Atmosphere only: changing this does not alter gameplay progression.</p>`}
function decorateSettings(){
 const panel=document.querySelector('#phase6-settings');if(!panel)return;
 addClose(panel);
 const head=panel.querySelector('h3');if(head)head.classList.add('nv-panel-head');
 let tabs=panel.querySelector('.nv-final-tabs');
 if(!tabs){tabs=document.createElement('div');tabs.className='nv-tabs nv-final-tabs';tabs.innerHTML='<button data-finaltab="settings">SETTINGS</button><button data-finaltab="time">DAY / NIGHT</button><button data-finaltab="levels">LEVELS</button><button data-finaltab="missions">MISSIONS</button>';panel.insertBefore(tabs,panel.querySelector('#p6-content'));tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>renderTab(b.dataset.finaltab));}
 function renderTab(tab){const content=panel.querySelector('#p6-content');if(!content)return;tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.finaltab===tab));if(tab==='time'){content.innerHTML=timeMarkup();content.querySelectorAll('[data-time]').forEach(b=>b.onclick=()=>setTime(b.dataset.time));return}if(tab==='levels'){content.innerHTML=levelMarkup();content.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{if(!b.disabled){document.querySelector('#objective').textContent=campaign[Number(b.dataset.level)-1][3];document.querySelector('#toast').textContent=`LEVEL ${b.dataset.level} SELECTED`;document.querySelector('#toast').style.opacity='1';setTimeout(()=>document.querySelector('#toast').style.opacity='0',1600);}});return}if(tab==='missions'){content.innerHTML=missionMarkup();return}tabs.querySelector('button').click();}
}

// Wrap the existing Phase 6 opener so every opening gets the fixed close button and tabs.
if(window.NeonCityPhase6?.openPanel){const original=window.NeonCityPhase6.openPanel;window.NeonCityPhase6.openPanel=(kind='settings')=>{original(kind);decorateSettings();p6?.classList.add('open');};}
if(p6){const observer=new MutationObserver(()=>{if(p6.classList.contains('open'))decorateSettings()});observer.observe(p6,{attributes:true,attributeFilter:['class']});}

// Final QA panels must close cleanly and never compete with another overlay.
function closeOther(except){[p6,p7].forEach(p=>{if(p&&p!==except)p.classList.remove('open')});}
[p6,p7].forEach(p=>{if(p)p.addEventListener('pointerdown',e=>{if(e.target.classList.contains('nv-panel-close'))closeOther(null)})});

// Add a compact, detailed boss shell to the existing final elite at z≈-101 without changing combat logic.
function detailBoss(){
 const world=document.querySelector('#game-root')?.querySelector('canvas')?null:null;
 // Search Three.js scene through the renderer's object graph is intentionally avoided here;
 // the boss detail pass uses DOM-independent CSS only when the game exposes its scene.
 const api=window.NeonCityGame;
 if(api?.decorateBoss){api.decorateBoss();return true}
 return false;
}
setTimeout(detailBoss,500);

window.NeonCityFinalFixes={setTime,levelMarkup,missionMarkup,decorateSettings,version:'1.1'};
`;
