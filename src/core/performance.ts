export type PerformanceSource = 'gamepad' | 'keyboard' | 'mixed' | 'unknown'

export type PerformanceNoteEvent = {
  note: string
  midi: number
  frequency: number
  startedAtMs: number
  durationMs: number
  breathPeak: number
  source: PerformanceSource
}

export type PerformanceExportEnvelope = {
  format: 'blackmamba-ocarina-performance'
  version: 1
  exportedAt: string
  instrumentProfile: string
  controlProfile: string
  exercise: string
  bpm: number
  meter: string
  breathRequired: boolean
  breathThreshold: number
  events: PerformanceNoteEvent[]
}
