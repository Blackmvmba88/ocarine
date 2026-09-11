export type HoleState = [boolean, boolean, boolean, boolean]

export interface ResolvedNote {
  name: string
  midi: number
  frequency: number
  label: string
}

export interface PracticeTarget {
  note: ResolvedNote
  holes: HoleState
}

const NOTES: Record<number, ResolvedNote> = {
  60: { name: 'C4', midi: 60, frequency: 261.63, label: 'DO' },
  62: { name: 'D4', midi: 62, frequency: 293.66, label: 'RE' },
  64: { name: 'E4', midi: 64, frequency: 329.63, label: 'MI' },
  65: { name: 'F4', midi: 65, frequency: 349.23, label: 'FA' },
  67: { name: 'G4', midi: 67, frequency: 392.0, label: 'SOL' },
}

const PROGRESSIVE_FINGERINGS: Array<{ holes: HoleState; midi: number }> = [
  { holes: [true, true, true, true], midi: 60 },
  { holes: [true, true, true, false], midi: 62 },
  { holes: [true, true, false, false], midi: 64 },
  { holes: [true, false, false, false], midi: 65 },
  { holes: [false, false, false, false], midi: 67 },
]

export const PRACTICE_TARGETS: PracticeTarget[] = PROGRESSIVE_FINGERINGS.map((entry) => ({
  note: NOTES[entry.midi],
  holes: [...entry.holes] as HoleState,
}))

export function resolveNote(holes: HoleState): ResolvedNote {
  const exact = PROGRESSIVE_FINGERINGS.find((entry) =>
    entry.holes.every((closed, index) => closed === holes[index]),
  )

  if (exact) return NOTES[exact.midi]

  // MVP fallback: non-standard combinations resolve by number of closed holes.
  const closedCount = holes.filter(Boolean).length
  const midiByClosedCount = [67, 65, 64, 62, 60]
  return NOTES[midiByClosedCount[closedCount]]
}

export function holesToText(holes: HoleState) {
  return holes.map((closed) => (closed ? '●' : '○')).join(' ')
}
