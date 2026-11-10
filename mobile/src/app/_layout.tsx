import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LocalProvider, useLocal } from '@/state/local-store';
import { Button, Copy } from '@/components/ui';
import { colors, space } from '@/theme';

function Navigation() {
  const { error, pending, retryable, retry } = useLocal();
  return <View style={{ flex: 1, backgroundColor: colors.background }}>
    <StatusBar style="light" />
    {!!error && <View accessibilityLiveRegion="assertive" style={{ padding: space.lg, gap: space.sm }}>
      <Copy style={{ color: colors.error }}>{error}</Copy>
      {retryable && <Button title="Tentar salvar novamente" secondary disabled={pending} onPress={() => void retry()} />}
    </View>}
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text,
      headerShadowVisible: false, contentStyle: { backgroundColor: colors.background }, animation: 'none' }}>
      <Stack.Screen name="(tabs)" options={{ title: 'Início', headerShown: false }} />
      <Stack.Screen name="routine" options={{ title: 'Sua rotina', presentation: 'modal' }} />
      <Stack.Screen name="workout" options={{ title: 'Em treino', gestureEnabled: false }} />
      <Stack.Screen name="session" options={{ title: 'Registro do treino' }} />
    </Stack>
  </View>;
}
export default function Layout() {
  return <SafeAreaProvider><LocalProvider><Navigation /></LocalProvider></SafeAreaProvider>;
}
