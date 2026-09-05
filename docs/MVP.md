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
| A | Hole 1 |
| B | Hole 2 |
| X | Hole 3 |
| Y | Hole 4 |
| R2 | Breath / volume |

The four face buttons are interpreted as closed holes while held.

## Keyboard / touch fallback

| Input | Musical function |
| --- | --- |
| 1 | Hole 1 |
| 2 | Hole 2 |
| 3 | Hole 3 |
| 4 | Hole 4 |
| Space | Breath |

The on-screen buttons expose the same controls for touch or mouse testing.

## Current fingering map

The first mapping deliberately keeps the musical model small while the input/audio/visual loop is validated:

```text
● ● ● ● -> C4
● ● ● ○ -> D4
● ● ○ ○ -> E4
● ○ ○ ○ -> F4
○ ○ ○ ○ -> G4
```

Non-progressive combinations currently fall back to a note based on the number of closed holes. This is an MVP behavior, not the final ocarina fingering model.

## Learn mode

Press **START LEARN** to begin a guided five-note exercise. The tutor exposes one target at a time with:

- note name;
- solfège label;
- target fingering;
- live success feedback;
- hit counter.

A target only advances after the correct note is sounding with breath above the active threshold. This means simply selecting the fingering without playing the instrument does not count.

## 3D strategy

The MVP uses a procedural ocarina made from Three.js primitives so development does not block on a production `.glb` model. The four visible holes react immediately to input.

The production asset can later replace the procedural mesh without changing the musical/input contracts.

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
- [x] Four-hole visual state
- [x] Fingering-to-note resolver
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
