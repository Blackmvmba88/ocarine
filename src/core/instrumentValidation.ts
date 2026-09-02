import type { InstrumentProfile } from './instrumentProfiles'
import type { OcarinaNote } from './notes'

export type PitchMeasurement = {
  note: string
  expectedFrequency: number
  measuredFrequency: number
  centsError: number
  capturedAt: string
}

export type PitchDisposition = 'in-tune' | 'flat' | 'sharp'

export type InstrumentValidationSummary = {
  profileId: string
  toleranceCents: number
  measuredNotes: number
  requiredNotes: number
  missingNotes: string[]
  outOfTolerance: PitchMeasurement[]
  maxAbsoluteCentsError: number | null
  readyForPhysicalValidation: boolean
}

export function frequencyToCents(measuredFrequency: number, referenceFrequency: number): number {
  if (measuredFrequency <= 0 || referenceFrequency <= 0) {
    throw new Error('Frequencies must be greater than zero.')
  }

  return 1200 * Math.log2(measuredFrequency / referenceFrequency)
}

export function createPitchMeasurement(
  note: OcarinaNote,
  measuredFrequency: number,
  capturedAt = new Date().toISOString(),
): PitchMeasurement {
  return {
    note: note.name,
    expectedFrequency: note.frequency,
    measuredFrequency,
    centsError: frequencyToCents(measuredFrequency, note.frequency),
    capturedAt,
  }
}

export function classifyPitch(centsError: number, toleranceCents = 10): PitchDisposition {
  if (Math.abs(centsError) <= toleranceCents) return 'in-tune'
  return centsError < 0 ? 'flat' : 'sharp'
}

export function summarizeInstrumentValidation(
  profile: InstrumentProfile,
  measurements: PitchMeasurement[],
  toleranceCents = 10,
): InstrumentValidationSummary {
  const latestByNote = new Map<string, PitchMeasurement>()

  for (const measurement of measurements) {
    if (!profile.notes.some((note) => note.name === measurement.note)) continue
    latestByNote.set(measurement.note, measurement)
  }

  const missingNotes = profile.notes
    .filter((note) => !latestByNote.has(note.name))
    .map((note) => note.name)

  const acceptedMeasurements = [...latestByNote.values()]
  const outOfTolerance = acceptedMeasurements.filter(
    (measurement) => Math.abs(measurement.centsError) > toleranceCents,
  )
  const maxAbsoluteCentsError = acceptedMeasurements.length
    ? Math.max(...acceptedMeasurements.map((measurement) => Math.abs(measurement.centsError)))
    : null

  return {
    profileId: profile.id,
    toleranceCents,
    measuredNotes: acceptedMeasurements.length,
    requiredNotes: profile.notes.length,
    missingNotes,
    outOfTolerance,
    maxAbsoluteCentsError,
    readyForPhysicalValidation: missingNotes.length === 0 && outOfTolerance.length === 0,
  }
}
