import type { InstrumentProfile } from './instrumentProfiles'
import type { OcarinaNote } from './notes'

export type PitchMeasurement = {
  note: string
  expectedFrequency: number
  measuredFrequency: number
  centsError: number
  capturedAt: string
}

export type PhysicalPitchMeasurement = PitchMeasurement & {
  trial: number
  breathLevel?: number
  breathPressurePa?: number
  holeDiameterMm?: number
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

export type PhysicalValidationCriteria = {
  toleranceCents: number
  maxStdDevCents: number
  minSamplesPerNote: number
  requireBreathReference: boolean
}

export type PhysicalNoteValidation = {
  note: string
  expectedFrequency: number
  sampleCount: number
  meanFrequency: number
  meanCentsError: number
  stdDevCents: number
  minCentsError: number
  maxCentsError: number
  meanBreathLevel: number | null
  meanBreathPressurePa: number | null
  meanHoleDiameterMm: number | null
  disposition: PitchDisposition
  repeatable: boolean
  breathReferenced: boolean
  accepted: boolean
}

export type PhysicalInstrumentValidationSummary = {
  profileId: string
  criteria: PhysicalValidationCriteria
  requiredNotes: number
  measuredNotes: number
  totalSamples: number
  missingNotes: string[]
  insufficientSamples: string[]
  unstableNotes: string[]
  outOfToleranceNotes: string[]
  missingBreathReferenceNotes: string[]
  notes: PhysicalNoteValidation[]
  maxAbsoluteMeanCentsError: number | null
  maxStdDevCents: number | null
  readyForProfilePromotion: boolean
}

export const DEFAULT_PHYSICAL_VALIDATION_CRITERIA: PhysicalValidationCriteria = {
  toleranceCents: 10,
  maxStdDevCents: 5,
  minSamplesPerNote: 3,
  requireBreathReference: true,
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

export function createPhysicalPitchMeasurement(
  note: OcarinaNote,
  measuredFrequency: number,
  options: {
    trial: number
    capturedAt?: string
    breathLevel?: number
    breathPressurePa?: number
    holeDiameterMm?: number
  },
): PhysicalPitchMeasurement {
  return {
    ...createPitchMeasurement(note, measuredFrequency, options.capturedAt),
    trial: options.trial,
    breathLevel: options.breathLevel,
    breathPressurePa: options.breathPressurePa,
    holeDiameterMm: options.holeDiameterMm,
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

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function standardDeviation(values: number[]): number {
  if (values.length <= 1) return 0
  const average = mean(values)
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

function optionalMean(values: Array<number | undefined>): number | null {
  const present = values.filter((value): value is number => Number.isFinite(value))
  return present.length ? mean(present) : null
}

export function summarizePhysicalInstrumentValidation(
  profile: InstrumentProfile,
  measurements: PhysicalPitchMeasurement[],
  criteria: Partial<PhysicalValidationCriteria> = {},
): PhysicalInstrumentValidationSummary {
  const resolvedCriteria = { ...DEFAULT_PHYSICAL_VALIDATION_CRITERIA, ...criteria }
  const samplesByNote = new Map<string, PhysicalPitchMeasurement[]>()

  for (const measurement of measurements) {
    if (!profile.notes.some((note) => note.name === measurement.note)) continue
    const samples = samplesByNote.get(measurement.note) ?? []
    samples.push(measurement)
    samplesByNote.set(measurement.note, samples)
  }

  const noteSummaries: PhysicalNoteValidation[] = profile.notes.flatMap((note) => {
    const samples = samplesByNote.get(note.name) ?? []
    if (!samples.length) return []

    const cents = samples.map((sample) => sample.centsError)
    const frequencies = samples.map((sample) => sample.measuredFrequency)
    const meanCentsError = mean(cents)
    const stdDevCents = standardDeviation(cents)
    const breathReferenced = samples.every(
      (sample) => Number.isFinite(sample.breathPressurePa) || Number.isFinite(sample.breathLevel),
    )
    const enoughSamples = samples.length >= resolvedCriteria.minSamplesPerNote
    const repeatable = stdDevCents <= resolvedCriteria.maxStdDevCents
    const inTolerance = Math.abs(meanCentsError) <= resolvedCriteria.toleranceCents

    return [{
      note: note.name,
      expectedFrequency: note.frequency,
      sampleCount: samples.length,
      meanFrequency: mean(frequencies),
      meanCentsError,
      stdDevCents,
      minCentsError: Math.min(...cents),
      maxCentsError: Math.max(...cents),
      meanBreathLevel: optionalMean(samples.map((sample) => sample.breathLevel)),
      meanBreathPressurePa: optionalMean(samples.map((sample) => sample.breathPressurePa)),
      meanHoleDiameterMm: optionalMean(samples.map((sample) => sample.holeDiameterMm)),
      disposition: classifyPitch(meanCentsError, resolvedCriteria.toleranceCents),
      repeatable,
      breathReferenced,
      accepted:
        enoughSamples &&
        repeatable &&
        inTolerance &&
        (!resolvedCriteria.requireBreathReference || breathReferenced),
    }]
  })

  const byName = new Map(noteSummaries.map((summary) => [summary.note, summary]))
  const missingNotes = profile.notes.filter((note) => !byName.has(note.name)).map((note) => note.name)
  const insufficientSamples = noteSummaries
    .filter((summary) => summary.sampleCount < resolvedCriteria.minSamplesPerNote)
    .map((summary) => summary.note)
  const unstableNotes = noteSummaries.filter((summary) => !summary.repeatable).map((summary) => summary.note)
  const outOfToleranceNotes = noteSummaries
    .filter((summary) => Math.abs(summary.meanCentsError) > resolvedCriteria.toleranceCents)
    .map((summary) => summary.note)
  const missingBreathReferenceNotes = resolvedCriteria.requireBreathReference
    ? noteSummaries.filter((summary) => !summary.breathReferenced).map((summary) => summary.note)
    : []

  return {
    profileId: profile.id,
    criteria: resolvedCriteria,
    requiredNotes: profile.notes.length,
    measuredNotes: noteSummaries.length,
    totalSamples: noteSummaries.reduce((sum, summary) => sum + summary.sampleCount, 0),
    missingNotes,
    insufficientSamples,
    unstableNotes,
    outOfToleranceNotes,
    missingBreathReferenceNotes,
    notes: noteSummaries,
    maxAbsoluteMeanCentsError: noteSummaries.length
      ? Math.max(...noteSummaries.map((summary) => Math.abs(summary.meanCentsError)))
      : null,
    maxStdDevCents: noteSummaries.length
      ? Math.max(...noteSummaries.map((summary) => summary.stdDevCents))
      : null,
    readyForProfilePromotion:
      missingNotes.length === 0 &&
      insufficientSamples.length === 0 &&
      unstableNotes.length === 0 &&
      outOfToleranceNotes.length === 0 &&
      missingBreathReferenceNotes.length === 0,
  }
}
