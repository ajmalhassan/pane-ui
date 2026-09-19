# Alpha support and quality contract

`@pane-ui/react` is a public alpha. This document distinguishes intended contracts, automated evidence, and checks still required before a stable release. It does not certify WCAG conformance or parity with an established system.

## Intended platform

- React and React DOM 19, TypeScript, ESM. No CommonJS distribution or React 18 support is declared.
- Modern Chromium, Firefox and WebKit. The test matrix uses Playwright's pinned browser revisions, not every historical or branded browser release. Pixel emulation exercises Chromium at phone dimensions; it is not a physical Android or iOS test.
- Native `dialog.showModal()`, Popover API, `inert`, ResizeObserver, container queries and modern CSS are required. No legacy-browser polyfill layer is shipped. Motion uses Web Animations with a settled-state fallback when unavailable.
- Server rendering and hydration are supported; client directives survive packaging. Next.js is a workshop dependency, not a library dependency. Overlay visibility starts on the client.
- Light, dark and system modes; five accents; scoped theme variables; RTL layout and navigation; runtime reduced-motion changes. Application prose, dates, sorting and locale formatting remain application-owned.

## Public API conventions

| Concern | Contract |
| --- | --- |
| Native semantics | Buttons are buttons, destinations are anchors, fields are native inputs, lists retain ul/li. Native attributes, form ownership and supported events are forwarded. State-critical ARIA attributes are component-owned. |
| Refs | A ref points to the documented native root/control. Menu/Popover refs target their trigger; Checkbox/Switch refs target the input; RadioGroup targets the fieldset; ListItem targets the li. |
| State | Controlled values are owned by the application. Defaults initialize uncontrolled state. Do not switch a mounted component between these modes. Dialog is controlled only. |
| Events | Consumer handlers run before internal behavior; cancellation is supported where documented. Callbacks request a state change; they do not perform application navigation or network mutation. |
| Forms | Native browser constraint validation is the default. There is no required form-validation library. Consumers can use a form library through native props and refs; no third-party adapter is certified yet. |
| Visibility | `hidden` removes layout and interaction. Inactive PivotPanel additionally enforces hidden/inert; caller restrictions on an active panel remain intact. |
| Styling | Import `@pane-ui/react/styles.css` once and wrap a subtree in Theme. No global reset. Consumer className and style are extension points. |
| Motion | Reduced motion, interruption, reversal, unmount and stale-completion prevention are contractual. Visual regression review still matters for timing and spatial character. |

Some native behavior differs by platform. Safari does not normally focus clicked buttons. Supply Dialog `finalFocusRef` when a pointer-opened dialog must return to a particular trigger. The fallback returns to the previously focused element, which may not be the clicked trigger. If deleting a row removes its trigger, select a surviving destination. Safari radio arrow navigation stops at the last enabled option; Chromium/Firefox wrap. We retain native radio behavior rather than substitute a custom keyboard model.

The macOS WebKit tests use Option-Tab for full keyboard traversal; no system preference is changed. Linux CI uses Tab. Sources: [MDN button focus](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button#clicking_and_focus), [Playwright keyboard tests](https://github.com/microsoft/playwright/blob/main/tests/page/page-focus.spec.ts).

## Automated checks

Run from the repository root with Node 22.22.2:

```sh
npm ci
npm run build
npm run typecheck
npm run lint:library
npm test
npm run test:package
npm run test:bundle
npx playwright install --with-deps chromium firefox webkit
npm run test:library:cross-browser
```

The cross-browser command starts the already-built production app on port 3100 and stops it after the run. To use an existing preview, set `ARTIFACT_BASE_URL=http://127.0.0.1:3101`. Do not run a managed development server against the same `.next` directory as a production preview. The original Chromium-only development browser command remains available.

The matrix covers keyboard interaction, focus return, menu/dialog composition, motion interruption, native form submission/reset, RTL, theme contrast via axe, 320px layouts and selected doubled-text/spacing flows. Forced-colors checks cover checkbox state and focus in Chromium/Firefox. Native swipe injection is Chromium-only because Playwright CDP is Chromium-only; the other two projects report that test as skipped. WebKit forced-colors is also explicitly skipped. These skips are coverage gaps, not passes.

The text test applies 200% font size plus increased line/letter/word spacing to selected form, feedback and list content. It does not establish full-page text-resize or zoom conformance. Axe and DOM focus checks cannot validate spoken announcements, screen-reader reading order, braille output, or all visual clipping.

See [verification history](library-verification.md) for exact results and known intermittent failures. CI uploads failure traces and bundle measurements. CI configuration must run successfully on GitHub before its Linux matrix is considered verified.

## Bundle budgets

`npm run test:bundle` bundles retained consumer exports using pinned esbuild, minification, tree shaking, production mode and an ES2022 target. React/React DOM are external; Floating UI and its runtime dependencies are included when used. CSS is measured separately. Reports go to `quality-results/library-bundles.json`.

| Consumer import | Minified bytes | Gzip bytes | Gzip budget |
| --- | ---: | ---: | ---: |
| Button | 2,908 | 1,156 | 1,300 |
| Field, TextField, Checkbox, Select | 4,690 | 1,644 | 1,850 |
| Transition, Stagger, TileSequence | 6,154 | 2,436 | 2,750 |
| Menu, Popover | 65,416 | 23,796 | 26,500 |
| All JavaScript exports | 102,555 | 35,333 | 39,000 |
| Complete stylesheet | 25,940 | 5,692 | 6,400 |
| Standalone motion stylesheet | 711 | 341 | 400 |

Baseline: esbuild 0.28.2 on Node 22.22.2. Budgets allow roughly 10–15% headroom and also cap raw minified bytes in `scripts/library-budgets.json`. The gate rejects Floating UI appearing in Button/field/motion output. Review unexpected growth before adjusting budgets. The full stylesheet already includes motion; do not add those CSS numbers together. These are reproducible library import costs, not a competitor comparison, app payload, React cost or Brotli transfer measurement.

## Manual release gates — not yet completed

- VoiceOver with Safari/macOS and iOS: names, states, reading order, rotor navigation, live feedback, native select/radio behavior, dialog containment and return focus.
- NVDA with Firefox and Chrome on Windows: browse/focus modes, form errors, disabled states, dynamic menus and dialogs, update announcements.
- Physical iOS Safari and Android Chrome: horizontal Panorama swipe versus vertical scrolling, touch cancellation, rotation, onscreen keyboard, overlay placement and scroll locking.
- Browser zoom to 200%/400%, operating-system text scaling, Windows high-contrast themes, long translated labels and mixed-direction content. Include overlays and dense tiles, not only the form examples.
- Package installation in a fresh Vite app and a Next.js App Router app, including production SSR/hydration and realistic third-party form integration.
- Final project/package name, license and third-party notices, repository ownership, security/contact policy, changelog and versioning policy, release/publishing credentials and a maintainer-reviewed release candidate.

Nested menus/floating surfaces, shadow-root focus management, virtualization, date/time pickers, complex comboboxes and localization adapters are not currently promised. Establish those contracts separately before adding them.

## Benchmark

Use [Radix accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility) and [React Aria quality](https://react-aria.adobe.com/quality) as references for keyboard, focus and assistive-technology rigor. Matching their maturity requires independent accessibility review, real-device evidence, stable APIs and ongoing maintenance; a component count or green test suite alone cannot establish it.


### Shared-perspective tile motion (2026-09-16)

TileSequence's default layered mode now uses the approved recording study: independently delayed planes with a common grid-edge camera, −88° forward turn, proportional leftward travel, 220ms duration and 33ms stagger. Group-only and individual modes retain their previous behavior. No additional runtime dependency was introduced. A backward return retraces the forward departure through the same edge with reversed easing and stagger.

Verified: production build and library lint; all 529 unit tests (48 files); 38 navigation/phone browser checks across Chromium, mobile Chromium, Firefox and WebKit. Two existing native-touch injection checks are skipped outside Chromium. Unit and browser regression coverage includes shared camera coordinates, reverse-order departure, interruption, completion, focus return and reduced motion.

Visual limitation: Playwright WebKit computes the same projected rectangles as Chromium but paints some perspective edges differently. Direct per-plane projection improves on the ancestor-perspective study. Static matrices, origin baking, matrix normalization, removing nested 3D contexts and changing backface handling did not establish full visual parity. No browser-specific compensation was added: it would risk distorting rendering on Safari versions not tested here. Navigation and accessibility checks pass; exact cross-engine visual parity remains open. Review the local isolated study under `experiments/transition-study` for the reference and comparison controls.
