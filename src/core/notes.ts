export type OcarinaNote = {
  name: string
  frequency: number
  midi: number
  holes: boolean[]
}

export const SIX_HOLE_PENDANT_HOLE_ORDER = [
  'front-upper-left',
  'front-upper-right',
  'front-lower-left',
  'front-lower-right',
  'thumb-left',
  'thumb-right',
] as const

function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

function createNote(name: string, midi: number, holes: boolean[]): OcarinaNote {
  if (holes.length !== SIX_HOLE_PENDANT_HOLE_ORDER.length) {
    throw new Error(`Expected ${SIX_HOLE_PENDANT_HOLE_ORDER.length} holes for ${name}`)
  }

  return {
    name,
    midi,
    frequency: midiToFrequency(midi),
    holes,
  }
}

/**
 * Natural C-major fingerings for the standard English 6-hole pendant system.
 * `true` means the hole is covered.
 *
 * The pitch octave here is the app's concert-pitch trainer reference. Physical
 * 6-hole C pendants can sound in a different octave depending on the model;
 * the fingering relationship remains the same and the physical profile carries
 * that distinction explicitly.
 */
export const OCARINA_NOTES: OcarinaNote[] = [
  createNote('C4', 60, [true, true, true, true, true, true]),
  createNote('D4', 62, [true, false, true, true, true, true]),
  createNote('E4', 64, [true, true, true, false, true, true]),
  createNote('F4', 65, [true, false, true, false, true, true]),
  createNote('G4', 67, [false, false, true, true, true, true]),
  createNote('A4', 69, [false, false, true, false, true, true]),
  createNote('B4', 71, [false, true, false, false, true, true]),
  createNote('C5', 72, [false, false, false, false, true, true]),
]
