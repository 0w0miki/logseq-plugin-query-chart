import { defineConfig } from "vite";
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        index: './index.html',
        inline: './inline.html'
      }
    },
    target: 'esnext',
    minify: 'esbuild'
  },
  plugins: [vue()],
})