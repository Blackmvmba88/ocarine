# Local development

Use Node.js 22.12 or later (the CI uses Node 22 from `.nvmrc`).

```bash
npm ci
npm test
npm run build
npm run dev
```

The build runs `tsc --noEmit && vite build` and writes to `dist/`.
Use localhost, or HTTPS for remote devices, to enable microphone access.

## Playable screen

- Activate audio with the button.
- Keys 1–6 toggle H1–H6. Hold Space to blow; releasing it or leaving the window stops keyboard breath.
- Gamepad buttons A/B/X/Y/LB/RB cover H1–H6; RT controls breath. The first connected gamepad takes precedence over manual holes.
- Enable the microphone and remain quiet for 1.2 seconds during ambient calibration. Disable/re-enable it to recalibrate after moving rooms.
- Calibration reduces ambient triggers but does not classify speech or guarantee feedback rejection. Test with headphones.
- All note resolution uses `DEFAULT_INSTRUMENT_PROFILE` (BM-OC-002). Only its seven progressive fingerings sound. The physical instrument remains unvalidated until measured.
- A visible status identifies the procedural view when `public/models/BM-OC-002.glb` is absent. Generate the physical asset using the documented hardware workflow; a fallback is not the manufactured geometry.

The practice, replay, recording and MIDI modules remain available in source but are not connected to this screen yet.

## Manual device checks

1. Activate audio, hold Space and open H1, then H2–H6 in sequence: C5 through B5.
2. Try an unmapped fingering: it should be silent.
3. Hold Space and switch windows: the breath must return to zero.
4. Deny mic permission, then retry after granting it. Confirm the error and calibration statuses.
5. In a quiet room, calibrate without blowing, then check attacks, releases and stop/restart capture.
6. Connect/disconnect a gamepad and confirm that manual controls return when disconnected.

Automated build checks do not prove real microphone, audio output, gamepad latency or physical tuning.
