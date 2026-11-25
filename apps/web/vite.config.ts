import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  resolve: {
    alias: {
      // 直接指向源码：否则改 shared 后必须先 build，Web 端的 HMR 才能看到新导出
      '@life-rerun/shared': fileURLToPath(
        new URL('../../packages/shared/src/index.ts', import.meta.url)
      ),
    },
  },

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      pwaAssets: { disabled: true },
      manifest: {
        name: '人生模拟器：美好人生叙事之旅',
        short_name: '人生模拟器',
        description: '一款结合 AI 动态叙事、积极心理学与叙事疗法的互动人生模拟游戏。',
        theme_color: '#22c55e',
        background_color: '#fffaf5',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        // /api 请求绝不能回退到 index.html，否则接口错误会被当成正常响应解析
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-style' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-webfonts' },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
