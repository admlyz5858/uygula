import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "FOCUS UNIVERSE",
        short_name: "FOCUS",
        description: "Game + meditation + productivity pomodoro experience",
        theme_color: "#0f172a",
        background_color: "#020617",
        display: "standalone",
        start_url: "/",
        shortcuts: [
          {
            name: "Quick Focus 15",
            short_name: "Focus 15",
            description: "Start a 15 minute focus sprint",
            url: "/?quick=focus15"
          },
          {
            name: "Quick Focus 25",
            short_name: "Focus 25",
            description: "Start a classic 25 minute focus session",
            url: "/?quick=focus25"
          },
          {
            name: "Quick Focus 50",
            short_name: "Focus 50",
            description: "Start a 50 minute deep-work session",
            url: "/?quick=focus50"
          },
          {
            name: "Boss Challenge 50",
            short_name: "Boss 50",
            description: "Start a boss challenge with bonus XP",
            url: "/?quick=boss50"
          }
        ],
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,svg,png,webp,ogg,mp3}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.pexels\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "pexels-images",
              expiration: {
                maxEntries: 25,
                maxAgeSeconds: 60 * 60 * 24 * 14
              }
            }
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "unsplash-images",
              expiration: {
                maxEntries: 25,
                maxAgeSeconds: 60 * 60 * 24 * 14
              }
            }
          }
        ]
      }
    })
  ]
});
