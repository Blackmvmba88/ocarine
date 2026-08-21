export type OcarinaNote = {
  name: string
  frequency: number
  midi: number
  holes: boolean[]
}

export const OCARINA_NOTES: OcarinaNote[] = [
  { name: 'C4', frequency: 261.63, midi: 60, holes: [true, true, true, true, true, true] },
  { name: 'D4', frequency: 293.66, midi: 62, holes: [true, true, true, true, true, false] },
  { name: 'E4', frequency: 329.63, midi: 64, holes: [true, true, true, true, false, false] },
  { name: 'F4', frequency: 349.23, midi: 65, holes: [true, true, true, false, false, false] },
  { name: 'G4', frequency: 392.0, midi: 67, holes: [true, true, false, false, false, false] },
  { name: 'A4', frequency: 440.0, midi: 69, holes: [true, false, false, false, false, false] },
  { name: 'B4', frequency: 493.88, midi: 71, holes: [false, false, false, false, false, false] },
  { name: 'C5', frequency: 523.25, midi: 72, holes: [false, true, false, false, false, false] },
]
