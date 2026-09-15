# Library alpha verification — 2026-09-15

This is a working, unpublished alpha, not a claim of final release readiness. The accepted direction and component roadmap live in `library-direction.md` and `component-roadmap.md`.

## Delivered

- Framework-independent React package at `packages/react`, linked into the Next application through its built ESM/declaration exports.
- Seventeen components: Theme, Tile, TileLink, RevealTile, LiveTile, TileGrid, Pressable, AppBar, AppBarAction, Transition, Stagger, Pivot, PivotList, PivotTrigger, PivotPanel, Panorama, and TileSequence.
- Scoped light/dark/system themes and five accents, with distinct surface and text accent tokens.
- Static/link/reveal/live tiles; native contact tilt; accessible live controls; container-based tile geometry.
- Four interruptible transition presets, reduced-motion settlement, committed completion callbacks, and keyed staggered entrances.
- `/library` workshop with motion controls, a tile-to-detail composition, theme controls, installation examples, and phone/desktop layouts.
- Consumer README, contribution guide, component roadmap, package smoke test, browser tests, and CI configuration.

The original portfolio is preserved. Its Next-specific panorama and project routing remain application code; this alpha proves the new package boundary through the workshop rather than replacing all existing portfolio internals.

## Verification evidence

Runtime: Node 22.22.2, React/React DOM 19.2.8, Next 15.5.24, Playwright 1.62.1. Browser: Chromium 151.0.7922.34 on macOS, desktop and Pixel 5 emulation.

| Check                                   | Result                                                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Existing baseline before implementation | 377 unit tests passed                                                                                                                 |
| Full final unit suite                   | 454 tests passed in 34 files                                                                                                          |
| Root TypeScript                         | Passed                                                                                                                                |
| Library lint with zero-warning policy   | Passed                                                                                                                                |
| Root lint                               | Passed with one existing warning in `components/metro/ProjectTransitionProvider.tsx:539`                                              |
| Production Next build                   | Passed; `/library` statically prerendered                                                                                             |
| Packed plain React consumer             | ESM import and SSR passed without browser globals                                                                                     |
| Packed TypeScript declarations          | Clean consumer compiled; intentionally invalid tile size correctly rejected                                                           |
| Full production browser regression      | 284 tests passed across desktop and mobile projects (2.5 minutes); final 20-test workshop rerun passed after skip-link styling polish |

The pre-existing unit suite emits a PostCSS `from` warning and JSDOM navigation notices. Root tooling also reports the existing deprecated Next lint command. These were not introduced or suppressed by this change.

The package test verifies expected CSS/declaration files, preserved client directives, absence of app-specific imports, and clean tarball consumption. It creates an isolated temporary consumer with actual React dependencies; it does not rely on workspace source aliases.

Measured emitted JavaScript: 48,460 bytes combined, 10,502 bytes gzip. CSS: 11,284 bytes combined, 3,033 bytes gzip. These are totals of emitted files, not a promise of an application's final bundled size. Tree-shaken per-component bundle budgets remain release work.

## Browser and visual checks

Workshop checks cover:

- Native tile links, keyboard reveal, manual live pause, and theme switching.
- Container geometry at 288px inside a wider viewport.
- Small live-tile labels and 44px controls staying inside their grid cell.
- Contact-point tilt and cancellation when reduced motion changes during a press.
- Exit, entrance, replay, and no stale exiting children.
- Actual turnstile direction reversal: the sampled browser frame remains continuous within 0.1px.
- Focus moving to the detail heading and returning to the originating button.
- All five accents in dark and light modes with automated axe scans.
- Reduced-motion interaction and no horizontal overflow at 320px.

Visual artifacts under ignored `.superpowers/library-review` include desktop dark/light pages, 393px and 320px phone layouts, and a paused midpoint from a real Web Animations timeline. Motion capture explicitly uses no-preference; reduced motion is exercised separately in tests. These are review artifacts, not historical Windows Phone reference captures.

Production command: `ARTIFACT_BASE_URL=http://127.0.0.1:3101 npx playwright test tests/e2e/library.spec.ts tests/e2e/library-components.spec.ts tests/e2e/portfolio.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/motion.spec.ts`.

The production regression command also covers the original portfolio's panorama gestures, navigation history, project turnstiles, focus restoration, no-JavaScript routes, printing, layout geometry, and contrast checks.

## Independent review findings resolved

1. **Interrupted turnstile pivot:** preserve sampled transform origin as well as opacity and transform. Browser rereview confirmed less than 0.07px drift at the interrupted frame.
2. **Empty stagger slots:** filter empty conditional children before wrapping and assigning delays.
3. **Premature callbacks:** fire completion only after terminal DOM state commits; replay and StrictMode regression tests pass.
4. **Small live-tile overflow:** wrap captions and controls in normal document flow instead of reserving a fixed-width absolute footer.
5. **Stranded live pause:** reconcile focus after changing item count removes controls. Independent Chromium reproduction confirms autoplay resumes.

## Remaining release work

- Final public package identity and license approval; package remains private and unpublished.
- Manual screen-reader testing and a declared Safari/Firefox/real-device support matrix. Chromium device emulation does not substitute for physical phones.
- Broader RTL, zoom/large-text and consumer-content resilience coverage before claiming comprehensive support.
- Router recipes, followed by form and overlay components; Pivot, Panorama and TileSequence are implemented.
- Public API stabilization, migration policy, changelog/versioning, bundle budgets, and publication review.

CI configuration was added locally. No remote workflow execution, push, merge, or publication was performed.

## Navigation iteration

Pivot, Panorama and TileSequence are now exported and demonstrated in the workshop. The full unit suite passes 454 tests. All 30 workshop browser tests pass on Chromium desktop and Pixel 5 emulation, including native CDP touch swipes and vertical scroll, roving keyboard focus, tile/detail focus restoration, 320px layouts, reduced motion and all light/dark accent combinations.

Independent review found and resolved stale post-cancellation click suppression and modified-arrow shortcut interception in Panorama. The browser contrast scan also caught inactive light-theme headings; they now use the semantic muted text token. Regression coverage includes these fixes. Desktop and 393px navigation screenshots were inspected.

The production build, library lint and clean packed consumer SSR/declaration checks passed again for this iteration. The earlier 284-test production regression above describes the initial alpha; current navigation browser coverage is recorded separately.

## Heading and group-motion refinement

Panorama now retains a clickable trailing fragment of the previous heading. TileSequence defaults to a single group turn; `mode="individual"` explicitly enables the earlier stagger behavior. The workshop uses the group default in both directions and retains focus restoration. Midpoint checks verify one animated group surface, untransformed tile wrappers, and bounded geometry.

Refinement validation: 456 full-suite unit tests passed; the final rotation adjustment also passed all 16 TileSequence unit tests. All 34 production workshop browser checks passed. Production build/type checking and library lint passed.

## Recording-guided layered motion

The supplied 9.56-second recording shows a lower-right to upper-left exit wave around 4.3–4.7 seconds. TileSequence now defaults to `mode="layered"`: a subtle shared turn carries independent, staggered tile turns. Return uses a complementary entrance; the supplied clip does not show return, so this is an interpretation. The previous group-only and individual-only modes remain explicit options. No reference media was added to the distributable package.

Validation: 458 unit tests, 34 production workshop browser tests, production build/type checks and library lint pass. Browser midpoint checks confirm one parent animation and four differently phased tile animations, bounded group geometry, and focus restoration. Unit tests cover cancellation and sampled reversal of both layers.

## Everyday command slice

Added Button, IconButton, AppBarLink and AppBarOverflow, with interactive examples at `/library#commands`. Buttons preserve native form submission and consumer cancellation; loading blocks repeated activation while retaining label, dimensions and focus. Icon-only controls require labels. App-bar destinations remain anchors. Overflow is an inline disclosure with ordinary Tab order, controlled/uncontrolled state and focus restoration on close.

Validation: 467 unit tests in 35 files, 40 production workshop browser checks, production build/type checking and library lint passed. Clean tarball SSR and declaration checks passed, including rejection of unlabeled icon buttons and app-bar links without href. Desktop and 320px screenshots were inspected; theme scans cover all accent combinations across the full workshop. Existing baseline tooling warnings remain unchanged.

Current emitted totals: JavaScript 54,496 bytes (11,770 gzip); CSS 13,539 bytes (3,478 gzip). These measure emitted file totals rather than consumer bundle size. Manual screen-reader and additional browser/device review remain release work.

Independent command review found and resolved a stale focus flag when a focused overflow child was removed before focus moved outside. Closure now checks the current focus destination and never reclaims focus from an outside control. The exact removal → outside focus → controlled close path has a regression test.

## Streaming progress dots

ProgressDots adds a reusable named indeterminate indicator and replaces loading buttons’ pulsing line with decorative streaming dots. The command workshop shows both sizes during its manually controlled save preview. Browser measurements verify faster arrival/departure than the middle segment; reduced motion produces five distinct static dots. Eleven focused unit tests, eight production command browser tests, production build/type checks, library lint, and packed SSR/declaration checks passed. A paused middle frame was visually inspected.

## Field foundation

Added Field, Label, FieldDescription, FieldError, TextField and TextArea. Field connects one control to its label, optional help and errors using IDs available during SSR. Caller descriptions merge with generated IDs. Native form values, reset, refs, disabled/required inheritance and controlled values are preserved. The profile example owns validation, announces a result summary and focuses the first invalid control after errors commit. It sends no network requests.

Validation: 474 unit tests, 46 production workshop browser checks, library lint, production build/type checks and clean packed consumer SSR/declarations passed. Independent review found no substantive issues; a literal newline in example copy was corrected. Desktop and 320px light-theme error layouts were visually inspected. Form/browser coverage includes label-click focus, errors, successful submission, reset, read-only/disabled controls and contrast.

## Selection controls

Added Checkbox, RadioGroup and Switch, using native checkbox/radio state and form behavior. Labels, descriptions and errors are associated; native defaults reset with the form, controlled state stays with the owner, and RadioGroup supports native arrows/disabled skipping and external form ownership. The preferences example performs no network writes.

Independent review found no substantive issues. Browser review caught reduced contrast in helper text beneath disabled controls; only the control is now dimmed, preserving readable descriptions. Unit suite: 479 passed; final guarded radio event handling also passed the five scoped selection tests. Production build/type checking, library lint and clean packed consumer SSR/declarations passed. Desktop and 320px layouts were visually inspected. No form-validation dependency was added.

Final selection regression: all 50 production workshop browser checks passed, including all light/dark accent combinations.

## Select and Slider — 2026-09-15

- Added native Select and Slider exports with shared Field associations, native props/refs, options, range bounds/steps, and controlled/uncontrolled ownership.
- Added `/library#adjustments`: display settings, grouped/disabled options, live brightness percentage, disabled slider, submission and reset.
- Full unit suite: **483 passed across 39 files**. Library ESLint: passed with zero warnings. Production build and TypeScript: passed (existing portfolio effect-cleanup warning remains).
- Production workshop browser suite: **54 passed**. After independent review identified an invalid-state outline hiding keyboard focus, added a distinct focused treatment and regression; rebuilt production and reran all adjustment checks: **6 passed** across desktop and mobile.
- Packed offline React consumer: SSR and TypeScript passed with Select/Slider exports, native markup and typed refs; invalid Slider type rejected.
- Visually inspected desktop dark and 320px light screenshots in `.superpowers/library-review/adjustments-desktop.png` and `adjustments-mobile.png`. No horizontal overflow; light/dark axe checks passed. Native popup appearance remains platform-owned.
- No validation-library dependency added. Next planned slice: determinate Progress, ProgressRing and MessageBanner.

## Progress and MessageBanner — 2026-09-15

- Added Progress and ProgressRing with shared bounded value normalization, determinate and indeterminate visuals, labelled/decorative contracts, reduced-motion fallbacks and forced-color styles. Added persistent MessageBanner with explicit announcement policy, action slot and owner-controlled dismissal.
- Workshop `/library#feedback` demonstrates progress changes, unknown totals, ring sizes, save/error/retry and focus restoration after dismissal/removal.
- Independent source review examined new components and selected package, form, theme and command foundations. It found an existing native-hidden defect, reproduced in production browser before fixing. Buttons, Field, Label, text controls, Select and Slider now retain native hidden display behavior. Review scope/limits are recorded in `foundation-review.md`.
- **492 unit tests passed (40 files)**. New feedback contract suite: 9 tests. Library lint passed with zero warnings. Production build and TypeScript passed; existing portfolio effect-cleanup warning remains.
- **62 production workshop browser tests passed** across Chromium desktop/mobile projects. Includes values/mode changes, retry and dismissal focus, light/dark axe checks, 320px layout, RTL fill alignment, dynamic reduced motion, and hidden-state regression. Older command tests were scoped to their demo after a second Save collection control made page-wide queries ambiguous.
- Packed offline React consumer SSR and TypeScript passed. New exports, refs, client boundaries, required labels, dismissal-label pairing and rejected conflicting value props are checked.
- Visually inspected desktop dark, 320px light, and forced-colors/reduced-motion captures: `.superpowers/library-review/feedback-desktop.png`, `feedback-mobile.png`, `feedback-forced-colors.png`.
- No runtime dependencies added. No publishing performed. Real assistive-technology testing and a cross-engine support matrix remain release prerequisites.

## Dialog and AlertDialog — 2026-09-15

- Added controlled native modal components; title/description associations, Escape/backdrop/native close requests, native top-layer inertness, reference-counted scroll ownership, explicit initial/final focus refs and Transition-based continuum presence.
- `/library#dialogs` provides edit collection and delete confirmation examples. Delete is a preview and initially focuses Keep collection. Alert backdrop clicks do not dismiss; ordinary dialog backdrop clicks do.
- Independent source review identified final-focus handling missing from native-close/unmount paths; corrected and unit-tested. Browser probes then reproduced native Tab escape into browser chrome and missing focus on exit reversal; explicit light-DOM boundary wrapping and renewed initial focus fixed both. Regression tests exercise the paths.
- **496 unit tests passed (41 files)**, including four dialog contract/lifecycle tests and existing Transition interruption coverage. Production build/typecheck and zero-warning library lint passed. Existing portfolio cleanup warning remains.
- **70 production workshop browser tests passed**, desktop and mobile. Dialog coverage includes native modal state, initial focus, Tab/Shift+Tab wrap, edit submit, Escape, distinct backdrop policy, alert confirmation, focus return, narrow light/dark axe checks, reduced motion and reopen-during-exit.
- Packed offline React consumer SSR and declarations passed with Dialog/AlertDialog imports, client boundary, closed SSR markup, ref types and rejected missing callback/description props.
- Visually inspected `.superpowers/library-review/dialog-desktop.png` and `dialog-mobile.png`. Additional browser probe expanded alert content and confirmed internal overflow with action buttons reachable in the viewport.
- Native dialog support required. Custom shadow-DOM focus adapters and real cross-engine/assistive-technology verification remain outside this alpha's current support evidence. No runtime dependency or publication added.

## Menu and Popover — 2026-09-15

- Added Menu/Popover and a shared Floating UI/native Popover API foundation: controlled/uncontrolled state, viewport flip/shift/size, auto-update, top-layer clipping escape, inherited themes and non-modal focus management. Menu supports arrow/Home/End/typeahead navigation, disabled actions and stable identities; Popover supports ordinary forms and Tab flow.
- `/library#floating` demonstrates menu-to-dialog rename/delete handoff and a draft/apply filter panel.
- Independent review found overwritten consumer handlers, loading keyboard activation and stale item indices after removal. New failing unit regressions reproduced the handler/list defects; all six floating unit tests now pass, including loading activation blocking and controlled ownership.
- **502 unit tests passed (42 files)**. Production build and TypeScript passed; library lint passed with zero warnings. Existing portfolio effect-cleanup warning remains.
- **76 production workshop browser tests passed** across Chromium desktop/mobile projects. New tests cover keyboard navigation, disabled skipping, typeahead, modal handoff and return, filter submission, Tab/outside dismissal, viewport-edge flipping, transformed/clipped ancestors, RTL, light/dark axe checks, 320px layout and reduced motion.
- Packed offline React consumer SSR/types passed with Menu/Popover exports, trigger ref types, controlled ownership and stable item identity checks. Explicit runtime dependency added: `@floating-ui/react` ^0.27.20. Root lockfile updated. Emitted-file size reports exclude transitive dependency bundle sizes.
- Settled visual captures inspected: `.superpowers/library-review/menu-desktop.png`, `popover-mobile.png`. Panels constrain their height to available space and scroll internally when needed.
- Native Popover API support required; nested floating surfaces and a broader cross-engine/assistive-technology support matrix remain future work. No publication performed.

## Lists and empty states — 2026-09-15

- Added List, ListItem, SectionHeader and EmptyState. Native ul/li structure, explicit list semantics, direct children, primary link/button action contracts, sibling secondary actions, heading levels, named non-announcing empty sections and optional shared stagger entrance.
- `/library#lists` composes search, favorites filtering, grouped rows, menus, illustrated detail tiles, create/rename/delete dialogs, new-collection empty details, no-results recovery and first-use recovery. Demo mutations stay local.
- Independent review found that renaming under an active search could remove the return-focus target. Desktop/mobile browser tests reproduced the failure; the save flow now chooses the search field when the row no longer matches. Stable sample identity and creation IDs remain application-owned.
- **507 unit tests passed (43 files)**, including five new list contract tests. Production build/TypeScript and zero-warning library lint passed. Existing portfolio cleanup warning remains.
- **84 production workshop browser tests passed** across Chromium desktop/mobile. New coverage includes independent row/menu activation, detail/rename/delete focus return, search recovery, favorites, empty-library creation, 320px light/dark axe checks, native list DOM, RTL overflow, reduced motion and 44px action targets.
- Packed offline React consumer SSR/declarations passed with list exports, ul/li refs, real link destinations and rejected invalid action/empty-state props.
- Visually inspected settled `.superpowers/library-review/lists-desktop.png`, `lists-mobile.png` and `lists-empty.png` captures.
- No dependency added in this slice. The existing Floating UI dependency supplies menus/popovers; list data, filtering and mutation state stay in the demo. Full screen-reader and cross-engine release validation remains pending.

## Release hardening — 2026-09-15

- Preserved the completed component catalog in checkpoint `496ff69`. This pass adds quality gates; it does not publish a package or claim mature-system/WCAG parity.
- Independent review reproduced native visibility defects: tile and app-bar display rules overrode `hidden`; PivotList had the same issue; selected PivotPanel discarded caller `hidden`/`inert`. New browser/unit regressions failed before the scoped fixes and pass afterward.
- Safari pointer-opened dialog examples now provide explicit `finalFocusRef` targets. Browser tests use actual keyboard activation for keyboard workflows, Option-Tab on macOS WebKit, native radio boundary behavior, and a no-overlay pointer-focus baseline for outside dismissal. The final pointer-baseline refinement also passed in all four projects. No production button focus policy was overridden. Firefox's 43.999998px geometry now uses a 0.01px tolerance around the 44px target.
- **508 unit tests passed (43 files)**. Production build, TypeScript, zero-warning library lint, packed offline consumer SSR/declaration verification and consumer bundle budgets passed. Root lint retains the pre-existing portfolio cleanup-ref warning at `components/metro/ProjectTransitionProvider.tsx:539`; JSDOM's unsupported-navigation messages remain in unit output.
- **177 production browser checks passed; 3 explicitly skipped**, using the exact `npm run test:library:cross-browser` command with its managed production server. Projects: Chromium desktop and Pixel 5 emulation (45 each), Firefox (44 passed/1 skipped), WebKit (43 passed/2 skipped). Tested locally on macOS with Playwright 1.62.1: Chromium 151.0.7922.34, Firefox 153.0 and WebKit 26.5. Linux GitHub Actions execution remains unverified until the workflow runs remotely.
- Skips: trusted native swipe injection requires Chromium CDP (Firefox/WebKit); WebKit does not emulate forced-colors. Existing pointer/keyboard navigation, layout, reduced-motion and theme checks still run in all projects. These skips do not stand in for device or high-contrast evidence.
- New hardening checks cover removal from layout/focus for hidden primitives, selected 320px form/feedback/list flows with actual text descendants doubled and expanded spacing, and checked state/visible focus under forced-colors in Chromium/Firefox. Review caught the first draft scaling only parents with fixed-size descendants; the final test targets the text and asserts computed-size doubling before overflow checks. This is targeted automation, not full-page zoom or screen-reader certification.
- Initial cross-engine run: 73 passed/11 failed. Failures included the platform assumptions above and one Firefox list-create dialog accessible-name timeout. That timeout did not reproduce in five consecutive isolated runs or the subsequent full matrices; no speculative component change or retry was added. Retain it as a known intermittent observation if it recurs.
- Added pinned dev-only esbuild 0.28.2 and actual consumer bundle measurement. React/React DOM remain external; transitive Floating UI is included only when used. Button: **1,156 gzip bytes**; selected fields: **1,644**; motion: **2,436**; Menu/Popover: **23,796**; all JS: **35,333**; full CSS: **5,692**. Raw/minified and gzip budgets plus a small-import Floating UI exclusion gate are enforced. Reports are distinct from earlier summed emitted-file measurements.
- CI now builds production output before running Chromium/mobile/Firefox/WebKit, checks bundle budgets, and uploads browser failure traces plus bundle evidence. Local managed production start/stop was exercised; the review preview remains on port 3101.
- [Support contract](library-support.md) records API conventions, platform requirements, reproduction commands, bundle methodology and explicit release gates: VoiceOver/NVDA, physical devices, complete zoom/high-contrast review, real consumer-app integration, naming/license and release policy. These are pending, not inferred passes.
