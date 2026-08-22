import { useCallback, useEffect, useRef, useState } from 'react'

export type MetronomePhase = 'idle' | 'count-in' | 'playing'

export function useMetronome(
  bpm: number,
  beatsPerMeasure: number,
  countInBeats: number,
) {
  const [phase, setPhase] = useState<MetronomePhase>('idle')
  const [beatNumber, setBeatNumber] = useState(0)
  const contextRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<number | null>(null)
  const absoluteBeatRef = useRef(0)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const click = useCallback((accent: boolean) => {
    const context = contextRef.current
    if (!context) return

    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'square'
    oscillator.frequency.setValueAtTime(accent ? 1320 : 920, context.currentTime)
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(accent ? 0.09 : 0.055, context.currentTime + 0.003)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.055)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.065)
  }, [])

  const stop = useCallback(() => {
    clearTimer()
    absoluteBeatRef.current = 0
    setBeatNumber(0)
    setPhase('idle')
  }, [clearTimer])

  const start = useCallback(async () => {
    stop()

    if (!contextRef.current || contextRef.current.state === 'closed') {
      contextRef.current = new AudioContext()
    }
    await contextRef.current.resume()

    const beatMs = 60_000 / bpm
    absoluteBeatRef.current = 0
    setPhase(countInBeats > 0 ? 'count-in' : 'playing')
    setBeatNumber(1)

    const tick = () => {
      const absoluteBeat = absoluteBeatRef.current
      const inCountIn = absoluteBeat < countInBeats
      const musicalBeat = Math.max(0, absoluteBeat - countInBeats)
      const beatInMeasure = musicalBeat % beatsPerMeasure
      const accent = inCountIn
        ? absoluteBeat % beatsPerMeasure === 0
        : beatInMeasure === 0

      click(accent)
      setPhase(inCountIn ? 'count-in' : 'playing')
      setBeatNumber(inCountIn ? absoluteBeat + 1 : beatInMeasure + 1)

      absoluteBeatRef.current += 1
      timerRef.current = window.setTimeout(tick, beatMs)
    }

    tick()
  }, [beatsPerMeasure, bpm, click, countInBeats, stop])

  useEffect(() => () => {
    clearTimer()
    if (contextRef.current && contextRef.current.state !== 'closed') {
      void contextRef.current.close()
    }
  }, [clearTimer])

  return { phase, beatNumber, start, stop, running: phase !== 'idle' }
}
