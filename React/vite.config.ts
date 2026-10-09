import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// Production builds are published behind the load balancer at this path, so `npm run build` uses it
// by default; the dev server stays at `/`. APP_BASE_PATH still overrides it (APP_BASE_PATH=/ for a
// root build). A value that is not a URL path (Git Bash rewrites `/x` to `C:/Program Files/Git/x`)
// is ignored. Keep in sync with src/basePath.ts, server.mjs and public/web.config.
const PUBLIC_BASE_PATH = '/field-service-ops/react/';
function resolveBase(command: 'build' | 'serve'): string {
  const override = process.env.APP_BASE_PATH;
  if (override && override.startsWith('/') && !override.includes(':')) return override.endsWith('/') ? override : `${override}/`;
  return command === 'build' ? PUBLIC_BASE_PATH : '/';
}

export default defineConfig(({mode, command}) => ({
  plugins: [tailwindcss()],
  base: resolveBase(command),
  define: { __APP_PROFILE__: JSON.stringify(mode === 'customer' ? 'customer' : 'public') },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true, headers: { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' } },
}));
