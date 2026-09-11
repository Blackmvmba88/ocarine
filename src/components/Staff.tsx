import type { ResolvedNote } from '../music/fingerings'

function noteY(midi: number) {
  const baseMidi = 60
  const semitoneStep = 3.1
  return 86 - (midi - baseMidi) * semitoneStep
}

export function Staff({ note, active }: { note: ResolvedNote; active: boolean }) {
  const y = noteY(note.midi)

  return (
    <div className="staff-card" aria-label={`Current note ${note.name}`}>
      <svg viewBox="0 0 760 150" role="img">
        {[42, 58, 74, 90, 106].map((lineY) => (
          <line key={lineY} x1="38" y1={lineY} x2="722" y2={lineY} className="staff-line" />
        ))}
        <text x="58" y="101" className="clef">𝄞</text>
        <ellipse cx="390" cy={y} rx="16" ry="11" className={active ? 'note-head active' : 'note-head'} />
        <line x1="404" y1={y} x2="404" y2={y - 48} className={active ? 'note-stem active' : 'note-stem'} />
      </svg>
      <div className="staff-meta">
        <strong>{note.label}</strong>
        <span>{note.name}</span>
        <span>{note.frequency.toFixed(2)} Hz</span>
      </div>
    </div>
  )
}
