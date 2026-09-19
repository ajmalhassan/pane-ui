import type { Metadata } from "next";
import { ProjectTransitionProvider } from "@/components/metro/ProjectTransitionProvider";

import "../globals.css";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  title: "Ajmal Hassan — Technical Leader & Builder",
  description:
    "AI-native product engineering leadership across learning, assessment, business systems, frontend craft, and full-stack delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ProjectTransitionProvider>{children}</ProjectTransitionProvider>
      </body>
    </html>
  );
}
