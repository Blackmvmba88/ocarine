import { useCallback, useEffect, useRef, useState } from 'react'

export type BreathInputState = {
  supported: boolean
  enabled: boolean
  starting: boolean
  calibrating: boolean
  level: number
  rawLevel: number
  noiseFloor: number
  error: string | null
  start: () => Promise<boolean>
  stop: () => void
}

const CALIBRATION_DURATION_MS = 1200
const CALIBRATION_PERCENTILE = 0.75
const NOISE_FLOOR_HEADROOM = 1.1
const DISPLAY_GAIN = 7.5
const ATTACK_BLEND = 0.55
const RELEASE_BLEND = 0.22
const UI_UPDATE_INTERVAL_MS = 33

function percentile(values: number[], ratio: number): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio))
  return sorted[index]
}

export function useBreathInput(): BreathInputState {
  const [starting, setStarting] = useState(false)
  const generationRef = useRef(0)
  const pendingRef = useRef(false)
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
    generationRef.current += 1
    pendingRef.current = false
    setStarting(false)
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
    if (streamRef.current) return true
    if (pendingRef.current) return false
    setError(null)

    if (!supported) {
      setError('Este navegador no ofrece entrada de micrófono compatible.')
      return false
    }

    const generation = ++generationRef.current
    pendingRef.current = true
    setStarting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
        },
      })
      if (generation !== generationRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return false
      }
      streamRef.current = stream

      const context = new AudioContext()
      contextRef.current = context
      await context.resume()
      if (generation !== generationRef.current) return false

      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.72
      const highpass = context.createBiquadFilter()
      highpass.type = 'highpass'
      highpass.frequency.value = 900
      source.connect(highpass)
      highpass.connect(analyser)

      sourceRef.current = source
      analyserRef.current = analyser
      setEnabled(true)
      setCalibrating(true)

      const samples = new Float32Array(analyser.fftSize)
      const calibrationSamples: number[] = []
      let calibrationStartedAt: number | null = null
      let calibratedNoiseFloor = 0
      let smoothedLevel = 0
      let lastUiUpdateAt = 0

      const sample = (now: number) => {
        if (generation !== generationRef.current) return
        analyser.getFloatTimeDomainData(samples)
        let sumSquares = 0

        for (const value of samples) {
          sumSquares += value * value
        }

        const rms = Math.sqrt(sumSquares / samples.length)
        const displayedRaw = Math.min(1, rms * DISPLAY_GAIN)
        calibrationStartedAt ??= now
        const calibrationElapsed = now - calibrationStartedAt

        if (calibrationElapsed < CALIBRATION_DURATION_MS) {
          calibrationSamples.push(rms)

          if (now - lastUiUpdateAt >= UI_UPDATE_INTERVAL_MS) {
            lastUiUpdateAt = now
            setRawLevel(displayedRaw)
            setLevel(0)
          }
        } else {
          if (calibrationSamples.length) {
            calibratedNoiseFloor = percentile(calibrationSamples, CALIBRATION_PERCENTILE) * NOISE_FLOOR_HEADROOM
            calibrationSamples.length = 0
            setNoiseFloor(Math.min(1, calibratedNoiseFloor * DISPLAY_GAIN))
            setCalibrating(false)
          }

          if (now - lastUiUpdateAt >= UI_UPDATE_INTERVAL_MS) {
            lastUiUpdateAt = now
            const aboveAmbient = Math.max(0, rms - calibratedNoiseFloor)
            const targetLevel = Math.min(1, aboveAmbient * DISPLAY_GAIN)
            const blend = targetLevel >= smoothedLevel ? ATTACK_BLEND : RELEASE_BLEND
            smoothedLevel += (targetLevel - smoothedLevel) * blend

            setRawLevel(displayedRaw)
            setLevel(smoothedLevel)
          }
        }

        frameRef.current = requestAnimationFrame(sample)
      }

      frameRef.current = requestAnimationFrame(sample)
      return true
    } catch (reason) {
      if (generation !== generationRef.current) return false
      const message = reason instanceof Error ? reason.message : 'No se pudo abrir el micrófono.'
      setError(message)
      stop()
      return false
    } finally {
      if (generation === generationRef.current) {
        pendingRef.current = false
        setStarting(false)
      }
    }
  }, [stop, supported])

  useEffect(() => stop, [stop])

  return {
    supported,
    enabled,
    starting,
    calibrating,
    level,
    rawLevel,
    noiseFloor,
    error,
    start,
    stop,
  }
}
