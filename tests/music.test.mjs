import assert from 'node:assert/strict'
import test from 'node:test'
import { holeMaskLabel, notePrimaryLabel, resolveNote } from '../src/music.ts'

const fingerings = [
  ['C5', 72, [true, true, true, true, true, true]],
  ['D5', 74, [false, true, true, true, true, true]],
  ['E5', 76, [false, false, true, true, true, true]],
  ['F5', 77, [false, false, false, true, true, true]],
  ['G5', 79, [false, false, false, false, true, true]],
  ['A5', 81, [false, false, false, false, false, true]],
  ['B5', 83, [false, false, false, false, false, false]],
]

for (const [name, midi, holes] of fingerings) {
  test(`BM-OC-002 fingering resolves ${name}`, () => {
    const note = resolveNote(holes)
    assert.ok(note)
    assert.equal(note.name, name)
    assert.equal(note.midi, midi)
    assert.ok(Math.abs(note.frequency - 440 * 2 ** ((midi - 69) / 12)) < 0.000001)
    assert.equal(holeMaskLabel(holes).split(' ').length, 6)
  })
}

test('unmapped and malformed fingerings are silent', () => {
  assert.equal(resolveNote([true, false, true, false, true, false]), null)
  assert.equal(resolveNote([true, true]), null)
})

test('theory labels preserve note identity', () => {
  const note = resolveNote([true, true, true, true, true, true])
  assert.equal(notePrimaryLabel(note, 'play'), 'DO')
  assert.equal(notePrimaryLabel(note, 'names'), 'DO5')
  assert.equal(notePrimaryLabel(note, 'musician'), 'C5')
})
