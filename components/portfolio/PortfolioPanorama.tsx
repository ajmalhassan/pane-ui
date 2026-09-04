"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
  type MouseEvent,
} from "react";
import {
  AppBar,
  Panorama,
  PanoramaNav,
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

const CONTACT_HASH = "#contact";

function contactIsOpen(): boolean {
  return window.location.hash === CONTACT_HASH;
}

function currentEntryOwnsContact(): boolean {
  const state = window.history.state as { portfolioContact?: boolean } | null;
  return state?.portfolioContact === true;
}

// The panorama heading is the navigation, so these labels are the page
// headings themselves rather than a small tab row repeating them.
const PIVOTS: readonly PivotOption[] = [
  { id: "me", label: "technical leader / builder" },
  { id: "projects", label: "projects" },
  { id: "blog", label: "blog" },
  { id: "photography", label: "photography" },
];

export function PortfolioPanorama({
  initialPivot,
  projects,
  posts,
}: Props): JSX.Element {
  const pathname = usePathname();
  // Relies on `/` rendering dynamically (app/page.tsx awaits searchParams); a static route would need a Suspense boundary.
  const searchParams = useSearchParams();
  const [active, setActive] = useState<PivotId>(initialPivot);
  const [contactOpen, setContactOpen] = useState(false);
  // One fragment traversal fires both popstate and hashchange; this ref keeps
  // the open->closed focus rescue to a single run.
  const contactOpenRef = useRef(false);
  // The command that owns the fragment. Holding the element itself keeps the
  // focus rescue working through any app-bar markup change.
  const contactRef = useRef<HTMLAnchorElement>(null);

  // TODO: the fragment open/close/focus trio is ready to become a
  // `useContactFragment` hook once anything else needs it.
  const focusContactLink = useCallback(() => {
    contactRef.current?.focus();
  }, []);

  useEffect(() => {
    setActive(initialPivot);
  }, [initialPivot]);

  const syncContact = useCallback(() => {
    const open = contactIsOpen();
    const wasOpen = contactOpenRef.current;
    contactOpenRef.current = open;
    setContactOpen(open);

    if (wasOpen && !open) {
      const panel = document.getElementById("contact");
      if (panel?.contains(document.activeElement)) {
        focusContactLink();
      }
    }
  }, [focusContactLink]);

  useEffect(() => {
    window.addEventListener("hashchange", syncContact);
    window.addEventListener("popstate", syncContact);

    return () => {
      window.removeEventListener("hashchange", syncContact);
      window.removeEventListener("popstate", syncContact);
    };
  }, [syncContact]);

  // Router-applied URL changes fire no hashchange or popstate, so re-sync on
  // every canonical URL the App Router publishes (this covers the mount sync).
  useEffect(() => {
    syncContact();
  }, [pathname, searchParams, syncContact]);

  function openContact(event: MouseEvent<HTMLElement>) {
    event.preventDefault();

    if (!contactIsOpen()) {
      window.history.pushState({ portfolioContact: true }, "", CONTACT_HASH);
    }

    syncContact();
  }

  function closeContact() {
    // Move focus before history.back() so the popstate sync sees it outside
    // #contact and does not refocus.
    focusContactLink();

    if (currentEntryOwnsContact()) {
      window.history.back();
      return;
    }

    // Next's patched replaceState merges its router internals into this null,
    // which keeps its popstate handler from reloading, and drops no marker.
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
    syncContact();
  }

  return (
    <main className={styles.shell}>
      <div className={styles.status}>
        <StatusBar label="AJMAL / PORTFOLIO" />
      </div>
      <Panorama
        active={active}
        navigation={
          <PanoramaNav active={active} onSelect={setActive} options={PIVOTS} />
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
            { label: "Résumé", href: "/resume", icon: "arrow-northeast" },
            {
              label: "Contact",
              href: CONTACT_HASH,
              icon: "mail",
              onSelect: openContact,
              ref: contactRef,
            },
          ]}
        />
      </div>
    </main>
  );
}
