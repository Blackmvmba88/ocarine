export const ARCADE_MELODY = ['C5', 'D5', 'E5', 'G5', 'E5', 'D5', 'C5'] as const

export type ArcadeState = {
  mode: 'ready' | 'playing' | 'complete'
  step: number
  score: number
  combo: number
  bestCombo: number
  hits: number
  misses: number
  feedback: 'ready' | 'perfect' | 'wrong' | 'complete'
}

export const initialArcadeState: ArcadeState = {
  mode: 'ready',
  step: 0,
  score: 0,
  combo: 0,
  bestCombo: 0,
  hits: 0,
  misses: 0,
  feedback: 'ready',
}

export function startArcade(): ArcadeState {
  return { ...initialArcadeState, mode: 'playing' }
}

export function judgeArcadeNote(state: ArcadeState, played: string): ArcadeState {
  if (state.mode !== 'playing') return state
  const correct = played === ARCADE_MELODY[state.step]
  if (!correct) {
    return { ...state, combo: 0, misses: state.misses + 1, feedback: 'wrong' }
  }
  const combo = state.combo + 1
  const step = state.step + 1
  const complete = step === ARCADE_MELODY.length
  return {
    ...state,
    mode: complete ? 'complete' : 'playing',
    step,
    hits: state.hits + 1,
    combo,
    bestCombo: Math.max(state.bestCombo, combo),
    score: state.score + 100 + Math.min(400, (combo - 1) * 25),
    feedback: complete ? 'complete' : 'perfect',
  }
}
