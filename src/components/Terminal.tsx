import { cn } from "../utils/cn";
import type { Demo, DemoTone } from "../data/demos";
import { CopyButton } from "./CopyButton";
import { Icon } from "./Icon";

const toneClass: Record<DemoTone, string> = {
  default: "text-[#e6e4d8]",
  dim: "text-[#8b9182]",
  accent: "text-lime",
  ok: "text-mint",
  warn: "text-amber",
  err: "text-rose",
  info: "text-sky",
  bold: "text-[#fffdf2] font-semibold",
  mint: "text-mint",
  amber: "text-amber",
  sky: "text-sky",
};

export function Terminal({
  demo,
  className,
  compact = false,
  animate = false,
  title,
}: {
  demo: Demo;
  className?: string;
  compact?: boolean;
  animate?: boolean;
  title?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-term shadow-[0_30px_80px_-40px_rgba(23,24,15,0.75)]",
        className,
      )}
    >
      <div className="grid-dark pointer-events-none absolute inset-0 opacity-[0.5]" aria-hidden="true" />
      <div className="relative flex items-center gap-3 border-b border-white/10 bg-white/[0.035] px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#4b5142]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#5f6650]" />
          <span className="h-2.5 w-2.5 rounded-full bg-lime/80" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 font-mono text-[10.5px] text-[#929888]">
          <Icon name="terminal" size={12} />
            <span className="truncate">{title ?? "~/devwell - zsh"}</span>
        </div>
        <span
          className={cn(
            "hidden shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] sm:inline-flex",
            demo.exit === 0
              ? "border-mint/25 bg-mint/10 text-mint"
              : "border-rose/25 bg-rose/10 text-rose",
          )}
        >
          exit {demo.exit}
        </span>
        <CopyButton value={demo.command} variant="dark" label="Cmd" />
      </div>

      <div
        className={cn(
          "relative overflow-x-auto",
          compact ? "max-h-[25rem] px-4 py-3.5" : "px-4 py-4 sm:px-5 sm:py-5",
        )}
      >
        <div className="flex min-w-max items-baseline gap-2 font-mono text-[11px] leading-relaxed sm:text-[11.5px]">
          <span className="text-lime" aria-hidden="true">
            ❯
          </span>
          <span className="text-[#f4f2e7]">{demo.command}</span>
          <span className="caret ml-0.5 inline-block h-[13px] w-[6px] translate-y-[2px] bg-lime/80" aria-hidden="true" />
        </div>
        <div
          className={cn(
            "mt-3 min-w-max space-y-[3px] font-mono text-[10.4px] leading-[1.72] sm:text-[11px]",
            animate && "animate-rise",
          )}
          aria-live="polite"
        >
          {demo.lines.map((line, index) => (
            <div key={index} className="whitespace-pre">
              {line.length === 0 || line.every((segment) => segment.text === "") ? (
                <span>&nbsp;</span>
              ) : (
                line.map((segment, i) => (
                  <span key={i} className={toneClass[segment.tone ?? "default"]}>
                    {segment.text}
                  </span>
                ))
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-white/[0.025] px-4 py-2 font-mono text-[9.5px] text-[#828878]">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="clock" size={11} /> {demo.time} · simulation locale
        </span>
        <span className="uppercase tracking-[0.12em]">{demo.lang === "fr" ? "français" : "english"}</span>
      </div>
    </div>
  );
}
