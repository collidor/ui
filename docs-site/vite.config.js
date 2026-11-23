import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const uiSrc = resolve(__dirname, '../src')

export default defineConfig({
  base: './',
  root: '.',
  resolve: {
    // Dedupe lit via normal package exports resolution (so transitive @lit/*,
    // lit-html, lit-element resolve naturally from lit's own node_modules under
    // both pnpm and npm, keeping a single consistent lit-html instance in dev/build).
    dedupe: ['lit'],
    alias: [
      { find: '@collidor/ui', replacement: resolve(uiSrc, 'index.ts') },
    ],
  },
  optimizeDeps: {
    include: [
      'lit',
      'lit/directives/if-defined.js',
      'lit/directives/live.js',
      'lit/directives/repeat.js',
      'lit/directives/style-map.js',
      'lit/directives/unsafe-html.js',
    ],
  },
  server: {
    fs: {
      // Allow serving files from the parent ui/src directory
      allow: [__dirname, uiSrc, resolve(__dirname, '../node_modules')],
    },
  },
  build: {
    outDir: 'dist',
  },
})


