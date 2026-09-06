import { useState } from 'react'
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

const DIATONIC_STEP: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
}

function staffY(noteName: string) {
  const match = /^([A-G])(?:#|b)?(-?\d+)$/.exec(noteName)
  if (!match) return 72
  const octave = Number(match[2])
  const step = (octave - 4) * 7 + DIATONIC_STEP[match[1]]
  return 104 - step * 8
}

function shortControlLabel(label: string) {
  return label.replace('D-Pad ', '')
}

export function Staff({
  sequence,
  durations,
  activeIndex,
  played,
  title,
  bpm,
  beatsPerMeasure,
  beatUnit,
  tempoBeat,
  controlLabelFor,
}: {
  sequence: OcarinaNote[]
  durations: number[]
  activeIndex: number
  played: OcarinaNote | null
  title: string
  bpm: number
  beatsPerMeasure: number
  beatUnit: number
  tempoBeat: number | null
  controlLabelFor: (noteName: string) => string
}) {
  const [level, setLevel] = useState<TheoryLevel>('play')
  const active = sequence[activeIndex] ?? sequence[0]
  const usableWidth = 600
  const startX = 70
  const totalBeats = Math.max(1, durations.reduce((sum, beats) => sum + beats, 0))
  const starts = durations.map((_, index) => durations.slice(0, index).reduce((sum, beats) => sum + beats, 0))
  const xForBeat = (beat: number) => startX + (Math.min(totalBeats, Math.max(0, beat)) / totalBeats) * usableWidth
  const activeStart = starts[activeIndex] ?? 0
  const activeDuration = durations[activeIndex] ?? 1
  const activeX = xForBeat(activeStart + activeDuration / 2)
  const tempoX = tempoBeat === null ? null : xForBeat(tempoBeat)
  const measureCount = Math.ceil(totalBeats / beatsPerMeasure)
  const measureBeats = Array.from({ length: measureCount + 1 }, (_, index) => index * beatsPerMeasure)
    .filter((beat) => beat <= totalBeats)

  return (
    <section className="staff-card sequence-mode">
      <div className="pedagogy-head">
        <div className="staff-copy">
          <span className="eyebrow">LENGUAJE MUSICAL / EJERCICIO</span>
          <strong>{primaryNoteLabel(active ?? null, level)}</strong>
          <span>{title} · {bpm} BPM · {beatsPerMeasure}/{beatUnit} · {active ? controlLabelFor(active.name) : 'Sin objetivo'}</span>
          <small>{played ? `Tú: ${primaryNoteLabel(played, level)}` : 'Esperando ejecución…'}</small>
        </div>

        <div className="pedagogy-levels" aria-label="Nivel de lenguaje musical">
          {THEORY_LEVELS.map((item) => (
            <button
              type="button"
              key={item.id}
              className={item.id === level ? 'active' : ''}
              onClick={() => setLevel(item.id)}
              title={item.description}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {level !== 'musician' ? (
        <div className="pedagogy-stage">
          <div className="pedagogy-main">
            <div className="pedagogy-current">
              <span>OBJETIVO</span>
              <strong>{primaryNoteLabel(active ?? null, level)}</strong>
              <small>{active ? secondaryNoteLabel(active, level) : 'Sin objetivo'}</small>
            </div>
            <div className="pedagogy-target">
              <span>DIGITACIÓN / CONTROL</span>
              <strong className="fingering-big">{active ? fingeringGlyph(active.holes) : '—'}</strong>
              <small>{active ? controlLabelFor(active.name) : 'Sin objetivo'}</small>
            </div>
          </div>

          <div className="pedagogy-sequence" aria-label="Secuencia de práctica">
            {sequence.map((note, index) => (
              <span key={`${note.name}-${index}`} className={index === activeIndex ? 'active' : index < activeIndex ? 'complete' : ''}>
                {level === 'play' ? solfegeForNote(note) : `${solfegeForNote(note)}${note.name.slice(-1)}`}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <svg className="staff practice-staff" viewBox="0 -12 740 182" role="img" aria-label={`Ejercicio ${title}`}>
          {[56, 72, 88, 104, 120].map((y) => (
            <line key={y} x1="34" x2="706" y1={y} y2={y} className="staff-line" />
          ))}

          {measureBeats.map((beat, index) => {
            const x = xForBeat(beat)
            return (
              <g key={`measure-${beat}`}>
                <line x1={x} x2={x} y1="50" y2="122" className="measure-line" />
                {index < measureCount ? <text x={x + 5} y="45" className="measure-label">M{index + 1}</text> : null}
              </g>
            )
          })}

          <line x1={activeX} x2={activeX} y1="-6" y2="132" className="playhead-line" />
          {tempoX !== null ? <line x1={tempoX} x2={tempoX} y1="-8" y2="135" className="tempo-cursor-line" /> : null}

          {sequence.map((note, index) => {
            const beats = durations[index] ?? 1
            const noteStart = starts[index] ?? 0
            const noteEnd = noteStart + beats
            const x = xForBeat(noteStart + beats / 2)
            const y = staffY(note.name)
            const state = index === activeIndex ? 'active' : index < activeIndex ? 'complete' : 'pending'
            const durationClass = beats >= 2 ? 'long' : 'short'

            return (
              <g key={`${note.name}-${index}`} className={`sequence-note ${state} ${durationClass}`}>
                {y < 56 ? [48, 40, 32, 24, 16, 8, 0].filter((ledgerY) => ledgerY >= y && ledgerY % 16 === 0).map((ledgerY) => (
                  <line key={ledgerY} x1={x - 18} x2={x + 18} y1={ledgerY} y2={ledgerY} className="ledger-line" />
                )) : null}
                <line x1={xForBeat(noteStart) + 4} x2={xForBeat(noteEnd) - 4} y1="133" y2="133" className="duration-rail" />
                <ellipse cx={x} cy={y} rx="11" ry="8" transform={`rotate(-16 ${x} ${y})`} />
                <line x1={x + 10} x2={x + 10} y1={y} y2={y - 36} className="sequence-stem" />
                <text x={x} y="145" textAnchor="middle" className="sequence-control">{shortControlLabel(controlLabelFor(note.name))}</text>
                <text x={x} y="160" textAnchor="middle" className="sequence-name">{note.name} · {beats}b</text>
              </g>
            )
          })}
        </svg>
      )}
    </section>
  )
}
