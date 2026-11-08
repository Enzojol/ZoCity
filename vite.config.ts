import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { CHOOSE_MODE, STATIC_CSS, staticPage } from './src/static/page'

/** Écrit la version texte dans le HTML, pour qu'elle existe sans JavaScript. */
function staticVersion(): Plugin {
  return {
    name: 'static-version',
    transformIndexHtml: (html) =>
      html
        .replace('<!--static-style-->', `<style>${STATIC_CSS}</style>`)
        .replace('<!--choose-mode-->', `<script>${CHOOSE_MODE}</script>`)
        .replace('<!--static-page-->', staticPage()),
  }
}

export default defineConfig({
  plugins: [react(), staticVersion()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
})
