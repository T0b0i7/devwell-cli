import { useState } from "react";
import { toolDocs } from "../data/tools";
import { comparisonRows, principles } from "../data/suite";
import { guideSections } from "../data/guide";
import { heroDemo } from "../data/demos";
import type { ToolMeta } from "../data/types";
import { cn } from "../utils/cn";
import { CodeBlock } from "../components/CodeBlock";
import { CopyButton } from "../components/CopyButton";
import { Icon } from "../components/Icon";
import { Terminal } from "../components/Terminal";
import { useSiteContent } from "../data/siteContent";

const accents: Record<ToolMeta["accent"], { tile: string; line: string; text: string; soft: string }> = {
  lime: { tile: "bg-lime", line: "bg-lime-deep", text: "text-lime-deep", soft: "bg-lime-soft" },
  mint: { tile: "bg-[#c8ead4]", line: "bg-[#4f7f61]", text: "text-[#386347]", soft: "bg-[#e7f2e9]" },
  sky: { tile: "bg-[#d4e9f5]", line: "bg-[#3f6d87]", text: "text-[#315e77]", soft: "bg-[#e8f2f8]" },
  amber: { tile: "bg-[#f4e3bd]", line: "bg-[#8a6418]", text: "text-[#7a5a16]", soft: "bg-[#f6ecd5]" },
};

function Kicker({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em]",
        dark ? "text-[#a3a898]" : "text-muted",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dark ? "bg-lime" : "bg-lime-deep/70")} aria-hidden="true" />
      {children}
    </p>
  );
}

function ToolCard({ tool }: { tool: ToolMeta }) {
  const accent = accents[tool.accent];
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-cream p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_20px_40px_-32px_rgba(23,24,15,0.55)] sm:p-6">
      <a
        href={`#/docs/${tool.slug}`}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-2"
        aria-label={`Découvrir ${tool.name}`}
      >
        <span className="sr-only">{tool.name}</span>
      </a>
      <div className="relative z-[1] flex items-start justify-between">
        <span className={cn("inline-flex h-11 w-11 items-center justify-center rounded-xl border border-ink/10", accent.tile)}>
          <Icon name={tool.icon} size={21} className="text-on-accent" />
        </span>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-line bg-paper px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
            {tool.priority}
          </span>
          <span className="font-mono text-[11px] text-faint">{tool.index}</span>
        </div>
      </div>
      <div className="relative z-[1] mt-4">
        <p className="font-mono text-[13.5px] font-semibold tracking-[-0.02em] text-ink">{tool.name}</p>
        <p className="mt-1.5 font-display text-[19px] font-medium leading-[1.2] tracking-[-0.025em] text-ink">
          {tool.tagline}
        </p>
        <p className="mt-2.5 text-[12.5px] leading-[1.65] text-muted">{tool.short}</p>
      </div>
      <div className="relative z-[1] mt-4 flex flex-wrap gap-1.5">
        {tool.keyFlags.map((flag) => (
          <span key={flag} className="rounded-md border border-line bg-paper-2/70 px-1.5 py-0.5 font-mono text-[9.5px] text-ink-soft">
            {flag}
          </span>
        ))}
        <span className={cn("rounded-md px-1.5 py-0.5 font-mono text-[9.5px]", accent.soft, accent.text)}>
          {tool.language.split(" · ")[0]}
        </span>
      </div>
      <div className="relative z-[1] mt-5 flex items-center gap-2 border-t border-line pt-3.5">
        <span className="flex min-w-0 flex-1 items-center gap-1.5 font-mono text-[10px] text-muted">
          <span className="text-lime-deep"></span>
          <span className="truncate">{tool.binary}</span>
        </span>
        <span className="relative z-10">
          <CopyButton value={tool.binary} variant="light" label="" />
        </span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-paper text-ink transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-lime">
          <Icon name="arrow-up-right" size={12} />
        </span>
      </div>
    </div>
  );
}

const installTabs = [
  {
    id: "local",
    label: "Dépôt",
    hint: "Tester depuis la source",
    code: `# Depuis la racine du dépôt
npm install --global .
devwell readme --dry-run
devwell env --help
devwell doctor --json
devwell branches --json`,
  },
  {
    id: "npm",
    label: "Archive",
    hint: "Installation locale",
    code: `# Créer une archive depuis le dépôt
npm pack
npm install --global .\\devwell-0.1.1.tgz

# Puis utiliser les sous-commandes
devwell env --json
devwell doctor --json`,
  },
  {
    id: "global",
    label: "npm -g",
    hint: "Après publication npm",
    code: `# Le package npm n'est pas encore publié
npm install --global devwell

devwell readme --help
devwell env --help
devwell doctor --help
devwell branches --help`,
  },
];

export function HomePage() {
  const [tab, setTab] = useState("local");
  const currentTab = installTabs.find((item) => item.id === tab) ?? installTabs[0];
  const quickRows = comparisonRows.slice(0, 4);
  const siteContent = useSiteContent();

  return (
    <main>
      {siteContent.announcements.filter((announcement) => announcement.published).map((announcement) => (
        <aside
          key={announcement.id}
          aria-label={`Annonce : ${announcement.title}`}
          className="border-b border-lime-deep/20 bg-lime-soft px-4 py-3 text-ink"
        >
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-3 gap-y-1.5 sm:px-2">
            <span className="rounded-full bg-lime px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-on-accent">
              Annonce
            </span>
            <strong className="text-[12px] font-semibold">{announcement.title}</strong>
            <span className="text-[12px] text-ink-soft">{announcement.message}</span>
            {announcement.href && announcement.linkLabel && (
              <a
                href={announcement.href}
                className="inline-flex min-h-8 items-center gap-1 font-medium text-lime-deep underline underline-offset-2 hover:text-ink"
                target={announcement.href.startsWith("https://") ? "_blank" : undefined}
                rel={announcement.href.startsWith("https://") ? "noreferrer" : undefined}
              >
                {announcement.linkLabel}
                <Icon name="arrow-up-right" size={12} />
              </a>
            )}
          </div>
        </aside>
      ))}
      {/* HERO */}
      <section className="home-hero group relative isolate overflow-hidden border-b border-line">
        <div className="grid-paper pointer-events-none absolute inset-0 z-0 opacity-70 [mask-image:linear-gradient(to_bottom,black_10%,transparent_92%)]" aria-hidden="true" />
        <div
          className="hero-ambient pointer-events-none absolute -right-[18rem] -top-[15rem] z-0 h-[58rem] w-[72rem] max-w-[150vw] rounded-full"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.02fr_1fr] lg:gap-14 lg:py-24">
          <div className="min-w-0 animate-rise">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-lime px-2.5 py-1 font-mono text-[9.5px] font-medium uppercase tracking-[0.08em] text-on-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-ink" /> v0.1.1 · disponibilité publique
              </span>
              <span className="rounded-full border border-line bg-cream/80 px-2.5 py-1 font-mono text-[9.5px] tracking-[0.04em] text-muted">
                4 outils CLI
              </span>
              <span className="rounded-full border border-line bg-cream/80 px-2.5 py-1 font-mono text-[9.5px] tracking-[0.04em] text-muted">
                Node &amp; Python
              </span>
              <span className="rounded-full border border-line bg-cream/80 px-2.5 py-1 font-mono text-[9.5px] tracking-[0.04em] text-muted">
                MIT
              </span>
            </div>

            <h1 className="mt-6 font-display text-[2.65rem] font-medium leading-[0.98] tracking-[-0.05em] text-ink sm:text-[3.6rem] lg:text-[4.05rem]">
              {siteContent.heroTitle}
              <br />
              <span className="relative inline-block font-serif text-[1.13em] font-normal italic tracking-[-0.02em] text-ink">
                {siteContent.heroAccent}
                <svg
                  viewBox="0 0 320 14"
                  className="absolute -bottom-2 left-0 w-[94%] text-lime-deep"
                  fill="none"
                  aria-hidden="true"
                  preserveAspectRatio="none"
                >
                  <path d="M2 10C74 3 178 2 318 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
                </svg>
              </span>
            </h1>

            <p className="mt-7 max-w-[34rem] text-pretty text-[14.5px] leading-[1.75] text-ink-soft sm:text-[15.5px]">
              {siteContent.heroDescription}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <a
                href="#/install"
                className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[12.5px] font-medium text-cream transition hover:bg-ink-soft"
              >
                Démarrer en 60 s
                <Icon name="arrow-right" size={14} className="text-lime" />
              </a>
              <a
                href="#/guide"
                className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-cream px-4 py-2.5 text-[12.5px] font-medium text-ink transition hover:bg-paper-2"
              >
                <Icon name="book" size={14} />
                Lire le guide
              </a>
              <a
                href="#/playground"
                className="inline-flex items-center gap-2 rounded-xl px-2.5 py-2.5 text-[12.5px] font-medium text-muted transition hover:text-ink"
              >
                <Icon name="play" size={13} />
                Voir les sorties
              </a>
            </div>

            <div className="mt-8 inline-flex max-w-full items-center gap-2 rounded-xl border border-line bg-cream/90 py-1.5 pl-3 pr-1.5 shadow-[0_1px_0_rgba(23,24,15,0.03)]">
              <span className="font-mono text-[11px] text-lime-deep" aria-hidden="true">

              </span>
              <code className="min-w-0 truncate font-mono text-[11px] text-ink-soft sm:text-[11.5px]">
                devwell doctor --json
              </code>
              <CopyButton value="devwell doctor --json" variant="light" label="" />
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[9.5px] text-muted">
              <span className="inline-flex items-center gap-1.5"><Icon name="check" size={11} className="text-lime-deep" /> dry-run par défaut</span>
              <span className="inline-flex items-center gap-1.5"><Icon name="check" size={11} className="text-lime-deep" /> sortie JSON stable</span>
              <span className="inline-flex items-center gap-1.5"><Icon name="check" size={11} className="text-lime-deep" /> aucune télémétrie</span>
            </div>
          </div>

          <div className="min-w-0 animate-rise [animation-delay:120ms]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#77a74a]" />
                Simulation · sortie contractuelle
              </span>
              <a href="#/playground" className="font-mono text-[9.5px] text-muted underline decoration-line-strong underline-offset-4 transition hover:text-ink">
                Ouvrir le playground
              </a>
            </div>
            <Terminal demo={heroDemo} compact />
            <div className="mt-3 grid grid-cols-1 divide-y divide-line rounded-xl border border-line bg-cream/80 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[
                ["Score", "0-100", "explicable"],
                ["Checks", "6", "pondérés"],
                ["Fix", "sûr", "dry-run"],
              ].map(([label, value, note]) => (
                <div key={label} className="px-3 py-2">
                  <p className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-faint">{label}</p>
                  <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 font-display text-[13px] font-semibold text-ink">
                    <span>{value}</span>
                    <span className="font-sans text-[9.5px] font-normal text-muted">{note}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TOOL STRIP */}
      <section aria-label="Les quatre outils" className="border-b border-line bg-cream/60">
        <div className="mx-auto grid w-full max-w-[1240px] grid-cols-2 divide-line px-4 sm:px-6 lg:grid-cols-4 lg:divide-x">
          {toolDocs.map((tool, i) => (
            <a
              key={tool.slug}
              href={`#/docs/${tool.slug}`}
              className={cn(
                "group flex items-center gap-3 py-5 transition-colors hover:bg-lime-soft/50",
                "lg:px-5 lg:first:pl-0 lg:last:pr-0",
                i < 2 && "border-b border-line lg:border-b-0",
                i % 2 === 0 && "pr-4",
                i % 2 === 1 && "pl-4 lg:pl-5",
              )}
            >
              <span className="font-mono text-[9.5px] text-faint">{tool.index}</span>
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-ink/10", accents[tool.accent].tile)}>
                <Icon name={tool.icon} size={14} className="text-ink" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-[11.5px] font-medium text-ink">{tool.name}</span>
                <span className="block truncate text-[10px] text-muted">{tool.tagline}</span>
              </span>
              <Icon name="arrow-up-right" size={13} className="shrink-0 text-faint transition group-hover:text-ink" />
            </a>
          ))}
        </div>
      </section>

      {/* TOOLS */}
      <section className="mx-auto w-full max-w-[1240px] px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Kicker>La suite</Kicker>
            <h2 className="mt-3 max-w-xl font-display text-[1.9rem] font-medium leading-[1.08] tracking-[-0.04em] text-ink sm:text-[2.5rem]">
              Quatre gestes,
              <br className="hidden sm:block" /> une seule logique.
            </h2>
          </div>
          <p className="max-w-sm text-[13px] leading-[1.7] text-muted md:text-right">
            Lecture seule d'abord. Une option explicite pour écrire. Un code retour fiable pour la CI.
            Chaque outil tient sa promesse en une commande.
          </p>
        </div>

        <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {toolDocs.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-line bg-paper-2/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="shrink-0 font-mono text-[9px] uppercase tracking-[0.13em] text-muted">
            Chaque fiche couvre la trame A-'H
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              ["A", "Cadrage"],
              ["B", "Spécification"],
              ["C", "Technique"],
              ["D", "UX CLI"],
              ["E", "Implémentation"],
              ["F", "Tests"],
              ["G", "Documentation"],
              ["H", "Livraison"],
            ].map(([letter, label]) => (
              <span
                key={letter}
                className="inline-flex items-center gap-1 rounded border border-line bg-cream px-1.5 py-0.5 font-mono text-[8.5px] text-ink-soft"
              >
                <span className="text-lime-deep">{letter}</span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
        <div className="relative min-w-0 grid-cols-1 overflow-hidden rounded-[1.75rem] bg-term px-5 py-9 text-cream sm:px-9 sm:py-11">
          <div className="grid-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-lime/10 blur-3xl" aria-hidden="true" />
          <div className="relative grid grid-cols-1 gap-9 lg:grid-cols-[0.85fr_1.35fr] lg:gap-14">
            <div>
              <Kicker dark>Principes de conception</Kicker>
              <h2 className="mt-3 font-display text-[1.7rem] font-medium leading-[1.1] tracking-[-0.035em] text-cream sm:text-[2.1rem]">
                La confiance se code dans les{" "}
                <span className="font-serif font-normal italic text-lime">valeurs par défaut.</span>
              </h2>
              <p className="mt-4 max-w-sm text-[12.5px] leading-[1.75] text-[#adb2a4]">
                Quatre binaires indépendants, un noyau commun testé, et une règle : rien ne se passe
                sans consentement explicite.
              </p>
              <a
                href="#/ressources"
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 font-mono text-[10.5px] text-cream transition hover:border-lime/50 hover:text-lime"
              >
                Lire les décisions techniques <Icon name="arrow-right" size={12} />
              </a>
            </div>
            <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {principles.map((principle, index) => (
                <div key={principle.title} className="border-t border-white/12 pt-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-[14px] font-medium text-cream">{principle.title}</h3>
                    <span className="font-mono text-[8.5px] text-[#787e6f]">0{index + 1}</span>
                  </div>
                  <p className="mt-2 text-[11.8px] leading-[1.7] text-[#a5ab9c]">{principle.text}</p>
                  <p className="mt-2.5 inline-flex rounded border border-lime/25 bg-lime/10 px-1.5 py-0.5 font-mono text-[9px] text-lime">
                    {principle.metric}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mt-9 grid grid-cols-2 gap-4 border-t border-white/12 pt-6 sm:grid-cols-4">
            {[
              ["< 200 ms", "temps de démarrage"],
              ["1", "dépendance runtime / outil"],
              ["3", "OS couverts en CI"],
              ["4/4", "outils en français par défaut"],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-display text-[1.45rem] font-medium tracking-[-0.03em] text-lime">{value}</p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[#8f9585]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUICKSTART */}
      <section className="mx-auto w-full max-w-[1240px] px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-14">
          <div>
            <Kicker>Installation</Kicker>
            <h2 className="mt-3 font-display text-[1.9rem] font-medium leading-[1.08] tracking-[-0.04em] text-ink sm:text-[2.4rem]">
              De zéro à un premier
              <br className="hidden sm:block" /> diagnostic en une minute.
            </h2>
            <p className="mt-4 max-w-md text-[13px] leading-[1.75] text-muted">
              Pas de compte, pas de config, pas de service à lancer. Node 18.17+ et git 2.30+
              suffisent. Le mode lecture seule est actif par défaut.
            </p>
            <ol className="mt-7 space-y-4">
              {[
                ["Installer l'outil utile", "Une dépendance de dev, ou npx pour tester."],
                ["Lancer un audit non destructif", "env-doctor, project-doctor --offline, branch-cleaner --graph."],
                ["Automatiser une fois compris", "Ajoutez les checks en CI et un seuil explicite."],
              ].map(([title, text], index) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line bg-cream font-mono text-[10px] font-semibold text-ink">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-ink">{title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#/install"
                className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[12px] font-medium text-cream transition hover:bg-ink-soft"
              >
                Guide d'installation <Icon name="arrow-right" size={13} className="text-lime" />
              </a>
              <span className="font-mono text-[9.5px] text-muted">Windows · WSL · macOS · Linux</span>
            </div>
          </div>

          <div>
            <div
              role="group"
              aria-label="Modes d'installation"
              className="mb-3 flex flex-wrap gap-1.5"
            >
              {installTabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={tab === item.id}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-[10.5px] transition-colors",
                    tab === item.id
                      ? "border-ink bg-ink text-lime"
                      : "border-line bg-cream text-muted hover:border-line-strong hover:text-ink",
                  )}
                >
                  {item.label}
                  <span className={cn("hidden text-[8.5px] sm:inline", tab === item.id ? "text-lime/60" : "text-faint")}>
                    {item.hint}
                  </span>
                </button>
              ))}
            </div>
            <CodeBlock code={currentTab.code} title={`installation -" ${currentTab.label}`} lang="bash" />
            <p className="flex items-start gap-2 font-mono text-[9.5px] leading-relaxed text-muted">
              <Icon name="info" size={12} className="mt-0.5 shrink-0 text-lime-deep" />
              Les quatre binaires exposent --help et --version. Aucune installation n'est requise pour lire la documentation.
            </p>
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="border-y border-line bg-cream/60">
        <div className="mx-auto w-full max-w-[1240px] px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <Kicker>Le rituel</Kicker>
              <h2 className="mt-3 font-display text-[1.9rem] font-medium leading-[1.08] tracking-[-0.04em] text-ink sm:text-[2.4rem]">
                Trois moments. Pas un de plus.
              </h2>
            </div>
            <a
              href="#/guide/parcours"
              className="inline-flex items-center gap-2 font-mono text-[10.5px] text-muted underline decoration-line-strong underline-offset-4 transition hover:text-ink"
            >
              Voir le parcours quotidien <Icon name="arrow-right" size={12} />
            </a>
          </div>

          <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                moment: "Avant de pousser",
                title: "Un environnement sain",
                tool: "env-doctor",
                command: "devwell env --strict",
                detail: "Variables alignées, secrets masqués, doublons signalés. Le check le plus rapide de la suite.",
                href: "#/docs/env-doctor",
                icon: "env" as const,
                result: "exit 0 ou 1",
              },
              {
                moment: "Avant la release",
                title: "Une santé partagée",
                tool: "project-doctor",
                command: "devwell doctor --report health.html",
                detail: "Runtime, configs, lockfile et dépendances, avec un score expliqué et un rapport HTML autonome.",
                href: "#/docs/project-doctor",
                icon: "stethoscope" as const,
                result: "score 0-100",
              },
              {
                moment: "Après les merges",
                title: "Un historique propre",
                tool: "branch-cleaner",
                command: "devwell branches --graph",
                detail: "Branches mergées, orphelines et inactives. Dry-run par défaut, suppression seulement après --apply.",
                href: "#/docs/branch-cleaner",
                icon: "branch" as const,
                result: "dry-run par défaut",
              },
            ].map((card, index) => (
              <a
                key={card.tool}
                href={card.href}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-paper p-5 transition hover:border-line-strong hover:bg-lime-soft/30"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted">0{index + 1} / {card.moment}</span>
                  <Icon name={card.icon} size={17} className="text-faint transition group-hover:text-ink" />
                </div>
                <h3 className="mt-6 font-display text-[17px] font-medium tracking-[-0.02em] text-ink">{card.title}</h3>
                <p className="mt-2 flex-1 text-[12px] leading-[1.7] text-muted">{card.detail}</p>
                <div className="mt-5 rounded-lg border border-line bg-cream px-3 py-2">
                  <code className="block truncate font-mono text-[10px] text-ink-soft">{card.command}</code>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-[9px] text-faint">{card.result}</span>
                  <span className="inline-flex items-center gap-1 font-mono text-[9.5px] font-medium text-ink">
                    {card.tool} <Icon name="arrow-up-right" size={11} />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="mx-auto w-full max-w-[1240px] px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid grid-cols-1 gap-9 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
          <div>
            <Kicker>Choisir son point de départ</Kicker>
            <h2 className="mt-3 font-display text-[1.9rem] font-medium leading-[1.08] tracking-[-0.04em] text-ink sm:text-[2.3rem]">
              Commencez par
              <br className="hidden sm:block" /> le plus urgent.
            </h2>
            <p className="mt-4 text-[13px] leading-[1.75] text-muted">
              env-doctor et readme-gen sont prioritaires : ils suppriment les erreurs les plus co-"teuses
              en onboarding et en release. Les deux autres installent la confiance.
            </p>
            <a
              href="#/comparatif"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-line-strong bg-cream px-3.5 py-2 text-[12px] font-medium text-ink transition hover:bg-paper-2"
            >
              Comparatif complet <Icon name="arrow-right" size={13} />
            </a>
          </div>
          <div className="overflow-hidden rounded-xl border border-line bg-cream">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left text-[12px]">
                <thead>
                  <tr className="border-b border-line bg-paper-2/80">
                    {["Outil", "Langage", "LOC", "Dépendances", "Priorité"].map((header) => (
                      <th key={header} className="px-3.5 py-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quickRows.map((row, index) => (
                    <tr key={row[0]} className="border-b border-line/70 last:border-b-0 hover:bg-lime-soft/25">
                      <td className="px-3.5 py-2.5">
                        <a href={`#/docs/${row[0]}`} className="inline-flex items-center gap-2 font-mono text-[11.5px] font-medium text-ink group">
                          <span className="text-[9px] text-faint">0{index + 1}</span>
                          {row[0]}
                          <Icon name="arrow-up-right" size={10} className="text-faint group-hover:text-ink" />
                        </a>
                      </td>
                      <td className="px-3.5 py-2.5 text-[11.5px] text-muted">{row[1]}</td>
                      <td className="px-3.5 py-2.5 font-mono text-[11px] text-ink-soft">{row[2]}</td>
                      <td className="px-3.5 py-2.5 text-[11.5px] text-muted">{row[3]}</td>
                      <td className="px-3.5 py-2.5">
                        <span className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[9px] text-ink-soft">{row[5]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-line bg-paper-2/40 px-3.5 py-2 font-mono text-[9px] text-faint">
              Estimations v0.1.1 · TypeScript strict · Node -- 18.17 · 1 dépendance runtime par binaire
            </p>
          </div>
        </div>
      </section>

      {/* GUIDE CTA */}
      <section className="mx-auto w-full max-w-[1240px] px-4 pb-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-lime-deep/20 bg-lime-soft">
          <div className="dots pointer-events-none absolute inset-0 opacity-[0.18]" aria-hidden="true" />
          <div className="relative grid grid-cols-1 gap-8 px-5 py-9 sm:px-9 sm:py-11 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
            <div>
              <Kicker>Guide d'utilisation</Kicker>
              <h2 className="mt-3 max-w-md font-display text-[1.9rem] font-medium leading-[1.08] tracking-[-0.04em] text-ink sm:text-[2.35rem]">
                De votre premier clone à la{" "}
                <span className="font-serif font-normal italic">première release.</span>
              </h2>
              <p className="mt-4 max-w-md text-[13px] leading-[1.75] text-ink-soft">
                Installation, config d'équipe, parcours quotidien, automatisation CI, sécurité,
                dépannage et plan d'adoption sur quatre semaines.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <a
                  href="#/guide"
                  className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[12.5px] font-medium text-cream transition hover:bg-ink-soft"
                >
                  Ouvrir le guide complet <Icon name="arrow-right" size={13} className="text-lime" />
                </a>
                <a
                  href="#/guide/commandes"
                  className="inline-flex items-center gap-2 rounded-xl border border-lime-deep/25 bg-cream/60 px-3.5 py-2.5 font-mono text-[10.5px] text-lime-deep transition hover:bg-cream"
                >
                  Aide-mémoire des commandes
                </a>
              </div>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {guideSections.slice(0, 6).map((section, index) => (
                <a
                  key={section.id}
                  href={`#/guide/${section.id}`}
                  className="group flex items-start gap-3 rounded-xl border border-lime-deep/15 bg-cream/55 p-3 transition hover:border-lime-deep/35 hover:bg-cream"
                >
                  <span className="mt-0.5 font-mono text-[9px] text-lime-deep/70">{String(index + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-medium leading-tight text-ink">{section.title}</span>
                    <span className="mt-1 block truncate font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted">{section.kicker}</span>
                  </span>
                  <Icon name="arrow-up-right" size={11} className="mt-0.5 shrink-0 text-lime-deep/50 transition group-hover:text-lime-deep" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
