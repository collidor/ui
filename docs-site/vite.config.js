import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const uiSrc = resolve(__dirname, '../src')

export default defineConfig({
  base: './',
  root: '.',
  resolve: {
    alias: [
      { find: '@collidor/ui', replacement: resolve(uiSrc, 'index.ts') },
      { find: /^lit\/(.*)/, replacement: resolve(__dirname, 'node_modules/lit/$1') },
      { find: 'lit', replacement: resolve(__dirname, 'node_modules/lit') },
      { find: /^@lit\/(.*)/, replacement: resolve(__dirname, 'node_modules/@lit/$1') },
      { find: /^lit-html(\/.*)?$/, replacement: resolve(__dirname, 'node_modules/lit-html$1') },
      { find: /^lit-element(\/.*)?$/, replacement: resolve(__dirname, 'node_modules/lit-element$1') },
    ],
  },
  server: {
    fs: {
      // Allow serving files from the parent ui/src directory
      allow: [__dirname, uiSrc],
    },
  },
  build: {
    outDir: 'dist',
  },
})


