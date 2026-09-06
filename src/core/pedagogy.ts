import type { OcarinaNote } from './notes'

export type TheoryLevel = 'play' | 'names' | 'musician'

export const THEORY_LEVELS: { id: TheoryLevel; label: string; description: string }[] = [
  { id: 'play', label: 'Juego', description: 'DO · RE · MI' },
  { id: 'names', label: 'Nomenclatura', description: 'DO5 · C5 · MIDI · Hz' },
  { id: 'musician', label: 'Músico', description: 'Pentagrama · ritmo · compás' },
]

const SOLFEGE: Record<string, string> = {
  C: 'DO', D: 'RE', E: 'MI', F: 'FA', G: 'SOL', A: 'LA', B: 'SI',
}

export function solfegeForNote(note: OcarinaNote | null): string {
  if (!note) return '—'
  return SOLFEGE[note.name.charAt(0)] ?? note.name
}

export function primaryNoteLabel(note: OcarinaNote | null, level: TheoryLevel): string {
  if (!note) return '—'
  if (level === 'play') return solfegeForNote(note)
  if (level === 'names') return `${solfegeForNote(note)}${note.name.slice(-1)}`
  return note.name
}

export function secondaryNoteLabel(note: OcarinaNote | null, level: TheoryLevel): string {
  if (!note) return 'Sin entrada'
  if (level === 'play') return 'Escucha · sopla · memoriza'
  if (level === 'names') return `${note.name} · MIDI ${note.midi} · ${note.frequency.toFixed(2)} Hz`
  return `${solfegeForNote(note)} · MIDI ${note.midi} · ${note.frequency.toFixed(2)} Hz`
}

export function fingeringGlyph(holes: boolean[]): string {
  return holes.map((closed) => (closed ? '●' : '○')).join(' ')
}
