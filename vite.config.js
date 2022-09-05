import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src/',
    }
  },
  server: {
    host: '1.sy-develop.uban360.com',
    proxy: {
      '/drive': {
        target: 'https://sy-develop.uban360.com:21007',
        changeOrigin: true,
        secure: true
      },
    }
  }
})
