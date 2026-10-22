import { useEffect, useMemo, useState } from 'react'
import { MATERIAL_PRESETS, THEORY_LEVELS, type OcarinaMaterial, type TheoryLevel } from './instrument'
import { holeMaskLabel, notePrimaryLabel, noteSecondaryLabel, resolveNote } from './music'
import { OcarinaScene } from './components/OcarinaScene'
import { Staff } from './components/Staff'
import { ArcadePanel } from './components/ArcadePanel'
import { useGamepad } from './hooks/useGamepad'
import { useBreathInput } from './hooks/useBreathInput'
import { useOcarinaAudio } from './hooks/useOcarinaAudio'
import { DEFAULT_INSTRUMENT_PROFILE } from './core/instrumentProfiles'

function TheorySwitcher({ level, onChange }: { level: TheoryLevel; onChange: (level: TheoryLevel) => void }) {
  return (
    <div className="segmented" aria-label="Nivel musical">
      {THEORY_LEVELS.map((item) => (
        <button
          key={item.id}
          className={level === item.id ? 'active' : ''}
          onClick={() => onChange(item.id)}
          title={item.description}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export default function App() {
  const [manualHoles, setManualHoles] = useState([true, true, true, true, true, true])
  const [spaceBreath, setSpaceBreath] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [automaticBreath, setAutomaticBreath] = useState(true)
  const [theoryLevel, setTheoryLevel] = useState<TheoryLevel>('play')
  const [materialId, setMaterialId] = useState<OcarinaMaterial>('ceramic')
  const gamepad = useGamepad()
  const mic = useBreathInput()
  const holes = gamepad.name ? gamepad.buttons : manualHoles
  const note = useMemo(() => resolveNote(holes), [holes])
  const controllerBreath = gamepad.breath > 0.045 ? gamepad.breath
    : automaticBreath && gamepad.name && gamepad.buttons.some(Boolean) ? 0.75 : 0
  const breath = Math.max(mic.level, controllerBreath, spaceBreath, playing ? 0.82 : 0)
  const material = MATERIAL_PRESETS[materialId]
  const audio = useOcarinaAudio(note, breath, material)

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.closest('button, input, textarea, select, [contenteditable]')) return
      if (event.code === 'Space') {
        event.preventDefault()
        setSpaceBreath(0.82)
      }
      const index = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].indexOf(event.code)
      if (index >= 0 && !event.repeat) {
        setManualHoles((current) => current.map((value, i) => i === index ? !value : value))
      }
    }
    const up = (event: KeyboardEvent) => {
      if (event.code === 'Space') setSpaceBreath(0)
    }
    const release = () => { setSpaceBreath(0); setPlaying(false) }
    const visibility = () => { if (document.hidden) release() }
    window.addEventListener('blur', release)
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('blur', release)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">BLACKMAMBA LAB · MVP 0.2</p>
          <h1>Ocarina 3D</h1>
          <p className="subtitle">El mismo instrumento habla como juego, como tutor y como herramienta musical.</p>
        </div>
        <div className="status-row">
          <span className={gamepad.name ? 'pill live' : 'pill'}>{gamepad.name ? '🎮 Gamepad conectado' : '🎮 Sin gamepad'}</span>
          <span className={mic.enabled ? 'pill live' : 'pill'}>🎙️ Mic: {mic.calibrating ? 'calibrando' : mic.enabled ? 'activo' : 'apagado'}</span>
          <span className={breath > 0.045 ? 'pill live' : 'pill'}>🫁 Flujo {Math.round(breath * 100)}%</span>
        </div>
      </header>

      <section className="level-bar panel-lite">
        <div>
          <span className="mini-label">Lenguaje musical</span>
          <TheorySwitcher level={theoryLevel} onChange={setTheoryLevel} />
        </div>
        <div className="level-explanation">
          {THEORY_LEVELS.find((item) => item.id === theoryLevel)?.description}
        </div>
      </section>

      <ArcadePanel note={note?.name ?? null} sounding={audio.ready && breath > 0.045} />

      <section className="dashboard">
        <article className="panel score-panel">
          <div className="panel-title">{theoryLevel === 'play' ? 'Aprende jugando' : 'Lectura musical'}</div>
          <Staff note={note} level={theoryLevel} />
          <div className="note-readout">
            <strong>{notePrimaryLabel(note, theoryLevel)}</strong>
            <span>{noteSecondaryLabel(note, theoryLevel)}</span>
          </div>
          <div className="fingering-readout">
            <span>Digitación</span>
            <strong>{holeMaskLabel(holes)}</strong>
          </div>
        </article>

        <article className="panel model-panel">
          <div className="panel-title">BM-OC-002 · {material.label}</div>
          <div className="canvas-wrap"><OcarinaScene holes={holes} breath={breath} material={material} /></div>
          <div className="holes-label">{holeMaskLabel(holes)}</div>
          <div className="flow-note">Flujo verde = visualización conceptual · CFD vendrá después</div>
        </article>

        <article className="panel controls-panel">
          <div className="panel-title">Control vivo</div>
          <div className="breath-meter"><span style={{ width: `${breath * 100}%` }} /></div>
          <div className="metric"><span>Breath</span><strong>{Math.round(breath * 100)}%</strong></div>

          <span className="mini-label">Material / timbre provisional</span>
          <div className="material-grid">
            {(Object.keys(MATERIAL_PRESETS) as OcarinaMaterial[]).map((id) => (
              <button
                key={id}
                className={materialId === id ? 'material-button active' : 'material-button'}
                onClick={() => setMaterialId(id)}
              >
                {MATERIAL_PRESETS[id].label}
              </button>
            ))}
          </div>

          <span className="mini-label holes-title">Agujeros</span>
          <div className="hole-buttons">
            {manualHoles.map((closed, index) => (
              <button
                key={index}
                className={holes[index] ? 'hole-button closed' : 'hole-button'}
                disabled={Boolean(gamepad.name)}
                onClick={() => setManualHoles((current) => current.map((value, i) => i === index ? !value : value))}
              >
                {index + 1}<small>{holes[index] ? 'cerrado' : 'abierto'}</small>
              </button>
            ))}
          </div>
          {gamepad.name && <>
            <p className="hint">Control: {gamepad.name}</p>
            <label className="hint"><input type="checkbox" checked={automaticBreath} onChange={(event) => setAutomaticBreath(event.target.checked)} /> Soplido automático al pulsar botones</label>
            {!audio.ready && <p role="status" className="hint">Pulsa Activar audio una vez para tocar con el control.</p>}
            <p className="hint">Para empezar: mantén A/B/X/Y/LB/RB para DO; suelta A, luego B, X, Y y LB para RE–LA. RT permite soplar con todos sueltos para SI. Las otras combinaciones quedan en silencio.</p>
          </>}
          <p className="hint">Teclado: 1–6 alternan H1–H6 · ESPACIO sopla · Gamepad A/B/X/Y/LB/RB + RT.</p>
          <div className="actions">
            <button className="primary" aria-pressed={playing} disabled={!note && !playing} onClick={async () => {
              if (playing) { setPlaying(false); return }
              if (await audio.enable()) setPlaying(true)
            }}>{playing ? 'Detener ■' : 'Tocar nota ▶'}</button>
            <button className="primary" onClick={audio.enable}>{audio.ready ? 'Audio activo ✓' : 'Activar audio'}</button>
            {!mic.enabled
              ? <button disabled={!mic.supported || mic.starting} onClick={mic.start}>{mic.starting ? 'Abriendo mic…' : 'Activar soplido real'}</button>
              : <button onClick={mic.stop}>Apagar mic</button>}
          </div>
          <p className="hint">Pulsa Tocar nota para escucharla y cambia los agujeros mientras suena. Detener silencia el soplido del botón; si usas micrófono, apágalo para silenciarlo también.</p>
          {audio.error && <p role="alert" className="error">{audio.error}</p>}
          {mic.calibrating && <p role="status" className="hint">Guarda silencio un momento: estamos midiendo el ruido ambiente.</p>}
          {mic.enabled && !mic.calibrating && <p className="hint">Micrófono calibrado · ruido ambiente {Math.round(mic.noiseFloor * 100)}%. Apágalo y actívalo para recalibrar.</p>}
          {!mic.supported && <p className="hint">El micrófono requiere un navegador compatible en HTTPS o localhost.</p>}
          {mic.error && <p role="alert" className="error">{mic.error}</p>}
        </article>
      </section>

      <footer>
        {DEFAULT_INSTRUMENT_PROFILE.name} · perfil prototipo pendiente de afinación física. H1–H6 → C5–B5 → audio → GLB/fallback 3D → lenguaje musical por nivel.
      </footer>
    </main>
  )
}
