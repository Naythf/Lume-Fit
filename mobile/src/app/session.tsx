import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { Button, Copy, Empty, Page, Panel } from '@/components/ui';
import { useLocal } from '@/state/local-store';
import { clock } from '@/domain/workout';
import { colors } from '@/theme';

export default function Session() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useLocal();
  const session = data.sessions.find(s => s.id === id);
  if (!session) return <Page><Empty title="Registro não encontrado.">Este treino não está no histórico local deste aparelho.</Empty><Button title="Ver histórico" onPress={() => router.replace('/(tabs)/history')} /></Page>;
  return <Page><CheckCircle2 size={36} color={colors.text} /><Copy variant="display">Mais um treino.{ '\n' }Mais um passo.</Copy><Copy variant="title">{session.name}</Copy>
    <Copy muted>{new Date(session.date).toLocaleString('pt-BR')} · {clock(session.durationSeconds)} de duração</Copy>
    {session.entries.map(e => <Panel key={e.exerciseId}><Copy variant="heading">{e.name}</Copy>{e.sets.map((s, i) => <Copy key={i} selectable>Série {i + 1} · {s.kg.toLocaleString('pt-BR')} kg × {s.reps} repetições</Copy>)}</Panel>)}
    <Copy variant="caption" muted>A duração inclui pausas e o tempo fora do aplicativo. Carga zero não inclui estimativa do peso corporal.</Copy>
    <Button title="Ver meu histórico" onPress={() => router.replace('/(tabs)/history')} /><Button title="Voltar ao início" secondary onPress={() => router.replace('/')} />
  </Page>;
}
