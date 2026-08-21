import { useEffect, useMemo, useRef, useState } from 'react'
import { OcarinaScene } from './components/OcarinaScene'
import { Staff } from './components/Staff'
import { OCARINA_NOTES, resolveNote } from './core/notes'
import { useGamepad } from './hooks/useGamepad'
import { useKeyboardButtons } from './hooks/useKeyboardButtons'
import './styles.css'

const KEYBOARD_LABELS: Record<number, string> = {
  0: 'Z',
  1: 'X',
  2: 'C',
  3: 'V',
  12: '↑',
  13: '↓',
  14: '←',
  15: '→',
}

export default function App() {
  const gamepad = useGamepad()
  const keyboardButtons = useKeyboardButtons()
  const pressedButtons = useMemo(
    () => [...new Set([...gamepad.pressedButtons, ...keyboardButtons])],
    [gamepad.pressedButtons, keyboardButtons],
  )
  const currentNote = resolveNote(pressedButtons)

  const [targetIndex, setTargetIndex] = useState(0)
  const [feedback, setFeedback] = useState('Toca la nota objetivo para comenzar.')
  const [audioEnabled, setAudioEnabled] = useState(false)
  const audioContext = useRef<AudioContext | null>(null)
  const target = OCARINA_NOTES[targetIndex]

  const enableAudio = async () => {
    if (!audioContext.current) audioContext.current = new AudioContext()
    await audioContext.current.resume()
    setAudioEnabled(true)
  }

  useEffect(() => {
    if (!audioEnabled || !audioContext.current || !currentNote) return

    const context = audioContext.current
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(currentNote.frequency, context.currentTime)
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.018)

    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()

    return () => {
      gain.gain.cancelScheduledValues(context.currentTime)
      gain.gain.setTargetAtTime(0.0001, context.currentTime, 0.025)
      oscillator.stop(context.currentTime + 0.12)
    }
  }, [audioEnabled, currentNote])

  useEffect(() => {
    if (!currentNote) {
      setFeedback('Esperando una nota…')
      return
    }

    if (currentNote.name !== target.name) {
      setFeedback(`Tocaste ${currentNote.name}. Busca ${target.name}.`)
      return
    }

    setFeedback(`✓ ${currentNote.name} correcta`)
    const timer = window.setTimeout(() => {
      setTargetIndex((index) => (index + 1) % OCARINA_NOTES.length)
      setFeedback('Siguiente nota…')
    }, 420)

    return () => window.clearTimeout(timer)
  }, [currentNote, target.name])

  const holes = currentNote?.holes ?? Array(6).fill(false)

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <span className="eyebrow">BLACKMAMBA INSTRUMENT LAB</span>
          <h1>OCARINA <span>3D</span></h1>
          <p>Control físico → digitación → nota → sonido → pentagrama.</p>
        </div>
        <button className={audioEnabled ? 'audio-button active' : 'audio-button'} onClick={enableAudio}>
          {audioEnabled ? 'Audio activo' : 'Activar audio'}
        </button>
      </header>

      <Staff target={target} played={currentNote} />

      <section className="workspace">
        <div className="scene-panel">
          <OcarinaScene holes={holes} />
          <div className="scene-caption">
            <span>Arrastra para rotar · rueda para zoom</span>
            <strong>{currentNote?.name ?? '—'}</strong>
          </div>
        </div>

        <aside className="telemetry">
          <div className="status-row">
            <span className={gamepad.connected ? 'status-dot connected' : 'status-dot'} />
            <div>
              <small>GAMEPAD</small>
              <strong>{gamepad.connected ? 'Conectado' : 'Esperando control'}</strong>
            </div>
          </div>

          <div className="readout">
            <span>NOTA ACTUAL</span>
            <strong>{currentNote?.name ?? '—'}</strong>
            <small>{currentNote ? `${currentNote.frequency.toFixed(2)} Hz` : 'Sin entrada'}</small>
          </div>

          <div className="feedback">{feedback}</div>

          <div className="holes" aria-label="Estado de agujeros">
            {holes.map((closed, index) => (
              <span key={index} className={closed ? 'hole closed' : 'hole'} title={`Agujero ${index + 1}`} />
            ))}
          </div>

          <small className="device-id">{gamepad.id}</small>
        </aside>
      </section>

      <section className="mapping-card">
        <div>
          <span className="eyebrow">MAPA DE EJECUCIÓN</span>
          <h2>Conecta el control y toca.</h2>
          <p>También puedes probar inmediatamente con Z X C V y las flechas del teclado.</p>
        </div>

        <div className="mapping-grid">
          {OCARINA_NOTES.map((note) => (
            <div className={currentNote?.name === note.name ? 'mapping active' : 'mapping'} key={note.name}>
              <strong>{note.name}</strong>
              <span>{note.controlLabel}</span>
              <kbd>{KEYBOARD_LABELS[note.button]}</kbd>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
