import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(({mode}) => ({
  plugins: [tailwindcss()],
  base: process.env.APP_BASE_PATH || '/',
  define: { __APP_PROFILE__: JSON.stringify(mode === 'customer' ? 'customer' : 'public') },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true, headers: { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' } },
}));

