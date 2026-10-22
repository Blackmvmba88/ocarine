import test from 'node:test'
import assert from 'node:assert/strict'
import { scorePerformance } from '../src/core/practiceScoring'
import type { PracticeExercise } from '../src/core/exercises'
import type { PerformanceNoteEvent } from '../src/core/performance'

const exercise: PracticeExercise = {
  id: 'timing-contract',
  title: 'Timing contract',
  bpm: 120,
  beatsPerMeasure: 4,
  beatUnit: 4,
  countInBeats: 0,
  steps: [{ note: 'C5', beats: 1 }, { note: 'D5', beats: 1 }],
  sections: [],
}

function performed(note: string, start: number, duration = 500): PerformanceNoteEvent {
  return {
    note,
    midi: note === 'C5' ? 72 : 74,
    frequency: note === 'C5' ? 523.251 : 587.33,
    startedAtMs: start,
    durationMs: duration,
    breathPeak: 0.7,
    source: 'keyboard',
  }
}

test('perfect performance scores 100 independent of recorder offset', () => {
  const score = scorePerformance(exercise, [
    performed('C5', 12_000),
    performed('D5', 12_500),
  ])
  assert.equal(score.score, 100)
  assert.equal(score.noteAccuracy, 100)
  assert.equal(score.timingAccuracy, 100)
  assert.equal(score.durationAccuracy, 100)
  assert.equal(score.matchedSteps, 2)
})

test('wrong note cannot receive full credit even with perfect timing', () => {
  const score = scorePerformance(exercise, [
    performed('D5', 0),
    performed('D5', 500),
  ])
  assert.equal(score.noteAccuracy, 50)
  assert.ok(score.score < 100)
  assert.equal(score.steps[0].noteCorrect, false)
})

test('missing second note is recorded as a miss', () => {
  const score = scorePerformance(exercise, [performed('C5', 0)])
  assert.equal(score.totalSteps, 2)
  assert.equal(score.matchedSteps, 1)
  assert.equal(score.steps[1].timingGrade, 'miss')
  assert.equal(score.steps[1].durationGrade, 'miss')
})

test('empty exercise yields finite zero metrics', () => {
  const score = scorePerformance({ ...exercise, steps: [] }, [])
  assert.equal(score.score, 0)
  assert.equal(score.totalSteps, 0)
  assert.equal(score.averageAbsTimingErrorMs, null)
})
