# ADR-0005 — Tempo scaling and section-loop practice

- Status: Accepted
- Date: 2026-08-31

## Context

The tutor can already guide a complete phrase, run an audible count-in, score note/timing/duration, record performances and export JSON/MIDI. Requiring every practice attempt to run the whole phrase at its original BPM makes difficult passages unnecessarily expensive to repeat.

A useful instrument tutor needs to let the player reduce speed and isolate a passage without creating a second timing truth for the staff, scoring engine or exports.

## Decision

### Data-defined sections

`PracticeExercise` now exposes named sections as step ranges:

```ts
{
  id: string
  title: string
  startStep: number
  endStepExclusive: number
}
```

`First Flight` initially exposes:

- full phrase;
- ascending phrase `C D E G`;
- return phrase `G E D C`;
- middle transition `E G E`.

The selected section is converted into the active exercise step list. The tutor therefore loops only that musical material.

### Tempo scaling

The practice UI exposes a 50%–125% speed control. The active BPM is derived from the exercise reference tempo:

```text
active BPM = round(reference BPM × tempo percent / 100)
```

The reference exercise remains 84 BPM. At 75%, for example, the active practice tempo is 63 BPM.

### One timing truth

The active section and active BPM are passed consistently to:

- staff rendering;
- visual practice clock;
- audible metronome/count-in;
- tutor target loop;
- timing and duration scoring;
- JSON performance metadata;
- MIDI tempo metadata.

Changing section or tempo resets the current practice evidence so events recorded under one timing contract are not scored against another.

### Loop semantics

A section loop is not implemented as a hidden playback trick. The section itself becomes the active exercise. When the tutor reaches the final note, its target index returns to the first note in the selected section.

This keeps practice behavior deterministic and makes later section statistics straightforward.

## Consequences

### Positive

- Difficult phrases can be drilled without replaying the full exercise.
- Slower practice remains scoreable because expected onsets and durations use the actual practice BPM.
- Exported MIDI reflects the tempo actually practiced.
- Section-specific recordings can later feed mastery analytics.
- The original exercise data remains unchanged and acts as the reference tempo/phrase.

### Tradeoffs

- Sections currently use contiguous step ranges; arbitrary non-contiguous selections are not represented.
- Tempo scaling changes BPM globally for the selected section; tempo ramps are not yet supported.
- Section changes clear the current performance session rather than attempting to reinterpret it.

## Follow-up

1. Add per-section best score and attempt history.
2. Add automatic tempo progression after repeated successful loops.
3. Add a user-defined A/B loop range on the staff.
4. Add latency calibration before tightening timing thresholds.
5. Add richer song files with rests, sections and difficulty metadata.
