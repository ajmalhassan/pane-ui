"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useReducedMotion } from "./useReducedMotion";
import {
  animateProjectEntrance,
  animateProjectExit,
  animateProjectReading,
  browserProjectAnimation,
  type ProjectAnimationAdapter,
  type ProjectMotionRun,
} from "./projectTransition";
import styles from "./projectTransition.module.css";

export type ProjectTransitionState =
  | "idle"
  | "exiting"
  | "navigating"
  | "entering";

type ProjectTransitionValue = {
  state: ProjectTransitionState;
  openProject(href: string, source: HTMLElement): void;
  returnToProjects(): void;
};

type Snapshot = {
  originUrl: string;
  projectHref: string;
  scrollX: number;
  scrollY: number;
};

type Pending =
  | { kind: "open"; destination: string; generation: number }
  | {
      kind: "return";
      destination: string;
      generation: number;
      useHistory: boolean;
    };

const ProjectTransitionContext = createContext<ProjectTransitionValue | null>(
  null,
);

export function useProjectTransition(): ProjectTransitionValue | null {
  return useContext(ProjectTransitionContext);
}

function currentUrl(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function sameUrl(left: string, right: string): boolean {
  const base = window.location.origin;
  return new URL(left, base).href === new URL(right, base).href;
}

function isOrdinaryAnchorClick(event: MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

function QueryObserver({ onChange }: { onChange(): void }) {
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  useEffect(onChange, [onChange, query]);
  return null;
}

export function ProjectTransitionProvider({
  animationAdapter = browserProjectAnimation,
  children,
}: {
  animationAdapter?: ProjectAnimationAdapter;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<ProjectTransitionState>("idle");
  const stateRef = useRef<ProjectTransitionState>("idle");
  const generation = useRef(0);
  const activeMotion = useRef<ProjectMotionRun | null>(null);
  const layoutWait = useRef<(() => void) | null>(null);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Pending | null>(null);
  const snapshot = useRef<Snapshot | null>(null);
  const immediateOrigin = useRef<{
    detailUrl: string;
    originUrl: string;
  } | null>(null);
  const observedUrl = useRef<string | null>(null);
  const nativeTraversal = useRef(false);
  const entering = useRef<"detail" | "projects" | null>(null);
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const changeState = useCallback((next: ProjectTransitionState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const clearWatchdog = useCallback(() => {
    if (watchdog.current !== null) clearTimeout(watchdog.current);
    watchdog.current = null;
  }, []);

  const clearLayoutWait = useCallback(() => {
    layoutWait.current?.();
    layoutWait.current = null;
  }, []);

  const clearMotion = useCallback((cancel: boolean) => {
    const motion = activeMotion.current;
    activeMotion.current = null;
    if (!motion) return;
    if (cancel) motion.cancel();
    else motion.dispose();
  }, []);

  const cancelTransition = useCallback(
    (discardPending = true) => {
      generation.current++;
      clearWatchdog();
      clearLayoutWait();
      clearMotion(true);
      if (discardPending) pending.current = null;
      changeState("idle");
    },
    [changeState, clearLayoutWait, clearMotion, clearWatchdog],
  );

  const waitForPanorama = useCallback((run: () => void) => {
    const ready = () => {
      const panorama = document.querySelector<HTMLElement>("[data-panorama]");
      const surface = document.querySelector<HTMLElement>(
        '[data-panorama-surface][data-motion-ready="true"]',
      );
      if (!panorama || !surface || panorama.dataset.motionState !== "idle")
        return false;
      observer.disconnect();
      run();
      return true;
    };
    const observer = new MutationObserver(ready);
    observer.observe(document.documentElement, {
      attributeFilter: ["data-motion-ready", "data-motion-state"],
      attributes: true,
      childList: true,
      subtree: true,
    });
    ready();
    return () => observer.disconnect();
  }, []);

  const finishDetailEntrance = useCallback(
    (runId: number) => {
      const focusHeading = () => {
        if (generation.current !== runId) return;
        document
          .querySelector<HTMLElement>("[data-project-reading] h1")
          ?.focus({ preventScroll: true });
        clearMotion(false);
        entering.current = null;
        changeState("idle");
      };
      entering.current = "detail";
      const motion = reducedRef.current
        ? null
        : animateProjectReading("in", animationAdapter);
      if (!motion) {
        focusHeading();
        return;
      }
      activeMotion.current = motion;
      changeState("entering");
      void motion.finished.then(focusHeading);
    },
    [animationAdapter, changeState, clearMotion],
  );

  const finishProjectsEntrance = useCallback(
    (runId: number) => {
      const saved = snapshot.current;
      entering.current = "projects";
      const enter = () => {
        layoutWait.current = null;
        if (generation.current !== runId) return;
        if (saved) window.scrollTo(saved.scrollX, saved.scrollY);
        const finish = () => {
          if (generation.current !== runId) return;
          const tile = saved
            ? [
                ...document.querySelectorAll<HTMLElement>(
                  "[data-project-tile]",
                ),
              ].find(
                (candidate) =>
                  candidate.getAttribute("href") === saved.projectHref,
              )
            : undefined;
          tile?.focus({ preventScroll: true });
          clearMotion(false);
          entering.current = null;
          changeState("idle");
        };
        const motion =
          reducedRef.current || !saved
            ? null
            : animateProjectEntrance(saved.projectHref, animationAdapter);
        if (!motion) {
          finish();
          return;
        }
        activeMotion.current = motion;
        changeState("entering");
        void motion.finished.then(finish);
      };
      clearLayoutWait();
      layoutWait.current = waitForPanorama(enter);
    },
    [
      animationAdapter,
      changeState,
      clearLayoutWait,
      clearMotion,
      waitForPanorama,
    ],
  );

  const observeRoute = useCallback(() => {
    if (!ready) return;
    const url = currentUrl();
    if (observedUrl.current === url) return;
    observedUrl.current = url;
    const currentPending = pending.current;

    if (currentPending?.kind === "open") {
      if (sameUrl(url, currentPending.destination)) {
        clearWatchdog();
        clearMotion(false);
        const saved = snapshot.current;
        immediateOrigin.current = saved
          ? { detailUrl: url, originUrl: saved.originUrl }
          : null;
        pending.current = null;
        finishDetailEntrance(currentPending.generation);
        return;
      }
      cancelTransition();
      immediateOrigin.current = null;
      return;
    }

    if (currentPending?.kind === "return") {
      if (sameUrl(url, currentPending.destination)) {
        clearWatchdog();
        clearMotion(false);
        pending.current = null;
        immediateOrigin.current = null;
        finishProjectsEntrance(currentPending.generation);
        return;
      }
      cancelTransition();
      immediateOrigin.current = null;
      return;
    }

    if (nativeTraversal.current) {
      nativeTraversal.current = false;
      const saved = snapshot.current;
      if (saved && sameUrl(url, saved.originUrl)) {
        const runId = ++generation.current;
        finishProjectsEntrance(runId);
        return;
      }
    }

    const adjacency = immediateOrigin.current;
    if (adjacency && !sameUrl(url, adjacency.detailUrl))
      immediateOrigin.current = null;
  }, [
    cancelTransition,
    clearMotion,
    clearWatchdog,
    finishDetailEntrance,
    finishProjectsEntrance,
    ready,
  ]);

  const openProject = useCallback(
    (href: string, source: HTMLElement) => {
      const runId = ++generation.current;
      clearWatchdog();
      clearLayoutWait();
      clearMotion(true);
      immediateOrigin.current = null;
      snapshot.current = {
        originUrl: currentUrl(),
        projectHref: href,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      };
      pending.current = { kind: "open", destination: href, generation: runId };

      const navigate = () => {
        if (generation.current !== runId) return;
        changeState("navigating");
        router.push(href);
        watchdog.current = setTimeout(() => {
          if (
            generation.current !== runId ||
            pending.current?.generation !== runId
          )
            return;
          clearMotion(false);
        }, 1500);
      };

      const motion = reducedRef.current
        ? null
        : animateProjectExit(source, animationAdapter);
      if (!motion) {
        navigate();
        return;
      }
      activeMotion.current = motion;
      changeState("exiting");
      void motion.finished.then(navigate);
    },
    [
      animationAdapter,
      changeState,
      clearLayoutWait,
      clearMotion,
      clearWatchdog,
      router,
    ],
  );

  const returnToProjects = useCallback(() => {
    const runId = ++generation.current;
    clearWatchdog();
    clearLayoutWait();
    clearMotion(true);
    const adjacency = immediateOrigin.current;
    const destination = adjacency?.originUrl ?? "/?view=projects";
    const useHistory = Boolean(
      adjacency && sameUrl(currentUrl(), adjacency.detailUrl),
    );
    pending.current = {
      kind: "return",
      destination,
      generation: runId,
      useHistory,
    };

    const navigate = () => {
      if (generation.current !== runId) return;
      changeState("navigating");
      if (useHistory) router.back();
      else router.push(destination);
      watchdog.current = setTimeout(() => {
        if (
          generation.current !== runId ||
          pending.current?.generation !== runId
        )
          return;
        clearMotion(false);
      }, 1500);
    };

    const motion = reducedRef.current
      ? null
      : animateProjectReading("out", animationAdapter);
    if (!motion) {
      navigate();
      return;
    }
    activeMotion.current = motion;
    changeState("exiting");
    void motion.finished.then(navigate);
  }, [
    animationAdapter,
    changeState,
    clearLayoutWait,
    clearMotion,
    clearWatchdog,
    router,
  ]);

  useEffect(() => {
    if (!reduced) return;

    if (stateRef.current === "exiting" && pending.current) {
      const previous = pending.current;
      const runId = ++generation.current;
      clearWatchdog();
      clearMotion(true);
      pending.current = { ...previous, generation: runId };
      changeState("navigating");
      if (previous.kind === "open") router.push(previous.destination);
      else if (previous.useHistory) router.back();
      else router.push(previous.destination);
      watchdog.current = setTimeout(() => {
        if (
          generation.current !== runId ||
          pending.current?.generation !== runId
        )
          return;
        clearMotion(false);
      }, 1500);
      return;
    }

    if (stateRef.current !== "entering") return;
    const destination = entering.current;
    const runId = ++generation.current;
    clearLayoutWait();
    clearMotion(true);
    if (destination === "detail") {
      document
        .querySelector<HTMLElement>("[data-project-reading] h1")
        ?.focus({ preventScroll: true });
      entering.current = null;
      changeState("idle");
      return;
    }
    if (destination === "projects") {
      const saved = snapshot.current;
      layoutWait.current = waitForPanorama(() => {
        layoutWait.current = null;
        if (generation.current !== runId) return;
        const tile = saved
          ? [
              ...document.querySelectorAll<HTMLElement>("[data-project-tile]"),
            ].find(
              (candidate) =>
                candidate.getAttribute("href") === saved.projectHref,
            )
          : undefined;
        tile?.focus({ preventScroll: true });
        entering.current = null;
        changeState("idle");
      });
    }
  }, [
    changeState,
    clearLayoutWait,
    clearMotion,
    clearWatchdog,
    reduced,
    router,
    waitForPanorama,
  ]);

  useEffect(() => {
    setReady(true);
    observedUrl.current = currentUrl();
  }, []);

  useEffect(observeRoute, [observeRoute, pathname]);
  const observeRouteRef = useRef(observeRoute);
  observeRouteRef.current = observeRoute;

  useEffect(() => {
    const traverse = () => {
      immediateOrigin.current = null;
      nativeTraversal.current = true;
      cancelTransition();
      observedUrl.current = null;
    };
    const hashChanged = () => {
      immediateOrigin.current = null;
      cancelTransition();
      observedUrl.current = null;
      observeRouteRef.current();
    };
    const clicked = (event: MouseEvent) => {
      if (!isOrdinaryAnchorClick(event)) return;
      const anchor = (
        event.target as Element | null
      )?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.dataset.projectReturn === "true") return;
      const expected = pending.current?.destination;
      if (expected && sameUrl(anchor.href, expected)) return;
      immediateOrigin.current = null;
      if (pending.current) cancelTransition();
    };

    window.addEventListener("popstate", traverse);
    window.addEventListener("hashchange", hashChanged);
    document.addEventListener("click", clicked, true);
    return () => {
      window.removeEventListener("popstate", traverse);
      window.removeEventListener("hashchange", hashChanged);
      document.removeEventListener("click", clicked, true);
      generation.current++;
      clearWatchdog();
      clearLayoutWait();
      clearMotion(true);
      pending.current = null;
    };
  }, [cancelTransition, clearLayoutWait, clearMotion, clearWatchdog]);

  const value: ProjectTransitionValue = {
    openProject,
    returnToProjects,
    state,
  };

  return (
    <ProjectTransitionContext.Provider value={value}>
      <div
        className={styles.root}
        data-project-motion={state}
        data-project-motion-ready={ready || undefined}
      >
        {children}
      </div>
      <Suspense fallback={null}>
        <QueryObserver onChange={observeRoute} />
      </Suspense>
    </ProjectTransitionContext.Provider>
  );
}
