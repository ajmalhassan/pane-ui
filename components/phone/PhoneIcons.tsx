import type { SVGProps } from "react";
export type IconName =
  | "messages"
  | "people"
  | "photos"
  | "settings"
  | "phone"
  | "mail"
  | "back"
  | "start"
  | "search"
  | "arrow"
  | "add"
  | "send"
  | "sun"
  | "music"
  | "signal"
  | "wifi";
const paths: Record<IconName, string> = {
  signal: "M3 18v4h2v-4z M9 13v9h2v-9z M15 8v14h2V8z M21 2v20h2V2z",
  wifi: "M2 8a15 15 0 0 1 20 0 M5 12a10 10 0 0 1 14 0 M8 16a6 6 0 0 1 8 0 M11 20h2",
  messages: "M3 4h18v13H11l-5 4v-4H3z M7 9h10 M7 12h7",
  people:
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M2 21v-3a7 7 0 0 1 14 0v3 M17 4a4 4 0 0 1 0 8 M19 15a6 6 0 0 1 3 6",
  photos: "M3 3h18v18H3z M4 18l6-7 4 4 3-3 4 5 M15 7h.01",
  settings:
    "M10 2h4l1 4 4-1 2 4-3 3 3 3-2 4-4-1-1 4h-4l-1-4-4 1-2-4 3-3-3-3 2-4 4 1z M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0",
  phone: "M5 2l5 5-3 3c2 4 3 5 7 7l3-3 5 5c-7 9-24-8-17-17z",
  mail: "M2 5h20v15H2z M2 5l10 8L22 5",
  back: "M10 5l-7 7 7 7 M3 12h12a6 6 0 0 1 6 6",
  start:
    "M3 5l8-1v7H3z M13 3.75L23 2v9H13z M3 13h8v7l-8-1z M13 13h10v9l-10-1.75z",
  search: "M16 10a6 6 0 1 0-12 0 6 6 0 0 0 12 0 M15 15l7 7",
  arrow: "M3 12h18 M14 5l7 7-7 7",
  add: "M12 3v18 M3 12h18",
  send: "M2 3l20 9-20 9 4-9z M6 12h16",
  sun: "M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0 M12 1v3 M12 20v3 M1 12h3 M20 12h3 M4 4l2 2 M18 18l2 2 M20 4l-2 2 M6 18l-2 2",
  music:
    "M9 18V5l12-3v13 M9 5v4l12-3 M9 18c0 4-7 4-7 0s7-4 7 0 M21 15c0 4-7 4-7 0s7-4 7 0",
};
export function PhoneIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="miter"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
export function Landscape({ variant = 0 }: { variant?: number }) {
  const skies = ["#dec495", "#91bac8", "#e49885", "#b5b69a"];
  return (
    <svg
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={
        [
          "Golden mountains at sunset",
          "Coastal cliffs and blue water",
          "Desert dunes at dusk",
          "Misty forest",
        ][variant % 4]
      }
    >
      <path fill={skies[variant % 4]} d="M0 0h400v400H0z" />
      <circle cx={290 - variant * 30} cy="95" r="36" fill="#fff3ca" />
      <path
        d="M0 255 110 112 220 275 310 185 400 254V400H0"
        fill={["#746e79", "#457282", "#bb675b", "#697a6b"][variant % 4]}
      />
      <path
        d="M0 320 110 238 228 335 400 255V400H0"
        fill={["#424852", "#194c64", "#803c43", "#344d44"][variant % 4]}
      />
      <path d="M0 374 188 310 400 372V400H0" fill="#162d38" />
    </svg>
  );
}
export function Portrait({ index = 0 }: { index?: number }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path
        fill={
          ["#bb5b3d", "#397d84", "#62587c", "#be944b", "#556b83", "#8d626e"][
            index % 6
          ]
        }
        d="M0 0h100v100H0z"
      />
      <path fill="#202c37" d="M12 100c0-41 76-41 76 0" />
      <ellipse
        fill={["#e2ad83", "#985f46", "#c98d61"][index % 3]}
        cx="50"
        cy="43"
        rx="22"
        ry="27"
      />
      <path
        fill="#282426"
        d={
          index % 2
            ? "M27 45V23q24-24 47 3l-2 25-10-25-34 10z"
            : "M25 51V30q-2-27 26-26 31 0 27 40l-9-22-37 7-1 27z"
        }
      />
    </svg>
  );
}
