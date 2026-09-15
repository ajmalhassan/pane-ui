# Foundation review — September 15, 2026

Scope: package boundary, theme/CSS ownership, native field and command contracts, and the new progress/message slice. This is a focused source review plus automated checks, not a certification of the entire library.

## Boundaries worth preserving

- `packages/react` declares React and React DOM peers, with no framework or form-validation runtime dependency. Application examples own submission, validation, demo state and focus destinations.
- Explicit ESM exports and a single CSS entry point separate package code from the Next workshop. A packed installation is exercised in an isolated React consumer, with SSR and declaration checks. Stateful modules retain client directives.
- Theme tokens live on theme subtrees. Native controls preserve HTML form behavior. Motion lifecycle behavior has separate tests for interruption, cancellation and reduced motion.
- The feedback slice adds a single private normalization function for both progress shapes, keeping accessible values and geometry consistent. It reuses existing dots and buttons. It introduces no task scheduler or global state.
- Banner tone and announcement urgency are independent. Dismissal and post-removal focus belong to the application; action controls are outside the live region.

## Defect found and corrected

Author display styles overrode native `hidden` on buttons and fields. A browser regression failed with a hidden button still displayed as flex. Explicit component selectors now preserve `hidden` for buttons, Field, Label, TextField/TextArea/Select and Slider. This illustrates why DOM-only tests are insufficient for a component library.

## Remaining release work

- Manual screen-reader interaction and live announcement testing, including VoiceOver and NVDA. Automated accessibility checks cannot establish announcement timing or usability.
- A declared browser support matrix and actual Firefox/WebKit runs. Current automated browser coverage is Chromium desktop and mobile emulation.
- Broader high-contrast, zoom, localization and RTL review across the full catalog. Feedback has narrow/RTL/reduced-motion checks; this is not a complete catalog audit.
- API stability, package name/license, versioning and release policy. The package remains a private alpha; no public release is implied by passing tests.

Verification results for this iteration are recorded in `library-verification.md`.

## Modal foundation follow-up

Dialog/AlertDialog reuse Transition instead of introducing another animation engine. Native showModal owns background inertness and top-layer placement; a reference-counted lock owns page overflow through exit completion. Browser testing showed that native modal focus alone permits a Tab boundary to reach browser chrome, so the component explicitly wraps ordinary light-DOM tab stops, including disabled/hidden filtering and radio-group ownership. Custom shadow-root widgets are a documented remaining focus-adapter requirement. Native-close/unmount restoration and reopen-during-exit focus were checked and corrected during this slice. See the verification log for the actual test matrix.

## Floating surfaces follow-up

Menu and Popover add an explicit `@floating-ui/react` dependency for positioning and established interaction primitives. Native manual popovers place the surfaces in the top layer without losing theme inheritance. The app lockfile resolves the dependency, and a packed offline consumer verifies that it is declared and installable. This is a deliberate dependency boundary; previous slices' statements about adding no runtime dependencies do not describe the whole package after this addition.

Review found overwritten consumer trigger handlers, loading triggers opening through arrows, and stale list indices after item removal. Regression tests reproduced and now cover the fixes. Browser checks exercise viewport-edge flipping, transformed/clipped ancestors, RTL, focus handoff from Menu into Dialog, and normal Popover Tab/outside-click dismissal. Native Popover API support is required, and nested floating surfaces are not yet supported.

## Collection composition follow-up

The list primitives retain native ul/li structure and separate the primary link/button from secondary controls. They add no selection state, virtualization, filter engine or dependency. Entrance motion reuses the existing stagger keyframes. The collection demo exercises the established Menu, Popover, Dialog, AlertDialog, Field and Tile APIs together. A real focus bug appeared when filtering removed a renamed row; a failing browser regression led to an explicit surviving return target. This integration evidence is useful, but does not replace the broader browser/assistive-technology release matrix above.

## Release-hardening follow-up

The [support contract](library-support.md) supersedes earlier cross-engine coverage limitations in this historical review. It records browser evidence, bundle costs and outstanding manual gates. Native hidden/inert forwarding regressions were corrected for tiles, app-bar primitives and selected Pivot panels. Dialog examples now use explicit return-focus refs for pointer-opened Safari flows. No legacy-browser, shadow-root or nested-overlay contract was added.
