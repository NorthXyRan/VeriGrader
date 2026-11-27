import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig(({ mode }) => ({
  envPrefix: mode === 'pages' ? [] : 'VITE_',
  plugins: [vue(), Components({ dts: false, resolvers: [ElementPlusResolver()] })],
  build: { chunkSizeWarningLimit: 520 },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  css: {
    postcss: './postcss.config.js',
  },
}))
