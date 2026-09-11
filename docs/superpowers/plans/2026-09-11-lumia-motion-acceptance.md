# Lumia Motion Acceptance Record

## Scope and workspace

This record accompanies the [implementation plan](2026-09-11-lumia-motion.md) and [design](../specs/2026-09-11-lumia-motion-design.md). Work is isolated in `.worktrees/lumia-portfolio` on `codex/lumia-portfolio`; main is not changed by the implementation.

## Baseline verified before implementation

- Starting code: `19a6856`; planning commit: `d977c0d`.
- Runtime: installed Node `22.22.2`.
- `npm test`: **26 files, 325 tests passed**, 3.74 seconds.
- Existing warnings: PostCSS plugin omits its `from` option; jsdom reports unsupported document navigation. These appeared before motion changes.
- Captured and inspected existing 1440×900 and 393×851 layouts. Temporary baseline images: `/tmp/lumia-before-desktop.png` and `/tmp/lumia-before-mobile.png`.
- Baseline preview was a separately owned dev server on port 3151, stopped after capture.
- Unchanged main production build passed under Node22.22.2; homepage first-load JavaScript was 121kB.
- Unchanged main browser regression run: **176 passed, 14 failed** (190 tests, 1.9 minutes). Log: `/tmp/lumia-baseline-e2e.log`. Failures comprised 11 Blog hero/list overlap measurements during tile entrance, 2 press tests measuring a still-translating tile/reusing old coordinates, and 1 mobile-emulation background popup readiness timeout. These are baseline failures, not new-motion results.
- Browser baseline investigation found a real transient Blog hero overlap as well as missing arrival synchronization in the test. A passing settled-layout test alone must not erase that observation.

## Review criteria

Verify panorama continuity, retained outgoing content, coupled heading/background movement, one interactive panel, deliberate swipe commitment, interruption, route history, turnstile opening/return, scroll/focus restoration, reduced motion, and fixed app-bar placement. Static layout similarity alone is not acceptance of the motion system.

## Implementation verification status

Implementation and final browser checks are in progress. No final pass is claimed by this baseline record.

First panorama smoke check on the isolated dev server: accepted 40% Me-to-Projects drag updated the URL, native Back returned to Me, and the page emitted no errors. Captured moving/settled 393×851 frames. A mouse-text-selection issue was sent to the implementer for correction. This limited check does not replace the final regression suite.
