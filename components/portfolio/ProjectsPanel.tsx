import { LiveTile, TileGrid, type TileSize } from "@/components/metro";
import type { Project } from "@/lib/content/projects";
import styles from "./PortfolioPanorama.module.css";

type Props = {
  projects: readonly Project[];
};

const TILE_SIZES: readonly TileSize[] = ["large", "medium", "medium", "wide"];

export function ProjectsPanel({ projects }: Props) {
  return (
    <div className={styles.panelContent}>
      <TileGrid>
        {projects.map((project, index) => (
          <LiveTile
            accent={project.accent}
            back={
              <span className={styles.tileBack}>
                <strong>{project.metric ?? project.status}</strong>
                <span>{project.sections[7]?.body}</span>
              </span>
            }
            front={
              <span className={styles.tileFront}>
                <strong>{project.title}</strong>
                <span>{project.summary}</span>
              </span>
            }
            href={`/projects/${project.slug}`}
            key={project.slug}
            label={project.title}
            size={TILE_SIZES[index] ?? "medium"}
          />
        ))}
      </TileGrid>
    </div>
  );
}
