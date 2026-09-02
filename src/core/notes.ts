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

export const BM_OC_002_HOLE_ORDER = [
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
] as const

function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

function createNote(name: string, midi: number, holes: boolean[]): OcarinaNote {
  if (holes.length !== 6) {
    throw new Error(`Expected 6 holes for ${name}`)
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
 */
export const ENGLISH_PENDANT_C_SIX_HOLE_NOTES: OcarinaNote[] = [
  createNote('C4', 60, [true, true, true, true, true, true]),
  createNote('D4', 62, [true, false, true, true, true, true]),
  createNote('E4', 64, [true, true, true, false, true, true]),
  createNote('F4', 65, [true, false, true, false, true, true]),
  createNote('G4', 67, [false, false, true, true, true, true]),
  createNote('A4', 69, [false, false, true, false, true, true]),
  createNote('B4', 71, [false, true, false, false, true, true]),
  createNote('C5', 72, [false, false, false, false, true, true]),
]

/**
 * BM-OC-002 digital-twin fingering contract.
 *
 * The acoustic V2 model is sized as a progressive multi-aperture system:
 * C5 is fully covered, then H1..H6 are opened cumulatively to obtain D5..B5.
 * `true` means the physical hole is covered; `false` means open.
 */
export const BM_OC_002_NOTES: OcarinaNote[] = [
  createNote('C5', 72, [true, true, true, true, true, true]),
  createNote('D5', 74, [false, true, true, true, true, true]),
  createNote('E5', 76, [false, false, true, true, true, true]),
  createNote('F5', 77, [false, false, false, true, true, true]),
  createNote('G5', 79, [false, false, false, false, true, true]),
  createNote('A5', 81, [false, false, false, false, false, true]),
  createNote('B5', 83, [false, false, false, false, false, false]),
]

// Backward-compatible export used by the original English-pendant profile.
export const OCARINA_NOTES = ENGLISH_PENDANT_C_SIX_HOLE_NOTES
