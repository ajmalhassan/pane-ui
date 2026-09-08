import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import Resume from "@/app/resume/page";
import { ContactPanel } from "@/components/portfolio/ContactPanel";

it("offers real public contact destinations without inventing an email", () => {
  render(<ContactPanel onClose={() => undefined} />);

  expect(screen.getByRole("link", { name: /linkedin/i })).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/ajmalhassankn/",
  );
  expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute(
    "href",
    "https://github.com/ajmalhassan",
  );
  expect(
    screen.queryByRole("link", { name: /email/i }),
  ).not.toBeInTheDocument();
});

it("keeps detailed employment chronology on LinkedIn while portfolio review is underway", () => {
  const { container } = render(<Resume />);
  const reviewNote = container.querySelector("aside");

  expect(reviewNote).toHaveTextContent(/portfolio content review is complete/i);
  expect(
    within(reviewNote as HTMLElement).getByRole("link", { name: /linkedin/i }),
  ).toHaveAttribute("href", "https://www.linkedin.com/in/ajmalhassankn/");
});
