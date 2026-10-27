import { useEffect } from "react";
import { guideIntro, guideSections } from "../data/guide";
import type { Route } from "../lib/router";
import { scrollToSection } from "../lib/router";
import { useActiveSection } from "../lib/useActiveSection";
import { cn } from "../utils/cn";
import { Blocks } from "../components/Blocks";
import { CopyButton } from "../components/CopyButton";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";

const shortcuts = [
  { label: "Installer la suite", href: "#/guide/demarrage", icon: "download" as const },
  { label: "Toutes les commandes", href: "#/guide/commandes", icon: "terminal" as const },
  { label: "Brancher la CI", href: "#/guide/ci", icon: "spark" as const },
  { label: "Scurit & secrets", href: "#/guide/securite", icon: "shield" as const },
  { label: "Dpannage", href: "#/guide/depannage", icon: "alert" as const },
  { label: "Faire adopter", href: "#/guide/adoption", icon: "book" as const },
];

export function GuidePage({ route }: { route: Extract<Route, { name: "guide" }> }) {
  const ids = guideSections.map((section) => section.id);
  const active = useActiveSection(ids, route.section);

  useEffect(() => {
    scrollToSection(route.section);
  }, [route.section]);

  return (
    <div>
      <PageHeader
        kicker="Guide d'utilisation  franais"
        title={
          <>
            Le mode d'emploi complet.
            <br />
            <span className="font-serif text-[1.05em] font-normal italic">De zro  la CI.</span>
          </>
        }
        intro={guideIntro}
        compact
        meta={[
          { label: "Chapitres", value: "7 sections dtailles" },
          { label: "Temps de lecture", value: "~18 minutes" },
          { label: "Niveau", value: "Junior -' plateforme" },
          { label: "Prrequis", value: "Node 18.17+, git 2.30+" },
        ]}
        actions={
          <>
            <a
              href="#/guide/demarrage"
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[12px] font-medium text-cream transition hover:bg-ink-soft"
            >
              Commencer maintenant <Icon name="arrow-right" size={13} className="text-lime" />
            </a>
            <span className="inline-flex items-center gap-2 rounded-xl border border-line bg-cream py-2 pl-3 pr-1.5">
              <code className="font-mono text-[10.5px] text-ink-soft">devwell env --json</code>
              <CopyButton value="devwell env --json" variant="light" label="" />
            </span>
          </>
        }
        aside={
          <div className="w-full rounded-xl border border-line bg-cream p-4 lg:w-[260px]">
            <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-faint">Rgle d'or</p>
            <p className="mt-2 font-display text-[14px] font-medium leading-snug text-ink">
              Lecture seule d'abord, criture explicite ensuite.
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
              Tous les audits se lancent sans risque. Les options destructives portent un nom sans ambigut.
            </p>
            <div className="mt-3 border-t border-line pt-2.5 font-mono text-[9px] leading-relaxed text-faint">
              exit 0  OK<br />
              exit 1  erreur logique<br />
              exit 2  erreur technique
            </div>
          </div>
        }
      />

      <div className="sticky top-16 z-30 border-b border-line bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1180px] items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          <span className="mr-2 hidden shrink-0 font-mono text-[8.5px] uppercase tracking-[0.13em] text-faint sm:inline">
            Chapitres
          </span>
          {guideSections.map((section, index) => (
            <a
              key={section.id}
              href={`#/guide/${section.id}`}
              aria-current={active === section.id ? "true" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] transition-colors",
                active === section.id ? "bg-ink text-lime" : "text-muted hover:bg-paper-2 hover:text-ink",
              )}
            >
              <span className={cn("text-[8px]", active === section.id ? "text-lime/70" : "text-faint")}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="hidden sm:inline">{section.kicker}</span>
              <span className="sm:hidden">{section.title.split(" ").slice(0, 2).join(" ")}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_190px]">
          <div className="min-w-0 max-w-[820px]">
            {guideSections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-title`}
                className="scroll-mt-[8.5rem] border-b border-line py-9 first:pt-8 last:border-b-0 sm:py-11"
              >
                <div className="mb-4 flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink font-mono text-[11px] font-medium text-lime">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-[8.5px] uppercase tracking-[0.15em] text-faint">{section.kicker}</p>
                    <h2
                      id={`${section.id}-title`}
                      className="mt-1 font-display text-[1.45rem] font-medium leading-tight tracking-[-0.03em] text-ink sm:text-[1.7rem]"
                    >
                      {section.title}
                    </h2>
                  </div>
                </div>
                <div className="sm:pl-[3.1rem]">
                  <Blocks blocks={section.blocks} />
                </div>
              </section>
            ))}

            <div className="my-10 overflow-hidden rounded-2xl bg-term p-5 text-cream sm:p-7">
              <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-lime">Prochaine tape</p>
              <h2 className="mt-2 max-w-md font-display text-[1.4rem] font-medium leading-tight tracking-[-0.025em] sm:text-[1.65rem]">
                Le guide est lu. Place  votre premier audit.
              </h2>
              <p className="mt-2 max-w-lg text-[12.5px] leading-relaxed text-[#aab0a1]">
                Lancez les quatre commandes en lecture seule sur un dpt existant, puis ajoutez
                env-doctor et project-doctor  votre CI.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="#/install" className="inline-flex items-center gap-2 rounded-lg bg-lime px-3.5 py-2 font-mono text-[10.5px] font-medium text-on-accent transition hover:bg-lime-bright">
                  Installation <Icon name="arrow-right" size={12} />
                </a>
                <a href="#/playground" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3.5 py-2 font-mono text-[10.5px] text-cream transition hover:border-lime/50 hover:text-lime">
                  Voir les sorties <Icon name="play" size={11} />
                </a>
                <a href="#/docs/env-doctor" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3.5 py-2 font-mono text-[10.5px] text-cream transition hover:border-lime/50 hover:text-lime">
                  Fiche env-doctor <Icon name="external" size={11} />
                </a>
              </div>
            </div>
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-[8.5rem] py-8">
              <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-faint">Sommaire</p>
              <ul className="mt-3 space-y-0.5 border-l border-line">
                {guideSections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#/guide/${section.id}`}
                      className={cn(
                        "-ml-px block border-l-2 py-1 pl-3 text-[11px] leading-snug transition-colors",
                        active === section.id
                          ? "border-lime-deep font-medium text-ink"
                          : "border-transparent text-muted hover:text-ink",
                      )}
                    >
                      <span className="mr-1.5 font-mono text-[8px] text-faint">{String(index + 1).padStart(2, "0")}</span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-5 rounded-xl border border-line bg-cream p-3">
                <p className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-faint">Aller droit au but</p>
                <div className="mt-2 space-y-1.5">
                  {shortcuts.map((shortcut) => (
                    <a
                      key={shortcut.href + shortcut.label}
                      href={shortcut.href}
                      className="group flex items-center gap-2 text-[10.5px] text-muted transition hover:text-ink"
                    >
                      <Icon name={shortcut.icon} size={12} className="text-faint group-hover:text-lime-deep" />
                      <span className="truncate">{shortcut.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
