export type TheoryLevel = 'play' | 'names' | 'musician'
export type OcarinaMaterial = 'ceramic' | 'wood' | 'metal'

export type MaterialPreset = {
  id: OcarinaMaterial
  label: string
  bodyColor: string
  mouthColor: string
  metalness: number
  roughness: number
  oscillator: 'sine' | 'triangle'
  filterMultiplier: number
  gainMultiplier: number
}

export const MATERIAL_PRESETS: Record<OcarinaMaterial, MaterialPreset> = {
  ceramic: {
    id: 'ceramic',
    label: 'Cerámica',
    bodyColor: '#087bd9',
    mouthColor: '#0a65b7',
    metalness: 0.35,
    roughness: 0.22,
    oscillator: 'sine',
    filterMultiplier: 2.35,
    gainMultiplier: 1,
  },
  wood: {
    id: 'wood',
    label: 'Madera',
    bodyColor: '#8a4f2d',
    mouthColor: '#6b351e',
    metalness: 0.04,
    roughness: 0.62,
    oscillator: 'triangle',
    filterMultiplier: 1.85,
    gainMultiplier: 0.88,
  },
  metal: {
    id: 'metal',
    label: 'Metal',
    bodyColor: '#a7bac8',
    mouthColor: '#7f97a8',
    metalness: 0.86,
    roughness: 0.16,
    oscillator: 'sine',
    filterMultiplier: 3.15,
    gainMultiplier: 0.82,
  },
}

export const THEORY_LEVELS: { id: TheoryLevel; label: string; description: string }[] = [
  { id: 'play', label: 'Juego', description: 'DO · RE · MI' },
  { id: 'names', label: 'Nomenclatura', description: 'DO5 · C5 · Hz' },
  { id: 'musician', label: 'Músico', description: 'Pentagrama + datos' },
]
