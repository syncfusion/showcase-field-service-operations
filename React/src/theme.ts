export type Theme = 'light' | 'dark';
export function initialTheme(): Theme {
  try { return localStorage.getItem('field-service-theme')==='dark' ? 'dark' : 'light'; } catch { return 'light'; }
}
export async function applyTheme(theme: Theme): Promise<void> {
  const themeAsset = theme==='dark'
    ? await import('@syncfusion/ej2-tailwind3-dark-theme/styles/tailwind3-dark.css?url')
    : await import('@syncfusion/ej2-tailwind3-theme/styles/tailwind3.css?url');
  const current = document.getElementById('syncfusion-theme') as HTMLLinkElement | null;
  const link = document.createElement('link');
  link.id='syncfusion-theme'; link.rel='stylesheet'; link.href=themeAsset.default;
  if (current) current.replaceWith(link); else document.head.prepend(link);
  document.documentElement.dataset.theme=theme;
  try { localStorage.setItem('field-service-theme',theme); } catch { /* Theme persistence is optional. */ }
}
