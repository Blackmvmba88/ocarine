import { useCallback, useEffect, useRef, useState } from 'react'
import type { MusicalNote } from '../music'
import type { MaterialPreset } from '../instrument'

type Voice = {
  fundamental: OscillatorNode
  overtone: OscillatorNode
  overtoneGain: GainNode
  envelope: GainNode
  output: GainNode
}

/** A sustained, near-sinusoidal vessel-flute voice. No noise generator. */
export function useOcarinaAudio(note: MusicalNote | null, breath: number, material: MaterialPreset) {
  const contextRef = useRef<AudioContext | null>(null)
  const voiceRef = useRef<Voice | null>(null)
  const releaseRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enable = useCallback(async () => {
    try {
      setError(null)
      const previous = contextRef.current
      const context = previous && previous.state !== 'closed' ? previous : new AudioContext({ latencyHint: 'interactive' })
      contextRef.current = context
      await context.resume()
      if (context.state !== 'running') throw new Error('Vuelve a pulsar Activar audio para habilitar el sonido.')
      if (!voiceRef.current) {
        const fundamental = context.createOscillator()
        const overtone = context.createOscillator()
        const overtoneGain = context.createGain()
        const envelope = context.createGain()
        const output = context.createGain()
        fundamental.type = 'sine'
        overtone.type = 'sine'
        fundamental.frequency.value = 523.251
        overtone.frequency.value = 1046.502
        overtoneGain.gain.value = 0.018
        envelope.gain.value = 0
        output.gain.value = 0.23
        fundamental.connect(envelope)
        overtone.connect(overtoneGain)
        overtoneGain.connect(envelope)
        envelope.connect(output)
        output.connect(context.destination)
        fundamental.start()
        overtone.start()
        voiceRef.current = { fundamental, overtone, overtoneGain, envelope, output }
      }
      setReady(true)
      return true
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo activar el audio.')
      setReady(false)
      return false
    }
  }, [])

  useEffect(() => {
    const context = contextRef.current
    const voice = voiceRef.current
    if (!context || !voice || !ready) return
    if (releaseRef.current !== null) clearTimeout(releaseRef.current)
    releaseRef.current = null

    const smooth = (parameter: AudioParam, value: number, time: number) => {
      // Hold the current ramp before replacing it: controller polling must not stack automation.
      parameter.cancelAndHoldAtTime(context.currentTime)
      parameter.setTargetAtTime(value, context.currentTime, time)
    }
    const strength = Math.max(0, Math.min(1, breath))
    if (!note || strength <= 0.045) {
      // Allow the fingers to cross intermediate unmapped combinations without retriggering the voice.
      releaseRef.current = setTimeout(() => {
        smooth(voice.envelope.gain, 0, 0.018)
        releaseRef.current = null
      }, note ? 0 : 24)
      return
    }

    smooth(voice.fundamental.frequency, note.frequency, 0.006)
    smooth(voice.overtone.frequency, note.frequency * 2, 0.006)
    // Materials change only a subtle overtone, never the fundamental waveform.
    const color = material.id === 'wood' ? 0.012 : material.id === 'metal' ? 0.028 : 0.018
    smooth(voice.overtoneGain.gain, color, 0.04)
    smooth(voice.envelope.gain, Math.pow(strength, 0.75) * material.gainMultiplier, 0.025)
    return () => {
      if (releaseRef.current !== null) clearTimeout(releaseRef.current)
    }
  }, [note, breath, ready, material])

  useEffect(() => () => {
    if (releaseRef.current !== null) clearTimeout(releaseRef.current)
    const voice = voiceRef.current
    if (voice) {
      voice.fundamental.stop()
      voice.overtone.stop()
      voice.output.disconnect()
    }
    voiceRef.current = null
    void contextRef.current?.close()
    contextRef.current = null
  }, [])

  return { ready, enable, error }
}
