import { copyFile, readdir } from "node:fs/promises";
for (const name of await readdir(new URL("../src/", import.meta.url))) {
  if (name.endsWith(".css"))
    await copyFile(
      new URL(`../src/${name}`, import.meta.url),
      new URL(`../dist/${name}`, import.meta.url),
    );
}
