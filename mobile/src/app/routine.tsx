import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button, Copy, Field, Page, Panel } from '@/components/ui';
import { days, newId, type Exercise } from '@/domain/workout';
import { useLocal } from '@/state/local-store';
import { colors, radius, space } from '@/theme';

type ExerciseForm = { id: string; name: string; sets: string; minReps: string; maxReps: string };
const fresh = (): ExerciseForm => ({ id: newId(), name: '', sets: '3', minReps: '8', maxReps: '12' });
export default function RoutineEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, change, pending } = useLocal();
  const existing = data.routines.find(r => r.id === id);
  const [name, setName] = useState(existing?.name ?? '');
  const [weekday, setWeekday] = useState<number | null>(existing?.weekday ?? null);
  const [exercises, setExercises] = useState<ExerciseForm[]>(existing?.exercises.map(e => ({ ...e, sets: String(e.sets), minReps: String(e.minReps), maxReps: String(e.maxReps) })) ?? [fresh()]);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [routineId] = useState(existing?.id ?? newId());
  const update = (index: number, field: keyof ExerciseForm, value: string) => setExercises(list => list.map((e, i) => i === index ? { ...e, [field]: value } : e));
  const save = async () => {
    if (!name.trim() || exercises.some(e => !e.name.trim())) { setError('Dê um nome à rotina e a cada exercício.'); return; }
    const valid = exercises.every(e => Number.isInteger(Number(e.sets)) && Number(e.sets) >= 1 && Number(e.sets) <= 12 && Number.isInteger(Number(e.minReps)) && Number(e.minReps) >= 1 && Number.isInteger(Number(e.maxReps)) && Number(e.maxReps) >= Number(e.minReps) && Number(e.maxReps) <= 99);
    if (!valid) { setError('Use de 1 a 12 séries e de 1 a 99 repetições. O máximo deve ser maior ou igual ao mínimo.'); return; }
    const routine = { id: routineId, name: name.trim(), weekday, exercises: exercises.map(e => ({ ...e, name: e.name.trim(), sets: Number(e.sets), minReps: Number(e.minReps), maxReps: Number(e.maxReps) })) as Exercise[] };
    const ok = await change(d => ({ ...d, routines: d.routines.some(r => r.id === routineId) ? d.routines.map(r => r.id === routineId ? routine : r) : [...d.routines, routine] }), true);
    if (ok) { if (router.canGoBack()) router.back(); else router.replace('/(tabs)/routines'); }
  };
  return <Page><Copy variant="title">{existing ? 'Um treino que acompanha você.' : 'Monte seu próximo treino.'}</Copy>
    <Field label="Nome da rotina" placeholder="Como você chama este treino?" value={name} maxLength={120} onChangeText={setName} />
    <Copy variant="heading">Dia da semana</Copy><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
      {[null, 1, 2, 3, 4, 5, 6, 0].map(day => <Pressable key={String(day)} accessibilityRole="button" aria-pressed={weekday === day} accessibilityState={{ selected: weekday === day }} onPress={() => setWeekday(day)}
        style={({ pressed }) => ({ padding: space.md, minHeight: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: weekday === day ? colors.text : colors.border, backgroundColor: weekday === day ? colors.text : colors.surface, opacity: pressed ? 0.7 : 1 })}>
        <Copy variant="caption" style={{ color: weekday === day ? colors.ink : colors.text }}>{day === null ? 'Sem dia fixo' : days[day]}</Copy>
      </Pressable>)}
    </View><Copy variant="heading">Exercícios</Copy>
    {exercises.map((e, i) => <Panel key={e.id} style={{ padding: space.lg }}><Copy variant="caption" muted>EXERCÍCIO {i + 1}</Copy>
      <Field label={`Nome do exercício ${i + 1}`} placeholder="Nome do exercício" value={e.name} maxLength={120} onChangeText={v => update(i, 'name', v)} />
      <View style={{ flexDirection: 'row', gap: space.sm }}>{(['sets', 'minReps', 'maxReps'] as const).map((key, j) => <View key={key} style={{ flex: 1 }}><Field label={['Séries', 'Rep. mín.', 'Rep. máx.'][j]} keyboardType="number-pad" value={e[key]} maxLength={2} onChangeText={v => update(i, key, v)} /></View>)}</View>
      {exercises.length > 1 && <Button title={`Remover exercício ${i + 1}`} secondary onPress={() => setExercises(list => list.filter(item => item.id !== e.id))} />}
    </Panel>)}
    <Button title="Adicionar exercício" secondary disabled={exercises.length >= 100} onPress={() => setExercises(list => [...list, fresh()])} />
    {!!error && <Copy accessibilityRole="alert" style={{ color: colors.error }}>{error}</Copy>}
    <Button title={pending ? 'Salvando…' : 'Salvar rotina'} disabled={pending} onPress={() => void save()} />
    {existing && !confirmDelete && <Button title="Excluir rotina" secondary disabled={pending} onPress={() => setConfirmDelete(true)} />}
    {confirmDelete && <Panel><Copy>Excluir esta rotina? O histórico e o treino em andamento serão preservados.</Copy>
      <Button title="Confirmar exclusão da rotina" disabled={pending} onPress={() => { void change(d => ({ ...d, routines: d.routines.filter(r => r.id !== routineId) }), true).then(ok => { if (ok) router.replace('/(tabs)/routines'); }); }} />
      <Button title="Manter rotina" secondary onPress={() => setConfirmDelete(false)} /></Panel>}
  </Page>;
}
