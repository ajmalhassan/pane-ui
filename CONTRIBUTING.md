# Contributing

This repository is preparing an independent Windows Phone inspired React library for open-source release. The package is a local alpha; npm scope ownership and the license must be finalized before publication.

## Development

Use Node 22.22.2 (`nvm use`), then:

```sh
npm ci
npm run dev
```

Open `/` for the project homepage, `/docs` for the reference, `/examples` for the gallery, `/phone` for the interactive recreation, and `/library` for the detailed workshop. The original portfolio lives at `/portfolio`; its supporting blog, project and resume routes remain available. `predev` builds the library; after changing package source, run `npm run build:library` again so consumers use the updated distribution.

Nextra 4 renders `content/docs` through the documentation route group. `npm run build` builds the library and Next.js site, then runs `scripts/index-docs.mjs` through `postbuild`. Pagefind indexes only generated docs HTML into ignored `public/_pagefind/`; it excludes legacy portfolio pages. Development does not rebuild this index. Verify search against a fresh production build, and rebuild after docs edits to refresh its results.

For the standalone React consumer, follow [examples/vite/README.md](examples/vite/README.md). Its settings and inbox components share source with the gallery. The starter uses a local package dependency, not a public registry package.

## Where code belongs

- `packages/react/src`: framework-independent library, CSS, and types.
- `app/(site)` and `components/site`: project homepage, gallery, example routes and site presentation.
- `app/(documentation)`, `content/docs`, `components/docs` and `mdx-components.tsx`: Nextra routing, MDX reference and interactive previews.
- `components/phone`: phone recreation, application state and screen content.
- `examples/shared`: settings and inbox applications consumed by both the gallery and Vite starter.
- `examples/vite`: independent React consumer, its own manifest and lockfile.
- `app/(legacy)/library`: detailed component and motion workshop.
- `app/(legacy)`: portfolio and supporting routes.
- `components/metro`: existing portfolio-specific components and routing integration.
- `tests/unit/Library*.test.tsx`: component and motion contracts.
- `tests/e2e/library*.spec.ts`: actual browser behavior and geometry.
- `tests/unit/Phone*.test.tsx`, `Example*.test.tsx` and `Docs*.test.tsx`: application and preview interaction contracts.
- `tests/e2e/project-site.spec.ts` and `phone.spec.ts`: site navigation, production search and phone journeys.

Keep React as a peer dependency. Core components must not import Next.js, application content, or application path aliases. CSS must use component-scoped classes and themed variables, without a page-wide reset.

## Verify changes

```sh
npm run build:library
npm run typecheck
npm run lint
npm run lint:library
npm test
npm run test:package
npm run build
npm run test:bundle
npm run test:library:cross-browser
LIBRARY_PRODUCTION=1 npm run test:site:browser
npm --prefix examples/vite ci
npm --prefix examples/vite run build
```

Install the pinned browser engines with `npx playwright install --with-deps chromium firefox webkit`. The cross-browser command and the site command with `LIBRARY_PRODUCTION=1` run the already-built production app on port 3100, then shut it down. Set `ARTIFACT_BASE_URL` to reuse a running production preview. Do not start development and production servers against the same `.next` directory: the development server rewrites files needed by the production preview. Package verification creates a temporary consumer and installs the packed tarball plus the repository's React versions from npm's cache. Run `npm ci` first to populate that cache.

For visual review, run a preview on port 3101 and `node scripts/capture-library.mjs`; screenshots go to ignored `.superpowers/library-review`. Set `ARTIFACT_BASE_URL` to capture another running server. The capture includes desktop, light, phone widths, and a paused midpoint from the actual browser animation.

See the [support and quality contract](docs/library-support.md) for platform assumptions, explicit automation gaps and manual release gates. Bundle budgets include runtime dependencies, with React externalized; reports go to `quality-results/library-bundles.json`. Inspect growth before changing `scripts/library-budgets.json`.

## Component quality

Define native semantics and the public props before adding states. Test observable behavior: keyboard action, event cancellation, ref ownership, disabled behavior, hydration, and multiple instances. Use timers or animation mocks only where a browser facility is absent, and pair motion tests with browser checks.

A transition must support interruption, cancellation, unmount, reduced-motion changes, and a usable fallback. Completion callbacks must not fire from an obsolete run. Do not use a guessed timeout to coordinate navigation. Document where focus goes in composed flows.

Review text wrapping, 320px containers, light/dark themes, accents, RTL, large text, and forced colors. Automated accessibility checks complement visual and manual assistive-technology testing; they do not replace it.

## Changes and release

For local distribution, run `npm run build:library` and `npm pack ./packages/react` from the root. Install the resulting `.tgz` by its actual path in a separate React 19 consumer. `npm pack` creates a local archive; neither this workflow nor the Vite starter publishes a registry package.

Keep pull requests focused and explain the behavior they change, with verification evidence. Update the component reference when public props or interaction contracts change. Do not publish automatically: alpha review, naming, licensing, and a support matrix remain release gates.

## Dependency compatibility

Nextra 4.6.1 is pinned with Zod 4.3.6: its Layout removes `children` before validation, which fails under Zod 4.4's stricter missing-key behavior ([upstream issue](https://github.com/shuding/nextra/issues/5036)). Remove the scoped overrides once a released Nextra fix passes production rendering and search checks. The docs framework stays outside the published component package.

Compatible PostCSS, XML parser and brace-expansion patch overrides close transitive advisories without upgrading the application's Next.js major version. Recheck these with `npm audit` when refreshing dependencies; keep the lockfile committed. Nextra's prefixed stylesheet and the CSS nesting plugin let its styles coexist with the legacy workshop's Tailwind 3 pipeline.
