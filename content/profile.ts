export type ProfileLink = {
  label: string;
  href: string;
};

export type SelectedExperience = {
  title: string;
  summary: string;
};

export type Profile = {
  name: string;
  headline: string;
  bio: string;
  leadership: readonly string[];
  links: {
    linkedin: ProfileLink;
    github: ProfileLink;
    dev: ProfileLink;
    codepen: ProfileLink;
    instagram: ProfileLink;
  };
  selectedExperience: readonly SelectedExperience[];
};

export const profile = {
  name: "Ajmal Hassan",
  headline: "technical leader / builder / systems thinker",
  bio:
    "I am pursuing technical-leadership work that combines hands-on engineering, product judgment, and team enablement.",
  leadership: [
    "I directly lead five frontend engineers while staying close to implementation.",
    "I hold cross-functional engineering ownership across five learning squads; that ownership does not imply direct reporting relationships across the squads.",
    "My growth has moved from deep frontend craft toward broader full-stack ownership.",
  ],
  links: {
    linkedin: {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/ajmalhassankn/",
    },
    github: { label: "GitHub", href: "https://github.com/ajmalhassan" },
    dev: { label: "DEV", href: "https://dev.to/ajmalhassan" },
    codepen: { label: "CodePen", href: "https://codepen.io/ajmalhassankn" },
    instagram: {
      label: "Instagram",
      href: "https://www.instagram.com/_ajmalhassan",
    },
  },
  selectedExperience: [
    {
      title: "Frontend leadership",
      summary:
        "Hands-on leadership for a five-person frontend team, with a focus on clear engineering decisions and delivery.",
    },
    {
      title: "Learning systems",
      summary:
        "Cross-functional engineering ownership across five learning squads, described without disclosing employer, product, or internal details.",
    },
    {
      title: "Expanding product ownership",
      summary:
        "A progression from frontend craft into broader full-stack product and system-building work.",
    },
  ],
} as const satisfies Profile;
