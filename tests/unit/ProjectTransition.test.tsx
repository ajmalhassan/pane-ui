import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AppBar } from "@/components/metro/AppBar";
import {
  ProjectTransitionProvider,
  useProjectTransition,
} from "@/components/metro/ProjectTransitionProvider";
import { ProjectsPanel } from "@/components/portfolio/ProjectsPanel";
import { projects } from "@/lib/content/projects";

const navigation = vi.hoisted(() => ({
  pathname: "/",
  search: "view=projects",
  panoramaReady: true,
  back: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ back: navigation.back, push: navigation.push }),
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

type MockLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  onNavigate?: (event: { preventDefault(): void }) => void;
};

vi.mock("next/link", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  return {
    default: React.forwardRef<HTMLAnchorElement, MockLinkProps>(
      function MockNextLink({ href, onClick, onNavigate, ...props }, ref) {
        return (
          <a
            {...props}
            href={href}
            onClick={(event) => {
              onClick?.(event);
              if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;

              let prevented = false;
              onNavigate?.({ preventDefault: () => (prevented = true) });
              event.preventDefault();
              if (!prevented) navigation.push(href);
            }}
            ref={ref}
          />
        );
      },
    ),
  };
});

type Run = {
  element: HTMLElement;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  cancelled: boolean;
  disposed: boolean;
  resolve(): void;
};

function controlledAnimations() {
  const runs: Run[] = [];
  const adapter = {
    available: true,
    animate(
      element: HTMLElement,
      keyframes: Keyframe[],
      options: KeyframeAnimationOptions,
    ) {
      let finish!: () => void;
      let reject!: (reason: Error) => void;
      const finished = new Promise<void>((resolve, rejectPromise) => {
        finish = resolve;
        reject = rejectPromise;
      });
      const run: Run = {
        element,
        keyframes,
        options,
        cancelled: false,
        disposed: false,
        resolve: finish,
      };
      runs.push(run);
      return {
        cancel() {
          run.cancelled = true;
          reject(new Error("cancelled"));
        },
        dispose() {
          run.disposed = true;
        },
        finished,
      };
    },
  };

  return { adapter, runs };
}

function setReducedMotion(reduced: boolean) {
  vi.mocked(window.matchMedia).mockImplementation(
    (query: string) =>
      ({
        matches: reduced && query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  );
}

function Home() {
  return (
    <div data-panorama data-motion-state="idle">
      <div
        data-motion-ready={navigation.panoramaReady ? "true" : "false"}
        data-panorama-surface
      >
        <section data-active="true" data-pivot="projects">
          <ProjectsPanel projects={projects} />
        </section>
      </div>
    </div>
  );
}

function Detail() {
  return (
    <>
      <div data-project-reading>
        <h1 tabIndex={-1}>Project detail</h1>
      </div>
      <AppBar
        actions={[
          {
            href: "/?view=projects",
            icon: "back",
            label: "Projects",
            projectReturn: true,
          },
        ]}
      />
    </>
  );
}

function Route() {
  return navigation.pathname.startsWith("/projects/") ? <Detail /> : <Home />;
}

function Boundary({
  adapter,
}: {
  adapter: ReturnType<typeof controlledAnimations>["adapter"];
}) {
  return (
    <ProjectTransitionProvider animationAdapter={adapter}>
      <Route />
    </ProjectTransitionProvider>
  );
}

function Status() {
  const transition = useProjectTransition();
  return <output>{transition?.state ?? "missing"}</output>;
}

async function finish(runs: readonly Run[]) {
  await act(async () => {
    for (const run of runs) run.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  navigation.pathname = "/";
  navigation.search = "view=projects";
  navigation.panoramaReady = true;
  navigation.back.mockReset();
  navigation.push.mockReset();
  setReducedMotion(false);
  window.history.replaceState(null, "", "/?view=projects");
  Object.defineProperties(window, {
    scrollX: { configurable: true, value: 12 },
    scrollY: { configurable: true, value: 345 },
    scrollTo: { configurable: true, value: vi.fn() },
  });
});

afterEach(() => vi.useRealTimers());

it("keeps the href while exiting, pushes once after tiles turn away, then enters and focuses the detail heading", async () => {
  const motion = controlledAnimations();
  const view = render(<Boundary adapter={motion.adapter} />);
  await waitFor(() =>
    expect(
      document.querySelector("[data-project-motion-ready=true]"),
    ).not.toBeNull(),
  );

  const tile = screen.getAllByRole("link")[1];
  expect(tile).toHaveAttribute("href", `/projects/${projects[1].slug}`);
  fireEvent.click(tile);

  expect(document.querySelector("[data-project-motion]")).toHaveAttribute(
    "data-project-motion",
    "exiting",
  );
  expect(window.location.pathname).toBe("/");
  expect(navigation.push).not.toHaveBeenCalled();
  expect(motion.runs).toHaveLength(projects.length);
  const selectedDelay = Number(
    motion.runs.find((run) => run.element === tile)?.options.delay,
  );
  expect(selectedDelay).toBe(
    Math.max(...motion.runs.map((run) => Number(run.options.delay))),
  );
  expect(motion.runs.at(-1)?.element).toBe(tile);
  expect(motion.runs.every((run) => run.options.duration === 220)).toBe(true);
  expect(motion.runs.every((run) => Number(run.options.delay) <= 100)).toBe(
    true,
  );

  await finish(motion.runs);
  expect(navigation.push).toHaveBeenCalledOnce();
  expect(navigation.push).toHaveBeenCalledWith(`/projects/${projects[1].slug}`);
  expect(document.querySelector("[data-project-motion]")).toHaveAttribute(
    "data-project-motion",
    "navigating",
  );

  navigation.pathname = `/projects/${projects[1].slug}`;
  navigation.search = "";
  window.history.replaceState(null, "", navigation.pathname);
  view.rerender(<Boundary adapter={motion.adapter} />);

  await waitFor(() => expect(motion.runs).toHaveLength(projects.length + 1));
  expect(motion.runs.at(-1)?.options.duration).toBe(260);
  expect(document.querySelector("[data-project-motion]")).toHaveAttribute(
    "data-project-motion",
    "entering",
  );
  await finish(motion.runs.slice(projects.length));
  await waitFor(() => expect(screen.getByRole("heading")).toHaveFocus());
  expect(document.querySelector("[data-project-motion]")).toHaveAttribute(
    "data-project-motion",
    "idle",
  );
});

it("lets modified and middle clicks stay native", () => {
  const motion = controlledAnimations();
  render(<Boundary adapter={motion.adapter} />);
  const tile = screen.getAllByRole("link")[0];
  tile.addEventListener("click", (event) => event.preventDefault());

  fireEvent.click(tile, { metaKey: true });
  fireEvent.click(tile, { button: 1 });

  expect(motion.runs).toHaveLength(0);
  expect(navigation.push).not.toHaveBeenCalled();
});

it("falls through to Next navigation without a provider", () => {
  render(
    <>
      <Status />
      <Home />
    </>,
  );

  fireEvent.click(screen.getAllByRole("link")[0]);

  expect(screen.getByText("missing")).toBeInTheDocument();
  expect(navigation.push).toHaveBeenCalledWith(`/projects/${projects[0].slug}`);
});

it("pushes immediately without spatial animation for reduced motion", async () => {
  setReducedMotion(true);
  const motion = controlledAnimations();
  render(<Boundary adapter={motion.adapter} />);
  await waitFor(() =>
    expect(
      document.querySelector("[data-project-motion-ready=true]"),
    ).not.toBeNull(),
  );

  fireEvent.click(screen.getAllByRole("link")[0]);

  expect(motion.runs).toHaveLength(0);
  expect(navigation.push).toHaveBeenCalledWith(`/projects/${projects[0].slug}`);
});

it("pushes immediately when Web Animations is unavailable", async () => {
  const adapter = {
    available: false,
    animate: vi.fn(() => {
      throw new Error("unavailable animation API was called");
    }),
  };
  render(<Boundary adapter={adapter} />);
  await waitFor(() =>
    expect(
      document.querySelector("[data-project-motion-ready=true]"),
    ).not.toBeNull(),
  );

  fireEvent.click(screen.getAllByRole("link")[0]);

  expect(adapter.animate).not.toHaveBeenCalled();
  expect(navigation.push).toHaveBeenCalledWith(`/projects/${projects[0].slug}`);
});

it("keeps navigation usable when the animation API throws", async () => {
  const adapter = {
    available: true,
    animate: vi.fn(() => {
      throw new Error("animation setup failed");
    }),
  };
  render(<Boundary adapter={adapter} />);
  await waitFor(() =>
    expect(
      document.querySelector("[data-project-motion-ready=true]"),
    ).not.toBeNull(),
  );

  fireEvent.click(screen.getAllByRole("link")[0]);

  expect(navigation.push).toHaveBeenCalledWith(`/projects/${projects[0].slug}`);
});

it("cancels spatial motion and navigates when reduced motion turns on mid-exit", async () => {
  let reduced = false;
  let changed: (() => void) | undefined;
  vi.mocked(window.matchMedia).mockImplementation(
    (query: string) =>
      ({
        get matches() {
          return reduced && query.includes("prefers-reduced-motion");
        },
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_event: string, listener: EventListener) => {
          changed = listener as () => void;
        },
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  );
  const motion = controlledAnimations();
  render(<Boundary adapter={motion.adapter} />);
  fireEvent.click(screen.getAllByRole("link")[0]);
  expect(motion.runs).toHaveLength(projects.length);

  reduced = true;
  act(() => changed?.());

  expect(motion.runs.every((run) => run.cancelled)).toBe(true);
  expect(navigation.push).toHaveBeenCalledOnce();
  expect(navigation.push).toHaveBeenCalledWith(`/projects/${projects[0].slug}`);
});

it("disposes a completed exit when reduced motion turns on while navigation is pending", async () => {
  let reduced = false;
  let changed: (() => void) | undefined;
  vi.mocked(window.matchMedia).mockImplementation(
    (query: string) =>
      ({
        get matches() {
          return reduced && query.includes("prefers-reduced-motion");
        },
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_event: string, listener: EventListener) => {
          changed = listener as () => void;
        },
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  );
  const motion = controlledAnimations();
  const view = render(<Boundary adapter={motion.adapter} />);
  fireEvent.click(screen.getAllByRole("link")[0]);
  const exit = motion.runs.slice();
  await finish(exit);
  expect(navigation.push).toHaveBeenCalledOnce();
  expect(exit.every((run) => !run.disposed)).toBe(true);

  reduced = true;
  act(() => changed?.());

  expect(exit.every((run) => run.disposed)).toBe(true);
  expect(navigation.push).toHaveBeenCalledOnce();

  navigation.pathname = `/projects/${projects[0].slug}`;
  navigation.search = "";
  window.history.replaceState(null, "", navigation.pathname);
  view.rerender(<Boundary adapter={motion.adapter} />);
  await waitFor(() => expect(screen.getByRole("heading")).toHaveFocus());
  expect(navigation.push).toHaveBeenCalledOnce();
});

it("restores faded tiles after the slow-navigation watchdog without discarding the pending commit", async () => {
  vi.useFakeTimers();
  const motion = controlledAnimations();
  const view = render(<Boundary adapter={motion.adapter} />);
  fireEvent.click(screen.getAllByRole("link")[0]);
  const exit = motion.runs.slice();
  await finish(exit);

  expect(exit.every((run) => !run.disposed)).toBe(true);
  act(() => vi.advanceTimersByTime(1499));
  expect(exit.every((run) => !run.disposed)).toBe(true);
  act(() => vi.advanceTimersByTime(1));
  expect(exit.every((run) => run.disposed)).toBe(true);
  expect(document.querySelector("[data-project-motion]")).toHaveAttribute(
    "data-project-motion",
    "navigating",
  );

  navigation.pathname = `/projects/${projects[0].slug}`;
  navigation.search = "";
  window.history.replaceState(null, "", navigation.pathname);
  view.rerender(<Boundary adapter={motion.adapter} />);
  await act(async () => Promise.resolve());
  expect(document.querySelector("[data-project-motion]")).toHaveAttribute(
    "data-project-motion",
    "entering",
  );
  vi.useRealTimers();
});

it("cancels a first exit so its stale completion cannot push", async () => {
  const motion = controlledAnimations();
  render(<Boundary adapter={motion.adapter} />);
  const tiles = screen.getAllByRole("link");

  fireEvent.click(tiles[0]);
  const first = motion.runs.slice();
  fireEvent.click(tiles[2]);
  const second = motion.runs.slice(first.length);

  expect(first.every((run) => run.cancelled)).toBe(true);
  await finish(first);
  expect(navigation.push).not.toHaveBeenCalled();
  await finish(second);
  expect(navigation.push).toHaveBeenCalledOnce();
  expect(navigation.push).toHaveBeenCalledWith(`/projects/${projects[2].slug}`);
});

it("cancels a pending exit when an unrelated ordinary link activates", async () => {
  const motion = controlledAnimations();
  render(<Boundary adapter={motion.adapter} />);
  const tile = screen.getAllByRole("link")[0];
  fireEvent.click(tile);
  const exiting = motion.runs.slice();

  const unrelated = document.createElement("a");
  unrelated.href = "/resume";
  unrelated.addEventListener("click", (event) => event.preventDefault());
  document.body.append(unrelated);
  fireEvent.click(unrelated);

  expect(exiting.every((run) => run.cancelled)).toBe(true);
  await finish(exiting);
  expect(navigation.push).not.toHaveBeenCalled();
  expect(document.querySelector("[data-project-motion]")).toHaveAttribute(
    "data-project-motion",
    "idle",
  );
  unrelated.remove();
});

it("cancels a committed detail entrance when an unrelated link activates", async () => {
  const motion = controlledAnimations();
  const view = render(<Boundary adapter={motion.adapter} />);
  fireEvent.click(screen.getAllByRole("link")[0]);
  await finish(motion.runs);

  navigation.pathname = `/projects/${projects[0].slug}`;
  navigation.search = "";
  window.history.replaceState(null, "", navigation.pathname);
  view.rerender(<Boundary adapter={motion.adapter} />);
  await waitFor(() => expect(motion.runs).toHaveLength(projects.length + 1));
  const entrance = motion.runs.at(-1)!;

  const unrelated = document.createElement("a");
  unrelated.href = "/resume";
  unrelated.addEventListener("click", (event) => event.preventDefault());
  document.body.append(unrelated);
  fireEvent.click(unrelated);
  unrelated.remove();

  expect(entrance.cancelled).toBe(true);
  await finish([entrance]);
  expect(screen.getByRole("heading")).not.toHaveFocus();
  expect(document.querySelector("[data-project-motion]")).toHaveAttribute(
    "data-project-motion",
    "idle",
  );
});

it("uses the fallback on direct entry and known history adjacency only after its own committed push", async () => {
  navigation.pathname = `/projects/${projects[0].slug}`;
  navigation.search = "";
  window.history.replaceState(null, "", navigation.pathname);
  const directMotion = controlledAnimations();
  const direct = render(<Boundary adapter={directMotion.adapter} />);

  fireEvent.click(screen.getByRole("link", { name: "Projects" }));
  expect(directMotion.runs).toHaveLength(1);
  await finish(directMotion.runs);
  expect(navigation.back).not.toHaveBeenCalled();
  expect(navigation.push).toHaveBeenCalledWith("/?view=projects");
  direct.unmount();

  navigation.pathname = "/";
  navigation.search = "view=projects";
  navigation.push.mockReset();
  window.history.replaceState(null, "", "/?view=projects");
  const motion = controlledAnimations();
  const view = render(<Boundary adapter={motion.adapter} />);
  fireEvent.click(screen.getAllByRole("link")[0]);
  await finish(motion.runs);
  navigation.pathname = `/projects/${projects[0].slug}`;
  navigation.search = "";
  window.history.replaceState(null, "", navigation.pathname);
  view.rerender(<Boundary adapter={motion.adapter} />);
  await waitFor(() => expect(motion.runs).toHaveLength(projects.length + 1));
  await finish(motion.runs.slice(projects.length));

  fireEvent.click(screen.getByRole("link", { name: "Projects" }));
  const detailExit = motion.runs.slice(projects.length + 1);
  expect(detailExit).toHaveLength(1);
  await finish(detailExit);
  expect(navigation.back).toHaveBeenCalledOnce();
  expect(navigation.push).toHaveBeenCalledTimes(1);
});

it("invalidates history adjacency on query changes while retaining the restoration snapshot", async () => {
  const motion = controlledAnimations();
  const view = render(<Boundary adapter={motion.adapter} />);
  const source = screen.getAllByRole("link")[0];
  fireEvent.click(source);
  await finish(motion.runs);
  navigation.pathname = `/projects/${projects[0].slug}`;
  navigation.search = "";
  window.history.replaceState(null, "", navigation.pathname);
  view.rerender(<Boundary adapter={motion.adapter} />);
  await waitFor(() => expect(motion.runs).toHaveLength(projects.length + 1));
  await finish(motion.runs.slice(projects.length));

  navigation.search = "preview=1";
  window.history.replaceState(null, "", `${navigation.pathname}?preview=1`);
  view.rerender(<Boundary adapter={motion.adapter} />);
  fireEvent.click(screen.getByRole("link", { name: "Projects" }));
  const exit = motion.runs.slice(projects.length + 1);
  await finish(exit);

  expect(navigation.back).not.toHaveBeenCalled();
  expect(navigation.push).toHaveBeenLastCalledWith("/?view=projects");
});

it("preserves the restoration snapshot across native Back and makes Forward ineligible for app-command back", async () => {
  const motion = controlledAnimations();
  const view = render(<Boundary adapter={motion.adapter} />);
  const projectHref = `/projects/${projects[0].slug}`;
  fireEvent.click(screen.getAllByRole("link")[0]);
  await finish(motion.runs);
  navigation.pathname = projectHref;
  navigation.search = "";
  window.history.replaceState(null, "", projectHref);
  view.rerender(<Boundary adapter={motion.adapter} />);
  await waitFor(() => expect(motion.runs).toHaveLength(projects.length + 1));
  await finish(motion.runs.slice(projects.length));

  window.history.replaceState(null, "", "/?view=projects");
  window.dispatchEvent(new PopStateEvent("popstate"));
  navigation.pathname = "/";
  navigation.search = "view=projects";
  view.rerender(<Boundary adapter={motion.adapter} />);
  await waitFor(() =>
    expect(motion.runs).toHaveLength(projects.length * 2 + 1),
  );
  expect(window.scrollTo).toHaveBeenCalledWith(12, 345);
  const arrival = motion.runs.slice(projects.length + 1);
  expect(arrival[0]?.element).toHaveAttribute("href", projectHref);
  expect(arrival.every((run) => run.options.duration === 220)).toBe(true);
  await finish(arrival);
  expect(screen.getAllByRole("link")[0]).toHaveFocus();

  window.history.replaceState(null, "", projectHref);
  window.dispatchEvent(new PopStateEvent("popstate"));
  navigation.pathname = projectHref;
  navigation.search = "";
  view.rerender(<Boundary adapter={motion.adapter} />);
  fireEvent.click(screen.getByRole("link", { name: "Projects" }));
  const forwardExit = motion.runs.slice(projects.length * 2 + 1);
  await finish(forwardExit);

  expect(navigation.back).not.toHaveBeenCalled();
  expect(navigation.push).toHaveBeenLastCalledWith("/?view=projects");
});

it("cancels a committed return readiness wait when a later homepage query wins", async () => {
  const motion = controlledAnimations();
  const view = render(<Boundary adapter={motion.adapter} />);
  const projectHref = `/projects/${projects[0].slug}`;
  fireEvent.click(screen.getAllByRole("link")[0]);
  await finish(motion.runs);
  navigation.pathname = projectHref;
  navigation.search = "";
  window.history.replaceState(null, "", projectHref);
  view.rerender(<Boundary adapter={motion.adapter} />);
  await waitFor(() => expect(motion.runs).toHaveLength(projects.length + 1));
  await finish(motion.runs.slice(projects.length));

  fireEvent.click(screen.getByRole("link", { name: "Projects" }));
  const detailExit = motion.runs.slice(projects.length + 1);
  await finish(detailExit);
  navigation.panoramaReady = false;
  navigation.pathname = "/";
  navigation.search = "view=projects";
  window.history.replaceState(null, "", "/?view=projects");
  view.rerender(<Boundary adapter={motion.adapter} />);
  await act(async () => Promise.resolve());
  const runsBeforeInterruption = motion.runs.length;
  expect(window.scrollTo).not.toHaveBeenCalled();

  navigation.search = "view=me";
  window.history.replaceState(null, "", "/?view=me");
  view.rerender(<Boundary adapter={motion.adapter} />);
  await act(async () => Promise.resolve());
  navigation.panoramaReady = true;
  view.rerender(<Boundary adapter={motion.adapter} />);
  await act(async () => Promise.resolve());

  expect(motion.runs).toHaveLength(runsBeforeInterruption);
  expect(window.scrollTo).not.toHaveBeenCalled();
  expect(document.querySelector("[data-project-motion]")).toHaveAttribute(
    "data-project-motion",
    "idle",
  );
});
