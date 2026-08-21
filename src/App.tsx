import { useEffect, useMemo, useRef, useState } from 'react'
import { OcarinaScene } from './components/OcarinaScene'
import { Staff } from './components/Staff'
import {
  CONTROL_PROFILES,
  DEFAULT_CONTROL_PROFILE,
  getBinding,
  resolveNoteFromControlProfile,
} from './core/controlProfiles'
import { FIRST_FLIGHT } from './core/exercises'
import { DEFAULT_INSTRUMENT_PROFILE } from './core/instrumentProfiles'
import type { OcarinaNote } from './core/notes'
import { useBreathInput } from './hooks/useBreathInput'
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
  const profile = DEFAULT_INSTRUMENT_PROFILE
  const exercise = FIRST_FLIGHT
  const gamepad = useGamepad()
  const keyboardButtons = useKeyboardButtons()
  const breath = useBreathInput()
  const [controlProfileId, setControlProfileId] = useState(DEFAULT_CONTROL_PROFILE.id)
  const controlProfile = CONTROL_PROFILES.find((candidate) => candidate.id === controlProfileId) ?? DEFAULT_CONTROL_PROFILE
  const pressedButtons = useMemo(
    () => [...new Set([...gamepad.pressedButtons, ...keyboardButtons])],
    [gamepad.pressedButtons, keyboardButtons],
  )
  const currentNote = resolveNoteFromControlProfile(pressedButtons, profile.notes, controlProfile)
  const sequence = useMemo(
    () => exercise.steps.reduce<OcarinaNote[]>((notes, step) => {
      const note = profile.notes.find((candidate) => candidate.name === step.note)
      if (note) notes.push(note)
      return notes
    }, []),
    [exercise.steps, profile.notes],
  )

  const [targetIndex, setTargetIndex] = useState(0)
  const [feedback, setFeedback] = useState('Toca la nota objetivo para comenzar.')
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [breathRequired, setBreathRequired] = useState(false)
  const [breathThreshold, setBreathThreshold] = useState(0.12)
  const audioContext = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const target = sequence[targetIndex] ?? profile.notes[0]
  const isBlowing = breath.enabled && breath.level >= breathThreshold
  const performedNote = currentNote && (!breathRequired || isBlowing) ? currentNote : null
  const controlLabelFor = (noteName: string) => getBinding(controlProfile, noteName)?.label ?? noteName

  const enableAudio = async () => {
    if (!audioContext.current) audioContext.current = new AudioContext()
    await audioContext.current.resume()
    setAudioEnabled(true)
  }

  const enableBreath = async () => {
    await enableAudio()
    await breath.start()
    setBreathRequired(true)
  }

  const disableBreath = () => {
    breath.stop()
    setBreathRequired(false)
  }

  useEffect(() => {
    if (!audioEnabled || !audioContext.current || !currentNote) return

    const context = audioContext.current
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(currentNote.frequency, context.currentTime)
    gain.gain.setValueAtTime(0.0001, context.currentTime)

    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    gainRef.current = gain

    return () => {
      gain.gain.cancelScheduledValues(context.currentTime)
      gain.gain.setTargetAtTime(0.0001, context.currentTime, 0.018)
      oscillator.stop(context.currentTime + 0.08)
      gainRef.current = null
    }
  }, [audioEnabled, currentNote])

  useEffect(() => {
    if (!audioEnabled || !audioContext.current || !gainRef.current || !currentNote) return

    const context = audioContext.current
    const targetGain = breathRequired
      ? isBlowing
        ? Math.min(0.34, 0.025 + breath.level * 0.3)
        : 0.0001
      : 0.18

    gainRef.current.gain.setTargetAtTime(targetGain, context.currentTime, 0.022)
  }, [audioEnabled, breath.level, breathRequired, currentNote, isBlowing])

  useEffect(() => {
    if (breathRequired && currentNote && !isBlowing) {
      setFeedback(`${currentNote.name} lista. Ahora sopla para hacerla sonar.`)
      return
    }

    if (!performedNote) {
      setFeedback('Esperando una nota…')
      return
    }

    if (performedNote.name !== target.name) {
      setFeedback(`Tocaste ${performedNote.name}. Busca ${target.name}.`)
      return
    }

    const phraseComplete = targetIndex === sequence.length - 1
    setFeedback(phraseComplete ? `✓ ${performedNote.name} · frase completa` : `✓ ${performedNote.name} correcta`)
    const timer = window.setTimeout(() => {
      setTargetIndex((index) => (phraseComplete ? 0 : index + 1))
      setFeedback(phraseComplete ? 'Otra vuelta. Desde el principio…' : 'Siguiente nota…')
    }, phraseComplete ? 760 : 420)

    return () => window.clearTimeout(timer)
  }, [breathRequired, currentNote, isBlowing, performedNote, sequence.length, target.name, targetIndex])

  const holes = currentNote?.holes ?? Array(profile.holeCount).fill(false)

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <span className="eyebrow">BLACKMAMBA INSTRUMENT LAB</span>
          <h1>OCARINA <span>3D</span></h1>
          <p>Control físico → digitación → aire → nota → sonido → pentagrama.</p>
        </div>
        <div className="hero-actions">
          <button className={audioEnabled ? 'audio-button active' : 'audio-button'} onClick={enableAudio}>
            {audioEnabled ? 'Audio activo' : 'Activar audio'}
          </button>
          <button
            className={breathRequired ? 'audio-button breath active' : 'audio-button breath'}
            onClick={breathRequired ? disableBreath : enableBreath}
          >
            {breathRequired ? 'Soplido activo' : 'Usar micrófono'}
          </button>
        </div>
      </header>

      <Staff
        sequence={sequence}
        activeIndex={targetIndex}
        played={performedNote}
        title={exercise.title}
        bpm={exercise.bpm}
        controlLabelFor={controlLabelFor}
      />

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

          <label className="control-profile-card">
            <small>CONTROL PROFILE</small>
            <select value={controlProfileId} onChange={(event) => setControlProfileId(event.target.value)}>
              {CONTROL_PROFILES.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
              ))}
            </select>
          </label>

          <div className="readout">
            <span>NOTA ACTUAL</span>
            <strong>{currentNote?.name ?? '—'}</strong>
            <small>
              {currentNote
                ? breathRequired && !isBlowing
                  ? 'Digitación lista · falta aire'
                  : `${currentNote.frequency.toFixed(2)} Hz`
                : 'Sin entrada'}
            </small>
          </div>

          <div className="breath-panel">
            <div className="breath-heading">
              <div>
                <span>AIRE</span>
                <strong>{breathRequired ? (isBlowing ? 'Soplando' : 'En espera') : 'Opcional'}</strong>
              </div>
              <b>{Math.round(breath.level * 100)}%</b>
            </div>
            <div className="breath-meter" aria-label={`Nivel de soplido ${Math.round(breath.level * 100)}%`}>
              <span style={{ width: `${Math.round(breath.level * 100)}%` }} />
            </div>
            <label className="threshold-control">
              Umbral
              <input
                type="range"
                min="0.04"
                max="0.45"
                step="0.01"
                value={breathThreshold}
                onChange={(event) => setBreathThreshold(Number(event.target.value))}
                disabled={!breathRequired}
              />
              <span>{Math.round(breathThreshold * 100)}%</span>
            </label>
            {breath.error ? <small className="breath-error">{breath.error}</small> : null}
          </div>

          <div className="feedback">{feedback}</div>

          <div className="holes" aria-label="Estado de agujeros">
            {holes.map((closed, index) => (
              <span key={index} className={closed ? 'hole closed' : 'hole'} title={`Agujero ${index + 1}`} />
            ))}
          </div>

          <div className="profile-card">
            <small>INSTRUMENT PROFILE</small>
            <strong>{profile.name}</strong>
            <span>{profile.holeCount} agujeros · {profile.status}</span>
          </div>

          <small className="device-id">{gamepad.id}</small>
        </aside>
      </section>

      <section className="mapping-card">
        <div>
          <span className="eyebrow">MAPA DE EJECUCIÓN</span>
          <h2>Conecta el control y toca.</h2>
          <p>Elige la familia del control para que los símbolos visibles coincidan con tu gamepad. El teclado sigue disponible como fallback.</p>
        </div>

        <div className="mapping-grid">
          {profile.notes.map((note) => {
            const binding = getBinding(controlProfile, note.name)
            return (
              <div className={currentNote?.name === note.name ? 'mapping active' : 'mapping'} key={note.name}>
                <strong>{note.name}</strong>
                <span>{binding?.label ?? 'Sin asignar'}</span>
                <kbd>{binding ? KEYBOARD_LABELS[binding.button] ?? '—' : '—'}</kbd>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
