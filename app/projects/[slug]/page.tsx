import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectCaseStudy } from "@/components/portfolio/ProjectCaseStudy";
import { getProject, projects } from "@/lib/content/projects";

type Props = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const project = getProject(params.slug);

  if (!project) {
    return {};
  }

  return {
    title: `${project.title} — Ajmal Hassan`,
    description: project.summary,
  };
}

export default function ProjectPage({ params }: Props) {
  const project = getProject(params.slug);

  if (!project) {
    notFound();
  }

  return <ProjectCaseStudy project={project} />;
}
