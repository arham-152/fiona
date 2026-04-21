import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import compression from 'vite-plugin-compression';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }), compression({
      algorithm: 'gzip',
      ext: '.gz',
    }), cloudflare()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'pdf-vendor': ['pdfjs-dist', 'pdf-lib'],
            'ui-vendor': ['react', 'react-dom', 'motion', 'lucide-react'],
            'ai-vendor': ['@tensorflow/tfjs', '@tensorflow-models/coco-ssd'],
            'utils-vendor': ['browser-image-compression', 'clsx', 'tailwind-merge'],
          },
        },
      },
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1000,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});