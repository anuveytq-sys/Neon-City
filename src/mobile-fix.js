// Mobile stability patch: keep the existing gameplay controller intact while correcting
// the visual thumb position in the CSS-rotated iOS fallback and preventing a stuck boot overlay.
(() => {
  const hideBoot = () => document.querySelector('#loading-screen')?.classList.add('hidden');
  window.addEventListener('load', () => setTimeout(hideBoot, 900), { once:true });
  setTimeout(hideBoot, 1400);

  const stick = document.querySelector('#move-stick');
  const knob = document.querySelector('#stick-knob');
  if (!stick || !knob) return;

  const rotatedFallback = () => matchMedia('(pointer: coarse)').matches && innerHeight > innerWidth && innerWidth <= 800;
  const screenToControl = (dx,dy) => rotatedFallback() ? { x:dy, y:-dx } : { x:dx, y:dy };
  const paintKnob = (e) => {
    const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    let dx=e.clientX-cx,dy=e.clientY-cy;
    const max=Math.min(r.width,r.height)*.34,len=Math.hypot(dx,dy);
    if(len>max){dx=dx/len*max;dy=dy/len*max;}
    const p=screenToControl(dx,dy);
    knob.style.transform=`translate(${p.x}px,${p.y}px)`;
  };
  stick.addEventListener('pointerdown',paintKnob,{passive:false});
  stick.addEventListener('pointermove',paintKnob,{passive:false});
  const reset=()=>{knob.style.transform='translate(0,0)';};
  stick.addEventListener('pointerup',reset);stick.addEventListener('pointercancel',reset);stick.addEventListener('lostpointercapture',reset);
})();