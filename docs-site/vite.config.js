import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const uiSrc = resolve(__dirname, '../src')

export default defineConfig({
  root: '.',
  resolve: {
    alias: {
      '@collidor/ui': resolve(uiSrc, 'index.ts'),
    },
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


