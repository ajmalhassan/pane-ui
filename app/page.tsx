import { PortfolioPanorama } from "@/components/portfolio/PortfolioPanorama";
import { parsePivot } from "@/lib/content/pivots";
import { getPostSummaries } from "@/lib/content/posts";
import { projects } from "@/lib/content/projects";

type Props = {
  searchParams: {
    view?: string | string[];
  };
};

export default async function Home({ searchParams }: Props) {
  return (
    <PortfolioPanorama
      initialPivot={parsePivot(searchParams.view)}
      posts={await getPostSummaries()}
      projects={projects}
    />
  );
}
