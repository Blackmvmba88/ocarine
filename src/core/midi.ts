import type { PerformanceNoteEvent } from './performance'

const PPQ = 480

type MidiTimedEvent = {
  tick: number
  order: number
  bytes: number[]
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function variableLength(value: number): number[] {
  let buffer = Math.max(0, Math.floor(value)) & 0x7f
  const bytes: number[] = []

  while ((value = Math.floor(value / 128)) > 0) {
    buffer <<= 8
    buffer |= (value & 0x7f) | 0x80
  }

  while (true) {
    bytes.push(buffer & 0xff)
    if (buffer & 0x80) buffer >>= 8
    else break
  }

  return bytes
}

function uint16(value: number): number[] {
  return [(value >>> 8) & 0xff, value & 0xff]
}

function uint32(value: number): number[] {
  return [
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ]
}

function ascii(value: string): number[] {
  return Array.from(value).map((character) => character.charCodeAt(0))
}

function tempoBytes(bpm: number): number[] {
  const microsPerQuarter = clamp(Math.round(60_000_000 / Math.max(1, bpm)), 1, 0xffffff)
  return [
    0xff,
    0x51,
    0x03,
    (microsPerQuarter >>> 16) & 0xff,
    (microsPerQuarter >>> 8) & 0xff,
    microsPerQuarter & 0xff,
  ]
}

function timeSignatureBytes(beatsPerMeasure: number, beatUnit: number): number[] {
  const denominatorPower = Math.max(0, Math.round(Math.log2(Math.max(1, beatUnit))))
  return [0xff, 0x58, 0x04, clamp(beatsPerMeasure, 1, 255), denominatorPower, 24, 8]
}

function velocityFor(event: PerformanceNoteEvent): number {
  if (event.breathPeak <= 0) return 96
  return clamp(Math.round(45 + event.breathPeak * 82), 1, 127)
}

export function encodePerformanceMidi(
  events: PerformanceNoteEvent[],
  bpm: number,
  beatsPerMeasure: number,
  beatUnit: number,
): Uint8Array {
  const timedEvents: MidiTimedEvent[] = [
    { tick: 0, order: -2, bytes: tempoBytes(bpm) },
    { tick: 0, order: -1, bytes: timeSignatureBytes(beatsPerMeasure, beatUnit) },
  ]

  for (const event of events) {
    const startBeats = (event.startedAtMs / 60000) * bpm
    const durationBeats = Math.max(1 / PPQ, (event.durationMs / 60000) * bpm)
    const startTick = Math.max(0, Math.round(startBeats * PPQ))
    const endTick = Math.max(startTick + 1, Math.round((startBeats + durationBeats) * PPQ))
    const midiNote = clamp(Math.round(event.midi), 0, 127)
    const velocity = velocityFor(event)

    timedEvents.push(
      { tick: startTick, order: 1, bytes: [0x90, midiNote, velocity] },
      { tick: endTick, order: 0, bytes: [0x80, midiNote, 0] },
    )
  }

  timedEvents.sort((left, right) => left.tick - right.tick || left.order - right.order)

  const track: number[] = []
  let previousTick = 0

  for (const event of timedEvents) {
    const delta = Math.max(0, event.tick - previousTick)
    track.push(...variableLength(delta), ...event.bytes)
    previousTick = event.tick
  }

  track.push(0x00, 0xff, 0x2f, 0x00)

  const header = [
    ...ascii('MThd'),
    ...uint32(6),
    ...uint16(0),
    ...uint16(1),
    ...uint16(PPQ),
  ]
  const trackChunk = [...ascii('MTrk'), ...uint32(track.length), ...track]

  return new Uint8Array([...header, ...trackChunk])
}
