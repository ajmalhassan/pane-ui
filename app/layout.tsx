import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
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
      <body>{children}</body>
    </html>
  );
}
