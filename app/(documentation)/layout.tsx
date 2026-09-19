import { siteMetadata } from "@/lib/seo";
import Link from "next/link";
import { Mark } from "@/components/site/Mark";
import type { Metadata } from "next";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style-prefixed.css";
import "@pane-ui/react/styles.css";
import "./docs.css";

export const metadata: Metadata = {
  ...siteMetadata,
  title: {
    default: "Documentation — Pane UI",
    template: "%s — Pane UI",
  },
  description:
    "Learn to build with Pane UI. Live component examples, API references, native accessibility and purposeful motion.",
};
export default async function DocumentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head color={{ hue: 205, saturation: 100 }} />
      <body>
        <Layout
          pageMap={await getPageMap("/docs")}
          navbar={
            <Navbar
              logo={
                <span className="docs-wordmark">
                  <Mark /> <span>Pane UI</span>
                </span>
              }
              logoLink="/"
            >
              <Link href="/examples" className="docs-toplink">
                Examples
              </Link>
              <Link href="/phone" className="docs-toplink">
                The phone ↗
              </Link>
            </Navbar>
          }
          footer={
            <Footer>Pane UI · An independent React component library.</Footer>
          }
          copyPageButton={false}
          editLink={null}
          feedback={{ content: null }}
          nextThemes={{ defaultTheme: "dark", storageKey: "wp-docs-theme" }}
          sidebar={{ defaultMenuCollapseLevel: 1 }}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
