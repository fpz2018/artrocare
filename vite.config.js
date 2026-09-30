import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Let op: gebruik hier géén objectvorm met 'three' of 'recharts' erin.
        // Daarmee belandden die chunks in de entry-graaf en werden three.js
        // (218 kB gzip) en Recharts (100 kB gzip) op elke eerste paginalading
        // voorgeladen, ook op de openbare landingspagina. De 3D-oefeningen en
        // grafieken zitten achter de login en worden lazy geladen; Rollup
        // plaatst ze nu in de chunk van de pagina die ze daadwerkelijk gebruikt.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (id.includes('@supabase')) return 'supabase';
          if (
            id.includes('react-router') ||
            id.includes('/react/') ||
            id.includes('react-dom') ||
            id.includes('/scheduler/')
          ) {
            return 'react-vendor';
          }
          if (id.includes('@radix-ui')) return 'ui-vendor';

          return undefined;
        },
      },
    },
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    // Warn if chunk is larger than 500KB
    chunkSizeWarningLimit: 500,
  },
  // Better dev server performance
  server: {
    hmr: true,
  },
});
