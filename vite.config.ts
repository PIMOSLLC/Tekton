/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Host + port follow the PIMOS ecosystem pattern: Minerva binds 0.0.0.0 and the
// editor is consumed from a desktop browser at http://192.168.10.138:6041.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 6041,
    strictPort: true,
  },
  test: {
    environment: 'happy-dom',
    globals: true,
  },
});