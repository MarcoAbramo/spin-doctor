import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        name: 'Spin Doctor – Pressesprecher der Republik Superbia',
        short_name: 'Spin Doctor',
        description: 'Satirisches Idle-Game: Rede jeden Skandal schön.',
        lang: 'de',
        theme_color: '#1d1440',
        background_color: '#1d1440',
        display: 'fullscreen',
        orientation: 'portrait',
        start_url: '.',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json,woff2,ogg,mp3}'],
      },
    }),
  ],
  server: { host: true, port: 5173, fs: { allow: ['../..'] } },
  preview: { port: 4173 },
  // Hashed build output goes to /static so /assets stays free for (non-hashed) game art.
  build: { target: 'es2022', chunkSizeWarningLimit: 800, assetsDir: 'static' },
})
