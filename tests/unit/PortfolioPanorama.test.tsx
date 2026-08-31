import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { PortfolioPanorama } from "@/components/portfolio/PortfolioPanorama";
import { projects } from "@/lib/content/projects";

afterEach(cleanup);

it("renders the Me-first portfolio with link-owned navigation", () => {
  render(
    <PortfolioPanorama initialPivot="me" projects={projects} posts={[]} />,
  );

  expect(screen.getByRole("tab", { name: "Me" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(
    screen.getByRole("heading", { name: /technical leader/i }),
  ).toBeVisible();
  expect(screen.getByRole("tab", { name: "Projects" })).toHaveAttribute(
    "href",
    "/?view=projects",
  );
  expect(screen.getByRole("link", { name: "Résumé" })).toHaveAttribute(
    "href",
    "/resume",
  );
});

it("updates the selected pivot without taking URL ownership from the link", () => {
  render(
    <PortfolioPanorama initialPivot="me" projects={projects} posts={[]} />,
  );
  const projectsTab = screen.getByRole("tab", { name: "Projects" });
  projectsTab.addEventListener("click", (event) => event.preventDefault());

  fireEvent.click(projectsTab);

  expect(projectsTab).toHaveAttribute("aria-selected", "true");
  expect(projectsTab).toHaveAttribute("href", "/?view=projects");
  expect(screen.getByText("Lumia Metro Revival")).toBeVisible();
});

it("restores selection when server query state changes", () => {
  const { rerender } = render(
    <PortfolioPanorama initialPivot="me" projects={projects} posts={[]} />,
  );

  rerender(
    <PortfolioPanorama
      initialPivot="photography"
      projects={projects}
      posts={[]}
    />,
  );

  expect(screen.getByRole("tab", { name: "Photography" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

it("enhances the contact destination and returns focus when it closes", async () => {
  const user = userEvent.setup();
  render(
    <PortfolioPanorama initialPivot="me" projects={projects} posts={[]} />,
  );
  const contact = screen.getByRole("link", { name: "Contact" });
  contact.addEventListener("click", (event) => event.preventDefault());

  expect(contact).toHaveAttribute("href", "#contact");
  expect(document.getElementById("contact")).toBeInTheDocument();

  await user.click(contact);
  expect(document.getElementById("contact")).toHaveAttribute(
    "data-open",
    "true",
  );

  await user.click(screen.getByRole("button", { name: "Close contact" }));
  expect(contact).toHaveFocus();
});
