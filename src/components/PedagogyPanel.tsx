import type { OcarinaNote } from '../core/notes'
import {
  THEORY_LEVELS,
  fingeringGlyph,
  primaryNoteLabel,
  secondaryNoteLabel,
  solfegeForNote,
  type TheoryLevel,
} from '../core/pedagogy'
import '../pedagogy.css'

type Props = {
  level: TheoryLevel
  onLevelChange: (level: TheoryLevel) => void
  currentNote: OcarinaNote | null
  targetNote: OcarinaNote
  sequence: OcarinaNote[]
  activeIndex: number
  controlLabel: string
}

export function PedagogyPanel({
  level,
  onLevelChange,
  currentNote,
  targetNote,
  sequence,
  activeIndex,
  controlLabel,
}: Props) {
  return (
    <section className="pedagogy-panel">
      <div className="pedagogy-head">
        <div>
          <span className="pedagogy-kicker">LENGUAJE MUSICAL</span>
          <strong>{THEORY_LEVELS.find((item) => item.id === level)?.description}</strong>
        </div>
        <div className="pedagogy-levels">
          {THEORY_LEVELS.map((item) => (
            <button
              key={item.id}
              className={item.id === level ? 'active' : ''}
              onClick={() => onLevelChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pedagogy-main">
        <div className="pedagogy-current">
          <span>NOTA ACTUAL</span>
          <strong>{primaryNoteLabel(currentNote, level)}</strong>
          <small>{secondaryNoteLabel(currentNote, level)}</small>
        </div>

        <div className="pedagogy-target">
          <span>OBJETIVO</span>
          <strong>{level === 'musician' ? targetNote.name : solfegeForNote(targetNote)}</strong>
          <small>{controlLabel} · {fingeringGlyph(targetNote.holes)}</small>
        </div>
      </div>

      {level !== 'musician' ? (
        <div className="pedagogy-sequence" aria-label="Secuencia de práctica">
          {sequence.map((note, index) => (
            <span key={`${note.name}-${index}`} className={index === activeIndex ? 'active' : ''}>
              {level === 'play' ? solfegeForNote(note) : `${solfegeForNote(note)}${note.name.slice(-1)}`}
            </span>
          ))}
        </div>
      ) : (
        <div className="pedagogy-musician-note">Pentagrama completo activo abajo.</div>
      )}
    </section>
  )
}
