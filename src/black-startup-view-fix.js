// Surgical startup-view guard.
// It does not alter gameplay, controls, missions, physics, or scene content.
// It only stabilizes the first render so the player and starting district are visible.
import * as THREE from "three";

const originalRender = THREE.WebGLRenderer.prototype.render;
let startupFrames = 0;
let startupUntil = 0;
let restoredFog = null;

THREE.WebGLRenderer.prototype.render = function(scene, camera) {
  if (!startupUntil) startupUntil = performance.now() + 1400;

  if (performance.now() < startupUntil) {
    // Keep the initial framebuffer visibly cleared even on mobile WebGL contexts.
    this.setClearColor(0x080d20, 1);
    if (scene && scene.background == null) scene.background = new THREE.Color(0x080d20);

    // The intended spawn is x=0, y=0, z=1. Use a conservative cinematic
    // starting view until the normal follow-camera update takes ownership.
    if (camera && startupFrames < 90) {
      camera.position.set(0, 4.6, 10.5);
      camera.lookAt(0, 1.05, 0.2);
      camera.updateProjectionMatrix();
    }

    // Prevent an unexpectedly dense startup fog from making the whole frame
    // appear black while the normal game loop settles.
    if (scene && scene.fog && !restoredFog) {
      restoredFog = scene.fog;
      scene.fog = null;
      setTimeout(() => {
        if (scene && restoredFog) scene.fog = restoredFog;
      }, 1200);
    }
    startupFrames++;
  }

  return originalRender.call(this, scene, camera);
};
