// Mobile startup safety patch.
// Orientation/joystick coordinates are handled by the dedicated CSS override so the
// existing game controller and the visible touch HUD share one screen-space coordinate system.
(() => {
  const loading = document.querySelector('#loading-screen');
  const finishBoot = () => {
    if (!loading) return;
    loading.classList.add('boot-complete');
    loading.classList.add('hidden');
  };

  // Never leave the full-screen boot layer sitting above the title/game UI.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(finishBoot, 250), { once: true });
  } else {
    setTimeout(finishBoot, 250);
  }
  window.addEventListener('load', finishBoot, { once: true });
  setTimeout(finishBoot, 1200);

  const stick = document.querySelector('#move-stick');
  const knob = document.querySelector('#stick-knob');
  if (!stick || !knob) return;

  // main.js owns the joystick state. Do not apply a second coordinate transform here.
  // The portrait fallback counter-rotates #touch-controls in CSS, so clientX/clientY
  // and getBoundingClientRect() now describe the same visible screen space.
  const reset = () => { knob.style.transform = 'translate(0,0)'; };
  stick.addEventListener('pointerup', reset);
  stick.addEventListener('pointercancel', reset);
  stick.addEventListener('lostpointercapture', reset);
})();