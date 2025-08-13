import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// Определяем __dirname для ES-модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@src": path.resolve(__dirname, "src"),
      "@components": path.resolve(__dirname, "src/components"),
      "@features": path.resolve(__dirname, "src/features"),
      // '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },
});
