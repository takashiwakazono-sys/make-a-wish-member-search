import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  // base: "/make-a-wish-mvp/", // GitHub Pages の場合はリポ名に合わせて有効化
});
