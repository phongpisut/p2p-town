import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/p2p-town/',
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      events: 'events',
    },
  },
  server: {
    host: true,
    port: 3000,
  },
});