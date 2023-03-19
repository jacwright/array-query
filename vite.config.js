import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "./src/lib/query.js"),
      name: "array-query",
      fileName: (format) => `array-query.${format}.js`,
    },
  },
});
