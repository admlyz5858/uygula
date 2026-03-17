# Marble Race Simulator

Ultra-realistic marble race physics simulator with procedural tracks, AI marbles, and cinematic visuals. Runs in any modern browser, optimized for mobile.

## Quick Start

```bash
npx serve .
```

Then open `http://localhost:3000` in your browser.

## Features

### Physics Engine
- Semi-implicit Euler integrator with constraint solving (10 iterations)
- SAT-based collision detection with Baumgarte stabilization
- Rolling friction with torque-based model
- Static + dynamic friction, angular velocity, moment of inertia (2/5 mr²)
- Material system: ice, rubber, metal, sand, wood, glass, bouncy, sticky, conveyor
- Air drag (F = -kv²), Magnus/spin effect

### Force Zones
- Gravity zones, magnetic fields, vortex spirals
- Wind zones, fluid zones (viscosity simulation)
- Gravity inversion, random force fields, teleporters

### Procedural Track Generation
- Seed-based deterministic generation
- Sections: funnel start, chaos zone, skill section, checkpoint, steep drop, split path, final arena
- Multiple obstacle types: spinners, pendulums, oscillators, bumpers, trapdoors, conveyor belts, elastic pads

### AI System
- 4 behavior types: aggressive, balanced, safe, random
- Path prediction via raycasting
- Collision avoidance, slip correction, risk evaluation

### Rendering
- Animated gradient backgrounds
- Glow/bloom pipeline
- Motion trails, particle effects
- Screen shake on impacts
- Slow-motion on key events (1st place finish)

### Camera System
- Follow leader / Follow pack / Cinematic / Overview / Free modes
- Auto-zoom based on marble spread
- Dramatic finish zoom
- Pan and pinch-zoom support

### Audio
- Adaptive ambient music (intensity follows race action)
- Spatial bounce/collision sounds with stereo panning
- Victory fanfare

### Mobile Optimization
- Adaptive quality (LOW/MEDIUM/HIGH) based on FPS
- Touch controls: tap to focus, swipe to pan, pinch to zoom
- Battery optimization: pause when off-screen, visibility API

### Replay System
- Deterministic recording at 30fps
- Interpolated playback with speed control

## Controls

| Action | Desktop | Mobile |
|--------|---------|--------|
| Pan | Click + drag | Swipe |
| Zoom | Mouse wheel | Pinch |
| Focus marble | Click on marble | Tap on marble |

## Architecture

```
src/
├── physics/    # Core physics engine
│   ├── engine.js      # Integrator, solver, simulation loop
│   ├── collision.js    # SAT detection, contact resolution
│   ├── forces.js       # Gravity, drag, force zones
│   ├── marble.js       # Rigid body marble class
│   └── materials.js    # Surface material definitions
├── render/     # Rendering pipeline
│   ├── renderer.js     # Main draw pipeline
│   ├── camera.js       # Cinematic camera system
│   └── effects.js      # Particles, bloom, screen flash
├── procedural/ # Content generation
│   ├── track.js        # Procedural track builder
│   └── obstacles.js    # Obstacle factory (7+ types)
├── ai/         # Marble AI
│   └── behavior.js     # AI behavior system
├── mobile/     # Mobile optimization
│   ├── touch.js        # Touch input handler
│   └── performance.js  # Adaptive quality monitor
├── audio/      # Sound system
│   └── audio.js        # Adaptive music + spatial SFX
└── replay/     # Replay system
    └── replay.js       # Recording + playback
```

## Browser Support

- Chrome 80+
- Firefox 78+
- Safari 14+
- Edge 80+
- Mobile Chrome / Safari

## License

ISC
