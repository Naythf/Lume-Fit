export type Exercise = { id: string; name: string; sets: number; minReps: number; maxReps: number };
export type Routine = { id: string; name: string; weekday: number | null; exercises: Exercise[] };
export type DraftSet = { kg: string; reps: string; done: boolean };
export type Draft = {
  id: string; routineId: string; name: string; startedAt: number; index: number;
  entries: { exerciseId: string; name: string; sets: DraftSet[] }[];
  restEndsAt: number | null;
};
export type Session = {
  id: string; routineId: string; name: string; date: string; durationSeconds: number;
  entries: { exerciseId: string; name: string; sets: { kg: number; reps: number }[] }[];
};
export type LocalData = { version: 1; routines: Routine[]; sessions: Session[]; draft: Draft | null };
export const emptyData = (): LocalData => ({ version: 1, routines: [], sessions: [], draft: null });
export const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
export const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export function numeric(value: string) { return Number(value.trim().replace(',', '.')); }
export function validSet(set: DraftSet) {
  return set.kg.trim() !== '' && set.reps.trim() !== '' && Number.isFinite(numeric(set.kg)) &&
    numeric(set.kg) >= 0 && numeric(set.kg) <= 2000 && Number.isInteger(numeric(set.reps)) &&
    numeric(set.reps) >= 1 && numeric(set.reps) <= 999;
}
export function startWorkout(routine: Routine, now = Date.now()): Draft {
  if (!routine.exercises.length) throw new Error('Adicione um exercício antes de começar.');
  return { id: newId(), routineId: routine.id, name: routine.name, startedAt: now, index: 0,
    restEndsAt: null, entries: routine.exercises.map(e => ({ exerciseId: e.id, name: e.name,
      sets: Array.from({ length: e.sets }, () => ({ kg: '', reps: '', done: false })) })) };
}
export function completedCount(draft: Draft) {
  return draft.entries.reduce((n, e) => n + e.sets.filter(s => s.done && validSet(s)).length, 0);
}
export function restRemaining(deadline: number | null, now = Date.now()) {
  return deadline === null ? 0 : Math.max(0, Math.ceil((deadline - now) / 1000));
}
export function clock(seconds: number) {
  const n = Math.max(0, Math.floor(seconds));
  return `${Math.floor(n / 60).toString().padStart(2, '0')}:${(n % 60).toString().padStart(2, '0')}`;
}
export function finishWorkout(data: LocalData, now = Date.now()): LocalData {
  const d = data.draft;
  if (!d) throw new Error('Não há treino em andamento.');
  if (!completedCount(d)) throw new Error('Conclua ao menos uma série para salvar o treino.');
  const session: Session = { id: d.id, routineId: d.routineId, name: d.name,
    date: new Date(now).toISOString(), durationSeconds: Math.max(0, Math.floor((now - d.startedAt) / 1000)),
    entries: d.entries.map(e => ({ exerciseId: e.exerciseId, name: e.name,
      sets: e.sets.filter(s => s.done && validSet(s)).map(s => ({ kg: numeric(s.kg), reps: numeric(s.reps) }))
    })).filter(e => e.sets.length) };
  return { ...data, sessions: data.sessions.some(s => s.id === session.id) ? data.sessions : [...data.sessions, session], draft: null };
}
export function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function weekDays(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start); date.setDate(date.getDate() + i); return date;
  });
}

// Do not overwrite a damaged/unknown document with an empty writable account.
export function parseLocalData(raw: string): LocalData {
  const d = JSON.parse(raw) as LocalData;
  const text = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 120;
  const int = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
  if (!d || d.version !== 1 || !Array.isArray(d.routines) || !Array.isArray(d.sessions)) throw Error('Formato local desconhecido.');
  if (d.routines.some(r => !r || !text(r.id) || !text(r.name) ||
    !(r.weekday === null || int(r.weekday, 0, 6)) || !Array.isArray(r.exercises) || r.exercises.length > 100 ||
    r.exercises.some(e => !e || !text(e.id) || !text(e.name) || !int(e.sets, 1, 12) || !int(e.minReps, 1, 99) || !int(e.maxReps, e.minReps, 99)))) throw Error('Rotinas locais inválidas.');
  if (d.sessions.some(s => !s || !text(s.id) || !text(s.routineId) || !text(s.name) || !Number.isFinite(Date.parse(s.date)) ||
    !Number.isFinite(s.durationSeconds) || s.durationSeconds < 0 || !Array.isArray(s.entries) ||
    s.entries.some(e => !e || !text(e.exerciseId) || !text(e.name) || !Array.isArray(e.sets) ||
      e.sets.some(s => !s || typeof s.kg !== 'number' || typeof s.reps !== 'number' || !validSet({ kg: String(s.kg), reps: String(s.reps), done: true }))))) throw Error('Histórico local inválido.');
  if (d.draft !== null) {
    const a = d.draft;
    if (!a || !text(a.id) || !text(a.routineId) || !text(a.name) || !Number.isFinite(a.startedAt) || a.startedAt <= 0 ||
      !Array.isArray(a.entries) || !a.entries.length || a.entries.length > 100 || !int(a.index, 0, a.entries.length - 1) ||
      !(a.restEndsAt === null || (Number.isFinite(a.restEndsAt) && a.restEndsAt > 0)) ||
      a.entries.some(e => !e || !text(e.exerciseId) || !text(e.name) || !Array.isArray(e.sets) || !e.sets.length || e.sets.length > 24 ||
        e.sets.some(s => !s || typeof s.kg !== 'string' || typeof s.reps !== 'string' || s.kg.length > 20 || s.reps.length > 20 || typeof s.done !== 'boolean' || (s.done && !validSet(s))))) throw Error('Treino em andamento inválido.');
  }
  return d;
}
