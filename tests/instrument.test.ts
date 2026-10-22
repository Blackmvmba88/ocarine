import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveNote } from '../src/music'
import { DEFAULT_INSTRUMENT_PROFILE } from '../src/core/instrumentProfiles'

test('screen resolves every canonical physical fingering, including H1 first', () => {
  for (const expected of DEFAULT_INSTRUMENT_PROFILE.notes) {
    const actual = resolveNote(expected.holes)
    assert.equal(actual?.midi, expected.midi)
    assert.equal(actual?.frequency, expected.frequency)
  }
  assert.equal(resolveNote([false, true, true, true, true, true])?.name, 'D5')
  assert.equal(resolveNote([true, true, true, true, true, false]), null)
})

test('unmapped fingerings stay silent instead of guessing by hole count', () => {
  for (let mask = 0; mask < 64; mask++) {
    const holes = Array.from({ length: 6 }, (_, hole) => Boolean(mask & (1 << hole)))
    const expected = DEFAULT_INSTRUMENT_PROFILE.notes.find(note => note.holes.every((value, hole) => value === holes[hole]))
    assert.equal(resolveNote(holes)?.midi ?? null, expected?.midi ?? null)
  }
  assert.equal(resolveNote([]), null)
  assert.equal(resolveNote([true, true, true, true]), null)
})
