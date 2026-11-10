import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Button, Copy } from '@/components/ui';
import { colors, space } from '@/theme';
import { WEB_URL, internalUrl, backupBridge } from '@/utils/web-host';

export default function WebApp() {
  const view = useRef<WebView<object>>(null);
  const canGoBack = useRef(false);
  const currentUrl = useRef(WEB_URL);
  const sharing = useRef(false);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack.current) return false;
      view.current?.goBack(); return true;
    });
    return () => subscription.remove();
  }, []);
  const backup = async (raw: string) => {
    if (!internalUrl(currentUrl.current) || sharing.current || raw.length > 24000000) return;
    let file: File | undefined;
    try {
      const message = JSON.parse(raw);
      if (message.type !== 'lume-backup' || typeof message.data !== 'string') return;
      const data = JSON.parse(message.data);
      if (!data || !Array.isArray(data.routines) || !Array.isArray(data.sessions)) return;
      sharing.current = true;
      if (!await Sharing.isAvailableAsync()) throw Error('Compartilhamento indisponível neste aparelho.');
      file = new File(Paths.cache, `lume-fit-backup-${Date.now()}.json`);
      file.write(message.data);
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Salvar backup do Lume Fit', UTI: 'public.json' });
    } catch { setNotice('Não foi possível abrir o compartilhamento do backup. Tente novamente.'); }
    finally { if (file?.exists) file.delete(); sharing.current = false; }
  };
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
    {!!notice && <View style={{ padding: space.lg, gap: space.sm }}><Copy accessibilityRole="alert">{notice}</Copy><Button title="Fechar aviso" secondary onPress={() => setNotice('')} /></View>}
    <WebView<object> ref={view} source={{ uri: WEB_URL }} style={{ flex: 1, backgroundColor: colors.background }}
      javaScriptEnabled domStorageEnabled incognito={false} mixedContentMode="never" allowFileAccess={false}
      setSupportMultipleWindows={false} startInLoadingState injectedJavaScript={backupBridge}
      onMessage={event => { void backup(event.nativeEvent.data); }}
      onNavigationStateChange={state => { currentUrl.current = state.url; canGoBack.current = state.canGoBack; }}
      onShouldStartLoadWithRequest={request => {
        if (internalUrl(request.url)) return true;
        if (/^(https:|mailto:)/.test(request.url)) void Linking.openURL(request.url).catch(() => setNotice('Não foi possível abrir este link.'));
        return false;
      }}
      onLoadStart={() => setFailed(false)} onError={() => setFailed(true)}
      onHttpError={event => { if (event.nativeEvent.url === currentUrl.current && event.nativeEvent.statusCode >= 400) setFailed(true); }}
      renderLoading={() => <View style={{ padding: space.xl, backgroundColor: colors.background }}><ActivityIndicator color={colors.text} /><Copy muted>Abrindo Lume Fit…</Copy></View>}
      renderError={() => <View style={{ flex: 1, backgroundColor: colors.background }} />}
    />
    {failed && <View style={{ padding: space.xl, gap: space.lg }}><Copy>Não foi possível abrir o Lume. Confira a conexão e tente novamente. Seus dados não foram apagados.</Copy><Button title="Tentar novamente" onPress={() => { setFailed(false); view.current?.reload(); }} /></View>}
  </SafeAreaView>;
}
