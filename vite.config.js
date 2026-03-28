import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'store': path.resolve(__dirname, './src/store'),
      'config': path.resolve(__dirname, './src/config'),
      'contexts': path.resolve(__dirname, './src/contexts'),
      'components': path.resolve(__dirname, './src/components'),
      'layouts': path.resolve(__dirname, './src/layouts'),
      'views': path.resolve(__dirname, './src/views'),
      'routes': path.resolve(__dirname, './src/routes'),
      'utils': path.resolve(__dirname, './src/utils'),
      'services': path.resolve(__dirname, './src/services'),
      'hooks': path.resolve(__dirname, './src/hooks'),
      'assets': path.resolve(__dirname, './src/assets'),
      'menu-items': path.resolve(__dirname, './src/menu-items.js')
    }
  },
  server: {
    port: 5173,
    host: true, // Permite conexiones desde la red local
    strictPort: false,
    allowedHosts: [
      '.ngrok-free.dev',
      '.ngrok.io',
      '.ngrok.app',
      'localhost',
      '.local'
    ],
    hmr: {
      // Configuración para Hot Module Replacement a través de ngrok
      clientPort: 443,
      protocol: 'wss'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material']
        }
      }
    }
  }
});
