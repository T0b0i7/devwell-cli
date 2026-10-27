import { useState } from "react";
import type { Demo, DemoLine } from "../data/demos";
import { toolDocs } from "../data/tools";
import { cn } from "../utils/cn";
import { Icon } from "../components/Icon";
import { PageHeader, SuiteSidekick } from "../components/PageHeader";
import { Terminal } from "../components/Terminal";

const symbolLegend = [
  { symbol: "v", label: "Succès / conforme", tone: "text-lime-deep" },
  { symbol: "x", label: "Erreur bloquante", tone: "text-rose" },
  { symbol: "!", label: "Avertissement", tone: "text-amber" },
  { symbol: "i", label: "Information", tone: "text-sky" },
  { symbol: "->", label: "Action recommandée", tone: "text-ink" },
  { symbol: "*", label: "Branche courante", tone: "text-sky" },
];

type PlaygroundResult = {
  command: string;
  exitCode: number;
  durationMs: number;
  stdout: string;
  stderr: string;
};

function outputLines(result: PlaygroundResult | null, error: string): DemoLine[] {
  const lines: DemoLine[] = [];
  const append = (text: string, tone: "default" | "err") => {
    const normalized = text.replace(/\r/g, "").replace(/\n+$/, "");
    if (!normalized) return;
    for (const line of normalized.split("\n")) lines.push([{ text: line, tone }]);
  };
  if (result) {
    append(result.stdout, "default");
    if (result.stderr) {
      lines.push([{ text: "[stderr]", tone: "err" }]);
      append(result.stderr, "err");
    }
  } else if (error) {
    append(error, "err");
  }
  return lines;
}

export function PlaygroundPage() {
  const [toolSlug, setToolSlug] = useState("project-doctor");
  const [result, setResult] = useState<PlaygroundResult | null>(null);
  const [executionError, setExecutionError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [run, setRun] = useState(0);

  const tool = toolDocs.find((item) => item.slug === toolSlug)!;
  const demo: Demo = {
    id: `${toolSlug}-${run}`,
    tool: toolSlug,
    label: "Sortie réelle",
    command: result?.command ?? "",
    exit: result?.exitCode ?? (executionError ? 1 : 0),
    time: result ? `${result.durationMs} ms` : "—",
    lang: "fr",
    lines: outputLines(result, executionError),
  };

  function selectTool(slug: string) {
    setToolSlug(slug);
    setResult(null);
    setExecutionError("");
    setRun((value) => value + 1);
  }

  async function executeTool() {
    setIsRunning(true);
    setResult(null);
    setExecutionError("");
    setRun((value) => value + 1);
    try {
      const response = await fetch("/api/playground/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: toolSlug }),
      });
      const payload = await response.json() as PlaygroundResult | { error?: string };
      if (!response.ok) {
        throw new Error("error" in payload && payload.error ? payload.error : "L'exécution a échoué.");
      }
      if (
        !("command" in payload) ||
        typeof payload.command !== "string" ||
        typeof payload.exitCode !== "number" ||
        typeof payload.durationMs !== "number" ||
        typeof payload.stdout !== "string" ||
        typeof payload.stderr !== "string"
      ) {
        throw new Error("Le serveur a renvoyé un résultat invalide.");
      }
      setResult(payload);
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : "Impossible d'exécuter la commande.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div>
      <PageHeader
        kicker="Playground · exécution isolée"
        title={
          <>
            Les sorties,
            <br />
            <span className="font-serif text-[1.05em] font-normal italic">avant d'installer.</span>
          </>
        }
        intro="Lancez un vrai outil Devwell sur un projet d'exemple jetable et consultez sa sortie réelle. Chaque exécution est isolée : aucune commande n'accède à votre dépôt ou à votre ordinateur."
        compact
        sidekick={<SuiteSidekick />}
        meta={[
          { label: "Projet", value: "Fixture temporaire" },
          { label: "Outils", value: "4 binaires" },
          { label: "Sorties", value: "stdout + stderr" },
          { label: "Exécution", value: "Réelle · bac à sable" },
        ]}
        actions={
          <>
            <span className="inline-flex items-center gap-2 rounded-xl border border-line bg-cream px-3 py-2 font-mono text-[10px] text-muted">
              <Icon name="info" size={12} className="text-lime-deep" />
              Commandes fixes, arguments contrôlés
            </span>
            <a
              href="#/install"
              className="inline-flex items-center gap-2 rounded-xl bg-term px-3.5 py-2 text-[12px] font-medium text-on-terminal transition hover:bg-term-2"
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
                disabled={isRunning}
                aria-pressed={selected}
                onClick={() => selectTool(item.slug)}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors disabled:cursor-wait disabled:opacity-70",
                  selected
                    ? "border-term bg-term text-on-terminal"
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
                  <span className={cn("block text-[10.5px]", selected ? "text-[#aab0a1]" : "text-muted")}>{item.priority}</span>
                </span>
                <Icon name="chevron-right" size={12} className={cn("shrink-0", selected ? "text-lime" : "text-faint")} />
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[285px_minmax(0,1fr)]">
          <div className="rounded-xl border border-line bg-paper-2/60 p-4">
            <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              <Icon name="file" size={11} /> Projet d'exemple
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink">
              Chaque clic crée un projet Node.js temporaire avec des fichiers de démonstration. Un historique Git synthétique est ajouté pour les outils qui en ont besoin.
            </p>
            <ul className="mt-3 space-y-1 font-mono text-[10.5px] text-muted">
              <li>package.json · scripts · lockfile</li>
              <li>.env.example · .env factice</li>
              <li>README · LICENSE · branches Git</li>
            </ul>
            <div className="mt-4 border-t border-line pt-3.5">
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                <Icon name="shield" size={11} /> Isolation
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                Une commande prédéfinie, sans shell libre, est lancée avec des arguments contrôlés. Le projet temporaire est supprimé après le résultat.
              </p>
            </div>
          </div>

          {/* Terminal */}
          <div className="min-w-0">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Terminal de prévisualisation</span>
                <span className="rounded-full border border-line bg-cream px-1.5 py-0.5 font-mono text-[10px] text-muted">
                  {result ? `exit ${result.exitCode}` : executionError ? "échec" : "prêt"}
                </span>
              </div>
              <button
                type="button"
                onClick={executeTool}
                disabled={isRunning}
                aria-busy={isRunning}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-lime px-3.5 py-1.5 font-mono text-[11px] font-semibold text-on-accent transition hover:brightness-95 disabled:cursor-wait disabled:opacity-70"
              >
                <Icon name={isRunning ? "clock" : "play"} size={12} /> {isRunning ? "Exécution…" : "Exécuter la commande"}
              </button>
            </div>
            <Terminal
              key={`${demo.id}-${run}`}
              demo={demo}
              animate={Boolean(result || executionError)}
              title={`devwell · ${tool.name}`}
              modeLabel="exécution isolée"
            />

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <div className="rounded-xl border border-line bg-cream px-3.5 py-2.5">
                <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-faint">Code retour</p>
                <p className="mt-1 flex items-center gap-1.5 font-mono text-[12px] font-medium text-ink">
                  <span className={cn("h-2 w-2 rounded-full", !result && !executionError ? "bg-faint" : demo.exit === 0 ? "bg-[#77a74a]" : "bg-[#a24a40]")} />
                  {result ? `${result.exitCode} · ${result.exitCode === 0 ? "succès" : "problèmes détectés"}` : executionError ? "Erreur d'exécution" : "En attente"}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-cream px-3.5 py-2.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Durée réelle</p>
                <p className="mt-1 font-mono text-[12px] font-medium text-ink">{result ? `${result.durationMs} ms` : "—"}</p>
              </div>
              <div className="rounded-xl border border-lime-deep/20 bg-lime-soft px-3.5 py-2.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-lime-deep">Option clé</p>
                <p className="mt-1 font-mono text-[10.5px] text-lime-deep">{tool.keyFlags[0]}</p>
              </div>
            </div>

            <p
              role={executionError ? "alert" : "status"}
              aria-live={executionError ? "assertive" : "polite"}
              className="mt-3 flex items-start gap-2 text-[12.5px] leading-relaxed text-muted"
            >
              <Icon name="info" size={12} className="mt-0.5 shrink-0 text-lime-deep" />
              {executionError
                ? `La requête n'a pas pu aboutir : ${executionError}`
                : result
                  ? "Sortie produite par l'outil Devwell sélectionné, exécuté sur la fixture temporaire. Aucun fichier de votre projet n'est transmis."
                  : "Choisissez un outil puis lancez-le pour afficher sa vraie sortie sur le projet d'exemple."}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-line bg-cream p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Accessibilité</p>
            <h2 className="mt-1.5 font-display text-[17px] font-medium tracking-[-0.02em] text-ink">
              La couleur n'est jamais la seule information.
            </h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
              Chaque statut porte un symbole et un texte. Avec NO_COLOR=1, le rendu reste complet.
              La jauge de score inclut toujours son libellé.
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {symbolLegend.map((item) => (
                <li key={item.symbol} className="flex items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-1.5">
                  <span className={cn("font-mono text-[12px]", item.tone)}>{item.symbol}</span>
                  <span className="text-[12px] text-ink-soft">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-line bg-paper-2/50 p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Les quatre outils</p>
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
                    <span className="block font-mono text-[11px] font-medium text-ink">{item.name}</span>
                    <span className="block truncate text-[11px] text-muted">{item.tagline}</span>
                  </span>
                  <Icon name="arrow-up-right" size={11} className="shrink-0 text-faint group-hover:text-ink" />
                </a>
              ))}
            </div>
            <a
              href="#/guide/commandes"
              className="mt-3 inline-flex w-full items-center justify-between rounded-lg border border-line bg-cream px-3 py-2 font-mono text-[9.5px] text-muted transition hover:text-ink"
            >
              Voir l'aide-mémoire complet <Icon name="arrow-right" size={11} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
