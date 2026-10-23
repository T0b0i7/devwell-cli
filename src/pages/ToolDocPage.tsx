import { useEffect } from "react";
import { getTool, toolDocs } from "../data/tools";
import { comparisonRows } from "../data/suite";
import type { Route } from "../lib/router";
import { scrollToSection } from "../lib/router";
import { useActiveSection } from "../lib/useActiveSection";
import { cn } from "../utils/cn";
import { Blocks } from "../components/Blocks";
import { CopyButton } from "../components/CopyButton";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";

export function ToolDocPage({ route }: { route: Extract<Route, { name: "tool" }> }) {
  const tool = getTool(route.slug);
  const otherTools = toolDocs.filter((item) => item.slug !== route.slug);

  useEffect(() => {
    scrollToSection(route.section);
  }, [route.slug, route.section]);

  const ids = tool?.sections.map((section) => section.id) ?? [];
  const activeSection = useActiveSection(ids, route.section);

  if (!tool) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">Erreur 404</p>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight">Cet outil n'existe pas.</h1>
        <p className="mt-2 text-sm text-muted">Les quatre outils de la suite sont readme-gen, env-doctor, project-doctor et branch-cleaner.</p>
        <a href="#/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-[12px] text-cream">
          Revenir à l'accueil <Icon name="arrow-right" size={13} />
        </a>
      </div>
    );
  }

  const currentIndex = toolDocs.findIndex((item) => item.slug === tool.slug);
  const nextTool = toolDocs[(currentIndex + 1) % toolDocs.length];
  const comparison = comparisonRows[currentIndex];
  const reading = Math.max(6, Math.round(tool.sections.reduce((sum, section) => sum + section.blocks.length, 0) * 0.9));

  return (
    <div>
      <div className="mx-auto w-full max-w-[1180px] px-4 pt-5 sm:px-6">
        <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1.5 font-mono text-[9.5px] text-faint">
          <a href="#/" className="hover:text-ink">Accueil</a>
          <Icon name="chevron-right" size={9} />
          <a href="#/comparatif" className="hover:text-ink">Outils</a>
          <Icon name="chevron-right" size={9} />
          <span className="text-ink">{tool.name}</span>
        </nav>
      </div>

      <PageHeader
        kicker={`Outil ${tool.index} · ${tool.name}`}
        title={
          <>
            <span className="font-mono text-[0.62em] font-semibold tracking-[-0.03em]">{tool.name}</span>
            <br />
            <span className="font-serif text-[1.04em] font-normal italic">{tool.tagline}</span>
          </>
        }
        intro={tool.description}
        meta={[
          { label: "Langage", value: tool.language },
          { label: "Dépendances", value: tool.deps },
          { label: "LOC estimées", value: tool.loc },
          { label: "Temps dev", value: tool.devTime },
        ]}
        actions={
          <>
            <span className="inline-flex items-center gap-2 rounded-xl bg-ink py-2 pl-3 pr-1.5 text-cream">
              <span className="font-mono text-[10px] text-lime"></span>
              <code className="font-mono text-[10.5px]">{tool.binary}</code>
              <CopyButton value={tool.install} variant="dark" label="" />
            </span>
            <a
              href="#/playground"
              className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-cream px-3.5 py-2 text-[11.5px] font-medium text-ink transition hover:bg-paper-2"
            >
              <Icon name="play" size={12} /> Voir la sortie
            </a>
            <span className="inline-flex items-center gap-1.5 font-mono text-[9px] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-[#77a74a]" /> priorité {tool.priority} · lecture ~{reading} min
            </span>
          </>
        }
        aside={
          <div className="w-full rounded-xl border border-line bg-cream p-4 lg:w-[250px]">
            <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-faint">Fiche technique</p>
            <dl className="mt-2.5 space-y-2">
              {[
                ["Langage", tool.language],
                ["Commande", `devwell ${({
                  "readme-gen": "readme",
                  "env-doctor": "env",
                  "project-doctor": "doctor",
                  "branch-cleaner": "branches",
                } as const)[tool.name]}`],
                ["Runtime", "Node -- 18.17"],
                ["Licence", "MIT"],
                ["Couverture", comparison?.[6] ?? "-- 80 %"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 border-b border-line/60 pb-1.5 last:border-0 last:pb-0">
                  <dt className="font-mono text-[9px] text-faint">{label}</dt>
                  <dd className="text-right text-[10.5px] font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex flex-wrap gap-1">
              {tool.tags.map((tag) => (
                <span key={tag} className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[8.5px] text-muted">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        }
      />

      {/* Section nav */}
      <div className="sticky top-16 z-30 border-b border-line bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1180px] items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          <span className="mr-2 hidden shrink-0 font-mono text-[8.5px] uppercase tracking-[0.13em] text-faint sm:inline">
            Trame A-'H
          </span>
          {tool.sections.map((section) => {
            const active = activeSection === section.id;
            return (
              <a
                key={section.id}
                href={`#/docs/${tool.slug}/${section.id}`}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] transition-colors",
                  active ? "bg-ink text-lime" : "text-muted hover:bg-paper-2 hover:text-ink",
                )}
              >
                <span className={cn("text-[8.5px]", active ? "text-lime/70" : "text-faint")}>{section.letter}</span>
                <span className="hidden sm:inline">{section.title}</span>
                <span className="sm:hidden">{section.letter}</span>
              </a>
            );
          })}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_185px]">
          <div className="min-w-0 max-w-[820px]">
            <p className="mt-6 flex items-start gap-2 rounded-lg border border-line bg-cream/70 px-3 py-2 text-[11px] leading-relaxed text-muted">
              <Icon name="info" size={13} className="mt-0.5 shrink-0 text-lime-deep" />
              {tool.preamble}
            </p>

            {tool.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-title`}
                className="scroll-mt-[8.5rem] border-b border-line py-9 last:border-b-0 sm:py-11"
              >
                <div className="mb-4 flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-lime-deep/20 bg-lime-soft font-display text-[14px] font-semibold text-lime-deep">
                    {section.letter}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-[8.5px] uppercase tracking-[0.15em] text-faint">
                      Section {section.letter} · {tool.name}
                    </p>
                    <h2
                      id={`${section.id}-title`}
                      className="mt-1 font-display text-[1.45rem] font-medium leading-tight tracking-[-0.03em] text-ink sm:text-[1.65rem]"
                    >
                      {section.title}
                    </h2>
                    <p className="mt-1 text-[12px] text-muted">{section.subtitle}</p>
                  </div>
                </div>
                <div className="sm:pl-[3.1rem]">
                  <Blocks blocks={section.blocks} />
                </div>
              </section>
            ))}

            <div className="my-10 rounded-2xl border border-line bg-cream p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-faint">Continuer la lecture</p>
                  <p className="mt-1 font-display text-[17px] font-medium tracking-[-0.02em] text-ink">
                    Outil suivant à <span className="font-mono text-[15px]">{nextTool.name}</span>
                  </p>
                  <p className="mt-1 text-[12px] text-muted">{nextTool.tagline}</p>
                </div>
                <a
                  href={`#/docs/${nextTool.slug}`}
                  className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-ink px-3.5 py-2 text-[11.5px] font-medium text-cream transition hover:bg-ink-soft sm:self-auto"
                >
                  Lire la fiche <Icon name="arrow-right" size={13} className="text-lime" />
                </a>
              </div>
            </div>
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-[8.5rem] py-8">
              <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-faint">Sur cette page</p>
              <ul className="mt-3 space-y-0.5 border-l border-line">
                {tool.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#/docs/${tool.slug}/${section.id}`}
                      className={cn(
                        "-ml-px block border-l-2 py-1 pl-3 text-[11px] leading-snug transition-colors",
                        activeSection === section.id
                          ? "border-lime-deep font-medium text-ink"
                          : "border-transparent text-muted hover:text-ink",
                      )}
                    >
                      <span className="mr-1.5 font-mono text-[8.5px] text-faint">{section.letter}</span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-xl border border-line bg-paper-2/50 p-3">
                <p className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-faint">Autres outils</p>
                <div className="mt-2 space-y-1.5">
                  {otherTools.map((item) => (
                    <a
                      key={item.slug}
                      href={`#/docs/${item.slug}`}
                      className="group flex items-center gap-2 font-mono text-[10px] text-muted transition hover:text-ink"
                    >
                      <Icon name={item.icon} size={12} className="text-faint group-hover:text-lime-deep" />
                      <span className="truncate">{item.name}</span>
                      <Icon name="arrow-right" size={10} className="ml-auto opacity-0 transition group-hover:opacity-100" />
                    </a>
                  ))}
                </div>
              </div>
              <a
                href="#/ressources"
                className="mt-3 flex items-center justify-between rounded-xl border border-line bg-cream px-3 py-2 font-mono text-[9.5px] text-muted transition hover:text-ink"
              >
                Contrat de sortie <Icon name="arrow-up-right" size={11} />
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
