import { useCallback, useEffect, useRef, useState } from 'react'

export type BreathInputState = {
  supported: boolean
  enabled: boolean
  calibrating: boolean
  level: number
  rawLevel: number
  noiseFloor: number
  error: string | null
  start: () => Promise<boolean>
  stop: () => void
}

const CALIBRATION_FRAMES = 30
const DISPLAY_GAIN = 7.5
const UI_UPDATE_INTERVAL_MS = 33

function percentile(values: number[], ratio: number): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio))
  return sorted[index]
}

export function useBreathInput(): BreathInputState {
  const [enabled, setEnabled] = useState(false)
  const [calibrating, setCalibrating] = useState(false)
  const [level, setLevel] = useState(0)
  const [rawLevel, setRawLevel] = useState(0)
  const [noiseFloor, setNoiseFloor] = useState(0)
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
    setRawLevel(0)
    setNoiseFloor(0)
    setCalibrating(false)
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
      setCalibrating(true)

      const samples = new Uint8Array(analyser.fftSize)
      const calibrationSamples: number[] = []
      let calibratedNoiseFloor = 0
      let lastUiUpdateAt = 0

      const sample = (now: number) => {
        analyser.getByteTimeDomainData(samples)
        let sumSquares = 0

        for (const value of samples) {
          const normalized = (value - 128) / 128
          sumSquares += normalized * normalized
        }

        const rms = Math.sqrt(sumSquares / samples.length)
        const displayedRaw = Math.min(1, rms * DISPLAY_GAIN)

        if (calibrationSamples.length < CALIBRATION_FRAMES) {
          calibrationSamples.push(rms)

          if (now - lastUiUpdateAt >= UI_UPDATE_INTERVAL_MS) {
            lastUiUpdateAt = now
            setRawLevel(displayedRaw)
            setLevel(0)
          }

          if (calibrationSamples.length === CALIBRATION_FRAMES) {
            calibratedNoiseFloor = percentile(calibrationSamples, 0.2) * 1.2
            setNoiseFloor(Math.min(1, calibratedNoiseFloor * DISPLAY_GAIN))
            setCalibrating(false)
          }
        } else if (now - lastUiUpdateAt >= UI_UPDATE_INTERVAL_MS) {
          lastUiUpdateAt = now
          const aboveAmbient = Math.max(0, rms - calibratedNoiseFloor)
          setRawLevel(displayedRaw)
          setLevel(Math.min(1, aboveAmbient * DISPLAY_GAIN))
        }

        frameRef.current = requestAnimationFrame(sample)
      }

      frameRef.current = requestAnimationFrame(sample)
      return true
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'No se pudo abrir el micrófono.'
      setError(message)
      stop()
      return false
    }
  }, [enabled, stop, supported])

  useEffect(() => stop, [stop])

  return {
    supported,
    enabled,
    calibrating,
    level,
    rawLevel,
    noiseFloor,
    error,
    start,
    stop,
  }
}
