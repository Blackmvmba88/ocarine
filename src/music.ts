export type MusicalNote = {
  name: string
  midi: number
  frequency: number
  staffStep: number
}

const NOTE_BY_MASK: Record<number, Omit<MusicalNote, 'frequency'>> = {
  0b1111: { name: 'C5', midi: 72, staffStep: 0 },
  0b1110: { name: 'D5', midi: 74, staffStep: 1 },
  0b1100: { name: 'E5', midi: 76, staffStep: 2 },
  0b1000: { name: 'F5', midi: 77, staffStep: 3 },
  0b0000: { name: 'G5', midi: 79, staffStep: 4 },
}

export function resolveNote(holes: boolean[]): MusicalNote | null {
  const mask = holes.reduce((value, closed, index) => {
    if (!closed) return value
    return value | (1 << (3 - index))
  }, 0)
  const note = NOTE_BY_MASK[mask]
  if (!note) return null
  return {
    ...note,
    frequency: 440 * 2 ** ((note.midi - 69) / 12),
  }
}

export function holeMaskLabel(holes: boolean[]) {
  return holes.map((closed) => (closed ? '●' : '○')).join(' ')
}
