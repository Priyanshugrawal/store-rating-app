import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 5173 },
  // three.js is loaded lazily in its own chunk (~150 KB gzipped), only on pages with a 3D scene
  build: { chunkSizeWarningLimit: 700 },
});
