import { useEffect, useMemo, useRef, useState } from "react";
import { searchDocs } from "../lib/search";
import { cn } from "../utils/cn";
import { Icon } from "./Icon";

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const results = useMemo(() => searchDocs(query), [query]);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setQuery("");
    setActive(0);
    const timeout = setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      clearTimeout(timeout);
      if (previousFocusRef.current?.isConnected) previousFocusRef.current.focus();
      previousFocusRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function go(href: string) {
    onClose();
    window.location.hash = href.replace(/^#/, "");
    if (window.location.hash === href) window.scrollTo({ top: 0, behavior: "auto" });
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "Tab") {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current + 1) % Math.max(results.length, 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1));
    }
    if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      go(results[active].href);
    }
  }

  if (!open) return null;

  let lastGroup = "";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-ink/45 px-4 pt-[12vh] backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Rechercher dans la documentation"
        onKeyDown={onKeyDown}
        className="w-full max-w-[600px] overflow-hidden rounded-2xl border border-line-strong bg-paper shadow-[0_40px_100px_-30px_rgba(23,24,15,0.5)]"
      >
        <div className="flex items-center gap-3 border-b border-line bg-cream px-4 py-3">
          <Icon name="search" size={17} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une commande, un flag, une section--"
            aria-label="Recherche"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-faint"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-line bg-paper-2 px-1.5 py-0.5 font-mono text-[9px] text-muted hover:text-ink"
          >
            ESC
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="font-display text-sm font-medium text-ink">Aucun résultat pour « {query} »</p>
              <p className="mt-1 text-[12px] text-muted">
                Essayez <span className="doc-code">env-doctor</span>, <span className="doc-code">--help</span>, <span className="doc-code">CI</span> ou <span className="doc-code">sécurité</span>.
              </p>
            </div>
          ) : (
            results.map((item, index) => {
              const showGroup = item.group !== lastGroup;
              lastGroup = item.group;
              return (
                <div key={item.href + item.title}>
                  {showGroup && (
                    <p className="px-2.5 pb-1 pt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                      {item.group}
                    </p>
                  )}
                  <a
                    href={item.href}
                    onClick={(event) => {
                      event.preventDefault();
                      go(item.href);
                    }}
                    onMouseEnter={() => setActive(index)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors",
                      index === active ? "bg-lime-soft" : "hover:bg-paper-2/70",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                        index === active ? "border-lime-deep/25 bg-lime text-on-accent" : "border-line bg-cream text-muted",
                      )}
                    >
                      <Icon name="file" size={12} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-ink">{item.title}</span>
                      <span className="block truncate text-[11px] text-muted">{item.subtitle}</span>
                    </span>
                    <Icon name="arrow-right" size={13} className="shrink-0 text-faint" />
                  </a>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line bg-paper-2/60 px-4 py-2 font-mono text-[9.5px] text-muted">
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-line bg-cream px-1">↑</kbd>
            <kbd className="rounded border border-line bg-cream px-1">↓</kbd> naviguer
            <kbd className="ml-1 rounded border border-line bg-cream px-1">↵</kbd> ouvrir
          </span>
          <span>{results.length} résultat{results.length > 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
}
