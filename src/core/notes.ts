export type OcarinaNote = {
  name: string
  frequency: number
  midi: number
  button: number
  controlLabel: string
  holes: boolean[]
}

export const OCARINA_NOTES: OcarinaNote[] = [
  { name: 'C4', frequency: 261.63, midi: 60, button: 0, controlLabel: 'A', holes: [true, true, true, true, true, true] },
  { name: 'D4', frequency: 293.66, midi: 62, button: 1, controlLabel: 'B', holes: [true, true, true, true, true, false] },
  { name: 'E4', frequency: 329.63, midi: 64, button: 2, controlLabel: 'X', holes: [true, true, true, true, false, false] },
  { name: 'F4', frequency: 349.23, midi: 65, button: 3, controlLabel: 'Y', holes: [true, true, true, false, false, false] },
  { name: 'G4', frequency: 392.0, midi: 67, button: 12, controlLabel: 'D-Pad ↑', holes: [true, true, false, false, false, false] },
  { name: 'A4', frequency: 440.0, midi: 69, button: 15, controlLabel: 'D-Pad →', holes: [true, false, false, false, false, false] },
  { name: 'B4', frequency: 493.88, midi: 71, button: 13, controlLabel: 'D-Pad ↓', holes: [false, false, false, false, false, false] },
  { name: 'C5', frequency: 523.25, midi: 72, button: 14, controlLabel: 'D-Pad ←', holes: [false, true, false, false, false, false] },
]

export function resolveNote(pressedButtons: number[], notes: OcarinaNote[] = OCARINA_NOTES): OcarinaNote | null {
  for (const note of notes) {
    if (pressedButtons.includes(note.button)) return note
  }
  return null
}
