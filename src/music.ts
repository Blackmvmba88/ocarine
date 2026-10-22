import { DEFAULT_INSTRUMENT_PROFILE } from './core/instrumentProfiles'
import type { TheoryLevel } from './instrument'

export type MusicalNote = {
  name: string
  midi: number
  frequency: number
  staffStep: number
  solfege: string
}

export function resolveNote(holes: boolean[]): MusicalNote | null {
  const notes = DEFAULT_INSTRUMENT_PROFILE.notes
  const index = notes.findIndex((note) => note.holes.length === holes.length
    && note.holes.every((closed, hole) => closed === holes[hole]))
  if (index < 0) return null
  return { ...notes[index], staffStep: index, solfege: ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'][index] }
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
