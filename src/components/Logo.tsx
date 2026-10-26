import { cn } from "../utils/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#17180f" />
      <path d="M9 8h6a8 8 0 0 1 0 16H9V8Zm3.2 3v10H15a5 5 0 0 0 0-10h-2.8Z" fill="#d9f36f" fillRule="evenodd" />
    </svg>
  );
}

export function Logo({ inverted = false, name = "devwell" }: { inverted?: boolean; name?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="flex items-baseline gap-2">
        <span
          className={cn(
            "font-display text-[1.28rem] font-semibold tracking-[-0.04em]",
            inverted ? "text-cream" : "text-ink",
          )}
        >
          {name}
        </span>
      </span>
    </span>
  );
}
