# Plain React starter

A private React 19 + Vite application that consumes the built `@pane-ui/react` package. This package is a local alpha, not a public npm installation. Use Node 22.22.2 (the repository's supported Node version).

From the repository root:

```sh
npm ci
npm run build:library
cd examples/vite
npm ci
npm run dev
```

Open the localhost address Vite prints (normally `http://127.0.0.1:5173`). For a production check, from `examples/vite`:

```sh
npm run build
npm run preview
```

`npm run build` typechecks the application and shared examples before producing `dist/`. `npm run typecheck` runs the typecheck independently. After changing library source, run `npm run build:library` at the repository root again.

## What to explore

- **Settings:** edit a profile, trigger native email/required-field validation, preview theme/accent preferences, save, and reset later edits to the saved snapshot.
- **Inbox:** search original sample mail, read a message, switch folders, compose with validation, retain a draft, and save a local sent message. Nothing is delivered to another person.
- Both examples keep state for the current page session. Refreshing resets it. No account, server, local storage, notifications permission or remote assets are needed.

## Source and reuse

`src/main.tsx` imports `../shared` through relative paths. All example UI, sample data, validation and styles live in **`examples/shared/`**, which is also consumed by the Next.js gallery. There is one source of truth. The Vite config deduplicates React for the linked package and permits the shared source directory in development.

This starter uses `file:../../packages/react` and the package's public JavaScript, types and CSS exports. It does not import package source or Next.js. Unlike the repository's `/library` workshop, it demonstrates a standalone browser application with ordinary React state and Vite.

To move the starter into a different repository, copy `shared/` alongside it, adjust relative imports if needed, and replace the local package dependency with a tarball built from this repository. See `packages/react/README.md` for the local tarball workflow. Do not substitute a public registry command until the package has actually been published.

Vite configuration follows its [shared-options documentation](https://vite.dev/config/shared-options.html).
