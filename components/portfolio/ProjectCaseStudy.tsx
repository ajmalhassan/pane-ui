import Link from "next/link";
import type { Project } from "@/lib/content/projects";
import styles from "./ProjectCaseStudy.module.css";

type Props = {
  project: Project;
};

const sectionHeadings: Record<string, string> = {
  "Role and team context": "Role and team",
  "Important decisions and trade-offs": "Decisions and trade-offs",
};

function formatStatus(status: Project["status"]) {
  return status.replace(/-/g, " ");
}

export function ProjectCaseStudy({ project }: Props) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.brand}>Lumia / portfolio</p>
        <p className={styles.status}>Status: {formatStatus(project.status)}</p>
        <h1>{project.title}</h1>
        <p className={styles.summary}>{project.summary}</p>
        {project.metric ? <p className={styles.metric}>{project.metric}</p> : null}
      </header>

      <article className={styles.story}>
        {project.sections.map((section) => (
          <section className={styles.section} key={section.heading}>
            <h2>{sectionHeadings[section.heading] ?? section.heading}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </article>

      <Link className={styles.returnLink} href="/?view=projects">
        Back to projects
      </Link>
    </main>
  );
}
