import { Canvas } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  MATERIAL_PRESETS,
  THEORY_LEVELS,
  type MaterialPreset,
  type OcarinaMaterial,
  type TheoryLevel,
} from './instrument'
import {
  holeMaskLabel,
  notePrimaryLabel,
  noteSecondaryLabel,
  resolveNote,
  type MusicalNote,
} from './music'

const HOLE_POSITIONS: [number, number, number][] = [
  [-0.72, 0.34, 0.78],
  [-0.24, 0.5, 0.88],
  [0.28, 0.48, 0.88],
  [0.76, 0.3, 0.76],
]

function OcarinaScene({
  holes,
  breath,
  material,
}: {
  holes: boolean[]
  breath: number
  material: MaterialPreset
}) {
  const airflowOpacity = 0.08 + breath * 0.5

  return (
    <Canvas camera={{ position: [0, 0.4, 6], fov: 42 }}>
      <ambientLight intensity={1.6} />
      <directionalLight position={[4, 5, 6]} intensity={3} />
      <pointLight position={[-4, -1, 3]} intensity={18} color="#20ff7a" />
      <group rotation={[-0.18, -0.18, 0.04]}>
        <mesh scale={[2.2, 1.25, 0.72]}>
          <sphereGeometry args={[1, 64, 32]} />
          <meshStandardMaterial
            color={material.bodyColor}
            metalness={material.metalness}
            roughness={material.roughness}
          />
        </mesh>
        <mesh position={[2.2, 0.08, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[0.55, 0.55, 1.4]}>
          <coneGeometry args={[0.55, 1.8, 32]} />
          <meshStandardMaterial
            color={material.mouthColor}
            metalness={material.metalness}
            roughness={material.roughness}
          />
        </mesh>

        {breath > 0.015 && (
          <mesh position={[1.55, 0.08, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.7 + breath * 0.5]}>
            <cylinderGeometry args={[0.08, 0.22, 2.4, 20]} />
            <meshStandardMaterial
              color="#70ffb0"
              emissive="#20ff7a"
              emissiveIntensity={1.5 + breath * 4}
              transparent
              opacity={airflowOpacity}
              roughness={0.1}
            />
          </mesh>
        )}

        {HOLE_POSITIONS.map((position, index) => (
          <mesh key={index} position={position} scale={holes[index] ? 0.82 : 1}>
            <sphereGeometry args={[0.24, 32, 16]} />
            <meshStandardMaterial
              color={holes[index] ? '#06110b' : '#50ffa0'}
              emissive={holes[index] ? '#000000' : '#0b6b38'}
              emissiveIntensity={holes[index] ? 0 : 1.4}
              roughness={0.38}
            />
          </mesh>
        ))}
      </group>
    </Canvas>
  )
}

function useGamepad() {
  const [buttons, setButtons] = useState<boolean[]>([false, false, false, false])
  const [breath, setBreath] = useState(0)
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    let frame = 0
    const poll = () => {
      const pads = navigator.getGamepads?.() ?? []
      const pad = Array.from(pads).find(Boolean)
      if (pad) {
        setName(pad.id)
        setButtons([0, 1, 2, 3].map((index) => Boolean(pad.buttons[index]?.pressed)))
        setBreath(pad.buttons[7]?.value ?? 0)
      } else {
        setName(null)
        setBreath(0)
      }
      frame = requestAnimationFrame(poll)
    }
    frame = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(frame)
  }, [])

  return { buttons, breath, name }
}

function useMicrophoneBreath() {
  const [breath, setBreath] = useState(0)
  const [status, setStatus] = useState<'off' | 'starting' | 'on' | 'error'>('off')
  const stopRef = useRef<() => void>(() => {})

  const start = useCallback(async () => {
    if (status === 'on' || status === 'starting') return
    setStatus('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
      const context = new AudioContext()
      const analyser = context.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.72
      const source = context.createMediaStreamSource(stream)
      source.connect(analyser)
      const data = new Float32Array(analyser.fftSize)
      let frame = 0

      const sample = () => {
        analyser.getFloatTimeDomainData(data)
        let sum = 0
        for (const value of data) sum += value * value
        const rms = Math.sqrt(sum / data.length)
        const normalized = Math.max(0, Math.min(1, (rms - 0.012) / 0.14))
        setBreath(normalized)
        frame = requestAnimationFrame(sample)
      }
      frame = requestAnimationFrame(sample)
      stopRef.current = () => {
        cancelAnimationFrame(frame)
        stream.getTracks().forEach((track) => track.stop())
        void context.close()
        setBreath(0)
        setStatus('off')
      }
      setStatus('on')
    } catch {
      setStatus('error')
    }
  }, [status])

  useEffect(() => () => stopRef.current(), [])
  return { breath, status, start, stop: () => stopRef.current() }
}

function useOcarinaAudio(note: MusicalNote | null, breath: number, material: MaterialPreset) {
  const contextRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const filterRef = useRef<BiquadFilterNode | null>(null)
  const [ready, setReady] = useState(false)

  const enable = useCallback(async () => {
    const context = contextRef.current ?? new AudioContext()
    contextRef.current = context
    await context.resume()
    setReady(true)
  }, [])

  useEffect(() => {
    const context = contextRef.current
    if (!context || !ready) return
    const active = Boolean(note && breath > 0.045)

    if (!active) {
      const gain = gainRef.current
      const osc = oscRef.current
      if (gain && osc) {
        const now = context.currentTime
        gain.gain.cancelScheduledValues(now)
        gain.gain.setTargetAtTime(0.0001, now, 0.025)
        osc.stop(now + 0.09)
        oscRef.current = null
        gainRef.current = null
        filterRef.current = null
      }
      return
    }

    if (!oscRef.current) {
      const osc = context.createOscillator()
      const gain = context.createGain()
      const filter = context.createBiquadFilter()
      filter.type = 'bandpass'
      filter.Q.value = 1.8
      gain.gain.value = 0.0001
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(context.destination)
      osc.start()
      oscRef.current = osc
      gainRef.current = gain
      filterRef.current = filter
    }

    const now = context.currentTime
    const osc = oscRef.current!
    const gain = gainRef.current!
    const filter = filterRef.current!
    osc.type = material.oscillator
    osc.frequency.setTargetAtTime(note!.frequency, now, 0.015)
    filter.frequency.setTargetAtTime(note!.frequency * material.filterMultiplier, now, 0.03)
    gain.gain.setTargetAtTime((0.025 + breath * 0.16) * material.gainMultiplier, now, 0.025)
  }, [note, breath, ready, material])

  useEffect(() => () => {
    try { oscRef.current?.stop() } catch { /* already stopped */ }
    void contextRef.current?.close()
  }, [])

  return { ready, enable }
}

function Staff({ note, level }: { note: MusicalNote | null; level: TheoryLevel }) {
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
  const [manualHoles, setManualHoles] = useState([true, true, true, true])
  const [spaceBreath, setSpaceBreath] = useState(0)
  const [theoryLevel, setTheoryLevel] = useState<TheoryLevel>('play')
  const [materialId, setMaterialId] = useState<OcarinaMaterial>('ceramic')
  const gamepad = useGamepad()
  const mic = useMicrophoneBreath()
  const holes = gamepad.name ? gamepad.buttons : manualHoles
  const note = useMemo(() => resolveNote(holes), [holes])
  const breath = Math.max(mic.breath, gamepad.breath, spaceBreath)
  const material = MATERIAL_PRESETS[materialId]
  const audio = useOcarinaAudio(note, breath, material)

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        setSpaceBreath(0.82)
      }
      const index = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(event.code)
      if (index >= 0 && !event.repeat) {
        setManualHoles((current) => current.map((value, i) => i === index ? !value : value))
      }
    }
    const up = (event: KeyboardEvent) => {
      if (event.code === 'Space') setSpaceBreath(0)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
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
          <span className={mic.status === 'on' ? 'pill live' : 'pill'}>🎙️ Mic: {mic.status}</span>
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
          <div className="panel-title">Ocarina · {material.label}</div>
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
                className={closed ? 'hole-button closed' : 'hole-button'}
                disabled={Boolean(gamepad.name)}
                onClick={() => setManualHoles((current) => current.map((value, i) => i === index ? !value : value))}
              >
                {index + 1}<small>{closed ? 'cerrado' : 'abierto'}</small>
              </button>
            ))}
          </div>
          <p className="hint">Teclado: 1–4 alternan agujeros · ESPACIO sopla · Gamepad A/B/X/Y + RT.</p>
          <div className="actions">
            <button className="primary" onClick={audio.enable}>{audio.ready ? 'Audio activo ✓' : 'Activar audio'}</button>
            {mic.status !== 'on'
              ? <button onClick={mic.start}>{mic.status === 'starting' ? 'Abriendo mic…' : 'Activar soplido real'}</button>
              : <button onClick={mic.stop}>Apagar mic</button>}
          </div>
          {mic.status === 'error' && <p className="error">No se pudo abrir el micrófono. Revisa permisos HTTPS/navegador.</p>}
        </article>
      </section>

      <footer>
        MVP 0.2: input físico → digitación → nota → audio → feedback 3D → lenguaje musical por nivel.
      </footer>
    </main>
  )
}
