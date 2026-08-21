import { useEffect, useMemo, useState } from 'react'
import { OcarinaScene } from './components/OcarinaScene'
import { Staff } from './components/Staff'
import { useGamepad } from './hooks/useGamepad'
import { useOcarinaAudio } from './hooks/useOcarinaAudio'
import { holesToText, resolveNote, type HoleState } from './music/fingerings'

const BUTTON_LABELS = ['A', 'B', 'X', 'Y']
const KEY_BY_HOLE = ['1', '2', '3', '4']

function emptyHoles(): HoleState {
  return [false, false, false, false]
}

export default function App() {
  const gamepad = useGamepad()
  const [keyboardHoles, setKeyboardHoles] = useState<HoleState>(emptyHoles)
  const [keyboardBreath, setKeyboardBreath] = useState(0)

  const holes = useMemo<HoleState>(
    () => keyboardHoles.map((closed, index) => closed || gamepad.holes[index]) as HoleState,
    [keyboardHoles, gamepad.holes],
  )
  const breath = Math.max(keyboardBreath, gamepad.breath)
  const note = useMemo(() => resolveNote(holes), [holes])
  const { enabled: audioEnabled, enableAudio } = useOcarinaAudio(note.frequency, breath)
  const active = audioEnabled && breath > 0.03

  const setHole = (index: number, value: boolean) => {
    setKeyboardHoles((previous) => {
      const next = [...previous] as HoleState
      next[index] = value
      return next
    })
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const holeIndex = KEY_BY_HOLE.indexOf(event.key)
      if (holeIndex >= 0) setHole(holeIndex, true)
      if (event.code === 'Space') {
        event.preventDefault()
        setKeyboardBreath(0.78)
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      const holeIndex = KEY_BY_HOLE.indexOf(event.key)
      if (holeIndex >= 0) setHole(holeIndex, false)
      if (event.code === 'Space') {
        event.preventDefault()
        setKeyboardBreath(0)
      }
    }

    const releaseAll = () => {
      setKeyboardHoles(emptyHoles())
      setKeyboardBreath(0)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', releaseAll)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', releaseAll)
    }
  }, [])

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">BLACKMAMBA LAB / PLAYABLE MVP</p>
          <h1>Ocarina 3D</h1>
        </div>
        <div className={`status-pill ${gamepad.connected ? 'online' : ''}`}>
          <span className="status-dot" />
          {gamepad.connected ? 'GAMEPAD CONNECTED' : 'KEYBOARD MODE'}
        </div>
      </header>

      <Staff note={note} active={active} />

      <section className="instrument-grid">
        <div className="scene-card">
          <OcarinaScene holes={holes} />
          <div className="scene-caption">
            <span>drag to rotate · wheel to zoom</span>
            <strong>{holesToText(holes)}</strong>
          </div>
        </div>

        <aside className="telemetry-card">
          <p className="eyebrow">CURRENT NOTE</p>
          <div className={`big-note ${active ? 'active' : ''}`}>{note.name}</div>
          <div className="note-name">{note.label}</div>
          <div className="frequency">{note.frequency.toFixed(2)} Hz</div>

          <div className="meter-row">
            <span>BREATH</span>
            <strong>{Math.round(breath * 100)}%</strong>
          </div>
          <div className="meter"><div style={{ width: `${breath * 100}%` }} /></div>

          <div className="telemetry-list">
            <span>Fingering <b>{holesToText(holes)}</b></span>
            <span>Input <b>{gamepad.connected ? 'Gamepad + keyboard' : 'Keyboard / touch'}</b></span>
          </div>

          <button className="audio-button" onClick={enableAudio} disabled={audioEnabled}>
            {audioEnabled ? 'AUDIO ENGINE ARMED' : 'ARM AUDIO ENGINE'}
          </button>
        </aside>
      </section>

      <section className="controller-card">
        <div className="controller-heading">
          <div>
            <p className="eyebrow">LIVE CONTROLLER</p>
            <h2>Hold holes + blow</h2>
          </div>
          <p className="controller-id">{gamepad.id}</p>
        </div>

        <div className="controls-row">
          <div className="face-buttons">
            {BUTTON_LABELS.map((label, index) => (
              <button
                key={label}
                className={holes[index] ? 'face-button pressed' : 'face-button'}
                onPointerDown={() => setHole(index, true)}
                onPointerUp={() => setHole(index, false)}
                onPointerLeave={() => setHole(index, false)}
              >
                {label}
                <small>{KEY_BY_HOLE[index]}</small>
              </button>
            ))}
          </div>

          <button
            className={`blow-button ${keyboardBreath > 0 ? 'pressed' : ''}`}
            onPointerDown={() => setKeyboardBreath(0.82)}
            onPointerUp={() => setKeyboardBreath(0)}
            onPointerLeave={() => setKeyboardBreath(0)}
          >
            <span>R2 / SPACE</span>
            <strong>BLOW</strong>
          </button>
        </div>

        <p className="hint">
          Gamepad: A/B/X/Y close the four holes, R2 controls breath. Keyboard: 1/2/3/4 + Space.
        </p>
      </section>
    </main>
  )
}
