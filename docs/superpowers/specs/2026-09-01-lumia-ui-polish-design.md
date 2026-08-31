# Lumia Portfolio Phase 2 UI Polish Design

## Purpose

Phase 2 turns the portfolio from a Metro-influenced website into a coherent Lumia application. It rebuilds the visible system around Windows Phone 8's actual design principles: fierce reduction, celebrated typography, content over chrome, authentic digital form, disciplined grids, and selective liveliness.

The result must remain useful to hiring managers first. Nostalgia supplies the interaction language; it must not obscure Ajmal's professional evidence.

## Approved Direction

The approved visual direction is **a Lumia application containing a portfolio**, not a conventional portfolio decorated with cyan tiles.

Reference principles:

- [Microsoft: From Transportation to Pixels](https://blogs.windows.com/windowsdeveloper/2011/02/17/from-transportation-to-pixels/)
- [Microsoft Learn: Design Your Windows Phone Apps to Sell](https://learn.microsoft.com/en-us/archive/msdn-magazine/2012/january/windows-phone-design-your-windows-phone-apps-to-sell)
- [Microsoft: The story behind the Windows Phone 8 Start screen](https://blogs.windows.com/windowsexperience/2012/11/02/the-story-behind-the-windows-phone-8-start-screen/)
- [Microsoft Learn: Windows Phone application bar](https://learn.microsoft.com/en-us/archive/msdn-magazine/2010/october/msdn-magazine-mobile-apps-getting-started-with-windows-phone-development-tools)
- [Microsoft: Windows Phone motion design](https://blogs.windows.com/windowsdeveloper/2013/07/11/inside-windows-phone-motion-design-using-the-windows-phone-toolkit/)

## Phase Boundary

### Phase 2 includes

- panorama header and navigation composition;
- authentic type hierarchy and spacing;
- a reusable 1×1, 2×1, 2×2, and 4×2 tile grammar;
- Me as a personal Start screen;
- distinct tile/list/picture treatments for Projects, Blog, and Photography;
- production SVG app-bar icons and exact command geometry;
- subtle panoramic backgrounds;
- selective live-tile updates, press tilt, and modest entrance polish;
- responsive desktop and mobile composition;
- accessibility, no-JavaScript, and reduced-motion behavior;
- regression coverage for visual structure and content fit.

### Phase 2 excludes

- the full Windows Phone transition engine;
- turnstile page navigation;
- coordinated continuum transitions across route boundaries;
- shared-element tile-to-detail expansion;
- deep parallax or physics-driven panorama gestures;
- Phase 2 OSS extraction or public package APIs.

Those motion capabilities form Phase 3. Phase 2 must leave clean component boundaries and motion hooks for them without implementing them prematurely.

## Information Architecture

The application identity is always the small uppercase `AJMAL / PORTFOLIO` line in the status/header area.

There is no separate conventional tab row. The panorama heading is the active navigation state:

- Me: `technical leader / builder`
- Projects: `projects`
- Blog: `blog`
- Photography: `photography`

The next panorama heading peeks beyond the right edge. The headings are real links with `role="tab"`, shareable query URLs, arrow-key support, modified-click support, and functional no-JavaScript navigation. The active heading and its content move as one spatial plane with the existing restrained Phase 2 transition.

The following redundancies are forbidden:

- a small tab repeating the active panorama heading;
- an eyebrow such as `selected systems` above `projects`;
- a second page heading repeating `projects`, `blog`, or `photography`;
- a global `technical leader / builder` heading on non-Me pivots.

One persistent accessible `<h1>` remains, but its visible text follows the selected pivot. Server-rendered query states must contain the correct heading before hydration.

## Grid and Spacing

The visual system uses a small set of explicit tokens rather than unrelated `clamp()` values:

- base grid unit: `4px`;
- tile gutter: `6px` at phone scale, proportionally capped at `8px` on wide screens;
- core content inset: `24px` at phone scale;
- minimum interactive target: `44px`;
- sharp tile corners: `0px`;
- app-bar icon ring: fixed diameter and stroke tokens shared by every command;
- text spacing: named title, pivot, section, tile, and command-label gaps.

Desktop preserves the same ratios and visual rhythm on a wider canvas. It does not turn Lumia tiles into generic dashboard cards. Mobile and desktop can recompose the tile order, but they cannot distort square and wide ratios arbitrarily.

## Color and Background

Cyan remains the signature accent, supported by one deep Windows blue, white, black, and restrained grays. A screen should not use a different accent for every tile.

Subtle backgrounds are allowed and encouraged when they provide atmosphere:

- low-contrast cyan node traces for systems work;
- quiet geometric or transit-inspired lines;
- low-contrast photography on the Photography pivot;
- a shared background that shifts slightly with panorama position.

Background contrast must stay low enough that type and tile boundaries remain unambiguous. No gloss, glass reflections, card shadows, blur-heavy glassmorphism, rounded panels, or simulated physical materials are allowed.

## Typography

The stack prefers Segoe UI Variable and Segoe UI without distributing proprietary font files.

Typography provides most of the hierarchy:

- small uppercase application identity;
- oversized light-weight panorama headings;
- lower-case panorama names;
- concise medium-weight tile titles;
- small bottom-aligned tile labels;
- muted body copy with controlled line lengths.

Long copy must not be forced into short tiles. Tile content has explicit line and length budgets, and tests must catch overflow or collisions.

## Tile System

### Geometry

The repository-local tile system supports semantic sizes based on Start-screen ratios:

- `small`: 1×1;
- `wide`: 2×1;
- `large`: 2×2;
- `hero`: 4×2 on phone-grid units, adaptively wider on desktop.

The exact CSS implementation may use a four-unit phone grid and an eight- or twelve-unit desktop grid, but ratios and gaps stay coherent.

### Tile roles

A tile declares one role:

- `display`: static evidence with no false affordance;
- `live`: automatically cycles a short set of evidence;
- `reveal`: user activation reveals a secondary face;
- `navigation`: the entire tile is the destination link;
- `photo`: imagery is the primary content.

Every interactive tile has one interactive owner. A full-tile button plus a separately overlaid link is forbidden. This removes the current text/link collision and ambiguous nested interaction model.

### Liveliness

Only a minority of visible tiles move at once. Animations are offset so the screen feels alive rather than restless.

The Me evidence tile cycles approximately every six seconds through concise claims. It pauses on hover and keyboard focus. Direct activation advances it intentionally. The initial server-rendered claim remains meaningful without JavaScript.

Reduced-motion mode removes spatial flips and sliding. It may use an immediate or gentle opacity-only content update, but it must never hide evidence.

## Me Pivot

Me becomes a personal Start screen with these approved content types:

- 2×2 portrait tile using the existing portrait, monochrome with restrained cyan treatment;
- wide live evidence tile cycling professional facts;
- `5 frontend engineers` evidence;
- `5 learning squads` engineering-ownership evidence;
- current `capability graph` build tile;
- `live AI assessment` tile with a restrained waveform state;
- `frontend → full-stack` craft tile;
- `Lumia 520 / cyan / first smartphone` personal tile;
- a leadership tile expressing hands-on engineering, product judgment, and team enablement;
- résumé/contact commands in the app bar, not duplicated gratuitously in the grid.

Claims about direct reporting remain precise: the five frontend engineers report directly to Ajmal; engineers across the five multidisciplinary learning squads do not all report to him organizationally.

The visible intro must state the approved AI-native proposition. Career intent can support it but cannot replace it.

## Projects Pivot

Projects uses evidence-led tiles. Strong evidence appears on the face; a reader does not need to flip a tile to learn why it matters.

The initial composition includes:

- Lumia Metro Revival as the prominent system tile;
- capability graph as current work;
- lead platform with the approved `₹1Cr+` contribution claim;
- live AI assessment framed around what was learned;
- agent-ready engineering foundations where supported by approved copy.

The whole navigation tile opens its case study. Short supporting facts may update within a live tile, but navigation remains predictable.

## Blog Pivot

Blog celebrates typography rather than forcing every article into a tile.

- one wide live/latest-note tile provides energy;
- the rest is a clean Windows Phone-style list;
- dates, titles, summaries, draft status, and reading time remain visible;
- article links have clear full-row destinations;
- dummy posts remain visibly labeled as draft examples.

## Photography Pivot

Photography behaves as a picture hub:

- the portrait can lead the composition until a final photo set exists;
- photo tiles respect their source aspect ratios;
- imagery can replace placeholders without altering component structure;
- captions remain visible and useful;
- the background may be photographic but stays low contrast behind navigation and commands.

Final images and alt text remain a content-approval requirement.

## Application Bar and Iconography

The app bar is a designed system, not a collection of generic circular buttons.

Requirements:

- production SVG icons only; Unicode arrows, envelopes, and ellipses are forbidden as final icon assets;
- one shared icon view box and optical grid;
- monochrome strokes with consistent weight and line caps;
- a thin white command ring with exact diameter and stroke tokens;
- labels below the ring, always present visually at the intended phone layout;
- résumé and contact remain primary commands;
- the overflow command uses a designed three-dot SVG treatment;
- pressed state uses authentic inversion/tilt feedback rather than a generic filled pill;
- expanded/collapsed behavior, if retained on wide layouts, must keep command names accurate (`Show…` versus `Hide…`).

At opaque app-bar opacity, content geometry reserves its height. Transparent overlay behavior must be explicit and tested; accidental overlap is forbidden.

## Phase 2 Motion

Phase 2 motion is restrained:

- press tilt with touch and pointer parity;
- staggered tile entrance after pivot selection;
- one live evidence cycle;
- one restrained waveform or node animation;
- panorama content slide using the current navigation model;
- no simultaneous animation storm.

All motion communicates state or hierarchy. Decorative motion without information value is removed.

Phase 3 will replace or extend these hooks with the full transition engine.

## Responsive Behavior

Required review frames remain:

- 320×568;
- 393×851;
- 1440×900;
- 1920×1080.

At narrow widths:

- panorama heading and next-heading peek remain legible;
- tiles use coherent phone-grid ratios;
- vertical scrolling remains native;
- app-bar commands remain reachable and never obscure focused content;
- no description, metric, or link collides inside a tile.

At wide widths, the application uses the larger canvas without becoming a centered fake-phone frame. The grid may reveal more tiles per row while retaining Lumia rhythm.

## Accessibility and Progressive Enhancement

- every pivot remains a real shareable link;
- every navigation tile remains a real link;
- no-JavaScript navigation and content access continue to work;
- keyboard arrow navigation and sequential focus remain supported;
- automatic live-tile changes use `aria-live="off"`; the tile exposes one stable accessible label summarizing its evidence so screen readers are not interrupted every six seconds;
- hover-only information is forbidden;
- focus rings meet contrast requirements on cyan, blue, black, and photographic surfaces;
- reduced-motion removes spatial motion while preserving content;
- screen readers receive one clear heading hierarchy and no duplicate hidden tile face content.

## Component Architecture

Phase 2 evolves the repo-local Metro layer rather than embedding one-off styles in portfolio panels.

Expected units:

- shared spacing, grid, color, type, icon, and motion tokens;
- `MetroIcon` with a controlled SVG icon name union;
- `AppBarCommand` and `AppBar` built on the icon system;
- `PanoramaNav` that owns linked headings and next-heading peeks;
- a tile shell with size, role, accent, and accessible interaction contracts;
- dedicated static, live, navigation, reveal, and photo tile compositions;
- a live-cycle hook with pause, visibility, and reduced-motion behavior;
- portfolio-specific tile content kept outside the Metro primitives.

The Metro layer owns interaction and geometry. Portfolio components own Ajmal's content and editorial choices.

## Testing and Acceptance

Phase 2 is accepted only when all of the following hold:

- component tests cover panorama label order, server-selected heading, icon SVG usage, command names, tile roles, live-cycle pause/advance, reduced motion, and no duplicate interactive owners;
- layout regression checks confirm tile content and destinations do not intersect;
- E2E checks cover linked panorama navigation, history, modified clicks, no JavaScript, keyboard navigation, contact fragment synchronization, and representative detail routes;
- axe scans include Me, Projects, Blog, Photography, one project detail, one blog detail, and open Contact;
- exact viewport-only screenshots are inspected at all four target frames;
- Lighthouse remains at least 0.90 performance, 0.95 accessibility, and 0.95 best practices;
- unit tests, typecheck, lint, build, E2E, and accessibility suites pass;
- production uses the approved SVG icons and no placeholder Unicode commands;
- the live implementation is compared directly with the approved mockups in the in-app browser.

## Launch Readiness Dependencies

The UI polish does not waive existing launch blockers:

- upgrade the unsupported Next.js 14.1.0 runtime to a currently supported and security-patched line in an isolated compatibility task;
- make the contact fragment canonical so Back and Close remain synchronized;
- restore the visible AI-native proposition on Me;
- declare the supported Node runtime used by Lighthouse and the test stack.

These must be complete before the portfolio is described as deployable.

## Approval Record

Approved during visual brainstorming:

- personal Start-screen Me composition;
- portrait, evidence, capability graph, assessment, craft, and Lumia tiles;
- authentic SVG app-bar direction;
- distinct Projects, Blog, and Photography compositions;
- subtle panoramic backgrounds;
- panorama heading as navigation with no duplicate tab/eyebrow/page-title labels;
- Phase 3 reserved for the full Windows Phone transition engine.
