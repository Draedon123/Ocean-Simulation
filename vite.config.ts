import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    target: "esnext",
    outDir: "build",
    emptyOutDir: true,
    minify: false,
  },
  resolve: {
    alias: {
      "@rendering": resolve(__dirname, "src/engine/rendering"),
      "@utils": resolve(__dirname, "src/engine/utils"),
    },
  },
  base: "/Ocean-Simulation",
  publicDir: "assets",
});
