import type { OcarinaNote } from '../core/notes'

const NOTE_Y: Record<string, number> = {
  C4: 104,
  D4: 96,
  E4: 88,
  F4: 80,
  G4: 72,
  A4: 64,
  B4: 56,
  C5: 48,
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
      <div className="staff-copy">
        <span className="eyebrow">PENTAGRAMA / EJERCICIO</span>
        <strong>{active?.name ?? '—'}</strong>
        <span>{title} · {bpm} BPM · {beatsPerMeasure}/{beatUnit} · {active ? controlLabelFor(active.name) : 'Sin objetivo'}</span>
        <small>{played ? `Tú: ${played.name}` : 'Esperando ejecución…'}</small>
      </div>

      <svg className="staff practice-staff" viewBox="0 0 740 170" role="img" aria-label={`Ejercicio ${title}`}>
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

        <line x1={activeX} x2={activeX} y1="28" y2="132" className="playhead-line" />
        {tempoX !== null ? <line x1={tempoX} x2={tempoX} y1="22" y2="135" className="tempo-cursor-line" /> : null}

        {sequence.map((note, index) => {
          const beats = durations[index] ?? 1
          const noteStart = starts[index] ?? 0
          const noteEnd = noteStart + beats
          const x = xForBeat(noteStart + beats / 2)
          const y = NOTE_Y[note.name] ?? 72
          const state = index === activeIndex ? 'active' : index < activeIndex ? 'complete' : 'pending'
          const durationClass = beats >= 2 ? 'long' : 'short'

          return (
            <g key={`${note.name}-${index}`} className={`sequence-note ${state} ${durationClass}`}>
              {note.name === 'C4' && <line x1={x - 20} x2={x + 20} y1="104" y2="104" className="ledger-line" />}
              <line x1={xForBeat(noteStart) + 4} x2={xForBeat(noteEnd) - 4} y1="133" y2="133" className="duration-rail" />
              <ellipse cx={x} cy={y} rx="11" ry="8" transform={`rotate(-16 ${x} ${y})`} />
              <line x1={x + 10} x2={x + 10} y1={y} y2={y - 36} className="sequence-stem" />
              <text x={x} y="145" textAnchor="middle" className="sequence-control">{shortControlLabel(controlLabelFor(note.name))}</text>
              <text x={x} y="160" textAnchor="middle" className="sequence-name">{note.name} · {beats}b</text>
            </g>
          )
        })}
      </svg>
    </section>
  )
}
