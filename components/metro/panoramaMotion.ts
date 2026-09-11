export type MotionSample = { x: number; time: number };
export type GestureDecision = {
  width: number;
  startIndex: number;
  count: number;
  dx: number;
  velocity: number;
};

export function gestureTarget({
  width,
  startIndex,
  count,
  dx,
  velocity,
}: GestureDecision) {
  if (width <= 0) return startIndex;
  const distance = Math.abs(dx) >= width * 0.22;
  const fling = Math.abs(dx) >= 24 && Math.abs(velocity) >= 0.45;
  if (!distance && !fling) return startIndex;
  const direction = distance ? Math.sign(dx) : Math.sign(velocity);
  return Math.max(0, Math.min(count - 1, startIndex - direction));
}

export function gestureIntent(
  dx: number,
  dy: number,
): "pending" | "horizontal" | "vertical" {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return "pending";
  return Math.abs(dx) > Math.abs(dy) * 1.2 ? "horizontal" : "vertical";
}

/** A pause empties the velocity window; old movement cannot turn a hold into a fling. */
export function recentVelocity(samples: readonly MotionSample[]) {
  const last = samples.at(-1);
  if (!last) return 0;
  const first = samples.find((sample) => last.time - sample.time <= 100);
  if (!first || last.time <= first.time) return 0;
  return (last.x - first.x) / (last.time - first.time);
}

export function resistBoundary(position: number, count: number) {
  if (position < 0) return position / (3 + Math.abs(position));
  const end = count - 1;
  if (position > end) return end + (position - end) / (3 + position - end);
  return position;
}
