# ADR-0004 — Practice scoring, audible count-in and replay

- Status: Accepted
- Date: 2026-08-22

## Context

The MVP already had a visual tempo cursor and a local performance recorder, but it could only answer whether the expected note was eventually played. It could not distinguish a note played on time from one played substantially early or late, and recorded sessions could not be replayed inside the application.

A musical tutor needs three independent concepts:

1. **score position** — what note the exercise expects,
2. **time position** — when that note should begin,
3. **performance evidence** — what the player actually performed and when.

## Decision

### Audible practice guide

Practice mode adds an audible metronome with the exercise-defined count-in.

For `First Flight`:

```text
84 BPM
4/4
4-beat count-in
```

The visual practice cursor does not begin until the count-in has completed.

### Timing normalization

Performance scoring deliberately removes recorder-start offset.

```text
normalized onset = event.startedAtMs - firstEvent.startedAtMs
```

This means the score evaluates the player's relative rhythmic execution instead of penalizing them for browser scheduling latency or for starting the recorder before the count-in.

### Matching window

Each expected exercise step is matched to the closest unused performance event inside a bounded timing window.

Current prototype thresholds:

- `perfect`: absolute error <= 90 ms
- `good`: absolute error <= 180 ms
- `early` / `late`: outside the good window but within the 520 ms search window
- `miss`: no candidate inside the search window

A wrong pitch can still be timing-matched for diagnostic purposes, but receives a substantial point penalty.

### Aggregate score

The UI exposes:

- overall score `0–100`,
- note accuracy,
- timing accuracy,
- average absolute timing error in milliseconds.

These values are coaching metrics, not claims of conservatory-grade assessment.

### Replay

Recorded note events can be replayed locally with their original relative onset and duration.

Replay uses the event frequency and breath peak to reconstruct a simple diagnostic audio rendering. It intentionally uses the prototype synthesis voice rather than pretending to reproduce the exact acoustic signal captured from the player.

## Consequences

### Positive

- The tutor can distinguish correct pitch from correct timing.
- Count-in, score cursor and performance evidence remain separate concerns.
- Replay makes recorded sessions immediately inspectable without exporting files.
- Scoring is resilient to recorder-start offset and modest browser scheduling latency.

### Tradeoffs

- Scoring is onset-based and does not yet grade note duration independently.
- The current matching algorithm is greedy rather than a global sequence alignment algorithm.
- Replay reconstructs events; it is not raw audio playback.
- Browser audio scheduling remains unsuitable for laboratory-grade latency measurement.

## Follow-up

1. Add duration/articulation scoring.
2. Add section loops and configurable tempo scaling.
3. Add a calibration pass for input/output latency.
4. Consider dynamic-programming sequence alignment for longer songs.
5. Add continuous pitch/breath/motion expression to replay and MIDI export.
