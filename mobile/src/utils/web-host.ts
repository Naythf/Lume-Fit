export const WEB_URL = 'https://naythf.github.io/Lume-Fit/';
export function internalUrl(value: string) {
  try { const url = new URL(value); return url.origin === 'https://naythf.github.io' && (url.pathname === '/Lume-Fit' || url.pathname.startsWith('/Lume-Fit/')); }
  catch { return false; }
}
// Keep all web UI and motion intact; adapt only the browser's Blob download to a native share sheet.
export const backupBridge = `
(function () {
  window.exportData = function () {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'lume-backup', data:JSON.stringify(state.db, null, 2)}));
    } catch (_) { if (typeof toast === 'function') toast('Não foi possível preparar o backup.'); }
  };
})(); true;
`;
