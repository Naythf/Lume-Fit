import { WEB_URL } from '@/utils/web-host';
// Web-only equivalent of the native WebView. Uses the very same deployed page.
export default function WebApp() {
  return <iframe title="Lume Fit" src={WEB_URL} style={{ border: 0, width: '100%', height: '100%', background: '#000' }} />;
}
