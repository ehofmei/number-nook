import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? (process.env.VITE_BASE_PATH ?? '/number-nook/') : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'icon.svg',
        'icon-maskable.svg',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-512.png',
        'apple-touch-icon.png',
        'collectibles/sunny-sticker.webp',
        'collectibles/moonbeam-sticker.webp',
        'collectibles/pepper-sticker.webp',
      ],
      manifest: {
        id: './',
        name: 'Number Nook',
        short_name: 'Number Nook',
        description:
          'Fast, friendly arithmetic practice with Paw Coins and collectible companions.',
        lang: 'en-US',
        categories: ['education', 'games'],
        theme_color: '#5433ed',
        background_color: '#fff8ee',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.includes('/collectibles/') && /\.(?:png|webp|avif)$/i.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'number-nook-sticker-art-v1',
              cacheableResponse: { statuses: [0, 200] },
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
}));
