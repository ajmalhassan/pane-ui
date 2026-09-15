# Project site verification — 15 September 2026

The local project now has a homepage (`/`), searchable Nextra 4 reference (`/docs`), examples gallery and two working applications (`/examples`), and an interactive Windows Phone recreation (`/phone`). The original workshop stays at `/library`; the portfolio is at `/portfolio`.

## Evidence

- 528 unit tests across 48 files pass, including phone navigation/history, recipient-based return focus, example validation and local send flows, and the Transition/Stagger exit regression.
- All 25 documentation pages prerender; Pagefind indexes exactly those 25 pages. The 20 preview cases cover every exported UI component family. A review checked all 44 UI component exports and typechecked the 23 TSX usage snippets.
- 36 new production browser checks pass across Chromium desktop/mobile, Firefox and WebKit: cross-root navigation, real search-result navigation, phone hubs/Back/app search, native form validation/save/reset, dialog compose/send, 320px layout, reduced motion, and unknown docs route 404.
- Existing library browser suite: 177 pass; 3 existing tool-specific skips. Approved Panorama and layered TileSequence behavior remains covered.
- Relocated portfolio smoke checks cover entry, query/history and Contact navigation.
- Production build, TypeScript, lint, packed consumer import/SSR/type checks, and all bundle budgets pass. Lint retains the existing cleanup-ref warning in `ProjectTransitionProvider`; the library lint contract remains separate.
- The independent Vite consumer installs, typechecks and builds. Its settings/inbox examples are the same source used by the site, not copies.
- Final locked root dependency audit reports zero vulnerabilities. Compatibility/security overrides are explained in `CONTRIBUTING.md`.
- Desktop/mobile screenshots were inspected for the homepage, docs, examples and phone. Browser inspection found no page runtime errors.

## Accessibility scope

The homepage and example form/dialog journeys run full Axe checks. Docs and gallery narrow-layout coverage runs WCAG 2 A/AA and WCAG 2.1 A/AA rules. Nextra 4.6.1 renders its breadcrumbs and pagination outside the `main` landmark, which triggers Axe's additional, non-WCAG `region` best-practice advisory; this remains an upstream integration limitation. Its optional Copy Page dropdown has no accessible name, so that control is disabled. Code-block copy controls remain available. Wide API tables are keyboard focusable.

These automated checks do not replace the manual screen-reader and real-device checks in `docs/library-support.md`. No accessibility certification is claimed.

## Release status

Everything remains a private local alpha. No GitHub push or npm publication was performed. Public package identity, license, manual support checks and release process still need the user's release review. Sample phone messages, photos and settings are local demonstration state, not a backend or operating-system emulator. All phone illustrations and icons are code-native assets.

## Living tile refinement

The reference recording shows horizontal-axis whole-tile turns and independently phased contact portraits. Shared decorative `FlipArtwork` now composes those two behaviors on the homepage and phone Start screen. Photos flips the full artwork/caption; People flips separate portrait cells, with still holds between turns. The enclosing action remains a single native link/button with a stable accessible name. This is demo presentation composition; the public package API and approved navigation transitions are unchanged.

A composition-level control pauses/resumes flips, hidden documents pause them, and reduced-motion preferences display a still front face. Tests cover independent timing, sampled browser transforms, pause persistence through phone navigation, and the reduced-motion fallback in Chromium, Firefox and WebKit.
