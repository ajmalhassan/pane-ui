export function Glyph({
  name,
  size = 44,
}: {
  name: "mail" | "people" | "arrow" | "code" | "photo" | "music" | "sun";
  size?: number;
}) {
  const paths = {
    mail: (
      <>
        <rect x="4" y="9" width="40" height="29" />
        <path d="m5 10 19 16 19-16" />
      </>
    ),
    people: (
      <>
        <circle cx="17" cy="16" r="7" />
        <circle cx="34" cy="18" r="5" />
        <path d="M4 40v-7c0-7 26-7 26 0v7M32 28c8-1 12 2 12 6v6" />
      </>
    ),
    arrow: <path d="M8 24h32M27 11l13 13-13 13" />,
    code: (
      <>
        <path d="m17 12-12 12 12 12m14-24 12 12-12 12M27 6l-6 36" />
      </>
    ),
    photo: (
      <>
        <rect x="5" y="7" width="38" height="34" />
        <circle cx="32" cy="17" r="4" />
        <path d="m5 34 12-13 12 13 7-6 7 7" />
      </>
    ),
    music: (
      <>
        <path d="M19 34V10l21-4v24M19 16l21-4" />
        <ellipse cx="12" cy="35" rx="7" ry="5" />
        <ellipse cx="33" cy="31" rx="7" ry="5" />
      </>
    ),
    sun: (
      <>
        <circle cx="24" cy="24" r="9" />
        <path d="M24 2v7m0 30v7M2 24h7m30 0h7M8 8l5 5m22 22 5 5M8 40l5-5m22-22 5-5" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
