# Start Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. The user has already requested execution; no further design approval is needed.

**Goal:** Give every part of the Start homepage a distinct purpose while preserving the photographic tiles and motion the user loves.

**Architecture:** The Start board is the single experience launcher. Header controls are global utilities; tiles either navigate directly to real project destinations or open a focused interactive app. One shared TileSequence retains the existing common perspective and reverse journey; the root route and production deployment are outside this change.

**Tech Stack:** Next.js 15, React 19, TypeScript, CSS Modules, local @pane-ui/react components, Playwright.

**Spec:** The design specification below, based on the user’s feedback that top tabs duplicate tiles, their approval of the tiles, and their preference for visual storytelling.

## Global Constraints

- Keep this iteration at `/start`; do not replace `/`, push, deploy, or publish a package.
- Preserve the Lenka artwork, official YouTube destination, nine generated contact portraits, coastal photo, and cyan Lumia 520.
- Do not use the user’s prohibited sentiment word in product copy. Show the references through imagery and interaction.
- Keep native links, browser history, keyboard focus, reduced motion, and the existing BackButton.
- Preserve the approved common-camera tile departure and its retraced return. Do not add a new animation framework.
- No invented live weather, endless progress indication without an operation, or inactive controls.
- No new dependency, account requirement, audio autoplay, or service integration.

## Design specification

### Roles and hierarchy

1. **Header:** Pane UI identity, GitHub link, Install command button. Remove the duplicate Docs link here; the Docs tile is its prominent destination. Brand can still link to the current project site while this remains an alternate preview.
2. **Product introduction:** One concise description: “A React component library inspired by Windows Phone.” It must remain obvious what visitors are looking at.
3. **Page heading:** One large, lightweight `start` h1. Remove Panorama and its tabs entirely. Nothing is gained by renaming the same duplicate destinations to new tabs.
4. **Tile board:** Two visual clusters: `everyday` for People, photos, and music; `build` for documentation, components, examples, and the Lumia. These are captions, not navigation controls. Grouping expresses the difference between experiencing the interface and using the library.
5. **Footer:** Brief implementation credit, alternate project-site link, alpha state, and the existing ambient motion control. No duplicate destination menu.

### Tile contract

| Tile | What it shows | What activation does | Purpose |
|---|---|---|---|
| People | Nine individually flipping photographic faces | Opens People view with the larger living mosaic and a link to LiveTile docs | Demonstrate independent live surfaces |
| photos | Coastal photograph with the existing second view | Opens the photographic composition and a link to RevealTile docs | Give imagery room and demonstrate a second face |
| music | User-provided Lenka artwork, artist, song title | Opens the music view; its explicit Listen link opens the official video | A specific, recognizable cultural detail |
| docs | Clear code/reading glyph and “build something.” | Goes directly to `/docs/installation` | Start building without an extra menu |
| components | Geometric tile motif | Opens the actual controllable workbench | Try the library in place |
| examples | Existing mail glyph with an accurate label, no unsupported count | Goes directly to `/examples` | Explore complete applications without an extra menu |
| Lumia 520 | Cyan phone illustration | Opens PhoneDemo with a short origin note | Make the project’s personal origin concrete |

The first three app views have their own real subject; the workbench has real state. The Lumia story exists in its app only, not in a duplicate top-level tab. Documentation and examples are real destinations and must keep normal link semantics, including modified clicks and opening in a new tab.

### Desktop composition

- Preserve the colorful tile artwork, flat surfaces, narrow gutters, square edges, and oversized typography.
- Remove the current right-hand weather, note, and progress column. Let the board occupy that space.
- Keep People tall; place photos and music beside it in the everyday cluster. Arrange docs/components/examples/Lumia in the build cluster.
- Prefer one `TileSequence` containing all seven leaves so both clusters still use one measured camera. CSS can use explicit grid placement plus a larger inter-cluster gutter. Place static group captions above their columns, not inside animated tile leaves.
- Use stable tile IDs or class names for placement, rather than fragile selectors such as `nth-last-child(2)`.
- If group captions are ordinary text, associate each tile with its caption using `aria-describedby`; do not claim tabs, tabpanels, or extra interactive semantics.
- Keep a readable board at 1280–1440px; avoid forcing fixed viewport height when content needs to scroll.

### Mobile composition

- Stack everyday then build, preserving DOM/reading order.
- People stays visually prominent; photos/music retain readable imagery and labels. Build tiles form two columns where space allows.
- At 320px, allow natural vertical scroll and keep all tile captions and the Install button usable. No horizontal body overflow.
- Preserve one board/camera and use CSS rearrangement, not duplicated mobile markup.

### App behavior

- Keep the existing `Phase` transition state machine and `desired/current/target` separation.
- In-place apps are `people | components | photos | phone | music`; docs/examples are direct links.
- Remove the unused Panorama `section` state and its whole duplicate controls/story trees.
- Remove docs/examples app menus from the UI. For old `?app=docs` / `?app=examples` URLs, route to the corresponding real destination rather than leaving users in an empty app or silently showing Start.
- Component workbench keeps controlled Quiet hours and Sound level. Its primary documentation action should link to `/docs/fields`; Install remains a header utility rather than the workbench’s only button action.
- Lumia app adds “2013 / Nokia Lumia 520” and a short first-person origin note once, then uses the real PhoneDemo. Do not add another inaccurate phone replica.
- Keep app heading focus after entrance, focus the activating tile on return, and use BackButton with `Back to Start` accessible label.
- When a deep-linked app has no remembered launcher, returning should focus the Start heading or the matching app tile after the transition.
- Browser Back/Forward and rapid navigation must converge on the URL’s requested app. Do not regress the existing stable transition callbacks.

## File ownership and boundaries

- `components/start/StartDesktop.tsx`: shell, tile definitions, link behavior, history, phase state, focus, installation status.
- `components/start/StartArtwork.tsx` (new): exported `PeopleArtwork` and its private portrait face helper. Used by both board and People app; no routing state.
- `components/start/StartAppViews.tsx` (new): focused app content with props `{ app, quiet, onQuietChange, volume, onVolumeChange }`; exports the in-place app type and names if useful. No header, URL changes, or motion lifecycle.
- `components/start/start.module.css`: layout, captions, all visual styles; delete removed Panorama/sidebar/story/menus styles and consolidate overrides touched by the change.
- `tests/e2e/start.spec.ts`: intentional IA, native destination links, app navigation, keyboard, reduced motion, small-screen checks.

Do not extract a general routing framework, configurable desktop shell, or tile registry package. The extraction should make the current view easier to inspect, not generalize an unproven API.

## Task 1: Make navigation intentional

- [ ] Add assertions that Start has a single visible `start` h1, no tab/tablist, one docs tile to `/docs/installation`, and one examples tile to `/examples`.
- [ ] Replace Panorama with the Start heading and board. Remove section state, duplicated top-tab content, and the Docs header shortcut.
- [ ] Turn docs/examples tiles into native direct links and remove their intermediate menus. Keep old query URLs working by routing them to the real pages.
- [ ] Remove the static clock, weather, arbitrary progress display, and unsupported examples count.
- [ ] Keep GitHub visible on mobile; do not retain an obsolete `nth-child(2)` rule that hides the wrong link after the header changes.
- [ ] Check the browser test fails before implementation and passes after it.

## Task 2: Compose the two clusters without changing the camera

- [ ] Define explicit placement for the seven stable tile IDs/classes in a single TileSequence.
- [ ] Add everyday/build captions and a larger gap between clusters; retain narrow gaps inside each cluster.
- [ ] Stack clusters at the small-screen breakpoint. Remove the obsolete sidebar breakpoint and repeated first/last-child grid overrides.
- [ ] Preserve tile imagery, hover/focus treatment, flip motion pause, and reduced-motion behavior.
- [ ] Inspect desktop 1440×900 and 1280×800 plus mobile 390×844 and 320×740. Check the final layout and one mid-transition frame, not only DOM assertions.

## Task 3: Give each app its own useful content

- [ ] Extract PeopleArtwork and StartAppViews using the boundaries above.
- [ ] Retain music, People, and photo views with their direct relevant destinations.
- [ ] Make the workbench a genuine component surface: controlled fields plus a clear documentation link, without an installation button duplicated from the header.
- [ ] Move the brief Lumia origin text into the phone app next to the real PhoneDemo.
- [ ] Keep current typed history/phase logic in StartDesktop and add a deterministic focus fallback for deep-linked return.
- [ ] Verify the controls remain usable after opening, returning, and reopening the workbench; state should survive in the shell.

## Task 4: Verify the complete journey

Use `ARTIFACT_BASE_URL=http://127.0.0.1:3101 npx playwright test tests/e2e/start.spec.ts` against a freshly built preview; do not run a production server and a build against the same `.next` directory simultaneously.

### Required assertions

```ts
await expect(page.getByRole('tab')).toHaveCount(0);
await expect(page.getByRole('heading', { name: 'start', exact: true })).toBeVisible();
await expect(page.getByRole('link', { name: 'Open docs', exact: true }))
  .toHaveAttribute('href', '/docs/installation');
await expect(page.getByRole('link', { name: 'Open examples', exact: true }))
  .toHaveAttribute('href', '/examples');
```

Adapt link accessible names only if the final copy intentionally changes them; the destination and non-duplication contracts are required.

- [ ] Music opens, app heading receives focus, Back retraces, activating tile regains focus, and the official video link remains correct.
- [ ] Browser Back and Forward repeat the same journey under both normal and reduced motion.
- [ ] Direct app URL loads; Back returns to Start and places focus deterministically.
- [ ] Components tile opens one workbench. Quiet hours and Sound level are keyboard-operable and update visibly.
- [ ] No fake loading status is exposed on idle Start; pausing ambient tile motion still works.
- [ ] At 320px and 390px no horizontal overflow, clipped labels, overlapping clusters, or hidden essential controls.
- [ ] Axe WCAG A/AA checks pass on Start and the component workbench under reduced motion.
- [ ] Run `npm run build`, inspect its result, then serve and exercise the updated page. Broaden to relevant existing motion tests only if transition implementation changes.
- [ ] Inspect the final diff for obsolete styles, duplicate content, accidental changes to `/`, and prohibited product copy.

## Acceptance and handoff

The finished page must answer three questions immediately: what Pane UI is, what a tile will open, and how to begin building. Top-level tabs are gone, every tile has one purposeful destination, the familiar artwork still dominates, and the app journey feels exactly as continuous as the approved version.

Report what changed, provide `/start` for review, and state actual verification results. Keep the live homepage unchanged until the user chooses to promote this direction.

## Execution record — 2026-09-19

Implemented the new hierarchy, direct destinations, two responsive tile clusters, shared artwork/app-view extraction, stateful workbench, and Lumia origin note. Preserved the existing shared-camera motion implementation and artwork. Kept the preview at `/start`.

Verification completed:
- Production build passes (existing unrelated legacy CSS, effect-cleanup, and metadata warnings remain).
- 12 Playwright checks pass across desktop Chromium and mobile Chromium, including normal/reduced motion, keyboard controls, Axe accessibility, focus/history, legacy URL redirects, and rapid entrance activation.
- Layout visually inspected at 320, 390, 1280, and 1440 pixels; checked tile alignment and horizontal overflow. Inspected an intermediate departure frame.
- Installation clipboard copying and ambient tile pause verified in the browser.
- Formatting and diff whitespace checks pass.

Review corrections: fixed the shared large-tile minimum height overriding the desktop composition; queued clicks during entrance instead of dropping them; repeated entrance activation replaces its pending history entry so Back returns directly to Start.

Process note: browser assertions were added alongside implementation, not run against the old build first. Their initial run exposed the entrance-click defect; the corrected implementation passes the expanded suite. No changes were pushed or published.
