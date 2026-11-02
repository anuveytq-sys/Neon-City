/* Phase 7 — final integration, QA helpers, photo mode, speedrun telemetry and save hygiene.
   Additive only: this module never replaces the existing renderer, controller, missions or Phase 5/6 systems. */
const KEY = "neon-city-phase7-v1";
const defaults = { photo:false, speedrun:false, runStarted:0, bestRun:null, frames:0, lastFPS:60 };
let state = {...defaults};
try { state = {...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}")}; } catch {}
const app = document.querySelector("#app");
if (!app) throw new Error("Phase 7 requires #app");

const style = document.createElement("style");
style.textContent = `
#phase7-layer{position:fixed;inset:0;z-index:90;pointer-events:none;font-family:Inter,system-ui,sans-serif;color:#eafcff}
#phase7-toolbar{position:absolute;left:18px;top:70px;display:flex;gap:7px;pointer-events:auto}
#phase7-toolbar button,#phase7-photo button{background:rgba(5,12,28,.9);color:#eafcff;border:1px solid rgba(69,246,239,.38);border-radius:7px;padding:8px 10px;font-weight:700;cursor:pointer}
#phase7-panel{position:absolute;left:18px;top:112px;width:min(390px,calc(100vw - 36px));max-height:70vh;overflow:auto;background:rgba(5,10,25,.96);border:1px solid rgba(69,246,239,.4);box-shadow:0 18px 55px rgba(0,0,0,.5);backdrop-filter:blur(18px);padding:16px;display:none;pointer-events:auto}
#phase7-panel.open{display:block}#phase7-panel h3{margin:0 0 12px;letter-spacing:.12em}#phase7-panel p{font-size:12px;line-height:1.55;opacity:.88}.p7-row{display:flex;gap:7px;flex-wrap:wrap}.p7-stat{display:grid;grid-template-columns:1fr auto;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:12px}.p7-stat b{color:#45f6ef}
#phase7-photo{position:absolute;inset:0;display:none;pointer-events:auto;background:rgba(2,5,15,.28)}#phase7-photo.active{display:block}#phase7-photo .photo-label{position:absolute;left:50%;top:10%;transform:translateX(-50%);font-size:12px;letter-spacing:.18em;text-shadow:0 2px 12px #000}#phase7-photo .photo-actions{position:absolute;bottom:8%;left:50%;transform:translateX(-50%);display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.phase7-safe *{animation-play-state:paused!important}.phase7-safe #game-root canvas{filter:saturate(1.08) contrast(1.04)}
`;
document.head.appendChild(style);

const layer = document.createElement("div");
layer.id = "phase7-layer";
layer.innerHTML = `<div id="phase7-toolbar"><button id="phase7-system">FINAL QA</button><button id="phase7-photo-btn">PHOTO</button><button id="phase7-speed-btn">SPEEDRUN</button></div><aside id="phase7-panel"><h3>NEON CITY // FINAL QA</h3><div id="phase7-content"></div></aside><div id="phase7-photo"><div class="photo-label">PHOTO MODE · GAME PAUSED</div><div class="photo-actions"><button id="phase7-exit-photo">EXIT PHOTO MODE</button><button id="phase7-hide-ui">HIDE OVERLAY</button></div></div></div>`;
app.appendChild(layer);
const panel = document.querySelector("#phase7-panel");
const content = document.querySelector("#phase7-content");
const photo = document.querySelector("#phase7-photo");

function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
function p5(){try{return JSON.parse(localStorage.getItem("neon-velocity-phase5-v1") || "{}") || {};}catch{return {};}}
function p6(){try{return JSON.parse(localStorage.getItem("neon-city-phase6") || "{}") || {};}catch{return {};}}
function mainActive(){return !!document.querySelector("#hud:not(.hidden)");}
function openPanel(){
  const s=p5(), f=p6();
  const achievements=Array.isArray(s.achievements)?s.achievements.length:0;
  const upgrades=s.levels?Object.values(s.levels).reduce((n,v)=>n+Number(v||0),0):0;
  const cores=Array.isArray(s.collectedCores)?s.collectedCores.length:(Number(s.cores)||0);
  content.innerHTML=`<div class="p7-row"><button id="p7-refresh">REFRESH</button><button id="p7-clear-ui">CLOSE</button></div><p>These checks are local and non-destructive. They verify that the expected Phase 5 save exists, Phase 6 preferences can be read, the game HUD is reachable, and the browser is rendering frames.</p><div class="p7-stat"><span>Game active</span><b>${mainActive()?"YES":"MENU"}</b></div><div class="p7-stat"><span>Phase 5 save</span><b>${Object.keys(s).length?"FOUND":"NEW"}</b></div><div class="p7-stat"><span>Phase 5 achievements</span><b>${achievements}</b></div><div class="p7-stat"><span>Upgrade levels</span><b>${upgrades}</b></div><div class="p7-stat"><span>Saved cores</span><b>${cores}</b></div><div class="p7-stat"><span>Phase 6 profile</span><b>${Object.keys(f).length?"FOUND":"DEFAULT"}</b></div><div class="p7-stat"><span>Live FPS</span><b id="p7-fps">${state.lastFPS}</b></div><div class="p7-stat"><span>Speedrun</span><b>${state.speedrun?"ARMED":"OFF"}</b></div><p>Save data is not deleted by this panel. Use the Phase 5 progression controls for upgrades and the browser's site-data controls only if you intentionally want a full reset.</p>`;
  panel.classList.add("open");
  document.querySelector("#p7-refresh").onclick=openPanel;
  document.querySelector("#p7-clear-ui").onclick=()=>panel.classList.remove("open");
}

document.querySelector("#phase7-system").onclick=openPanel;
document.querySelector("#phase7-speed-btn").onclick=()=>{
  state.speedrun=!state.speedrun;
  if(state.speedrun){state.runStarted=performance.now();state.frames=0;show("SPEEDRUN ARMED — TIMER STARTS WHEN YOU MOVE");}
  else {state.runStarted=0;show("SPEEDRUN DISARMED");}
  save();
};

let hidden=false;
function enterPhoto(){
  if(!mainActive()){show("START THE RUN BEFORE PHOTO MODE");return;}
  photo.classList.add("active");state.photo=true;save();
  const pause=document.querySelector("#pause-screen");
  if(pause&&!pause.classList.contains("hidden"))pause.classList.add("hidden");
  document.documentElement.classList.add("phase7-safe");
  window.dispatchEvent(new CustomEvent("neon-city-photo-enter"));
}
function exitPhoto(){photo.classList.remove("active");state.photo=false;hidden=false;document.documentElement.classList.remove("phase7-safe");document.querySelector("#phase7-toolbar").style.display="flex";save();window.dispatchEvent(new CustomEvent("neon-city-photo-exit"));}
document.querySelector("#phase7-photo-btn").onclick=enterPhoto;
document.querySelector("#phase7-exit-photo").onclick=exitPhoto;
document.querySelector("#phase7-hide-ui").onclick=()=>{hidden=!hidden;document.querySelector("#phase7-toolbar").style.display=hidden?"none":"flex";};

let toastTimer;
function show(text){let el=document.querySelector("#toast");if(!el)return;el.textContent=text;el.style.opacity="1";clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.style.opacity="0",1800);}

// Keyboard shortcuts are intentionally additive and do not steal existing controls.
addEventListener("keydown",e=>{if(e.repeat)return;if(e.key.toLowerCase()==="o"&&mainActive())enterPhoto();if(e.key.toLowerCase()==="q")openPanel();if(e.key.toLowerCase()==="r"&&e.shiftKey){state.speedrun=!state.speedrun;state.runStarted=state.speedrun?performance.now():0;save();show(state.speedrun?"SPEEDRUN ARMED":"SPEEDRUN DISARMED");}if(e.key==="Escape"&&photo.classList.contains("active"))exitPhoto();});

let last=performance.now(),frames=0,lastSample=performance.now();
function tick(now){frames++;if(now-lastSample>1000){state.lastFPS=Math.round(frames*1000/(now-lastSample));frames=0;lastSample=now;const el=document.querySelector("#p7-fps");if(el)el.textContent=state.lastFPS;save();}if(state.speedrun&&state.runStarted&&mainActive()){const elapsed=(now-state.runStarted)/1000;const objective=document.querySelector("#objective");if(objective&&!objective.dataset.p7Original)objective.dataset.p7Original=objective.textContent;const side=document.querySelector("#side-mission");if(side)side.dataset.p7Timer=elapsed.toFixed(1);}
 last=now;requestAnimationFrame(tick)}
requestAnimationFrame(tick);
window.NeonCityPhase7={openPanel,enterPhoto,exitPhoto,state,version:"7.0"};
