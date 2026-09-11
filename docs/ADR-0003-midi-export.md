# ADR-0003 — MIDI performance export

- Status: Accepted
- Date: 2026-08-22

## Context

BlackMamba Ocarina already records performed notes as structured events with MIDI note numbers, relative onset, duration and breath peak. Exporting those events as a Standard MIDI File makes the prototype immediately useful in DAWs without introducing a server or third-party MIDI dependency.

## Decision

The first MIDI exporter writes **Standard MIDI File Type 0** directly in TypeScript.

### Timing

- Resolution: **480 PPQ** (ticks per quarter note).
- Recorded milliseconds are converted to beats using the exercise BPM.
- The first exporter preserves performed timing and does **not quantize** note starts or durations.
- Minimum note duration is one MIDI tick.

### Metadata

The track begins with:

- tempo meta event derived from exercise BPM;
- time-signature meta event derived from `beatsPerMeasure` and `beatUnit`.

### Note events

Every recorded performance event produces:

```text
NOTE ON  @ performed start tick
NOTE OFF @ performed end tick
```

If note-off and note-on occur at the same tick, note-off is ordered first to avoid accidental overlaps on repeated pitches.

### Velocity

When breath data exists, `breathPeak` is mapped to MIDI velocity. Button-only performances use a stable default velocity.

Breath velocity mapping is intentionally conservative and can later be replaced by a calibrated expression model without changing the recorded source event format.

### Dependency policy

The initial encoder has no external MIDI library dependency. The required SMF surface is small enough to keep auditable in the repository:

- `MThd` header;
- one `MTrk` track;
- variable-length delta encoding;
- tempo/time-signature meta events;
- note-on/note-off events;
- end-of-track event.

## Consequences

### Positive

- Recorded performances can be opened in DAWs immediately.
- Export remains offline and browser-local.
- No package is introduced for a tiny deterministic binary format surface.
- Raw human timing is preserved for later analysis.
- Breath already has a meaningful path into DAW velocity.

### Tradeoffs

- Type 0 uses one track only.
- Continuous breath, pitch bend, vibrato and motion are not exported yet.
- Human timing is not automatically quantized.
- The current exporter does not write instrument/program-change metadata.

## Follow-up

1. Add optional quantized export modes without changing raw recording data.
2. Add continuous expression/control-change events after the expression-event contract exists.
3. Add pitch-bend events for motion/gesture pitch control.
4. Add a replay/import validation path for generated MIDI.
5. Add MusicXML export from score-oriented quantized timing rather than raw performance timing.
