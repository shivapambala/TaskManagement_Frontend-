import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The Spring Boot backend has no CORS configuration, so in development every
// /api request is proxied through Vite (same-origin from the browser's view).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_TARGET || 'http://localhost:8989';
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: { '/api': { target, changeOrigin: true } },
    },
    preview: {
      port: 4173,
      proxy: { '/api': { target, changeOrigin: true } },
    },
  };
});
