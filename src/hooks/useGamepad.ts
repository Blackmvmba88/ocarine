import { useEffect, useState } from 'react'

export function useGamepad() {
  const [buttons, setButtons] = useState<boolean[]>([false, false, false, false, false, false])
  const [breath, setBreath] = useState(0)
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    let frame = 0
    const poll = () => {
      const pads = navigator.getGamepads?.() ?? []
      const pad = Array.from(pads).find(Boolean)
      if (pad) {
        setName(pad.id)
        const next = [0, 1, 2, 3, 4, 5].map((index) => Boolean(pad.buttons[index]?.pressed))
        setButtons((previous) => previous.every((value, index) => value === next[index]) ? previous : next)
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
