# Lumia Motion System — First Complete Interaction

## Intent and authorization

The user wants the spatial confidence and responsiveness of Windows Phone, including 3D transitions, coordinated panorama movement, and meaningful return navigation. On 2026-09-11 the user accepted the proposed CSS/JavaScript direction and requested a plan and delegation. This document makes that first implementation concrete. It supersedes the Phase 2 deferral of these motion capabilities, while retaining its content, accessibility, and layout requirements.

## Scope

Deliver a working panorama across the four existing sections, plus a complete Projects → project detail → Projects interaction. This is a repo-local motion system built on real HTML. No Canvas, Three.js, new animation dependency, font replacement, content rewrite, public package, or full-site redesign is included. Shared-element tile expansion is a separate potential extension; this milestone uses turnstile exit/entry, not a simulated expanding screenshot.

## Global constraints

- Node `>=22.22.2 <23`; use installed Node `22.22.2` for verification.
- Preserve Next `15.5.24`, React `19.2.8`, and existing dependency versions.
- No new runtime dependencies, Canvas, Three.js, or experimental Next transition APIs.
- Keep real anchor destinations, server-rendered content, metadata, direct URLs, modified clicks, and no-JavaScript navigation.
- Preserve native vertical scrolling and pinch zoom; scope `touch-action: pan-y pinch-zoom` only to the panorama gesture surface.
- Reduced motion removes spatial animation immediately, including when the preference changes during movement.
- Keep one accessible active panel and one accessible page H1; outgoing visual panels are inert and aria-hidden.
- Do not transform the whole page shell or the fixed app bar/contact overlay.
- Preserve approved content, tile geometry, existing font stack, and contact fragment/history behaviour.
- Keep existing user files and unrelated changes untouched. Do not push, merge, or publish.

## Panorama behaviour

Use one continuous position for the content plane, heading movement, and background movement. React owns semantic selection and lifecycle phases; frame-by-frame progress lives in refs and DOM styles. Expose `data-motion-state="idle|dragging|settling"` on `[data-panorama]` for inspection and tests.

Pointer down alone does not navigate. Accept a drag after at least 8px of predominantly horizontal movement (`abs(dx) > abs(dy) * 1.2`). Reject vertical intent for the rest of that gesture, preserving native scrolling. Ignore nonprimary pointers, editable controls, and modified mouse presses. Capture only after horizontal intent. A swipe commits one adjacent section at 22% of the surface width, or at 0.45px/ms in the last measured movement window with at least 24px displacement. Otherwise settle back. Suppress only the trailing click from an accepted drag; cancellation never activates a tile.

Gesture boundaries are finite in this first milestone: Me and Photography resist outward dragging and settle to their boundary. Existing cyclic arrow-key/header navigation remains available. Nonadjacent tab selections travel in canonical section order. No cloned panels, duplicated IDs, or fake accessible headings.

At rest, retain the current selected-first heading arrangement and inactive panel collapse. During motion, keep outgoing and relevant incoming panels painted, using their real DOM. Preserve enough height for the participating content, then release the temporary height when settled. Separate painted presence from interaction: only the selected panel is accessible and interactive.

Start tuning from 420ms settling, a decelerating curve, and background displacement equivalent to 10vw per section. Heading movement must be visibly related to content movement and settle without a reorder jump; measure real heading geometry where necessary. Existing tile press/live behaviour remains. Avoid applying competing transforms to the same element.

Interruption must begin from the current displayed position. Each animation run owns a generation token; cancelled completion callbacks cannot restore old state. Handle pointer cancellation/lost capture, viewport resize, unmount, and reduced-motion changes. A committed swipe changes the canonical URL exactly once; cancelled drags add no history. Tabs and browser Back/Forward stay synchronized with the rendered selection. Preserve Next's history internals; do not invent private history markers.

## Project turnstile behaviour

A persistent client coordinator inside the existing server root layout orchestrates project navigation. Opt in only project tiles and the Projects command on project detail. Preserve other navigation and all server route files.

Exit: rotate project tile surfaces away around their left edge with opacity, a 220ms base duration, 20ms stagger capped at 100ms, and the selected tile leaving last. Entry: rotate/translate the project reading column into view over 260ms. Use a separate wrapper or composable motion channel so press tilt cannot overwrite route motion. Keep the fixed commands stationary. These are starting values for visual verification, not claims of historical frame accuracy.

The coordinator states are `idle → exiting → navigating → entering → idle`, exposed as `data-project-motion`. Use Web Animations API for timelines; missing APIs fall back to immediate usable navigation. Observe pathname commits rather than treating `router.push()` as a Promise. Cancel animations and timers on interruption/unmount. A route taking more than 1500ms after exit restores visible outgoing content while waiting; it must never leave a blank or inert page indefinitely.

Capture the actual origin URL, selected project href, and scroll position. An opted-in project back command traverses to a known immediate origin; a direct-entry detail falls back to its real `/?view=projects` link. Browser Back/Forward may trigger an entrance after navigation; do not block or undo native traversal. Restore the source scroll and tile focus on return after panorama layout is stable. Normal opening focuses the detail H1 without an additional scroll jump. Direct loads/reloads require no source snapshot and are readable immediately.

Immediate-origin eligibility is distinct from a restoration snapshot. Establish it only after the coordinator's own push commits without intervening navigation; invalidate it on native traversal, unrelated navigation, query/hash change, or reload. Preserve the snapshot for focus restoration after native Back. On app-command return, animate the project reading column out, then Projects tiles in; native Back skips outgoing exit and may animate only the arriving surface. Restore scroll before the return entrance and focus after settlement.

Use a project-only `data-project-reading` marker on the existing detail column. Keep direct MetroTile children of TileGrid. Next Link's navigation event supplies no source element: the optional callback receives the anchor via its own ref as a separate argument. Observe query/hash changes for cancellation without adding an unsuspended root `useSearchParams` dependency; unrelated ordinary links must remain native to their existing navigation system.

## Validation and visual judgement

Run targeted controller/component tests before the full gates. Browser assertions must wait for motion state and actual completion, not guessed sleeps. Prove an interrupted transition, accepted/cancelled drag, drag beginning on a link, native vertical scrolling, finite edges, URL history, project opening/return, reduced motion, and direct routes.

Inspect still and mid-transition frames at 320×568, 393×851, 1440×900, and 1920×1080. The success criterion is coordinated, readable movement with no blank panel gap, abrupt heading replacement, stale route, clipped focus ring, or moving app bar. Static screenshots with animations disabled are not evidence of motion quality. Record browser/runtime and any verification limitations honestly.

## Technical references

- [CSS 3D transforms](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-style)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API)
- [Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
- [Next 15 Link and onNavigate](https://nextjs.org/docs/15/app/api-reference/components/link)
- [Next 15 router events](https://nextjs.org/docs/15/app/api-reference/functions/use-router#router-events)
