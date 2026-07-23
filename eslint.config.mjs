import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  {
    ignores: [
      "dist", "lib", "node_modules", "test-results", "playwright-report",
      // legacy JS — удаляется по мере портирования (Tasks 2–11)
      "src/**/*.js", "tests/input", "tests/server-render", "tests/build",
      "dev", "index.js", "*.config.js", "eslint.config.mjs"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: { ...reactHooks.configs.recommended.rules }
  }
);
