# Component roadmap

The library's identity comes from tiles, typography, and transitions. Prioritize a complete interaction over a larger component count.

## Prioritized build backlog

Priorities follow dependency order. P0 protects every component; P1 establishes the library's Windows Phone identity; P2 makes it useful for everyday applications; P3 adds higher-complexity composition. Each row is an independently reviewable deliverable, not a promise to ship all variants at once.

| Priority | Components / deliverable                                                                 | Foundations required                                                                                      | Status / execution order                                                            |
| -------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| P0       | Theme, semantic color, spacing, typography and motion tokens                             | CSS scoping, contrast pairs, reduced motion, font fallbacks                                               | Theme/color foundation shipped; extend type/space/motion scales alongside consumers |
| P0       | Native interaction contracts                                                             | Ref/attribute forwarding, consumer event cancellation, disabled behavior, focus-visible                   | Shipped in Pressable/tiles; apply to all new controls                               |
| P0       | Selection and focus model                                                                | Controlled/uncontrolled ownership, stable IDs, ordered enabled items, roving focus, RTL/orientation       | Implemented and verified with Pivot                                                 |
| P0       | Motion lifecycle and gesture model                                                       | Cancellation, continuous position, committed completion callbacks, pointer intent/capture, resize cleanup | Transition lifecycle shipped; gesture foundation implemented with Panorama          |
| P0       | Validation harness                                                                       | Unit/SSR/type tests, packed consumer, browser geometry, axe and visual review                             | Shipped; extend for each slice                                                      |
| P1.1     | Pivot, PivotList, PivotTrigger, PivotPanel                                               | Selection/focus model, semantic tabs, typography tokens                                                   | Implemented: reusable section navigation                                            |
| P1.2     | Panorama                                                                                 | Pivot interaction principles, continuous gesture position, coordinated heading/content planes             | Implemented: spatial navigation, arbitrary panels                                   |
| P1.3     | TileSequence                                                                             | Tile geometry, transition lifecycle, keyed identities, selected-last ordering                             | Implemented: tile → detail → return                                                 |
| P1.4     | Router recipes                                                                           | Stable P1 APIs, route commit observation, history/source ownership, focus/scroll restoration              | Next after navigation APIs are reviewed; no router dependency in core               |
| P2.1     | Button, IconButton, AppBarLink and command overflow                                      | Pressable, native link/button distinction, icon slots, disabled/loading semantics                         | Implemented and integrated in the command workshop                                  |
| P2.2     | Field, Label, FieldDescription, FieldError, TextField, TextArea                          | Stable IDs, form ownership, error/description association, controlled input conventions                   | Implemented: fields and native text inputs                                          |
| P2.3     | Checkbox, RadioGroup, Switch                                                             | Field foundation, native checked state/form serialization, group keyboard behavior                        | Implemented: native selection controls                                              |
| P2.4     | Select, Slider                                                                           | Fields, keyboard bounds/options, native form values, touch orientation                                    | Implemented: native pickers and stepped range controls                                         |
| P2.5     | Progress, ProgressRing, MessageBanner                                                    | Value/status semantics, polite announcements, reduced motion                                              | Implemented: determinate/unknown progress and persistent messages                                                      |
| P3.1     | Dialog, AlertDialog                                                                      | Dismissal, focus scope/restore, native modal semantics, inert background, scroll ownership                | Implemented: native modal ownership, focus restoration and interruptible motion                                              |
| P3.2     | Menu, Popover, Tooltip                                                                   | Overlay layering, placement/collision, dismissal, trigger refs and focus return                           | Menu/Popover implemented; Tooltip and nested menus pending                      |
| P3.3     | List, ListItem, SectionHeader, EmptyState                                                | Typography/spacing, content slots, native links and selection conventions                                 | Implemented: grouped collection browser, native rows and recovery states                                            |
| P3.4     | Toast / notification queue                                                               | MessageBanner, dismissal/timing policy, live-region restraint, reduced motion                             | After persistent messages                                                           |
| P3.5     | Shared-element continuation                                                              | Explicit source/destination measurement, route readiness, interruption, scroll/clipping                   | Research/implementation after ordinary tile journeys are stable                     |
| Release  | Package identity/license, API freeze, support matrix, changelog/versioning, size budgets | All shipped component contracts verified in real consumers                                                | Before public npm publication                                                       |

## Foundation acceptance criteria

| Foundation         | Required behavior                                                                                                     | Evidence                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Tokens and theming | Nested themes, light/dark/system, separate accent surface/text colors, readable fallbacks                             | Palette contrast and multiple theme roots; add token documentation as scales stabilize |
| Semantics          | Real links/buttons/inputs, linked labels/descriptions, one owner of each interaction                                  | Keyboard and DOM accessibility tests; manual screen-reader review before launch        |
| Selection          | Owner controls state when supplied; defaults are internal; absent/disabled items cannot strand navigation             | Controlled/manual/dynamic/RTL tests and multiple instances                             |
| Focus              | One roving entry, visible focus, no accidental focus theft, caller-owned route focus restoration                      | Browser keyboard paths and detail return journeys                                      |
| Motion             | Readable initial SSR; interruption begins from displayed frame; no stale callbacks; reduced motion can change mid-run | Mocked lifecycle tests plus actual WAAPI/gesture checks                                |
| Layout             | Container-driven geometry, 320px support, long labels, no clipped controls                                            | Browser measurements, zoom/RTL/forced-colors follow-up matrix                          |
| Distribution       | No Next/Tailwind requirement, preserved client boundaries, explicit CSS, correct declarations                         | Packed package installed in clean React consumer and built Next workshop               |

## Current execution scope

P1.1–P1.3 are implemented and verified, including their P0 selection/gesture prerequisites. All three have interactive workshop examples. Keep P2/P3 as ordered subsequent slices; do not build an unreviewed catalog of thin wrappers in this pass.

## Available in this alpha

| Component             | Core contract                                                                 | What makes it Windows Phone inspired                             |
| --------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Theme                 | Scoped colors and fonts; independent light/dark/system roots                  | Dark/light canvases, a strong accent, typography-led hierarchy   |
| Tile / TileLink       | Static content or a real destination; native attributes and refs              | Square surfaces, lower captions, size ratios, contact-point tilt |
| RevealTile            | Stable accessible name, active-face description, controlled or internal state | A second face revealed through a restrained rotation             |
| LiveTile              | Quiet visual cycling, stable spoken summary, manual pause/next                | Content that changes without requiring navigation                |
| TileGrid              | Container-based units and explicit spans                                      | Small 1×1, wide 2×1, large 2×2, hero 4×2 rhythm                  |
| Pressable             | Native button with composed pointer handlers                                  | Surface leans at the point of contact                            |
| AppBar / AppBarAction | Composable native actions with visible labels                                 | Circular glyph frames and a consistent command baseline          |
| Transition            | Presence lifecycle, interruption, cancellation, completion                    | Turnstile, slide, depth, and fade movement                       |
| Stagger               | Keyed entrance wrappers, capped delay                                         | Related content arrives in a deliberate sequence                 |

The alpha also includes the four-piece Pivot tab family, Panorama, and TileSequence, detailed below. Router integration and shared-element continuation remain subsequent work.

## Implemented: navigation and coordinated motion

### Pivot

An accessible tab system for related views. Public pieces: Pivot, PivotList, PivotTrigger, PivotPanel. Controlled or internal selection; arbitrary stable IDs; multiple independent instances; arrow/Home/End navigation; disabled triggers; automatic/manual activation; text direction awareness. Visible headings use the library's large type without taking over the application's H1. Keep URL synchronization in the owner.

### Panorama

A spatial viewport with coordinated heading and content planes. Public API: one data-driven Panorama with `{ id, label, children }` items. It owns header/panel ordering together so their motion and identities cannot diverge. Reuse and generalize the existing portfolio's tested gesture thresholds, cancellation, finite boundaries, and interrupted movement. Preserve vertical scrolling, pinch zoom, native links, and direct URLs supplied by the owner. Nonselected panels are inert; visual presence and semantic selection are separate. Do not relabel simple tabs as Panorama.

### TileSequence

Coordinate a group of tile exits and entrances, with layered group and tile motion by default, plus explicit group-only and individual selected-tile-last modes with capped stagger. Preserve each tile's local press transform. Reversal must start from displayed frames. Expose completion and cancellation; do not intercept every document click. Validate with a tile → detail → tile example, browser history, and focus restoration.

### Future: shared-element continuation

A separate capability from the existing `continuum` preset. Requires explicit source/destination ownership, measurement, image readiness, clipping and scroll behavior, interruption, and a direct-load fallback. Do not promise it until both ends of a real navigation path are verified.

## Then: everyday controls

| Components                   | Required contract before visual variants                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| Button, IconButton           | Native button/link distinction, loading/disabled behavior, focus, submit ownership                        |
| TextField, TextArea          | Label, description/error association, native form/name/value/ref, controlled/uncontrolled usage           |
| Checkbox, RadioGroup, Switch | Native state and keyboard behavior, labels, disabled fields, form serialization                           |
| Select                       | Native select baseline before any custom popup; labels and keyboard navigation                            |
| Slider                       | Keyboard increments, bounds, form value, touch direction, accessible value text                           |
| Progress                     | Determinate/indeterminate semantics; no unnecessary announcements or endless motion under reduced motion  |
| Dialog                       | Focus containment/return, Escape, modal semantics, background inertness, nested overlays, native fallback |
| Menu and command overflow    | Arrow-key navigation, dismissal, touch, focus return, item semantics distinct from navigation links       |
| MessageBanner                | Status/error semantics, dismissal, no automatic interruption for ordinary information                     |

## Release sequence

1. Prove the current alpha's public API in real applications and complete manual accessibility review.
2. Validate the extracted Pivot/Panorama APIs in additional consumers; retain the original portfolio as a regression fixture.
3. Extend the implemented tile sequence journey with router integration recipes.
4. Add form and overlay controls in independently tested slices.
5. Finalize name/license/support policy, semver/changelog process, package size budgets, and release automation. Publish only after review.

## Detail checklist for every component

- Native semantics and a consistent, descriptive accessible name.
- Ref and ordinary HTML attribute forwarding; consumer event cancellation.
- Default, hover, pressed, focus-visible, disabled, selected, empty, and long-content states where applicable.
- Text wrapping, zoom, RTL, forced colors, coarse pointers, and narrow containers.
- Reduced motion at initial load and while interacting.
- Interruption, unmount, StrictMode, SSR/hydration, and multiple instances.
- Controlled and uncontrolled behavior documented without ambiguous ownership.
- Browser evidence from actual movement, not only still screenshots or mocked timelines.

## Everyday commands delivered

Button, IconButton, AppBarLink and AppBarOverflow are implemented. Their foundations are native form/link behavior, required icon labels, loading activation guards, scoped press feedback, and inline disclosure with focus restoration. Field, Label, FieldDescription, FieldError, TextField and TextArea are implemented. Checkbox, RadioGroup and Switch are implemented. Select and Slider are implemented. Progress, ProgressRing and MessageBanner are implemented. Dialog and AlertDialog are implemented. Menu and Popover are implemented with a shared Floating UI/native-popover foundation. List, ListItem, SectionHeader and EmptyState are implemented. Release-hardening now has a production cross-browser gate, consumer bundle budgets, native visibility regressions and an explicit [support contract](library-support.md). Next: manual assistive-technology/device validation, real consumer integration recipes, then a reviewed release candidate before expanding the catalog. Router integration recipes remain pending independently.
