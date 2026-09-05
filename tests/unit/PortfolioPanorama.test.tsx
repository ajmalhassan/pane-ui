import {
  act,
  cleanup,
  createEvent,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PortfolioPanorama } from "@/components/portfolio/PortfolioPanorama";
import { profile } from "@/content/profile";
import { projects } from "@/lib/content/projects";

const HEADINGS = {
  me: "technical leader / builder",
  projects: "projects",
  blog: "blog",
  photography: "photography",
} as const;

const REPEATED_HEADING = /^(technical leader \/ builder|projects|blog|photography)$/i;

function resetUrl() {
  window.history.replaceState(null, "", "/");
}

function contactMarker() {
  return (window.history.state as { portfolioContact?: boolean } | null)
    ?.portfolioContact;
}

function contactSection() {
  return document.getElementById("contact");
}

beforeEach(resetUrl);

afterEach(async () => {
  cleanup();
  // jsdom's replaceState cannot cancel a queued fragment traversal; drain one macrotask so no test leaks navigation into the next.
  await new Promise((resolve) => setTimeout(resolve, 0));
  resetUrl();
});

it.each(["me", "projects", "blog", "photography"] as const)(
  "names the one page heading after the initially active %s pivot",
  (initialPivot) => {
    render(
      <PortfolioPanorama
        initialPivot={initialPivot}
        projects={projects}
        posts={[]}
      />,
    );

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveAccessibleName(HEADINGS[initialPivot]);
    expect(headings[0]).toBeVisible();
  },
);

it("renders the Me-first portfolio with link-owned navigation", () => {
  render(
    <PortfolioPanorama initialPivot="me" projects={projects} posts={[]} />,
  );

  expect(screen.getByRole("tab", { name: HEADINGS.me })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(
    screen.getByRole("heading", { level: 1, name: HEADINGS.me }),
  ).toBeVisible();
  expect(screen.getByRole("tab", { name: HEADINGS.projects })).toHaveAttribute(
    "href",
    "/?view=projects",
  );
  expect(screen.getByRole("link", { name: "Résumé" })).toHaveAttribute(
    "href",
    "/resume",
  );
});

it.each(["me", "projects", "blog", "photography"] as const)(
  "makes the %s heading the navigation instead of repeating it in the panel",
  (initialPivot) => {
    render(
      <PortfolioPanorama
        initialPivot={initialPivot}
        projects={projects}
        posts={[]}
      />,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Portfolio sections",
    });
    const heading = screen.getByRole("heading", { level: 1 });

    expect(navigation).toContainElement(heading);
    expect(heading).toHaveAccessibleName(HEADINGS[initialPivot]);
    expect(
      screen.queryByText(/selected systems \/ working drafts/i),
    ).toBeNull();
    expect(
      screen
        .queryAllByRole("heading", { hidden: true, level: 2 })
        .map((entry) => entry.textContent?.trim() ?? "")
        .filter((text) => REPEATED_HEADING.test(text)),
    ).toEqual([]);
  },
);

/*
 * Me is a personal Start screen now: one lede stating the proposition, then the
 * tile grid. The identity line lives in the status bar and the pivot name is
 * the page heading, so the panel adds no third identity line of its own.
 */
it("opens Me with the AI-native proposition above the Start-screen grid", () => {
  render(
    <PortfolioPanorama initialPivot="me" projects={projects} posts={[]} />,
  );
  const me = screen.getByRole("tabpanel", { name: HEADINGS.me });

  const lede = within(me).getByText(profile.bio);
  expect(lede).toBeVisible();
  expect(lede).toHaveTextContent(/ai-native/i);
  expect(lede).toHaveTextContent(/learning/i);
  expect(lede).toHaveTextContent(/assessment/i);
  expect(lede).toHaveTextContent(/business outcomes/i);

  expect(
    within(me).getByRole("img", { name: "Portrait of Ajmal Hassan" }),
  ).toBeVisible();
  expect(
    within(me).getByText("capability graph", { exact: false }),
  ).toBeVisible();
  expect(
    within(me).queryByText(/ajmal hassan \/ product engineering/i),
  ).toBeNull();
  expect(within(me).queryByText(profile.headline)).toBeNull();
});

it("updates the selected pivot without taking URL ownership from the link", () => {
  render(
    <PortfolioPanorama initialPivot="me" projects={projects} posts={[]} />,
  );
  const projectsTab = screen.getByRole("tab", { name: HEADINGS.projects });
  projectsTab.addEventListener("click", (event) => event.preventDefault());

  fireEvent.click(projectsTab);

  expect(projectsTab).toHaveAttribute("aria-selected", "true");
  expect(projectsTab).toHaveAttribute("href", "/?view=projects");
  // The panel is now on screen, which the leading tile's own evidence proves.
  // It asks for the face rather than the caption: those are deliberately
  // different strings, and which one appears is `ProjectsPanel.test.tsx`'s
  // business, not this file's.
  expect(screen.getByText(projects[0].tileHeadline)).toBeVisible();
});

it("restores selection when server query state changes", () => {
  const { rerender } = render(
    <PortfolioPanorama initialPivot="me" projects={projects} posts={[]} />,
  );

  rerender(
    <PortfolioPanorama
      initialPivot="photography"
      projects={projects}
      posts={[]}
    />,
  );

  expect(screen.getByRole("tab", { name: HEADINGS.photography })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

it("enhances the contact destination and records a history marker", async () => {
  const user = userEvent.setup();
  render(
    <PortfolioPanorama initialPivot="me" projects={projects} posts={[]} />,
  );
  const contact = screen.getByRole("link", { name: "Contact" });

  expect(contact).toHaveAttribute("href", "#contact");
  expect(screen.getByRole("link", { name: "Résumé" })).toHaveAttribute(
    "href",
    "/resume",
  );
  expect(contactSection()).toBeInTheDocument();
  expect(contactSection()).toHaveAttribute("data-open", "false");

  await user.click(contact);

  expect(window.location.hash).toBe("#contact");
  expect(contactMarker()).toBe(true);
  expect(contactSection()).toHaveAttribute("data-open", "true");
});

it("prevents the default anchor navigation for ordinary contact clicks", () => {
  render(
    <PortfolioPanorama initialPivot="me" projects={projects} posts={[]} />,
  );
  const contact = screen.getByRole("link", { name: "Contact" });

  const clickEvent = createEvent.click(contact, { button: 0 });
  fireEvent(contact, clickEvent);

  expect(clickEvent.defaultPrevented).toBe(true);
});

it("leaves modified contact clicks to the browser", async () => {
  render(
    <PortfolioPanorama initialPivot="me" projects={projects} posts={[]} />,
  );
  const contact = screen.getByRole("link", { name: "Contact" });

  const metaClick = createEvent.click(contact, { button: 0, metaKey: true });
  fireEvent(contact, metaClick);

  expect(metaClick.defaultPrevented).toBe(false);
  expect(window.location.hash).toBe("");
  expect(contactSection()).toHaveAttribute("data-open", "false");

  await waitFor(() => {
    expect(window.location.hash).toBe("#contact");
  });
  expect(contactMarker()).toBeUndefined();
});

it("returns to the previous history entry and refocuses when contact closes", async () => {
  const user = userEvent.setup();
  render(
    <PortfolioPanorama initialPivot="me" projects={projects} posts={[]} />,
  );
  const contact = screen.getByRole("link", { name: "Contact" });

  await user.click(contact);
  expect(window.location.hash).toBe("#contact");
  expect(contactMarker()).toBe(true);
  const lengthBefore = window.history.length;

  await user.click(screen.getByRole("button", { name: "Close contact" }));

  await waitFor(() => {
    expect(window.location.hash).toBe("");
  });
  await waitFor(() => {
    expect(contactSection()).toHaveAttribute("data-open", "false");
  });
  expect(contact).toHaveFocus();
  expect(window.history.length).toBe(lengthBefore);
});

it("opens from a direct fragment load and clears only the fragment on close", async () => {
  const user = userEvent.setup();
  window.history.replaceState(null, "", "/?view=projects#contact");
  render(
    <PortfolioPanorama
      initialPivot="projects"
      projects={projects}
      posts={[]}
    />,
  );

  await waitFor(() => {
    expect(contactSection()).toHaveAttribute("data-open", "true");
  });
  expect(contactMarker()).toBeUndefined();

  await user.click(screen.getByRole("button", { name: "Close contact" }));

  expect(window.location.hash).toBe("");
  expect(window.location.pathname).toBe("/");
  expect(window.location.search).toBe("?view=projects");
  expect(contactSection()).toHaveAttribute("data-open", "false");
  expect(screen.getByRole("link", { name: "Contact" })).toHaveFocus();
});

it("closes contact when the browser moves back through history", async () => {
  const user = userEvent.setup();
  render(
    <PortfolioPanorama initialPivot="me" projects={projects} posts={[]} />,
  );

  await user.click(screen.getByRole("link", { name: "Contact" }));
  expect(contactSection()).toHaveAttribute("data-open", "true");

  window.history.back();

  await waitFor(() => {
    expect(contactSection()).toHaveAttribute("data-open", "false");
  });
  expect(window.location.hash).toBe("");
});

/*
 * ---------------------------------------------------------------------------
 * The shell's own state, published
 * ---------------------------------------------------------------------------
 *
 * `data-active-pivot` is what selects the atmosphere behind the page -- the
 * node traces on Me, the transit lines on Projects, the quiet rules on Blog --
 * and it is the hook Phase 3's transition engine will read for the same reason.
 * `--panorama-index` beside it is the number that shifts the pattern: the
 * plane's own copy of it lives on a descendant, and a background layer painted
 * on the shell cannot read a property set below it.
 */
it.each(["me", "projects", "blog", "photography"] as const)(
  "publishes %s on the shell for the atmosphere behind it",
  (initialPivot) => {
    const { container } = render(
      <PortfolioPanorama
        initialPivot={initialPivot}
        projects={projects}
        posts={[]}
      />,
    );

    const shell = container.querySelector("main");
    expect(shell).toHaveAttribute("data-active-pivot", initialPivot);
    expect(shell?.style.getPropertyValue("--panorama-index")).toBe(
      String(["me", "projects", "blog", "photography"].indexOf(initialPivot)),
    );
  },
);

it("moves the published pivot with the reader's own selection", async () => {
  const user = userEvent.setup();
  const { container } = render(
    <PortfolioPanorama initialPivot="me" projects={projects} posts={[]} />,
  );
  const shell = container.querySelector("main");

  expect(shell).toHaveAttribute("data-active-pivot", "me");

  await user.click(screen.getByRole("tab", { name: HEADINGS.blog }));

  expect(shell).toHaveAttribute("data-active-pivot", "blog");
  expect(shell?.style.getPropertyValue("--panorama-index")).toBe("2");
});

/*
 * The two live tiles are a Start-screen guarantee, and the Start screen only
 * exists inside this shell -- so the phase between them is asserted here as
 * well as on the tiles themselves. Six seconds apart on the same beat would
 * satisfy every per-tile test and still blink.
 */
it("keeps the two Me evidence tiles a phase apart", () => {
  vi.useFakeTimers();
  try {
    render(
      <PortfolioPanorama initialPivot="me" projects={projects} posts={[]} />,
    );

    const live = () =>
      [
        ...document.querySelectorAll<HTMLElement>('[data-tile-role="live"]'),
      ].map((tile) => tile.dataset.liveIndex);

    expect(live()).toEqual(["0", "0"]);

    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(live()).toEqual(["1", "0"]);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(live()).toEqual(["1", "1"]);
  } finally {
    vi.useRealTimers();
  }
});
