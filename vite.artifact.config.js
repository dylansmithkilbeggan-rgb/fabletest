// One-off config for packaging the app as a single self-contained HTML file
// (used for shareable preview artifacts — not the normal build).
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-artifact',
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 10_000,
  },
})
