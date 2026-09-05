import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MetroTile, tileTextClass } from "@/components/metro/MetroTile";
import styles from "@/components/metro/MetroTile.module.css";

const CLAIMS = [
  <span key="engineers">5 frontend engineers</span>,
  <span key="squads">5 learning squads</span>,
  <span key="years">8 years shipping</span>,
];

const EVIDENCE_NAME =
  "Evidence: 5 frontend engineers, 5 learning squads, 8 years shipping";

/**
 * The setup file installs one shared `matchMedia` mock; every test that cares
 * about motion states its own answer so none of them inherits another's.
 */
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

/**
 * jsdom lays nothing out, so every `getBoundingClientRect()` is all zeros and
 * the tilt helpers' zero-size guard returns before any pointer-type check runs.
 * A real box is the only way a unit test can see a tilt written.
 */
function stubBox(
  element: Element,
  { width, height }: { width: number; height: number },
) {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    width,
    height,
    right: width,
    bottom: height,
    toJSON: () => ({}),
  } as DOMRect);
}

/*
 * `document.hidden` is a getter on `Document.prototype`, so overriding it puts
 * an own property on the instance that outlives the test that wrote it. The
 * original descriptor is captured once and put back after every test -- a test
 * that ends hidden must not decide what the next one sees.
 */
const OWN_HIDDEN = Object.getOwnPropertyDescriptor(document, "hidden");

function setDocumentHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => hidden,
  });
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

function restoreDocumentHidden() {
  if (OWN_HIDDEN) {
    Object.defineProperty(document, "hidden", OWN_HIDDEN);
    return;
  }

  // There was no own property to begin with: deleting the one a test installed
  // uncovers jsdom's own prototype getter again. `document.hidden` is readonly
  // to TypeScript, so the delete goes through Reflect rather than a cast.
  Reflect.deleteProperty(document, "hidden");
}

beforeEach(() => {
  setReducedMotion(false);
});

afterEach(() => {
  setReducedMotion(false);
  restoreDocumentHidden();
});

function renderLive(props: Partial<Record<string, unknown>> = {}) {
  return render(
    <MetroTile
      accessibleLabel={EVIDENCE_NAME}
      items={CLAIMS}
      label="evidence"
      role="live"
      size="wide"
      {...props}
    />,
  );
}

describe("navigation tiles", () => {
  it("makes the whole tile the one link to its destination", () => {
    const { container } = render(
      <MetroTile
        href="/projects/metro-revival"
        label="Lumia Metro Revival"
        role="navigation"
        size="hero"
      >
        <strong>Lumia Metro Revival</strong>
      </MetroTile>,
    );

    const link = screen.getByRole("link");
    expect(container.firstElementChild).toBe(link);
    expect(container.querySelectorAll("a")).toHaveLength(1);
    expect(container.querySelector("button")).toBeNull();
    expect(link).toHaveAttribute("href", "/projects/metro-revival");
    expect(link).toHaveAttribute("data-tile-role", "navigation");
    expect(
      within(link).getByText("Lumia Metro Revival", { selector: "strong" }),
    ).toBeVisible();
  });

  /*
   * A navigation tile is a real anchor, so it cannot be a `Pressable` -- it
   * spreads the same shared tilt bundle instead. This is what proves it is
   * wired to that bundle rather than to a second copy of the maths: both
   * halves of the parity contract (a touch press tilts, a moving touch pointer
   * does not) have to be visible on the tile itself.
   */
  it("presses with the same touch parity every other surface has", () => {
    render(
      <MetroTile
        href="/projects/metro-revival"
        label="Lumia Metro Revival"
        role="navigation"
        size="hero"
      >
        <strong>Lumia Metro Revival</strong>
      </MetroTile>,
    );

    const link = screen.getByRole("link");
    stubBox(link, { width: 100, height: 50 });

    fireEvent.pointerMove(link, {
      clientX: 75,
      clientY: 12.5,
      pointerType: "touch",
    });
    expect(link.style.getPropertyValue("--press-rotate-x")).toBe("");

    fireEvent.pointerDown(link, {
      clientX: 75,
      clientY: 12.5,
      pointerType: "touch",
    });
    expect(link.style.getPropertyValue("--press-rotate-x")).toMatch(/deg$/);
    expect(link.style.getPropertyValue("--press-rotate-y")).toMatch(/deg$/);

    fireEvent.pointerCancel(link);
    expect(link.style.getPropertyValue("--press-rotate-x")).toBe("");
    expect(link.style.getPropertyValue("--press-rotate-y")).toBe("");
  });
});

describe("display tiles", () => {
  /*
   * The root is a plain `<div>` on purpose. An `<article>` with no accessible
   * name still shows up in a screen reader's element list, so a Start screen of
   * static tiles would hand a reader a column of unnamed articles to walk past.
   */
  it("presents static evidence with no interactive owner at all", () => {
    const { container } = render(
      <MetroTile accent="cyan" label="Lumia 520" role="display" size="small">
        <strong>first smartphone</strong>
      </MetroTile>,
    );

    const root = container.firstElementChild;
    expect(root?.tagName).toBe("DIV");
    expect(root).toHaveAttribute("data-tile-role", "display");
    expect(container.querySelector("article")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector("button")).toBeNull();
    expect(screen.getByText("first smartphone")).toBeVisible();
  });
});

describe("reveal tiles", () => {
  it("swaps which face is exposed and keeps the idle one out of the tree", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MetroTile
        back={<span>Curriculum to placement</span>}
        front={<span>Current system</span>}
        label="Capability graph"
        role="reveal"
        size="large"
      />,
    );

    const button = screen.getByRole("button");
    const front = container.querySelector('[data-face="front"]');
    const back = container.querySelector('[data-face="back"]');

    expect(container.firstElementChild).toBe(button);
    expect(container.querySelectorAll("button")).toHaveLength(1);
    expect(container.querySelector("a")).toBeNull();
    expect(button).toHaveAttribute("data-tile-role", "reveal");

    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(front).toHaveAttribute("aria-hidden", "false");
    expect(back).toHaveAttribute("aria-hidden", "true");

    await user.click(button);

    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(front).toHaveAttribute("aria-hidden", "true");
    expect(back).toHaveAttribute("aria-hidden", "false");
  });

  /*
   * A control whose *name* changes when it is pressed is a different control to
   * a screen reader user. Left to compute its name from its own contents this
   * button would be called "Current system Capability graph" and then
   * "Curriculum to placement Capability graph" -- so the caption is pinned as
   * the name and the face on show is demoted to the description, which is
   * exactly the half that is allowed to change.
   */
  it("keeps one name across a press and moves only its description", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MetroTile
        back={<span>Curriculum to placement</span>}
        front={<span>Current system</span>}
        label="Capability graph"
        role="reveal"
        size="large"
      />,
    );

    const button = screen.getByRole("button");
    const front = container.querySelector('[data-face="front"]');
    const back = container.querySelector('[data-face="back"]');

    expect(front?.id).toBeTruthy();
    expect(back?.id).toBeTruthy();
    expect(front?.id).not.toBe(back?.id);

    expect(button).toHaveAccessibleName("Capability graph");
    expect(button).toHaveAttribute("aria-describedby", front?.id ?? "");
    expect(button).toHaveAccessibleDescription("Current system");
    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);

    expect(button).toHaveAccessibleName("Capability graph");
    expect(button).toHaveAttribute("aria-describedby", back?.id ?? "");
    expect(button).toHaveAccessibleDescription("Curriculum to placement");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("drops the spatial flip when the reader asked for reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(
      <MetroTile
        back={<span>Curriculum to placement</span>}
        front={<span>Current system</span>}
        label="Capability graph"
        role="reveal"
      />,
    );

    const back = container.querySelector('[data-face="back"]');

    expect(container.firstElementChild).toHaveAttribute(
      "data-motion",
      "reduced",
    );
    expect(styles.faceAway).toBeTruthy();
    expect(back).not.toHaveClass(styles.faceAway);
    expect(back).toHaveClass(styles.faceHidden);
    // Evidence is never deleted, only hidden from the tree it is not on.
    expect(screen.getByText("Curriculum to placement")).toBeInTheDocument();
  });
});

describe("live tiles", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function advanceBy(ms: number) {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  }

  it("exposes one stable name and never announces its own changes", () => {
    const { container } = renderLive();

    const button = screen.getByRole("button", { name: EVIDENCE_NAME });
    expect(container.firstElementChild).toBe(button);
    expect(container.querySelectorAll("button")).toHaveLength(1);
    expect(button).toHaveAttribute("data-tile-role", "live");

    const region = container.querySelector("[aria-live]");
    expect(region).toHaveAttribute("aria-live", "off");
    expect(region).toHaveAttribute("aria-hidden", "true");

    // Server-rendered claim: meaningful before any timer has run.
    expect(screen.getByText("5 frontend engineers")).toBeInTheDocument();
    expect(button).toHaveAttribute("data-live-index", "0");
  });

  it("cycles to the next claim every six seconds", () => {
    renderLive();

    advanceBy(6000);
    expect(screen.getByText("5 learning squads")).toBeInTheDocument();
    expect(screen.queryByText("5 frontend engineers")).toBeNull();
  });

  /*
   * The control for all three pause tests below, and the reason they are worth
   * anything. Twelve seconds is deliberately *not* a whole number of laps
   * around a three-claim set: a running tile lands on index 2, so "index 0"
   * cannot be reached by a cycle that ran and merely wrapped back around. Every
   * pause test asserts on `data-live-index` for the same reason -- the visible
   * claim at index 0 and the visible claim after three ticks are the same text,
   * and an assertion that cannot tell them apart proves nothing.
   */
  it("moves two claims in twelve seconds when nothing is holding it", () => {
    renderLive();
    const button = screen.getByRole("button");

    advanceBy(12_000);
    expect(button).toHaveAttribute("data-live-index", "2");
    expect(screen.getByText("8 years shipping")).toBeInTheDocument();
  });

  it("pauses under a hovering pointer and resumes when it leaves", () => {
    renderLive();
    const button = screen.getByRole("button");

    fireEvent.pointerEnter(button);
    advanceBy(12_000);
    expect(button).toHaveAttribute("data-live-index", "0");
    expect(screen.getByText("5 frontend engineers")).toBeInTheDocument();

    fireEvent.pointerLeave(button);
    advanceBy(6000);
    expect(button).toHaveAttribute("data-live-index", "1");
    expect(screen.getByText("5 learning squads")).toBeInTheDocument();
  });

  it("pauses while the keyboard holds focus on it", () => {
    renderLive();
    const button = screen.getByRole("button");

    fireEvent.focus(button);
    advanceBy(12_000);
    expect(button).toHaveAttribute("data-live-index", "0");
    expect(screen.getByText("5 frontend engineers")).toBeInTheDocument();

    fireEvent.blur(button);
    advanceBy(6000);
    expect(button).toHaveAttribute("data-live-index", "1");
    expect(screen.getByText("5 learning squads")).toBeInTheDocument();
  });

  it("advances at once when the reader activates it", () => {
    renderLive();
    const button = screen.getByRole("button");

    fireEvent.click(button);

    expect(screen.getByText("5 learning squads")).toBeInTheDocument();
    expect(button).toHaveAttribute("data-live-index", "1");
    // The accessible name summarises every claim, so it never moves.
    expect(button).toHaveAccessibleName(EVIDENCE_NAME);
  });

  it("stops cycling while its document is hidden", () => {
    renderLive();
    const button = screen.getByRole("button");

    setDocumentHidden(true);
    advanceBy(12_000);
    expect(button).toHaveAttribute("data-live-index", "0");
    expect(screen.getByText("5 frontend engineers")).toBeInTheDocument();

    setDocumentHidden(false);
    advanceBy(6000);
    expect(button).toHaveAttribute("data-live-index", "1");
    expect(screen.getByText("5 learning squads")).toBeInTheDocument();
  });

  /*
   * One claim cannot cycle, so a button here would be a control that does
   * nothing at all: pressing it advances to the item already on screen. The
   * tile degrades to its static form rather than offering a dead affordance.
   */
  it("degrades to a static tile when it has a single claim", () => {
    const { container } = render(
      <MetroTile
        accessibleLabel="Evidence: 8 years shipping"
        items={[<span key="years">8 years shipping</span>]}
        label="evidence"
        role="live"
        size="wide"
      />,
    );

    const root = container.firstElementChild;
    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    expect(root?.tagName).toBe("DIV");
    expect(root).toHaveAttribute("data-tile-role", "display");
    expect(screen.getByText("8 years shipping")).toBeVisible();
    expect(screen.getByText("evidence")).toBeVisible();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("swaps claims immediately under reduced motion", () => {
    setReducedMotion(true);
    const { container } = renderLive();

    expect(container.firstElementChild).toHaveAttribute(
      "data-motion",
      "reduced",
    );
    expect(styles.liveItemAnimated).toBeTruthy();
    expect(container.querySelector("[aria-live]")).not.toHaveClass(
      styles.liveItemAnimated,
    );

    advanceBy(6000);
    expect(screen.getByText("5 learning squads")).toBeInTheDocument();
  });
});

describe("every role", () => {
  it("renders the tile caption", () => {
    const roles = [
      <MetroTile
        href="/a"
        key="navigation"
        label="navigation"
        role="navigation"
      >
        <span>a</span>
      </MetroTile>,
      <MetroTile key="display" label="display" role="display">
        <span>b</span>
      </MetroTile>,
      <MetroTile
        back={<span>d</span>}
        front={<span>c</span>}
        key="reveal"
        label="reveal"
        role="reveal"
      />,
      <MetroTile
        accessibleLabel="live evidence"
        items={[<span key="e">e</span>, <span key="f">f</span>]}
        key="live"
        label="live"
        role="live"
      />,
    ];

    for (const tile of roles) {
      const { container, unmount } = render(tile);
      const caption = container.querySelector(`.${styles.label}`);
      expect(caption).not.toBeNull();
      expect(caption?.textContent).toBe(String(tile.key));
      unmount();
    }
  });

  it("separates the caption from the face so a computed name reads as words", () => {
    // Chromium concatenates adjacent inline boxes with nothing between them, so
    // the space node in `Caption` is what stops "evidencelabel". jsdom's own
    // name computation inserts a separator regardless, so textContent is the
    // only thing here that can see it -- and until this assertion existed the
    // space was defended only by a consumer's test in
    // `tests/unit/ProjectsPanel.test.tsx`, one directory away from the
    // component a refactor of `Caption` would be done in.
    const { container } = render(
      <MetroTile label="b" role="display">
        <span>A</span>
      </MetroTile>,
    );

    expect(container.firstElementChild?.textContent).toBe("A b");
  });

  /*
   * The slot's whole value is *where* it renders. `.content` is inset by the
   * tile's padding and gives its bottom edge to the caption, so an image
   * positioned against it is a framed photo; the same image on the tile root
   * fills the rectangle the grid laid down. Asserting the parent chain -- media
   * is a child of the root and a sibling that precedes `.content` -- is what
   * pins that, because a `position: absolute; inset: 0` image looks identical
   * in jsdom either way.
   */
  it("renders its media layer on the tile root, ahead of the content", () => {
    const roles = [
      <MetroTile
        href="/a"
        key="navigation"
        label="navigation"
        media={<img alt="a photograph" src="/portrait.jpg" />}
        role="navigation"
      >
        <span>a</span>
      </MetroTile>,
      <MetroTile
        key="display"
        label="display"
        media={<img alt="a photograph" src="/portrait.jpg" />}
        role="display"
      />,
      <MetroTile
        back={<span>d</span>}
        front={<span>c</span>}
        key="reveal"
        label="reveal"
        media={<img alt="a photograph" src="/portrait.jpg" />}
        role="reveal"
      />,
      <MetroTile
        accessibleLabel="live evidence"
        items={[<span key="e">e</span>, <span key="f">f</span>]}
        key="live"
        label="live"
        media={<img alt="a photograph" src="/portrait.jpg" />}
        role="live"
      />,
    ];

    for (const tile of roles) {
      const { container, unmount } = render(tile);
      const root = container.firstElementChild as HTMLElement;
      const media = container.querySelector(`.${styles.media}`);
      const content = container.querySelector(`.${styles.content}`);

      expect(media, String(tile.key)).not.toBeNull();
      expect(media?.parentElement, String(tile.key)).toBe(root);
      expect(root.firstElementChild, String(tile.key)).toBe(media);
      expect(media?.nextElementSibling, String(tile.key)).toBe(content);
      // The image's alt is the only description of a picture tile there is, so
      // the layer is never hidden wholesale.
      expect(media).not.toHaveAttribute("aria-hidden");
      expect(
        screen.getByRole("img", { name: "a photograph" }),
        String(tile.key),
      ).toBeInTheDocument();
      unmount();
    }
  });

  it("renders no media layer at all when the slot is empty", () => {
    const { container } = render(
      <MetroTile label="display" role="display">
        <span>a</span>
      </MetroTile>,
    );

    expect(styles.media).toBeTruthy();
    expect(container.querySelector(`.${styles.media}`)).toBeNull();
    expect(container.firstElementChild?.firstElementChild).toHaveClass(
      styles.content,
    );
  });

  it("carries its size and accent on the root so the grid can place it", () => {
    const { container } = render(
      <MetroTile
        accent="blue"
        href="/projects/lead-platform"
        label="Lead platform"
        role="navigation"
        size="large"
      >
        <span>₹1Cr+</span>
      </MetroTile>,
    );

    const root = container.firstElementChild;
    expect(root).toHaveClass(styles.tile, styles.large, styles.blue);
    expect(root).toHaveAttribute("data-tile-size", "large");
  });
});

/*
 * The stylesheet is the contract for everything the component does not write in
 * JavaScript -- sizes, accents, and the three text budgets. Renaming or
 * dropping one of these classes would leave `rootClass` and `tileTextClass`
 * quietly composing `undefined` into a className, which no behavioural test
 * would notice.
 */
describe("the tile stylesheet", () => {
  it("keeps every class the component composes by name", () => {
    expect(Object.keys(styles)).toEqual(
      expect.arrayContaining([
        "tile",
        "small",
        "wide",
        "large",
        "hero",
        "cyan",
        "blue",
        "ink",
        "photo",
        "navigation",
        "action",
        "media",
        "content",
        "face",
        "title",
        "body",
        "value",
        "label",
        "liveItem",
      ]),
    );
  });

  /*
   * Inside a `TileGrid` every type step is derived from `--tile-unit`, which
   * the grid publishes. Every tile in this file is rendered WITHOUT one, and so
   * is any consumer outside a grid -- there is no query container for `100cqw`
   * to resolve against, so a derivation there would compute a plausible-looking
   * wrong number instead of failing. The fallback box is what stops that: it is
   * large enough that every clamp lands on its ceiling, which is the absolute
   * step the design declared before the derivation existed.
   *
   * jsdom resolves no `var()` at all -- `getComputedStyle(...).fontSize` on a
   * tile in this file is the literal string `var(--tile-title)` -- so the
   * declaration is the only thing assertable here. Measured in Chromium on a
   * tile appended straight to `<body>`: small 13.6/15.2px title and 28/32px
   * value, wide the same, large 16/20 and 12.8/13.6 and 40/48, hero 18.4/25.6
   * and 12.8/13.6 and 48/56 -- each pair being below and above 48rem, and each
   * number this file's own step.
   */
  it("falls back to the design's absolute steps outside a TileGrid", () => {
    const { container } = render(
      <MetroTile label="bare" role="display" size="large">
        <span>evidence</span>
      </MetroTile>,
    );

    const box = getComputedStyle(
      container.firstElementChild as HTMLElement,
    ).getPropertyValue("--tile-box");

    // The whole declaration, not a substring: `toContain` would still pass if
    // the expression multiplied the fallback term by zero.
    expect(box.replace(/\s+/g, "")).toBe(
      "calc(var(--tile-rows)*var(--tile-unit,40rem)+(var(--tile-rows)-1)*var(--tile-gap,0px))",
    );
  });

  it("exports one class per text budget, including the always-painted one", () => {
    expect(tileTextClass).toEqual({
      body: styles.body,
      title: styles.title,
      value: styles.value,
    });
    for (const budget of Object.values(tileTextClass)) {
      expect(budget).toBeTruthy();
    }
  });
});
