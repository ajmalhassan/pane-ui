import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";
import articleStyles from "@/app/(legacy)/blog/article.module.css";
import appBarStyles from "@/components/metro/AppBar.module.css";
import dockStyles from "@/components/metro/AppBarDock.module.css";
import focusRingStyles from "@/components/metro/focusRing.module.css";
import metroTileStyles from "@/components/metro/MetroTile.module.css";
import panoramaNavStyles from "@/components/metro/PanoramaNav.module.css";
import pressableStyles from "@/components/metro/Pressable.module.css";
import visuallyHiddenStyles from "@/components/metro/visuallyHidden.module.css";
import detailStyles from "@/components/portfolio/detailSurface.module.css";
import panoramaStyles from "@/components/portfolio/PortfolioPanorama.module.css";

/*
 * The cross-module `composes` hazard, guarded once for every edge that exists.
 *
 * `composes: rng from "./focusRing.module.css"` -- one letter wrong -- is not an
 * error anywhere in this toolchain. The consumer's exported class becomes the
 * literal string `"undefined"`, the build succeeds, lint and typecheck say
 * nothing, and the declarations the edge was carrying are simply gone: the
 * focus ring off every tile and every app-bar command, or the app bar's height
 * un-reserved on five routes, or a visually-hidden note suddenly painted. The
 * failure surfaces nowhere near the edit, and only to someone looking.
 *
 * `AppBarDock.test.tsx` names that hazard and guards two of the six source
 * classes. This is the same assertion over all thirteen edges, plus the part
 * that keeps it that way: the table is checked against the stylesheets
 * themselves, so a fourteenth `composes` line fails here until it is listed.
 */

type Styles = Record<string, string>;

type Edge = {
  consumer: string;
  consumerClass: string;
  consumerStyles: Styles;
  source: string;
  sourceClass: string;
  sourceStyles: Styles;
};

const FOCUS_RING = "components/metro/focusRing.module.css";
const PRESSABLE = "components/metro/Pressable.module.css";
const DOCK = "components/metro/AppBarDock.module.css";
const PANORAMA = "components/portfolio/PortfolioPanorama.module.css";

const EDGES: readonly Edge[] = [
  {
    consumer: "app/(legacy)/blog/article.module.css",
    consumerClass: "prose",
    consumerStyles: articleStyles,
    source: "components/portfolio/detailSurface.module.css",
    sourceClass: "markdownLinks",
    sourceStyles: detailStyles,
  },
  {
    consumer: PRESSABLE,
    consumerClass: "pressable",
    consumerStyles: pressableStyles,
    source: FOCUS_RING,
    sourceClass: "ring",
    sourceStyles: focusRingStyles,
  },
  {
    consumer: "components/metro/AppBar.module.css",
    consumerClass: "command",
    consumerStyles: appBarStyles,
    source: PRESSABLE,
    sourceClass: "pressable",
    sourceStyles: pressableStyles,
  },
  {
    consumer: "components/metro/MetroTile.module.css",
    consumerClass: "navigation",
    consumerStyles: metroTileStyles,
    source: PRESSABLE,
    sourceClass: "pressable",
    sourceStyles: pressableStyles,
  },
  {
    consumer: "components/metro/PanoramaNav.module.css",
    consumerClass: "tab",
    consumerStyles: panoramaNavStyles,
    source: FOCUS_RING,
    sourceClass: "ring",
    sourceStyles: focusRingStyles,
  },
  {
    consumer: PANORAMA,
    consumerClass: "shell",
    consumerStyles: panoramaStyles,
    source: DOCK,
    sourceClass: "dockedPage",
    sourceStyles: dockStyles,
  },
  {
    consumer: PANORAMA,
    consumerClass: "tileNote",
    consumerStyles: panoramaStyles,
    source: "components/metro/visuallyHidden.module.css",
    sourceClass: "visuallyHidden",
    sourceStyles: visuallyHiddenStyles,
  },
  {
    consumer: PANORAMA,
    consumerClass: "noteRow",
    consumerStyles: panoramaStyles,
    source: FOCUS_RING,
    sourceClass: "ring",
    sourceStyles: focusRingStyles,
  },
  {
    consumer: PANORAMA,
    consumerClass: "textLink",
    consumerStyles: panoramaStyles,
    source: FOCUS_RING,
    sourceClass: "ring",
    sourceStyles: focusRingStyles,
  },
  {
    consumer: PANORAMA,
    consumerClass: "contactLinks",
    consumerStyles: panoramaStyles,
    source: FOCUS_RING,
    sourceClass: "scope",
    sourceStyles: focusRingStyles,
  },
  {
    consumer: PANORAMA,
    consumerClass: "closeContact",
    consumerStyles: panoramaStyles,
    source: FOCUS_RING,
    sourceClass: "ring",
    sourceStyles: focusRingStyles,
  },
  {
    consumer: "components/portfolio/detailSurface.module.css",
    consumerClass: "page",
    consumerStyles: detailStyles,
    source: DOCK,
    sourceClass: "dockedPage",
    sourceStyles: dockStyles,
  },
  {
    consumer: "components/portfolio/detailSurface.module.css",
    consumerClass: "column",
    consumerStyles: detailStyles,
    source: FOCUS_RING,
    sourceClass: "scope",
    sourceStyles: focusRingStyles,
  },
];

function edgeName(edge: Edge): string {
  return `${edge.consumer} .${edge.consumerClass} <- ${edge.source} .${edge.sourceClass}`;
}

it.each(EDGES.map((edge) => [edgeName(edge), edge] as const))(
  "resolves %s",
  (name, edge) => {
    const consumer = edge.consumerStyles[edge.consumerClass];
    const source = edge.sourceStyles[edge.sourceClass];

    // A missing source class exports the literal string "undefined", which is
    // a perfectly valid class name and matches nothing.
    expect(source, `${name}: source class`).toBeTruthy();
    expect(source, `${name}: source class`).not.toContain("undefined");
    expect(consumer, `${name}: consumer class`).toBeTruthy();
    expect(consumer, `${name}: consumer class`).not.toContain("undefined");
    /*
     * The composed names are appended to the consumer's own, so the consumer
     * carries BOTH -- which is the thing that stops resolving on a typo. Every
     * token of the source, not the joined string: a source class may itself
     * compose one (`.pressable` composes `ring`), and the whole chain has to
     * arrive on the consumer or the ring is gone from a pressed tile.
     */
    const composed = consumer.split(" ");
    for (const token of source.split(" ")) {
      expect(composed, `${name}: composed ${token}`).toContain(token);
    }
    expect(composed[0], `${name}: own class`).not.toBe(source.split(" ")[0]);
  },
);

/*
 * And the table above is every edge there is.
 *
 * Read out of the stylesheets rather than trusted, because a guard that only
 * covers the edges someone remembered to list is the same guard that missed
 * four of six source classes before this file existed.
 */
function declaredEdges(): string[] {
  const root = path.resolve(import.meta.dirname, "../..");
  const found: string[] = [];

  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".module.css")) read(full);
    }
  };

  const read = (file: string): void => {
    let selector = "";
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const opened = /^\.([A-Za-z][\w-]*)\s*\{$/.exec(line.trim());
      if (opened) selector = opened[1];
      const composes = /^composes:\s*([\w-]+)\s+from\s+"([^"]+)";$/.exec(
        line.trim(),
      );
      if (!composes) continue;
      // A `composes` under a selector this parser could not read is a real
      // failure, not a skip: the edge would silently go unguarded.
      expect(
        selector,
        `${file}: no simple selector before a composes`,
      ).not.toBe("");
      const consumer = path.relative(root, file);
      const source = path.relative(
        root,
        path.resolve(path.dirname(file), composes[2]),
      );
      found.push(`${consumer} .${selector} <- ${source} .${composes[1]}`);
    }
  };

  for (const dir of ["app", "components"]) walk(path.join(root, dir));
  return found.sort();
}

it("lists every cross-module composes edge in the repository", () => {
  const declared = declaredEdges();

  expect(declared).toHaveLength(EDGES.length);
  expect(declared).toEqual(EDGES.map(edgeName).sort());
});
