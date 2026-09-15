import { createIndex } from "pagefind";
import path from "node:path";

// Only generated docs HTML enters the public search index, not legacy portfolio pages.
const { index, errors } = await createIndex({
  rootSelector: "[data-pagefind-body]",
});
if (errors.length || !index)
  throw new Error(errors.join("\n") || "Could not create docs index");
try {
  const result = await index.addDirectory({
    path: path.resolve(".next/server/app"),
    glob: "{docs.html,docs/**/*.html}",
  });
  if (result.errors.length) throw new Error(result.errors.join("\n"));
  if (!result.page_count)
    throw new Error("No documentation pages were indexed");
  const output = await index.writeFiles({
    outputPath: path.resolve("public/_pagefind"),
  });
  if (output.errors.length) throw new Error(output.errors.join("\n"));
  console.log(`Indexed ${result.page_count} documentation pages for search.`);
} finally {
  await index.deleteIndex();
}
