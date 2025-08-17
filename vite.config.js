import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  // GitHub Pages で公開する場合は base を "/<repo>/" に変更してください。
  // base: "/make-a-wish-mvp/",
});
