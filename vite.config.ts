import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/data/**'] },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: { supabase: ['@supabase/supabase-js'], ui: ['reka-ui', 'vue-sonner'], vue: ['vue', 'vue-router', '@vueuse/core'] },
      },
    },
  },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})

