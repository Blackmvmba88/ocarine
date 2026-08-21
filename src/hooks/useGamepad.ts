import { useEffect, useState } from 'react'

type GamepadState = {
  connected: boolean
  id: string
  pressedButtons: number[]
  axes: number[]
}

const EMPTY_STATE: GamepadState = {
  connected: false,
  id: 'Sin control conectado',
  pressedButtons: [],
  axes: [],
}

export function useGamepad(): GamepadState {
  const [state, setState] = useState<GamepadState>(EMPTY_STATE)

  useEffect(() => {
    let frame = 0

    const poll = () => {
      const gamepads = navigator.getGamepads?.() ?? []
      const gamepad = Array.from(gamepads).find(Boolean)

      if (!gamepad) {
        setState((current) => (current.connected ? EMPTY_STATE : current))
      } else {
        const pressedButtons = gamepad.buttons
          .map((button, index) => (button.pressed ? index : -1))
          .filter((index) => index >= 0)

        setState({
          connected: true,
          id: gamepad.id,
          pressedButtons,
          axes: [...gamepad.axes],
        })
      }

      frame = requestAnimationFrame(poll)
    }

    frame = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(frame)
  }, [])

  return state
}
