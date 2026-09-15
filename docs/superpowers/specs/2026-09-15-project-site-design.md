# Project site, docs and example applications

The user requested a repository ready with examples, a landing page, an interactive Windows Phone replica and industry-standard documentation before a later GitHub/npm launch. This is an authorized local implementation pass. Publication, licensing and final package naming remain separate.

## Architecture

Keep `packages/react` framework-independent. Build the public site in the existing Next.js 15.5 application, using Nextra 4.6.1 and its maintained docs theme for MDX, sidebar/TOC, code highlighting/copy and Pagefind search. Nextra's current peer range supports Next >=14; latest Fumadocs UI requires Next16, so Nextra avoids a framework migration unrelated to the requested deliverable.

Create a project homepage at `/`, docs at `/docs`, example gallery at `/examples`, and replica at `/phone`. Preserve the existing workshop at `/library` and portfolio under `/portfolio` with its supporting routes. Separate project and legacy layouts/styles so portfolio navigation/motion providers do not run on docs pages.

## Product experience

- Homepage: restrained editorial Metro typography, black/white with blue accent, a working tile composition, clear Get started / Explore the phone actions, component categories, motion explanation, examples and local-alpha installation guidance. No invented npm command implying publication, GitHub stars or fake links.
- Docs: searchable maintained Nextra shell, introduction/install guide, themes/tokens, motion, accessibility/support, composition, API pages covering all existing exports with accurate defaults, native ref/state/event contracts, keyboard notes, real rendered previews and copyable code. Installation uses the real local tarball until publication. Docs derive facts from source/README, never guessed APIs.
- Replica: a deliberately convincing Windows Phone web recreation using actual library exports. Start screen with mixed tile sizes, layered tile departure/arrival, app list, People panorama, Messages conversation/compose, Photos selection/detail and Settings (accent/theme). Back and Windows controls have real destinations; keyboard focus returns to sensible targets. The user can explore without external accounts/network or a physical phone. Use original sample content, installed font fallbacks and CSS/SVG art. It is a web demo, not an operating system emulator.
- Examples: useful settings form and inbox/collection flow, a runnable plain React Vite starter consuming the built package, and the replica as a substantial showcase. App logic lives outside the package. Copyable source/README/run commands accompany examples.

## Quality

Retain approved Panorama fragments, layered group+tile animation, streaming progress dots and angular/circled SVG icon direction. Honor reduced motion and native controls. Test new navigation, docs search, preview interactions, phone journeys/back/focus/settings, responsive layouts, errors and package-consumer build. Verify production SSR/hydration and browser console, run existing unit and library browser gates as affected, inspect desktop/mobile screenshots. Add no automatic publication and make pending manual support checks visible.

## Implementation boundaries

Root work owns routing, docs platform/config, homepage, gallery integration, source routes, search indexing and integration tests. Independent work can own `components/phone/**`, MDX docs/previews, and example source applications without changing shared config. Repository identity remains Windows Phone React until the user supplies another name. Continue in the existing feature branch and preview workspace to preserve the user's active review context.
