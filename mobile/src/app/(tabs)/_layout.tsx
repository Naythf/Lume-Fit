import { Tabs } from 'expo-router';
import { House, Dumbbell, ChartNoAxesCombined } from 'lucide-react-native';
import { Image } from 'expo-image';
import { View } from 'react-native';
import { Copy } from '@/components/ui';
import { colors, space } from '@/theme';

export default function TabsLayout() {
  return <Tabs screenOptions={{ sceneStyle: { backgroundColor: colors.background }, animation: 'none',
    headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, headerShadowVisible: false,
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, paddingTop: space.sm, minHeight: 72 },
    tabBarActiveTintColor: colors.text, tabBarInactiveTintColor: colors.subtle, tabBarLabelStyle: { fontSize: 12, paddingBottom: space.sm } }}>
    <Tabs.Screen name="index" options={{ title: 'Hoje', headerTitle: () => <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
      <Image source={require('../../../assets/lume-symbol.png')} style={{ width: 24, height: 30 }} contentFit="contain" />
      <Copy variant="heading">Lume <Copy variant="heading" muted>Fit</Copy></Copy>
    </View>, tabBarIcon: ({ color, size }) => <House size={size} color={color} /> }} />
    <Tabs.Screen name="routines" options={{ title: 'Treinos', tabBarIcon: ({ color, size }) => <Dumbbell size={size} color={color} /> }} />
    <Tabs.Screen name="history" options={{ title: 'Histórico', tabBarIcon: ({ color, size }) => <ChartNoAxesCombined size={size} color={color} /> }} />
  </Tabs>;
}
