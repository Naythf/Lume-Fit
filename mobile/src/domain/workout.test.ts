import { test } from 'node:test';
import assert from 'node:assert/strict';
import { completedCount, emptyData, finishWorkout, parseLocalData, restRemaining, startWorkout, validSet, weekDays, localDate } from './workout.ts';

const routine = { id: 'r1', name: 'Meu treino', weekday: null, exercises: [{ id: 'e1', name: 'Agachamento', sets: 2, minReps: 8, maxReps: 12 }] };
test('empty app has no seeded personal records', () => assert.deepEqual(emptyData(), { version: 1, routines: [], sessions: [], draft: null }));
test('validates entered loads, decimal comma and integer repetitions', () => {
  assert.equal(validSet({ kg: '0', reps: '10', done: false }), true);
  assert.equal(validSet({ kg: '12,5', reps: '8', done: true }), true);
  for (const [kg, reps] of [['', '10'], ['-1', '10'], ['Infinity', '10'], ['2001', '10'], ['10', '1.5'], ['10', '0']]) assert.equal(validSet({ kg, reps, done: true }), false);
});
test('draft snapshots exercises and saves only explicit valid completed sets once', () => {
  const draft = startWorkout(routine, 1000);
  assert.notEqual(draft.entries[0], routine.exercises[0]);
  draft.entries[0].sets[0] = { kg: '12,5', reps: '8', done: true };
  draft.entries[0].sets[1] = { kg: '25', reps: '10', done: false };
  assert.equal(completedCount(draft), 1);
  const result = finishWorkout({ ...emptyData(), draft }, 61000);
  assert.equal(result.draft, null);
  assert.equal(result.sessions[0].durationSeconds, 60);
  assert.deepEqual(result.sessions[0].entries[0].sets, [{ kg: 12.5, reps: 8 }]);
  assert.equal(finishWorkout({ ...result, draft }, 62000).sessions.length, 1);
});
test('empty completion is rejected without changing the draft', () => {
  const draft = startWorkout(routine, 1000), source = { ...emptyData(), draft };
  assert.throws(() => finishWorkout(source)); assert.equal(source.draft, draft);
});
test('rest uses absolute deadlines across suspension', () => {
  assert.equal(restRemaining(61000, 1000), 60);
  assert.equal(restRemaining(61000, 60500), 1);
  assert.equal(restRemaining(61000, 90000), 0);
});
test('round trip preserves draft and rejects damaged or unsupported data', () => {
  const source = { ...emptyData(), routines: [routine], draft: startWorkout(routine, 1000) };
  assert.deepEqual(parseLocalData(JSON.stringify(source)), source);
  assert.throws(() => parseLocalData('{'));
  assert.throws(() => parseLocalData(JSON.stringify({ ...source, version: 99 })));
  assert.throws(() => parseLocalData(JSON.stringify({ ...source, draft: { ...source.draft, index: 99 } })));
});
test('week boundaries use local dates and include Monday through Sunday', () => {
  assert.deepEqual(weekDays(new Date(2027, 0, 3)).map(localDate), ['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03']);
});
