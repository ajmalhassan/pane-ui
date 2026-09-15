# Windows Phone React Library Implementation Plan

**Goal:** Deliver an unpublished, consumable React library and an interactive component workshop, prioritizing tiles and transitions.

**Architecture:** `packages/react` contains framework-independent components, scoped CSS, and declarations. The existing Next application hosts `/library`, a working documentation and motion workshop. Existing portfolio routing remains an integration boundary rather than becoming a library dependency.

**Tech stack:** Existing React 19, TypeScript, CSS, Vitest, Playwright, Node 22.22.2. No new runtime dependencies.

**Spec:** `docs/library-direction.md`, approved by the user on 2026-09-15 with explicit direction to prioritize tiles and transitions and execute autonomously.

## Constraints and decisions

- Work in the user-selected repository on its existing `codex/lumia-portfolio` feature branch. Preserve pre-existing modified motion plans.
- Provisional package name: `@windows-phone/react`, version `0.1.0-alpha.0`, private until naming and license approval. No publish, push, or merge.
- Core package imports React only; no Next routing, Tailwind, application data, or root aliases.
- Light/dark/system themes are scoped; CSS import is explicit. Existing portfolio styles remain intact.
- Native links, buttons, focus, disabled behavior, and reduced motion are requirements, not optional variants.
- Existing source and tests are reference material and regression protection. Prioritize a coherent reusable alpha over a complete form-control catalog.

## Task 1: Package, themes, and tile family

Files: `packages/react/package.json`, `tsconfig.json`, `src/index.ts`, `src/styles.css`, `src/Theme.tsx`, `src/Pressable.tsx`, `src/Tile.tsx`, `src/TileGrid.tsx`, `src/AppBar.tsx`, internal hooks; `tests/unit/LibraryComponents.test.tsx`.

- [x] Write consumer tests for a real anchor, a non-submitting button, keyboard reveal, live cycle pausing/reduced motion, theme scoping, refs and disabled commands. Run them to observe missing behavior.
- [x] Implement native `Tile`, `TileLink`, `RevealTile`, `LiveTile`, `TileGrid`, `Pressable`, `Theme`, `AppBar`, `AppBarAction`. Reuse established motion math and timing where appropriate.
- [x] Public tile props: `label: ReactNode`, `size?: 'small'|'wide'|'large'|'hero'`, `accent?: 'accent'|'subtle'|'strong'`, `children`, native attributes and refs. TileLink accepts native anchor props; RevealTile accepts `front`, `back`, controlled/default `revealed` and `onRevealedChange`; LiveTile accepts `items`, `accessibleLabel`, `intervalMs`, `paused` and `defaultPaused` with change callback. TileGrid supports arbitrary direct layout children and does not rely on component identity.
- [x] Theme accepts `mode?: 'dark'|'light'|'system'`, `accent?: 'blue'|'violet'|'magenta'|'orange'|'green'`, native div props. AppBar composes children; AppBarAction is a native button with `icon`, `label` and button props.
- [x] Configure a build producing ESM and declarations with preserved client directives and CSS export. Run tests and typecheck.

## Task 2: Transition primitives

Files: `packages/react/src/Transition.tsx`, `packages/react/src/motion.css`, `tests/unit/LibraryTransition.test.tsx`.

- [x] Write tests for enter/exit lifecycle, reversal, reduced motion, unmount cleanup and hidden semantics.
- [x] Implement `Transition` with native div props, `show: boolean`, `preset?: 'turnstile'|'slide'|'continuum'|'fade'`, `direction?: 'forward'|'backward'`, `duration?: number`, `onEntered?`, `onExited?`, `children`. State machine exposes `data-state='entering|entered|exiting|exited'`.
- [x] Initial show renders readable content, changing show animates; exits retain visual content while inert and hidden from assistive technology; exited content is unmounted. Reversal begins from displayed position when Web Animations is available. Reduced motion changes cancel immediately. Missing animation APIs settle synchronously. No router coupling.
- [x] Add `Stagger` with div attributes, `show`, `interval?: number`, `children`, capped entrance delay and reduced-motion CSS. Do not mutate children; use wrappers with stable React keys.
- [x] Run lifecycle tests and inspect integration in the workshop.

## Task 3: Interactive workshop and consuming application

Files: `app/library/page.tsx`, `app/library/Workshop.tsx`, `app/library/library.module.css`; root build scripts and package config.

- [x] Build a typography-led, responsive workshop with theme/accent controls, tiles, live/reveal controls, AppBar and interactive transition stage. Import library source or built package through a package boundary, not duplicated primitives.
- [x] Provide replay, preset, direction, and reduced-motion explanation; demonstrate navigation between tile overview and detail using Transition.
- [x] Include installation/API examples and honest alpha status. No fake download counts or readiness claims.
- [x] Add package smoke verification: build, pack, inspect exports/CSS/declarations, server-render in clean plain React consumer and integrate built package in Next.

## Task 4: Review and release preparation

Files: README, `packages/react/README.md`, CONTRIBUTING, CI configuration, browser tests and verification report.

- [x] Run full unit, type, lint, application build and targeted browser tests. Review static screenshots and actual transitions in browser.
- [x] Independent review of package semantics and transition cancellation. Resolve material findings with regression tests.
- [x] Document shipped components, deferred components, commands, exact verification evidence and remaining pre-release decisions.


## Execution record

- The existing feature checkout was retained, as requested; original modified motion plans were preserved.
- Built the twelve-component alpha and workshop. Expanded the first slice to include reveal/live tiles and motion because the user's approval explicitly prioritized them.
- Used the workshop as the built-package Next consumer; the original portfolio remains a separate application rather than forcing its Next-specific routing into this alpha API.
- Component and transition workers implemented separate modules; independent review reproduced and resolved interrupted pivot discontinuity, empty stagger slots, small live-tile overflow, and stale focus after live controls unmount.
- Completion callbacks now observe committed terminal DOM state, supporting the workshop's exit/entry and focus sequencing.
- Package name and license remain unpublished release decisions. Public API, broader browser testing, and manual assistive-technology review remain alpha follow-up work, detailed in the roadmap.
- Final commands and results are recorded in `docs/library-verification.md`.
