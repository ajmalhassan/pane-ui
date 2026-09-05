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
