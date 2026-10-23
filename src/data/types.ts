export type Tone = "neutral" | "info" | "warn" | "success" | "danger";

export type Block =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "code"; lang?: string; title?: string; code: string; note?: string }
  | { type: "table"; headers: string[]; rows: string[][]; caption?: string }
  | { type: "callout"; tone: Tone; title: string; text: string }
  | { type: "check"; items: { label: string; done?: boolean }[]; title?: string }
  | { type: "kv"; items: { k: string; v: string }[] }
  | { type: "tree"; code: string; title?: string }
  | { type: "ascii"; code: string; title?: string }
  | { type: "flow"; steps: { title: string; text: string }[] }
  | { type: "badges"; items: string[] };

export type DocSection = {
  id: string;
  letter: string;
  title: string;
  subtitle: string;
  blocks: Block[];
};

export type ToolMeta = {
  slug: string;
  index: string;
  name: string;
  binary: string;
  tagline: string;
  short: string;
  description: string;
  icon: "readme" | "env" | "stethoscope" | "branch";
  accent: "lime" | "mint" | "sky" | "amber";
  language: string;
  deps: string;
  loc: string;
  devTime: string;
  priority: "P0" | "P1";
  install: string;
  quickCommand: string;
  keyFlags: string[];
  tags: string[];
};

export type ToolDoc = ToolMeta & {
  preamble: string;
  sections: DocSection[];
};

export type NavSub = { label: string; href: string };
export type NavGroup = { label: string; items: NavSub[] };
