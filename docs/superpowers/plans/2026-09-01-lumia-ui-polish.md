# Lumia Portfolio Phase 2 UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the visible portfolio as an authentic, recruiter-readable Windows Phone 8-inspired Lumia application.

**Architecture:** Evolve the repo-local `components/metro` layer into explicit icon, panorama, tile, grid, and live-state primitives. Portfolio components compose those primitives with Ajmal's typed content. The panorama heading becomes linked navigation, Me becomes a personal Start screen, and every surface uses shared tokens instead of one-off visual approximations.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules, Vitest, Testing Library, Playwright, axe, Lighthouse

**Spec:** `docs/superpowers/specs/2026-09-01-lumia-ui-polish-design.md`

## Global Constraints

- Complete `docs/superpowers/plans/2026-09-01-portfolio-launch-stabilization.md` first.
- Preserve hiring-manager-first evidence and all approved confidentiality boundaries.
- Use production SVG icons; Unicode command glyphs are forbidden.
- Preserve real links, shareable query states, no-JavaScript navigation, modified clicks, keyboard navigation, and reduced motion.
- Use the approved panorama heading model with no duplicated tab, eyebrow, or page heading.
- Preserve sharp geometry, coherent tile ratios, native vertical scrolling, and a minimum 44px interactive target.
- Do not implement the Phase 3 transition engine.

---

### Task 1: Establish Phase 2 tokens and SVG iconography

**Files:**
- Create: `components/metro/MetroIcon.tsx`
- Create: `components/metro/MetroIcon.module.css`
- Modify: `components/metro/index.ts`
- Modify: `app/globals.css`
- Modify: `tests/unit/AppBar.test.tsx`
- Create: `tests/unit/MetroIcon.test.tsx`

**Interfaces:**
- Produces: `MetroIconName = "arrow-northeast" | "mail" | "ellipsis" | "camera" | "notes" | "back"`.
- Produces: `MetroIcon({ name, title? }: { name: MetroIconName; title?: string })`.
- Produces: named CSS variables for 4px grid, 6/8px gutters, content insets, app-bar ring, icon stroke, typography, accents, backgrounds, and Phase 2 motion.

- [ ] **Step 1: Write failing icon-contract tests**

Add tests that render every supported icon and assert:

```tsx
expect(container.querySelectorAll("svg")).toHaveLength(6);
expect(screen.queryByText("↗")).not.toBeInTheDocument();
expect(screen.queryByText("✉")).not.toBeInTheDocument();
```

For a titled standalone icon, assert the SVG receives an accessible name. For app-bar decoration, the parent will mark the icon wrapper `aria-hidden`.

- [ ] **Step 2: Run the focused test and verify failure**

```bash
npm test -- tests/unit/MetroIcon.test.tsx tests/unit/AppBar.test.tsx
```

Expected: FAIL because `MetroIcon` and the SVG contract do not exist.

- [ ] **Step 3: Implement the controlled icon set**

Use one `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, shared line caps/joins, and path data owned in `MetroIcon.tsx`. Do not add an external icon package for six glyphs.

Add tokens including:

```css
--metro-grid: 0.25rem;
--metro-tile-gap: 0.375rem;
--metro-content-inset: 1.5rem;
--metro-command-ring: 2.125rem;
--metro-command-stroke: 0.125rem;
--metro-cyan: #00a4ef;
--metro-blue: #174f9d;
```

Keep the existing accessible contrast tokens and consolidate duplicate timing/easing values.

- [ ] **Step 4: Replace app-bar placeholder glyph inputs at the call site**

Change app actions from arbitrary `ReactNode` icons to `MetroIconName`. The portfolio call site passes `"arrow-northeast"` and `"mail"`; the overflow command always renders `"ellipsis"`.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- tests/unit/MetroIcon.test.tsx tests/unit/AppBar.test.tsx
npm run typecheck
npm run lint
git diff --check
git add app/globals.css components/metro tests/unit/MetroIcon.test.tsx tests/unit/AppBar.test.tsx
git commit -m "feat: add Lumia tokens and icon system"
```

---

### Task 2: Rebuild the application bar

**Files:**
- Modify: `components/metro/AppBar.tsx`
- Modify: `components/metro/AppBar.module.css`
- Modify: `tests/unit/AppBar.test.tsx`
- Modify: `components/portfolio/PortfolioPanorama.tsx`

**Interfaces:**
- Consumes: `MetroIconName`, shared command tokens.
- Produces: `AppAction = { label: string; href?: string; icon: MetroIconName; onSelect?: () => void }`.
- Preserves: true link semantics and modified-click behavior.

- [ ] **Step 1: Write failing behavior and markup tests**

Assert that:

```tsx
expect(screen.getByRole("link", { name: "Résumé" }).querySelector("svg")).not.toBeNull();
expect(screen.getByRole("link", { name: "Contact" }).querySelector("svg")).not.toBeNull();
expect(screen.getByRole("button", { name: "Hide app bar labels" })).toHaveAttribute("aria-expanded", "true");
```

After activating overflow, require `Show app bar labels`, and verify both visual labels remain in the DOM. Labels are visible by default at every layout (the approved rings-with-labels look); wide layouts may collapse them via the overflow, and the overflow is hidden at phone widths where labels are always shown. Add a test proving no Unicode glyph appears in the bar text.

- [ ] **Step 2: Verify the tests fail for the current bar**

```bash
npm test -- tests/unit/AppBar.test.tsx
```

Expected: FAIL on SVG presence and the expanded accessible name.

- [ ] **Step 3: Implement exact command structure**

Each command contains:

```tsx
<span className={styles.ring} aria-hidden="true">
  <MetroIcon name={action.icon} />
</span>
<span className={styles.label}>{action.label}</span>
```

The ring remains thin, transparent, circular, and token-sized. Labels sit below rings at phone layouts. Press feedback inverts foreground/background and uses the shared Pressable tilt contract; it must not become a rounded pill. Overflow uses the SVG ellipsis and toggles an accurate accessible name.

- [ ] **Step 4: Verify mobile and desktop geometry with component tests**

Assert labels are not `display:none`, commands retain at least 44×44 hit areas, and Contact/Resume remain real anchors.

- [ ] **Step 5: Run gates and commit**

```bash
npm test -- tests/unit/AppBar.test.tsx tests/unit/PortfolioPanorama.test.tsx
npm run typecheck
npm run lint
git add components/metro/AppBar.tsx components/metro/AppBar.module.css components/portfolio/PortfolioPanorama.tsx tests/unit/AppBar.test.tsx
git commit -m "feat: rebuild Lumia application bar"
```

---

### Task 3: Make panorama headings the navigation

**Files:**
- Create: `components/metro/PanoramaNav.tsx`
- Create: `components/metro/PanoramaNav.module.css`
- Modify: `components/metro/Panorama.tsx`
- Modify: `components/metro/Panorama.module.css`
- Modify: `components/metro/index.ts`
- Delete after consumers migrate: `components/metro/PivotList.tsx`
- Delete after consumers migrate: `components/metro/PivotList.module.css`
- Modify: `components/portfolio/PortfolioPanorama.tsx`
- Modify: `components/portfolio/PortfolioPanorama.module.css`
- Create: `tests/unit/PanoramaNav.test.tsx`
- Delete after coverage migrates: `tests/unit/PivotList.test.tsx`
- Modify: `tests/unit/Panorama.test.tsx`
- Modify: `tests/unit/PortfolioPanorama.test.tsx`

**Interfaces:**
- Produces: `PanoramaNav({ active, options, onSelect }: { active: PivotId; options: readonly PivotOption[]; onSelect: (id: PivotId) => void })`.
- Produces: exactly one visible `<h1>` containing the active linked panorama label.
- Preserves: `pivotHref`, sequential focus, ArrowLeft/ArrowRight wrapping, ordinary-click state enhancement, modified-click browser ownership.

- [ ] **Step 1: Write failing semantic-order tests**

For all four initial pivots, require the single H1 accessible name to equal:

```ts
const headings = {
  me: "technical leader / builder",
  projects: "projects",
  blog: "blog",
  photography: "photography",
} as const;
```

Require no separate small tab text row, no `Selected systems / working drafts`, and no second H2 that repeats the active pivot. Retain tests for real hrefs, arrow keys, and modified clicks.

- [ ] **Step 2: Run focused tests and verify failure**

```bash
npm test -- tests/unit/PanoramaNav.test.tsx tests/unit/Panorama.test.tsx tests/unit/PortfolioPanorama.test.tsx
```

Expected: FAIL because the current H1 is global and the conventional tab row remains.

- [ ] **Step 3: Implement linked panorama headings**

Render all pivot links in one horizontal tablist. Wrap only the active link in the single H1 and style the next link as an off-canvas peek. Translate the heading track and content plane from the same active index. The active Me label is `technical leader / builder`; its href remains `/?view=me`.

Remove `Panorama`'s independent `heading` prop after the consumer migrates. Keep panels in stable Me/Projects/Blog/Photography DOM order and preserve `inert`, `aria-hidden`, IDs, and no-JavaScript content.

- [ ] **Step 4: Verify query-selected server markup**

Add E2E assertions that direct loads for all four query states contain the correct visible H1 before interaction and exactly one H1 after hydration.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- tests/unit/PanoramaNav.test.tsx tests/unit/Panorama.test.tsx tests/unit/PortfolioPanorama.test.tsx
npm run typecheck
npm run lint
git add components/metro components/portfolio tests/unit
git commit -m "feat: make panorama headings navigable"
```

---

### Task 4: Replace card-like LiveTile with role-based Lumia tiles

**Files:**
- Create: `components/metro/MetroTile.tsx`
- Create: `components/metro/MetroTile.module.css`
- Create: `components/metro/useLiveCycle.ts`
- Modify: `components/metro/TileGrid.tsx`
- Modify: `components/metro/TileGrid.module.css`
- Modify: `components/metro/Pressable.tsx`
- Modify: `components/metro/index.ts`
- Delete after migration: `components/metro/LiveTile.tsx`
- Delete after migration: `components/metro/LiveTile.module.css`
- Create: `tests/unit/MetroTile.test.tsx`
- Delete after coverage migrates: `tests/unit/LiveTile.test.tsx`
- Modify: `tests/unit/Pressable.test.tsx`
- Create: `tests/unit/useLiveCycle.test.tsx`

**Interfaces:**
- Produces: `TileSize = "small" | "wide" | "large" | "hero"`.
- Produces discriminated tile roles:

```ts
type BaseTileProps = {
  label: string;
  size?: TileSize;
  accent?: "cyan" | "blue" | "ink" | "photo";
  className?: string;
};

type DisplayTileProps = BaseTileProps & { role: "display"; children: ReactNode };
type NavigationTileProps = BaseTileProps & { role: "navigation"; href: string; children: ReactNode };
type RevealTileProps = BaseTileProps & { role: "reveal"; front: ReactNode; back: ReactNode };
type LiveTileProps = BaseTileProps & {
  role: "live";
  items: readonly ReactNode[];
  accessibleLabel: string;
  intervalMs?: number;
};

type MetroTileProps =
  | DisplayTileProps
  | NavigationTileProps
  | RevealTileProps
  | LiveTileProps;
```

- Produces: `useLiveCycle(itemCount: number, options: { intervalMs: number; paused: boolean; enabled: boolean }): { index: number; advance: () => void }`.

- [ ] **Step 1: Write failing role-contract tests**

Require:

- a navigation tile has exactly one anchor owning the entire tile;
- a display tile has no button or anchor;
- a reveal tile has one button and correct `aria-pressed`/face hiding;
- a live tile exposes a stable accessible label, uses `aria-live="off"`, cycles after 6000ms, pauses on hover/focus, advances on activation, and stops while `document.hidden`;
- reduced motion removes spatial transforms;
- consumer pointer handlers still run on touch and reduced-motion paths.

- [ ] **Step 2: Verify focused failures**

```bash
npm test -- tests/unit/MetroTile.test.tsx tests/unit/Pressable.test.tsx tests/unit/useLiveCycle.test.tsx
```

Expected: FAIL because role-based tiles and the cycle hook do not exist.

- [ ] **Step 3: Implement the discriminated tile shell**

Do not accept incompatible props across roles. Navigation renders a full-tile Next `Link`; reveal renders one Pressable; display renders a non-interactive article/div; live renders one focusable control only when manual advance is offered. Never overlay a separate destination over another interactive surface.

- [ ] **Step 4: Implement coherent grid ratios**

Use a four-unit phone grid and a wider desktop grid. Define explicit aspect ratios and spans for 1×1, 2×1, 2×2, and 4×2 behavior. Add `min-width:0`, controlled overflow, and tile-content line budgets. Remove the current fixed 7rem row assumption that caused the Lead Platform collision.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- tests/unit/MetroTile.test.tsx tests/unit/Pressable.test.tsx tests/unit/useLiveCycle.test.tsx
npm run typecheck
npm run lint
git add components/metro tests/unit
git commit -m "feat: add role-based Lumia tile system"
```

---

### Task 5: Build the Me personal Start screen

**Files:**
- Modify: `content/profile.ts`
- Modify: `components/portfolio/BioPanel.tsx`
- Create: `components/portfolio/ProfileTiles.tsx`
- Modify: `components/portfolio/PortfolioPanorama.module.css`
- Modify: `tests/unit/ProfileContent.test.ts`
- Modify: `tests/unit/PortfolioPanorama.test.tsx`
- Create: `tests/unit/ProfileTiles.test.tsx`

**Interfaces:**
- Consumes: `MetroTile`, `TileGrid`, `/portrait.jpg`, approved profile content.
- Produces: the approved portrait, live evidence, team, squads, capability graph, assessment, craft, leadership, and Lumia tiles.

- [ ] **Step 1: Write failing content and composition tests**

Require visible Me content to include an AI-native proposition connecting learning, assessment, and business outcomes. Require stable evidence labels for `5 frontend engineers` and `5 learning squads`, with distinct copy that does not imply all squad engineers report directly to Ajmal.

Render `ProfileTiles` and assert the approved role/size map:

```ts
expect(screen.getByRole("img", { name: "Portrait of Ajmal Hassan" })).toBeVisible();
expect(screen.getByLabelText(/5 frontend engineers.*5 learning squads.*AI-native systems/i)).toBeVisible();
expect(screen.getByText("capability graph", { exact: false })).toBeVisible();
expect(screen.getByText("520", { exact: true })).toBeVisible();
```

- [ ] **Step 2: Verify failure**

```bash
npm test -- tests/unit/ProfileContent.test.ts tests/unit/ProfileTiles.test.tsx tests/unit/PortfolioPanorama.test.tsx
```

Expected: FAIL because Me is an editorial bio and its visible lede lacks the approved proposition.

- [ ] **Step 3: Implement typed profile-tile content**

Keep facts in `content/profile.ts`. Use short, tile-safe strings and one stable accessible summary containing every cycled claim. Do not invent dates, employer names, availability, location, or metrics.

- [ ] **Step 4: Compose the approved grid**

Implement:

- large photo tile;
- wide live evidence tile cycling at 6000ms;
- small team and squads evidence;
- hero capability graph tile with restrained node state;
- wide live AI assessment tile with a quiet waveform;
- small `FE → full-stack` tile;
- small Lumia 520 Cyan tile;
- wide leadership-method tile.

Do not duplicate résumé/contact tiles because those destinations live in the app bar.

- [ ] **Step 5: Verify responsive content fit and commit**

Run unit tests, then a focused Playwright Me check at 320×568 and 1440×900 asserting tile text boxes remain inside their tile boxes.

```bash
npm test -- tests/unit/ProfileContent.test.ts tests/unit/ProfileTiles.test.tsx tests/unit/PortfolioPanorama.test.tsx
npm run typecheck
npm run lint
git add content/profile.ts components/portfolio tests/unit
git commit -m "feat: build Lumia personal start screen"
```

---

### Task 6: Recompose Projects as evidence tiles

**Files:**
- Modify: `content/projects.ts`
- Modify: `lib/content/projects.ts`
- Modify: `components/portfolio/ProjectsPanel.tsx`
- Modify: `components/portfolio/PortfolioPanorama.module.css`
- Modify: `tests/unit/ProjectsPanel.test.tsx`
- Modify: `tests/unit/ProjectContent.test.ts`

**Interfaces:**
- Consumes: role-based tiles and the validated Project model.
- Produces: explicit tile metadata per project: `tileSize`, `tileRole`, `tileLabel`, and optional short evidence rotation.

- [ ] **Step 1: Write failing tile-metadata validation tests**

Require each project to provide a supported tile size/role and a short face label. Reject navigation labels that exceed the agreed character budget. Assert `₹1Cr+` appears only on the lead-platform project.

- [ ] **Step 2: Write failing interaction tests**

Render Projects and require one full-tile link per project, no overlapping button/link pair, visible evidence on each face, and no repeated `Projects` heading or `selected systems` eyebrow.

- [ ] **Step 3: Implement and validate project tile metadata**

Use Lumia Metro Revival as the hero tile; capability graph and lead platform as large evidence tiles; live AI assessment and agent-ready foundations as supporting tiles where approved content exists. Navigation tiles open the existing case-study routes.

- [ ] **Step 4: Add layout collision checks**

In Playwright, compare each visible project link/text rectangle with its tile rectangle at all four target viewports. Every text/link rectangle must be contained by its tile; no two interactive rectangles may intersect unexpectedly.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- tests/unit/ProjectsPanel.test.tsx tests/unit/ProjectContent.test.ts
npm run typecheck
npm run lint
git add content/projects.ts lib/content/projects.ts components/portfolio tests/unit
git commit -m "feat: present projects as evidence tiles"
```

---

### Task 7: Recompose Blog and Photography

**Files:**
- Modify: `components/portfolio/BlogPanel.tsx`
- Modify: `components/portfolio/PhotographyPanel.tsx`
- Modify: `components/portfolio/PortfolioPanorama.module.css`
- Modify: `app/blog/page.tsx`
- Modify: `tests/unit/BlogPanel.test.tsx`
- Modify: `tests/unit/PhotographyPanel.test.tsx`
- Modify: `tests/unit/posts.test.ts`

**Interfaces:**
- Blog produces one latest-note navigation tile plus a conventional linked list.
- Photography produces a picture-tile grid whose data shape accepts final images/alt text later without markup changes.

- [ ] **Step 1: Write failing Blog composition tests**

Require the newest post to appear once as the feature tile and every post once in the list without duplicate accessible links. Draft labels, dates, summaries, and reading times remain visible. Import `PostStatus` from the content layer rather than duplicating its union.

- [ ] **Step 2: Write failing Photography composition tests**

Require the portrait tile plus two clearly marked pending collection tiles, stable figure captions, and useful alt text. The component must accept a typed `PhotoItem` collection so final selections replace data rather than structure.

- [ ] **Step 3: Implement Blog as a typographic hub**

Use one wide navigation tile for the latest note. Render remaining/all notes as full-row links with Windows Phone list spacing. Keep automatic motion off the reading list.

- [ ] **Step 4: Implement Photography as a picture hub**

Use photo/display tiles with preserved aspect ratios. Add the approved low-contrast photographic background variant. Do not invent final photography assets.

- [ ] **Step 5: Complete Markdown boundary regressions**

Add tests for exactly 220 and 221 words and for raw `<script>` plus `javascript:`/`data:` URLs. Expected: 220 words is 1 minute, 221 is 2 minutes, raw HTML is not emitted, and unsafe URLs are removed.

- [ ] **Step 6: Verify and commit**

```bash
npm test -- tests/unit/BlogPanel.test.tsx tests/unit/PhotographyPanel.test.tsx tests/unit/posts.test.ts
npm run typecheck
npm run lint
git add app/blog/page.tsx components/portfolio tests/unit
git commit -m "feat: polish Lumia content hubs"
```

---

### Task 8: Apply the Lumia system to detail and résumé surfaces

**Files:**
- Modify: `components/portfolio/ProjectCaseStudy.tsx`
- Modify: `components/portfolio/ProjectCaseStudy.module.css`
- Modify: `app/blog/[slug]/page.tsx`
- Create: `app/blog/article.module.css`
- Modify: `app/resume/page.tsx`
- Modify: `app/resume/resume.module.css`
- Modify: related unit/E2E tests

**Interfaces:**
- Consumes: Phase 2 tokens and `MetroIcon`.
- Produces: consistent application identity, typographic hierarchy, back commands, focus treatment, and print-safe résumé across non-panorama routes.

- [ ] **Step 1: Write failing representative-route tests**

Require project and article pages to use the shared app identity and an SVG back command rather than generic bordered web buttons. Require one H1, visible status/draft labels, and preserved conventional vertical reading.

- [ ] **Step 2: Add a failing résumé print-canvas test**

Assert the print stylesheet forces `html`, `body`, and the résumé root to a white background with black text and hides screen-only Lumia chrome.

- [ ] **Step 3: Implement shared detail-route polish**

Apply typography, spacing, cyan rules, and icon commands without turning long-form content into horizontal panorama regions. Replace Tailwind one-off article styling with the focused CSS module where it improves consistency.

- [ ] **Step 4: Verify and commit**

```bash
npm test
npm run typecheck
npm run lint
git add app/blog app/resume components/portfolio tests
git commit -m "feat: align portfolio detail surfaces"
```

---

### Task 9: Add restrained Phase 2 motion and backgrounds

**Files:**
- Modify: `components/metro/Pressable.tsx`
- Modify: `components/metro/Pressable.module.css`
- Modify: `components/metro/Panorama.module.css`
- Modify: `components/metro/MetroTile.module.css`
- Modify: `components/portfolio/PortfolioPanorama.tsx`
- Modify: `components/portfolio/PortfolioPanorama.module.css`
- Modify: related unit/E2E tests

**Interfaces:**
- Produces: pivot-driven background variables and Phase 3-compatible data attributes.
- Produces: restrained tile entrance, press tilt, live evidence, waveform, and node animations.
- Does not produce: route transitions, shared-element transitions, gesture physics, or turnstile navigation.

- [ ] **Step 1: Write failing motion-policy tests**

Require the shell to expose `data-active-pivot`, tiles to expose stable role/index attributes, and reduced-motion mode to remove spatial transforms. Assert consumer `onPointerMove` still runs on touch and reduced-motion paths.

- [ ] **Step 2: Implement background variants**

Use pseudo-elements and pivot-scoped CSS variables for node traces, transit/grid lines, and photographic atmosphere. Keep background opacity within the approved low-contrast range and test foreground contrast with axe/Lighthouse.

- [ ] **Step 3: Implement selective Phase 2 animation**

Stagger tile entrances by index with a short capped delay. Offset live evidence, waveform, and node timing so only one conspicuous state changes at a time. Pause cycles when the document is hidden. Preserve native scroll and do not add wheel/swipe trapping.

- [ ] **Step 4: Verify reduced motion and commit**

```bash
npm test
npx playwright test tests/e2e/portfolio.spec.ts --grep "reduced motion"
npm run typecheck
npm run lint
git add components tests
git commit -m "feat: add restrained Lumia motion and atmosphere"
```

---

### Task 10: Complete viewport, accessibility, and visual acceptance

**Files:**
- Modify: `tests/e2e/portfolio.spec.ts`
- Modify: `tests/e2e/accessibility.spec.ts`
- Modify only source files identified by failing checks
- Modify: `docs/portfolio-content-checklist.md` only if Phase 2 creates a new content dependency

**Interfaces:**
- Produces: exact viewport artifacts, collision gates, expanded axe coverage, production Lighthouse evidence, and a clean Phase 2 launch candidate.

- [ ] **Step 1: Expand real-browser journeys**

Cover:

- every query-selected panorama heading;
- Back/Forward across pivots and Contact;
- modified-click navigation;
- keyboard arrow navigation and sequential focus;
- no-JavaScript project/blog navigation;
- live-tile pause/advance;
- representative project and article detail routes;
- app-bar labels and commands;
- reduced motion.

- [ ] **Step 2: Expand axe coverage**

Scan Me, Projects, Blog, Photography, one project detail, one blog detail, résumé, and open Contact in desktop and mobile projects. Fail on serious or critical violations.

- [ ] **Step 3: Capture exact viewport-only artifacts**

Capture, with `fullPage: false`:

- 320×568;
- 393×851;
- 1440×900;
- 1920×1080.

Store them under ignored `.superpowers/playwright/phase-2/`. Compare the live implementation directly against the approved Phase 2 mockups in the in-app browser. Verify panorama peeks, tile ratios, icon rings, labels, app-bar geometry, subtle backgrounds, and absence of text collisions.

- [ ] **Step 4: Run production Lighthouse**

Run the production build on an owned port and record exact scores. Required minimums:

- performance: `0.90`;
- accessibility: `0.95`;
- best practices: `0.95`.

- [ ] **Step 5: Run the complete final gate**

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
npm run test:a11y
git diff --check
git status --short
```

Expected: all commands pass, task-owned servers release their ports, screenshots remain ignored, and only intentional Phase 2 source changes are committed.

- [ ] **Step 6: Commit final acceptance repairs**

If checks required source changes:

```bash
git add app components content lib public tests docs package.json package-lock.json
git commit -m "feat: complete Lumia UI polish phase"
```

Do not create an empty commit when the branch is already clean.
