import { router } from 'expo-router';
import { View } from 'react-native';
import { Dumbbell } from 'lucide-react-native';
import { Button, Copy, Empty, Page, Panel } from '@/components/ui';
import { useLocal } from '@/state/local-store';
import { days, startWorkout } from '@/domain/workout';
import { colors, space } from '@/theme';

export default function Routines() {
  const { data, pending, change } = useLocal();
  return <Page><View style={{ gap: space.sm }}><Copy variant="display">Feito por você.</Copy><Copy muted>Suas rotinas, seus exercícios, seu ritmo.</Copy></View>
    <Button title="Criar rotina" onPress={() => router.push('/routine')} />
    {data.draft && <Panel><Copy variant="heading">Você tem um treino em andamento</Copy><Button title="Retomar treino" secondary onPress={() => router.push('/workout')} /></Panel>}
    {!data.routines.length && <Empty title="Seu primeiro treino começa aqui.">Adicione os exercícios que fazem parte da sua rotina. Nenhum treino de exemplo será colocado nos seus registros.</Empty>}
    {data.routines.map(r => <Panel key={r.id}><View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
      <Dumbbell color={colors.muted} size={28} /><View style={{ flex: 1 }}><Copy variant="heading">{r.name}</Copy><Copy variant="caption" muted>{r.weekday === null ? 'Sem dia fixo' : days[r.weekday]} · {r.exercises.length} exercícios</Copy></View>
    </View>{r.exercises.map(e => <View key={e.id} style={{ gap: space.xs }}><Copy>{e.name}</Copy><Copy variant="caption" muted>{e.sets} séries · {e.minReps}–{e.maxReps} repetições</Copy></View>)}
      <Button title={`Treinar ${r.name}`} disabled={pending || !!data.draft} onPress={() => { void change(d => ({ ...d, draft: startWorkout(r) }), true).then(ok => { if (ok) router.push('/workout'); }); }} />
      <Button title={`Editar ${r.name}`} secondary onPress={() => router.push({ pathname: '/routine', params: { id: r.id } })} />
    </Panel>)}
  </Page>;
}
