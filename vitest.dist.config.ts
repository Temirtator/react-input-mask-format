import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const root = process.cwd();
const entries: Record<string, string> = Object.fromEntries(
  [
    ["src/index.tsx", "dist/index.js"],
    ["src/presets/index.ts", "dist/presets.js"],
    ["src/validators/index.ts", "dist/validators.js"],
    ["src/number/index.ts", "dist/number.js"],
    ["src/time/index.ts", "dist/time.js"],
    ["src/date/index.ts", "dist/date.js"],
    ["src/card/index.ts", "dist/card.js"]
  ].map(([source, built]) => [resolve(root, source), resolve(root, built)])
);
const tests = resolve(root, "tests") + "/";

export default defineConfig({
  plugins: [
    {
      name: "tests-use-dist",
      enforce: "pre",
      async resolveId(id, importer) {
        if (!importer || !importer.startsWith(tests)) return null;
        const resolved = await this.resolve(id, importer, { skipSelf: true });
        return resolved && entries[resolved.id] ? entries[resolved.id] : null;
      }
    }
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"]
  }
});
