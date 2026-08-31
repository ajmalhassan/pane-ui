import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it } from "vitest";
import { Panorama } from "@/components/metro/Panorama";

afterEach(cleanup);

it("identifies the active panel without hiding content from the document", () => {
  render(
    <Panorama active="projects" heading="technical leader / builder">
      <section data-pivot="me">Bio</section>
      <section data-pivot="projects">Projects</section>
      <section data-pivot="blog">Blog</section>
      <section data-pivot="photography">Photography</section>
    </Panorama>,
  );
  expect(screen.getByText("Projects").closest("section")).toHaveAttribute(
    "data-active",
    "true",
  );
  expect(screen.getByText("Bio")).toBeInTheDocument();
});

it("keeps panels ordered while removing inactive panels from interaction", () => {
  const { container } = render(
    <Panorama active="blog" heading="technical leader / builder">
      <section data-pivot="me">Bio</section>
      <section data-pivot="projects">Projects</section>
      <section data-pivot="blog">Blog</section>
      <section data-pivot="photography">Photography</section>
    </Panorama>,
  );

  const panels = screen.getAllByRole("tabpanel", { hidden: true });
  expect(panels.map((panel) => panel.dataset.pivot)).toEqual([
    "me",
    "projects",
    "blog",
    "photography",
  ]);
  expect(panels[0]).toHaveAttribute("aria-labelledby", "pivot-tab-me");
  expect(panels[0]).toHaveAttribute("aria-hidden", "true");
  expect(panels[0]).toHaveAttribute("inert");
  expect(panels[2]).toHaveAttribute("aria-hidden", "false");
  expect(panels[2]).not.toHaveAttribute("inert");
  expect(container.firstElementChild).toHaveStyle({ "--panorama-index": "2" });
});

it("collapses inactive panel height while preserving the active panel layout", () => {
  render(
    <Panorama active="blog" heading="technical leader / builder">
      <section data-pivot="me" style={{ height: "40rem", overflow: "visible" }}>
        Bio
      </section>
      <section data-pivot="projects">Projects</section>
      <section
        data-pivot="blog"
        style={{ height: "12rem", overflow: "visible" }}
      >
        Blog
      </section>
      <section data-pivot="photography">Photography</section>
    </Panorama>,
  );

  const panels = screen.getAllByRole("tabpanel", { hidden: true });
  expect(panels[0]).toHaveStyle({ height: "0px", overflow: "hidden" });
  expect(panels[2].style.height).toBe("12rem");
  expect(panels[2].style.overflow).toBe("visible");
});

it("rejects a panorama without exactly one section per pivot in development", () => {
  expect(() =>
    renderToStaticMarkup(
      <Panorama active="me" heading="technical leader / builder">
        <section data-pivot="me">Bio</section>
      </Panorama>,
    ),
  ).toThrow(/exactly one section for each pivot/i);
});
