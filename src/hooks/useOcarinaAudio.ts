import { useCallback, useEffect, useRef, useState } from 'react'

function createNoiseBuffer(context: AudioContext, seconds = 2) {
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate)
  const data = buffer.getChannelData(0)

  for (let index = 0; index < data.length; index += 1) {
    data[index] = Math.random() * 2 - 1
  }

  return buffer
}

export function useOcarinaAudio(frequency: number, breath: number) {
  const [enabled, setEnabled] = useState(false)
  const contextRef = useRef<AudioContext | null>(null)
  const fundamentalRef = useRef<OscillatorNode | null>(null)
  const harmonicRef = useRef<OscillatorNode | null>(null)
  const harmonicGainRef = useRef<GainNode | null>(null)
  const voiceGainRef = useRef<GainNode | null>(null)
  const toneFilterRef = useRef<BiquadFilterNode | null>(null)
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const noiseFilterRef = useRef<BiquadFilterNode | null>(null)
  const noiseGainRef = useRef<GainNode | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)

  const enableAudio = useCallback(async () => {
    if (!contextRef.current) {
      const context = new AudioContext()

      const fundamental = context.createOscillator()
      const harmonic = context.createOscillator()
      const harmonicGain = context.createGain()
      const toneFilter = context.createBiquadFilter()
      const voiceGain = context.createGain()

      const noise = context.createBufferSource()
      const noiseFilter = context.createBiquadFilter()
      const noiseGain = context.createGain()
      const masterGain = context.createGain()

      fundamental.type = 'sine'
      harmonic.type = 'sine'
      harmonicGain.gain.value = 0.13

      toneFilter.type = 'lowpass'
      toneFilter.frequency.value = 3200
      toneFilter.Q.value = 0.75
      voiceGain.gain.value = 0

      noise.buffer = createNoiseBuffer(context)
      noise.loop = true
      noiseFilter.type = 'bandpass'
      noiseFilter.frequency.value = 4200
      noiseFilter.Q.value = 0.65
      noiseGain.gain.value = 0

      masterGain.gain.value = 0.8

      fundamental.connect(toneFilter)
      harmonic.connect(harmonicGain)
      harmonicGain.connect(toneFilter)
      toneFilter.connect(voiceGain)
      voiceGain.connect(masterGain)

      noise.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      noiseGain.connect(masterGain)

      masterGain.connect(context.destination)

      fundamental.start()
      harmonic.start()
      noise.start()

      contextRef.current = context
      fundamentalRef.current = fundamental
      harmonicRef.current = harmonic
      harmonicGainRef.current = harmonicGain
      voiceGainRef.current = voiceGain
      toneFilterRef.current = toneFilter
      noiseSourceRef.current = noise
      noiseFilterRef.current = noiseFilter
      noiseGainRef.current = noiseGain
      masterGainRef.current = masterGain
    }

    await contextRef.current.resume()
    setEnabled(true)
  }, [])

  useEffect(() => {
    const context = contextRef.current
    const fundamental = fundamentalRef.current
    const harmonic = harmonicRef.current
    const harmonicGain = harmonicGainRef.current
    const voiceGain = voiceGainRef.current
    const toneFilter = toneFilterRef.current
    const noiseFilter = noiseFilterRef.current
    const noiseGain = noiseGainRef.current

    if (
      !enabled
      || !context
      || !fundamental
      || !harmonic
      || !harmonicGain
      || !voiceGain
      || !toneFilter
      || !noiseFilter
      || !noiseGain
    ) return

    const now = context.currentTime
    const shapedBreath = Math.pow(Math.max(0, Math.min(1, breath)), 1.22)
    const pitchPressureCents = shapedBreath * 4.5

    fundamental.frequency.setTargetAtTime(frequency, now, 0.012)
    harmonic.frequency.setTargetAtTime(frequency * 2, now, 0.012)
    fundamental.detune.setTargetAtTime(pitchPressureCents, now, 0.03)
    harmonic.detune.setTargetAtTime(pitchPressureCents, now, 0.03)

    // A little more harmonic brightness and air as the player blows harder.
    harmonicGain.gain.setTargetAtTime(0.08 + shapedBreath * 0.11, now, 0.04)
    toneFilter.frequency.setTargetAtTime(2400 + shapedBreath * 3000, now, 0.04)
    noiseFilter.frequency.setTargetAtTime(3600 + shapedBreath * 1500, now, 0.05)

    const release = breath > 0 ? 0.022 : 0.075
    voiceGain.gain.setTargetAtTime(shapedBreath * 0.2, now, release)
    noiseGain.gain.setTargetAtTime(shapedBreath * 0.018, now, breath > 0 ? 0.03 : 0.08)
  }, [enabled, frequency, breath])

  useEffect(() => {
    return () => {
      try { fundamentalRef.current?.stop() } catch { /* already stopped */ }
      try { harmonicRef.current?.stop() } catch { /* already stopped */ }
      try { noiseSourceRef.current?.stop() } catch { /* already stopped */ }
      void contextRef.current?.close()
    }
  }, [])

  return { enabled, enableAudio }
}
