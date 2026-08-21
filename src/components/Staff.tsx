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
  activeIndex,
  played,
  title,
  bpm,
  controlLabelFor,
}: {
  sequence: OcarinaNote[]
  activeIndex: number
  played: OcarinaNote | null
  title: string
  bpm: number
  controlLabelFor: (noteName: string) => string
}) {
  const active = sequence[activeIndex] ?? sequence[0]
  const usableWidth = 600
  const startX = 70
  const spacing = sequence.length > 1 ? usableWidth / (sequence.length - 1) : 0
  const activeX = startX + activeIndex * spacing

  return (
    <section className="staff-card sequence-mode">
      <div className="staff-copy">
        <span className="eyebrow">PENTAGRAMA / EJERCICIO</span>
        <strong>{active?.name ?? '—'}</strong>
        <span>{title} · {bpm} BPM · {active ? controlLabelFor(active.name) : 'Sin objetivo'}</span>
        <small>{played ? `Tú: ${played.name}` : 'Esperando ejecución…'}</small>
      </div>

      <svg className="staff practice-staff" viewBox="0 0 740 170" role="img" aria-label={`Ejercicio ${title}`}>
        {[56, 72, 88, 104, 120].map((y) => (
          <line key={y} x1="34" x2="706" y1={y} y2={y} className="staff-line" />
        ))}

        <line x1={activeX} x2={activeX} y1="28" y2="132" className="playhead-line" />

        {sequence.map((note, index) => {
          const x = startX + index * spacing
          const y = NOTE_Y[note.name] ?? 72
          const state = index === activeIndex ? 'active' : index < activeIndex ? 'complete' : 'pending'

          return (
            <g key={`${note.name}-${index}`} className={`sequence-note ${state}`}>
              {note.name === 'C4' && <line x1={x - 20} x2={x + 20} y1="104" y2="104" className="ledger-line" />}
              <ellipse cx={x} cy={y} rx="11" ry="8" transform={`rotate(-16 ${x} ${y})`} />
              <line x1={x + 10} x2={x + 10} y1={y} y2={y - 36} className="sequence-stem" />
              <text x={x} y="145" textAnchor="middle" className="sequence-control">{shortControlLabel(controlLabelFor(note.name))}</text>
              <text x={x} y="160" textAnchor="middle" className="sequence-name">{note.name}</text>
            </g>
          )
        })}
      </svg>
    </section>
  )
}
