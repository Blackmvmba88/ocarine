import {
  BM_OC_002_HOLE_ORDER,
  BM_OC_002_NOTES,
  ENGLISH_PENDANT_C_SIX_HOLE_NOTES,
  SIX_HOLE_PENDANT_HOLE_ORDER,
  type OcarinaNote,
} from './notes'

export type InstrumentProfileStatus = 'prototype' | 'reference' | 'validated'

export type InstrumentReference = {
  label: string
  url: string
  scope: string
}

export type InstrumentProfile = {
  id: string
  name: string
  description: string
  holeCount: number
  holeOrder: readonly string[]
  fingeringSystem: string
  key: string
  status: InstrumentProfileStatus
  notes: OcarinaNote[]
  references: InstrumentReference[]
  validationNotes: string[]
}

export const ENGLISH_PENDANT_C_SIX_HOLE_PROFILE: InstrumentProfile = {
  id: 'english-pendant-c-six-hole-v1',
  name: '6-hole C · English pendant',
  description: 'Perfil de referencia para digitación natural de una ocarina colgante de 6 agujeros en C. La octava física depende del modelo y debe calibrarse antes de marcar el instrumento como validado.',
  holeCount: SIX_HOLE_PENDANT_HOLE_ORDER.length,
  holeOrder: SIX_HOLE_PENDANT_HOLE_ORDER,
  fingeringSystem: 'english-pendant',
  key: 'C major',
  status: 'reference',
  notes: ENGLISH_PENDANT_C_SIX_HOLE_NOTES,
  references: [
    {
      label: 'STL Ocarina · Complete Fingering Chart for 6 Hole Ocarina in C Major',
      url: 'https://cdn.shopify.com/s/files/1/0103/7756/0119/files/6_Hole_C_Major_Chart.pdf?6941=',
      scope: 'Natural C-major fingering relationship C–E. The source explicitly notes that exact sounding pitch depends on the product.',
    },
  ],
  validationNotes: [
    'Confirm the physical hole ordering against the BlackMamba 3D model before manufacturing.',
    'Measure the sounding octave and cents offset for every note on the physical prototype.',
    'Do not promote this profile to validated until measured pitch and repeatability are recorded.',
  ],
}

export const BM_OC_002_PROFILE: InstrumentProfile = {
  id: 'bm-oc-002-acoustic-v2',
  name: 'BM-OC-002 · Acoustic V2',
  description: 'Gemelo digital del prototipo físico BM-OC-002: C5 cerrado y apertura acumulativa H1–H6 para D5–B5. Los diámetros acústicos siguen siendo de calibración hasta medir una impresión real.',
  holeCount: BM_OC_002_HOLE_ORDER.length,
  holeOrder: BM_OC_002_HOLE_ORDER,
  fingeringSystem: 'progressive-opening-acoustic-v2',
  key: 'C major · C5–B5',
  status: 'prototype',
  notes: BM_OC_002_NOTES,
  references: [],
  validationNotes: [
    'Source geometry and acoustic targets live in hardware/ocarina-acoustic-v2/acoustic_design_v2.json.',
    'The Helmholtz model is first-order; the physical print must be tuned with measured Hz/cents under controlled breath pressure.',
    'Promote this profile to validated only after hole diameters, pressure and repeatability are recorded on the manufactured instrument.',
  ],
}

export const TRAINER_SIX_HOLE_PROFILE = BM_OC_002_PROFILE
export const DEFAULT_INSTRUMENT_PROFILE = BM_OC_002_PROFILE
