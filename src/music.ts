import type { TheoryLevel } from './instrument'

export type MusicalNote = {
  name: string
  midi: number
  frequency: number
  staffStep: number
  solfege: string
}

const NOTE_BY_MASK: Record<number, Omit<MusicalNote, 'frequency'>> = {
  0b1111: { name: 'C5', midi: 72, staffStep: 0, solfege: 'DO' },
  0b1110: { name: 'D5', midi: 74, staffStep: 1, solfege: 'RE' },
  0b1100: { name: 'E5', midi: 76, staffStep: 2, solfege: 'MI' },
  0b1000: { name: 'F5', midi: 77, staffStep: 3, solfege: 'FA' },
  0b0000: { name: 'G5', midi: 79, staffStep: 4, solfege: 'SOL' },
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

export function notePrimaryLabel(note: MusicalNote | null, level: TheoryLevel) {
  if (!note) return '—'
  if (level === 'play') return note.solfege
  if (level === 'names') return `${note.solfege}${note.name.slice(-1)}`
  return note.name
}

export function noteSecondaryLabel(note: MusicalNote | null, level: TheoryLevel) {
  if (!note) return 'digitación no mapeada'
  if (level === 'play') return 'Escucha · sopla · memoriza'
  if (level === 'names') return `${note.name} · MIDI ${note.midi} · ${note.frequency.toFixed(2)} Hz`
  return `${note.solfege} · MIDI ${note.midi} · ${note.frequency.toFixed(2)} Hz`
}
