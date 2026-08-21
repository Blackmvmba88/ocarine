import { OCARINA_NOTES, type OcarinaNote } from './notes'

export type InstrumentProfile = {
  id: string
  name: string
  description: string
  holeCount: number
  status: 'prototype' | 'validated'
  notes: OcarinaNote[]
}

export const TRAINER_SIX_HOLE_PROFILE: InstrumentProfile = {
  id: 'trainer-six-hole-v1',
  name: '6-hole trainer',
  description: 'Perfil provisional para probar interacción, tutor y gamepad antes de fijar una digitación física definitiva.',
  holeCount: 6,
  status: 'prototype',
  notes: OCARINA_NOTES,
}

export const DEFAULT_INSTRUMENT_PROFILE = TRAINER_SIX_HOLE_PROFILE
