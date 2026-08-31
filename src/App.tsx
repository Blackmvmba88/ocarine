import { useMemo, useRef, useState, useEffect } from 'react'
import { OcarinaScene } from './components/OcarinaScene'
import { Staff } from './components/Staff'
import {
  CONTROL_PROFILES,
  DEFAULT_CONTROL_PROFILE,
  createCustomControlProfile,
  getBinding,
  remapControlBinding,
  resolveNoteFromControlProfile,
} from './core/controlProfiles'
import { FIRST_FLIGHT, stepsForSection, type PracticeExercise } from './core/exercises'
import { DEFAULT_INSTRUMENT_PROFILE } from './core/instrumentProfiles'
import { encodePerformanceMidi } from './core/midi'
import type { OcarinaNote } from './core/notes'
import type { PerformanceExportEnvelope, PerformanceSource } from './core/performance'
import { scorePerformance } from './core/practiceScoring'
import { useBreathInput } from './hooks/useBreathInput'
import { useGamepad } from './hooks/useGamepad'
import { useKeyboardButtons } from './hooks/useKeyboardButtons'
import { useMetronome } from './hooks/useMetronome'
import { usePerformanceRecorder } from './hooks/usePerformanceRecorder'
import { usePerformanceReplay } from './hooks/usePerformanceReplay'
import { usePersistentControlSettings } from './hooks/usePersistentControlSettings'
import { usePracticeClock } from './hooks/usePracticeClock'
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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const profile = DEFAULT_INSTRUMENT_PROFILE
  const exercise = FIRST_FLIGHT
  const gamepad = useGamepad()
  const keyboardButtons = useKeyboardButtons()
  const breath = useBreathInput()
  const controlSettings = usePersistentControlSettings()

  const [remapNote, setRemapNote] = useState<string | null>(null)
  const [sectionId, setSectionId] = useState(exercise.sections[0]?.id ?? 'full')
  const [tempoPercent, setTempoPercent] = useState(100)
  const [targetIndex, setTargetIndex] = useState(0)
  const [feedback, setFeedback] = useState('Toca la nota objetivo para comenzar.')
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [breathRequired, setBreathRequired] = useState(false)
  const [breathThreshold, setBreathThreshold] = useState(0.12)

  const previousGamepadButtons = useRef<number[]>([])
  const audioContext = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  const availableControlProfiles = useMemo(
    () => controlSettings.customProfile
      ? [...CONTROL_PROFILES, controlSettings.customProfile]
      : CONTROL_PROFILES,
    [controlSettings.customProfile],
  )

  const controlProfile = availableControlProfiles.find(
    (candidate) => candidate.id === controlSettings.selectedProfileId,
  ) ?? DEFAULT_CONTROL_PROFILE

  const selectedSection = exercise.sections.find((candidate) => candidate.id === sectionId)
    ?? exercise.sections[0]
  const activeSteps = useMemo(() => stepsForSection(exercise, sectionId), [exercise, sectionId])
  const practiceBpm = Math.max(30, Math.round(exercise.bpm * tempoPercent / 100))
  const activeExercise = useMemo<PracticeExercise>(() => ({
    ...exercise,
    id: `${exercise.id}:${sectionId}`,
    title: `${exercise.title} · ${selectedSection?.title ?? 'Frase completa'}`,
    bpm: practiceBpm,
    steps: activeSteps,
  }), [activeSteps, exercise, practiceBpm, sectionId, selectedSection?.title])

  const gamepadNote = resolveNoteFromControlProfile(gamepad.pressedButtons, profile.notes, controlProfile)
  const keyboardNote = resolveNoteFromControlProfile(keyboardButtons, profile.notes, DEFAULT_CONTROL_PROFILE)
  const currentNote = gamepadNote ?? keyboardNote

  const sequence = useMemo(
    () => activeExercise.steps.reduce<OcarinaNote[]>((notes, step) => {
      const note = profile.notes.find((candidate) => candidate.name === step.note)
      if (note) notes.push(note)
      return notes
    }, []),
    [activeExercise.steps, profile.notes],
  )
  const durations = useMemo(() => activeExercise.steps.map((step) => step.beats), [activeExercise.steps])
  const totalBeats = useMemo(() => durations.reduce((sum, beats) => sum + beats, 0), [durations])
  const practiceClock = usePracticeClock(activeExercise.bpm, totalBeats)
  const metronome = useMetronome(
    activeExercise.bpm,
    activeExercise.beatsPerMeasure,
    activeExercise.countInBeats,
  )
  const tempoMeasure = Math.floor(practiceClock.beat / activeExercise.beatsPerMeasure) + 1
  const tempoBeatInMeasure = Math.floor(practiceClock.beat % activeExercise.beatsPerMeasure) + 1

  const target = sequence[targetIndex] ?? profile.notes[0]
  const isBlowing = breath.enabled && breath.level >= breathThreshold
  const performedNote = currentNote && (!breathRequired || isBlowing) ? currentNote : null
  const inputSource: PerformanceSource = gamepadNote && keyboardNote
    ? 'mixed'
    : gamepadNote
      ? 'gamepad'
      : keyboardNote
        ? 'keyboard'
        : 'unknown'

  const recorder = usePerformanceRecorder(performedNote, breath.level, inputSource)
  const replay = usePerformanceReplay(recorder.events)
  const practiceScore = useMemo(
    () => scorePerformance(activeExercise, recorder.events),
    [activeExercise, recorder.events],
  )
  const controlLabelFor = (noteName: string) => getBinding(controlProfile, noteName)?.label ?? noteName

  const enableAudio = async () => {
    if (!audioContext.current) audioContext.current = new AudioContext()
    await audioContext.current.resume()
    setAudioEnabled(true)
  }

  const enableBreath = async () => {
    await enableAudio()
    const started = await breath.start()
    setBreathRequired(started)
  }

  const disableBreath = () => {
    breath.stop()
    setBreathRequired(false)
  }

  const startTempoTraining = async () => {
    replay.stop()
    practiceClock.reset()
    await metronome.start()
  }

  const stopTempoTraining = () => {
    metronome.stop()
    practiceClock.stop()
  }

  const resetTempoTraining = () => {
    metronome.stop()
    practiceClock.reset()
  }

  const resetPracticeContext = (message: string) => {
    metronome.stop()
    practiceClock.reset()
    replay.stop()
    recorder.reset()
    setTargetIndex(0)
    setFeedback(message)
  }

  const changeSection = (nextSectionId: string) => {
    setSectionId(nextSectionId)
    const nextSection = exercise.sections.find((candidate) => candidate.id === nextSectionId)
    resetPracticeContext(`Loop listo: ${nextSection?.title ?? 'Frase completa'}.`)
  }

  const changeTempo = (nextPercent: number) => {
    setTempoPercent(nextPercent)
    const nextBpm = Math.max(30, Math.round(exercise.bpm * nextPercent / 100))
    resetPracticeContext(`Tempo ajustado a ${nextBpm} BPM. Desde el principio…`)
  }

  const exportPerformanceJson = () => {
    if (!recorder.events.length) return

    const payload: PerformanceExportEnvelope = {
      format: 'blackmamba-ocarina-performance',
      version: 1,
      exportedAt: new Date().toISOString(),
      instrumentProfile: profile.id,
      controlProfile: controlProfile.id,
      exercise: activeExercise.id,
      bpm: activeExercise.bpm,
      meter: `${activeExercise.beatsPerMeasure}/${activeExercise.beatUnit}`,
      breathRequired,
      breathThreshold,
      events: recorder.events,
    }

    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
      `blackmamba-ocarina-${sectionId}-${activeExercise.bpm}bpm-${Date.now()}.json`,
    )
  }

  const exportPerformanceMidi = () => {
    if (!recorder.events.length) return

    const bytes = encodePerformanceMidi(
      recorder.events,
      activeExercise.bpm,
      activeExercise.beatsPerMeasure,
      activeExercise.beatUnit,
    )
    const copy = new Uint8Array(bytes)
    downloadBlob(
      new Blob([copy.buffer], { type: 'audio/midi' }),
      `blackmamba-ocarina-${sectionId}-${activeExercise.bpm}bpm-${Date.now()}.mid`,
    )
  }

  useEffect(() => {
    if (metronome.phase === 'playing' && !practiceClock.running) {
      practiceClock.start()
    }
    if (metronome.phase === 'idle' && practiceClock.running) {
      practiceClock.stop()
    }
  }, [metronome.phase, practiceClock.running, practiceClock.start, practiceClock.stop])

  useEffect(() => {
    const previous = new Set(previousGamepadButtons.current)
    const newlyPressed = gamepad.pressedButtons.find((button) => !previous.has(button))
    previousGamepadButtons.current = [...gamepad.pressedButtons]

    if (!remapNote || newlyPressed === undefined) return

    const baseProfile = controlProfile.family === 'custom'
      ? controlProfile
      : createCustomControlProfile(controlProfile)
    const capturedLabel = controlProfile.bindings.find((binding) => binding.button === newlyPressed)?.label
      ?? `Button ${newlyPressed}`
    const remapped = remapControlBinding(baseProfile, remapNote, newlyPressed, capturedLabel)

    controlSettings.saveCustomProfile(remapped)
    setFeedback(`✓ ${remapNote} asignada a ${capturedLabel}`)
    setRemapNote(null)
  }, [controlProfile, controlSettings.saveCustomProfile, gamepad.pressedButtons, remapNote])

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
      if (!remapNote) setFeedback('Esperando una nota…')
      return
    }

    if (performedNote.name !== target.name) {
      setFeedback(`Tocaste ${performedNote.name}. Busca ${target.name}.`)
      return
    }

    const sectionComplete = targetIndex === sequence.length - 1
    setFeedback(sectionComplete ? `✓ ${performedNote.name} · loop completo` : `✓ ${performedNote.name} correcta`)
    const timer = window.setTimeout(() => {
      setTargetIndex((index) => (sectionComplete ? 0 : index + 1))
      setFeedback(sectionComplete ? 'Otra vuelta del loop…' : 'Siguiente nota…')
    }, sectionComplete ? 620 : 420)

    return () => window.clearTimeout(timer)
  }, [breathRequired, currentNote, isBlowing, performedNote, remapNote, sequence.length, target.name, targetIndex])

  const holes = currentNote?.holes ?? Array(profile.holeCount).fill(false)
  const tempoStatus = metronome.phase === 'count-in'
    ? `Count-in ${metronome.beatNumber}/${activeExercise.countInBeats}`
    : practiceClock.running
      ? `M${tempoMeasure} · beat ${tempoBeatInMeasure}`
      : `${activeExercise.bpm} BPM · ${activeExercise.beatsPerMeasure}/${activeExercise.beatUnit}`

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
        durations={durations}
        activeIndex={targetIndex}
        played={performedNote}
        title={activeExercise.title}
        bpm={activeExercise.bpm}
        beatsPerMeasure={activeExercise.beatsPerMeasure}
        beatUnit={activeExercise.beatUnit}
        tempoBeat={practiceClock.running ? practiceClock.beat : null}
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
            <select
              value={controlProfile.id}
              onChange={(event) => {
                controlSettings.setSelectedProfileId(event.target.value)
                setRemapNote(null)
              }}
            >
              {availableControlProfiles.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
              ))}
            </select>
          </label>

          {controlSettings.customProfile ? (
            <button className="text-button" onClick={controlSettings.clearCustomProfile}>
              Restablecer mapeo personalizado
            </button>
          ) : null}

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

          <div className="tempo-panel">
            <div className="tempo-heading">
              <div>
                <span>TEMPO / LOOP</span>
                <strong>{tempoStatus}</strong>
              </div>
              <b>{activeExercise.bpm}</b>
            </div>

            <div className="practice-settings">
              <label>
                <span>SECCIÓN</span>
                <select value={sectionId} onChange={(event) => changeSection(event.target.value)}>
                  {exercise.sections.map((section) => (
                    <option key={section.id} value={section.id}>{section.title}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>VELOCIDAD <b>{tempoPercent}%</b></span>
                <input
                  type="range"
                  min="50"
                  max="125"
                  step="5"
                  value={tempoPercent}
                  onChange={(event) => changeTempo(Number(event.target.value))}
                />
              </label>
            </div>

            <div className="tempo-actions">
              <button onClick={metronome.running ? stopTempoTraining : startTempoTraining}>
                {metronome.running ? 'Stop' : 'Count-in + Loop'}
              </button>
              <button onClick={resetTempoTraining}>Reset</button>
            </div>
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

          <div className="recorder-panel">
            <div className="recorder-heading">
              <div>
                <span>PERFORMANCE</span>
                <strong>{recorder.recording ? 'Grabando' : `${recorder.events.length} eventos`}</strong>
              </div>
              <span className={recorder.recording ? 'recording-dot active' : 'recording-dot'} />
            </div>
            <div className="recorder-actions">
              <button onClick={recorder.recording ? recorder.stop : recorder.start}>
                {recorder.recording ? 'Detener' : 'Grabar'}
              </button>
              <button onClick={recorder.reset} disabled={!recorder.events.length && !recorder.recording}>Limpiar</button>
              <button onClick={exportPerformanceJson} disabled={!recorder.events.length}>JSON</button>
              <button onClick={exportPerformanceMidi} disabled={!recorder.events.length}>MIDI</button>
              <button onClick={replay.playing ? replay.stop : replay.play} disabled={!recorder.events.length}>
                {replay.playing ? 'Stop replay' : 'Replay'}
              </button>
            </div>
            {recorder.events.length ? (
              <div className="score-grid">
                <div><span>SCORE</span><strong>{practiceScore.score}</strong></div>
                <div><span>NOTAS</span><strong>{practiceScore.noteAccuracy}%</strong></div>
                <div><span>TIMING</span><strong>{practiceScore.timingAccuracy}%</strong></div>
                <div><span>DURACIÓN</span><strong>{practiceScore.durationAccuracy}%</strong></div>
                <div><span>ERROR INICIO</span><strong>{practiceScore.averageAbsTimingErrorMs ?? '—'}<small>{practiceScore.averageAbsTimingErrorMs === null ? '' : ' ms'}</small></strong></div>
                <div><span>ERROR DUR.</span><strong>{practiceScore.averageAbsDurationErrorMs ?? '—'}<small>{practiceScore.averageAbsDurationErrorMs === null ? '' : ' ms'}</small></strong></div>
              </div>
            ) : null}
          </div>

          <div className="feedback">{remapNote ? `Pulsa ahora el botón que quieres usar para ${remapNote}.` : feedback}</div>

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
          <p>Selecciona una nota y pulsa un botón del gamepad para crear tu propio mapa. Los cambios quedan guardados localmente en este navegador.</p>
          {remapNote ? <p className="remap-hint">Escuchando el mando para <strong>{remapNote}</strong>…</p> : null}
        </div>

        <div className="mapping-grid">
          {profile.notes.map((note) => {
            const binding = getBinding(controlProfile, note.name)
            const keyboardBinding = getBinding(DEFAULT_CONTROL_PROFILE, note.name)
            return (
              <div
                className={`${currentNote?.name === note.name ? 'mapping active' : 'mapping'}${remapNote === note.name ? ' remapping' : ''}`}
                key={note.name}
              >
                <strong>{note.name}</strong>
                <span>{binding?.label ?? 'Sin asignar'}</span>
                <kbd>{keyboardBinding ? KEYBOARD_LABELS[keyboardBinding.button] ?? '—' : '—'}</kbd>
                <button
                  className="remap-button"
                  onClick={() => setRemapNote((current) => current === note.name ? null : note.name)}
                  disabled={!gamepad.connected}
                >
                  {remapNote === note.name ? 'Cancelar' : 'Remap'}
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
