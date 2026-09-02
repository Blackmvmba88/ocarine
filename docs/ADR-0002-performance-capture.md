# ADR-0002 — Local remapping and performance capture

- Status: Accepted
- Date: 2026-08-22

## Context

The MVP can already translate a controller profile into instrument fingering and optionally gate the resulting note with microphone breath. Two capabilities are needed before the interaction model can grow safely:

1. players must be able to adapt the controller without changing source code;
2. performances must become structured data rather than disappearing after audio playback.

## Decision

### Local controller remapping

A player can select any note in the mapping grid and then press a physical gamepad button. The application creates or updates a `custom-local` control profile.

Remapping uses swap semantics. If the requested button is already assigned to another note, the two assignments exchange buttons instead of creating an ambiguous duplicate mapping.

The selected control profile and custom bindings are persisted in browser `localStorage` under a versioned key.

The keyboard fallback is intentionally resolved through the fixed standard keyboard mapping rather than the remapped gamepad profile. This keeps an emergency/test input available even when the physical controller has a highly customized layout.

### Performance capture

A performed note is captured as a typed event containing:

```ts
{
  note: string
  midi: number
  frequency: number
  startedAtMs: number
  durationMs: number
  breathPeak: number
  source: 'gamepad' | 'keyboard' | 'mixed' | 'unknown'
}
```

Recording is local to the browser session. The user explicitly starts and stops capture.

The first export format is versioned JSON:

```text
blackmamba-ocarina-performance / v1
```

The exported envelope also records the instrument profile, controller profile, breath mode and breath threshold used for the session.

## Consequences

### Positive

- Controller preferences survive reloads without requiring an account or backend.
- Mapping conflicts cannot silently create two notes on one button.
- The same performance data can later feed MIDI, MusicXML, analytics, replay or scoring.
- Input provenance is preserved for debugging and learning analytics.
- Breath dynamics are retained as data instead of only affecting transient audio gain.

### Tradeoffs

- `localStorage` is device/browser-local and is not synchronization.
- JSON capture is an internal interchange format, not yet a public stable API.
- Recording currently captures note events, not continuous pitch-bend or motion curves.
- Arbitrary touch/MIDI/custom hardware mapping will require adapters that emit the same semantic input contract.

## Follow-up

1. Add a typed session/replay engine over recorded events.
2. Add MIDI export from `PerformanceNoteEvent` data.
3. Add MusicXML export from quantized exercise/song timing.
4. Persist breath calibration separately from controller settings.
5. Add import/export for custom control profiles.
6. Add continuous expression events for vibrato, pitch bend and motion sensors.
