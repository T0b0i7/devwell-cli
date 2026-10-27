import { cn } from "../utils/cn";
import { CopyButton } from "./CopyButton";

const LANG_LABEL: Record<string, string> = {
  bash: "shell",
  sh: "shell",
  json: "json",
  ts: "typescript",
  js: "javascript",
  yaml: "yaml",
  yml: "yaml",
  md: "markdown",
  text: "console",
  console: "console",
};

export function CodeBlock({
  code,
  title,
  lang,
  note,
  className,
  dense = false,
}: {
  code: string;
  title?: string;
  lang?: string;
  note?: string;
  className?: string;
  dense?: boolean;
}) {
  return (
    <figure className={cn("group my-5 overflow-hidden rounded-xl border border-term-line bg-term shadow-[0_14px_30px_-24px_rgba(23,24,15,0.65)]", className)}>
      <div className="flex items-center gap-3 border-b border-term-line bg-term-2 px-3.5 py-2">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-[#4a5040]" />
          <span className="h-2 w-2 rounded-full bg-[#5c6249]" />
          <span className="h-2 w-2 rounded-full bg-lime/70" />
        </span>
        <figcaption className="min-w-0 flex-1 truncate font-mono text-[11.5px] tracking-[0.02em] text-[#a3a898]">
          {title ?? (lang ? `exemple.${lang}` : "extrait")}
        </figcaption>
        {lang && (
          <span className="hidden shrink-0 rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8c9282] sm:inline">
            {LANG_LABEL[lang] ?? lang}
          </span>
        )}
        <CopyButton value={code} label="Copier" />
      </div>
      <div className={cn("overflow-x-auto", dense ? "px-4 py-3" : "px-4 py-4 sm:px-5")}>
        <pre className="whitespace-pre font-mono text-[13px] leading-[1.8] text-[#e5e4d8] sm:text-[13.5px]">
          <code>{code}</code>
        </pre>
      </div>
      {note && (
        <p className="border-t border-term-line bg-white/[0.02] px-4 py-2 font-mono text-[11px] leading-relaxed text-[#8c9282]">
          — {note}
        </p>
      )}
    </figure>
  );
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return <code className="doc-code">{children}</code>;
}
