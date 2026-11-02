/* Phase 6 — final polish, accessibility, audio, weather, settings, stats and multiplayer-ready hooks.
   Deliberately additive: it owns only its overlay/UI state and never replaces the existing game loop. */
const KEY="neon-city-phase6";
const defaults={quality:"auto",sensitivity:1,motion:true,subtitles:true,highContrast:false,weather:true,audio:true,difficulty:"standard",ending:""};
const load=()=>{try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return {...defaults}}};
const save=s=>localStorage.setItem(KEY,JSON.stringify(s));
const state=load();
const root=document.querySelector("#game-root");
const app=document.querySelector("#app");
if(!root||!app) throw new Error("Phase 6 requires the game root");

const style=document.createElement("style");
style.textContent=`
#phase6-layer{position:fixed;inset:0;pointer-events:none;z-index:80;font-family:Inter,system-ui,sans-serif}
#phase6-weather{position:absolute;inset:0;opacity:.22;overflow:hidden;pointer-events:none;mix-blend-mode:screen}
.p6-rain{position:absolute;top:-15vh;width:1px;height:12vh;background:linear-gradient(transparent,rgba(120,235,255,.7));transform:rotate(12deg);animation:p6rain linear infinite}
@keyframes p6rain{to{transform:translate(-9vw,125vh) rotate(12deg)}}
#phase6-time{position:absolute;inset:0;background:rgba(255,190,90,0);transition:background 1s;pointer-events:none;mix-blend-mode:multiply}
#phase6-settings{position:absolute;right:18px;top:70px;width:min(430px,calc(100vw - 36px));max-height:78vh;overflow:auto;background:rgba(5,10,25,.94);border:1px solid rgba(69,246,239,.45);box-shadow:0 20px 60px rgba(0,0,0,.45);backdrop-filter:blur(18px);padding:20px;color:#eafcff;pointer-events:auto;display:none}
#phase6-settings.open{display:block}
#phase6-settings h3{margin:0 0 14px;font-size:20px;letter-spacing:.12em}#phase6-settings section{border-top:1px solid rgba(255,255,255,.1);padding:13px 0}#phase6-settings label{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:9px 0;font-size:13px}#phase6-settings select,#phase6-settings button{background:#101b30;color:#eafcff;border:1px solid rgba(69,246,239,.35);padding:8px 10px;border-radius:6px}#phase6-settings button{cursor:pointer}.p6-row{display:flex;flex-wrap:wrap;gap:7px}.p6-stat{display:grid;grid-template-columns:1fr auto;gap:5px;font-size:12px}.p6-stat b{color:#45f6ef}
#phase6-button{position:absolute;right:82px;top:13px;pointer-events:auto;background:rgba(9,18,37,.82);color:#eafcff;border:1px solid rgba(69,246,239,.35);border-radius:7px;padding:8px 10px;font-weight:700}
#phase6-caption{position:absolute;left:50%;bottom:10%;transform:translateX(-50%);max-width:min(760px,82vw);padding:8px 14px;border-radius:7px;background:rgba(0,0,0,.72);color:#fff;text-align:center;opacity:0;transition:opacity .2s;font-size:13px}
#phase6-caption.show{opacity:1}.p6-credits{line-height:1.65;font-size:13px;opacity:.88}.p6-ending{margin-top:10px;padding:9px;border:1px solid rgba(255,255,255,.1);border-radius:7px;background:rgba(255,255,255,.03)}
.phase6-reduced-motion *{animation-duration:.001ms!important;transition-duration:.001ms!important;scroll-behavior:auto!important}.phase6-contrast{filter:contrast(1.12) saturate(1.08)}
`;
document.head.appendChild(style);

const layer=document.createElement("div");layer.id="phase6-layer";layer.innerHTML=`<div id="phase6-weather"></div><div id="phase6-time"></div><button id="phase6-button" aria-label="Open final settings">SYSTEM</button><div id="phase6-caption" aria-live="polite"></div><aside id="phase6-settings"><h3>NEON CITY // FINAL SYSTEMS</h3><div class="p6-row"><button data-p6="settings">SETTINGS</button><button data-p6="stats">STATISTICS</button><button data-p6="missions">MISSIONS</button><button data-p6="credits">CREDITS</button></div><section id="p6-content"></section></aside></div>`;
app.appendChild(layer);
const weather=document.querySelector("#phase6-weather"),timeLayer=document.querySelector("#phase6-time"),panel=document.querySelector("#phase6-settings"),content=document.querySelector("#p6-content"),caption=document.querySelector("#phase6-caption");

// Weather/rain pass. It is intentionally DOM-based so mobile GPUs do not receive another 3D particle system.
for(let i=0;i<55;i++){const r=document.createElement("i");r.className="p6-rain";r.style.left=(Math.random()*110-5)+"%";r.style.animationDuration=(.45+Math.random()*.8)+"s";r.style.animationDelay=(-Math.random()*2)+"s";r.style.opacity=(.15+Math.random()*.5).toFixed(2);weather.appendChild(r)}
function applyVisualSettings(){document.documentElement.classList.toggle("phase6-reduced-motion",!state.motion);document.documentElement.classList.toggle("phase6-contrast",state.highContrast);weather.style.display=state.weather?"block":"none";if(state.quality==="low")document.documentElement.style.setProperty("--p6-quality","low");else document.documentElement.style.removeProperty("--p6-quality")}
applyVisualSettings();

// Synthesized audio: no external assets or paid service. Unlocks after the first user gesture.
let audioCtx=null,gain=null;
function audio(){if(!state.audio)return null;if(!audioCtx){audioCtx=new (window.AudioContext||window.webkitAudioContext)();gain=audioCtx.createGain();gain.gain.value=.045;gain.connect(audioCtx.destination)}if(audioCtx.state==="suspended")audioCtx.resume();return audioCtx}
function tone(freq,dur=.08,type="sine"){const c=audio();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.18,c.currentTime+.008);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+dur);o.connect(g);g.connect(gain);o.start();o.stop(c.currentTime+dur+.02)}
addEventListener("pointerdown",()=>{audio();tone(220,.035,"triangle")},{once:true});
addEventListener("keydown",()=>{audio()},{once:true});

function speak(text){if(!state.subtitles)return;caption.textContent=text;caption.classList.add("show");clearTimeout(speak.t);speak.t=setTimeout(()=>caption.classList.remove("show"),2200)}

function renderSettings(){content.innerHTML=`<div class="p6-stat"><span>Adaptive performance</span><b id="p6-fps">-- FPS</b></div><section><label>Graphics quality <select id="p6-quality"><option value="auto">Adaptive</option><option value="high">High</option><option value="low">Performance</option></select></label><label>Look sensitivity <input id="p6-sensitivity" type="range" min="0.5" max="1.8" step="0.1" value="${state.sensitivity}"></label><label>Difficulty <select id="p6-difficulty"><option>standard</option><option>explorer</option><option>challenge</option></select></label></section><section><label>Rain/weather <input id="p6-weather-toggle" type="checkbox" ${state.weather?"checked":""}></label><label>Audio <input id="p6-audio-toggle" type="checkbox" ${state.audio?"checked":""}></label><label>Subtitles / captions <input id="p6-subtitles" type="checkbox" ${state.subtitles?"checked":""}></label><label>Reduced motion <input id="p6-motion" type="checkbox" ${!state.motion?"checked":""}></label><label>High contrast <input id="p6-contrast" type="checkbox" ${state.highContrast?"checked":""}></label></section>`;
 document.querySelector("#p6-quality").value=state.quality;document.querySelector("#p6-difficulty").value=state.difficulty;
 document.querySelector("#p6-quality").onchange=e=>{state.quality=e.target.value;save(state);applyVisualSettings()};
 document.querySelector("#p6-sensitivity").oninput=e=>{state.sensitivity=Number(e.target.value);save(state);};
 document.querySelector("#p6-difficulty").onchange=e=>{state.difficulty=e.target.value;save(state);speak("Difficulty profile saved")};
 document.querySelector("#p6-weather-toggle").onchange=e=>{state.weather=e.target.checked;save(state);applyVisualSettings()};
 document.querySelector("#p6-audio-toggle").onchange=e=>{state.audio=e.target.checked;save(state);if(state.audio)tone(440,.08)};
 document.querySelector("#p6-subtitles").onchange=e=>{state.subtitles=e.target.checked;save(state)};
 document.querySelector("#p6-motion").onchange=e=>{state.motion=!e.target.checked;save(state);applyVisualSettings()};
 document.querySelector("#p6-contrast").onchange=e=>{state.highContrast=e.target.checked;save(state);applyVisualSettings()};
}
function renderStats(){const raw=localStorage.getItem("neon-city-phase5");let s={};try{s=JSON.parse(raw||"{}")||{}}catch{}const a=s.achievements||{};const upgrades=s.upgrades||{};const unlocked=Object.values(a).filter(Boolean).length;const upgradeLevels=Object.values(upgrades).reduce((n,v)=>n+Number(v||0),0);content.innerHTML=`<div class="p6-stat"><span>Achievements</span><b>${unlocked}</b></div><div class="p6-stat"><span>Upgrade levels</span><b>${upgradeLevels}</b></div><div class="p6-stat"><span>Energy cores</span><b>${s.coresCollected?.length||0}</b></div><div class="p6-stat"><span>Current district</span><b>${Number(s.district??-1)+1}</b></div><div class="p6-stat"><span>Run mode</span><b>SOLO</b></div><section><p class="p6-credits">Performance monitor, accessibility profile, local save continuity and challenge telemetry are stored locally. No account or paid service is required.</p></section>`}
function renderMissions(){content.innerHTML=`<div class="p6-stat"><span>MAIN CAMPAIGN</span><b>AVAILABLE</b></div><div class="p6-ending">NEON DISTRICT · Restore the grid</div><div class="p6-ending">PHASE 4 NETWORK · Six-district campaign</div><div class="p6-ending">PHASE 5 CHALLENGES · Races, caches, puzzles and restoration</div><div class="p6-ending">FINAL POLISH · Explore, improve upgrades and complete the city</div><p class="p6-credits">Mission selection is a planning interface; your existing save and campaign progression remain authoritative.</p>`}
function renderCredits(){content.innerHTML=`<div class="p6-credits"><strong>NEON CITY // NEON VELOCITY</strong><br><br>Final systems pass<br>Three.js cyberpunk parkour<br>Local-first progression and accessibility<br>Synthesized browser audio<br>Responsive touch / keyboard / mouse controls<br>Weather, day/night atmosphere and performance adaptation<br><br>Built as an original browser game.</div>`}
function openPanel(kind="settings"){panel.classList.add("open");if(kind==="settings")renderSettings();if(kind==="stats")renderStats();if(kind==="missions")renderMissions();if(kind==="credits")renderCredits();tone(330,.045,"triangle")}
document.querySelector("#phase6-button").onclick=()=>openPanel();
document.querySelectorAll("[data-p6]").forEach(b=>b.onclick=()=>openPanel(b.dataset.p6));
document.addEventListener("pointerdown",e=>{if(panel.classList.contains("open")&&!panel.contains(e.target)&&e.target.id!=="phase6-button")panel.classList.remove("open")},{capture:true});

// Day/night atmosphere cycles independently of gameplay logic, preserving the existing scene lighting.
let phase6Time=0,lastPerf=performance.now(),frames=0,fps=60;
function update(dt){phase6Time+=dt;frames++;const now=performance.now();if(now-lastPerf>700){fps=Math.round(frames*1000/(now-lastPerf));frames=0;lastPerf=now;const f=document.querySelector("#p6-fps");if(f)f.textContent=fps+" FPS";if(state.quality==="auto"&&fps<35)document.documentElement.dataset.p6Performance="low";else delete document.documentElement.dataset.p6Performance}
 const cycle=(phase6Time/150)%1;const sun=Math.sin(cycle*Math.PI*2-Math.PI/2)*.5+.5;timeLayer.style.background=`rgba(10,22,70,${(1-sun)*.16})`;
}

// Final-system event bus: a lightweight local/BroadcastChannel contract for future co-op,
// shared challenges, friend runs and leaderboards without requiring a multiplayer server today.
const channel="BroadcastChannel" in window?new BroadcastChannel("neon-city-shared-challenges"):null;
const multiplayer={ready:true,mode:"client-ready",sessionId:crypto.randomUUID?.()||String(Date.now()),publish(event,payload={}){const msg={event,payload,at:Date.now(),sessionId:this.sessionId};try{channel?.postMessage(msg)}catch{}try{localStorage.setItem("neon-city-last-event",JSON.stringify(msg))}catch{}},subscribe(fn){if(channel)channel.onmessage=e=>fn(e.data)}};
window.NeonCityPhase6={settings:state,openPanel,multiplayer,version:"6.0"};
multiplayer.subscribe(msg=>{if(msg?.event==="challenge")speak("Shared challenge received")});

// Multiple ending presentation layered onto the existing victory screen without replacing it.
const win=document.querySelector("#win-screen");
if(win){const endings=document.createElement("div");endings.className="p6-ending";endings.innerHTML=`<small>FINAL CHOICE</small><div class="p6-row"><button data-ending="guardian">GUARDIAN</button><button data-ending="liberator">LIBERATOR</button><button data-ending="wanderer">WANDERER</button></div><p id="p6-ending-text" class="p6-credits"></p>`;win.appendChild(endings);endings.querySelectorAll("button").forEach(b=>b.onclick=()=>{state.ending=b.dataset.ending;save(state);document.querySelector("#p6-ending-text").textContent={guardian:"The restored network remains under your protection.",liberator:"The restored systems are opened to the people of Neon City.",wanderer:"The city is stable, and you leave the network ready for its next chapter."}[state.ending];tone(660,.12,"sine")})}

setInterval(()=>{if(document.visibilityState==="visible"&&state.audio)tone(110,.025,"sine")},9000);
window.addEventListener("beforeunload",()=>save(state));

// Expose an additive tick for the existing loop through a tiny rAF scheduler.
let last=performance.now();function tick(now){const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);requestAnimationFrame(tick)}requestAnimationFrame(tick);
