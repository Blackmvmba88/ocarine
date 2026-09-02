# ADR-0001 — Separate controller, fingering and breath semantics

- Status: Accepted
- Date: 2026-08-21

## Context

The first BlackMamba Ocarina prototype proved the interaction loop with note objects that also carried gamepad button labels. That is convenient for a tiny demo but couples three different concepts:

1. the physical/digital instrument and its fingering,
2. the controller used to express that fingering,
3. the breath signal that determines whether the fingering becomes a performed note.

That coupling becomes a problem as soon as the player changes from Xbox to PlayStation/Nintendo, adds a custom controller, or swaps to a different ocarina profile.

## Decision

The runtime pipeline is separated into independent layers:

```text
GAMEPAD / KEYBOARD
        ↓
ControlProfile
        ↓
note intent
        ↓
InstrumentProfile
        ↓
fingering + pitch
        │
        ├───────────────┐
        │               │
        ↓               ↓
     Ocarina 3D      Breath input
                        ↓
                    breath gate
                        ↓
                   performed note
                     ↙       ↘
                  audio      tutor
```

### ControlProfile

Owns controller-family semantics:

- browser button index,
- visible button label,
- note intent.

The current implementation includes Xbox/Standard, PlayStation and Nintendo profiles.

### InstrumentProfile

Owns instrument semantics:

- hole count,
- fingering table,
- pitches,
- profile validation status.

The current `6-hole trainer` profile is explicitly marked `prototype`.

`OcarinaNote` no longer carries controller button metadata. Notes contain only musical/instrument state; controller semantics live exclusively in `ControlProfile`.

### Breath input

Breath is a separate continuous signal. When breath mode is enabled, a valid fingering does not become a performed note until microphone RMS crosses the configured gate threshold.

The raw microphone stream is analyzed locally and is not connected to the output graph or uploaded by the application.

## Consequences

### Positive

- Controller labels can change without changing musical data.
- Physical ocarina fingering can be replaced/validated independently.
- A future MIDI controller or custom hardware adapter can implement the same control contract.
- Breath calibration can evolve without rewriting the gamepad layer.
- The same instrument profile can be used by keyboard, gamepad, touch or future sensor inputs.
- Musical note objects are now controller-agnostic.

### Tradeoffs

- There are more explicit data contracts than in the original prototype.
- Full arbitrary user remapping is not implemented yet; the current slice switches among known controller-family profiles.

## Follow-up

1. Persist custom remappings in local storage.
2. Add validated physical instrument profiles.
3. Introduce a typed performance-event layer between breath gate and audio/tutor consumers.
