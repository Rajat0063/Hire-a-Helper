import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  optimizeDeps: {
    include: ["lucide-react", "react", "react-dom"],
  },
  ssr: {
    noExternal: ["lucide-react", "react", "react-dom"],
  },
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
});
