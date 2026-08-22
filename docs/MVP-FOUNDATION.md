# MVP Foundation

This document records what is implemented in `feat/mvp-foundation` and what remains intentionally provisional.

## Implemented

- Vite + React + TypeScript application shell.
- Procedural interactive 3D ocarina rendered with React Three Fiber.
- Orbit controls for rotate/zoom inspection.
- Six visual hole states driven by the current musical note.
- Gamepad API polling for a connected USB/Bluetooth controller.
- Stable keyboard fallback that remains independent from custom gamepad remapping.
- Initial note resolver covering C4 through C5.
- Formal `InstrumentProfile` contract so fingering sets can be swapped without rewriting the UI.
- Controller profiles for Xbox/Standard, PlayStation and Nintendo.
- Custom local gamepad remapping with collision-safe swap semantics.
- Persistent controller profile selection and custom mappings via versioned browser `localStorage`.
- Web Audio oscillator for immediate note feedback.
- Optional microphone breath input using local RMS analysis.
- Breath gate: when enabled, fingering alone does not count as a performed note until the player blows above the configured threshold.
- Breath level drives output gain, giving the prototype a first dynamic-expression signal.
- Adjustable breath threshold in the UI.
- Guided staff exercise with a visible multi-note phrase, active playhead and control label under every target note.
- Automatic learn loop that advances after each correct note and restarts after the phrase is completed.
- Typed performance recording with note, MIDI, frequency, onset, duration, breath peak and input source.
- Local versioned JSON performance export.
- Live connection state, note frequency, fingering state, breath level and instrument-profile telemetry.
- Responsive UI for desktop and smaller screens.
- GitHub Actions build validation.

## Current guided exercise

`First Flight` is the first data-driven practice phrase:

```text
C4  D4  E4  G4  E4  D4  C4
```

The staff renders the complete phrase at once. The active note is highlighted by a playhead and each note shows the currently selected gamepad control required to perform it.

Exercise data lives separately from rendering so later song files can use the same pipeline.

## Default controls

| Note | Gamepad | Keyboard |
| --- | --- | --- |
| C4 | A | Z |
| D4 | B | X |
| E4 | X | C |
| F4 | Y | V |
| G4 | D-Pad Up | Up Arrow |
| A4 | D-Pad Right | Right Arrow |
| B4 | D-Pad Down | Down Arrow |
| C5 | D-Pad Left | Left Arrow |

The preset gamepad mappings follow browser standard button indices. Visible labels change with the selected controller family.

## Custom controller remapping

Every note in the mapping grid exposes a **Remap** action.

```text
SELECT NOTE
    ↓
PRESS GAMEPAD BUTTON
    ↓
CUSTOM PROFILE
    ↓
LOCAL PERSISTENCE
```

If the requested physical button is already assigned to another note, the two assignments swap buttons. This prevents duplicate bindings from making note resolution ambiguous.

The custom profile is stored only in the current browser/device and can be reset from the UI.

Keyboard input intentionally keeps its fixed fallback mapping even when the gamepad is remapped.

## Breath mode

Breath mode is optional.

When disabled:

```text
BUTTON → NOTE → AUDIO
```

When enabled:

```text
BUTTON → FINGERING
             +
MICROPHONE → BREATH LEVEL
             ↓
        BREATH GATE
             ↓
           NOTE
```

The microphone signal is analyzed locally in the browser. The analyser is not connected to the audio output and the app does not upload microphone audio.

The current breath detector is deliberately simple: time-domain RMS with smoothing and a user-adjustable threshold. It proves the interaction contract before later work on calibration, attack detection and more sophisticated breath modeling.

## Performance recording

Recording is explicit and local. The player can start, stop, clear and export a performance session.

Each finalized note event contains:

```text
note
MIDI number
frequency
relative start time
duration
peak breath level
input source
```

The first export envelope is:

```text
blackmamba-ocarina-performance / v1
```

The JSON payload also records the instrument profile, controller profile, breath mode and threshold used during the session. This format is intended to become the source for future replay, MIDI, MusicXML and learning analytics.

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL. You can click **Activar audio** for button-only play, or **Usar micrófono** to require breath. Use either the keyboard mapping or a connected gamepad.

Microphone access requires a secure browser context (`localhost` or HTTPS) and explicit user permission.

## Important prototype boundary

The current six-hole fingering table is an interaction prototype, not yet a claim of physically accurate fingering for a specific commercial ocarina model. Accurate 4/6/10/12-hole profiles will live in dedicated data files and be validated separately.

The 3D body is also procedural. It exists to prove the input → fingering → breath → visual → note → audio → staff loop before replacing it with a production `.glb` instrument model.

The current audio voice is intentionally a simple oscillator. Breath already gates and scales it, but production ocarina timbre remains future work.

Performance JSON is versioned but still an internal prototype interchange format rather than a promised stable public API.

## Next slice

1. Add validated physical ocarina fingering profiles.
2. Replace the procedural body with a proper `.glb` ocarina.
3. Add breath calibration, attack detection and sustained articulation.
4. Replace the oscillator with a more convincing sample/physical-model hybrid voice.
5. Expand exercise/song files with duration, rests, measures, tempo cursor and practice looping.
6. Add session replay from recorded performance events.
7. Add MIDI export, then quantized MusicXML export.
8. Add import/export for custom controller profiles.
9. Add continuous expression events for vibrato, pitch bend and motion sensors.

## MVP success condition

The foundation is successful when this loop is reliable:

```text
GAMEPAD ─→ ControlProfile ─┐
                          │
KEYBOARD ─────────────────┤
                          ↓
                    FINGERING STATE ────────┐
                                           │
MICROPHONE ─→ BREATH ──────────────────────┤
                                           ↓
                                      NOTE EVENT
                                   ↙       ↓       ↘
                              3D + AUDIO  STAFF  RECORDER
                                             ↓
                                        NEXT TARGET
```

That loop is now represented in the codebase and is the first playable form of BlackMamba Ocarina 3D.
