// Fixed monochrome brand, matching the existing Lume web app.
export const colors = {
  background: '#050505', surface: '#111111', raised: '#1b1b1b', border: '#303030',
  text: '#f4f4f4', muted: '#b5b5b5', subtle: '#929292', ink: '#080808', error: '#ffb4ab',
};
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { sm: 12, md: 16, lg: 24, xl: 28, pill: 999 };
export const typography = {
  display: { fontSize: 36, lineHeight: 40, fontWeight: '700', letterSpacing: -1.5 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '600', letterSpacing: -0.6 },
  heading: { fontSize: 18, lineHeight: 25, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 24 },
  caption: { fontSize: 13, lineHeight: 20 },
} as const;
