import { useMemo, useState } from "react";
import { demos, demosForTool } from "../data/demos";
import { toolDocs } from "../data/tools";
import { cn } from "../utils/cn";
import { Icon } from "../components/Icon";
import { PageHeader, SuiteSidekick } from "../components/PageHeader";
import { Terminal } from "../components/Terminal";

const symbolLegend = [
  { symbol: "v", label: "Succes / conforme", tone: "text-lime-deep" },
  { symbol: "x", label: "Erreur bloquante", tone: "text-[#a24a40]" },
  { symbol: "!", label: "Avertissement", tone: "text-[#8a6418]" },
  { symbol: "i", label: "Information", tone: "text-[#315e77]" },
  { symbol: "->", label: "Action recommandee", tone: "text-ink" },
  { symbol: "*", label: "Branche courante", tone: "text-[#315e77]" },
];

export function PlaygroundPage() {
  const [toolSlug, setToolSlug] = useState("project-doctor");
  const [demoId, setDemoId] = useState("project-default");
  const [run, setRun] = useState(0);

  const tool = toolDocs.find((item) => item.slug === toolSlug)!;
  const toolDemos = useMemo(() => demosForTool(toolSlug), [toolSlug]);
  const demo = demos.find((item) => item.id === demoId) ?? toolDemos[0];

  function selectTool(slug: string) {
    const first = demosForTool(slug)[0];
    setToolSlug(slug);
    setDemoId(first.id);
    setRun((value) => value + 1);
  }

  return (
    <div>
      <PageHeader
        kicker="Playground  simulation locale"
        title={
          <>
            Les sorties,
            <br />
            <span className="font-serif text-[1.05em] font-normal italic">avant d'installer.</span>
          </>
        }
        intro="Slectionnez une commande et observez ce que l'outil affiche : symboles, tableau, couleurs, JSON et codes retour. Les sorties sont contractuelles, mais aucune commande n'est excute ici."
        compact
        sidekick={<SuiteSidekick />}
        meta={[
          { label: "Scnarios", value: `${demos.length} sorties` },
          { label: "Outils", value: "4 binaires" },
          { label: "Langue", value: "Franais (--lang en)" },
          { label: "Excution", value: "Simulation, code 0/1" },
        ]}
        actions={
          <>
            <span className="inline-flex items-center gap-2 rounded-xl border border-line bg-cream px-3 py-2 font-mono text-[10px] text-muted">
              <Icon name="info" size={12} className="text-lime-deep" />
              Aucune commande relle n'est lance
            </span>
            <a
              href="#/install"
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-3.5 py-2 text-[11.5px] font-medium text-cream transition hover:bg-ink-soft"
            >
              Installer pour de vrai <Icon name="arrow-right" size={12} className="text-lime" />
            </a>
          </>
        }
      />

      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 sm:py-10">
        {/* Tool selector */}
        <div role="group" aria-label="Choisir un outil" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {toolDocs.map((item) => {
            const selected = item.slug === toolSlug;
            return (
              <button
                key={item.slug}
                type="button"
                aria-pressed={selected}
                onClick={() => selectTool(item.slug)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  selected
                    ? "border-ink bg-ink text-cream"
                    : "border-line bg-cream text-ink hover:border-line-strong hover:bg-paper-2/60",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                    selected ? "border-white/15 bg-white/10 text-lime" : "border-line bg-paper-2 text-ink",
                  )}
                >
                  <Icon name={item.icon} size={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[10.5px] font-medium">{item.name}</span>
                  <span className={cn("block text-[9.5px]", selected ? "text-[#aab0a1]" : "text-muted")}>{item.priority}</span>
                </span>
                <Icon name="chevron-right" size={12} className={cn("shrink-0", selected ? "text-lime" : "text-faint")} />
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[285px_minmax(0,1fr)]">
          {/* Command list */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-faint">Scnarios disponibles</p>
              <span className="font-mono text-[9px] text-muted">{toolDemos.length}</span>
            </div>
            <div className="space-y-1.5" role="group" aria-label={`Scnarios ${tool.name}`}>
              {toolDemos.map((item) => {
                const selected = item.id === demo.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setDemoId(item.id);
                      setRun((value) => value + 1);
                    }}
                    aria-pressed={selected}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2.5 text-left transition",
                      selected
                        ? "border-lime-deep/35 bg-lime-soft shadow-[inset_2px_0_0_var(--color-lime-deep)]"
                        : "border-line bg-cream hover:border-line-strong hover:bg-paper-2/50",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[11.5px] font-medium text-ink">{item.label}</span>
                      <span
                        className={cn(
                          "rounded-full border px-1.5 py-0.5 font-mono text-[8px]",
                          item.exit === 0
                            ? "border-[#6b9a7d]/30 bg-[#e7f2e9] text-[#386347]"
                            : "border-[#c47369]/30 bg-[#f8e6e2] text-[#8f3f36]",
                        )}
                      >
                        {item.exit}
                      </span>
                    </span>
                    <span className="mt-1 block truncate font-mono text-[9px] text-muted">$ {item.command}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-line bg-paper-2/60 p-3.5">
              <p className="flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-muted">
                <Icon name="terminal" size={11} /> - essayer chez vous
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                Remplacez la simulation par la vraie sortie, sans installation durable :
              </p>
              <code className="mt-2 block overflow-x-auto rounded-md border border-line bg-cream px-2 py-1.5 font-mono text-[9.5px] text-ink-soft">
                devwell {({ "readme-gen": "readme", "env-doctor": "env", "project-doctor": "doctor", "branch-cleaner": "branches" } as const)[tool.name]} --help
              </code>
            </div>
          </div>

          {/* Terminal */}
          <div className="min-w-0">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-faint">Sortie simule</span>
                <span className="rounded-full border border-line bg-cream px-1.5 py-0.5 font-mono text-[8.5px] text-muted">
                  {demo.lang}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRun((value) => value + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-cream px-2.5 py-1 font-mono text-[9.5px] text-muted transition hover:border-line-strong hover:text-ink"
              >
                <Icon name="play" size={10} /> Relancer l'animation
              </button>
            </div>
            <Terminal key={`${demo.id}-${run}`} demo={demo} animate title={`devwell -" ${tool.name}`} />

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <div className="rounded-xl border border-line bg-cream px-3.5 py-2.5">
                <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-faint">Code retour</p>
                <p className="mt-1 flex items-center gap-1.5 font-mono text-[12px] font-medium text-ink">
                  <span className={cn("h-2 w-2 rounded-full", demo.exit === 0 ? "bg-[#77a74a]" : "bg-[#a24a40]")} />
                  {demo.exit}  {demo.exit === 0 ? "succs" : "erreur logique"}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-cream px-3.5 py-2.5">
                <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-faint">Dure annonce</p>
                <p className="mt-1 font-mono text-[12px] font-medium text-ink">{demo.time}</p>
              </div>
              <div className="rounded-xl border border-lime-deep/20 bg-lime-soft px-3.5 py-2.5">
                <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-lime-deep">Option cl</p>
                <p className="mt-1 font-mono text-[10.5px] text-lime-deep">{tool.keyFlags[0]}</p>
              </div>
            </div>

            <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-muted">
              <Icon name="info" size={12} className="mt-0.5 shrink-0 text-lime-deep" />
              {demo.note ??
                "Sortie illustrative fidle au contrat de l'outil. En conditions relles, les chemins, noms de branches et versions dpendent de votre dpt."}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-line bg-cream p-5">
            <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-faint">Accessibilit</p>
            <h2 className="mt-1.5 font-display text-[17px] font-medium tracking-[-0.02em] text-ink">
              La couleur n'est jamais la seule information.
            </h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
              Chaque statut porte un symbole et un texte. Avec NO_COLOR=1, le rendu reste complet.
              La jauge de score inclut toujours son libell.
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {symbolLegend.map((item) => (
                <li key={item.symbol} className="flex items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-1.5">
                  <span className={cn("font-mono text-[12px]", item.tone)}>{item.symbol}</span>
                  <span className="text-[10.5px] text-ink-soft">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-line bg-paper-2/50 p-5">
            <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-faint">Les quatre outils</p>
            <h2 className="mt-1.5 font-display text-[17px] font-medium tracking-[-0.02em] text-ink">Continuer l'exploration</h2>
            <div className="mt-3 divide-y divide-line">
              {toolDocs.map((item) => (
                <a
                  key={item.slug}
                  href={`#/docs/${item.slug}`}
                  className="group flex items-center gap-2.5 py-2 first:pt-0 last:pb-0"
                >
                  <Icon name={item.icon} size={14} className="shrink-0 text-faint group-hover:text-lime-deep" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[10.5px] font-medium text-ink">{item.name}</span>
                    <span className="block truncate text-[10px] text-muted">{item.tagline}</span>
                  </span>
                  <Icon name="arrow-up-right" size={11} className="shrink-0 text-faint group-hover:text-ink" />
                </a>
              ))}
            </div>
            <a
              href="#/guide/commandes"
              className="mt-3 inline-flex w-full items-center justify-between rounded-lg border border-line bg-cream px-3 py-2 font-mono text-[9.5px] text-muted transition hover:text-ink"
            >
              Voir l'aide-mmoire complet <Icon name="arrow-right" size={11} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
