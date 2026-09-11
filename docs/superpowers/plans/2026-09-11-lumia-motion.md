# Lumia Motion System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a responsive layered panorama and a complete 3D Projects → detail → Projects interaction.

**Architecture:** Keep server-rendered HTML and existing React components. A panorama controller coordinates continuous progress; a persistent project coordinator manages route exit/entry with the Web Animations API. Both expose inspectable lifecycle state and settle safely on interruption.

**Tech Stack:** Next 15.5.24, React 19.2.8, TypeScript, CSS Modules, Pointer Events, requestAnimationFrame, Web Animations API, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-11-lumia-motion-design.md`

## Global Constraints

- Node `>=22.22.2 <23`; use installed Node `22.22.2` for verification.
- Preserve Next `15.5.24`, React `19.2.8`, and existing dependency versions.
- No new runtime dependencies, Canvas, Three.js, or experimental Next transition APIs.
- Keep real anchor destinations, server-rendered content, metadata, direct URLs, modified clicks, and no-JavaScript navigation.
- Preserve native vertical scrolling and pinch zoom; scope `touch-action: pan-y pinch-zoom` only to the panorama gesture surface.
- Reduced motion removes spatial animation immediately, including when the preference changes during movement.
- Keep one accessible active panel and one accessible page H1; outgoing visual panels are inert and aria-hidden.
- Do not transform the whole page shell or the fixed app bar/contact overlay.
- Preserve approved content, tile geometry, existing font stack, and contact fragment/history behaviour.
- Keep existing user files and unrelated changes untouched. Do not push, merge, or publish.

## Workspace and delegation

Execute in `/Users/ajmalhassan/hobbyspace/ajmalhassan.com/.worktrees/lumia-portfolio`, branch `codex/lumia-portfolio`, clean starting commit `19a6856`. The root checkout has unrelated untracked Claude handoff files: leave them alone. Existing worktree is already isolated and at the same commit as main; do not create another checkout.

Architecture, project-route, and test-strategy investigations were delegated independently. Implementation uses successive agents with file ownership below, followed by task review. Do not spawn nested agents. Root owns plan integration, runtime/server management, final browser verification, and review decisions. No implementation worker runs a dev server or production build concurrently with root.

Use `PATH=/Users/ajmalhassan/.nvm/versions/node/v22.22.2/bin:$PATH` for every Node command. Baseline: 26 unit files, 325 tests pass. Existing PostCSS `from` warning and jsdom document-navigation warning were observed before this change.

## File ownership and interfaces

| Task | Owned files | Responsibility |
| --- | --- | --- |
| 1 | `components/metro/panoramaMotion.ts`, `usePanoramaMotion.ts`, `Panorama.tsx`, `Panorama.module.css`, `PanoramaNav.tsx`, `PanoramaNav.module.css`, `components/portfolio/PortfolioPanorama.tsx`, its CSS module, `app/globals.css`, corresponding unit tests | Gesture decisions, continuous progress, retained panels, headings/background, URL integration |
| 2 | `components/metro/ProjectTransitionProvider.tsx`, `projectTransition.ts`, `projectTransition.module.css`, `MetroTile.tsx`, `AppBar.tsx`, `app/layout.tsx`, `components/portfolio/ProjectsPanel.tsx`, `ProjectCaseStudy.tsx`, `DetailSurface.tsx`, corresponding unit tests | Opt-in project route lifecycle, turnstile, origin restoration |
| 3 | `tests/e2e/motion.spec.ts`, existing `tests/e2e/portfolio.spec.ts`, optional motion artifact helper, acceptance report | Real-browser regressions, migration of obsolete assertions, capture and validation |

Task 2 can observe Task 1's `[data-panorama][data-motion-state="idle"]`, `[data-pivot="projects"][data-active="true"]`, and canonical project hrefs to restore focus/scroll. It must not alter panorama internals. Existing `--panorama-index` remains the canonical selected index; continuous motion uses separate properties.

---

### Task 1: Implement an interruptible layered panorama

**Files:** Own the Task 1 row above. Add `tests/unit/panoramaMotion.test.ts` and `tests/unit/usePanoramaMotion.test.tsx`; extend existing Panorama/Nav/PortfolioPanorama tests where behaviour changes.

**Interfaces:**
- Consumes existing `PivotId`, `PIVOT_IDS`, `pivotIndex`, `pivotHref`, and `useReducedMotion`.
- Produces lifecycle `data-motion-state="idle|dragging|settling"` on `[data-panorama]`.
- Internal controller contract (keep all consumers consistent if stronger typing is needed):

```ts
type PanoramaPhase = "idle" | "dragging" | "settling";
type PanoramaMotionOptions = {
  active: PivotId;
  onGestureCommit: (id: PivotId) => void;
};
// usePanoramaMotion(options) returns refs for shell, surface and heading track,
// lifecycle phase, visualPivots, select(id), and React pointer/click-capture handlers.
// Continuous position is held in refs; no setState on each animation frame.
```

- [ ] Write pure decision tests before implementation. Extract gesture threshold/target calculation into `panoramaMotion.ts`. Test this explicit decision table:

```ts
// width=400, startIndex=1, count=4; dx is pointer displacement.
// dx=-20, velocity=-0.1 => target 1 (short slow drag).
// dx=-100, velocity=-0.1 => target 2 (distance commit).
// dx=30, velocity=0.6 => target 0 (velocity commit).
// dx=10, velocity=0.8 => target 1 (minimum travel protects clicks).
// startIndex=0, dx=100 => target 0 (finite boundary).
// startIndex=3, dx=-100 => target 3 (finite boundary).
```

- [ ] Run `npm test -- tests/unit/panoramaMotion.test.ts` and record expected failures.
- [ ] Implement the pure gesture decisions with constants 8px intent, 1.2 axis ratio, 0.22 distance fraction, 0.45px/ms velocity and 24px minimum fling displacement. Use recent timestamped samples, never cumulative velocity from the entire gesture.
- [ ] Write controller tests for cancellation, second selection mid-settle, reduced-motion changes, and cleanup. Use a controlled animation-frame clock and explicit geometry; do not use jsdom's zero geometry as evidence of layout correctness.
- [ ] Implement controller progress, interruption generation, resize cleanup, pointer capture and one-click suppression. Measure geometry once at gesture/transition start and resize; write style values through one frame callback. Use decelerating 420ms settlement from the current displayed position.
- [ ] Integrate surface painting and temporary transition height. Keep only selected semantics active; defer outgoing collapse until settlement. At rest preserve current markup ordering, focus-ring bleed, inactive live-animation pausing, and print behaviour.
- [ ] Integrate heading movement from measured geometry and background movement at 10vw per section. Preserve selected-first final header order and arrow navigation; avoid a snap caused by immediate reorder. Never transform the shell.
- [ ] Connect committed swipes to one canonical route change. Existing tabs remain real Next links. Guard optimistic selection against obsolete commits; settle external Back/Forward correctly. Route cancellation must not leave the URL and selected tab disagreeing.
- [ ] Run focused unit tests and typecheck:

```bash
npm test -- tests/unit/panoramaMotion.test.ts tests/unit/usePanoramaMotion.test.tsx tests/unit/Panorama.test.tsx tests/unit/PanoramaNav.test.tsx tests/unit/PortfolioPanorama.test.tsx tests/unit/Pressable.test.tsx
npm run typecheck
```

- [ ] Format only changed files. Self-review for competing transforms, pointercancel/lost capture, editable elements, finite edges, vertical intent, and duplicate IDs. Record test output and changed files in the task report; leave scoped changes available for review. If committing is permitted, commit only task-owned files with `feat: add coordinated Lumia panorama motion`.

### Task 2: Implement project turnstile navigation and return

**Files:** Own the Task 2 row above. Add `tests/unit/ProjectTransition.test.tsx` and pure helper tests as needed; extend MetroTile/AppBar/ProjectCaseStudy tests for opt-in contracts.

**Interfaces:**
- Consumes canonical project hrefs and Task 1's idle/selected DOM markers.
- Produces persistent context with `openProject(href: string, source: HTMLElement): void` and `returnToProjects(): void`, plus `idle|exiting|navigating|entering` state.
- `MetroTile` navigation role accepts an optional typed `onNavigate` callback compatible with installed Next `Link`; unchanged callers need no provider.
- Add a serializable optional project-return intent to `AppAction`, used only by project DetailSurface. Do not send client callbacks from server components.
- Root layout remains a server component wrapping children in the provider. Route server files remain unchanged.

- [ ] Write tests for normal project interception versus modified/middle clicks, missing-provider fallback, direct-entry return, cancellation and reduced motion. Use the real component boundary and a controlled animation adapter; mock routing only at Next's boundary.

```ts
// Required observable sequence for an opted-in ordinary activation:
// href remains /projects/<slug> → exiting → router.push exactly once
// → pathname commits → entering → idle → detail H1 receives focus.
// Reduced motion: router.push immediately, no spatial animations.
// Direct visit: Projects command navigates to /?view=projects without router.back.
// Second request: cancelled first completion cannot push its stale destination.
```

- [ ] Run `npm test -- tests/unit/ProjectTransition.test.tsx` and record expected failures.
- [ ] Implement `projectTransition.ts` for animation creation/cleanup and `ProjectTransitionProvider.tsx` for route lifecycle. Use generation tokens and caught animation cancellation. A 1500ms slow-navigation watchdog restores visibility; it must not erase valid pending intent or silently discard a later route commit.
- [ ] Animate project tiles with 220ms turnstile exit, 20ms stagger capped at 100ms, selected tile last; animate incoming reading column for 260ms. Use independent wrappers/channels so hover tilt and tile entrance do not override route motion. Keep app-bar geometry fixed.
- [ ] Opt project tiles into the coordinator through a real Next Link navigation callback. Preserve native href, prefetch, keyboard activation, no-JavaScript and modified-click paths. Missing WAAPI/reduced motion must navigate immediately.
- [ ] Implement project-only back intent in existing AppBar/DetailSurface. Save actual origin URL, project href, scroll and focus. Use router.back only for a known immediate origin; use the real fallback otherwise. Observe native traversal without reversing it. Restore source scroll and focus after the panorama is idle; do not mutate Next private history state.
- [ ] Run focused unit tests, then the full unit suite once and typecheck:

```bash
npm test -- tests/unit/ProjectTransition.test.tsx tests/unit/MetroTile.test.tsx tests/unit/AppBar.test.tsx tests/unit/ProjectCaseStudy.test.tsx
npm test
npm run typecheck
```

- [ ] Format changed files, self-review timers/unmount/error paths, and report evidence. If committing is permitted, commit only owned files with `feat: add project turnstile navigation`.

### Task 3: Verify interactions and capture motion evidence

**Files:** `tests/e2e/motion.spec.ts`, `tests/e2e/portfolio.spec.ts`, `docs/superpowers/plans/2026-09-11-lumia-motion-acceptance.md`. Root manages server and commands; validation worker owns test changes.

**Interfaces:** Consume both lifecycle attributes, existing real links and selected panel markers. Poll completion rather than depend on arbitrary animation durations.

- [ ] Add an explicit idle gate to the existing arrival helper:

```ts
await expect(page.locator("[data-panorama]")).toHaveAttribute("data-motion-state", "idle");
```

- [ ] Replace only the panorama's obsolete `touch-action:auto` assertion with `pan-y pinch-zoom`; retain root `auto`, actual vertical scrolling, no cancelling wheel/touch listeners, and existing reduced-motion semantics.
- [ ] Add independent browser cases for committed swipe (+1 history entry), short drag (no entry), drag-origin link suppression, vertical movement, finite edges, interruption by a second navigation, cancel/lost capture, resize, reduced-motion toggle, project ordinary/keyboard activation, return with scroll/focus, direct-entry fallback and browser Back/Forward.

```ts
test("a short horizontal drag settles without navigating", async ({ page }) => {
  await page.goto("/?view=projects");
  const surface = page.locator("[data-panorama]");
  await expect(surface).toHaveAttribute("data-motion-state", "idle");
  const before = await page.evaluate(() => history.length);
  const box = await surface.boundingBox();
  if (!box) throw new Error("Panorama has no geometry");
  await page.mouse.move(box.x + box.width / 2, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 18, box.y + 20, { steps: 5 });
  await page.mouse.up();
  await expect(surface).toHaveAttribute("data-motion-state", "idle");
  await expect(page).toHaveURL(/view=projects/);
  expect(await page.evaluate(() => history.length)).toBe(before);
});
```

- [ ] Run focused tests on an owned production server after root builds. Configure with `ARTIFACT_BASE_URL=http://127.0.0.1:3149` (inspect the port first); this disables the managed dev server. Never run dev/build against a production server's active `.next`.
- [ ] Root runs final gates under Node22 and records exact results:

```bash
npm test
npm run typecheck
npm run lint
npm run build
ARTIFACT_BASE_URL=http://127.0.0.1:3149 npm run test:e2e
ARTIFACT_BASE_URL=http://127.0.0.1:3149 npx playwright test tests/e2e/motion.spec.ts
ARTIFACT_BASE_URL=http://127.0.0.1:3149 npm run test:a11y
git diff --check
```

- [ ] Capture and inspect settled and mid-motion frames at 320×568, 393×851, 1440×900 and 1920×1080; include a project open/return recording or image sequence. Use active motion, not the existing animation-disabled artifact helper. Confirm no blank gaps, clipped content/focus, heading snaps, or moving app bar.
- [ ] Record Lighthouse against the owned production server, with Phase 2 targets performance ≥0.90, accessibility ≥0.95, best practices ≥0.95. If a gate cannot run, report the exact reason without presenting the milestone as fully verified.
- [ ] Complete task and whole-change reviews. Correct meaningful defects, preserve evidence in the acceptance report, and provide the plan, implementation location, and preview for user review. Do not merge/publish as part of this milestone.
