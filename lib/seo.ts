import type { Metadata } from "next";

export const siteUrl = "https://pane.ajmalhassan.com";
export const siteDescription =
  "A React component library inspired by Windows Phone. Build expressive interfaces with live tiles, bold typography, accessible controls, and purposeful motion.";
export function pageMetadata(
  path: string,
  title: string,
  description = siteDescription,
): Metadata {
  const url = new URL(path, siteUrl).href;
  const images = [
    {
      url: `${siteUrl}/opengraph-image`,
      width: 1200,
      height: 630,
      alt: "Pane UI — Software that feels alive",
    },
  ];
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "Pane UI",
      locale: "en_US",
      url,
      title,
      description,
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}
export const siteMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Pane UI",
  authors: [{ name: "Ajmal Hassan", url: "https://ajmalhassan.com" }],
  creator: "Ajmal Hassan",
};
