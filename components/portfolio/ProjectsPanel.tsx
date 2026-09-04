import {
  MetroTile,
  TileGrid,
  tileTextClass,
  type TileSize,
} from "@/components/metro";
import type { Project } from "@/lib/content/projects";
import styles from "./PortfolioPanorama.module.css";

type Props = {
  projects: readonly Project[];
};

/*
 * One prominent system tile leading a Start-screen block. Every project is a
 * navigation tile: the whole rectangle is the case study's link, so there is no
 * second control to collide with the copy above it. Evidence-led composition
 * and per-project metadata are the next task's; this is the geometry.
 */
const TILE_SIZES: readonly TileSize[] = ["hero", "large", "large", "wide"];

export function ProjectsPanel({ projects }: Props) {
  return (
    <div className={styles.panelContent}>
      <TileGrid>
        {projects.map((project, index) => (
          <MetroTile
            accent={project.accent}
            href={`/projects/${project.slug}`}
            key={project.slug}
            label={project.title}
            role="navigation"
            size={TILE_SIZES[index] ?? "large"}
          >
            <strong className={tileTextClass.title}>{project.title}</strong>
            <span className={tileTextClass.body}>{project.summary}</span>
          </MetroTile>
        ))}
      </TileGrid>
    </div>
  );
}
