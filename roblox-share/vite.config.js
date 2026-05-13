import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/shevlo/" : "/",
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/roblox-api": {
        target: "https://api.roblox.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/roblox-api/, ""),
      },
      "/roblox-users": {
        target: "https://users.roblox.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/roblox-users/, ""),
      },
      "/roblox-games": {
        target: "https://games.roblox.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/roblox-games/, ""),
      },
      "/roblox-thumb": {
        target: "https://thumbnails.roblox.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/roblox-thumb/, ""),
      },
      "/roblox-apis": {
        target: "https://apis.roblox.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/roblox-apis/, ""),
      },
      "/roblox-www": {
        target: "https://www.roblox.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/roblox-www/, ""),
      },
    },
  },
}));
