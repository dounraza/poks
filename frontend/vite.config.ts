import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    {
      name: 'virtual-node-polyfills',
      enforce: 'pre',
      resolveId(id) {
        if (id === 'assert' || id === 'assert/' || id === 'node:assert') {
          return 'virtual:assert';
        }
        if (id === 'crypto' || id === 'crypto/' || id === 'node:crypto') {
          return 'virtual:crypto';
        }
      },
      load(id) {
        if (id === 'virtual:assert') {
          return `
            function assert(val, msg) {
              if (!val) throw new Error(msg || "Assertion failed");
            }
            assert.default = assert;
            assert.ok = assert;
            export default assert;
            export const ok = assert;
          `;
        }
        if (id === 'virtual:crypto') {
          return `
            export function randomInt(min, max) {
              if (max === undefined) {
                max = min;
                min = 0;
              }
              const range = max - min;
              if (range <= 0) return min;
              const arr = new Uint32Array(1);
              (globalThis.crypto || window.crypto).getRandomValues(arr);
              return min + (arr[0] % range);
            }
            const cryptoObj = { randomInt, default: { randomInt } };
            cryptoObj.randomInt = randomInt;
            export default cryptoObj;
          `;
        }
      },
    },
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      crypto: path.resolve(__dirname, 'src/crypto-shim.ts'),
      'node:crypto': path.resolve(__dirname, 'src/crypto-shim.ts'),
    },
  },
  optimizeDeps: {
    include: ['poker-ts'],
  },
  define: {
    'process.env': {},
    process: { env: {} },
  },
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
