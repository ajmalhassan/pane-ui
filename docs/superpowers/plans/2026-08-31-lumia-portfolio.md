# Lumia Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current portfolio with an accessible, responsive, Me-first Lumia Panorama experience backed by local project and blog content and a reusable repo-local Metro component layer.

**Architecture:** Keep Next.js App Router and server-render all portfolio content. Isolate reusable Metro interaction primitives under `components/metro`, compose them with portfolio-specific components under `components/portfolio`, and keep only active-pivot and interaction state on the client. Local typed project data and Markdown posts replace the runtime DEV API dependency.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, CSS Modules and CSS custom properties, gray-matter, remark, Vitest, Testing Library, Playwright, and axe-core.

**Spec:** `docs/superpowers/specs/2026-08-31-lumia-portfolio-design.md`

## Global Constraints

- The bare `/` route and invalid `view` values render **Me**; valid query values are exactly `me`, `projects`, `blog`, and `photography`.
- Primary pivot order is Me, Projects, Blog, Photography; Résumé and Contact remain app-bar actions.
- Professional claims use approved facts or safe abstractions and never imply that all five squads directly report to Ajmal.
- Lumia cyan is `#00a4ef`; core surfaces are ink-black, with no glassmorphism or skeuomorphic content chrome.
- No continuous tile rotation, looping hero animation, transition-delayed content, horizontal scroll trapping, or hover-only action.
- Motion uses transform and opacity where possible and has a purpose-built `prefers-reduced-motion` alternative.
- All essential controls work with keyboard, touch, pointer, and without JavaScript through conventional links.
- Touch targets are at least 44 by 44 CSS pixels; text, focus, and active states meet WCAG AA contrast.
- The homepage, projects, and blog render without external API requests.
- No video background, canvas effect, CMS, authentication, comments, newsletter, AI chatbot, or standalone OSS package is included.
- Phase 1 proves repo-local Metro APIs; package extraction, naming, licensing, themes, and framework adapters belong to a separate Phase 2 plan.

---

## File Structure

```text
app/
  blog/page.tsx                         # server-rendered blog index
  blog/[slug]/page.tsx                  # server-rendered article
  projects/[slug]/page.tsx              # server-rendered case study
  resume/page.tsx                       # printable recruiter summary
  globals.css                           # reset, global tokens, page shell
  layout.tsx                            # metadata and fonts
  page.tsx                              # server entry; parses ?view=
components/
  metro/
    AppBar.tsx / AppBar.module.css       # contextual persistent actions
    LiveTile.tsx / LiveTile.module.css   # explicit two-face tile
    Panorama.tsx / Panorama.module.css   # controlled spatial content plane
    PivotList.tsx / PivotList.module.css # semantic tabs and keyboard behavior
    Pressable.tsx / Pressable.module.css # pointer/touch feedback
    StatusBar.tsx                        # decorative Lumia atmosphere
    TileGrid.tsx / TileGrid.module.css   # responsive Metro geometry
    index.ts                             # stable repo-local public surface
  portfolio/
    PortfolioPanorama.tsx                # client composition and query state
    BioPanel.tsx                         # Me pivot content
    ProjectsPanel.tsx                    # project tiles
    BlogPanel.tsx                        # recent article tiles
    PhotographyPanel.tsx                 # curated/dummy photo tiles
    ProjectCaseStudy.tsx                 # case-study narrative contract
    ContactPanel.tsx                     # app-bar contact dialog/panel
content/
  profile.ts                             # approved positioning and links
  projects.ts                            # typed dummy and authentic projects
  photography.ts                        # typed photo entries/placeholders
  posts/
    ai-assessment-needs-a-narrower-job.md
    capability-graphs-as-infrastructure.md
lib/content/
  pivots.ts                              # PivotId validation
  projects.ts                            # Project types and lookup
  posts.ts                               # Markdown parsing and validation
tests/
  unit/                                  # Vitest/Testing Library tests
  e2e/portfolio.spec.ts                  # Playwright journeys
  e2e/accessibility.spec.ts              # axe checks
playwright.config.ts
vitest.config.ts
vitest.setup.ts
```

The existing `components/Blog.tsx`, `components/WorkExperience.tsx`, `common/types/Experience.ts`, `lib/posts.js`, and old single-page composition become obsolete only after their replacements pass tests.

---

### Task 1: Testing Foundation and Pivot Contract

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `lib/content/pivots.ts`
- Create: `tests/unit/pivots.test.ts`

**Interfaces:**
- Produces: `type PivotId = "me" | "projects" | "blog" | "photography"`
- Produces: `parsePivot(value: string | string[] | undefined): PivotId`
- Produces: `pivotHref(pivot: PivotId): string`

- [ ] **Step 1: Install the unit-test and Markdown dependencies**

Run:

```bash
npm install remark remark-html
npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Expected: dependencies resolve successfully and `package-lock.json` changes.

- [ ] **Step 2: Add deterministic test scripts**

Add these entries to `package.json` scripts:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

Install the referenced plugin:

```bash
npm install --save-dev @vitejs/plugin-react
```

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

- [ ] **Step 4: Write the failing pivot tests**

Create `tests/unit/pivots.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parsePivot, pivotHref } from "@/lib/content/pivots";

describe("parsePivot", () => {
  it.each([undefined, "", "unknown", ["blog", "projects"]])(
    "falls back to me for %j",
    (value) => expect(parsePivot(value)).toBe("me"),
  );

  it.each(["me", "projects", "blog", "photography"] as const)(
    "accepts %s",
    (value) => expect(parsePivot(value)).toBe(value),
  );
});

it("creates canonical pivot URLs", () => {
  expect(pivotHref("me")).toBe("/?view=me");
  expect(pivotHref("projects")).toBe("/?view=projects");
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test -- tests/unit/pivots.test.ts`

Expected: FAIL because `lib/content/pivots.ts` does not exist.

- [ ] **Step 6: Implement the pivot contract**

Create `lib/content/pivots.ts`:

```ts
export const PIVOT_IDS = ["me", "projects", "blog", "photography"] as const;
export type PivotId = (typeof PIVOT_IDS)[number];

export function parsePivot(value: string | string[] | undefined): PivotId {
  if (typeof value !== "string") return "me";
  return PIVOT_IDS.includes(value as PivotId) ? (value as PivotId) : "me";
}

export function pivotHref(pivot: PivotId): string {
  return `/?view=${pivot}`;
}
```

- [ ] **Step 7: Verify and commit**

Run:

```bash
npm test -- tests/unit/pivots.test.ts
npm run typecheck
git add package.json package-lock.json vitest.config.ts vitest.setup.ts lib/content/pivots.ts tests/unit/pivots.test.ts
git commit -m "test: add portfolio test foundation"
```

Expected: tests and type checking pass; commit succeeds.

---

### Task 2: Metro Tokens and Pressable Interaction

**Files:**
- Modify: `app/globals.css`
- Create: `components/metro/Pressable.tsx`
- Create: `components/metro/Pressable.module.css`
- Create: `components/metro/index.ts`
- Create: `tests/unit/Pressable.test.tsx`

**Interfaces:**
- Produces: `Pressable(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { intensity?: number }): JSX.Element`
- Produces CSS custom properties `--press-rotate-x` and `--press-rotate-y` on pointer-capable devices.

- [ ] **Step 1: Write failing behavior tests**

Create `tests/unit/Pressable.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pressable } from "@/components/metro/Pressable";

describe("Pressable", () => {
  it("preserves native button semantics", () => {
    render(<Pressable>Open project</Pressable>);
    expect(screen.getByRole("button", { name: "Open project" })).toBeEnabled();
  });

  it("clears tilt variables when the pointer leaves", () => {
    render(<Pressable>Open project</Pressable>);
    const button = screen.getByRole("button");
    fireEvent.pointerMove(button, { clientX: 20, clientY: 20 });
    fireEvent.pointerLeave(button);
    expect(button.style.getPropertyValue("--press-rotate-x")).toBe("");
    expect(button.style.getPropertyValue("--press-rotate-y")).toBe("");
  });
});
```

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- tests/unit/Pressable.test.tsx`

Expected: FAIL because `Pressable` does not exist.

- [ ] **Step 3: Add global visual and motion tokens**

Replace the starter gradient variables in `app/globals.css` with:

```css
:root {
  --metro-cyan: #00a4ef;
  --metro-ink: #07090a;
  --metro-surface: #111416;
  --metro-text: #f2f4f5;
  --metro-muted: #91989e;
  --metro-line: #2a2e31;
  --motion-fast: 140ms;
  --motion-standard: 420ms;
  --motion-emphasized: 560ms;
  --ease-metro: cubic-bezier(0.16, 1, 0.3, 1);
}

* { box-sizing: border-box; }
html { background: var(--metro-ink); color: var(--metro-text); }
body { margin: 0; min-height: 100%; background: var(--metro-ink); }
a { color: inherit; }
button, a { -webkit-tap-highlight-color: transparent; }

@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-fast: 1ms;
    --motion-standard: 1ms;
    --motion-emphasized: 1ms;
  }
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

Keep the Tailwind directives at the top until Tailwind removal is explicitly planned.

- [ ] **Step 4: Implement Pressable**

Create `components/metro/Pressable.tsx`:

```tsx
"use client";

import type { CSSProperties, PointerEvent } from "react";
import styles from "./Pressable.module.css";

type TiltStyle = CSSProperties & {
  "--press-rotate-x"?: string;
  "--press-rotate-y"?: string;
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  intensity?: number;
};

export function Pressable({ intensity = 4, className = "", onPointerMove, onPointerLeave, ...props }: Props) {
  function move(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "touch" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    const style = event.currentTarget.style as TiltStyle;
    style.setProperty("--press-rotate-x", `${-y * intensity}deg`);
    style.setProperty("--press-rotate-y", `${x * intensity}deg`);
    onPointerMove?.(event);
  }

  function leave(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.style.removeProperty("--press-rotate-x");
    event.currentTarget.style.removeProperty("--press-rotate-y");
    onPointerLeave?.(event);
  }

  return <button {...props} className={`${styles.pressable} ${className}`} onPointerMove={move} onPointerLeave={leave} />;
}
```

Create `components/metro/Pressable.module.css`:

```css
.pressable {
  min-width: 44px;
  min-height: 44px;
  transform: perspective(700px) rotateX(var(--press-rotate-x, 0deg)) rotateY(var(--press-rotate-y, 0deg));
  transform-origin: center;
  transition: transform var(--motion-fast) ease;
}
.pressable:active { transform: perspective(700px) scale(0.985); }
.pressable:focus-visible { outline: 3px solid var(--metro-text); outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) {
  .pressable, .pressable:active { transform: none; }
}
```

Create `components/metro/index.ts`:

```ts
export { Pressable } from "./Pressable";
```

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm test -- tests/unit/Pressable.test.tsx
npm run typecheck
git add app/globals.css components/metro tests/unit/Pressable.test.tsx
git commit -m "feat: add Metro interaction foundation"
```

Expected: tests and type checking pass.

---

### Task 3: Responsive Tiles and Explicit Live State

**Files:**
- Create: `components/metro/TileGrid.tsx`
- Create: `components/metro/TileGrid.module.css`
- Create: `components/metro/LiveTile.tsx`
- Create: `components/metro/LiveTile.module.css`
- Modify: `components/metro/index.ts`
- Create: `tests/unit/LiveTile.test.tsx`

**Interfaces:**
- Produces: `TileGrid({ children }: PropsWithChildren): JSX.Element`
- Produces: `TileSize = "small" | "medium" | "wide" | "large"`
- Produces: `LiveTile({ label, front, back, size, accent, href }): JSX.Element`
- LiveTile changes face only after activation; it never auto-rotates.

- [ ] **Step 1: Write failing live-tile tests**

Create `tests/unit/LiveTile.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { LiveTile } from "@/components/metro/LiveTile";

it("reveals useful secondary content only after activation", async () => {
  const user = userEvent.setup();
  render(<LiveTile label="Capability graph" href="/projects/capability-graph" front={<span>Current system</span>} back={<span>Curriculum to placement</span>} />);
  const tile = screen.getByRole("button", { name: "Show more: Capability graph" });
  expect(tile).toHaveAttribute("aria-pressed", "false");
  await user.click(tile);
  expect(tile).toHaveAttribute("aria-pressed", "true");
});

it("keeps proof and navigation on the front face", () => {
  render(<LiveTile label="Lead platform" href="/projects/lead-platform" front={<span>₹1Cr+ influenced</span>} back={<span>Submission latency reduced</span>} />);
  expect(screen.getByText("₹1Cr+ influenced")).toBeVisible();
  expect(screen.getByRole("link", { name: "View Lead platform" })).toHaveAttribute("href", "/projects/lead-platform");
});
```

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- tests/unit/LiveTile.test.tsx`

Expected: FAIL because `LiveTile` does not exist.

- [ ] **Step 3: Implement responsive tile geometry**

Create `components/metro/TileGrid.tsx`:

```tsx
import type { PropsWithChildren } from "react";
import styles from "./TileGrid.module.css";

export type TileSize = "small" | "medium" | "wide" | "large";
export function TileGrid({ children }: PropsWithChildren) {
  return <div className={styles.grid}>{children}</div>;
}
export function tileSizeClass(size: TileSize = "medium") { return styles[size]; }
```

Create `components/metro/TileGrid.module.css`:

```css
.grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); grid-auto-rows: 7rem; gap: 0.375rem; }
.small { grid-column: span 3; }
.medium { grid-column: span 3; grid-row: span 2; }
.wide { grid-column: span 6; }
.large { grid-column: span 6; grid-row: span 2; }
@media (max-width: 720px) {
  .grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .small, .medium { grid-column: span 3; }
  .wide, .large { grid-column: span 6; }
}
```

- [ ] **Step 4: Implement LiveTile**

Create `components/metro/LiveTile.tsx`:

```tsx
"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Pressable } from "./Pressable";
import { tileSizeClass, type TileSize } from "./TileGrid";
import styles from "./LiveTile.module.css";

type Props = {
  label: string;
  front: ReactNode;
  back: ReactNode;
  size?: TileSize;
  accent?: "cyan" | "blue" | "ink";
  href: string;
};

export function LiveTile({ label, front, back, size = "medium", accent = "ink", href }: Props) {
  const [flipped, setFlipped] = useState(false);
  return (
    <article className={`${styles.tile} ${styles[accent]} ${tileSizeClass(size)}`}>
      <Pressable
        type="button"
        aria-label={`Show more: ${label}`}
        aria-pressed={flipped}
        className={styles.surface}
        onClick={() => setFlipped((value) => !value)}
      >
        <span className={`${styles.face} ${flipped ? styles.hiddenFront : ""}`}>{front}</span>
        <span aria-hidden={!flipped} className={`${styles.face} ${styles.back} ${flipped ? styles.visibleBack : ""}`}>{back}</span>
      </Pressable>
      <Link className={styles.link} href={href}>View {label}</Link>
    </article>
  );
}
```

Create `components/metro/LiveTile.module.css`:

```css
.tile { position: relative; overflow: hidden; min-height: 7rem; color: var(--metro-text); }
.surface { position: absolute; inset: 0; width: 100%; border: 0; border-radius: 0; color: inherit; background: transparent; text-align: left; }
.cyan { background: var(--metro-cyan); color: #071014; }
.blue { background: #1555a0; }
.ink { background: var(--metro-surface); }
.face { position: absolute; inset: 0; padding: 1rem 1rem 3.25rem; backface-visibility: hidden; transition: transform var(--motion-emphasized) var(--ease-metro); }
.back { transform: rotateX(-90deg); transform-origin: center; }
.hiddenFront { transform: rotateX(90deg); }
.visibleBack { transform: rotateX(0deg); }
.link { position: absolute; z-index: 2; left: 1rem; bottom: 0.85rem; min-height: 44px; display: inline-flex; align-items: center; font-size: 0.75rem; font-weight: 600; }
.link:focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .face { transition: none; }
  .hiddenFront { visibility: hidden; transform: none; }
  .back { visibility: hidden; transform: none; }
  .visibleBack { visibility: visible; }
}
```

- [ ] **Step 5: Export, verify, and commit**

Append to `components/metro/index.ts`:

```ts
export { LiveTile } from "./LiveTile";
export { TileGrid } from "./TileGrid";
export type { TileSize } from "./TileGrid";
```

Run:

```bash
npm test -- tests/unit/LiveTile.test.tsx
npm run typecheck
git add components/metro tests/unit/LiveTile.test.tsx
git commit -m "feat: add responsive live tiles"
```

Expected: tests and type checking pass.

---

### Task 4: Semantic Pivots and Panorama Navigation

**Files:**
- Create: `components/metro/PivotList.tsx`
- Create: `components/metro/PivotList.module.css`
- Create: `components/metro/Panorama.tsx`
- Create: `components/metro/Panorama.module.css`
- Modify: `components/metro/index.ts`
- Create: `tests/unit/PivotList.test.tsx`
- Create: `tests/unit/Panorama.test.tsx`

**Interfaces:**
- Consumes: `PivotId`, `pivotHref`
- Produces: `PivotOption = { id: PivotId; label: string }`
- Produces: `PivotList({ active, options, onSelect }): JSX.Element`
- Produces: `Panorama({ active, heading, children }): JSX.Element`

- [ ] **Step 1: Write failing keyboard and panel tests**

Create `tests/unit/PivotList.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { PivotList } from "@/components/metro/PivotList";

const options = [
  { id: "me" as const, label: "Me" },
  { id: "projects" as const, label: "Projects" },
  { id: "blog" as const, label: "Blog" },
  { id: "photography" as const, label: "Photography" },
];

it("uses tabs and advances with ArrowRight", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<PivotList active="me" options={options} onSelect={onSelect} />);
  const me = screen.getByRole("tab", { name: "Me" });
  me.focus();
  await user.keyboard("{ArrowRight}");
  expect(onSelect).toHaveBeenCalledWith("projects");
});
```

Create `tests/unit/Panorama.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Panorama } from "@/components/metro/Panorama";

it("identifies the active panel without hiding content from the document", () => {
  render(
    <Panorama active="projects" heading="technical leader / builder">
      <section data-pivot="me">Bio</section>
      <section data-pivot="projects">Projects</section>
      <section data-pivot="blog">Blog</section>
      <section data-pivot="photography">Photography</section>
    </Panorama>,
  );
  expect(screen.getByText("Projects").closest("section")).toHaveAttribute("data-active", "true");
  expect(screen.getByText("Bio")).toBeInTheDocument();
});
```

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- tests/unit/PivotList.test.tsx tests/unit/Panorama.test.tsx`

Expected: FAIL because both components are missing.

- [ ] **Step 3: Implement PivotList with conventional links**

Implement each tab as a Next `Link` with `role="tab"`, `aria-selected`, `tabIndex`, and an `onClick` that calls `onSelect`. On ArrowLeft/ArrowRight, wrap through `options`, call `onSelect(next.id)`, and focus the next link. Use `pivotHref(id)` for the real `href`, preserving navigation without JavaScript.

The visual CSS must use lowercase labels, a two-pixel cyan active underline, at least 44 pixels of hit area, and allow the next label to remain partially visible on narrow screens.

- [ ] **Step 4: Implement Panorama**

`Panorama` must:

- require exactly one child section for each `PivotId` through runtime development assertions;
- set `data-active="true"` and `aria-hidden={false}` on the selected panel;
- set the shared plane transform from the active index;
- move the oversized heading at a smaller parallax offset;
- keep all content in DOM order while applying `visibility: hidden` and `pointer-events: none` to inactive panels so their links cannot receive focus;
- set all transforms to `none` in reduced-motion mode.

Use `React.Children.map` and `cloneElement` to add state, and expose a `role="tabpanel"` with matching `aria-labelledby` from PivotList IDs.

- [ ] **Step 5: Export, verify, and commit**

Append exports for `PivotList`, `Panorama`, and `PivotOption` to `components/metro/index.ts`.

Run:

```bash
npm test -- tests/unit/PivotList.test.tsx tests/unit/Panorama.test.tsx
npm run typecheck
git add components/metro tests/unit/PivotList.test.tsx tests/unit/Panorama.test.tsx
git commit -m "feat: add spatial panorama navigation"
```

Expected: keyboard tests, panel tests, and type checking pass.

---

### Task 5: Lumia Status and Contextual App Bar

**Files:**
- Create: `components/metro/StatusBar.tsx`
- Create: `components/metro/AppBar.tsx`
- Create: `components/metro/AppBar.module.css`
- Modify: `components/metro/index.ts`
- Create: `tests/unit/AppBar.test.tsx`

**Interfaces:**
- Produces: `AppAction = { label: string; href?: string; icon: ReactNode; onSelect?: () => void }`
- Produces: `AppBar({ actions }): JSX.Element`
- Produces: decorative `StatusBar({ label }: { label: string }): JSX.Element`

- [ ] **Step 1: Write the failing app-bar test**

Create `tests/unit/AppBar.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { AppBar } from "@/components/metro/AppBar";

it("keeps action labels accessible and reveals them visually on demand", async () => {
  const user = userEvent.setup();
  render(<AppBar actions={[{ label: "Résumé", href: "/resume", icon: "↗" }]} />);
  expect(screen.getByRole("link", { name: "Résumé" })).toHaveAttribute("href", "/resume");
  await user.click(screen.getByRole("button", { name: "Show app bar labels" }));
  expect(screen.getByTestId("app-bar")).toHaveAttribute("data-expanded", "true");
});
```

- [ ] **Step 2: Verify the test fails**

Run: `npm test -- tests/unit/AppBar.test.tsx`

Expected: FAIL because `AppBar` is missing.

- [ ] **Step 3: Implement StatusBar and AppBar**

`StatusBar` renders `aria-hidden="true"`, the supplied portfolio label, a static time-like decorative string, and no essential information.

`AppBar` renders links for actions with `href`, buttons for actions with `onSelect`, and one ellipsis button that toggles `data-expanded`. Every action always has an accessible label. CSS provides circular 44-pixel actions, a stable bottom area, and text labels whose collapsed state uses visual opacity rather than `display: none`.

- [ ] **Step 4: Export, verify, and commit**

Run:

```bash
npm test -- tests/unit/AppBar.test.tsx
npm run typecheck
git add components/metro tests/unit/AppBar.test.tsx
git commit -m "feat: add Lumia app bar primitives"
```

Expected: tests and type checking pass.

---

### Task 6: Typed Portfolio Content and Me-First Homepage

**Files:**
- Create: `content/profile.ts`
- Create: `content/projects.ts`
- Create: `content/photography.ts`
- Create: `lib/content/projects.ts`
- Create: `components/portfolio/BioPanel.tsx`
- Create: `components/portfolio/ProjectsPanel.tsx`
- Create: `components/portfolio/BlogPanel.tsx`
- Create: `components/portfolio/PhotographyPanel.tsx`
- Create: `components/portfolio/ContactPanel.tsx`
- Create: `components/portfolio/PortfolioPanorama.tsx`
- Create: `components/portfolio/PortfolioPanorama.module.css`
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Create: `tests/unit/projects.test.ts`
- Create: `tests/unit/PortfolioPanorama.test.tsx`

**Interfaces:**
- Consumes: all Metro primitives and `PivotId`
- Produces: `Project`, `ProjectStatus`, `ProjectSection`, `getProject(slug)`
- Produces: `PortfolioPanorama({ initialPivot, projects, posts }): JSX.Element`

- [ ] **Step 1: Write failing content validation tests**

Create `tests/unit/projects.test.ts`:

```ts
import { expect, it } from "vitest";
import { getProject, validateProjects } from "@/lib/content/projects";

it("rejects duplicate slugs", () => {
  const duplicate = { slug: "same", title: "One", summary: "Summary", status: "concept" as const, sections: [] };
  expect(() => validateProjects([duplicate, { ...duplicate, title: "Two" }])).toThrow("Duplicate project slug: same");
});

it("returns a known project and undefined for an unknown slug", () => {
  expect(getProject("metro-revival")?.title).toMatch(/Metro|Lumia/);
  expect(getProject("missing")).toBeUndefined();
});
```

- [ ] **Step 2: Define actual typed content**

Create `lib/content/projects.ts` with:

```ts
export type ProjectStatus = "concept" | "in-progress" | "shipped";
export type ProjectSection = { heading: string; body: string };
export type Project = {
  slug: string;
  title: string;
  summary: string;
  status: ProjectStatus;
  metric?: string;
  accent: "cyan" | "blue" | "ink";
  sections: ProjectSection[];
};
```

Implement `validateProjects(projects)` to reject empty slugs/titles/summaries and duplicate slugs. Import `projects` from `content/projects.ts`, validate at module load, and expose `getProject`.

Create `content/projects.ts` with four entries:

1. `metro-revival` — authentic in-progress design-system concept;
2. `capability-graph` — clearly labeled anonymized dummy case study;
3. `live-ai-assessment` — clearly labeled anonymized dummy case study;
4. `lead-platform` — clearly labeled anonymized dummy case study using only the approved `₹1Cr+` outcome.

Each entry includes all eight case-study headings from the spec, with concise dummy copy explicitly marked “Draft example” where details need later approval.

- [ ] **Step 3: Write the failing homepage test**

Create `tests/unit/PortfolioPanorama.test.tsx`. Mock `next/navigation` so `useRouter().push` is a spy. Assert:

```tsx
render(<PortfolioPanorama initialPivot="me" projects={projects} posts={[]} />);
expect(screen.getByRole("tab", { name: "Me" })).toHaveAttribute("aria-selected", "true");
expect(screen.getByRole("heading", { name: /technical leader/i })).toBeVisible();
expect(screen.getByRole("tab", { name: "Projects" })).toHaveAttribute("href", "/?view=projects");
expect(screen.getByRole("link", { name: "Résumé" })).toHaveAttribute("href", "/resume");
```

- [ ] **Step 4: Implement portfolio panels**

Create focused server-compatible panels:

- `BioPanel` renders the approved opening position, leadership scope, and personal Lumia note.
- `ProjectsPanel` maps Project data into `LiveTile` components and always displays project title and summary on the front face.
- `BlogPanel` accepts `{ slug, title, summary, date }[]` and renders conventional article links; empty state reads “First field notes are being prepared.”
- `PhotographyPanel` renders one real portrait entry and typographic placeholders from `content/photography.ts`, labeled as a developing collection.
- `ContactPanel` provides the existing LinkedIn and GitHub URLs from the current portfolio without inventing an email address.

- [ ] **Step 5: Implement client composition and query updates**

`PortfolioPanorama` stores `active` initialized from `initialPivot`. On pivot selection it calls `setActive(id)` and `router.push(pivotHref(id), { scroll: false })`. It renders StatusBar, oversized shared heading, PivotList, Panorama panels, and an AppBar with Résumé and Contact actions. Contact uses a real `href="#contact"` plus a client `onSelect` enhancement; `ContactPanel` is always present at that ID so the same destinations remain reachable without JavaScript. The enhanced panel has a close button and returns focus to the Contact action.

- [ ] **Step 6: Replace the server homepage**

Implement `app/page.tsx`:

```tsx
import { PortfolioPanorama } from "@/components/portfolio/PortfolioPanorama";
import { parsePivot } from "@/lib/content/pivots";
import { projects } from "@/content/projects";
import { getPostSummaries } from "@/lib/content/posts";

export default async function Home({ searchParams }: { searchParams: { view?: string | string[] } }) {
  return <PortfolioPanorama initialPivot={parsePivot(searchParams.view)} projects={projects} posts={await getPostSummaries()} />;
}
```

If `lib/content/posts.ts` is not present until Task 8, create it now with `export async function getPostSummaries() { return []; }` and replace the stub in Task 8.

Update `app/layout.tsx` metadata title to `Ajmal Hassan — Technical Leader & Builder` and description to the approved positioning. Use a font stack that prefers Segoe without distributing it.

- [ ] **Step 7: Verify responsive build and commit**

Run:

```bash
npm test -- tests/unit/projects.test.ts tests/unit/PortfolioPanorama.test.tsx
npm run typecheck
npm run build
git add app components/portfolio content lib/content/projects.ts lib/content/posts.ts tests/unit/projects.test.ts tests/unit/PortfolioPanorama.test.tsx
git commit -m "feat: build Me-first Lumia portfolio shell"
```

Expected: unit tests, type checking, and production build pass; no DEV API call remains in the homepage.

---

### Task 7: Project Index Links and Case-Study Routes

**Files:**
- Create: `components/portfolio/ProjectCaseStudy.tsx`
- Create: `components/portfolio/ProjectCaseStudy.module.css`
- Create: `app/projects/[slug]/page.tsx`
- Modify: `components/portfolio/ProjectsPanel.tsx`
- Create: `tests/unit/ProjectCaseStudy.test.tsx`

**Interfaces:**
- Consumes: `Project`, `getProject`, `projects`
- Produces: `ProjectCaseStudy({ project }: { project: Project }): JSX.Element`

- [ ] **Step 1: Write the failing narrative-contract test**

Create `tests/unit/ProjectCaseStudy.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ProjectCaseStudy } from "@/components/portfolio/ProjectCaseStudy";
import { getProject } from "@/lib/content/projects";

it("renders role, constraints, decisions, outcomes, and lessons", () => {
  render(<ProjectCaseStudy project={getProject("metro-revival")!} />);
  for (const heading of ["Problem and users", "Role and team", "Constraints and risks", "Decisions and trade-offs", "Outcome and evidence", "Lessons and next questions"]) {
    expect(screen.getByRole("heading", { name: heading })).toBeVisible();
  }
});
```

- [ ] **Step 2: Verify the test fails**

Run: `npm test -- tests/unit/ProjectCaseStudy.test.tsx`

Expected: FAIL because the component is missing.

- [ ] **Step 3: Implement case-study rendering and route generation**

`ProjectCaseStudy` renders a conventional, narrow reading layout with a Lumia header, status, summary, optional metric, all ordered sections, and a link back to `/?view=projects`. Do not place long-form article text inside a horizontal scrolling region.

`app/projects/[slug]/page.tsx` must export `generateStaticParams`, `generateMetadata`, and render `notFound()` for an unknown slug.

- [ ] **Step 4: Make project fronts real links**

Update ProjectsPanel so each `LiveTile` receives the computed `/projects/${project.slug}` path through its `href` prop. The component's separate visible link remains above the tile's flip button, avoiding nested interactive controls. LiveTile flipping remains optional discovery; navigation never depends on reaching the back face.

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm test -- tests/unit/ProjectCaseStudy.test.tsx
npm run typecheck
npm run build
git add app/projects components/portfolio
git commit -m "feat: add portfolio case studies"
```

Expected: all project routes are statically generated and unknown routes return 404.

---

### Task 8: Local Blog Pipeline and Article Routes

**Files:**
- Modify: `lib/content/posts.ts`
- Create: `content/posts/ai-assessment-needs-a-narrower-job.md`
- Create: `content/posts/capability-graphs-as-infrastructure.md`
- Create: `app/blog/page.tsx`
- Create: `app/blog/[slug]/page.tsx`
- Create: `tests/unit/posts.test.ts`
- Delete: `lib/posts.js`
- Delete: `components/Blog.tsx`

**Interfaces:**
- Produces: `PostSummary = { slug: string; title: string; summary: string; date: string; readingMinutes: number }`
- Produces: `Post = PostSummary & { html: string }`
- Produces: `getPostSummaries(): Promise<PostSummary[]>`
- Produces: `getPost(slug: string): Promise<Post | undefined>`
- Produces: `validatePostMeta(filename: string, data: unknown): { title: string; summary: string; date: string }`

- [ ] **Step 1: Write failing parsing and validation tests**

Create `tests/unit/posts.test.ts`:

```ts
import { expect, it } from "vitest";
import { getPost, getPostSummaries, validatePostMeta } from "@/lib/content/posts";

it("returns posts newest first with required metadata", async () => {
  const posts = await getPostSummaries();
  expect(posts.length).toBeGreaterThanOrEqual(2);
  expect(posts[0]).toEqual(expect.objectContaining({ slug: expect.any(String), title: expect.any(String), summary: expect.any(String), date: expect.any(String) }));
  expect(new Date(posts[0].date).getTime()).toBeGreaterThanOrEqual(new Date(posts[1].date).getTime());
});

it("renders Markdown to HTML and returns undefined for unknown posts", async () => {
  expect((await getPost("ai-assessment-needs-a-narrower-job"))?.html).toContain("<p>");
  expect(await getPost("missing")).toBeUndefined();
});

it("fails with the source filename when metadata is invalid", () => {
  expect(() => validatePostMeta("broken.md", { title: "Missing fields" })).toThrow("Invalid post metadata: broken.md");
});
```

- [ ] **Step 2: Add two honest sample field notes**

Each Markdown file must include exact frontmatter keys:

```yaml
---
title: "Why AI assessment needs a narrower job"
summary: "A field note on grounding, gap interviews, and learning from an over-broad assessment experiment."
date: "2026-08-31"
status: "draft-example"
---
```

Body copy must be explicitly framed as a draft outline, use only findings Ajmal provided, and avoid confidential architecture or learner data. The capability-graph note uses the same schema with its own title and summary.

- [ ] **Step 3: Implement local Markdown loading**

Use `fs/promises`, `path.join(process.cwd(), "content/posts")`, `gray-matter`, `remark`, and `remark-html`. Validate title, summary, and ISO date; throw `Invalid post metadata: <filename>` for invalid files. Calculate reading time as `Math.max(1, Math.ceil(wordCount / 220))`. Sort summaries by descending date.

- [ ] **Step 4: Add conventional blog routes**

`app/blog/page.tsx` renders an accessible article list with date, reading time, summary, and links. `app/blog/[slug]/page.tsx` exports static params and metadata, renders Markdown using remark-html's default `allowDangerousHtml: false` behavior, uses the generated HTML only from repository-owned files, and calls `notFound()` for missing slugs.

- [ ] **Step 5: Verify no runtime DEV dependency remains**

Run:

```bash
npm test -- tests/unit/posts.test.ts
rg "dev.to/api|fetch\(" app components lib
npm run typecheck
npm run build
```

Expected: tests pass; `rg` returns no DEV API or content-fetch call; build passes.

- [ ] **Step 6: Remove obsolete blog files and commit**

```bash
git add app/blog content/posts lib/content/posts.ts tests/unit/posts.test.ts
git rm lib/posts.js components/Blog.tsx
git commit -m "feat: add local field notes"
```

Expected: commit succeeds and the blog renders without network access.

---

### Task 9: Résumé, Contact, Photography, and Progressive Fallback

**Files:**
- Create: `app/resume/page.tsx`
- Create: `app/resume/resume.module.css`
- Modify: `content/profile.ts`
- Modify: `content/photography.ts`
- Modify: `components/portfolio/ContactPanel.tsx`
- Modify: `components/portfolio/PhotographyPanel.tsx`
- Delete: `components/WorkExperience.tsx`
- Delete: `common/types/Experience.ts`
- Create: `tests/unit/ProfileActions.test.tsx`

**Interfaces:**
- Produces: `Profile = { name; headline; bio; leadership; links; selectedExperience }`
- Consumes existing public LinkedIn, GitHub, DEV, CodePen, and Instagram URLs from the current homepage.

- [ ] **Step 1: Write failing profile-action tests**

Create `tests/unit/ProfileActions.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ContactPanel } from "@/components/portfolio/ContactPanel";

it("offers real public contact destinations without inventing an email", () => {
  render(<ContactPanel onClose={() => undefined} />);
  expect(screen.getByRole("link", { name: /linkedin/i })).toHaveAttribute("href", "https://www.linkedin.com/in/ajmalhassankn/");
  expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute("href", "https://github.com/ajmalhassan");
  expect(screen.queryByRole("link", { name: /email/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Centralize approved profile content**

`content/profile.ts` must contain only claims approved in the design conversation: technical-leadership intent, five direct frontend reports, cross-functional ownership across five learning squads, frontend-to-full-stack growth, and public links already present in the repository. Do not name the current employer or claim reporting relationships beyond those facts.

- [ ] **Step 3: Create a printable résumé route**

`/resume` renders:

- name and headline;
- concise bio;
- leadership and system-building highlights;
- anonymized selected-work summaries;
- public profile links;
- a visible note that detailed employment chronology is available through LinkedIn until the portfolio content review is complete.

Add `@media print` rules that remove navigation/app-bar chrome, use black text on white, reveal link destinations, and fit standard page width.

- [ ] **Step 4: Finish Photography and Contact fallback behavior**

Photography uses `/portrait.jpg` for the existing real image and typographic dummy tiles for unprovided photographs. Every dummy tile visibly says “Photography selection in progress” and is not rendered as a fake photograph.

ContactPanel links remain conventional anchors. External links use `rel="noreferrer"`. Closing the panel restores focus to the Contact app-bar button.

- [ ] **Step 5: Remove obsolete experience components, verify, and commit**

Run:

```bash
npm test -- tests/unit/ProfileActions.test.tsx
npm run typecheck
npm run build
git add app/resume content/profile.ts content/photography.ts components/portfolio tests/unit/ProfileActions.test.tsx
git rm components/WorkExperience.tsx common/types/Experience.ts
git commit -m "feat: complete portfolio destinations"
```

Expected: profile test, type checking, and build pass.

---

### Task 10: End-to-End Accessibility and Navigation Gates

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `playwright.config.ts`
- Create: `tests/e2e/portfolio.spec.ts`
- Create: `tests/e2e/accessibility.spec.ts`

**Interfaces:**
- Consumes final public routes and query-state behavior.
- Produces repeatable `npm run test:e2e` and `npm run test:a11y` gates.

- [ ] **Step 1: Install browser-test dependencies and browser**

Run:

```bash
npm install --save-dev @playwright/test @axe-core/playwright lighthouse
npx playwright install chromium
```

Add scripts:

```json
{
  "test:e2e": "playwright test tests/e2e/portfolio.spec.ts",
  "test:a11y": "playwright test tests/e2e/accessibility.spec.ts"
}
```

- [ ] **Step 2: Configure Playwright**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  webServer: { command: "npm run dev", url: "http://127.0.0.1:3000", reuseExistingServer: !process.env.CI },
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
});
```

- [ ] **Step 3: Write navigation journeys**

Create `tests/e2e/portfolio.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("bare and invalid URLs show Me", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("tab", { name: "Me" })).toHaveAttribute("aria-selected", "true");
  await page.goto("/?view=invalid");
  await expect(page.getByRole("tab", { name: "Me" })).toHaveAttribute("aria-selected", "true");
});

test("pivot history and deep links remain navigable", async ({ page }) => {
  await page.goto("/?view=projects");
  await expect(page.getByRole("tab", { name: "Projects" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Blog" }).click();
  await expect(page).toHaveURL(/view=blog/);
  await page.goBack();
  await expect(page.getByRole("tab", { name: "Projects" })).toHaveAttribute("aria-selected", "true");
});

test("keyboard reaches pivots, project links, and app-bar actions", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Me" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Projects" })).toBeFocused();
  await expect(page.getByRole("link", { name: "Résumé" })).toBeVisible();
});

test("core positioning and destinations survive without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /technical leader/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Projects" })).toHaveAttribute("href", "/?view=projects");
  await expect(page.getByRole("link", { name: "Résumé" })).toHaveAttribute("href", "/resume");
  await expect(page.getByRole("link", { name: /contact/i })).toHaveAttribute("href", "#contact");
  await context.close();
});
```

- [ ] **Step 4: Write automated accessibility checks**

Create `tests/e2e/accessibility.spec.ts`:

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const path of ["/", "/?view=projects", "/blog", "/resume"]) {
  test(`${path} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
  });
}
```

- [ ] **Step 5: Add reduced-motion and mobile screenshots**

Extend `portfolio.spec.ts` with one test using `page.emulateMedia({ reducedMotion: "reduce" })` that asserts the panorama plane has `transform: none`, and take named screenshots at Pixel 5 and desktop sizes for manual design review. Store snapshots under Playwright's default test snapshot directory and commit them only after visual approval.

- [ ] **Step 6: Run all gates and commit**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
npm run test:a11y
git add package.json package-lock.json playwright.config.ts tests/e2e
git commit -m "test: verify portfolio journeys and accessibility"
```

Expected: every unit, build, navigation, and accessibility gate passes on desktop and mobile projects.

---

### Task 11: Final Visual, Performance, and Content-Safety Review

**Files:**
- Modify only files identified by the checks below.
- Create: `docs/portfolio-content-checklist.md`

**Interfaces:**
- Consumes the complete Phase 1 portfolio.
- Produces a verified launch candidate and an explicit content-replacement checklist.

- [ ] **Step 1: Run the application and inspect four target frames**

Run: `npm run dev`

Inspect and capture:

- 320 × 568 compact phone;
- 393 × 851 modern phone;
- 1440 × 900 laptop/desktop;
- 1920 × 1080 wide desktop.

Verify that panorama typography hints at off-canvas continuation without clipping essential words, app-bar actions never cover content, tile fronts expose every essential link, and vertical scrolling remains native.

- [ ] **Step 2: Run a production Lighthouse check**

Run:

```bash
npm run build
npm run start
npx lighthouse http://localhost:3000 --only-categories=performance,accessibility,best-practices --chrome-flags="--headless" --output=json --output-path=/tmp/ajmal-portfolio-lighthouse.json
```

Expected: accessibility and best-practices scores are at least 0.95; performance is at least 0.90. If any score misses, use the JSON audit IDs to make the smallest targeted correction, then rerun the same command.

- [ ] **Step 3: Audit claims and dummy content**

Run:

```bash
rg -n "Draft example|dummy|placeholder|Quillbot|Plum|Entri|Instio|reports to me|₹" app components content
```

Expected: every draft marker appears only in content intentionally labeled as a draft; the only revenue figure is the approved `₹1Cr+`; no current employer or direct-report relationship is newly inferred.

- [ ] **Step 4: Write the content replacement checklist**

Create `docs/portfolio-content-checklist.md` with checkboxes for:

- VP Engineering disclosure approval;
- final current-role and employment chronology;
- approved project names and screenshots;
- verified project metrics and dates;
- final résumé file or content;
- preferred public email address;
- final photography selection and alt text;
- final case-study copy;
- final blog editorial pass;
- social-link verification.

- [ ] **Step 5: Run final clean verification**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
npm run test:a11y
git status --short
```

Expected: all commands pass and only the intentional final-review changes are unstaged.

- [ ] **Step 6: Commit the launch candidate**

```bash
git add app components content lib public tests docs/portfolio-content-checklist.md package.json package-lock.json
git commit -m "feat: complete Lumia portfolio redesign"
```

Expected: commit succeeds. Stop here for content approval and branch-finishing review; do not begin Phase 2 OSS extraction in this branch.
