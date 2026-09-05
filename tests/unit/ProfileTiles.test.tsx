import { act, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileTiles } from "@/components/portfolio/ProfileTiles";
import { profile } from "@/content/profile";

const { start } = profile;

/** Role and size, in DOM order -- which the grid lays out as visual order. */
const APPROVED_GRID: readonly [string, string][] = [
  ["display", "hero"], // capability graph -- current work leads
  ["display", "large"], // portrait
  ["live", "wide"], // cycling evidence
  ["display", "wide"], // 5 direct reports
  ["display", "wide"], // 5 learning squads
  ["live", "wide"], // live AI assessment
  ["display", "small"], // the craft arrow, captioned `full stack`
  ["display", "small"], // Lumia 520
  ["display", "wide"], // leadership method
];

/**
 * Named positions into `APPROVED_GRID` (and the rendered tile list, which is
 * the same order), so a test that must address one specific tile reads as
 * what it means rather than as a number a reader has to look up. Only the
 * two this file addresses are named here; the E2E spec names its own two
 * (`CRAFT`, `LEADERSHIP`) beside `ME_TILES`/`ME_UNITS`.
 */
const HERO = 0; // capability graph
const ASSESSMENT = 5; // live AI assessment

function tiles(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>("[data-tile-role]")];
}

it("renders the approved Start-screen composition in one grid", () => {
  const { container } = render(<ProfileTiles />);

  expect(
    tiles(container).map((tile) => [
      tile.dataset.tileRole,
      tile.dataset.tileSize,
    ]),
  ).toEqual(APPROVED_GRID);
  expect(container.querySelector("[data-tile-grid]")).not.toBeNull();
});

it("leads with the approved portrait, evidence, current work, and Lumia", () => {
  render(<ProfileTiles />);

  expect(
    screen.getByRole("img", { name: "Portrait of Ajmal Hassan" }),
  ).toBeVisible();
  expect(
    screen.getByLabelText(
      /5 frontend engineers.*5 learning squads.*AI-native systems/i,
    ),
  ).toBeVisible();
  expect(screen.getByText("capability graph", { exact: false })).toBeVisible();
  expect(screen.getByText("520", { exact: true })).toBeVisible();
});

it("keeps the app bar's own destinations out of the grid", () => {
  const { container } = render(<ProfileTiles />);

  expect(container.querySelectorAll("a")).toHaveLength(0);
  expect(container.querySelector('[href="/resume"]')).toBeNull();
  expect(container.querySelector('[href="#contact"]')).toBeNull();
  expect(screen.queryByRole("link")).toBeNull();
});

/*
 * Only the two live tiles own an interaction, and each of them owns exactly
 * one: activating a live tile advances it. Every other tile is static evidence
 * with no affordance at all.
 */
it("gives only the two live tiles an interactive owner", () => {
  const { container } = render(<ProfileTiles />);

  const buttons = [...container.querySelectorAll("button")];
  expect(buttons).toHaveLength(2);
  expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
    start.evidence.summary,
    start.assessment.summary,
  ]);
});

describe("the static tiles", () => {
  it("writes every fact as text, including the ones a glyph stands in for", () => {
    const { container } = render(<ProfileTiles />);

    // The craft tile's motif is an SVG arrow; the fact itself stays readable.
    expect(screen.getByText(start.craft.equivalent)).toBeInTheDocument();
    expect(screen.getByText(start.squads.note)).toBeInTheDocument();
    expect(screen.getByText(start.team.note)).toBeInTheDocument();
    expect(screen.getByText(start.lumia.note)).toBeInTheDocument();
    expect(screen.getByText(start.leadership.note)).toBeInTheDocument();
    // No Unicode stand-ins for iconography anywhere on the Start screen.
    expect(container.textContent ?? "").not.toMatch(/[→←↗↔⟶]/);
  });

  /*
   * The two motifs that share a box with copy -- the hero's capability graph
   * and the assessment tile's waveform -- are rendered after it, which is what
   * lets each take the band the copy leaves instead of being drawn across it.
   * Reversing this in JSX would put a lit cyan node back on the word
   * "assessment" at 320, and no assertion about styles would catch it, so the
   * DOM order itself is the contract. (The craft tile's arrow is different: it
   * is copy, laid out in flow, and it leads its own tile.)
   */
  it("draws the graph and the waveform after the copy they sit under", () => {
    const { container } = render(<ProfileTiles />);
    const tiles = [
      ...container.querySelectorAll<HTMLElement>("[data-tile-role]"),
    ];

    for (const tile of [tiles[HERO], tiles[ASSESSMENT]]) {
      const svg = tile.querySelector("svg") as SVGElement;
      const face = svg.parentElement as HTMLElement;
      const children = [...face.children];
      const copy = children.findIndex((child) => child.textContent?.trim());

      expect(copy).toBeGreaterThanOrEqual(0);
      expect(children.indexOf(svg)).toBeGreaterThan(copy);
    }
  });

  it("captions the craft tile with the fact, not the tile's name", () => {
    render(<ProfileTiles />);

    // The arrow is a drawn glyph, so the caption is what says where it points.
    expect(screen.getByText(start.craft.label)).toBeVisible();
    expect(start.craft.label).toMatch(/full stack/i);
  });

  it("hides every decorative graphic from assistive technology", () => {
    const { container } = render(<ProfileTiles />);

    const svgs = [...container.querySelectorAll("svg")];
    expect(svgs.length).toBeGreaterThan(0);
    for (const svg of svgs) {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    }
  });
});

describe("the live tiles", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function advanceBy(ms: number) {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  }

  function evidence() {
    return screen.getByRole("button", { name: start.evidence.summary });
  }

  it("server-renders a meaningful first claim before any timer runs", () => {
    render(<ProfileTiles />);

    expect(evidence()).toHaveAttribute("data-live-index", "0");
    expect(
      within(evidence()).getByText(start.evidence.claims[0].claim),
    ).toBeInTheDocument();
  });

  it("cycles the evidence every six seconds without renaming itself", () => {
    render(<ProfileTiles />);

    advanceBy(6000);
    expect(evidence()).toHaveAttribute("data-live-index", "1");
    expect(
      within(evidence()).getByText(start.evidence.claims[1].claim),
    ).toBeInTheDocument();

    // Twelve seconds is deliberately not a whole lap of a three-claim set.
    advanceBy(6000);
    expect(evidence()).toHaveAttribute("data-live-index", "2");
    expect(evidence()).toHaveAccessibleName(start.evidence.summary);
  });

  function assessment() {
    return screen.getByRole("button", { name: start.assessment.summary });
  }

  /*
   * The same six-second beat, half a beat out of phase. Two live tiles on one
   * Start screen changing together read as a screen that blinks; offset by
   * 3000ms they read as a screen that is alive. The offset delays only the
   * first change, so the two never converge later either.
   */
  it("cycles the AI assessment tile on the same beat, three seconds behind", () => {
    render(<ProfileTiles />);

    expect(assessment()).toHaveAttribute("data-live-index", "0");

    // The evidence tile has already changed here; this one has not.
    advanceBy(6000);
    expect(assessment()).toHaveAttribute("data-live-index", "0");

    advanceBy(3000);
    expect(assessment()).toHaveAttribute("data-live-index", "1");

    advanceBy(6000);
    expect(assessment()).toHaveAttribute("data-live-index", "2");
  });

  /*
   * The claim the offset exists to make, measured rather than reasoned about:
   * across a whole lap of both tiles, no two changes land inside the same
   * second. A shared phase would put every one of them on the same tick.
   */
  it("never changes both live tiles inside the same second", () => {
    render(<ProfileTiles />);

    const seen = { evidence: "0", assessment: "0" };
    const changes: { at: number; tile: string }[] = [];

    for (let elapsed = 250; elapsed <= 30_000; elapsed += 250) {
      advanceBy(250);
      const now = {
        evidence: evidence().getAttribute("data-live-index") ?? "",
        assessment: assessment().getAttribute("data-live-index") ?? "",
      };
      for (const tile of ["evidence", "assessment"] as const) {
        if (now[tile] !== seen[tile]) changes.push({ at: elapsed, tile });
        seen[tile] = now[tile];
      }
    }

    expect(changes.map((change) => `${change.tile}@${change.at}`)).toEqual([
      "evidence@6000",
      "assessment@9000",
      "evidence@12000",
      "assessment@15000",
      "evidence@18000",
      "assessment@21000",
      "evidence@24000",
      "assessment@27000",
      "evidence@30000",
    ]);

    for (const [index, change] of changes.entries()) {
      const previous = changes[index - 1];
      if (previous)
        expect(change.at - previous.at).toBeGreaterThanOrEqual(1000);
    }
  });
});
