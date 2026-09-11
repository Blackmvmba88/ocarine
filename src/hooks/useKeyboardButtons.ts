import { useEffect, useState } from 'react'

const KEY_TO_BUTTON: Record<string, number> = {
  KeyZ: 0,
  KeyX: 1,
  KeyC: 2,
  KeyV: 3,
  ArrowUp: 12,
  ArrowDown: 13,
  ArrowLeft: 14,
  ArrowRight: 15,
}

export function useKeyboardButtons(): number[] {
  const [pressed, setPressed] = useState<number[]>([])

  useEffect(() => {
    const active = new Set<number>()

    const sync = () => setPressed([...active])

    const onKeyDown = (event: KeyboardEvent) => {
      const button = KEY_TO_BUTTON[event.code]
      if (button === undefined) return
      event.preventDefault()
      active.add(button)
      sync()
    }

    const onKeyUp = (event: KeyboardEvent) => {
      const button = KEY_TO_BUTTON[event.code]
      if (button === undefined) return
      active.delete(button)
      sync()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  return pressed
}
