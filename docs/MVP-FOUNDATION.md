# MVP Foundation

This document records what is implemented in `feat/mvp-foundation` and what remains intentionally provisional.

## Implemented

- Vite + React + TypeScript application shell.
- Procedural interactive 3D ocarina rendered with React Three Fiber.
- Orbit controls for rotate/zoom inspection.
- Six visual hole states driven by the current musical note.
- Gamepad API polling for a connected USB/Bluetooth controller.
- Keyboard fallback so the prototype can be tested without a controller.
- Initial note resolver covering C4 through C5.
- Web Audio oscillator for immediate note feedback.
- Interactive staff showing the target note and the note performed by the player.
- Automatic learn loop that advances after a correct note.
- Live connection state, note frequency, fingering state and control mapping.
- Responsive UI for desktop and smaller screens.
- GitHub Actions build validation.

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

The gamepad mapping follows the browser standard button indices, so labeling can vary between controller families.

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL, click **Activar audio**, and use either the keyboard mapping or a connected gamepad.

## Important prototype boundary

The current six-hole fingering table is an interaction prototype, not yet a claim of physically accurate fingering for a specific commercial ocarina model. Accurate 4/6/10/12-hole profiles will live in dedicated data files and be validated separately.

The 3D body is also procedural. It exists to prove the input → fingering → visual → note → audio → staff loop before replacing it with a production `.glb` instrument model.

## Next slice

1. Add instrument profiles and validated fingering data.
2. Replace the procedural body with a proper `.glb` ocarina.
3. Add breath input from the microphone and make breath gate note onset/velocity.
4. Add sustained articulation and a more convincing ocarina timbre.
5. Add song files, tempo, measure cursor and practice looping.
6. Add remappable gamepad profiles for Xbox, PlayStation, Nintendo and generic controllers.
7. Add MIDI/MusicXML performance export.

## MVP success condition

The foundation is successful when this loop is reliable:

```text
GAMEPAD / KEYBOARD
        ↓
FINGERING STATE
        ↓
NOTE RESOLUTION
        ↓
3D REACTION + AUDIO
        ↓
STAFF FEEDBACK
        ↓
NEXT TARGET
```

That loop is the first playable form of BlackMamba Ocarina 3D.
