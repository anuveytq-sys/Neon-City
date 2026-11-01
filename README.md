# NEON VELOCITY — Cyberpunk Rescue

**Live website:** https://anuveytq-sys.github.io/Neon-City/


A landscape-first, third-person 3D parkour adventure built for the web.

## Current build: Phase 1 — Playable foundation

The first playable district includes:
- A third-person 3D runner with follow camera and mouse orbit.
- Keyboard controls (WASD / arrows), sprint and jumping.
- Touch movement and jump controls for phones and tablets.
- A neon city route with platforms, glowing architecture and a portal.
- Eight collectible energy cores, progress HUD and checkpoint respawn.
- Patrol drones as hazards to avoid.
- Pause, restart and level-complete screens.
- Responsive rendering with a portrait rotate-device prompt.

This is a real-time game prototype, not a discovery dashboard. The current chapter is a playable foundation; additional districts, authored character animation, richer physics, puzzles, story sequences, audio and progression are planned as subsequent phases.

## Run locally

```bash
npm install
npm run dev
```

Open the local Vite URL. Build for static hosting with:

```bash
npm run build
npm run preview
```

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | WASD / Arrow keys | Direction pad |
| Jump | Space | JUMP |
| Sprint | Shift | — |
| Orbit camera | Drag mouse | — |
| Pause | P / pause button | Pause button |

The browser cannot guarantee forced landscape orientation on every device. On supported phones, the game displays a rotate-device prompt while held in portrait.

## Technology

- Three.js for 3D rendering
- Vite for development and production builds
- Custom lightweight platform collision and movement simulation

## Roadmap

1. **Phase 1 — Playable foundation:** completed in this branch.
2. **Phase 2 — Movement and world polish:** robust platform-edge collision, improved animation, camera controls and mobile tuning.
3. **Phase 3 — Gameplay systems:** interactive terminals, non-violent drone avoidance, puzzle gates, collectibles and checkpoints.
4. **Phase 4 — Campaign:** six distinct districts, boss-style environmental challenges and cinematic story beats.
5. **Phase 5 — Progression:** upgrades, achievements, save/resume and accessibility settings.
6. **Phase 6 — Final polish:** sound, performance profiling, device testing and hackathon submission materials.

All future phases should preserve the existing playable loop and be added in small, testable commits.
