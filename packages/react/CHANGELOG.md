# Changelog

## 0.1.0-alpha.1 — 2026-09-23

- Prepare layered `TileSequence` surfaces before entrance playback to prevent choppy tile returns.
- Batch tile measurements before starting animations to avoid repeated layout work.
- Preserve immediate reversals, reduced-motion behavior, and existing animation duration defaults.

## 0.1.0-alpha.0

First public alpha release.

- Theme tokens, live and reveal tiles, and shared-perspective tile sequences.
- Interruptible transitions with reverse-path navigation and reduced-motion support.
- Navigation, commands, form controls, feedback, dialogs, menus, and lists.
- TypeScript declarations, explicit CSS exports, and React Server Component boundaries.
- React 19 peer dependencies; no Next.js or Tailwind runtime requirement.

APIs may change during alpha. Automated coverage does not replace the pending manual assistive-technology and physical-device checks documented in `docs/library-support.md` in the repository.
