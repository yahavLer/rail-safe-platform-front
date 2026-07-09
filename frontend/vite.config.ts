import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/user-api": {
        target: "http://localhost:8081",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/user-api/, ""),
      },
      "/risk-api": {
        target: "http://localhost:8082",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/risk-api/, ""),
      },
      "/org-api": {
        target: "http://localhost:8083",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/org-api/, ""),
      },
      "/task-api": {
        target: "http://localhost:8084",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/task-api/, ""),
      },
      "/image-api": {
        target: "http://localhost:8090",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/image-api/, ""),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
