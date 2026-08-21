import { useCallback, useEffect, useRef, useState } from 'react'

export type BreathInputState = {
  supported: boolean
  enabled: boolean
  level: number
  error: string | null
  start: () => Promise<boolean>
  stop: () => void
}

export function useBreathInput(): BreathInputState {
  const [enabled, setEnabled] = useState(false)
  const [level, setLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const frameRef = useRef<number | null>(null)

  const supported = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

  const stop = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null

    sourceRef.current?.disconnect()
    analyserRef.current?.disconnect()
    streamRef.current?.getTracks().forEach((track) => track.stop())

    if (contextRef.current && contextRef.current.state !== 'closed') {
      void contextRef.current.close()
    }

    streamRef.current = null
    contextRef.current = null
    sourceRef.current = null
    analyserRef.current = null
    setLevel(0)
    setEnabled(false)
  }, [])

  const start = useCallback(async () => {
    if (enabled) return true
    setError(null)

    if (!supported) {
      setError('Este navegador no ofrece entrada de micrófono compatible.')
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
        },
      })
      streamRef.current = stream

      const context = new AudioContext()
      contextRef.current = context
      await context.resume()

      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.72
      source.connect(analyser)

      sourceRef.current = source
      analyserRef.current = analyser
      setEnabled(true)

      const samples = new Uint8Array(analyser.fftSize)
      const sample = () => {
        analyser.getByteTimeDomainData(samples)
        let sumSquares = 0

        for (const value of samples) {
          const normalized = (value - 128) / 128
          sumSquares += normalized * normalized
        }

        const rms = Math.sqrt(sumSquares / samples.length)
        setLevel(Math.min(1, rms * 7.5))
        frameRef.current = requestAnimationFrame(sample)
      }

      sample()
      return true
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'No se pudo abrir el micrófono.'
      setError(message)
      stop()
      return false
    }
  }, [enabled, stop, supported])

  useEffect(() => stop, [stop])

  return { supported, enabled, level, error, start, stop }
}
