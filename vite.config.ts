import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react-hook-form": path.resolve(__dirname, "./src/vendor/react-hook-form"),
      "@hookform/resolvers/zod": path.resolve(__dirname, "./src/vendor/hookform-resolvers-zod"),
    },
  },
  server: {
    port: 5173,
  },
})
