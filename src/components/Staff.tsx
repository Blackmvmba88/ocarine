import type { MusicalNote } from '../music'
import type { TheoryLevel } from '../instrument'

export function Staff({ note, level }: { note: MusicalNote | null; level: TheoryLevel }) {
  const bottom = note ? 18 + note.staffStep * 7 : 18
  const simplified = level === 'play'

  return (
    <div className={`staff ${simplified ? 'staff-simplified' : ''}`} aria-label={note ? `Nota ${note.name}` : 'Sin nota'}>
      {!simplified && [0, 1, 2, 3, 4].map((line) => (
        <span className="staff-line" key={line} style={{ bottom: `${18 + line * 14}%` }} />
      ))}
      {note && <span className="staff-note" style={{ bottom: simplified ? '44%' : `${bottom}%` }} />}
    </div>
  )
}
