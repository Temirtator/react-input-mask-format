import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

// package.json has "type": "module" — __dirname недоступен в ESM-конфиге
const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "react-input-mask-format": path.resolve(dirname, "../src/index.tsx")
    }
  }
});
