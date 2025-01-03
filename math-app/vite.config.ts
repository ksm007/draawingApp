import path from "path"
import react from "@vitejs/plugin-react"
// import eslint from 'vite-plugin-eslint';
import { defineConfig } from "vite"
 
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist', // Output directory for the production build
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Proxy API requests to FastAPI during development
        changeOrigin: true,
      },
    },
  },
})