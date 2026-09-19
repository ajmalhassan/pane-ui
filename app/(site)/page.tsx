import { StartDesktop } from "@/components/start/StartDesktop";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "/",
  "Pane UI — React components with live tiles and motion",
);
export default function Home() {
  return <StartDesktop />;
}
