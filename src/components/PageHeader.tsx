import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export function PageHeader({
  kicker,
  title,
  intro,
  meta,
  actions,
  aside,
  sidekick,
  compact = false,
}: {
  kicker: string;
  title: ReactNode;
  intro: string;
  meta?: { label: string; value: string }[];
  actions?: ReactNode;
  aside?: ReactNode;
  sidekick?: ReactNode;
  compact?: boolean;
}) {
  return (
    <header className="relative overflow-hidden border-b border-line">
      <div className="grid-paper pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_96%)]" aria-hidden="true" />
      <div
        className={cn(
          "relative mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-6 px-4 sm:px-6",
          sidekick && "lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center lg:gap-10",
          compact ? "py-9 sm:py-11" : "py-11 sm:py-14",
        )}
      >
        <div className={cn("grid grid-cols-1 gap-8", aside && "lg:grid-cols-[1.35fr_0.65fr] lg:items-end")}>
          <div>
            <p className="flex items-center gap-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-deep/70" aria-hidden="true" />
              {kicker}
            </p>
            <h1
              className={cn(
                "mt-3 font-display font-medium leading-[1.02] tracking-[-0.045em] text-ink",
                compact ? "text-[1.9rem] sm:text-[2.4rem]" : "text-[2.15rem] sm:text-[2.9rem]",
              )}
            >
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-[15px] leading-[1.75] text-ink-soft">{intro}</p>
            {actions && <div className="mt-6 flex flex-wrap items-center gap-2.5">{actions}</div>}
          </div>
          {aside && <div className="lg:justify-self-end">{aside}</div>}
        </div>

        {sidekick}

        {meta && meta.length > 0 && (
          <dl className={cn("mt-2 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line/80 pt-5 sm:grid-cols-4", sidekick && "lg:col-span-2 lg:mt-0")}>
            {meta.map((item) => (
              <div key={item.label}>
                <dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-faint">{item.label}</dt>
                <dd className="mt-1 text-[13px] font-medium text-ink">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </header>
  );
}

const SUITE = [
  { name: "readme-gen", note: "CHANGELOG · README", code: "0 / 1 / 2" },
  { name: "env-doctor", note: "variables · secrets", code: "0 / 1 / 2" },
  { name: "project-doctor", note: "santé · score 0-100", code: "0 / 1 / 2" },
  { name: "branch-cleaner", note: "branches · dry-run", code: "0 / 1 / 2" },
];

export function SuiteSidekick() {
  return (
    <div className="relative w-full min-w-0 overflow-hidden rounded-xl border border-line bg-cream/90 shadow-[0_20px_50px_-40px_rgba(23,24,15,0.5)]">
      <div className="flex items-center justify-between border-b border-line bg-paper-2/70 px-3 py-2">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">La suite en un regard</span>
        <span className="rounded-full border border-line bg-cream px-1.5 py-0.5 font-mono text-[9px] text-muted">v0.1.1</span>
      </div>
      <ul className="divide-y divide-line/70">
        {SUITE.map((tool, index) => (
          <li key={tool.name}>
            <a href={`#/docs/${tool.name}`} className="group flex items-center gap-2.5 px-3 py-2 transition hover:bg-lime-soft/40">
              <span className="font-mono text-[9px] text-faint">0{index + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-[11px] font-medium text-ink">{tool.name}</span>
                <span className="block truncate text-[10.5px] text-muted">{tool.note}</span>
              </span>
              <span className="shrink-0 font-mono text-[9px] text-faint">exit {tool.code}</span>
              <span className="font-mono text-[10px] text-lime-deep opacity-0 transition group-hover:opacity-100">→</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-line bg-paper-2/50 px-3 py-1.5 font-mono text-[9.5px] text-muted">
        <span>Node ≥ 18.17 · MIT</span>
        <span className="inline-flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-[#77a74a]" /> prêt pour la CI</span>
      </div>
    </div>
  );
}
