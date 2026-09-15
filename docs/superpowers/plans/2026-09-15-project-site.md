# Project Site Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for independent deliverables, with final integration review.

**Goal:** Deliver a project homepage, maintained searchable docs, practical runnable examples and a Windows Phone replica before publication.

**Architecture:** Existing Next.js app hosts separate project and legacy layouts. Nextra owns docs; the React package remains independent. Phone and examples consume public package exports.

**Tech Stack:** Next.js 15.5, React 19, Nextra 4.6.1, Pagefind, TypeScript, CSS modules, Playwright/Vitest.

**Spec:** `docs/superpowers/specs/2026-09-15-project-site-design.md`

## Global constraints

- Preserve `packages/react` public contracts and approved motion.
- No publication, fictional GitHub/npm destinations, redistributed proprietary assets or external-account dependencies.
- Use Windows Phone React as working identity; local tarball installation until launch.
- Existing feature branch/preview workspace; no main-branch work or destructive cleanup.
- Components and example data stay outside the package. CSS modules/scoped styles, responsive 320px layouts, reduced motion and descriptive native controls.

## Task 1: Platform and homepage

Files: `next.config.mjs`, root package/config, `app/(site)/**`, `app/(legacy)/**`, `components/site/**`, `mdx-components.tsx`, `scripts/index-docs.mjs`, `tests/e2e/project-site.spec.ts`.

- [x] Add browser assertions for homepage links, docs page headings and search results before implementation. The current `/docs` and `/phone` routes return 404.
- [x] Install Nextra theme, configure the MDX content gateway and Pagefind production indexing using official APIs.
- [x] Isolate legacy provider/styles and expose the project homepage at `/`; keep the workshop at `/library` and old portfolio at `/portfolio`.
- [x] Build the project shell, live tile hero, navigation, alpha installation section, example gallery links and metadata.
- [x] Verify static docs generation, copy/search, mobile shell and missing-document handling.

## Task 2: Phone replica

Files: `components/phone/**`, `tests/unit/Phone*.test.tsx`; integration route owned by Task 1.

Interface: export `PhoneDemo` from `components/phone/PhoneDemo.tsx`, self-contained React client component. Accept optional compact presentation only if useful; it must work with no required props.

- [x] Test navigation/back/message validation state transitions before adding app logic.
- [x] Build Start/app-list/People/Messages/Photos/Settings with library components and reusable SVG icon set.
- [x] Coordinate departure/arrival via real transition completion; maintain a bounded screen history and return focus.
- [x] Verify narrow viewport, keyboard controls, reduced motion, theme/accent changes and meaningful local interactions.

## Task 3: Docs content and previews

Files: `content/docs/**`, `components/docs/**` (content location may be adapted to Nextra configuration by root).

Interface: MDX imports shared client `ComponentPreview` from `@/components/docs/ComponentPreview`, using named preview cases. No root config edits.

- [x] Read package exports/source/README and build a complete catalog checklist.
- [x] Author introduction, installation, foundations, accessibility/support and composition docs.
- [x] Author API pages for every existing component family with real props/defaults/ref and keyboard contracts, concise copyable usage and live preview.
- [x] Build interactive preview cases using exported library components. Keep preview state local and add tests for nontrivial interactions.
- [x] Check internal links, MDX compilation and coverage of all exports with root integration.

## Task 4: Runnable examples

Files: `examples/**`, `components/examples/**`, unit tests if needed; `/examples` gallery route owned by Task 1.

Interfaces: export `SettingsExample` and `InboxExample` from `examples/shared/` for root gallery. Vite starter consumes the same package and reusable example source.

- [x] Define and test settings submission/reset and inbox read/compose state.
- [x] Implement polished functional examples using public library props/ref/state patterns.
- [x] Add runnable Vite React19 starter with private manifest, scoped CSS and README with exact build/run instructions.
- [x] Build/typecheck the example as a consumer and document how it differs from the Next.js workshop.

## Task 5: Integration and review

- [x] Run library unit/type/package gates, new site/phone/docs browser tests, and relevant existing workshop checks against production output.
- [x] Inspect desktop/mobile screenshots and fix visual issues, clipping, focus, hydration or console defects.
- [x] Review public-site accuracy, external links, docs/search coverage and README onboarding.
- [x] Record results/remaining manual release gates and leave the preview on port3101 with meaningful routes ready for user review.
