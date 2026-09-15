import { build, version } from "esbuild";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const budgets = JSON.parse(
  await readFile(new URL("./library-budgets.json", import.meta.url), "utf8"),
);
const scenarios = {
  button: ["Button"],
  fields: ["Field", "TextField", "Checkbox", "Select"],
  motion: ["Transition", "Stagger", "TileSequence"],
  floating: ["Menu", "Popover"],
  full: null,
};
const rows = [];
for (const [name, exports] of Object.entries(scenarios)) {
  // Re-exporting retains the selected public API without bringing in an app or React.
  const contents = exports
    ? `export { ${exports.join(", ")} } from "@windows-phone/react";`
    : 'export * from "@windows-phone/react";';
  const result = await build({
    stdin: { contents, resolveDir: root, sourcefile: `${name}.js` },
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    target: "es2022",
    minify: true,
    treeShaking: true,
    external: ["react", "react-dom", "react/*", "react-dom/*"],
    define: { "process.env.NODE_ENV": '"production"' },
    metafile: true,
    logLevel: "silent",
  });
  const bytes = result.outputFiles[0].contents;
  rows.push({
    name,
    bytes: bytes.length,
    gzip: gzipSync(bytes).length,
    includesFloatingUI: Object.values(result.metafile.outputs).some((output) =>
      Object.entries(output.inputs).some(
        ([input, data]) =>
          input.includes("@floating-ui/") && data.bytesInOutput > 0,
      ),
    ),
  });
}
for (const name of ["styles", "motion-css"]) {
  const file = name === "styles" ? "styles.css" : "motion.css";
  const result = await build({
    entryPoints: [path.join(root, "packages/react/dist", file)],
    bundle: true,
    write: false,
    minify: true,
    logLevel: "silent",
  });
  const bytes = result.outputFiles[0].contents;
  rows.push({ name, bytes: bytes.length, gzip: gzipSync(bytes).length });
}
let failed = false;
for (const row of rows) {
  const limit = budgets[row.name];
  if (!limit || row.gzip > limit.gzip || row.bytes > limit.bytes) failed = true;
  console.log(
    `${row.name.padEnd(12)} ${String(row.bytes).padStart(7)} bytes / ${String(row.gzip).padStart(6)} gzip; budget ${limit?.bytes}/${limit?.gzip}${row.includesFloatingUI ? "; includes Floating UI" : ""}`,
  );
}
// Catch lost tree-shaking even before it grows past a byte budget.
for (const row of rows.filter((row) =>
  ["button", "fields", "motion"].includes(row.name),
)) {
  if (row.includesFloatingUI) {
    console.error(`${row.name} unexpectedly includes Floating UI`);
    failed = true;
  }
}
await mkdir(path.join(root, "quality-results"), { recursive: true });
await writeFile(
  path.join(root, "quality-results/library-bundles.json"),
  JSON.stringify(
    {
      esbuild: version,
      node: process.version,
      reactExternal: true,
      notes:
        "Minified ESM consumer exports. Runtime dependencies bundled; React/ReactDOM external. CSS measured separately. Gzip is not Brotli or application transfer cost.",
      rows,
    },
    null,
    2,
  ) + "\n",
);
if (failed)
  throw new Error(
    "Library bundle budgets exceeded. Inspect the dependency/import change before updating a budget.",
  );
