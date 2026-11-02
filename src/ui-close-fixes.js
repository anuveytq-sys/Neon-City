/* Universal panel hygiene: close controls and single-panel focus. */
const css=document.createElement('style');css.textContent=`
.nv-universal-close{position:absolute;top:9px;right:9px;width:30px;height:30px;border-radius:50%;border:1px solid rgba(69,246,239,.5);background:rgba(8,14,30,.95);color:#eafcff;font-size:18px;line-height:26px;z-index:20;cursor:pointer}.nv-has-close{position:relative!important}.nv-panel-hidden{display:none!important}
#puzzle-panel{z-index:250!important;max-width:min(520px,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto}
` ;document.head.appendChild(css);
function closePanel(el){el.classList.add('hidden');el.classList.remove('open','active');el.setAttribute('aria-hidden','true');}
function addClose(el){if(!el||el.id==='phase6-layer'||el.id==='phase7-layer'||el.querySelector('.nv-universal-close'))return;if(!el.matches('#puzzle-panel,[role="dialog"],aside,.puzzle-panel'))return;el.classList.add('nv-has-close');const b=document.createElement('button');b.className='nv-universal-close';b.type='button';b.textContent='×';b.setAttribute('aria-label','Close');b.onclick=e=>{e.preventDefault();e.stopPropagation();closePanel(el)};el.appendChild(b);}
function scan(){document.querySelectorAll('#puzzle-panel,[role="dialog"],aside,.puzzle-panel').forEach(addClose)}
scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
// Never leave two major interactive panels open simultaneously.
new MutationObserver(()=>{
 const open=[document.querySelector('#phase6-settings.open'),document.querySelector('#phase7-panel.open'),document.querySelector('#puzzle-panel:not(.hidden)')].filter(Boolean);
 if(open.length>1)open.slice(0,-1).forEach(closePanel);
}).observe(document.body,{attributes:true,attributeFilter:['class'],subtree:true});
