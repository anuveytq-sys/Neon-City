// Adaptive mobile GPU guard. Preserve scene content and gameplay; reduce only
// the drawing-buffer resolution on touch devices to avoid filling the GPU.
(() => {
  const coarse = matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  const nativeDpr = Number(window.devicePixelRatio) || 1;
  const capped = coarse ? Math.min(nativeDpr, 0.9) : Math.min(nativeDpr, 1.5);
  try {
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      get: () => capped
    });
  } catch (_) {
    // The renderer also applies its own pixel-ratio cap.
  }
})();
