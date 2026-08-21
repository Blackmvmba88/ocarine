export type ExerciseStep = {
  note: string
  beats: number
}

export type PracticeExercise = {
  id: string
  title: string
  bpm: number
  steps: ExerciseStep[]
}

export const FIRST_FLIGHT: PracticeExercise = {
  id: 'first-flight',
  title: 'First Flight',
  bpm: 84,
  steps: [
    { note: 'C4', beats: 1 },
    { note: 'D4', beats: 1 },
    { note: 'E4', beats: 1 },
    { note: 'G4', beats: 2 },
    { note: 'E4', beats: 1 },
    { note: 'D4', beats: 1 },
    { note: 'C4', beats: 2 },
  ],
}
