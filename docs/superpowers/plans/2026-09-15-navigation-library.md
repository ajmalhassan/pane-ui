# Navigation and Tile Sequence Implementation Plan

**Goal:** Execute the highest-priority library backlog: reusable Pivot, spatial Panorama, and coordinated TileSequence with workshop examples.
**Architecture:** Add separate modules to the existing React package. Keep the portfolio unchanged. Root integrates exports, CSS, package verification, docs and workshop; independent workers own component modules/tests.
**Spec:** `docs/component-roadmap.md`. The user approved navigation/motion direction and explicitly requested prioritization and execution.
**Constraints:** Node22.22.2, React19, no new runtime dependencies; native keyboard semantics, refs and event cancellation; SSR/StrictMode/reduced motion; no router imports; preserve all existing uncommitted work; no publish/push/merge.

## 1. Pivot and selection foundations
- [x] Implement `Pivot`, `PivotList`, `PivotTrigger`, `PivotPanel` in `packages/react/src/Pivot.tsx`, styles `pivot.css`, tests `LibraryPivot.test.tsx`.
- [x] Root props: `value?`, `defaultValue?`, `onValueChange?`, `activationMode?: 'automatic'|'manual'`, `orientation?: 'horizontal'|'vertical'`, `dir?: 'ltr'|'rtl'`, native div props. Triggers/panels use `value: string`; triggers native buttons/disabled/ref; list native div, requires accessible name from consumer.
- [x] Use stable instance IDs, one tab stop, linked tab/panel IDs, arrow/Home/End keys, disabled skipping, manual Enter/Space; controlled state remains owner-driven. Inactive panels hidden/inert but mounted to preserve local state. Dynamic removal/disable must leave usable roving focus. Nested instances independent; preserve consumer callbacks/preventDefault.
- [x] Tests first: multiple instances, keyboard orientation/RTL/disabled/manual/controlled selection, panel state retention, refs, dynamic items, SSR.

## 2. Spatial Panorama
- [x] Implement `Panorama.tsx`, `panorama.css`, internal motion module if needed; tests `LibraryPanorama.test.tsx`.
- [x] Data-driven API `items: readonly {id:string; label:string; children:ReactNode}[]`, `value?`, `defaultValue?`, `onValueChange?`, `duration?:number`, `dir?:'ltr'|'rtl'`, native div props except children. Expose phase `data-motion-state=idle|dragging|settling`. Default selected first item; arbitrary IDs, finite boundaries.
- [x] Large tab headings and content plane move coherently; active panel semantics separate from painted content. Use one continuous position for drag and interruption. Keep native vertical scroll/pinch zoom and links; accept horizontal intent after8px and1.2 ratio; commit22% width or24px+0.45px/ms, using recent100ms velocity.
- [x] Keyboard controls; scoped pointer capture after intent; cancellation, resize/unmount and reduced-motion changes settle cleanly. No global history interception. Empty/single/dynamic lists safe; controlled owner may reject selection, should settle to accepted value.
- [x] Tests first and actual browser drag/cancellation, native vertical scroll, interruption and multiple instance checks during integration.

## 3. TileSequence
- [x] Implement `TileSequence.tsx`, `tile-sequence.css`, tests `LibraryTileSequence.test.tsx`.
- [x] Data-driven API `items: readonly {id:string; content:ReactNode; size?:TileAppearance['size']}[]`, `show:boolean`, `selectedId?`, `duration?`, `interval?`, `direction?:'forward'|'backward'`, `onEntered?`, `onExited?`, native div props except children.
- [x] Component owns tile wrapper transforms, preserves inner press tilt. Four-column grid ratio wrappers. Exit ordering selected item last; capped delay240ms. Enter/reverse uses current frame. Initial show readable with no callback. Exiting all inert, hidden/unmounted after complete; callbacks after terminal DOM commit exactly once; empty/missing selected item safe; dynamic items cannot strand completion.
- [x] Tests first: selected-last order, interruption/cancel/stale callbacks, reduced motion, empty/dynamic items and retained native children/ref props.

## 4. Integration and prioritization
- [x] Replace roadmap with priority/dependency/status matrix plus release acceptance gates.
- [x] Add `NavigationWorkshop.tsx` + scoped CSS, integrate into existing workshop with Pivot, Panorama and tile→detail→return examples. Document owner-managed focus and return.
- [x] Add exports/CSS entry imports, update README and packed consumer smoke including navigation declarations and SSR.
- [x] Browser tests against production: tabs keyboard, swipes, sequence completion/focus, theme/320px/a11y regressions.
- [x] Independent review, meaningful fixes, full unit/type/lint/build/package checks; keep preview running.

References: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ ; https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
