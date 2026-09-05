/**
 * The types the tile components share.
 *
 * Here rather than in either of them because both ends need this one:
 * `MetroTile` renders from it and every consumer writes it, while `TileGrid`
 * -- which imports `MetroTile` itself, to recognise its own children -- is
 * where it used to live. A type imported back across that edge is a module
 * cycle that only `import type`'s erasure keeps from being a runtime one, and
 * the first edit that needs a value instead turns it into an undefined
 * component at module-init. A leaf module both can point at costs nothing and
 * cannot cycle.
 */

/** Start-screen ratios in grid units: 1x1, 2x1, 2x2 and 4x2. */
export type TileSize = "small" | "wide" | "large" | "hero";
