import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { defineConfig } from "tsup";

const clientEntries = ["index", "number", "time", "date", "card"];

async function writeClientBoundaries(): Promise<void> {
  await mkdir("dist/rsc", { recursive: true });
  for (const entry of clientEntries) {
    const url = `${pathToFileURL(resolve(`dist/${entry}.js`)).href}?t=${Date.now()}`;
    const names = Object.keys(await import(url)).sort();
    await writeFile(`dist/rsc/${entry}.js`, `"use client";\nexport { ${names.join(", ")} } from "../${entry}.js";\n`);
  }
}

export default defineConfig({
  entry: {
    index: "src/index.tsx",
    presets: "src/presets/index.ts",
    validators: "src/validators/index.ts",
    number: "src/number/index.ts",
    time: "src/time/index.ts",
    date: "src/date/index.ts",
    card: "src/card/index.ts"
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2020",
  external: ["react"],
  onSuccess: writeClientBoundaries
});
