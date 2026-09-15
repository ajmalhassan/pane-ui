import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ProjectCaseStudy } from "@/components/portfolio/ProjectCaseStudy";
import { getProject, projects } from "@/lib/content/projects";

const STORY = [
  "Problem and users",
  "Role and team",
  "Constraints and risks",
  "Decisions and trade-offs",
  "Outcome and evidence",
  "Lessons and next questions",
];

const BACK = { label: "Projects", href: "/portfolio?view=projects" } as const;

it("renders role, constraints, decisions, outcomes, and lessons", () => {
  render(<ProjectCaseStudy project={getProject("metro-revival")!} />);

  for (const heading of STORY) {
    expect(screen.getByRole("heading", { name: heading })).toBeVisible();
  }
});

/*
 * Every project has a route, so every project has to tell the whole story --
 * a draft included, which says what it can and says the rest needs approval.
 */
it.each(projects.map((project) => project.slug))(
  "tells the same story on %s",
  (slug) => {
    const project = getProject(slug)!;
    render(<ProjectCaseStudy project={project} />);

    expect(
      screen.getByRole("heading", { level: 1, name: project.title }),
    ).toBeVisible();
    expect(screen.getByText(project.summary)).toBeVisible();

    for (const heading of STORY) {
      expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    }
  },
);

/*
 * A case study is a page of the same application the panorama is, not a
 * document that happens to share its colours: the identity line opens it, one
 * heading names it, the status it carries is written out, and the way back is
 * the application bar's own command.
 */
it("opens on the application identity line and one page heading", () => {
  const project = getProject("lead-platform")!;
  render(<ProjectCaseStudy project={project} />);

  expect(screen.getByText("AJMAL / PORTFOLIO")).toBeInTheDocument();
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByText("Status: shipped")).toBeVisible();
});

it.each(projects.map((project) => project.slug))(
  "writes the status of %s out in words",
  (slug) => {
    const project = getProject(slug)!;
    render(<ProjectCaseStudy project={project} />);

    expect(
      screen.getByText(`Status: ${project.status.replace(/-/g, " ")}`),
    ).toBeVisible();
  },
);

it("leaves the way back to the application bar's own command", () => {
  const { container } = render(
    <ProjectCaseStudy project={getProject("lead-platform")!} />,
  );

  const back = screen.getByRole("link", { name: BACK.label });

  expect(back).toHaveAttribute("href", BACK.href);
  expect(back).toHaveAccessibleName(BACK.label);
  expect(back).toHaveAttribute("data-project-return", "true");
  // A drawn command, not a text arrow: the MetroIcon `back` glyph.
  expect(back.querySelector("svg")).toBeInTheDocument();
  expect(back.closest('nav[aria-label="Page actions"]')).not.toBeNull();

  // The bordered web button this replaces, in both of the ways it could
  // survive: the class that drew its box, and the copy that named it.
  expect(container.querySelector('[class*="returnLink"]')).toBeNull();
  expect(screen.queryByText(/^back to/i)).toBeNull();
});

it("marks only the project reading column as the route motion surface", () => {
  const project = getProject("lead-platform")!;
  const { container } = render(<ProjectCaseStudy project={project} />);

  const reading = container.querySelector("[data-project-reading]");
  expect(reading).not.toBeNull();
  expect(reading).toContainElement(
    screen.getByRole("heading", { level: 1, name: project.title }),
  );
  expect(reading?.tagName).toBe("DIV");
  expect(reading?.closest("main")).not.toHaveAttribute("data-project-reading");
});

/*
 * Résumé and contact are the application's primary commands and stay on the
 * bar here: a hiring manager who arrives on a case study reaches either in one
 * command rather than by going back to the panorama first.
 */
it("keeps résumé and contact primary beside the way back", () => {
  render(<ProjectCaseStudy project={getProject("lead-platform")!} />);

  const resume = screen.getByRole("link", { name: "Résumé" });
  const contact = screen.getByRole("link", { name: "Contact" });

  expect(resume).toHaveAttribute("href", "/resume");
  expect(contact).toHaveAttribute("href", "/portfolio#contact");

  for (const command of [resume, contact]) {
    expect(command.querySelector("svg")).toBeInTheDocument();
    expect(command.closest('nav[aria-label="Page actions"]')).not.toBeNull();
  }

  // Back first, then the two primaries, in the panorama's own order.
  const commands = screen.getAllByRole("link");
  expect(commands.map((command) => command.textContent)).toEqual([
    BACK.label,
    "Résumé",
    "Contact",
  ]);
});

/*
 * The eyebrow that read "Lumia / portfolio" said what the status line already
 * says, one line above it, on every surface.
 */
it("states the application identity once", () => {
  render(<ProjectCaseStudy project={getProject("metro-revival")!} />);

  expect(screen.queryByText(/lumia \/ portfolio/i)).toBeNull();
  expect(screen.getAllByText("AJMAL / PORTFOLIO")).toHaveLength(1);
});
