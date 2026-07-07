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
        '/politics',
        '/technology',
        '/business',
        '/science-health',
        '/lifestyle',
        '/education',
        '/opinion',
        '/trending',
        '/podcasts-videos',
        '/local-news',
        '/sports',
        '/money',
        '/weather',
        '/shopping',
        '/travel',
        '/food',
        '/entertainment',
        '/services',
        '/gaming',
        '/cartoons',
        '/stocks',
        '/polls',
        '/polls-history',
        '/search',
        '/bookmarks',
        '/about',
        '/contact',
        '/privacy-policy',
        '/terms',
        '/amazon-products'
      ],
    }),
  ],
  base: '/',   // 👈 required for Vercel/Custom domains (changed from GitHub Pages)
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('@mui/material') || id.includes('@mui/icons-material') || id.includes('@mui/system')) {
              return 'vendor-mui';
            }
            if (id.includes('@mui/x-data-grid')) {
              return 'vendor-mui-datagrid';
            }
            if (id.includes('@emotion')) {
              return 'vendor-emotion';
            }
            if (id.includes('axios')) {
              return 'vendor-axios';
            }
            if (id.includes('phaser')) {
              return 'vendor-phaser';
            }
            if (id.includes('@microsoft/signalr')) {
              return 'vendor-signalr';
            }
            if (id.includes('slick-carousel') || id.includes('react-slick')) {
              return 'vendor-slick';
            }
            return 'vendor-others';
          }
        }
      },
    },
  },
})
