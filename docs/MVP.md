# BlackMamba Ocarina 3D — Playable MVP

This milestone proves the shortest complete musical loop:

```text
physical input / microphone
  -> fingering state + breath
  -> note resolver
  -> 3D feedback
  -> Web Audio voice
  -> live staff
  -> learn-mode validation
```

## Run

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Audio

Browsers require a user gesture before starting Web Audio. Click **ARM AUDIO ENGINE** once after loading the page.

## Microphone breath

Click **ARM MICROPHONE BREATH** and allow microphone access. The app measures the incoming waveform with an analyser node, calculates an RMS envelope, applies a noise floor and smoothing, and converts the result into the same normalized breath signal used by R2 and Space.

The effective breath is the strongest active source:

```text
max(gamepad R2, keyboard/touch blow, microphone envelope)
```

This keeps controller testing available while enabling a more physical instrument interaction.

## Gamepad controls

The MVP assumes the browser standard gamepad layout:

| Input | Musical function |
| --- | --- |
| A | H1 |
| B | H2 |
| X | H3 |
| Y | H4 |
| LB | H5 |
| RB | H6 |
| R2 | Breath / volume |

The four face buttons are interpreted as closed holes while held.

## Keyboard / touch fallback

| Input | Musical function |
| --- | --- |
| 1 | H1 |
| 2 | H2 |
| 3 | H3 |
| 4 | H4 |
| 5 | H5 |
| 6 | H6 |
| Space | Breath |

The on-screen buttons expose the same controls for touch or mouse testing.

## Current fingering map

The active mapping now follows the BM-OC-002 progressive-opening contract:

```text
● ● ● ● ● ● -> C5
○ ● ● ● ● ● -> D5
○ ○ ● ● ● ● -> E5
○ ○ ○ ● ● ● -> F5
○ ○ ○ ○ ● ● -> G5
○ ○ ○ ○ ○ ● -> A5
○ ○ ○ ○ ○ ○ -> B5
```

Non-progressive combinations are intentionally left unmapped. The runtime only resolves the canonical cumulative H1→H6 opening sequence until physical calibration says otherwise.

## Learn mode

Press **START LEARN** to begin a guided five-note exercise. The tutor exposes one target at a time with:

- note name;
- solfège label;
- target fingering;
- live success feedback;
- hit counter.

A target only advances after the correct note is sounding with breath above the active threshold. This means simply selecting the fingering without playing the instrument does not count.

## 3D strategy

The runtime now attempts to load `public/models/BM-OC-002.glb` as the production digital twin. If the asset is not present yet, it falls back to the procedural body so software work does not block on Blender.

H1–H6 remain interactive in both modes, and the production GLB is still considered a prototype until the physical pitch/repeatability gate passes.

## CI

GitHub Actions now validates every feature push and pull request with:

```bash
npm install
npm run build
```

The build command performs the TypeScript check before the Vite production build.

## Definition of done for this milestone

- [x] React + TypeScript + Vite foundation
- [x] Three.js / React Three Fiber scene
- [x] Orbit / zoom camera controls
- [x] Live gamepad polling
- [x] Keyboard and touch fallback
- [x] Six-hole BM-OC-002 visual state
- [x] BM-OC-002 C5–B5 fingering-to-note resolver
- [x] Web Audio oscillator voice
- [x] Breath-controlled gain
- [x] Microphone breath envelope follower
- [x] Live staff note
- [x] Current note / frequency / fingering telemetry
- [x] Guided Learn mode target-note loop
- [x] CI build validation

## Next milestone

1. Replace the procedural body with a production ocarina `.glb`.
2. Add real 10/12-hole fingering tables.
3. Add note history and timing on the staff.
4. Add tempo-aware exercises and timing score.
5. Add microphone calibration / sensitivity control.
6. Persist user gamepad mappings.
7. Add song data and a first playable melody.
