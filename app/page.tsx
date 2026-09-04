import { PortfolioPanorama } from "@/components/portfolio/PortfolioPanorama";
import { parsePivot } from "@/lib/content/pivots";
import { getPostSummaries } from "@/lib/content/posts";
import { projects } from "@/lib/content/projects";

type HomeProps = {
  searchParams: Promise<{ view?: string | string[] }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { view } = await searchParams;

  return (
    <PortfolioPanorama
      initialPivot={parsePivot(view)}
      posts={await getPostSummaries()}
      projects={projects}
    />
  );
}
