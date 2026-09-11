"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
  type MouseEvent,
} from "react";
import {
  AppBar,
  AppBarDock,
  Panorama,
  PanoramaNav,
  StatusBar,
  type PivotOption,
} from "@/components/metro";
import type { PostSummary } from "@/lib/content/posts";
import type { Project } from "@/lib/content/projects";
import {
  parsePivot,
  pivotIndex,
  pivotTabId,
  type PivotId,
} from "@/lib/content/pivots";
import { usePanoramaMotion } from "@/components/metro/usePanoramaMotion";
import { BioPanel } from "./BioPanel";
import { BlogPanel } from "./BlogPanel";
import { ContactPanel } from "./ContactPanel";
import { APP_IDENTITY } from "./identity";
import { PhotographyPanel } from "./PhotographyPanel";
import { ProjectsPanel } from "./ProjectsPanel";
import styles from "./PortfolioPanorama.module.css";

type Props = {
  initialPivot: PivotId;
  projects: readonly Project[];
  posts: readonly PostSummary[];
};

const CONTACT_HASH = "#contact";

type ShellStyle = CSSProperties & { "--panorama-index": number };

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

  // One Next Link owns every canonical pivot navigation, including a swipe.
  // Pending selections provide immediate semantics without letting an earlier
  // route response overwrite a newer tab click.
  const pendingPivot = useRef<PivotId | null>(null);
  const obsoletePivots = useRef(new Set<PivotId>());
  const rollbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearPending = useCallback(() => {
    pendingPivot.current = null;
    obsoletePivots.current.clear();
    if (rollbackTimer.current !== null) clearTimeout(rollbackTimer.current);
    rollbackTimer.current = null;
  }, []);
  const motion = usePanoramaMotion({
    active,
    onGestureCommit: (id) => document.getElementById(pivotTabId(id))?.click(),
  });

  function selectPivot(id: PivotId) {
    if (pendingPivot.current) obsoletePivots.current.add(pendingPivot.current);
    pendingPivot.current = id;
    motion.select(id);
    setActive(id);
    if (rollbackTimer.current !== null) clearTimeout(rollbackTimer.current);
    // A cancelled/failed router transition produces no pathname commit. Fall
    // back to the real URL instead of leaving an optimistic tab stuck forever.
    rollbackTimer.current = setTimeout(() => {
      clearPending();
      setActive(
        parsePivot(
          new URLSearchParams(window.location.search).get("view") ?? undefined,
        ),
      );
    }, 1500);
  }

  useEffect(() => {
    if (
      pendingPivot.current &&
      initialPivot !== pendingPivot.current &&
      obsoletePivots.current.has(initialPivot)
    )
      return;
    clearPending();
    setActive(initialPivot);
  }, [initialPivot, clearPending]);

  useEffect(() => {
    const traverse = () => {
      clearPending();
      setActive(
        parsePivot(
          new URLSearchParams(window.location.search).get("view") ?? undefined,
        ),
      );
    };
    window.addEventListener("popstate", traverse);
    return () => {
      window.removeEventListener("popstate", traverse);
      clearPending();
    };
  }, [clearPending]);

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

  const shellStyle: ShellStyle = { "--panorama-index": pivotIndex(active) };

  return (
    /*
     * The shell publishes the pivot twice, for two readers.
     *
     * `data-active-pivot` selects the atmosphere painted behind the page --
     * `.shell::before` in the stylesheet beside this file draws node traces on
     * Me, transit lines on Projects, quiet rules on Blog, and stands down on
     * Photography, whose own backdrop is the atmosphere. It is also the hook
     * Phase 3's transition engine reads, which is why it names the pivot rather
     * than describing the treatment.
     *
     * `--panorama-index` is the number that slides that pattern a little with
     * the plane. `Panorama` sets the same property on its own root for the
     * slide it performs, but a custom property only travels downwards and the
     * atmosphere is painted *above* the panorama in the tree, so the shell
     * derives it from the same `active` through the same `pivotIndex` rather
     * than reaching into a descendant for it.
     */
    <main
      className={styles.shell}
      ref={motion.shellRef}
      data-active-pivot={active}
      style={shellStyle}
    >
      <StatusBar label={APP_IDENTITY} />
      <Panorama
        active={active}
        motion={motion}
        navigation={
          <PanoramaNav
            active={active}
            onSelect={selectPivot}
            options={PIVOTS}
            motion={motion}
          />
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
      <AppBarDock>
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
      </AppBarDock>
    </main>
  );
}
