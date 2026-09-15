# Pane UI

A React component library inspired by Windows Phone: bold typography, living tiles, and purposeful transitions.

**Local alpha.** The library builds and can be installed from a tarball. It is not published to npm; package naming, licensing, and the release support matrix are still being finalized.

## Run the project site

Use Node 22.22.2:

```sh
nvm use
npm ci
npm run dev
```

Open [the project homepage](http://localhost:3000). The site includes:

| Route                | What to explore                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------- |
| `/`                  | Project introduction, live tiles and getting started                                          |
| `/docs`              | Installation, foundations and component API documentation with interactive previews           |
| `/examples`          | Example gallery and reusable source                                                           |
| `/examples/settings` | Settings form with validation, theme preview, save and reset                                  |
| `/examples/inbox`    | Search, read state, compose dialog and local Sent messages                                    |
| `/phone`             | Interactive phone recreation with Start, app list, People, Messages, Photos and Settings      |
| `/library`           | Detailed component and motion workshop                                                        |
| `/portfolio`         | Original portfolio; supporting `/blog`, `/projects/...` and `/resume` routes remain available |

The phone is a web demonstration, not an operating-system emulator. Sample messages and preferences stay local to the page session.

### Documentation search and production preview

Nextra 4 provides the MDX documentation shell, navigation, table of contents and code blocks. Search uses Pagefind files generated from the built documentation HTML:

```sh
npm run build
npm run start -- --port 3101
```

Open [the production preview](http://localhost:3101). The `postbuild` script indexes only docs into ignored `public/_pagefind/`. Development does not regenerate the search index: search needs a successful build and may show stale results after editing docs until the next build. Run the full `npm run build` command so its indexing step runs. Do not run development and production servers against the same `.next` directory at the same time.

### Plain React examples

The [Vite starter](examples/vite/README.md) runs the same settings and inbox source without Next.js. After the root install:

```sh
npm run build:library
npm --prefix examples/vite ci
npm --prefix examples/vite run dev
```

The starter consumes the local built package and keeps its own exact dependencies and lockfile. See [example source and reuse notes](examples/README.md).

## Use the library

```sh
npm run build:library
npm pack ./packages/react
```

Install the resulting `.tgz` in a separate React 19 application using its actual filesystem path:

```sh
npm install /absolute/path/to/pane-ui-react-0.1.0-alpha.0.tgz
```

Replace the placeholder path and use the filename printed by `npm pack` if the version changes. Packing does not publish anything. No Next.js or Tailwind dependency is required by the library.

```tsx
import { Theme, TileLink, Transition } from "@pane-ui/react";
import "@pane-ui/react/styles.css";

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
LIBRARY_PRODUCTION=1 npm run test:site:browser
npm --prefix examples/vite ci
npm --prefix examples/vite run build
```

`test:package` installs the packed distribution into a clean temporary React consumer and server-renders it. Browser tests check tile geometry, touch contact, reduced motion, workshop interactions, and accessibility. The site browser gate uses the production build for docs search and phone journeys; install Playwright Chromium first with `npx playwright install chromium`. Set `ARTIFACT_BASE_URL=http://127.0.0.1:3101` to test an existing production preview instead of starting a managed server. See [the verification report](docs/library-verification.md) for measured results and remaining release work.

An independent project; not affiliated with Microsoft. No proprietary font files or Windows Phone assets are distributed.

A focused [foundation review](docs/foundation-review.md) records the package boundaries, a verified hidden-state fix, and remaining release checks.

See [support and release quality](docs/library-support.md) for browser evidence, bundle measurements and the remaining manual release gates.
