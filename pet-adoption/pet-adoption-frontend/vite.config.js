import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['jwt-decode'],
  },
  build: {
    chunkSizeWarningLimit: 1000,  // Sets the limit to 1000 kB
  },
});
