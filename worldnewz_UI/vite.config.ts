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
        '/badge-quiz',
        '/quiz-history',
        '/movies',
        '/transportation',
        '/jobs',
        '/trending-videos',
        '/play-games',
        '/search',
        '/bookmarks',
        '/editorial-briefings',
        '/editorial-guidelines',
        '/about',
        '/contact',
        '/privacy-policy',
        '/terms',
        '/disclaimer',
        '/amazon-products',
        '/deals',
        '/chatbot'
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
            if (id.includes('@mui/icons-material')) {
              return 'vendor-mui-icons';
            }
            if (id.includes('@mui/material') || id.includes('@mui/system')) {
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
