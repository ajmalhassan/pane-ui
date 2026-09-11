export type ProjectMotionHandle = {
  finished: Promise<void>;
  cancel(): void;
  dispose?(): void;
};

export type ProjectAnimationAdapter = {
  readonly available: boolean;
  animate(
    element: HTMLElement,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
  ): ProjectMotionHandle;
};

export type ProjectMotionRun = {
  readonly finished: Promise<void>;
  cancel(): void;
  dispose(): void;
};

export const browserProjectAnimation: ProjectAnimationAdapter = {
  get available() {
    return typeof Element !== "undefined" && "animate" in Element.prototype;
  },
  animate(element, keyframes, options) {
    const animation = element.animate(keyframes, options);
    return {
      cancel: () => animation.cancel(),
      dispose: () => animation.cancel(),
      finished: animation.finished.then(() => undefined),
    };
  },
};

function motionRun(handles: ProjectMotionHandle[]): ProjectMotionRun {
  return {
    finished: Promise.all(
      handles.map((handle) => handle.finished.catch(() => undefined)),
    ).then(() => undefined),
    cancel() {
      for (const handle of handles) handle.cancel();
    },
    dispose() {
      for (const handle of handles) (handle.dispose ?? handle.cancel)();
    },
  };
}

type MotionSpec = {
  element: HTMLElement;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
};

function safelyAnimate(
  adapter: ProjectAnimationAdapter,
  specs: MotionSpec[],
): ProjectMotionRun | null {
  const handles: ProjectMotionHandle[] = [];
  try {
    for (const spec of specs)
      handles.push(adapter.animate(spec.element, spec.keyframes, spec.options));
  } catch {
    for (const handle of handles) {
      try {
        handle.cancel();
      } catch {
        // An animation setup failure must never strand real navigation.
      }
    }
    return null;
  }
  return motionRun(handles);
}

function projectTiles(): HTMLElement[] {
  const activeProjects = document.querySelector<HTMLElement>(
    '[data-panorama-surface][data-motion-ready="true"] [data-pivot="projects"][data-active="true"]',
  );
  return activeProjects
    ? [...activeProjects.querySelectorAll<HTMLElement>("[data-project-tile]")]
    : [];
}

export function animateProjectExit(
  source: HTMLElement,
  adapter: ProjectAnimationAdapter,
): ProjectMotionRun | null {
  const tiles = projectTiles();
  if (!adapter.available || tiles.length === 0) return null;

  const ordered = [...tiles.filter((tile) => tile !== source), source].filter(
    (tile, index, all) => tiles.includes(tile) && all.indexOf(tile) === index,
  );
  return safelyAnimate(
    adapter,
    ordered.map((tile, index) => ({
      element: tile,
      keyframes: [
        { opacity: 1, rotate: "y 0deg" },
        { opacity: 0, rotate: "y -82deg" },
      ],
      options: {
        delay: Math.min(index * 20, 100),
        duration: 220,
        easing: "cubic-bezier(0.2, 0.75, 0.3, 1)",
        fill: "both",
      },
    })),
  );
}

export function animateProjectEntrance(
  selectedHref: string | undefined,
  adapter: ProjectAnimationAdapter,
): ProjectMotionRun | null {
  const tiles = projectTiles();
  if (!adapter.available || tiles.length === 0) return null;

  const selected = selectedHref
    ? tiles.find((tile) => tile.getAttribute("href") === selectedHref)
    : undefined;
  const reverse = [...tiles].reverse().filter((tile) => tile !== selected);
  const ordered = selected ? [selected, ...reverse] : reverse;

  return safelyAnimate(
    adapter,
    ordered.map((tile, index) => ({
      element: tile,
      keyframes: [
        { opacity: 0, rotate: "y 82deg" },
        { opacity: 1, rotate: "y 0deg" },
      ],
      options: {
        delay: Math.min(index * 20, 100),
        duration: 220,
        easing: "cubic-bezier(0.15, 0.7, 0.25, 1)",
        fill: "both",
      },
    })),
  );
}

export function animateProjectReading(
  direction: "in" | "out",
  adapter: ProjectAnimationAdapter,
): ProjectMotionRun | null {
  const reading = document.querySelector<HTMLElement>("[data-project-reading]");
  if (!adapter.available || !reading) return null;

  return safelyAnimate(adapter, [
    {
      element: reading,
      keyframes:
        direction === "in"
          ? [
              {
                opacity: 0,
                transform: "perspective(80rem) translateX(3rem) rotateY(28deg)",
              },
              {
                opacity: 1,
                transform: "perspective(80rem) translateX(0) rotateY(0deg)",
              },
            ]
          : [
              {
                opacity: 1,
                transform: "perspective(80rem) translateX(0) rotateY(0deg)",
              },
              {
                opacity: 0,
                transform:
                  "perspective(80rem) translateX(-3rem) rotateY(28deg)",
              },
            ],
      options: {
        duration: direction === "in" ? 260 : 220,
        easing: "cubic-bezier(0.15, 0.7, 0.25, 1)",
        fill: "both",
      },
    },
  ]);
}
