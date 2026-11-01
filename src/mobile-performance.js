// Keep the existing scene/features intact while preventing excessive mobile GPU fill-rate.
// main.js reads window.devicePixelRatio when constructing and resizing the Three.js renderer.
(() => {
  const coarse = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  if (!coarse) return;
  try {
    const nativeDpr = Number(window.devicePixelRatio) || 1;
    const capped = Math.min(nativeDpr, 1.25);
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      get: () => capped
    });
  } catch (_) {
    // Some browsers expose devicePixelRatio as non-configurable; keep normal rendering there.
  }
})();
