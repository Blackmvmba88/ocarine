import { useEffect, useRef, useState } from 'react'
import type { HoleState } from '../music/fingerings'

export interface GamepadState {
  connected: boolean
  id: string
  holes: HoleState
  breath: number
}

const EMPTY_STATE: GamepadState = {
  connected: false,
  id: 'No gamepad connected',
  holes: [false, false, false, false],
  breath: 0,
}

export function useGamepad(): GamepadState {
  const [state, setState] = useState<GamepadState>(EMPTY_STATE)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    const poll = () => {
      const pads = navigator.getGamepads?.() ?? []
      const pad = Array.from(pads).find(Boolean)

      if (!pad) {
        setState(EMPTY_STATE)
      } else {
        const pressed = (index: number) => Boolean(pad.buttons[index]?.pressed)
        const trigger = pad.buttons[7]?.value ?? 0

        setState({
          connected: true,
          id: pad.id,
          holes: [pressed(0), pressed(1), pressed(2), pressed(3)],
          breath: Math.max(0, Math.min(1, trigger)),
        })
      }

      frame.current = requestAnimationFrame(poll)
    }

    const start = () => {
      if (frame.current === null) poll()
    }

    window.addEventListener('gamepadconnected', start)
    window.addEventListener('gamepaddisconnected', start)
    start()

    return () => {
      window.removeEventListener('gamepadconnected', start)
      window.removeEventListener('gamepaddisconnected', start)
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [])

  return state
}
