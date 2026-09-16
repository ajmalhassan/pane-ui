// Local study assets only. No video or extracted Microsoft artwork is committed.
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";
const source = process.argv[2];
if (!source)
  throw new Error(
    "Usage: node experiments/transition-study/prepare.mjs /absolute/path/to/recording.mov",
  );
const dest = fileURLToPath(new URL("./.local/", import.meta.url));
await mkdir(path.join(dest, "frames"), { recursive: true });
const probe = JSON.parse(
  execFileSync("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "frame=best_effort_timestamp_time",
    "-of",
    "json",
    source,
  ]),
);
execFileSync("ffmpeg", [
  "-v",
  "error",
  "-i",
  source,
  "-fps_mode",
  "passthrough",
  path.join(dest, "frames", "%03d.png"),
  "-y",
]);
const framePath = (n) =>
  path.join(dest, "frames", `${String(n).padStart(3, "0")}.png`);
// This recording's device viewport; all coordinates are native source pixels.
const viewport = { left: 67, top: 112, width: 548, height: 914 };
const tiles = [
  { name: "Phone", x: 27, y: 104, w: 198, h: 198 },
  { name: "People", x: 237, y: 104, w: 198, h: 198 },
  { name: "Messaging", x: 27, y: 315, w: 198, h: 198 },
  { name: "Outlook", x: 237, y: 315, w: 198, h: 198 },
  { name: "Pictures", x: 27, y: 526, w: 408, h: 198 },
  { name: "Games", x: 27, y: 735, w: 198, h: 178 },
  { name: "Me", x: 237, y: 735, w: 198, h: 178 },
];
for (const [i, tile] of tiles.entries())
  await sharp(framePath(194))
    .extract({
      left: viewport.left + tile.x,
      top: viewport.top + tile.y,
      width: tile.w,
      height: tile.h,
    })
    .png()
    .toFile(path.join(dest, `tile-${i}.png`));
const frames = probe.frames
  .map((frame, i) => ({ n: i + 1, seconds: +frame.best_effort_timestamp_time }))
  .filter((f) => f.seconds >= 4.2 && f.seconds <= 5.3);
for (const f of frames)
  await sharp(framePath(f.n))
    .extract(viewport)
    .png()
    .toFile(path.join(dest, `reference-${f.n}.png`));
await writeFile(
  path.join(dest, "manifest.json"),
  JSON.stringify({ frames, tiles, viewport, baseline: 4.325 }, null, 2),
);
console.log(
  `Prepared ${frames.length} timestamped reference frames. Assets stay in ignored .local/.`,
);
