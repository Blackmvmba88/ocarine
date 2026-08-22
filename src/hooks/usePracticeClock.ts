import { useCallback, useEffect, useRef, useState } from 'react'

export function usePracticeClock(bpm: number, totalBeats: number) {
  const [running, setRunning] = useState(false)
  const [beat, setBeat] = useState(0)
  const originRef = useRef<number | null>(null)
  const frameRef = useRef<number | null>(null)

  const stop = useCallback(() => {
    setRunning(false)
    originRef.current = null
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
  }, [])

  const reset = useCallback(() => {
    stop()
    setBeat(0)
  }, [stop])

  const start = useCallback(() => {
    originRef.current = performance.now()
    setBeat(0)
    setRunning(true)
  }, [])

  useEffect(() => {
    if (!running || totalBeats <= 0) return

    const tick = (now: number) => {
      const origin = originRef.current ?? now
      const elapsedMinutes = (now - origin) / 60000
      const elapsedBeats = elapsedMinutes * bpm
      setBeat(elapsedBeats % totalBeats)
      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [bpm, running, totalBeats])

  return { running, beat, start, stop, reset }
}
