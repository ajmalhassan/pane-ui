# Windows Phone React library — proposed direction

Status: direction approved on 2026-09-15. The user prioritized tiles and transitions and authorized autonomous implementation. This source audit records the starting point; see `library-verification.md` for implementation evidence and `component-roadmap.md` for the remaining release work.

## Product

A React component library that carries Windows Phone's typography, spatial navigation, bold color, and responsive motion into contemporary web applications. Components must work independently, in ordinary pages and desktop layouts as well as phone-sized experiences.

The defining qualities are typography-led hierarchy, square geometry, disciplined spacing, content-bearing tiles, circular app-bar commands, and motion that explains interaction. Historical fidelity is a design reference; accessible web semantics and reliable browser behavior are product requirements.

## Approaches considered

1. **Extract and refine the existing components — recommended.** Keep the portfolio as an integration example, create a separate consumable package, and move components across only after their contracts are established. Reuses existing motion work and regression coverage; requires removing application assumptions carefully.
2. **Build a new library beside the portfolio.** Clean API freedom, but duplicates behavior and creates two implementations to maintain before the new one proves itself.
3. **Release the current components with minimal changes.** Fastest initial packaging, but exports Next.js and portfolio assumptions as public API. Does not meet the intended quality bar.

## What the repository already provides

| Evidence                                                                                               | Implication                                                                          |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `components/metro/index.ts` exports tiles, grid, panorama, app bar, icons, pressable, and live cycling | A substantial extraction seed already exists                                         |
| `MetroTile.tsx` and `PanoramaNav.tsx` import `next/link`                                               | Core navigation is currently framework-dependent                                     |
| `Panorama.tsx` and `PanoramaNav.tsx` import `lib/content/pivots`                                       | Navigation identities and panel structure are application-specific                   |
| `ProjectTransitionProvider.tsx` uses Next routing and project-specific DOM queries                     | Route choreography belongs in the example until a general adapter contract is proven |
| `app/globals.css` owns tokens and shared animation definitions                                         | Importing component files alone does not provide their complete styling dependencies |
| `TileGrid.tsx` identifies direct children by component identity                                        | Composition with fragments and wrapped components needs an explicit public contract  |
| `StatusBar.tsx` renders a fixed `12:00`                                                                | This is currently decorative example chrome, not a general status component          |
| Unit, accessibility, browser, and motion test files exist                                              | Useful regression coverage is available; it has not been run for this audit          |
| Root package is named `ajmalhassan.com` and marked private                                             | Package identity, exports, build, and release workflow remain to be designed         |

Two motion plan files were already modified before this work. Those edits are outside this draft.

## Proposed package boundary

Start with one public React package containing components, types, and explicit CSS entry points. Keep tokens and motion internally organized without prematurely publishing multiple interdependent packages. React and React DOM are peer dependencies; Next.js and Tailwind must not be required by consumers.

Keep the current application as the first integration consumer. Add a plain React fixture to demonstrate that the built package works outside Next.js. Validate installation from a packed artifact rather than relying only on workspace source imports.

Public components expose native attributes, refs, class names, and documented styling hooks where appropriate. Links retain real destinations; routing adapters are optional. Define controlled and uncontrolled state, event cancellation, disabled behavior, and focus ownership before freezing each API. Do not publish portfolio-specific names, query parameters, selectors, or route restoration state.

Scope theme variables to a theme root with light, dark, and system modes. Support separate themed subtrees. Ship styles explicitly, preserve their side effects during bundling, and avoid an implicit global reset. Provide readable fallbacks without bundling proprietary font files.

## First milestone: prove the library boundary

Deliver tokens and themes, Pressable, static and navigation Tile variants, TileGrid, and AppBar as a small working package. Establish icon composition without requiring consumers to bundle a large fixed icon set. Demonstrate installation, styling, native form behavior, keyboard use, and React/Next integration.

The first milestone is complete when the existing example uses these extracted components and a separate React consumer renders the packed package with working styles and types. Public naming is provisional until the direction is approved.

## Following milestones

1. Signature interactions: live and reveal tiles, distinct Pivot and Panorama contracts, motion presets, interruption handling, and optional route integration. Preserve the existing application behavior while validating arbitrary panel IDs and multiple instances.
2. Everyday application controls: Button, TextField, TextArea, Checkbox, RadioGroup, Switch, Select, Slider, Progress, and Dialog. Define form, validation, labeling, and keyboard contracts before adding visual variants. These are separate implementation slices, not a single first-release promise.
3. Open-source launch: component documentation, interactive state examples, installation and migration guides, contributor setup, license selection, changelog and versioning workflow, support policy, and automated package verification.

## Acceptance criteria

| Area               | Required evidence                                                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visual language    | Reviewed type scale, spacing, glyph alignment, borders, tile geometry, and light/dark/accent states; deliberate desktop layouts                                                       |
| Interaction        | Relevant default, hover, pressed, focus-visible, disabled, loading, selected, invalid, and empty states documented and demonstrated                                                   |
| Accessibility      | Native semantics; complete keyboard paths; visible, unclipped focus; measured text/control contrast; manual screen-reader checks alongside automated checks                           |
| Motion             | Touch, mouse, pen, rapid repeats, cancellation, unmount, and preference changes behave predictably; reduced motion removes spatial movement without removing functionality            |
| Content resilience | Long labels, large text, localization, RTL, missing media, and narrow containers do not make controls unusable                                                                        |
| Composition        | Multiple independent instances, custom content, consumer handlers, refs, and supported wrapper patterns work without hidden application dependencies                                  |
| Rendering          | Server rendering and hydration work; importing the package does not require browser globals; client boundaries survive the package build                                              |
| CSS                | Installation includes required styles and keyframes; scoped themes coexist; no accidental page-wide resets or application selectors                                                   |
| Performance        | Measure built JS/CSS size and interaction traces; verify tree shaking, cleanup, and no unnecessary animation in hidden documents; set numerical budgets from the first measured slice |
| Distribution       | Packed artifact installs into clean React and Next fixtures; exports, declarations, CSS, peer ranges, and published files are verified                                                |
| Documentation      | Every shipped component includes a working example, API reference, state coverage, keyboard behavior, accessibility notes, and customization guidance                                 |

Do not label a component release-ready based only on screenshots or passing unit tests. Record the browsers and assistive technologies actually tested. Define the supported version matrix before release rather than implying universal support.

## Decisions to confirm

The main product decision is whether this should be a faithful Windows Phone revival or an interpretation optimized for modern applications. Recommendation: preserve the recognizable visual and motion language while allowing responsive layouts, accessible interaction patterns, and ordinary React composition.

The package name, license, supported React/browser matrix, and final release inventory remain launch decisions. They do not prevent source auditing or approving the first extraction milestone, but must be resolved before publication.
