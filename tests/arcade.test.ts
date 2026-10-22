import test from 'node:test'
import assert from 'node:assert/strict'
import { ARCADE_MELODY, initialArcadeState, judgeArcadeNote, startArcade } from '../src/core/arcade'

test('arcade starts with zero score and first musical objective', () => {
  const state = startArcade()
  assert.equal(state.mode, 'playing')
  assert.equal(state.score, 0)
  assert.equal(ARCADE_MELODY[state.step], 'C5')
})

test('only the expected pitch advances the stage', () => {
  const wrong = judgeArcadeNote(startArcade(), 'G5')
  assert.equal(wrong.step, 0)
  assert.equal(wrong.misses, 1)
  assert.equal(wrong.combo, 0)
  const right = judgeArcadeNote(wrong, 'C5')
  assert.equal(right.step, 1)
  assert.equal(right.score, 100)
  assert.equal(right.combo, 1)
})

test('completing seven notes unlocks complete state with accumulated combo', () => {
  let state = startArcade()
  for (const note of ARCADE_MELODY) state = judgeArcadeNote(state, note)
  assert.equal(state.mode, 'complete')
  assert.equal(state.hits, 7)
  assert.equal(state.bestCombo, 7)
  assert.ok(state.score > 700)
  assert.deepEqual(judgeArcadeNote(state, 'C5'), state)
})

test('miss breaks the combo but retains the best streak', () => {
  let state = judgeArcadeNote(startArcade(), 'C5')
  state = judgeArcadeNote(state, 'D5')
  state = judgeArcadeNote(state, 'B5')
  assert.equal(state.combo, 0)
  assert.equal(state.bestCombo, 2)
  assert.equal(state.step, 2)
})

test('idle play does not award points', () => {
  assert.deepEqual(judgeArcadeNote(initialArcadeState, 'C5'), initialArcadeState)
})
