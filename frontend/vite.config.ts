import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'editor-vendor': ['monaco-editor', '@monaco-editor/react'],
            'collaboration-vendor': ['yjs', 'y-monaco', 'socket.io-client'],
            'ui-vendor': ['lucide-react', '@headlessui/react'],
            
            // Feature chunks
            'auth': [
              './src/components/auth/LoginForm.tsx',
              './src/components/auth/RegisterForm.tsx',
              './src/components/auth/AuthGuard.tsx',
              './src/services/authService.ts',
            ],
            'editor': [
              './src/components/editor/CodeEditor.tsx',
              './src/components/editor/CollaborativeCursors.tsx',
              './src/components/editor/UserSelections.tsx',
              './src/services/yjsProvider.ts',
            ],
            'file-management': [
              './src/components/file/FileExplorer.tsx',
              './src/components/file/FileTreeNode.tsx',
              './src/services/fileService.ts',
            ],
            'room-management': [
              './src/components/room/CreateRoomModal.tsx',
              './src/components/room/JoinRoomModal.tsx',
              './src/components/room/RoomSettings.tsx',
              './src/services/roomService.ts',
            ],
          },
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId
              ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
              : 'chunk';
            return `js/${facadeModuleId}-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
              return `img/[name]-[hash][extname]`;
            }
            if (/css/i.test(ext || '')) {
              return `css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
        },
      },
      // Optimize chunk size warnings
      chunkSizeWarningLimit: 1000,
      // Environment-specific source maps
      sourcemap: mode === 'production' ? 'hidden' : true,
      // Minify options
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
          pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
        },
        mangle: {
          safari10: true,
        },
      },
      // Target modern browsers for better optimization
      target: 'es2020',
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Optimize assets
      assetsInlineLimit: 4096,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'socket.io-client',
        'yjs',
        'y-monaco',
        '@monaco-editor/react',
        'monaco-editor',
      ],
      exclude: ['@vite/client', '@vite/env'],
    },
    // Environment-specific configuration
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
  }
})