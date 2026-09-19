import { siteMetadata } from "@/lib/seo";
import Link from "next/link";
import type { Metadata } from "next";
import "@pane-ui/react/styles.css";
import "./site.css";
export const metadata: Metadata = {
  ...siteMetadata,
  title: {
    default: "Pane UI — Software that feels alive",
    template: "%s — Pane UI",
  },
  description:
    "Living tiles, expressive typography, purposeful motion. A React component library inspired by Windows Phone. Explore the docs, examples and an interactive phone replica.",
};
export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Link className="project-skip" href="#main">
          Skip to content
        </Link>
        {children}
      </body>
    </html>
  );
}
