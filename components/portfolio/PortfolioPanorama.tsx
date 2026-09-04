"use client";

import { useEffect, useState, type JSX } from "react";
import {
  AppBar,
  Panorama,
  PivotList,
  StatusBar,
  type PivotOption,
} from "@/components/metro";
import type { PostSummary } from "@/lib/content/posts";
import type { Project } from "@/lib/content/projects";
import type { PivotId } from "@/lib/content/pivots";
import { BioPanel } from "./BioPanel";
import { BlogPanel } from "./BlogPanel";
import { ContactPanel } from "./ContactPanel";
import { PhotographyPanel } from "./PhotographyPanel";
import { ProjectsPanel } from "./ProjectsPanel";
import styles from "./PortfolioPanorama.module.css";

type Props = {
  initialPivot: PivotId;
  projects: readonly Project[];
  posts: readonly PostSummary[];
};

const PIVOTS: readonly PivotOption[] = [
  { id: "me", label: "Me" },
  { id: "projects", label: "Projects" },
  { id: "blog", label: "Blog" },
  { id: "photography", label: "Photography" },
];

export function PortfolioPanorama({
  initialPivot,
  projects,
  posts,
}: Props): JSX.Element {
  const [active, setActive] = useState<PivotId>(initialPivot);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    setActive(initialPivot);
  }, [initialPivot]);

  function closeContact() {
    setContactOpen(false);
    document.querySelector<HTMLAnchorElement>('a[href="#contact"]')?.focus();
  }

  return (
    <main className={styles.shell}>
      <div className={styles.status}>
        <StatusBar label="AJMAL / PORTFOLIO" />
      </div>
      <Panorama
        active={active}
        heading="technical leader / builder"
        navigation={
          <div className={styles.pivots}>
            <PivotList active={active} onSelect={setActive} options={PIVOTS} />
          </div>
        }
      >
        <section data-pivot="me">
          <BioPanel />
        </section>
        <section data-pivot="projects">
          <ProjectsPanel projects={projects} />
        </section>
        <section data-pivot="blog">
          <BlogPanel posts={posts} />
        </section>
        <section data-pivot="photography">
          <PhotographyPanel />
        </section>
      </Panorama>
      <ContactPanel open={contactOpen} onClose={closeContact} />
      <div className={styles.appBar}>
        <AppBar
          actions={[
            { label: "Résumé", href: "/resume", icon: "↗" },
            {
              label: "Contact",
              href: "#contact",
              icon: "✉",
              onSelect: () => setContactOpen(true),
            },
          ]}
        />
      </div>
    </main>
  );
}
