import packaged from '@/generated/packaged-web.json';
// Preview uses the exact packaged document, not the hosted website.
export default function WebApp() {
  return <iframe title="Lume Fit" srcDoc={packaged.html} style={{ border: 0, width: '100%', height: '100%', background: '#000' }} />;
}
