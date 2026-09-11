# BlackMamba Ocarina 3D — local development

This runbook targets the active MVP branch: `feat/mvp-foundation`.

## Requirements

- Node.js 22 recommended
- npm
- Chromium/Chrome, Edge or Safari with Gamepad API and microphone permissions
- optional USB/Bluetooth gamepad

## Clone the active branch

```bash
git clone --branch feat/mvp-foundation --single-branch https://github.com/Blackmvmba88/ocarine.git
cd ocarine
```

If the repository already exists locally:

```bash
cd ocarine
git fetch origin
git switch feat/mvp-foundation
git pull --ff-only origin feat/mvp-foundation
```

## Install and validate

```bash
npm install
npm run build
```

The production build command runs TypeScript first:

```text
tsc -b && vite build
```

## Start development mode

```bash
npm run dev
```

Open the local Vite URL printed in the terminal, normally `http://localhost:5173`.

Use `localhost` rather than a raw LAN IP when testing microphone breath unless HTTPS is configured, because browser microphone access requires a secure context.

## First device pass

1. Click **Activar audio**.
2. Verify keyboard notes with `Z X C V` and arrow keys.
3. Connect the gamepad and confirm the connection indicator changes.
4. Test the default controller profile, then custom remapping.
5. Click **Usar micrófono**, remain quiet during the short ambient calibration, then blow and confirm the breath meter/gate reacts.
6. Select a practice section.
7. Set tempo between 50% and 125%.
8. Start **Count-in + Loop** and verify the staff cursor and metronome agree.
9. Record one loop and confirm note, timing and duration scoring.
10. Export JSON and MIDI and verify the filename/metadata reflects the selected section and actual practice BPM.

## Performance notes

The current branch is tuned for local interactive use:

- idle gamepad polling does not update React state unless connection/button state changes;
- breath UI publishing is capped to roughly 30 Hz while microphone analysis continues on animation frames;
- the visual practice clock publishes at roughly 30 Hz;
- the Three.js scene uses demand rendering instead of continuously redrawing while idle;
- render DPR is capped at 1.5 to avoid unnecessary Retina GPU load;
- procedural geometry has reduced segment counts without changing the interaction contract.

## Troubleshooting

### Microphone does not open

Use `localhost`, grant browser microphone permission, and reload the page after changing permission settings.

### Gamepad does not appear

Press a button after connecting it. Some browsers do not expose a gamepad until the user interacts with the controller.

### Audio is silent

Click **Activar audio** first. Browsers block Web Audio startup until a user gesture occurs.

### GitHub Actions is red but local build works

At the time this runbook was written, GitHub Actions was creating the `build` job but failing before any workflow step started. Treat `npm run build` locally as the useful application-level validation until the runner-side issue is resolved.
