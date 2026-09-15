import type { Project } from "@/lib/content/projects";
import { DetailSurface } from "./DetailSurface";
import detail from "./detailSurface.module.css";
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
    <DetailSurface
      back={{ label: "Projects", href: "/portfolio?view=projects" }}
      projectReading
    >
      <header className={detail.header}>
        <p className={detail.marker}>Status: {formatStatus(project.status)}</p>
        <h1 className={detail.title} tabIndex={-1}>
          {project.title}
        </h1>
        <p className={detail.summary}>{project.summary}</p>
        {/* The one approved number this project is allowed to claim, at the
            size the claim deserves. Most case studies have none. */}
        {project.metric ? (
          <p className={styles.metric}>{project.metric}</p>
        ) : null}
      </header>

      <article className={detail.divided}>
        {project.sections.map((section) => (
          <section className={detail.section} key={section.heading}>
            <h2 className={detail.heading}>
              {sectionHeadings[section.heading] ?? section.heading}
            </h2>
            <p className={detail.body}>{section.body}</p>
          </section>
        ))}
      </article>
    </DetailSurface>
  );
}
