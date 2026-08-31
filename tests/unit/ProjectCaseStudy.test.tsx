import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ProjectCaseStudy } from "@/components/portfolio/ProjectCaseStudy";
import { getProject } from "@/lib/content/projects";

it("renders role, constraints, decisions, outcomes, and lessons", () => {
  render(<ProjectCaseStudy project={getProject("metro-revival")!} />);

  for (const heading of [
    "Problem and users",
    "Role and team",
    "Constraints and risks",
    "Decisions and trade-offs",
    "Outcome and evidence",
    "Lessons and next questions",
  ]) {
    expect(screen.getByRole("heading", { name: heading })).toBeVisible();
  }
});
