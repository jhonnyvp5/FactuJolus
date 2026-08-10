import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env': {},
      global: 'globalThis',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        crypto: path.resolve(__dirname, './src/lib/cryptoShim.ts'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true' ? false : false,
      watch: null,
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('pdfkit') || id.includes('node-forge') || id.includes('buffer') || id.includes('signer')) {
                return 'vendor-crypto-pdf';
              }
              if (id.includes('motion')) {
                return 'vendor-motion';
              }
              if (id.includes('@google/genai')) {
                return 'vendor-genai';
              }
              return 'vendor-libs';
            }
          },
        },
      },
    },
  };
});
