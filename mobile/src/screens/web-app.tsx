import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Button, Copy } from '@/components/ui';
import { colors, space } from '@/theme';
import { WEB_URL, internalUrl, backupBridge } from '@/utils/web-host';
import packaged from '@/generated/packaged-web.json';

export default function WebApp() {
  const view = useRef<WebView<object>>(null);
  const canGoBack = useRef(false);
  const currentUrl = useRef(WEB_URL);
  const sharing = useRef(false);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack.current) return false;
      view.current?.goBack(); return true;
    });
    return () => subscription.remove();
  }, []);
  const backup = async (raw: string) => {
    if (!(internalUrl(currentUrl.current) || currentUrl.current === 'about:blank') || sharing.current || raw.length > 24000000) return;
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
    <WebView<object> key={attempt} ref={view} source={{ html: packaged.html, baseUrl: WEB_URL }} style={{ flex: 1, backgroundColor: colors.background }}
      javaScriptEnabled domStorageEnabled incognito={false} mixedContentMode="never" allowFileAccess={false}
      setSupportMultipleWindows={false} startInLoadingState injectedJavaScript={backupBridge}
      onMessage={event => { void backup(event.nativeEvent.data); }}
      onNavigationStateChange={state => { currentUrl.current = state.url; canGoBack.current = state.canGoBack; }}
      onShouldStartLoadWithRequest={request => {
        if (request.isTopFrame === false) {
          try { const u = new URL(request.url); return u.protocol === 'https:' && ['www.youtube-nocookie.com', 'www.youtube.com', 'www.tiktok.com'].includes(u.hostname); }
          catch { return false; }
        }
        if (request.url === 'about:blank' || internalUrl(request.url)) return true;
        if (/^(https:|mailto:)/.test(request.url)) void Linking.openURL(request.url).catch(() => setNotice('Não foi possível abrir este link.'));
        return false;
      }}
      onLoadStart={() => setFailed(false)} onError={() => setFailed(true)}
      onHttpError={event => { if (event.nativeEvent.url === currentUrl.current && event.nativeEvent.statusCode >= 400) setFailed(true); }}
      renderLoading={() => <View style={{ padding: space.xl, backgroundColor: colors.background }}><ActivityIndicator color={colors.text} /><Copy muted>Abrindo Lume Fit neste aparelho…</Copy></View>}
      renderError={() => <View style={{ flex: 1, backgroundColor: colors.background }} />}
    />
    {failed && <View style={{ padding: space.xl, gap: space.lg }}><Copy>Não foi possível abrir a interface local. Seus dados não foram apagados.</Copy><Button title="Tentar novamente" onPress={() => { setFailed(false); setAttempt(n => n + 1); }} /></View>}
  </SafeAreaView>;
}
