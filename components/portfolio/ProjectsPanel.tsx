"use client";

import { MetroTile, TileGrid, tileTextClass } from "@/components/metro";
import { useProjectTransition } from "@/components/metro/ProjectTransitionProvider";
import type { Project } from "@/lib/content/projects";
import styles from "./PortfolioPanorama.module.css";

type Props = {
  projects: readonly Project[];
};

/**
 * Projects as a Start-screen block of evidence tiles.
 *
 * Every tile is a navigation tile, so the whole rectangle is the case study's
 * link and there is no second control to collide with the copy above it. The
 * face carries the evidence -- a reader does not have to open a case study to
 * learn why the project matters -- and the caption underneath is a short
 * lowercase label: normally the destination's own name, and on the capability
 * tile the framing ("current work · draft") while the headline carries the
 * name. What holds on every tile is that the two never repeat each other, so
 * the link's accessible name never says one thing twice
 * (`tests/unit/ProjectContent.test.ts` asserts the non-containment).
 *
 * Composition, sizes and copy all live in `content/projects.ts`, measured
 * against the budgets `validateProjects` enforces. Nothing about the layout is
 * decided here: the grid places tiles in DOM order, which is content order.
 */
export function ProjectsPanel({ projects }: Props) {
  const transition = useProjectTransition();

  return (
    <div className={styles.panelContent}>
      <TileGrid>
        {projects.map((project) => (
          <MetroTile
            accent={project.accent}
            href={`/projects/${project.slug}`}
            key={project.slug}
            label={project.tileLabel}
            onNavigate={
              transition
                ? (event, source) => {
                    event.preventDefault();
                    transition.openProject(`/projects/${project.slug}`, source);
                  }
                : undefined
            }
            projectMotion
            role={project.tileRole}
            size={project.tileSize}
          >
            {/* The numeral leads, so the tile reads "₹1Cr+ revenue
                contribution" -- in the link's accessible name as well as on the
                face. It is the project's own `metric` rather than a second
                copy of it: `showsMetric` only says the face paints one. A size
                carries a claim or a numeral, never both -- the two together do
                not fit a 141px tile on a phone, and `validateProjects` rejects
                the combination.

                The `{" "}` between them are what keep that accessible name
                readable: Chromium joins adjacent inline boxes with nothing in
                between, and they cost no layout inside a flex container. See
                `Caption` in MetroTile.tsx. */}
            {project.showsMetric && project.metric ? (
              <>
                <span className={tileTextClass.value}>{project.metric}</span>{" "}
              </>
            ) : null}
            <strong className={tileTextClass.title}>
              {project.tileHeadline}
            </strong>
            {project.tileClaim ? (
              <>
                {" "}
                <span className={tileTextClass.body}>{project.tileClaim}</span>
              </>
            ) : null}
          </MetroTile>
        ))}
      </TileGrid>
    </div>
  );
}
