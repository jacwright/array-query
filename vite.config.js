import { defineConfig } from "vite";
import path from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "./src/lib/query.ts"),
      name: "ArrayQuery",
      fileName: "array-query",
    },
  },
  plugins: [dts()],
});
