import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub project Pages live under /media-studio/. Local/dev uses '/'.
const base = process.env.VITE_BASE || '/'

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/files': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
