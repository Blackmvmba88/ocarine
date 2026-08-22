import { useCallback, useEffect, useRef, useState } from 'react'
import type { OcarinaNote } from '../core/notes'
import type { PerformanceNoteEvent, PerformanceSource } from '../core/performance'

type ActiveEvent = {
  note: OcarinaNote
  startedAt: number
  breathPeak: number
  source: PerformanceSource
}

export function usePerformanceRecorder(
  performedNote: OcarinaNote | null,
  breathLevel: number,
  source: PerformanceSource,
) {
  const [recording, setRecording] = useState(false)
  const [events, setEvents] = useState<PerformanceNoteEvent[]>([])
  const sessionStartRef = useRef<number | null>(null)
  const activeRef = useRef<ActiveEvent | null>(null)

  const finalizeActive = useCallback((now: number) => {
    const active = activeRef.current
    const sessionStart = sessionStartRef.current
    if (!active || sessionStart === null) return

    setEvents((current) => [
      ...current,
      {
        note: active.note.name,
        midi: active.note.midi,
        frequency: active.note.frequency,
        startedAtMs: Math.max(0, active.startedAt - sessionStart),
        durationMs: Math.max(1, now - active.startedAt),
        breathPeak: active.breathPeak,
        source: active.source,
      },
    ])

    activeRef.current = null
  }, [])

  const start = useCallback(() => {
    const now = performance.now()
    setEvents([])
    sessionStartRef.current = now
    activeRef.current = null
    setRecording(true)
  }, [])

  const stop = useCallback(() => {
    finalizeActive(performance.now())
    setRecording(false)
  }, [finalizeActive])

  const reset = useCallback(() => {
    const now = performance.now()
    setEvents([])
    sessionStartRef.current = recording ? now : null
    activeRef.current = recording && performedNote
      ? { note: performedNote, startedAt: now, breathPeak: breathLevel, source }
      : null
  }, [breathLevel, performedNote, recording, source])

  useEffect(() => {
    if (!recording) return

    const now = performance.now()
    const active = activeRef.current

    if (active && performedNote && active.note.name === performedNote.name) {
      active.breathPeak = Math.max(active.breathPeak, breathLevel)
      return
    }

    if (active) finalizeActive(now)

    if (performedNote) {
      activeRef.current = {
        note: performedNote,
        startedAt: now,
        breathPeak: breathLevel,
        source,
      }
    }
  }, [breathLevel, finalizeActive, performedNote, recording, source])

  useEffect(() => () => {
    activeRef.current = null
  }, [])

  return { recording, events, start, stop, reset }
}
