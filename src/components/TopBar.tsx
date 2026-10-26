import { cn } from "../utils/cn";
import type { Route } from "../lib/router";
import { useTheme } from "../lib/theme";
import { Icon } from "./Icon";
import { Logo } from "./Logo";
import { useSiteContent } from "../data/siteContent";

const NAV = [
  { id: "home", href: "#/", match: "home", icon: "home" as const },
  { id: "tools", href: "#/docs/readme-gen", match: "tool", icon: "terminal" as const },
  { id: "guide", href: "#/guide", match: "guide", icon: "book" as const },
  { id: "playground", href: "#/playground", match: "playground", icon: "play" as const },
  { id: "install", href: "#/install", match: "install", icon: "download" as const },
  { id: "compare", href: "#/comparatif", match: "compare", icon: "file" as const },
];

export function TopBar({
  route,
  onMenu,
  onSearch,
}: {
  route: Route;
  onMenu: () => void;
  onSearch: () => void;
}) {
  const { theme, toggle } = useTheme();
  const content = useSiteContent();

  return (
    <header className="nav-ambient sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-xl">
      <div className="nav-color-flow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex h-16 w-full max-w-[1440px] items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <button
          type="button"
          onClick={onMenu}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-cream/90 text-ink transition-colors hover:border-line-strong hover:bg-paper-2 lg:hidden"
          aria-label="Ouvrir la navigation"
          aria-haspopup="dialog"
        >
          <Icon name="menu" size={17} />
        </button>

        <a href="#/" aria-label="Devwell, accueil" className="shrink-0">
          <Logo name={content.siteTitle.toLowerCase()} />
        </a>

        <nav
          aria-label="Navigation principale"
          className="ml-2 hidden items-center gap-0.5 rounded-xl border border-line/80 bg-paper/55 p-1 lg:flex xl:ml-4 xl:gap-1"
        >
          {content.navigation
            .filter((item) => item.visible)
            .map((entry) => {
              const item = NAV.find((nav) => nav.id === entry.id);
              if (!item) return null;
              const active = route.name === item.match;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium transition-colors duration-200 xl:px-3 xl:text-[13px]",
                    active
                      ? "nav-current-glow bg-lime-soft text-ink shadow-sm"
                      : "text-muted hover:bg-paper-2/70 hover:text-ink",
                  )}
                >
                  <Icon
                    name={item.icon}
                    size={14}
                    className={cn(
                      "transition-colors",
                      active ? "text-lime-deep" : "text-muted group-hover:text-ink",
                    )}
                  />
                  <span>{entry.label}</span>
                </a>
              );
            })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-line bg-cream px-2.5 py-1 font-mono text-[10px] text-muted md:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#77a74a]" />
            v0.1.1
          </span>

          <button
            type="button"
            onClick={onSearch}
            className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-cream/90 py-1.5 pl-2.5 pr-1.5 text-[13px] text-muted transition-colors hover:border-line-strong hover:bg-paper-2 hover:text-ink sm:pr-2"
            aria-label="Rechercher dans la documentation"
          >
            <Icon name="search" size={14} />
            <span className="hidden sm:inline">Rechercher</span>
            <kbd className="ml-2 hidden items-center gap-0.5 rounded border border-line bg-paper-2 px-1.5 py-0.5 font-mono text-[9.5px] text-muted sm:inline-flex">
              ⌘ K
            </kbd>
          </button>

          <button
            type="button"
            onClick={toggle}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-cream/90 text-ink transition-colors hover:border-line-strong hover:bg-paper-2"
            aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
          </button>

        </div>
      </div>
    </header>
  );
}
