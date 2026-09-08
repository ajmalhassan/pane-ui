import { projects as projectData } from "@/content/projects";
import { everyString } from "./strings";
import { TILE_BUDGET_SIZES, TILE_COPY_BUDGET } from "./tileBudget";

export type ProjectStatus = "concept" | "in-progress" | "shipped";

export type ProjectSection = {
  heading: string;
  body: string;
};

/**
 * The tile sizes a project face may ask for -- the same list `TILE_COPY_BUDGET`
 * is keyed by, so the two cannot drift apart. `small` is deliberately absent: a
 * 1x1 tile is 67px square on a phone and carries a glyph or a numeral, which is
 * not what a case-study destination needs.
 */
export const PROJECT_TILE_SIZES = TILE_BUDGET_SIZES;
export type ProjectTileSize = (typeof PROJECT_TILE_SIZES)[number];

/**
 * One role, stated rather than assumed: every project tile is a navigation
 * tile, so the whole rectangle is the case study's link and no second control
 * can collide with the copy above it. Facts on these faces are static -- the
 * spec only says short facts *may* update, MetroTile has no combined
 * live+navigation role, and Me already owns the single Phase 2 live cycle.
 */
export const PROJECT_TILE_ROLES = ["navigation"] as const;
export type ProjectTileRole = (typeof PROJECT_TILE_ROLES)[number];

export type Project = {
  slug: string;
  title: string;
  summary: string;
  status: ProjectStatus;
  metric?: string;
  accent: "cyan" | "blue" | "ink";
  sections: ProjectSection[];
  /** How many grid units the tile spans. */
  tileSize: ProjectTileSize;
  tileRole: ProjectTileRole;
  /** The caption on the tile's bottom edge: the short destination name. */
  tileLabel: string;
  /** The evidence on the face -- what makes this project worth opening. */
  tileHeadline: string;
  /** One supporting line, on the sizes that paint a body. */
  tileClaim?: string;
  /**
   * Paint the project's own `metric` as the numeral on the face. The numeral
   * is never authored twice: there is one approved string per project and it
   * lives in `metric`, so this field only says whether the tile shows it.
   */
  showsMetric?: true;
};

/**
 * The one approved public metric, and the one project allowed to carry it.
 * This is a publication constraint, not a style rule: the number is cleared for
 * that case study and nowhere else on the site, so it is enforced where the
 * content is validated rather than left to review.
 */
const APPROVED_METRIC = "₹1Cr+";
const APPROVED_METRIC_SLUG = "lead-platform";

/**
 * The two ways a case study says it is a draft, which have to agree.
 *
 * Draft-ness is encoded three times on purpose while the drafts are temporary:
 * this title prefix, this caption suffix, and `status`. The caption is the only
 * one a reader meets on the Start screen, so the cross-check below keeps it
 * from drifting away from the page it opens.
 */
const DRAFT_TITLE_PREFIX = "Draft example —";
const DRAFT_CAPTION_SUFFIX = "· draft";

/**
 * Does this value carry the one approved public metric, anywhere inside it --
 * a summary, a tile face, a nested section body?
 *
 * It is a tripwire for the exact token, not a semantic filter: "over one crore"
 * passes it, and always will. What it does close is the accident -- the number
 * pasted into a second case study, in whatever casing the author typed. Both
 * `validateProjects` and `tests/unit/ProjectContent.test.ts` ask through here,
 * so the shipped rule and the test's idea of it cannot drift apart.
 */
export function carriesMetric(value: unknown): boolean {
  const approved = APPROVED_METRIC.toLowerCase();

  return everyString(value).some((text) =>
    text.toLowerCase().includes(approved),
  );
}

export function validateProjects(projects: readonly Project[]): Project[] {
  const slugs = new Set<string>();

  return projects.map((project) => {
    for (const field of [
      "slug",
      "title",
      "summary",
      "tileLabel",
      "tileHeadline",
    ] as const) {
      if (!project[field].trim()) {
        throw new Error(`Project ${field} is required`);
      }
    }

    if (slugs.has(project.slug)) {
      throw new Error(`Duplicate project slug: ${project.slug}`);
    }

    slugs.add(project.slug);

    /*
     * `content/projects.ts` is `satisfies Project[]`, so TypeScript already
     * rejects a bad size or role there. These two run anyway, because the
     * validator is the boundary a future data source (MDX, a CMS, a fixture)
     * would come through, and a widened `includes` is the only way to ask the
     * question at runtime.
     */
    if (!(PROJECT_TILE_SIZES as readonly string[]).includes(project.tileSize)) {
      throw new Error(
        `Project ${project.slug} has an unsupported tileSize: ${project.tileSize}`,
      );
    }

    if (!(PROJECT_TILE_ROLES as readonly string[]).includes(project.tileRole)) {
      throw new Error(
        `Project ${project.slug} has an unsupported tileRole: ${project.tileRole}`,
      );
    }

    /*
     * A face carries a claim or a numeral, never both. Not a style preference:
     * `--tile-value-size` is budgeted the whole copy region while
     * `--tile-title-budget` takes another 46% of it, so a `hero` at 320 asked
     * for all three needs 134.2px of a 100px region and a `large` 120.6px of
     * the same. The rule used to live only in a test over the shipped array,
     * which is the wrong place by this file's own standard -- the validator is
     * the boundary a future data source comes through.
     */
    if (project.tileClaim && project.showsMetric) {
      throw new Error(
        `Project ${project.slug} sets both tileClaim and showsMetric; a face carries a claim or a numeral, never both`,
      );
    }

    if (project.showsMetric && !project.metric?.trim()) {
      throw new Error(
        `Project ${project.slug} sets showsMetric, so metric is required`,
      );
    }

    const budget = TILE_COPY_BUDGET[project.tileSize];

    /*
     * The fourth column is what the size does *not* paint, so a zero budget
     * rejects with the right noun: `label` and `headline` are painted by every
     * size and can never be zero, `claim` and the numeral each can.
     */
    for (const [field, text, allowed, unpainted] of [
      ["tileLabel", project.tileLabel, budget.label, ""],
      ["tileHeadline", project.tileHeadline, budget.headline, ""],
      ["tileClaim", project.tileClaim, budget.claim, "paints no body line"],
      [
        "metric",
        project.showsMetric ? project.metric : undefined,
        budget.value,
        "has no room for a numeral above its headline",
      ],
    ] as const) {
      if (text === undefined) continue;

      if (allowed === 0) {
        throw new Error(
          `Project ${project.slug} sets ${field} on a ${project.tileSize} tile, which ${unpainted}`,
        );
      }

      if (text.length > allowed) {
        throw new Error(
          `Project ${project.slug} ${field} is ${text.length} characters; a ${project.tileSize} tile holds ${allowed}`,
        );
      }
    }

    /*
     * The `Draft example —` title and the `· draft` caption are two encodings
     * of one fact, and a reader meets the caption first. Either both or
     * neither.
     */
    if (
      project.title.startsWith(DRAFT_TITLE_PREFIX) !==
      project.tileLabel.endsWith(DRAFT_CAPTION_SUFFIX)
    ) {
      throw new Error(
        `Project ${project.slug} disagrees about being a draft: title "${project.title}" and caption "${project.tileLabel}"`,
      );
    }

    if (project.slug !== APPROVED_METRIC_SLUG && carriesMetric(project)) {
      throw new Error(
        `Project ${project.slug} claims ${APPROVED_METRIC}, which is approved for ${APPROVED_METRIC_SLUG} only`,
      );
    }

    return project;
  });
}

export const projects = validateProjects(projectData);

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
