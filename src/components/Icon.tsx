import type { SVGProps } from "react";

export type IconName =
  | "readme"
  | "env"
  | "stethoscope"
  | "branch"
  | "terminal"
  | "copy"
  | "check"
  | "arrow-right"
  | "arrow-up-right"
  | "search"
  | "menu"
  | "close"
  | "chevron-down"
  | "chevron-right"
  | "github"
  | "command"
  | "alert"
  | "shield"
  | "book"
  | "play"
  | "clock"
  | "spark"
  | "file"
  | "home"
  | "external"
  | "download"
  | "lock"
  | "info"
  | "sun"
  | "moon";

const paths: Record<IconName, React.ReactNode> = {
  readme: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6M9 8h2" />
    </>
  ),
  env: (
    <>
      <path d="M4 7h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M8 3v4M16 3v4M4 11h16" />
      <path d="m10 15 2 2 3-3" />
    </>
  ),
  stethoscope: (
    <>
      <path d="M5 3v5a4 4 0 0 0 8 0V3" />
      <path d="M5 3H3M13 3h2M9 16v1a4 4 0 0 0 8 0v-2" />
      <circle cx="19" cy="13" r="2" />
    </>
  ),
  branch: (
    <>
      <circle cx="6" cy="5" r="2" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="7" r="2" />
      <path d="M6 7v10M18 9v2a4 4 0 0 1-4 4H6" />
    </>
  ),
  terminal: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m7 9 3 3-3 3M13 15h4" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 5V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1" />
    </>
  ),
  check: <path d="m4 12 5 5L20 6" />,
  "arrow-right": <path d="M4 12h16m-6-6 6 6-6 6" />,
  "arrow-up-right": <path d="M7 17 17 7M8 7h9v9" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  github: (
    <path d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.8 9.6.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.4-3.4-1.4-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.2 9.2 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5a10.2 10.2 0 0 0 6.8-9.6C22 6.6 17.5 2 12 2Z" />
  ),
  command: <path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z" />,
  alert: (
    <>
      <path d="M12 3 2.5 20h19z" />
      <path d="M12 9v5M12 17.5v.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4 6v6c0 5 3.4 8.2 8 9.5 4.6-1.3 8-4.5 8-9.5V6z" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  book: (
    <>
      <path d="M4 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4z" />
      <path d="M20 4h-4a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H20z" />
    </>
  ),
  play: <path d="M7 4.5v15l13-7.5z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  spark: <path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3" />,
  file: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
    </>
  ),
  home: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9M9 20v-7h6v7" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </>
  ),
  download: <path d="M12 3v12m-5-5 5 5 5-5M4 20h16" />,
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.5v.5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>
  ),
  moon: (
    <>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </>
  ),
};

type Props = SVGProps<SVGSVGElement> & { name: IconName; size?: number };

export function Icon({ name, size = 18, strokeWidth = 1.7, ...props }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={name === "github" ? "currentColor" : "none"}
      stroke={name === "github" ? "none" : "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
