import { devEnvBlocks, quickstartBlocks, releaseBlocks, resourcesBlocks, comparisonRows, comparisonNote } from "../data/suite";
import { toolDocs } from "../data/tools";
import type { Block } from "../data/types";
import { Blocks } from "../components/Blocks";
import { CopyButton } from "../components/CopyButton";
import { Icon } from "../components/Icon";
import { PageHeader, SuiteSidekick } from "../components/PageHeader";

function ContentShell({ blocks, aside }: { blocks: Block[]; aside?: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 sm:py-10">
      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_195px]">
        <div className="min-w-0 max-w-[830px]">
          <Blocks blocks={blocks} />
        </div>
        {aside && (
          <aside className="hidden xl:block">
            <div className="sticky top-[6.5rem]">{aside}</div>
          </aside>
        )}
      </div>
    </div>
  );
}

function AsideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-cream p-4">
      <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-faint">{title}</p>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

export function InstallPage() {
  return (
    <div>
      <PageHeader
        kicker="Démarrage · installation"
        title={
          <>
            Installation.
            <br />
            <span className="font-serif text-[1.05em] font-normal italic">Moins de 60 secondes.</span>
          </>
        }
        intro="Installez uniquement les outils dont vous avez besoin. Chaque binaire tient en une dépendance runtime, fonctionne hors ligne après installation et ne demande aucune configuration initiale."
        compact
        sidekick={<SuiteSidekick />}
        meta={[
          { label: "Prérequis", value: "Node -- 18.17, git -- 2.30" },
          { label: "Systèmes", value: "Linux, macOS, Windows/WSL" },
          { label: "Configuration", value: "Facultative" },
          { label: "Télémétrie", value: "Aucune" },
        ]}
        actions={
          <>
            <span className="inline-flex items-center gap-2 rounded-xl bg-ink py-2 pl-3 pr-1.5 text-cream">
              <span className="font-mono text-[10px] text-lime"></span>
              <code className="font-mono text-[10.5px]">npm install --global .</code>
              <CopyButton value="npm install --global ." variant="dark" label="" />
            </span>
            <a
              href="#/guide/demarrage"
              className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-cream px-3.5 py-2 text-[11.5px] font-medium text-ink transition hover:bg-paper-2"
            >
              Guide détaillé <Icon name="arrow-right" size={12} />
            </a>
          </>
        }
      />

      <ContentShell
        blocks={[...quickstartBlocks, ...devEnvBlocks]}
        aside={
          <div className="space-y-3 py-8">
            <AsideCard title="Choix rapide">
              <ul className="space-y-1.5 text-[10.5px] leading-relaxed text-muted">
                <li><strong className="font-medium text-ink">Tester</strong><br />devwell env --help</li>
                <li className="border-t border-line pt-1.5"><strong className="font-medium text-ink">Adopter</strong><br />Installer depuis le dépôt</li>
                <li className="border-t border-line pt-1.5"><strong className="font-medium text-ink">Multi-dépôts</strong><br />npm install --global .</li>
              </ul>
            </AsideCard>
            <AsideCard title="- lire ensuite">
              <div className="space-y-1.5">
                {[
                  ["Guide d'utilisation", "#/guide"],
                  ["Playground", "#/playground"],
                  ["Automatiser en CI", "#/guide/ci"],
                  ["Ressources", "#/ressources"],
                ].map(([label, href]) => (
                  <a key={href} href={href} className="flex items-center gap-1.5 text-[10.5px] text-muted transition hover:text-ink">
                    <Icon name="arrow-right" size={10} className="text-faint" />
                    {label}
                  </a>
                ))}
              </div>
            </AsideCard>
          </div>
        }
      />
    </div>
  );
}

export function ResourcesPage() {
  return (
    <div>
      <PageHeader
        kicker="La suite · ressources"
        title={
          <>
            Produire, tester,
            <br />
            <span className="font-serif text-[1.05em] font-normal italic">partager.</span>
          </>
        }
        intro="Tout ce qui maintient la suite dans le temps : workflow CI réutilisable, conventions du monorepo, licence MIT, politiques de contribution et contrats de sortie."
        compact
        sidekick={<SuiteSidekick />}
        meta={[
          { label: "Dépôt", value: "GitHub public" },
          { label: "Licence", value: "MIT · 2026" },
          { label: "CI", value: "3 OS -- Node 18/20/22" },
          { label: "Publication", value: "npm provenance OIDC" },
        ]}
        actions={
          <>
            <span className="inline-flex items-center gap-2 rounded-xl bg-ink px-3.5 py-2 text-[11.5px] font-medium text-cream">
              <Icon name="github" size={13} /> Code source sur GitHub
            </span>
            <a
              href="#/guide/securite"
              className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-cream px-3.5 py-2 text-[11.5px] font-medium text-ink transition hover:bg-paper-2"
            >
              <Icon name="shield" size={12} /> Politique de sécurité
            </a>
          </>
        }
      />

      <ContentShell
        blocks={resourcesBlocks}
        aside={
          <div className="space-y-3 py-8">
            <AsideCard title="Liens directs">
              <div className="space-y-1.5">
                {[
                  ["LICENSE", "#/ressources"],
                  ["CONTRIBUTING.md", "#/ressources"],
                  ["SECURITY.md", "#/guide/securite"],
                  ["Workflow CI", "#/ressources"],
                  ["ADR", "#/ressources"],
                ].map(([label, href]) => (
                  <a key={label} href={href} className="flex items-center gap-1.5 font-mono text-[10px] text-muted transition hover:text-ink">
                    <Icon name="file" size={10} className="text-faint" /> {label}
                  </a>
                ))}
              </div>
            </AsideCard>
            <div className="rounded-xl border border-lime-deep/20 bg-lime-soft p-4">
              <p className="flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-lime-deep">
                <Icon name="shield" size={11} /> Sécurité
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
                Faille de sécurité ? N'ouvrez pas d'issue publique. Le canal privé de signalement sera publié avant la sortie.
              </p>
            </div>
          </div>
        }
      />
    </div>
  );
}

export function ReleasePage() {
  return (
    <div>
      <PageHeader
        kicker="La suite · livraison & roadmap"
        title={
          <>
            Livrer la v0.1.1.
            <br />
            <span className="font-serif text-[1.05em] font-normal italic">Préparer la suite.</span>
          </>
        }
        intro="Versionning SemVer, publication npm avec provenance, communication d'équipe et trajectoire jusqu'à la v2.0. Le récapitulatif comparatif des quatre outils clôture la spec."
        compact
        sidekick={<SuiteSidekick />}
        meta={[
          { label: "Version", value: "0.1.1" },
          { label: "Licence", value: "MIT" },
          { label: "Priorités", value: "P0 : 2 outils · P1 : 2 outils" },
          { label: "Prochaine étape", value: "v1.0 sous 6 semaines" },
        ]}
        actions={
          <>
            <a
              href="#/comparatif"
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-3.5 py-2 text-[11.5px] font-medium text-cream transition hover:bg-ink-soft"
            >
              Comparatif détaillé <Icon name="arrow-right" size={12} className="text-lime" />
            </a>
            <a
              href="#/ressources"
              className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-cream px-3.5 py-2 text-[11.5px] font-medium text-ink transition hover:bg-paper-2"
            >
              Workflow de release <Icon name="arrow-right" size={12} />
            </a>
          </>
        }
      />
      <ContentShell blocks={releaseBlocks} aside={<ReleaseAside />} />
    </div>
  );
}

function ReleaseAside() {
  return (
    <div className="space-y-3 py-8">
      <AsideCard title="Séquence">
        <ol className="space-y-2">
          {["Tests 3 OS", "Build + npm pack", "Version + tag signé", "GitHub Release", "npm publish"].map((step, index) => (
            <li key={step} className="flex items-center gap-2 text-[10.5px] text-muted">
              <span className="flex h-4 w-4 items-center justify-center rounded border border-line bg-paper font-mono text-[8px] text-ink">{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </AsideCard>
      <div className="rounded-xl border border-line bg-paper-2/50 p-4">
        <p className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-faint">Règle de version</p>
        <p className="mt-2 font-mono text-[11px] text-ink">0.1.0 -' 0.2.0</p>
        <p className="mt-1 text-[10.5px] leading-relaxed text-muted">Ajout compatible. Toute rupture du schéma JSON attend una majeure.</p>
      </div>
    </div>
  );
}

export function ComparePage() {
  return (
    <div>
      <PageHeader
        kicker="La suite · comparatif"
        title={
          <>
            Quatre outils,
            <br />
            <span className="font-serif text-[1.05em] font-normal italic">des choix assumés.</span>
          </>
        }
        intro="Langage, dépendances, volume de code, temps de développement et priorité de version : le récapitulatif livrable pour arbitrer l'adoption et planifier la suite."
        compact
        sidekick={<SuiteSidekick />}
        meta={[
          { label: "Total LOC", value: "-? 2 900 estimées" },
          { label: "Temps total", value: "-? 17,5 j-h" },
          { label: "Runtime", value: "1 dépendance / outil" },
          { label: "Format", value: "Dry-run + exit 0/1/2" },
        ]}
        actions={
          <>
            <a
              href="#/livraison"
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-3.5 py-2 text-[11.5px] font-medium text-cream transition hover:bg-ink-soft"
            >
              Plan de release <Icon name="arrow-right" size={12} className="text-lime" />
            </a>
            <a
              href="#/guide"
              className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-cream px-3.5 py-2 text-[11.5px] font-medium text-ink transition hover:bg-paper-2"
            >
              Guide d'utilisation <Icon name="book" size={12} />
            </a>
          </>
        }
      />

      <div className="mx-auto w-full max-w-[1180px] px-4 py-9 sm:px-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {toolDocs.map((tool) => (
            <div key={tool.slug} className="flex flex-col rounded-xl border border-line bg-cream p-4">
              <div className="flex items-center justify-between">
                <Icon name={tool.icon} size={17} className="text-ink" />
                <span className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[8.5px] text-ink-soft">
                  {tool.priority}
                </span>
              </div>
              <p className="mt-3 font-mono text-[11.5px] font-semibold text-ink">{tool.name}</p>
              <p className="mt-1 flex-1 text-[11px] leading-relaxed text-muted">{tool.short}</p>
              <dl className="mt-3 space-y-1 border-t border-line pt-2 font-mono text-[9px]">
                <div className="flex justify-between gap-2"><dt className="text-faint">LOC</dt><dd className="text-ink-soft">{tool.loc}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-faint">DEV</dt><dd className="text-ink-soft">{tool.devTime}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-faint">DEPS</dt><dd className="text-ink-soft">{tool.deps}</dd></div>
              </dl>
              <a
                href={`#/docs/${tool.slug}`}
                className="mt-3 inline-flex items-center justify-between rounded-lg border border-line bg-paper px-2.5 py-1.5 font-mono text-[9px] text-ink transition hover:border-lime-deep/30 hover:bg-lime-soft"
              >
                Lire la fiche <Icon name="arrow-up-right" size={10} />
              </a>
            </div>
          ))}
        </div>

        <div className="mt-7 overflow-hidden rounded-xl border border-line bg-cream">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-paper-2/60 px-4 py-2.5">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.13em] text-muted">Récapitulatif -" v0.1.1</p>
            <p className="font-mono text-[9px] text-faint">Estimations · TypeScript strict</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[54rem] border-collapse text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-line">
                  {["Outil", "Langage", "LOC estimées", "Dépendances", "Temps dev", "Priorité v1", "Tests"].map((header) => (
                    <th key={header} className="px-4 py-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row[0]} className="border-b border-line/70 last:border-b-0 hover:bg-lime-soft/25">
                    <td className="px-4 py-2.5 font-mono text-[11.5px] font-medium text-ink">{row[0]}</td>
                    <td className="px-4 py-2.5 text-[11.5px] text-ink-soft">{row[1]}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-ink-soft">{row[2]}</td>
                    <td className="px-4 py-2.5 text-[11.5px] text-muted">{row[3]}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-ink-soft">{row[4]}</td>
                    <td className="px-4 py-2.5"><span className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[9px]">{row[5]}</span></td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-ink-soft">{row[6]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line bg-paper-2/40 px-4 py-2.5 text-[11px] leading-relaxed text-muted">{comparisonNote}</p>
        </div>

        <div className="mt-7 rounded-2xl border border-lime-deep/20 bg-lime-soft p-5 sm:p-6">
          <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-lime-deep">Ordre d'adoption recommandé</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["01", "env-doctor", "Le plus rapide à adopter : un audit, zéro configuration, un blocage CI utile.", "#/docs/env-doctor"],
              ["02", "readme-gen", "Un livrable visible immédiatement : un CHANGELOG propre à la prochaine release.", "#/docs/readme-gen"],
              ["03", "branch-cleaner", "Rend l'hygiène git visible et redonne confiance dans les nettoyages.", "#/docs/branch-cleaner"],
              ["04", "project-doctor", "Le plus riche : à activer une fois les seuils et les attentes alignés.", "#/docs/project-doctor"],
            ].map(([index, name, text, href]) => (
              <a key={name} href={href} className="group rounded-xl border border-lime-deep/15 bg-cream/70 p-3.5 transition hover:border-lime-deep/35 hover:bg-cream">
                <p className="font-mono text-[8.5px] text-lime-deep/70">{index}</p>
                <p className="mt-1 font-mono text-[11px] font-semibold text-ink">{name}</p>
                <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">{text}</p>
                <span className="mt-2 inline-flex items-center gap-1 font-mono text-[9px] text-lime-deep">
                  Ouvrir <Icon name="arrow-up-right" size={9} />
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-7 flex min-w-0 flex-col justify-between gap-4 rounded-xl border border-line bg-cream p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-[15px] font-medium text-ink">Une décision technique à arbitrer ?</p>
            <p className="mt-1 text-[12px] text-muted">Les alternatives et recommandations sont documentées dans les sections C de chaque fiche.</p>
          </div>
          <a href="#/docs/readme-gen/c-technique" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-ink px-3.5 py-2 font-mono text-[10px] text-cream">
            Voir un design technique <Icon name="arrow-right" size={11} className="text-lime" />
          </a>
        </div>
      </div>
    </div>
  );
}
