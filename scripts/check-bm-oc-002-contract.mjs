#!/usr/bin/env node
/**
 * Lightweight BM-OC-002 contract gate.
 * Node-only: verifies the trainer's canonical fingering progression against
 * the First Flight score, without requiring Blender or a physical prototype.
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const notes = read('src/core/notes.ts')
const profiles = read('src/core/instrumentProfiles.ts')
const exercises = read('src/core/exercises.ts')
const app = read('src/App.tsx')
let failures = 0
function assert(ok, message) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${message}`)
  if (!ok) failures++
}

const orderBlock = notes.match(/export const BM_OC_002_HOLE_ORDER\s*=\s*\[([\s\S]*?)\]\s*as const/)
const order = orderBlock ? [...orderBlock[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : []
assert(JSON.stringify(order) === JSON.stringify(['H1','H2','H3','H4','H5','H6']), 'canonical H1-H6 order')

const noteBlock = notes.match(/export const BM_OC_002_NOTES:\s*OcarinaNote\[\]\s*=\s*\[([\s\S]*?)\n\]/)
const entries = noteBlock ? [...noteBlock[1].matchAll(/createNote\('([^']+)',\s*(\d+),\s*\[([^\]]+)\]\)/g)] : []
const expected = [['C5',72],['D5',74],['E5',76],['F5',77],['G5',79],['A5',81],['B5',83]]
assert(entries.length === expected.length, 'seven notes C5-B5')
for (let i=0; i<expected.length; i++) {
  const entry = entries[i]
  const holes = entry ? entry[3].split(',').map(s => s.trim()) : []
  assert(Boolean(entry) && entry[1] === expected[i][0] &&
    Number(entry[2]) === expected[i][1] &&
    holes.length === 6 &&
    holes.every((state,j) => state === (j < i ? 'false' : 'true')),
    `${expected[i][0]}: MIDI ${expected[i][1]}, cumulative opening H1-H${i}`)
}
assert(/status:\s*'prototype'/.test(profiles.split('export const BM_OC_002_PROFILE')[1] ?? ''),
  'unmeasured acoustic profile remains prototype')
assert(/TRAINER_SIX_HOLE_PROFILE\s*=\s*BM_OC_002_PROFILE/.test(profiles),
  'trainer uses BM-OC-002 profile')
const flight = exercises.match(/export const FIRST_FLIGHT:[\s\S]*?steps:\s*\[([\s\S]*?)\]/)
const flightNotes = flight ? [...flight[1].matchAll(/note:\s*'([^']+)'/g)].map(m => m[1]) : []
assert(flightNotes.length === 7 && flightNotes.every(n => expected.some(([name]) => name === n)),
  'First Flight has seven playable steps from the calibrated target scale')
assert(app.includes("'/models/BM-OC-002.glb'"), 'web app targets the canonical GLB path')
if (!existsSync(resolve(root, 'public/models/BM-OC-002.glb'))) {
  console.log('INFO GLB missing locally: procedural fallback must remain available; no physical validation implied')
}
if (failures) {
  console.error(`BM-OC-002 contract gate failed: ${failures} check(s)`)
  process.exitCode = 1
} else {
  console.log('BM-OC-002 trainer contract passed (software consistency only; not acoustic certification)')
}
