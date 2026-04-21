import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: "https://carpool-backend-482767717624.asia-south1.run.app/",
        changeOrigin: true,
        secure: true, // Set to true because Cloud Run uses HTTPS
      }
    }
  }
})