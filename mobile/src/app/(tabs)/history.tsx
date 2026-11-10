import { router } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { Copy, Empty, Panel } from '@/components/ui';
import { useLocal } from '@/state/local-store';
import { clock } from '@/domain/workout';
import { colors, space } from '@/theme';

export default function History() {
  const { data } = useLocal();
  const insets = useSafeAreaInsets();
  return <FlatList data={data.sessions.slice().reverse()} keyExtractor={s => s.id} contentInsetAdjustmentBehavior="automatic"
    style={{ backgroundColor: colors.background }} contentContainerStyle={{ width: '100%', maxWidth: 660, alignSelf: 'center', padding: space.xl, paddingBottom: space.xxl + insets.bottom, gap: space.xl }}
    ListHeaderComponent={<View style={{ gap: space.sm }}><Copy variant="display">Cada treino conta.</Copy><Copy muted>Um registro do que você fez. Sem comparações fora de contexto.</Copy></View>}
    ListEmptyComponent={<Empty title="Sua história ainda vai começar.">Ao finalizar um treino, suas séries, cargas e repetições aparecem aqui.</Empty>}
    renderItem={({ item: s }) => { const sets = s.entries.reduce((n, e) => n + e.sets.length, 0); return <Pressable accessibilityRole="button" accessibilityLabel={`Abrir registro ${s.name}`} onPress={() => router.push({ pathname: '/session', params: { id: s.id } })} style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}>
      <Panel><View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}><View style={{ flex: 1, gap: space.sm }}><Copy variant="caption" muted>{new Date(s.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</Copy><Copy variant="heading">{s.name}</Copy><Copy variant="caption" muted>{sets} {sets === 1 ? 'série' : 'séries'} · {clock(s.durationSeconds)} de duração</Copy></View><ChevronRight color={colors.muted} size={22} /></View></Panel>
    </Pressable>; }} />;
}
