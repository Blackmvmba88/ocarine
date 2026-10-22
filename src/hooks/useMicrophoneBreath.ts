import { useBreathInput } from './useBreathInput'

/** Compatibility adapter; microphone capture and calibration live in useBreathInput. */
export function useMicrophoneBreath() {
  const mic = useBreathInput()
  return {
    supported: mic.supported,
    enabled: mic.enabled,
    calibrated: mic.enabled && !mic.calibrating,
    level: mic.level,
    noiseFloor: mic.noiseFloor,
    isBlowing: mic.level >= 0.08,
    error: mic.error,
    enableMicrophone: async () => { await mic.start() },
  }
}

export type MicrophoneBreathState = ReturnType<typeof useMicrophoneBreath>
