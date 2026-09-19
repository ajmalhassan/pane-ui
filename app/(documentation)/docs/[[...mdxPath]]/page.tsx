import { pageMetadata } from "@/lib/seo";
import { generateStaticParamsFor, importPage } from "nextra/pages";
import { useMDXComponents as getMDXComponents } from "@/mdx-components";
type Props = { params: Promise<{ mdxPath?: string[] }> };
export async function generateStaticParams() {
  const pages = await generateStaticParamsFor("mdxPath")();
  return pages
    .filter((page) => page.mdxPath[0] === "docs")
    .map((page) => ({ mdxPath: page.mdxPath.slice(1) }));
}
export async function generateMetadata({ params }: Props) {
  const { mdxPath = [] } = await params;
  const { metadata } = await importPage(["docs", ...mdxPath]);
  return pageMetadata(
    `/docs${mdxPath.length ? "/" + mdxPath.map(encodeURIComponent).join("/") : ""}`,
    mdxPath.length ? `${metadata.title} — Pane UI` : "Documentation — Pane UI",
    metadata.description ?? undefined,
  );
}
const Wrapper = getMDXComponents().wrapper;
export default async function DocPage(props: Props) {
  const params = await props.params;
  const {
    default: MDXContent,
    toc,
    metadata,
    sourceCode,
  } = await importPage(["docs", ...(params.mdxPath ?? [])]);
  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}
