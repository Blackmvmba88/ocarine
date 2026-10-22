import { useEffect, useRef, useState } from 'react'
import { ARCADE_MELODY, initialArcadeState, judgeArcadeNote, startArcade } from '../core/arcade'

export function ArcadePanel({ note, sounding }: { note: string | null; sounding: boolean }) {
  const [game, setGame] = useState(initialArcadeState)
  const lastAttack = useRef<string | null>(null)

  useEffect(() => {
    if (!sounding || !note) {
      lastAttack.current = null
      return
    }
    // One judgement per distinct sounding note; a breath release rearms repeats.
    if (lastAttack.current === note) return
    lastAttack.current = note
    setGame((current) => judgeArcadeNote(current, note))
  }, [note, sounding])

  const target = ARCADE_MELODY[game.step]
  const progress = Math.round((game.step / ARCADE_MELODY.length) * 100)

  useEffect(() => {
    const root = window as Window & { render_game_to_text?: () => string }
    const previous = root.render_game_to_text
    root.render_game_to_text = () => JSON.stringify({
      coordinateSystem: 'note lane left-to-right, first note at index 0',
      mode: game.mode,
      target: target ?? null,
      index: game.step,
      total: ARCADE_MELODY.length,
      heardNote: note,
      sounding,
      score: game.score,
      combo: game.combo,
      hits: game.hits,
      misses: game.misses,
    })
    return () => { root.render_game_to_text = previous }
  }, [game, target, note, sounding])

  return (
    <section className="arcade-panel" aria-label="Modo Arcade">
      <div className="arcade-header">
        <div>
          <span className="arcade-kicker">BLACKMAMBA ARCADE · STAGE 01</span>
          <h2>FIRST FLIGHT <span className="arcade-star">✦</span></h2>
        </div>
        <div className="arcade-stats">
          <span>SCORE <strong>{game.score.toLocaleString()}</strong></span>
          <span>COMBO <strong>×{game.combo}</strong></span>
          <span>HITS <strong>{game.hits}/{ARCADE_MELODY.length}</strong></span>
        </div>
      </div>
      <div className="arcade-lane" role="progressbar" aria-valuemin={0} aria-valuemax={ARCADE_MELODY.length} aria-valuenow={game.step} aria-label="Progreso de melodía">
        {ARCADE_MELODY.map((name, index) => (
          <div key={index} className={`arcade-tile ${index < game.step ? 'cleared' : ''} ${index === game.step && game.mode === 'playing' ? 'target' : ''}`}>
            <span className="arcade-index">{String(index + 1).padStart(2, '0')}</span>
            <strong>{name}</strong>
            <span className="arcade-glyph">{index < game.step ? '✓' : index === game.step ? '◆' : '◇'}</span>
          </div>
        ))}
      </div>
      <div className="arcade-bottom">
        <div className="arcade-message" aria-live="polite">
          {game.mode === 'ready' ? 'Prepara la ocarina. Siete notas, una misión.' :
            game.mode === 'complete' ? `¡MISIÓN COMPLETA! Mejor combo ×${game.bestCombo} · Fallos ${game.misses}` :
            game.feedback === 'wrong' ? `Nota incorrecta · objetivo ${target}` :
            `SIGUIENTE NOTA: ${target} · Sopla y cambia la digitación`}
        </div>
        <div className="arcade-actions">
          <span className="arcade-progress">{progress}%</span>
          <button className="arcade-start" onClick={() => { lastAttack.current = null; setGame(startArcade()) }}>
            {game.mode === 'playing' ? 'REINICIAR' : game.mode === 'complete' ? 'JUGAR OTRA VEZ' : 'INICIAR MISIÓN'}
          </button>
        </div>
      </div>
    </section>
  )
}
