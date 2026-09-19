import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl';
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss() ],
  theme: {
    extend: {
      colors: {
        primary: '#FFFFFF',
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react-core';
            }
            if (id.includes('d3')) {
              return 'vendor-d3';
            }
            if (id.includes('three') || id.includes('fiber') || id.includes('drei')) {
              return 'vendor-threejs';
            }
            return 'vendor-libs'; // other third party packages
          }
        }
      }
    }
  }
})
