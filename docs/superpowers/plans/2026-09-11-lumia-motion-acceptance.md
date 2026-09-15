# Lumia Motion Acceptance Record

## Result and workspace

The first motion milestone implements a draggable layered panorama and a complete Projects → detail → Projects turnstile interaction using the existing web stack. This record accompanies the [implementation plan](2026-09-11-lumia-motion.md) and [design](../specs/2026-09-11-lumia-motion-design.md).

Work is isolated in `.worktrees/lumia-portfolio`, branch `codex/lumia-portfolio`. Main and its user-owned handoff files remain untouched. No runtime dependencies were added. All verification gates below pass; final whole-branch review is in progress.

## Final production verification

Runtime: Node 22.22.2, Next 15.5.24, Playwright 1.62.1. Browser projects: Chromium desktop and Pixel 5 emulation. Development was stopped before building; browser runs used an owned production server at `http://127.0.0.1:3149` with `ARTIFACT_BASE_URL` set, preventing a competing development server from rewriting `.next`.

| Check | Result |
| --- | --- |
| `npm test` | **377 passed**, 29 files, 4.31s |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed with one numeric-ref cleanup warning, discussed below |
| `npm run build` | Passed; homepage first-load JavaScript **127kB**, versus 121kB baseline |
| `npm run test:e2e -- --workers=2` against production | **190 passed**, 1.9min |
| `npx playwright test tests/e2e/motion.spec.ts --workers=2` against production | **38 passed**, 21.1s |
| `npm run test:a11y -- --workers=2` against production | **36 passed**, 7.5s |
| Prettier check on all changed code/test files | Passed |
| `git diff --check` | Passed |
| Lighthouse 13.4.1, production homepage | **Performance 99, accessibility 100, best practices 100** |

Lighthouse ran without competing browser tests: FCP 0.9s, LCP 2.0s, TBT 10ms, CLS 0. These are one local lab run, not field measurements. Full report: `/tmp/lumia-lighthouse-final.json`.

The motion suite includes real Chromium `Input.dispatchTouchEvent` input for accepted and short swipes, implicit capture transfer, touch cancellation, vertical scrolling, and reduced-motion swiping. It also covers finite boundaries, interruption, resize, genuine surface capture loss, preference changes, keyboard project activation, direct entry, Back/Forward, and source scroll/focus restoration. Existing checks retain no-JavaScript routes, modified clicks, printing, contrast, focus rings and content geometry.

## Visual evidence

Captured active motion and settled frames at **320×568, 393×851, 1440×900, and 1920×1080**. Artifacts live in `.superpowers/playwright/phase-3-final/`:

- `<width>-panorama-drag.png` and `<width>-panorama-arrival.png`: actual dragging phase, then a committed Me→Projects arrival. Every run retained exactly one active panel and had no horizontal document overflow.
- `<width>-projects.png`, `-exit.png`, `-detail.png`, `-return-exit.png`, and `-return.png`: complete project round trip. Every run focused the detail H1, returned focus to the source tile, and emitted no browser errors or horizontal overflow.
- `lumia-project-round-trip.webm`: 393px production recording.
- `results.json` and `panorama-results.json`: machine-readable observations.

Inspected moving phone/desktop frames confirm actual tile and reading-column rotation, coupled panorama heading/content movement, retained outgoing content, and a stationary app bar. Settled frames preserve readable content geometry. These captures use live animations, not animation-disabled screenshot fixtures.

## Review and diagnostic record

Task reviews approved all three tasks after fixes:

1. Panorama: moved gesture handling to a stable surface and preserved keyboard heading visibility during reordering.
2. Projects: cancelled stale arrival/layout restoration after unrelated navigation; removed retained exit frames immediately when reduced motion changes while navigation is pending.
3. Native touch: ignored descendant capture-loss events while retaining genuine surface-loss cancellation, with RED→GREEN unit evidence and native browser regressions. Added a native short-touch case during review.

The first integration browser run finished 177/190 and the second 188/190. Failures exposed test assumptions, corrected without relaxing the protected behavior: print checks had selected the new `display:contents` provider ancestor instead of the actual status line; popup locator assertions hit Playwright's pending-navigation latch despite the rendered destination; the stagger check compared an interpolating perspective coefficient. Final popup checks poll actual document URL and semantic state, preserve unchanged-opener assertions, and were also inspected in a retained browser frame. The stagger check retains exact rotation, scale, translation, active lift, animation target and delay assertions.

## Baseline and remaining limits

- Baseline `19a6856`: **325 unit tests passed**; unchanged main production build passed with 121kB homepage first-load JavaScript. Before-motion phone/desktop captures were inspected.
- Unchanged main browser baseline: **176 passed, 14 failed** out of 190. Eleven Blog geometry cases sampled its existing independent 8px tile entrance, two press cases used unsettled or stale geometry, and one background-popup readiness case stalled. Baseline log: `/tmp/lumia-baseline-e2e.log`.
- The existing Blog hero entrance can transiently overlap the first list row. Settled-layout test synchronization is corrected; this separate pre-existing animation defect is **not claimed fixed** by this milestone.
- Lint emits one `react-hooks/exhaustive-deps` warning for the provider's numeric `generation.current` in cleanup. Latest-value invalidation is intentional; it is not a captured DOM-node ref. The command exits 0. Existing Next 15 lint-command deprecation, PostCSS `from`, and jsdom unsupported-navigation notices also remain.
- Browser validation covers Chromium and mobile emulation; Safari, Firefox and physical-device runs are not included.
- This milestone preserves the current fonts and content. Shared-element expansion and a broader visual redesign are outside its scope.
