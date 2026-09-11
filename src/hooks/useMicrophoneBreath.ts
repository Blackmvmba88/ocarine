import { useCallback, useEffect, useRef, useState } from 'react'

export interface MicrophoneBreathState {
  supported: boolean
  enabled: boolean
  calibrated: boolean
  level: number
  noiseFloor: number
  isBlowing: boolean
  error: string | null
  enableMicrophone: () => Promise<void>
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

export function useMicrophoneBreath(): MicrophoneBreathState {
  const supported = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)
  const [enabled, setEnabled] = useState(false)
  const [calibrated, setCalibrated] = useState(false)
  const [level, setLevel] = useState(0)
  const [noiseFloor, setNoiseFloor] = useState(0)
  const [isBlowing, setIsBlowing] = useState(false)
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
      setCalibrated(false)
      setLevel(0)
      setNoiseFloor(0)
      setIsBlowing(false)

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
      const highpass = context.createBiquadFilter()
      const analyser = context.createAnalyser()

      // Breath is broadband and carries useful energy above the speech-heavy low band.
      // A high-pass filter makes blowing more dominant than room hum or normal speech.
      highpass.type = 'highpass'
      highpass.frequency.value = 900
      highpass.Q.value = 0.55

      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.25
      source.connect(highpass)
      highpass.connect(analyser)

      streamRef.current = stream
      contextRef.current = context
      setEnabled(true)

      const samples = new Float32Array(analyser.fftSize)
      const calibrationStartedAt = performance.now()
      const calibrationDurationMs = 900
      let calibrationEnergy = 0
      let calibrationFrames = 0
      let localNoiseFloor = 0.008
      let localCalibrated = false
      let smoothedLevel = 0
      let uiFloorCounter = 0

      const readBreath = () => {
        analyser.getFloatTimeDomainData(samples)

        let energy = 0
        for (let index = 0; index < samples.length; index += 1) {
          energy += samples[index] * samples[index]
        }

        const rms = Math.sqrt(energy / samples.length)

        if (!localCalibrated) {
          calibrationEnergy += rms
          calibrationFrames += 1

          if (
            performance.now() - calibrationStartedAt >= calibrationDurationMs
            && calibrationFrames >= 12
          ) {
            const ambientAverage = calibrationEnergy / calibrationFrames
            localNoiseFloor = Math.max(0.0025, ambientAverage * 1.8)
            localCalibrated = true
            setNoiseFloor(localNoiseFloor)
            setCalibrated(true)
          }

          setLevel(0)
          setIsBlowing(false)
          frameRef.current = requestAnimationFrame(readBreath)
          return
        }

        // Slowly follow a changing room only while the input is close to the ambient floor.
        if (rms < localNoiseFloor * 1.9) {
          localNoiseFloor = localNoiseFloor * 0.997 + rms * 0.003
        }

        const gate = localNoiseFloor * 1.55 + 0.0025
        const ceiling = Math.max(gate + 0.02, localNoiseFloor * 8 + 0.06)
        const normalized = clamp01((rms - gate) / (ceiling - gate))

        // Fast attack, slower release: the note starts promptly but does not chatter at the gate.
        const smoothing = normalized > smoothedLevel ? 0.38 : 0.12
        smoothedLevel += (normalized - smoothedLevel) * smoothing
        if (smoothedLevel < 0.012) smoothedLevel = 0

        const blowing = smoothedLevel >= 0.08
        setLevel(smoothedLevel)
        setIsBlowing(blowing)

        uiFloorCounter += 1
        if (uiFloorCounter >= 18) {
          uiFloorCounter = 0
          setNoiseFloor(localNoiseFloor)
        }

        frameRef.current = requestAnimationFrame(readBreath)
      }

      readBreath()
    } catch (cause) {
      stop()
      setEnabled(false)
      setCalibrated(false)
      setLevel(0)
      setNoiseFloor(0)
      setIsBlowing(false)
      setError(cause instanceof Error ? cause.message : 'Microphone permission failed')
    }
  }, [enabled, stop, supported])

  useEffect(() => {
    return () => stop()
  }, [stop])

  return {
    supported,
    enabled,
    calibrated,
    level,
    noiseFloor,
    isBlowing,
    error,
    enableMicrophone,
  }
}
