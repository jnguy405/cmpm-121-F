import { defineConfig } from 'vite';

export default defineConfig({
  base: '/backrooms-game/', 
  build: {
    chunkSizeWarningLimit: 1600,
  }
});