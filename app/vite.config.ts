import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  root: __dirname, // Ensure Vite uses frontend as root
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared/frontend': path.resolve(__dirname, '../shared/frontend'), // shared remaining in root? Check structure. Plan said root/shared.
      '@shared': path.resolve(__dirname, '../shared/frontend'), // Should probably be root/shared?
      '@apps': path.resolve(__dirname, './marketplace/shared'),
      '@crm': path.resolve(__dirname, './marketplace/organization/mero-crm/src'), // Assuming structure
      '@social': path.resolve(__dirname, './marketplace/shared/mero-social'),
      '@inventory': path.resolve(__dirname, './marketplace/organization/mero-inventory'),
      '@accounting': path.resolve(__dirname, './marketplace/organization/mero-accounting'),
      '@creator': path.resolve(__dirname, './marketplace/creator/portal'),
      '@frontend': path.resolve(__dirname, './src'),
      '@ui': path.resolve(__dirname, '../packages/ui/src'),
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
      '@tanstack/react-query': path.resolve(__dirname, './node_modules/@tanstack/react-query'),
      'lucide-react': path.resolve(__dirname, './node_modules/lucide-react'),
      'date-fns': path.resolve(__dirname, './node_modules/date-fns'),
      'clsx': path.resolve(__dirname, './node_modules/clsx'),
      'tailwind-merge': path.resolve(__dirname, './node_modules/tailwind-merge'),
    },
    // Ensure dependencies are resolved from frontend/node_modules
    dedupe: ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'react-calendar'],
  },
  server: {
    host: '0.0.0.0', // Allow connections from any host
    port: 3001,
    strictPort: false, // Allow port to be changed if 3001 is in use
    allowedHosts: [
      'dev.merojugx.com',
      '.dev.merojugx.com', // Allow all subdomains
      'localhost',
      '127.0.0.1',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
      },
    },
    fs: {
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, '../shared'),
        path.resolve(__dirname, '../packages'),
      ],
    },
  },
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['lucide-react'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'socket-vendor': ['socket.io-client'],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging
    sourcemap: process.env.NODE_ENV === 'production',
    // Minify
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'zustand',
      'react-calendar',
      'lucide-react',
    ],
  },
});

