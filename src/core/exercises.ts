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
  id: 'bm-oc-002-first-flight',
  title: 'BM-OC-002 · First Flight',
  bpm: 84,
  beatsPerMeasure: 4,
  beatUnit: 4,
  countInBeats: 4,
  steps: [
    { note: 'C5', beats: 1 },
    { note: 'D5', beats: 1 },
    { note: 'E5', beats: 1 },
    { note: 'G5', beats: 2 },
    { note: 'E5', beats: 1 },
    { note: 'D5', beats: 1 },
    { note: 'C5', beats: 2 },
  ],
  sections: [
    { id: 'full', title: 'Frase completa', startStep: 0, endStepExclusive: 7 },
    { id: 'climb', title: 'Subida · C5 D5 E5 G5', startStep: 0, endStepExclusive: 4 },
    { id: 'return', title: 'Regreso · G5 E5 D5 C5', startStep: 3, endStepExclusive: 7 },
    { id: 'middle', title: 'Centro · E5 G5 E5', startStep: 2, endStepExclusive: 5 },
  ],
}
