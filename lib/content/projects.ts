import { projects as projectData } from "@/content/projects";

export type ProjectStatus = "concept" | "in-progress" | "shipped";

export type ProjectSection = {
  heading: string;
  body: string;
};

export type Project = {
  slug: string;
  title: string;
  summary: string;
  status: ProjectStatus;
  metric?: string;
  accent: "cyan" | "blue" | "ink";
  sections: ProjectSection[];
};

export function validateProjects(projects: readonly Project[]): Project[] {
  const slugs = new Set<string>();

  return projects.map((project) => {
    for (const field of ["slug", "title", "summary"] as const) {
      if (!project[field].trim()) {
        throw new Error(`Project ${field} is required`);
      }
    }

    if (slugs.has(project.slug)) {
      throw new Error(`Duplicate project slug: ${project.slug}`);
    }

    slugs.add(project.slug);
    return project;
  });
}

export const projects = validateProjects(projectData);

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
