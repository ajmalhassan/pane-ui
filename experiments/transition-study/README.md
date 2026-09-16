# Start → app motion study

An isolated, reviewable reconstruction from the user's 2026-09-15 10.29.19 AM recording. No changes to the React library's motion or public API. This is a visual hypothesis, not a pixel-perfect reproduction or production-ready replacement.

## Run locally

From the repository root (Node 22, installed root dependencies, ffmpeg + ffprobe):

```sh
node experiments/transition-study/prepare.mjs '/absolute/path/to/recording.mov'
python3 -m http.server 3102 --bind 127.0.0.1 --directory experiments/transition-study
```

Open http://127.0.0.1:3102. Play at 1×, ¼×, or ⅒×; scrub or step through actual captured timestamps. Disable artwork to inspect the DOM planes. The recording and extracted artwork stay in ignored `.local/`; they are not library or redistributable demo assets. Preparation is specific to this recording's viewport and frame indices.

```sh
node experiments/transition-study/verify.mjs
```

Checks Chromium, Firefox and WebKit. Screenshots are written under `.local/verification/`.

## Evidence

The file is 680×1304 and 9.561667 seconds long. Although the nominal rate says 120 fps, it contains **289 captured frames with variable timestamps**. Interpolating it to 120 fps would invent duplicate frames. All 38 captured frames from 4.200000–5.300000 seconds were inspected in timestamped contact sheets, with full-size inspection of key stages. The preceding overview established that this is the only home-to-app launch in the clip.

| Captured frames (one-based) | Time          | Observation                                                                                                            |
| --------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 194–197                     | 4.200–4.308 s | Grid still square; status/arrow disappear and the Me tile's ambient content changes. No reliable tapped-tile identity. |
| 198–202                     | 4.325–4.450 s | Bottom-right first, followed by bottom-left and the wide picture tile. Upper two rows remain mostly stationary.        |
| 203–206                     | 4.492–4.575 s | Wave travels upward; lower tile right edges project downward while upper right edges project upward.                   |
| 207–210                     | 4.617–4.700 s | People and then Phone leave last. Planes sweep left, with enlarged edges toward the camera and recorded blur.          |
| 211–212                     | 4.742–4.767 s | Flat light surface fills the viewport before readable app content.                                                     |
| 213–225                     | 4.783–5.117 s | Office panorama content appears in perspective, becomes opaque, enlarges and settles left.                             |
| 226–231                     | 5.158–5.300 s | Documents view settles; little remaining lateral movement.                                                             |

Frame numbers are decoded-frame indices; timing uses ffprobe presentation timestamps. First launch movement is ambiguous around the ambient Me flip, so 4.325 s is an explicit approximate animation origin.

## Diagnosis of the current implementation

`packages/react/src/TileSequence.tsx` already has a useful reversed exit order. The geometric model is the problem:

- Each tile uses `perspective(1200px) rotateY(+78deg)` around its own left-center origin. The reference has the opposite depth direction and screen-relative vertical projection.
- The parent adds `translateX(-8%) rotateY(+10deg)`, but the group wrapper has the default flat transform style. This gives a transformed composite of separately projected tiles, rather than a common 3D camera.
- Tiles fade over their entire eased track; the source's departure and loss of contrast are more concentrated in the turn.
- The phone demo rotates/fades the whole incoming app. This specific Office reference first establishes the background, then animates content inside it.

The middle panel copies the current forward-exit equations (260 ms and the phone demo's 26 ms interval) onto identical artwork/layout. It is deliberately labeled **existing equations**, not a mounted React component. Small layout/scale differences from the actual demo remain. The schematic incoming app uses the existing turnstile equation; production navigation lifecycle is not reproduced in this experiment.

## Reconstruction

One screen-relative camera (`perspective(500px)`, at a 274px-wide study viewport), with its origin at the left edge and vertical center. Each independent tile resolves its local transform origin to that same screen coordinate. The projection is expressed directly in each plane’s matrix, rather than through a perspective-bearing ancestor. A bottom-right → top-left wave changes the planes' rotation separately in that common space. This accounts for the visual group relationship without forcing upper tiles to move prematurely.

Initial fitted parameters: −88° Y rotation, −22px translation, 220ms per plane, 33ms stagger, accelerating easing, opacity driven by the same accelerating progress. These are estimates, not recovered OS constants. A first trial with a centered camera collapsed the right column too early; shifting the camera origin left kept the projected right edge near its recorded position for longer.

The destination background is independent of its content. A schematic panorama turns/scales and slides inside a stationary light surface. This is specific to the demonstrated Office launch; a general library should allow destination-specific choreography.

## Technology versus missing information

CSS 3D and the Web Animations API can represent this camera, shared hinge and individually delayed planes. The experiment uses those APIs directly, with no canvas, WebGL, animation dependency, or React changes. Chromium, Firefox and WebKit smoke checks pass. This establishes feasibility, not frame-rate performance on physical phones.

The W3C [CSS Transforms Level 2 rendering model](https://www.w3.org/TR/css-transforms-2/#3d-rendering) describes shared 3D contexts. Its [grouping property rules](https://www.w3.org/TR/css-transforms-2/#grouping-property-values) explain why opacity/filters/clipping on the wrong ancestor can flatten them. Clipping here is on an outer viewport and opacity applies to leaf tile planes.

**A real browser discrepancy was found and worked around:** Playwright WebKit reported correctly projected DOM rectangles but painted the ancestor-perspective version without its expected vertical projection. Combining animation tracks, removing a redundant leaf 3D context, and sampling into static styles did not resolve it. Expressing the equivalent shared-camera projection directly in each leaf transform restored the visible turn. Some projected extents still differ from Chromium/Firefox in the final WebKit screenshot, so this is a partial workaround, not cross-engine visual parity. This is a local WebKit rendering observation, not a proven diagnosis of all Safari versions. Final screenshots were inspected in all three engines; the control smoke tests alone would have missed it.

Remaining differences:

- The recording has pronounced blur/ghosting. It does not establish whether this came from the original UI, source playback, or capture. This prototype does not attempt to reproduce the blur with filters. Exact captured pixels cannot be used as proof of original native geometry.
- Angles, projection distance, easing and onset delays cannot be uniquely recovered from these blurred, unevenly sampled frames. More than one transform model can fit them.
- Me's ambient flip continues during navigation in the recording. Frozen artwork deliberately removes that separate behavior from this geometry study.
- App artwork is schematic and typography differs. Office's panorama choreography is not a universal app-launch requirement.
- Production cancellation, dynamic layouts, focus, accessibility announcements, reverse navigation, offscreen tiles and scroll position remain the existing library's responsibility. Integrating this model requires preserving and testing those behaviors.

**Recommendation:** review the isolated reconstruction, then apply the shared-space geometry to TileSequence while retaining its lifecycle. Keep destination-surface/content choreography separate. There is no demonstrated need to replace React or introduce a different rendering technology.
