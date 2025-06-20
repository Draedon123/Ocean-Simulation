import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "esnext",
    outDir: "build",
    emptyOutDir: true,
    minify: false,
  },
  base: "/Ocean-Simulation",
  publicDir: "assets",
});
