import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import sitemap from 'vite-plugin-sitemap'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sitemap({
      hostname: 'https://worldnewzs.in',
      dynamicRoutes: [
        '/',
        '/sports',
        '/money',
        '/weather',
        '/shopping',
        '/travel',
        '/food',
        '/entertainment',
        '/search',
        '/bookmarks',
        '/about',
        '/contact',
        '/privacy-policy',
        '/terms'
      ],
    }),
  ],
  base: '/',   // 👈 required for Vercel/Custom domains (changed from GitHub Pages)
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) {
              return 'react-vendor'
            }
            if (id.includes('@mui')) {
              return 'mui-vendor'
            }
            return 'vendor'
          }
        },
      },
    },
  },
})
