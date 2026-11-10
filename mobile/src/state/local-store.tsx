import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { emptyData, parseLocalData, type LocalData } from '@/domain/workout';
import { colors, space } from '@/theme';
import { Button, Copy } from '@/components/ui';

const KEY = 'lume_fit_mobile_local_v1'; // Separate from web and all account namespaces.
type Store = { data: LocalData; pending: boolean; error: string; retryable: boolean; change: (fn: (d: LocalData) => LocalData, durable?: boolean) => Promise<boolean>; retry: () => Promise<void> };
const Context = createContext<Store | null>(null);
export function LocalProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(emptyData);
  const current = useRef(data);
  const queue = useRef(Promise.resolve());
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [retryable, setRetryable] = useState(false);
  const [pending, setPending] = useState(false);
  const pendingCount = useRef(0);
  const durableBusy = useRef(false);
  const load = useCallback(() => {
    return AsyncStorage.getItem(KEY).then(raw => {
      const next = raw ? parseLocalData(raw) : emptyData();
      current.current = next; setData(next); setLoaded(true);
    }).catch(() => {
      setLoadError('Não foi possível abrir seus dados locais. Nada foi apagado ou substituído. Tente novamente.');
    });
  }, []);
  useEffect(() => { void load(); }, [load]);
  // Edits stay visible on write failure. A later retry saves the latest full draft.
  const change = useCallback(async (fn: (d: LocalData) => LocalData, durable = false) => {
    if (durableBusy.current) return false;
    const next = fn(current.current);
    if (durable) durableBusy.current = true;
    else { current.current = next; setData(next); }
    pendingCount.current++; setPending(true);
    const write = queue.current.catch(() => {}).then(() => AsyncStorage.setItem(KEY, JSON.stringify(next)));
    queue.current = write;
    try { await write; if (durable) { current.current = next; setData(next); } setError(''); return true; }
    catch {
      setRetryable(!durable);
      setError(durable ? 'O salvamento não foi concluído. Seus dados anteriores foram preservados. Tente a ação novamente.' : 'Não foi possível salvar neste aparelho. Mantenha o aplicativo aberto e tente novamente.');
      return false;
    }
    finally { if (durable) durableBusy.current = false; pendingCount.current--; setPending(pendingCount.current > 0); }
  }, []);
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.background, padding: space.xl, justifyContent: 'center', gap: space.lg }}>
    {loadError ? <><Copy>{loadError}</Copy><Button title="Tentar abrir novamente" onPress={() => { setLoadError(''); setLoaded(false); void load(); }} /></> : <><ActivityIndicator color={colors.text} /><Copy muted>Abrindo seus registros…</Copy></>}
  </View>;
  return <Context value={{ data, pending, error, retryable, change, retry: async () => { await change(d => d); } }}>{children}</Context>;
}
export function useLocal() {
  const store = use(Context);
  if (!store) throw Error('LocalProvider ausente.');
  return store;
}
