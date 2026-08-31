import { useEffect, useState } from 'react'

type GamepadState = {
  connected: boolean
  id: string
  pressedButtons: number[]
}

const EMPTY_STATE: GamepadState = {
  connected: false,
  id: 'Sin control conectado',
  pressedButtons: [],
}

function sameButtons(left: number[], right: number[]) {
  return left.length === right.length && left.every((button, index) => button === right[index])
}

export function useGamepad(): GamepadState {
  const [state, setState] = useState<GamepadState>(EMPTY_STATE)

  useEffect(() => {
    let frame = 0
    let lastConnected = false
    let lastId = EMPTY_STATE.id
    let lastButtons: number[] = []

    const poll = () => {
      const gamepads = navigator.getGamepads?.() ?? []
      const gamepad = Array.from(gamepads).find(Boolean)

      if (!gamepad) {
        if (lastConnected) {
          lastConnected = false
          lastId = EMPTY_STATE.id
          lastButtons = []
          setState(EMPTY_STATE)
        }
      } else {
        const pressedButtons: number[] = []
        for (let index = 0; index < gamepad.buttons.length; index += 1) {
          if (gamepad.buttons[index]?.pressed) pressedButtons.push(index)
        }

        const changed = !lastConnected
          || lastId !== gamepad.id
          || !sameButtons(lastButtons, pressedButtons)

        if (changed) {
          lastConnected = true
          lastId = gamepad.id
          lastButtons = pressedButtons
          setState({
            connected: true,
            id: gamepad.id,
            pressedButtons,
          })
        }
      }

      frame = requestAnimationFrame(poll)
    }

    frame = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(frame)
  }, [])

  return state
}
