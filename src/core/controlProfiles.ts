import type { OcarinaNote } from './notes'

export type ControlBinding = {
  note: string
  button: number
  label: string
}

export type ControlProfile = {
  id: string
  name: string
  family: 'xbox' | 'playstation' | 'nintendo' | 'custom'
  bindings: ControlBinding[]
}

const directionalBindings: ControlBinding[] = [
  { note: 'G4', button: 12, label: 'D-Pad ↑' },
  { note: 'A4', button: 15, label: 'D-Pad →' },
  { note: 'B4', button: 13, label: 'D-Pad ↓' },
  { note: 'C5', button: 14, label: 'D-Pad ←' },
]

export const CONTROL_PROFILES: ControlProfile[] = [
  {
    id: 'xbox-standard',
    name: 'Xbox / Standard',
    family: 'xbox',
    bindings: [
      { note: 'C4', button: 0, label: 'A' },
      { note: 'D4', button: 1, label: 'B' },
      { note: 'E4', button: 2, label: 'X' },
      { note: 'F4', button: 3, label: 'Y' },
      ...directionalBindings,
    ],
  },
  {
    id: 'playstation-standard',
    name: 'PlayStation',
    family: 'playstation',
    bindings: [
      { note: 'C4', button: 0, label: '×' },
      { note: 'D4', button: 1, label: '○' },
      { note: 'E4', button: 2, label: '□' },
      { note: 'F4', button: 3, label: '△' },
      ...directionalBindings,
    ],
  },
  {
    id: 'nintendo-standard',
    name: 'Nintendo',
    family: 'nintendo',
    bindings: [
      { note: 'C4', button: 0, label: 'B' },
      { note: 'D4', button: 1, label: 'A' },
      { note: 'E4', button: 2, label: 'Y' },
      { note: 'F4', button: 3, label: 'X' },
      ...directionalBindings,
    ],
  },
]

export const DEFAULT_CONTROL_PROFILE = CONTROL_PROFILES[0]

export function getBinding(profile: ControlProfile, noteName: string): ControlBinding | undefined {
  return profile.bindings.find((binding) => binding.note === noteName)
}

export function createCustomControlProfile(base: ControlProfile): ControlProfile {
  return {
    id: 'custom-local',
    name: `Custom · ${base.name.replace(/^Custom · /, '')}`,
    family: 'custom',
    bindings: base.bindings.map((binding) => ({ ...binding })),
  }
}

export function remapControlBinding(
  profile: ControlProfile,
  noteName: string,
  button: number,
  label = `Button ${button}`,
): ControlProfile {
  const target = profile.bindings.find((binding) => binding.note === noteName)
  const occupant = profile.bindings.find((binding) => binding.button === button && binding.note !== noteName)

  if (!target) {
    const withoutCollision = profile.bindings.filter((binding) => binding.button !== button)
    return { ...profile, bindings: [...withoutCollision, { note: noteName, button, label }] }
  }

  const bindings = profile.bindings.map((binding) => {
    if (binding.note === noteName) return { ...binding, button, label }
    if (occupant && binding.note === occupant.note) {
      return { ...binding, button: target.button, label: target.label }
    }
    return binding
  })

  return { ...profile, bindings }
}

export function resolveNoteFromControlProfile(
  pressedButtons: number[],
  notes: OcarinaNote[],
  profile: ControlProfile,
): OcarinaNote | null {
  for (const binding of profile.bindings) {
    if (!pressedButtons.includes(binding.button)) continue
    const note = notes.find((candidate) => candidate.name === binding.note)
    if (note) return note
  }

  return null
}
