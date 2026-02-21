import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages project site is at /SisuCardsApp/; use that base in production so assets resolve.
const base = process.env.NODE_ENV === "production" ? "/SisuCardsApp/" : "./";

export default defineConfig({
  plugins: [react()],
  base
});
