# Windows Phone React

A React component library inspired by Windows Phone: bold typography, living tiles, and purposeful transitions.

**Local alpha.** The library builds and can be installed from a tarball. It is not published to npm; package naming, licensing, and the release support matrix are still being finalized.

## Run the workshop

```sh
nvm use
npm ci
npm run dev
```

Open [the component workshop](http://localhost:3000/library). The existing Windows Phone inspired portfolio remains at `/`.

The workshop includes interactive static/link/reveal/live tiles, theme and accent selection, a transition stage with four presets and adjustable timing, an overview/detail journey with focus restoration, and everyday commands with loading and overflow examples.

## Use the library

```sh
npm run build:library
npm pack ./packages/react
```

Install the resulting `.tgz` in a React 19 application. No Next.js or Tailwind dependency is required by the library.

```tsx
import { Theme, TileLink, Transition } from "@windows-phone/react";
import "@windows-phone/react/styles.css";

<Theme mode="dark" accent="blue">
  <Transition show={true} preset="turnstile">
    <TileLink href="/hello" label="say hello">
      hello, world.
    </TileLink>
  </Transition>
</Theme>;
```

Read the [component API](packages/react/README.md), [design direction](docs/library-direction.md), [component roadmap](docs/component-roadmap.md), and [contributor guide](CONTRIBUTING.md).

## Included

- Scoped light, dark, and system themes with five accents.
- Tile, TileLink, RevealTile, LiveTile, and container-based TileGrid.
- Native Pressable with contact-point tilt; Button and labeled IconButton with loading states.
- Composable AppBar, AppBarAction, AppBarLink, and inline AppBarOverflow.
- Interruptible Transition presets: turnstile, slide, continuum, fade.
- Staggered entrances, reduced-motion behavior, native focus/disabled semantics, and typed refs.
- Field, Label, FieldDescription, FieldError, TextField and TextArea with native forms and linked validation.
- Native Checkbox, Switch, and RadioGroup with labels, descriptions, and form reset.
- Select and Slider with Field integration, native options, bounds, steps, and keyboard/touch input.
- Progress, ProgressRing, and persistent MessageBanner with explicit announcement and dismissal ownership.
- Dialog and AlertDialog with native modality, controlled dismissal, focus restoration, and interruptible motion.
- Menu and Popover with Floating UI positioning, native top-layer panels, and distinct keyboard contracts.
- List, ListItem, SectionHeader, and EmptyState with native semantics and separate row/action controls.
- Streaming ProgressDots with a reduced-motion fallback.
- Accessible Pivot tabs, spatial Panorama navigation, and layered group-and-tile TileSequence transitions.

The continuum preset is a depth transition, not a shared-element morph. Pivot, Panorama, and TileSequence are now included. Nested menus, tooltips and router recipes remain future work; the portfolio retains its existing Next-specific panorama and route choreography.

## Verification

```sh
npm test
npm run typecheck
npm run lint
npm run test:package
npm run test:library:browser
npm run build
```

`test:package` installs the packed distribution into a clean temporary React consumer and server-renders it. Browser tests check tile geometry, touch contact, reduced motion, workshop interactions, and accessibility. See [the verification report](docs/library-verification.md) for measured results and remaining release work.

An independent project; not affiliated with Microsoft. No proprietary font files or Windows Phone assets are distributed.

A focused [foundation review](docs/foundation-review.md) records the package boundaries, a verified hidden-state fix, and remaining release checks.

See [support and release quality](docs/library-support.md) for browser evidence, bundle measurements and the remaining manual release gates.
