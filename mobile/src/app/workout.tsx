import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Pressable, TextInput, View } from 'react-native';
import { Check, Pause, Timer } from 'lucide-react-native';
import { Button, Copy, Empty, Page, Panel } from '@/components/ui';
import { clock, completedCount, finishWorkout, restRemaining, validSet, type Draft } from '@/domain/workout';
import { useLocal } from '@/state/local-store';
import { colors, radius, space, typography } from '@/theme';

export default function Workout() {
  const { data, change, pending } = useLocal();
  const [now, setNow] = useState(Date.now);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<'finish' | 'discard' | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const sub = AppState.addEventListener('change', () => setNow(Date.now()));
    return () => { clearInterval(timer); sub.remove(); };
  }, []);
  const d = data.draft;
  if (!d) return <Page><Empty title="Nenhum treino em andamento.">Se você acabou de finalizar, seu registro está no histórico.</Empty><Button title="Ver meus treinos" onPress={() => router.replace('/(tabs)/routines')} /></Page>;
  const entry = d.entries[d.index];
  const total = d.entries.reduce((n, e) => n + e.sets.length, 0);
  const done = completedCount(d);
  const remaining = restRemaining(d.restEndsAt, now);
  const edit = (fn: (draft: Draft) => Draft) => change(state => state.draft ? { ...state, draft: fn(state.draft) } : state);
  const update = (i: number, field: 'kg' | 'reps', value: string) => {
    void edit(draft => ({ ...draft, entries: draft.entries.map((e, ei) => ei !== draft.index ? e : { ...e, sets: e.sets.map((s, si) => si === i ? { ...s, [field]: value, done: false } : s) }) }));
  };
  const toggle = (i: number) => {
    const set = entry.sets[i];
    if (!set.done && !validSet(set)) { setError('Informe carga de 0 a 2.000 kg e repetições inteiras de 1 a 999. Para carga externa zero, informe 0.'); return; }
    setError('');
    void edit(draft => ({ ...draft, restEndsAt: !set.done ? Date.now() + 60000 : draft.restEndsAt,
      entries: draft.entries.map((e, ei) => ei !== draft.index ? e : { ...e, sets: e.sets.map((s, si) => si === i ? { ...s, done: !s.done } : s) }) }));
  };
  const finish = async () => {
    try {
      const id = d.id;
      const ok = await change(state => finishWorkout(state), true);
      if (ok) router.replace({ pathname: '/session', params: { id } });
    } catch (e) { setError((e as Error).message); }
  };
  return <Page>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.sm }}><Copy variant="caption" muted>{d.name}</Copy><Copy variant="caption" muted>{clock((now - d.startedAt) / 1000)}</Copy></View>
    <View style={{ gap: space.md }}><Copy variant="caption" muted>EXERCÍCIO {d.index + 1} DE {d.entries.length}</Copy><Copy variant="display">{entry.name}</Copy>
      <Copy muted>{done} de {total} séries concluídas</Copy>
      <View accessibilityRole="progressbar" accessibilityLabel="Séries concluídas" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} accessibilityValue={{ min: 0, max: total, now: done }} style={{ height: 4, backgroundColor: colors.border, borderRadius: radius.pill }}><View style={{ height: '100%', width: `${100 * done / total}%`, backgroundColor: colors.text, borderRadius: radius.pill }} /></View>
    </View>
    <Panel style={{ padding: space.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}><Copy variant="caption" muted style={{ width: 32 }}>Série</Copy><Copy variant="caption" muted style={{ flex: 1 }}>Carga · kg</Copy><Copy variant="caption" muted style={{ flex: 1 }}>Repetições</Copy><View style={{ width: 48 }} /></View>
      {entry.sets.map((s, i) => <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Copy style={{ width: 32 }}>{i + 1}</Copy>
        {(['kg', 'reps'] as const).map(field => <TextInput key={field} accessibilityLabel={`${field === 'kg' ? 'Carga em kg' : 'Repetições'} da série ${i + 1}`} keyboardType={field === 'kg' ? 'decimal-pad' : 'number-pad'}
          value={s[field]} editable={!confirm} maxLength={20} onChangeText={v => update(i, field, v)} placeholder="—" placeholderTextColor={colors.subtle} selectTextOnFocus
          style={{ flex: 1, minWidth: 0, minHeight: 52, padding: space.sm, fontSize: typography.body.fontSize, color: colors.text, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, textAlign: 'center', backgroundColor: colors.raised }} />)}
        <Pressable accessibilityRole="checkbox" accessibilityLabel={`Concluir série ${i + 1}`} aria-checked={s.done} accessibilityState={{ checked: s.done, disabled: !!confirm }} disabled={!!confirm} onPress={() => toggle(i)}
          style={({ pressed }) => ({ width: 48, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: s.done ? colors.text : colors.surface, opacity: pressed ? 0.7 : 1 })}>
          <Check size={22} color={s.done ? colors.ink : colors.subtle} />
        </Pressable>
      </View>)}
    </Panel>
    {!!error && <Copy accessibilityRole="alert" style={{ color: colors.error }}>{error}</Copy>}
    <Panel><View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}><Timer size={24} color={colors.muted} /><View style={{ flex: 1 }}><Copy variant="caption" muted>{remaining ? 'DESCANSO' : d.restEndsAt ? 'DESCANSO CONCLUÍDO' : 'DESCANSO ENTRE SÉRIES'}</Copy><Copy variant="display">{clock(remaining)}</Copy></View><Pause size={20} color={colors.muted} /></View>
      <Button title={remaining ? 'Encerrar descanso' : 'Iniciar descanso de 1 minuto'} secondary onPress={() => void edit(draft => ({ ...draft, restEndsAt: remaining ? null : Date.now() + 60000 }))} />
    </Panel>
    <View style={{ flexDirection: 'row', gap: space.md }}><Button title="Anterior" secondary disabled={d.index === 0} style={{ flex: 1 }} onPress={() => void edit(draft => ({ ...draft, index: draft.index - 1 }))} />
      <Button title="Próximo" secondary disabled={d.index === d.entries.length - 1} style={{ flex: 1 }} onPress={() => void edit(draft => ({ ...draft, index: draft.index + 1 }))} /></View>
    <Button title="Finalizar treino" disabled={pending || !done} onPress={() => setConfirm('finish')} />
    <Button title="Continuar depois" secondary disabled={pending} onPress={() => router.replace('/')} />
    <Copy variant="caption" muted>{pending ? 'Salvando alterações…' : 'Rascunho neste aparelho. Você pode sair e retomar.'}</Copy>
    <Button title="Descartar treino em andamento" secondary disabled={pending} onPress={() => setConfirm('discard')} />
    {confirm && <Panel><Copy variant="heading">{confirm === 'finish' ? 'Finalizar este treino?' : 'Descartar este treino?'}</Copy>
      <Copy muted>{confirm === 'finish' ? `${done} de ${total} séries serão salvas. Somente as séries que você concluiu entram no histórico.` : 'As séries deste rascunho serão descartadas. Seu histórico anterior será preservado.'}</Copy>
      <Button title={confirm === 'finish' ? 'Salvar treino concluído' : 'Confirmar descarte'} disabled={pending} onPress={() => {
        if (confirm === 'finish') { void finish(); return; }
        void change(state => ({ ...state, draft: null }), true).then(ok => { if (ok) router.replace('/'); });
      }} /><Button title="Voltar ao treino" secondary onPress={() => setConfirm(null)} />
    </Panel>}
  </Page>;
}
