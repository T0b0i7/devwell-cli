import { useEffect, useState } from "react";
import { toolDocs } from "../data/tools";
import { guideSections } from "../data/guide";
import { useSiteContent } from "../data/siteContent";
import type { Route } from "../lib/router";
import { cn } from "../utils/cn";
import { Icon } from "./Icon";

function isActive(route: Route, href: string): boolean {
  if (href === "#/") return route.name === "home";
  if (href.startsWith("#/docs/")) {
    const slug = href.split("/")[2];
    return route.name === "tool" && route.slug === slug;
  }
  if (href === "#/guide") return route.name === "guide";
  if (href === "#/install") return route.name === "install";
  if (href === "#/playground") return route.name === "playground";
  if (href === "#/comparatif") return route.name === "compare";
  if (href === "#/livraison") return route.name === "release";
  if (href === "#/ressources") return route.name === "resources";
  return false;
}

function NavLink({
  href,
  label,
  active,
  icon,
  meta,
  onClick,
}: {
  href: string;
  label: string;
  active?: boolean;
  icon?: string;
  meta?: string;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors duration-200",
        active
          ? "nav-sidebar-active bg-lime-soft font-medium text-ink"
          : "text-ink-soft hover:bg-paper-2/80 hover:text-ink",
      )}
    >
      {icon && <span className={cn("shrink-0", active ? "text-lime-deep" : "text-faint group-hover:text-muted")}>{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {meta && <span className="font-mono text-[9px] text-faint">{meta}</span>}
    </a>
  );
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 mt-5 px-2.5 font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-faint first:mt-0">
      {children}
    </p>
  );
}

export function SidebarNav({
  route,
  onNavigate,
  onClose,
  mobile = false,
}: {
  route: Route;
  onNavigate?: () => void;
  onClose?: () => void;
  mobile?: boolean;
}) {
  const activeSlug = route.name === "tool" ? route.slug : null;
  const activeSection = route.name === "tool" ? route.section : undefined;
  const siteContent = useSiteContent();
  const [expanded, setExpanded] = useState<string[]>(activeSlug ? [activeSlug] : [toolDocs[0].slug]);
  const primaryLinks = {
    home: "#/",
    tools: "#/docs/readme-gen",
    guide: "#/guide",
    playground: "#/playground",
    install: "#/install",
    compare: "#/comparatif",
  } as const;

  useEffect(() => {
    if (activeSlug) {
      setExpanded((current) => (current.includes(activeSlug) ? current : [...current, activeSlug]));
    }
  }, [activeSlug]);

  return (
    <nav aria-label="Navigation de la documentation" className="flex h-full flex-col">
      <div className="flex items-center justify-between px-2.5 pb-3 lg:hidden">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Documentation</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la navigation"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-cream"
        >
          <Icon name="close" size={15} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-6 pr-1">
        <GroupTitle>Démarrage</GroupTitle>
        <div className="space-y-0.5">
          {siteContent.navigation.filter((item) => item.visible).map((item) => {
            const href = primaryLinks[item.id];
            return (
              <NavLink
                key={item.id}
                href={href}
                label={item.id === "home" ? "Vue d'ensemble" : item.label}
                active={isActive(route, href)}
                meta={item.id === "install" ? "60 s" : item.id === "playground" ? "demo" : undefined}
                onClick={onNavigate}
              />
            );
          })}
        </div>

        {route.name === "guide" && (
          <div className="ml-[19px] mt-1 space-y-px border-l border-line pl-2.5">
            {guideSections.map((section) => (
              <a
                key={section.id}
                href={`#/guide/${section.id}`}
                onClick={onNavigate}
                aria-current={route.section === section.id ? "location" : undefined}
                className={cn(
                  "block min-h-9 truncate rounded px-2 py-2 text-[12.5px] transition-colors",
                  route.section === section.id
                    ? "nav-sidebar-active bg-paper-2 font-medium text-ink"
                    : "text-muted hover:bg-paper-2/60 hover:text-ink",
                )}
              >
                {section.title}
              </a>
            ))}
          </div>
        )}

        <GroupTitle>Les outils</GroupTitle>
        <div className="space-y-1">
          {toolDocs.map((tool) => {
            const active = activeSlug === tool.slug;
            const isOpen = expanded.includes(tool.slug);
            return (
              <div key={tool.slug}>
                <div
                  className={cn(
                    "flex items-center rounded-lg transition-colors",
                    active ? "bg-lime-soft/80" : "hover:bg-paper-2/80",
                  )}
                >
                  <a
                    href={`#/docs/${tool.slug}`}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className="flex min-h-10 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2"
                  >
                    <span className={cn("shrink-0", active ? "text-lime-deep" : "text-faint")}>
                      <Icon name={tool.icon} size={15} />
                    </span>
                    <span className={cn("min-w-0 flex-1 truncate font-mono text-[11.5px]", active ? "font-semibold text-ink" : "text-ink-soft")}>
                      {tool.name}
                    </span>
                    <span className="font-mono text-[8.5px] text-faint">{tool.index}</span>
                  </a>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-label={`${isOpen ? "Masquer" : "Afficher"} les sections de ${tool.name}`}
                    onClick={() =>
                      setExpanded((current) =>
                        current.includes(tool.slug) ? current.filter((slug) => slug !== tool.slug) : [...current, tool.slug],
                      )
                    }
                    className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-paper-2 hover:text-ink"
                  >
                    <Icon name="chevron-down" size={13} className={cn("transition-transform", !isOpen && "-rotate-90")} />
                  </button>
                </div>
                {isOpen && (
                  <div className="ml-[27px] mt-0.5 space-y-px border-l border-line pl-2.5">
                    {tool.sections.map((section) => (
                      <a
                        key={section.id}
                        href={`#/docs/${tool.slug}/${section.id}`}
                        onClick={onNavigate}
                        className={cn(
                          "flex min-h-9 items-baseline gap-2 rounded px-2 py-2 text-[12.5px] transition-colors",
                          active && activeSection === section.id
                            ? "nav-sidebar-active bg-paper-2 font-medium text-ink"
                            : "text-muted hover:bg-paper-2/60 hover:text-ink",
                        )}
                      >
                        <span className="font-mono text-[8.5px] text-faint">{section.letter}</span>
                        <span className="truncate">{section.title}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <GroupTitle>La suite</GroupTitle>
        <div className="space-y-0.5">
          <NavLink href="#/comparatif" label="Comparatif" active={isActive(route, "#/comparatif")} onClick={onNavigate} />
          <NavLink href="#/livraison" label="Livraison & roadmap" active={isActive(route, "#/livraison")} onClick={onNavigate} />
          <NavLink href="#/ressources" label="Ressources & CI" active={isActive(route, "#/ressources")} onClick={onNavigate} />
        </div>
      </div>

      <div className="border-t border-line pt-3">
        <div className={cn("rounded-xl border border-line bg-cream p-3", mobile && "mb-2")}>
          <p className="flex items-center gap-1.5 font-display text-[11.5px] font-semibold text-ink">
            <Icon name="spark" size={13} className="text-lime-deep" />
            Guide de démarrage
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            Installation, premier audit et automatisation en CI.
          </p>
          <a
            href="#/guide/demarrage"
            onClick={onNavigate}
            className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] font-medium text-lime-deep hover:underline"
          >
            Lire le guide <Icon name="arrow-right" size={11} />
          </a>
        </div>
        <div className="mt-2 flex items-center justify-between px-1 pb-1 font-mono text-[9.5px] text-faint">
          <span>MIT - v0.1.1</span>
          <span>Devwell CLI</span>
        </div>
      </div>
    </nav>
  );
}
