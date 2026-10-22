import { useCallback, useEffect, useRef, useState } from 'react'
import type { MusicalNote } from '../music'
import type { MaterialPreset } from '../instrument'

export function useOcarinaAudio(note: MusicalNote | null, breath: number, material: MaterialPreset) {
  const contextRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const filterRef = useRef<BiquadFilterNode | null>(null)
  const [ready, setReady] = useState(false)

  const enable = useCallback(async () => {
    const context = contextRef.current ?? new AudioContext()
    contextRef.current = context
    await context.resume()
    setReady(true)
  }, [])

  useEffect(() => {
    const context = contextRef.current
    if (!context || !ready) return
    const active = Boolean(note && breath > 0.045)

    if (!active) {
      const gain = gainRef.current
      const osc = oscRef.current
      if (gain && osc) {
        const now = context.currentTime
        gain.gain.cancelScheduledValues(now)
        gain.gain.setTargetAtTime(0.0001, now, 0.025)
        osc.stop(now + 0.09)
        oscRef.current = null
        gainRef.current = null
        filterRef.current = null
      }
      return
    }

    if (!oscRef.current) {
      const osc = context.createOscillator()
      const gain = context.createGain()
      const filter = context.createBiquadFilter()
      filter.type = 'bandpass'
      filter.Q.value = 1.8
      gain.gain.value = 0.0001
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(context.destination)
      osc.start()
      oscRef.current = osc
      gainRef.current = gain
      filterRef.current = filter
    }

    const now = context.currentTime
    const osc = oscRef.current!
    const gain = gainRef.current!
    const filter = filterRef.current!
    osc.type = material.oscillator
    osc.frequency.setTargetAtTime(note!.frequency, now, 0.015)
    filter.frequency.setTargetAtTime(note!.frequency * material.filterMultiplier, now, 0.03)
    gain.gain.setTargetAtTime((0.025 + breath * 0.16) * material.gainMultiplier, now, 0.025)
  }, [note, breath, ready, material])

  useEffect(() => () => {
    try { oscRef.current?.stop() } catch { /* already stopped */ }
    void contextRef.current?.close()
  }, [])

  return { ready, enable }
}
