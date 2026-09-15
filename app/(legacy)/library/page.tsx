import type { Metadata } from "next";
import "@pane-ui/react/styles.css";
import { Workshop } from "./Workshop";

export const metadata: Metadata = {
  title: "Pane UI — Component Workshop",
  description:
    "Typography, living tiles, and purposeful motion. An independent React component library inspired by Windows Phone.",
};

export default function LibraryPage() {
  return <Workshop />;
}
