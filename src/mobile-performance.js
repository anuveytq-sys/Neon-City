// Mobile GPU guard. Keep all gameplay, geometry and effects intact; only reduce
// the number of physical pixels the GPU must shade on touch devices.
(() => {
  const coarse = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  if (!coarse) return;
  try {
    const nativeDpr = Number(window.devicePixelRatio) || 1;
    const capped = Math.min(nativeDpr, 1.0);
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      get: () => capped
    });
  } catch (_) {}
})();
