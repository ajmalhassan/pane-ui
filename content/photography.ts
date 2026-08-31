export type PhotographyEntry =
  | {
      id: string;
      kind: "image";
      title: string;
      src: string;
      alt: string;
      note: string;
    }
  | {
      id: string;
      kind: "placeholder";
      title: string;
      note: string;
    };

export const photography = [
  {
    id: "portrait",
    kind: "image",
    title: "Portrait",
    src: "/portrait.jpg",
    alt: "Portrait of Ajmal Hassan",
    note: "A face behind the systems.",
  },
  {
    id: "streets-in-transit",
    kind: "placeholder",
    title: "streets / in transit",
    note: "A typographic placeholder for a future travel frame.",
  },
  {
    id: "light-and-geometry",
    kind: "placeholder",
    title: "light / geometry",
    note: "A typographic placeholder for a future architecture frame.",
  },
] satisfies PhotographyEntry[];
