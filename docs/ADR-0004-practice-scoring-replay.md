# ADR-0004 — Practice scoring, audible count-in and replay

- Status: Accepted
- Date: 2026-08-22
- Updated: 2026-08-31

## Context

The MVP already had a visual tempo cursor and a local performance recorder, but it could only answer whether the expected note was eventually played. It could not distinguish a note played on time from one played substantially early or late, and recorded sessions could not be replayed inside the application.

A musical tutor needs four independent concepts:

1. **score position** — what note the exercise expects,
2. **time position** — when that note should begin,
3. **articulation duration** — how long the note should be sustained,
4. **performance evidence** — what the player actually performed and when.

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

Current prototype onset thresholds:

- `perfect`: absolute error <= 90 ms
- `good`: absolute error <= 180 ms
- `early` / `late`: outside the good window but within the 520 ms search window
- `miss`: no candidate inside the search window

A wrong pitch can still be timing-matched for diagnostic purposes, but receives a substantial point penalty.

### Duration / articulation scoring

Expected duration is derived directly from the exercise step:

```text
expected duration = step.beats × (60,000 / BPM)
```

The recorded note duration is compared with that target using relative error so quarter notes and longer notes are judged proportionally rather than with one fixed millisecond threshold.

Current prototype duration thresholds:

- `perfect`: duration error <= 15% of target
- `good`: duration error <= 30% of target
- `short`: note released too early beyond the good range
- `long`: note sustained too long beyond the good range
- `miss`: no matched performed note

Duration scoring remains intentionally tolerant because browser scheduling, input release timing and breath-gate behavior are not yet latency-calibrated.

### Aggregate score

The overall `0–100` score now combines three dimensions:

```text
45% pitch correctness
30% onset timing
25% duration / articulation
```

A wrong pitch can still preserve timing and duration evidence for diagnostics, but those expression points are heavily penalized instead of allowing a rhythmically perfect wrong note to score highly.

The scoring model also exposes:

- note accuracy,
- timing accuracy,
- duration accuracy,
- average absolute timing error in milliseconds,
- average absolute duration error in milliseconds,
- per-step onset grade,
- per-step duration grade.

These values are coaching metrics, not claims of conservatory-grade assessment.

### Replay

Recorded note events can be replayed locally with their original relative onset and duration.

Replay uses the event frequency and breath peak to reconstruct a simple diagnostic audio rendering. It intentionally uses the prototype synthesis voice rather than pretending to reproduce the exact acoustic signal captured from the player.

## Consequences

### Positive

- The tutor can distinguish correct pitch, correct entry time and correct note length.
- Sustained notes in exercises now carry real scoring meaning instead of only visual spacing.
- Count-in, score cursor and performance evidence remain separate concerns.
- Replay makes recorded sessions immediately inspectable without exporting files.
- Scoring is resilient to recorder-start offset and modest browser scheduling latency.

### Tradeoffs

- Duration is measured from semantic note events, not raw acoustic attack/release detection.
- The current matching algorithm is greedy rather than a global sequence alignment algorithm.
- Replay reconstructs events; it is not raw audio playback.
- Browser audio scheduling remains unsuitable for laboratory-grade latency measurement.
- Duration thresholds may need tuning after the first physical controller + microphone calibration session.

## Follow-up

1. Add section loops and configurable tempo scaling.
2. Add a calibration pass for input/output latency.
3. Consider dynamic-programming sequence alignment for longer songs.
4. Add continuous pitch/breath/motion expression to replay and MIDI export.
5. Surface per-step duration diagnostics directly on the staff/results UI.
