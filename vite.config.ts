import { defineConfig } from "vite";
import { resolve } from "path";

const additionalHMR: RegExp = /\.wgsl$/;

export default defineConfig({
  build: {
    target: "esnext",
    outDir: "build",
    emptyOutDir: true,
    minify: true,
    terserOptions: {
      compress: {
        booleans_as_integers: true,
        ecma: 2020,
        expression: true,
        keep_fargs: false,
        module: true,
        toplevel: true,
        passes: 3,
        unsafe: true,
      },
      mangle: {
        module: true,
        toplevel: true,
      },
      format: {
        comments: false,
        indent_level: 0,
      },
    },
  },
  resolve: {
    alias: {
      "@rendering": resolve(__dirname, "src/engine/rendering"),
      "@utils": resolve(__dirname, "src/engine/utils"),
    },
  },
  base: "/Ocean-Simulation",
  publicDir: "assets",
  plugins: [
    {
      name: "Additional HMR",
      handleHotUpdate(ctx) {
        if (!ctx.file.match(additionalHMR)) {
          return;
        }

        ctx.server.ws.send({ type: "full-reload" });
      },
    },
  ],
});
