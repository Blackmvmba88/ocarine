import { useCallback, useEffect, useRef, useState } from 'react'

export interface MicrophoneBreathState {
  supported: boolean
  enabled: boolean
  level: number
  error: string | null
  enableMicrophone: () => Promise<void>
}

export function useMicrophoneBreath(): MicrophoneBreathState {
  const supported = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)
  const [enabled, setEnabled] = useState(false)
  const [level, setLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const frameRef = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    if (contextRef.current) {
      void contextRef.current.close()
      contextRef.current = null
    }
  }, [])

  const enableMicrophone = useCallback(async () => {
    if (!supported || enabled) return

    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
        },
      })

      const context = new AudioContext()
      await context.resume()

      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.7
      source.connect(analyser)

      streamRef.current = stream
      contextRef.current = context
      setEnabled(true)

      const samples = new Float32Array(analyser.fftSize)

      const readBreath = () => {
        analyser.getFloatTimeDomainData(samples)

        let energy = 0
        for (let index = 0; index < samples.length; index += 1) {
          energy += samples[index] * samples[index]
        }

        const rms = Math.sqrt(energy / samples.length)
        const normalized = Math.max(0, Math.min(1, (rms - 0.012) / 0.11))

        setLevel((previous) => previous * 0.72 + normalized * 0.28)
        frameRef.current = requestAnimationFrame(readBreath)
      }

      readBreath()
    } catch (cause) {
      stop()
      setEnabled(false)
      setLevel(0)
      setError(cause instanceof Error ? cause.message : 'Microphone permission failed')
    }
  }, [enabled, stop, supported])

  useEffect(() => {
    return () => stop()
  }, [stop])

  return { supported, enabled, level, error, enableMicrophone }
}
