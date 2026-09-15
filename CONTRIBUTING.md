# Contributing

This repository is preparing an independent Windows Phone inspired React library for open-source release. The package is a local alpha; its public name and license must be finalized before publication.

## Development

Use Node 22.22.2 (`nvm use`), then:

```sh
npm ci
npm run dev
```

Open `/library` for the component workshop. The original portfolio remains at `/`. `predev` builds the library; after changing package source, run `npm run build:library` again so the workshop consumes the updated distribution.

## Where code belongs

- `packages/react/src`: framework-independent library, CSS, and types.
- `app/library`: interactive documentation and integration examples.
- `components/metro`: existing portfolio-specific components and routing integration.
- `tests/unit/Library*.test.tsx`: component and motion contracts.
- `tests/e2e/library*.spec.ts`: actual browser behavior and geometry.

Keep React as a peer dependency. Core components must not import Next.js, application content, or application path aliases. CSS must use component-scoped classes and themed variables, without a page-wide reset.

## Verify changes

```sh
npm run build:library
npm run typecheck
npm run lint
npm test
npm run test:package
npm run test:library:browser
npm run build
```

Install Chromium once with `npx playwright install chromium`. Package verification creates a temporary consumer and installs the packed tarball plus the repository's React versions from npm's cache. Run `npm ci` first to populate that cache.

For visual review, run a preview on port 3101 and `node scripts/capture-library.mjs`; screenshots go to ignored `.superpowers/library-review`. Set `ARTIFACT_BASE_URL` to capture another running server. The capture includes desktop, light, phone widths, and a paused midpoint from the actual browser animation.

## Component quality

Define native semantics and the public props before adding states. Test observable behavior: keyboard action, event cancellation, ref ownership, disabled behavior, hydration, and multiple instances. Use timers or animation mocks only where a browser facility is absent, and pair motion tests with browser checks.

A transition must support interruption, cancellation, unmount, reduced-motion changes, and a usable fallback. Completion callbacks must not fire from an obsolete run. Do not use a guessed timeout to coordinate navigation. Document where focus goes in composed flows.

Review text wrapping, 320px containers, light/dark themes, accents, RTL, large text, and forced colors. Automated accessibility checks complement visual and manual assistive-technology testing; they do not replace it.

## Changes and release

Keep pull requests focused and explain the behavior they change, with verification evidence. Update the component reference when public props or interaction contracts change. Do not publish automatically: alpha review, naming, licensing, and a support matrix remain release gates.
