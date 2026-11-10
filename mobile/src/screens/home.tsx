import { router } from 'expo-router';
import { View } from 'react-native';
import { ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, Dumbbell } from 'lucide-react-native';
import { Button, Copy, Page, Panel } from '@/components/ui';
import { useLocal } from '@/state/local-store';
import { colors, radius, space } from '@/theme';
import { localDate, startWorkout, weekDays } from '@/domain/workout';

export function Home() {
  const { data, change, pending } = useLocal();
  const now = new Date();
  const dates = weekDays(now);
  const activeDays = new Set(data.sessions.filter(s => Date.parse(s.date) <= now.getTime()).map(s => localDate(new Date(s.date))));
  const count = dates.filter(d => activeDays.has(localDate(d))).length;
  const today = data.routines.find(r => r.weekday === now.getDay());
  const routine = today ?? data.routines.find(r => r.weekday === null);
  const start = async () => {
    if (data.draft) { router.push('/workout'); return; }
    if (!routine) { router.push(data.routines.length ? '/(tabs)/routines' : '/routine'); return; }
    if (await change(d => ({ ...d, draft: startWorkout(routine) }), true)) router.push('/workout');
  };
  return <Page>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.lg, alignItems: 'center' }}>
      <View style={{ flex: 1, gap: space.xs }}><Copy variant="display">Seu ritmo.{ '\n' }Sua evolução.</Copy>
        <Copy variant="caption" muted>{now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Copy></View>
      <View style={{ padding: space.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border }}><Copy variant="caption" muted>No aparelho</Copy></View>
    </View>
    <ImageBackground source={require('../../assets/weights-bg.webp')} style={{ borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }} contentFit="cover">
      <LinearGradient colors={['#00000040', '#080808f5']} style={{ padding: space.xl, minHeight: 280, justifyContent: 'space-between', gap: space.xxl }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Dumbbell color={colors.text} size={28} /><ArrowUpRight color={colors.text} size={24} /></View>
        <View style={{ gap: space.md }}><Copy variant="caption" muted>{data.draft ? 'TREINO EM ANDAMENTO' : today ? 'SEU TREINO DE HOJE' : routine ? 'NO SEU TEMPO' : 'UM PASSO DE CADA VEZ'}</Copy>
          <Copy variant="title">{data.draft?.name ?? routine?.name ?? (data.routines.length ? 'Hoje, no seu ritmo.' : 'Tudo começa com\num treino seu.')}</Copy>
          <Copy variant="caption" muted>{data.draft ? 'Retome de onde parou. Suas séries estão aqui.' : routine ? `${routine.exercises.length} ${routine.exercises.length === 1 ? 'exercício' : 'exercícios'} · registre cada série no seu ritmo` : data.routines.length ? 'Escolha uma rotina quando quiser treinar.' : 'Monte sua rotina e acompanhe o que você realmente fez.'}</Copy>
          <Button title={data.draft ? 'Retomar treino' : routine ? 'Começar treino' : data.routines.length ? 'Escolher treino' : 'Criar minha rotina'} disabled={pending} onPress={() => void start()} />
        </View>
      </LinearGradient>
    </ImageBackground>
    <View style={{ flexDirection: 'row', gap: space.md }}>
      <Panel style={{ flex: 1, padding: space.lg }}><Copy variant="title">{data.sessions.length}</Copy><Copy variant="caption" muted>Treinos registrados</Copy></Panel>
      <Panel style={{ flex: 1, padding: space.lg }}><Copy variant="title">{count}</Copy><Copy variant="caption" muted>Dias nesta semana</Copy></Panel>
    </View>
    <Panel><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.sm }}><Copy variant="heading">Sua semana</Copy><Copy variant="caption" muted>{count} {count === 1 ? 'dia ativo' : 'dias ativos'}</Copy></View>
      <View style={{ flexDirection: 'row', gap: space.xs }}>{dates.map(date => {
        const key = localDate(date), hit = activeDays.has(key), isToday = key === localDate(now);
        return <View key={key} style={{ flex: 1, alignItems: 'center', gap: space.md }} accessibilityLabel={`${date.toLocaleDateString('pt-BR')}${hit ? ', treino registrado' : ''}${isToday ? ', hoje' : ''}`}>
          <Copy variant="caption" muted>{date.toLocaleDateString('pt-BR', { weekday: 'narrow' })}</Copy>
          <View style={{ width: '100%', minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: isToday ? colors.text : colors.border, backgroundColor: hit ? colors.text : colors.raised }}>
            <Copy variant="caption" style={{ color: hit ? colors.ink : colors.text }}>{date.getDate()}</Copy>
          </View>
        </View>;
      })}</View>
      <Copy variant="caption" muted>Cada treino concluído vira parte da sua história.</Copy>
    </Panel>
    <Copy variant="caption" muted>Modo local · os registros desta versão ficam neste aparelho. A conexão com sua conta será adicionada em uma próxima etapa.</Copy>
  </Page>;
}
