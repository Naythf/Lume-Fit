const kinds = new Set(['body','dumbbell','pushup','bridge','bench','press','raise','pull','row','curl','triceps','cable','squat','legpress','deadlift','legs','calf','core','plank','run','bike','stretch','kettlebell']);
export function safeModelKind(value) { return typeof value === 'string' && kinds.has(value) ? value : 'body'; }
