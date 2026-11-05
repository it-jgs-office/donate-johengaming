import { defineConfig, transformWithOxc } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

const jsxInJs = {
  name: 'jsx-in-js',
  enforce: 'pre',
  async transform(code, id) {
    if (!id.endsWith('.js') || id.includes('/node_modules/')) return null

    return transformWithOxc(code, `${id}.jsx`, {
      jsx: { runtime: 'automatic' },
    })
  },
}

export default defineConfig({
  plugins: [jsxInJs, react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'next/navigation': fileURLToPath(new URL('./src/compat/nextNavigation.jsx', import.meta.url)),
      'next/link': fileURLToPath(new URL('./src/compat/NextLink.jsx', import.meta.url)),
      'next/image': fileURLToPath(new URL('./src/compat/NextImage.jsx', import.meta.url)),
      'next-auth/react': fileURLToPath(new URL('./src/compat/nextAuth.jsx', import.meta.url)),
    },
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
  },
  optimizeDeps: {
    esbuildOptions: { loader: { '.js': 'jsx' } },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
})
