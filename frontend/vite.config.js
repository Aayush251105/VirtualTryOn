import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // All /api/* requests are forwarded to the backend
      // Change the target port/path to match your backend when ready
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // If your backend routes don't include /api prefix, rewrite it:
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
