import { useCallback, useEffect, useRef, useState } from 'react'
import type { PerformanceNoteEvent } from '../core/performance'

export function usePerformanceReplay(events: PerformanceNoteEvent[]) {
  const [playing, setPlaying] = useState(false)
  const [positionMs, setPositionMs] = useState(0)
  const contextRef = useRef<AudioContext | null>(null)
  const timersRef = useRef<number[]>([])
  const frameRef = useRef<number | null>(null)
  const startedAtRef = useRef<number | null>(null)

  const clearScheduled = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
  }, [])

  const stop = useCallback(() => {
    clearScheduled()
    startedAtRef.current = null
    setPlaying(false)
    setPositionMs(0)
  }, [clearScheduled])

  const play = useCallback(async () => {
    if (!events.length) return
    stop()

    if (!contextRef.current || contextRef.current.state === 'closed') {
      contextRef.current = new AudioContext()
    }
    await contextRef.current.resume()

    const context = contextRef.current
    const firstAt = events[0].startedAtMs
    const normalized = events.map((event) => ({
      ...event,
      startMs: Math.max(0, event.startedAtMs - firstAt),
    }))
    const totalMs = Math.max(...normalized.map((event) => event.startMs + event.durationMs), 1)

    normalized.forEach((event) => {
      const timer = window.setTimeout(() => {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(event.frequency, context.currentTime)
        gain.gain.setValueAtTime(0.0001, context.currentTime)
        const peak = Math.max(0.08, Math.min(0.3, event.breathPeak > 0 ? event.breathPeak * 0.3 : 0.17))
        gain.gain.exponentialRampToValueAtTime(peak, context.currentTime + 0.015)
        gain.gain.setTargetAtTime(0.0001, context.currentTime + Math.max(0.03, event.durationMs / 1000 - 0.04), 0.025)
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start()
        oscillator.stop(context.currentTime + Math.max(0.06, event.durationMs / 1000 + 0.08))
      }, event.startMs)
      timersRef.current.push(timer)
    })

    setPlaying(true)
    setPositionMs(0)
    startedAtRef.current = performance.now()

    const update = (now: number) => {
      const startedAt = startedAtRef.current ?? now
      const elapsed = now - startedAt
      setPositionMs(Math.min(totalMs, elapsed))

      if (elapsed >= totalMs) {
        setPlaying(false)
        startedAtRef.current = null
        frameRef.current = null
        return
      }

      frameRef.current = requestAnimationFrame(update)
    }

    frameRef.current = requestAnimationFrame(update)
  }, [events, stop])

  useEffect(() => () => {
    clearScheduled()
    if (contextRef.current && contextRef.current.state !== 'closed') {
      void contextRef.current.close()
    }
  }, [clearScheduled])

  return { playing, positionMs, play, stop }
}
