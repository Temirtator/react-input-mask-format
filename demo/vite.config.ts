import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

// package.json has "type": "module" — __dirname недоступен в ESM-конфиге
const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^react-input-mask-format\/presets$/, replacement: path.resolve(dirname, "../src/presets/index.ts") },
      { find: /^react-input-mask-format\/validators$/, replacement: path.resolve(dirname, "../src/validators/index.ts") },
      { find: /^react-input-mask-format\/number$/, replacement: path.resolve(dirname, "../src/number/index.ts") },
      { find: /^react-input-mask-format\/time$/, replacement: path.resolve(dirname, "../src/time/index.ts") },
      { find: /^react-input-mask-format$/, replacement: path.resolve(dirname, "../src/index.tsx") }
    ]
  }
});
