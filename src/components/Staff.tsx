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

export function Staff({ target, played }: { target: OcarinaNote; played: OcarinaNote | null }) {
  const targetY = NOTE_Y[target.name] ?? 72
  const playedY = played ? NOTE_Y[played.name] ?? 72 : null

  return (
    <section className="staff-card">
      <div className="staff-copy">
        <span className="eyebrow">PENTAGRAMA / OBJETIVO</span>
        <strong>{target.name}</strong>
        <span>{target.controlLabel}</span>
      </div>

      <svg className="staff" viewBox="0 0 520 150" role="img" aria-label={`Toca ${target.name}`}>
        {[56, 72, 88, 104, 120].map((y) => (
          <line key={y} x1="40" x2="490" y1={y} y2={y} className="staff-line" />
        ))}

        {target.name === 'C4' && <line x1="220" x2="280" y1="104" y2="104" className="ledger-line" />}
        <ellipse cx="250" cy={targetY} rx="13" ry="9" className="target-note" transform={`rotate(-16 250 ${targetY})`} />
        <line x1="262" x2="262" y1={targetY} y2={targetY - 44} className="note-stem" />

        {playedY !== null && (
          <>
            <ellipse cx="380" cy={playedY} rx="11" ry="8" className="played-note" transform={`rotate(-16 380 ${playedY})`} />
            <line x1="391" x2="391" y1={playedY} y2={playedY - 38} className="played-stem" />
          </>
        )}

        <text x="220" y="142" className="staff-label">OBJETIVO</text>
        <text x="350" y="142" className="staff-label">TÚ</text>
      </svg>
    </section>
  )
}
