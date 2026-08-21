import { useCallback, useEffect, useRef, useState } from 'react'

export function useOcarinaAudio(frequency: number, breath: number) {
  const [enabled, setEnabled] = useState(false)
  const contextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const filterRef = useRef<BiquadFilterNode | null>(null)

  const enableAudio = useCallback(async () => {
    if (!contextRef.current) {
      const context = new AudioContext()
      const oscillator = context.createOscillator()
      const filter = context.createBiquadFilter()
      const gain = context.createGain()

      oscillator.type = 'sine'
      filter.type = 'lowpass'
      filter.frequency.value = 4200
      filter.Q.value = 0.7
      gain.gain.value = 0

      oscillator.connect(filter)
      filter.connect(gain)
      gain.connect(context.destination)
      oscillator.start()

      contextRef.current = context
      oscillatorRef.current = oscillator
      filterRef.current = filter
      gainRef.current = gain
    }

    await contextRef.current.resume()
    setEnabled(true)
  }, [])

  useEffect(() => {
    const context = contextRef.current
    const oscillator = oscillatorRef.current
    const gain = gainRef.current

    if (!enabled || !context || !oscillator || !gain) return

    const now = context.currentTime
    oscillator.frequency.setTargetAtTime(frequency, now, 0.015)

    const shapedBreath = Math.pow(Math.max(0, Math.min(1, breath)), 1.35)
    gain.gain.setTargetAtTime(shapedBreath * 0.22, now, breath > 0 ? 0.025 : 0.05)
  }, [enabled, frequency, breath])

  useEffect(() => {
    return () => {
      oscillatorRef.current?.stop()
      contextRef.current?.close()
    }
  }, [])

  return { enabled, enableAudio }
}
