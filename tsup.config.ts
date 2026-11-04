import { readFile, writeFile } from "node:fs/promises";
import { defineConfig } from "tsup";

const clientEntries = ["index", "number", "time", "date", "card"];

async function markClientEntries(): Promise<void> {
  for (const entry of clientEntries) {
    for (const ext of ["js", "cjs"]) {
      const file = `dist/${entry}.${ext}`;
      await writeFile(file, `"use client";\n${await readFile(file, "utf8")}`);
      const map = JSON.parse(await readFile(`${file}.map`, "utf8"));
      map.mappings = `;${map.mappings}`;
      await writeFile(`${file}.map`, JSON.stringify(map));
    }
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
  target: "es2019",
  external: ["react"],
  onSuccess: markClientEntries
});
