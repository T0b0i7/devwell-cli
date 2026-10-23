import { useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";
import { Icon } from "./Icon";

export function CopyButton({
  value,
  label = "Copier",
  variant = "dark",
  className,
}: {
  value: string;
  label?: string;
  variant?: "dark" | "light" | "ghost";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          copyWithExecCommand(value);
        }
      } else {
        copyWithExecCommand(value);
      }
      setCopied(true);
      setFailed(false);
    } catch (error) {
      console.error("Impossible de copier dans le presse-papiers.", error);
      setCopied(false);
      setFailed(true);
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(false);
      setFailed(false);
    }, 1800);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={
        copied
          ? "Copié dans le presse-papiers"
          : failed
            ? "Échec de la copie dans le presse-papiers"
            : label || "Copier dans le presse-papiers"
      }
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 font-mono text-[10.5px] transition-colors",
        variant === "dark" &&
          "border border-white/12 bg-white/[0.04] text-[#b9bcae] hover:border-lime/40 hover:text-lime",
        variant === "light" &&
          "border border-line bg-cream text-muted hover:border-line-strong hover:text-ink",
        variant === "ghost" && "text-muted hover:text-ink",
        copied && variant === "dark" && "border-lime/40 text-lime",
        copied && variant !== "dark" && "text-lime-deep",
        failed && "text-rose",
        className,
      )}
    >
      <Icon name={copied ? "check" : "copy"} size={12} />
      <span aria-live="polite">{copied ? "Copié" : failed ? "Échec" : label}</span>
    </button>
  );
}

function copyWithExecCommand(value: string) {
  const area = document.createElement("textarea");
  area.value = value;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  try {
    area.select();
    if (!document.execCommand("copy")) {
      throw new Error("Le navigateur a refusé la copie.");
    }
  } finally {
    area.remove();
  }
}
