import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],

  build: {
    // Generate source maps only for development
    sourcemap: mode === 'development',

    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // Rollup options for better code splitting
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['@chakra-ui/react', 'framer-motion'],
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          'vendor-utils': ['axios', 'date-fns'],
        },
      },
    },
  },

  server: {
    port: 5174,
    host: true, // Listen on all addresses including localhost
    proxy: {
      '/api': {
        target: 'https://sptrips.ntta.org/CustomerPortal',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Set proper Origin and Referer headers in the proxy
            proxyReq.setHeader('Origin', 'https://ssptrips.ntta.org');
            proxyReq.setHeader('Referer', 'https://ssptrips.ntta.org/');
          });
        }
      }
    }
  },

  // Environment variable configuration
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
}))
