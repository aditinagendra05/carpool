import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Whenever your frontend calls something starting with '/api'
      '/api': {
        // It automatically redirects to your backend External IP
        target: 'http://35.200.225.107:5001', 
        changeOrigin: true,
        secure: false,
      }
    }
  }
})