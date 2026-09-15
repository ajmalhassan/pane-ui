import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import Resume, { metadata } from "@/app/(legacy)/resume/page";
import { profile } from "@/content/profile";
/*
 * The no-invented-copy guard below closes over the whole profile rather than a
 * hand-maintained field list, so a fact added to `content/profile.ts` is in the
 * approved set the moment it exists. Same walker as the shipped tripwire in
 * `lib/content/projects.ts`.
 */
import { everyString } from "@/lib/content/strings";

/**
 * The page's own furniture: the words the résumé says that are not facts about
 * Ajmal. They are listed here so the guard below can tell the two apart, and
 * because listing them is what makes an addition to this list a deliberate act
 * with a diff rather than a sentence that quietly appeared on a résumé.
 */
const CHROME: readonly string[] = [
  "AJMAL / PORTFOLIO",
  "12:00",
  "Résumé",
  "Leadership and system building",
  "Selected work",
  "Public profiles",
  "Detailed employment chronology is available through",
  "until the portfolio content review is complete.",
  "Portfolio",
  "Contact",
];

function renderedText(root: HTMLElement): string[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const found: string[] = [];

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.trim() ?? "";
    if (text) found.push(text);
  }

  return found;
}

/*
 * The one thing about this page a reader meets before opening it: the tab, the
 * bookmark, the title of the link someone sends on. The other three detail
 * routes name themselves there; this one was inheriting the root layout's
 * default, which names the site instead of the document.
 */
it("names itself in the browser tab, from the approved profile", () => {
  expect(metadata.title).toBe("Résumé — Ajmal Hassan");
  expect(metadata.description).toBe(profile.bio);
});

it("leads with the name, the headline, and the proposition", () => {
  render(<Resume />);

  const headings = screen.getAllByRole("heading", { level: 1 });

  expect(headings).toHaveLength(1);
  expect(headings[0]).toHaveAccessibleName(profile.name);
  expect(screen.getByText(profile.headline)).toBeVisible();
  expect(screen.getByText(profile.bio)).toBeVisible();
  expect(screen.getByText("AJMAL / PORTFOLIO")).toBeInTheDocument();
});

it("renders the three sections the profile has content for", () => {
  render(<Resume />);

  for (const heading of [
    "Leadership and system building",
    "Selected work",
    "Public profiles",
  ]) {
    expect(
      screen.getByRole("heading", { level: 2, name: heading }),
    ).toBeVisible();
  }

  for (const highlight of profile.leadership) {
    expect(screen.getByText(highlight)).toBeVisible();
  }

  for (const experience of profile.selectedExperience) {
    expect(
      screen.getByRole("heading", { level: 3, name: experience.title }),
    ).toBeVisible();
    expect(screen.getByText(experience.summary)).toBeVisible();
  }
});

/*
 * The chronology is not on this page and the note says where it is. It is the
 * one place the résumé sends a reader off-site for a fact it does not claim.
 */
it("points the employment chronology at LinkedIn", () => {
  render(<Resume />);

  const note = screen
    .getByText(/Detailed employment chronology is available through/)
    .closest("aside");

  expect(note).not.toBeNull();

  const linkedin = within(note!).getByRole("link", { name: "LinkedIn" });

  expect(linkedin).toHaveAttribute("href", profile.links.linkedin.href);
  expect(linkedin).toHaveAttribute("rel", "noreferrer");
});

it("lists every public profile the content declares", () => {
  render(<Resume />);

  /*
   * Scoped to the section, and counted. `getAllByRole(…)[0]` searched the whole
   * document, and the review note directly above this list links to LinkedIn at
   * the same href -- so the assertion that names itself the guard on this list
   * was satisfied by the aside, and filtering LinkedIn out of the list itself
   * left the suite green. The length is what says "every".
   */
  const profiles = screen
    .getByRole("heading", { name: "Public profiles" })
    .closest("section");

  expect(profiles).not.toBeNull();

  const listed = within(profiles!).getAllByRole("link");

  expect(listed).toHaveLength(Object.values(profile.links).length);
  for (const link of Object.values(profile.links)) {
    expect(
      within(profiles!).getByRole("link", { name: link.label }),
    ).toHaveAttribute("href", link.href);
  }
});

/*
 * The résumé is a surface of the same application, so the way back is the
 * application bar's own command and not a bordered web button. Contact stays a
 * primary command here, and stays a real link while it does.
 */
it("docks the résumé's commands in the application bar", () => {
  const { container } = render(<Resume />);

  const back = screen.getByRole("link", { name: "Portfolio" });
  const contact = screen.getByRole("link", { name: "Contact" });

  expect(back).toHaveAttribute("href", "/portfolio");
  expect(back.querySelector("svg")).toBeInTheDocument();
  expect(back.closest('nav[aria-label="Page actions"]')).not.toBeNull();

  expect(contact).toHaveAttribute("href", "/portfolio#contact");
  expect(contact.querySelector("svg")).toBeInTheDocument();

  expect(container.querySelector('[class*="reviewNote"]')).not.toBeNull();
  expect(screen.queryByText(/^back to/i)).toBeNull();

  /*
   * Every other detail surface carries a Résumé command; this page is the
   * résumé, so the command that would point at it is dropped rather than left
   * as a link to the page the reader is already on.
   */
  expect(screen.queryAllByRole("link", { name: "Résumé" })).toHaveLength(0);
});

/*
 * The launch constraint, enforced rather than remembered: the résumé renders
 * `content/profile.ts` and the page's own furniture, and nothing else. A
 * biography, an employer, a date or a metric added here fails this test on the
 * text node that carries it.
 */
it("says nothing the approved profile does not say", () => {
  const { container } = render(<Resume />);
  const approved = new Set([...everyString(profile), ...CHROME]);
  const invented = renderedText(container).filter(
    (text) => !approved.has(text),
  );

  expect(invented).toEqual([]);
});

it("carries no date, employer, or unapproved metric", () => {
  const { container } = render(<Resume />);
  const text = container.textContent ?? "";

  // No year, no rupee figure, no percentage, no headcount-shaped numeral
  // beyond the two approved fives the profile already writes out in words.
  expect(text).not.toMatch(/\b(19|20)\d{2}\b/);
  expect(text).not.toMatch(/₹|\$|\d+\s*%|\bCr\b/);
  expect(text).not.toMatch(/\bpresent\b|\bsince\b|\b\d{4}\s*[–-]\s*\d{4}\b/i);
});
