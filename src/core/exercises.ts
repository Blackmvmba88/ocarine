export type ExerciseStep = {
  note: string
  beats: number
}

export type PracticeSection = {
  id: string
  title: string
  startStep: number
  endStepExclusive: number
}

export type PracticeExercise = {
  id: string
  title: string
  bpm: number
  beatsPerMeasure: number
  beatUnit: number
  countInBeats: number
  steps: ExerciseStep[]
  sections: PracticeSection[]
}

export function stepsForSection(exercise: PracticeExercise, sectionId: string): ExerciseStep[] {
  const section = exercise.sections.find((candidate) => candidate.id === sectionId)
  if (!section) return exercise.steps
  return exercise.steps.slice(section.startStep, section.endStepExclusive)
}

export const FIRST_FLIGHT: PracticeExercise = {
  id: 'first-flight',
  title: 'First Flight',
  bpm: 84,
  beatsPerMeasure: 4,
  beatUnit: 4,
  countInBeats: 4,
  steps: [
    { note: 'C4', beats: 1 },
    { note: 'D4', beats: 1 },
    { note: 'E4', beats: 1 },
    { note: 'G4', beats: 2 },
    { note: 'E4', beats: 1 },
    { note: 'D4', beats: 1 },
    { note: 'C4', beats: 2 },
  ],
  sections: [
    { id: 'full', title: 'Frase completa', startStep: 0, endStepExclusive: 7 },
    { id: 'climb', title: 'Subida · C D E G', startStep: 0, endStepExclusive: 4 },
    { id: 'return', title: 'Regreso · G E D C', startStep: 3, endStepExclusive: 7 },
    { id: 'middle', title: 'Centro · E G E', startStep: 2, endStepExclusive: 5 },
  ],
}
