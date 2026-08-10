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
      chunkSizeWarningLimit: 2000,
    },
  };
});
