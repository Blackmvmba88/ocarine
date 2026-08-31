import type { PracticeExercise } from './exercises'
import type { PerformanceNoteEvent } from './performance'

export type TimingGrade = 'perfect' | 'good' | 'early' | 'late' | 'miss'
export type DurationGrade = 'perfect' | 'good' | 'short' | 'long' | 'miss'

export type ScoredPracticeStep = {
  index: number
  expectedNote: string
  playedNote: string | null
  expectedAtMs: number
  playedAtMs: number | null
  timingErrorMs: number | null
  timingGrade: TimingGrade
  expectedDurationMs: number
  playedDurationMs: number | null
  durationErrorMs: number | null
  durationGrade: DurationGrade
  noteCorrect: boolean
  points: number
}

export type PracticeScore = {
  score: number
  noteAccuracy: number
  timingAccuracy: number
  durationAccuracy: number
  averageAbsTimingErrorMs: number | null
  averageAbsDurationErrorMs: number | null
  matchedSteps: number
  totalSteps: number
  steps: ScoredPracticeStep[]
}

const PERFECT_WINDOW_MS = 90
const GOOD_WINDOW_MS = 180
const TIMING_SEARCH_WINDOW_MS = 520
const PERFECT_DURATION_RATIO = 0.15
const GOOD_DURATION_RATIO = 0.3
const MAX_DURATION_RATIO = 0.75

function exerciseTiming(exercise: PracticeExercise) {
  const beatMs = 60_000 / exercise.bpm
  let beat = 0

  return exercise.steps.map((step) => {
    const timing = {
      onsetMs: beat * beatMs,
      durationMs: step.beats * beatMs,
    }
    beat += step.beats
    return timing
  })
}

function timingGrade(errorMs: number | null): TimingGrade {
  if (errorMs === null) return 'miss'
  const absolute = Math.abs(errorMs)
  if (absolute <= PERFECT_WINDOW_MS) return 'perfect'
  if (absolute <= GOOD_WINDOW_MS) return 'good'
  return errorMs < 0 ? 'early' : 'late'
}

function timingPoints(errorMs: number | null) {
  if (errorMs === null) return 0
  const absolute = Math.abs(errorMs)
  if (absolute <= PERFECT_WINDOW_MS) return 100
  if (absolute <= GOOD_WINDOW_MS) return 82
  if (absolute <= TIMING_SEARCH_WINDOW_MS) return Math.max(20, 70 - (absolute - GOOD_WINDOW_MS) * 0.14)
  return 0
}

function durationRatio(errorMs: number, expectedDurationMs: number) {
  return Math.abs(errorMs) / Math.max(1, expectedDurationMs)
}

function durationGrade(
  errorMs: number | null,
  expectedDurationMs: number,
): DurationGrade {
  if (errorMs === null) return 'miss'
  const ratio = durationRatio(errorMs, expectedDurationMs)
  if (ratio <= PERFECT_DURATION_RATIO) return 'perfect'
  if (ratio <= GOOD_DURATION_RATIO) return 'good'
  return errorMs < 0 ? 'short' : 'long'
}

function durationPoints(errorMs: number | null, expectedDurationMs: number) {
  if (errorMs === null) return 0
  const ratio = durationRatio(errorMs, expectedDurationMs)
  if (ratio <= PERFECT_DURATION_RATIO) return 100
  if (ratio <= GOOD_DURATION_RATIO) return 82
  if (ratio >= MAX_DURATION_RATIO) return 20

  const progress = (ratio - GOOD_DURATION_RATIO) / (MAX_DURATION_RATIO - GOOD_DURATION_RATIO)
  return 70 - progress * 50
}

export function scorePerformance(
  exercise: PracticeExercise,
  events: PerformanceNoteEvent[],
): PracticeScore {
  const expected = exerciseTiming(exercise)

  if (!exercise.steps.length) {
    return {
      score: 0,
      noteAccuracy: 0,
      timingAccuracy: 0,
      durationAccuracy: 0,
      averageAbsTimingErrorMs: null,
      averageAbsDurationErrorMs: null,
      matchedSteps: 0,
      totalSteps: 0,
      steps: [],
    }
  }

  // Normalize the performance to its first attack. This deliberately removes
  // recorder-start / count-in offset while preserving the player's relative timing.
  const firstEventAt = events[0]?.startedAtMs ?? 0
  const normalized = events.map((event) => ({
    event,
    onsetMs: event.startedAtMs - firstEventAt,
  }))

  const used = new Set<number>()
  const scoredSteps: ScoredPracticeStep[] = exercise.steps.map((step, index) => {
    const expectedAtMs = expected[index].onsetMs
    const expectedDurationMs = expected[index].durationMs
    let bestIndex = -1
    let bestDistance = Number.POSITIVE_INFINITY

    normalized.forEach((candidate, eventIndex) => {
      if (used.has(eventIndex)) return
      const distance = Math.abs(candidate.onsetMs - expectedAtMs)
      if (distance < bestDistance && distance <= TIMING_SEARCH_WINDOW_MS) {
        bestIndex = eventIndex
        bestDistance = distance
      }
    })

    if (bestIndex < 0) {
      return {
        index,
        expectedNote: step.note,
        playedNote: null,
        expectedAtMs,
        playedAtMs: null,
        timingErrorMs: null,
        timingGrade: 'miss' as const,
        expectedDurationMs,
        playedDurationMs: null,
        durationErrorMs: null,
        durationGrade: 'miss' as const,
        noteCorrect: false,
        points: 0,
      }
    }

    used.add(bestIndex)
    const candidate = normalized[bestIndex]
    const timingErrorMs = candidate.onsetMs - expectedAtMs
    const durationErrorMs = candidate.event.durationMs - expectedDurationMs
    const noteCorrect = candidate.event.note === step.note
    const timing = timingPoints(timingErrorMs)
    const duration = durationPoints(durationErrorMs, expectedDurationMs)
    const expressionPoints = timing * 0.3 + duration * 0.25
    const points = noteCorrect
      ? 45 + expressionPoints
      : expressionPoints * 0.25

    return {
      index,
      expectedNote: step.note,
      playedNote: candidate.event.note,
      expectedAtMs,
      playedAtMs: candidate.onsetMs,
      timingErrorMs,
      timingGrade: timingGrade(timingErrorMs),
      expectedDurationMs,
      playedDurationMs: candidate.event.durationMs,
      durationErrorMs,
      durationGrade: durationGrade(durationErrorMs, expectedDurationMs),
      noteCorrect,
      points,
    }
  })

  const noteCorrectCount = scoredSteps.filter((step) => step.noteCorrect).length
  const matched = scoredSteps.filter((step) => step.playedNote !== null)
  const timingValues = scoredSteps
    .map((step) => step.timingErrorMs)
    .filter((value): value is number => value !== null)
    .map(Math.abs)
  const durationValues = scoredSteps
    .map((step) => step.durationErrorMs)
    .filter((value): value is number => value !== null)
    .map(Math.abs)

  const score = scoredSteps.reduce((sum, step) => sum + step.points, 0) / scoredSteps.length
  const timingAccuracy = matched.length
    ? matched.reduce((sum, step) => sum + timingPoints(step.timingErrorMs), 0) / matched.length
    : 0
  const durationAccuracy = matched.length
    ? matched.reduce(
      (sum, step) => sum + durationPoints(step.durationErrorMs, step.expectedDurationMs),
      0,
    ) / matched.length
    : 0

  return {
    score: Math.round(score),
    noteAccuracy: Math.round((noteCorrectCount / scoredSteps.length) * 100),
    timingAccuracy: Math.round(timingAccuracy),
    durationAccuracy: Math.round(durationAccuracy),
    averageAbsTimingErrorMs: timingValues.length
      ? Math.round(timingValues.reduce((sum, value) => sum + value, 0) / timingValues.length)
      : null,
    averageAbsDurationErrorMs: durationValues.length
      ? Math.round(durationValues.reduce((sum, value) => sum + value, 0) / durationValues.length)
      : null,
    matchedSteps: matched.length,
    totalSteps: scoredSteps.length,
    steps: scoredSteps,
  }
}
