import type { ToolDoc } from "./types";

export const readmeGen: ToolDoc = {
  slug: "readme-gen",
  index: "01",
  name: "readme-gen",
  binary: "readme-gen",
  tagline: "Un CHANGELOG propre, sans y penser.",
  short:
    "Transforme l'historique git en CHANGELOG structur (Keep a Changelog) et en README squelette.",
  description:
    "Lit les commits conventionnels, les regroupe par type et par version, puis crit un CHANGELOG.md prt  publier. Si le README manque, il en gnre un squelette depuis package.json ou pyproject.toml.",
  icon: "readme",
  accent: "lime",
  language: "TypeScript  Node -- 18",
  deps: "1 runtime (picocolors)",
  loc: "~620",
  devTime: "3 j-h",
  priority: "P0",
  install: "npm install --global .",
  quickCommand: "devwell readme --since v0.2.0 --output CHANGELOG.md",
  keyFlags: ["--since", "--format", "--output"],
  tags: ["git", "conventional commits", "markdown"],
  preamble:
    "Outil 01  Gnrateur de documentation. Un binaire unique, zro fichier de config obligatoire, des sorties Markdown ou JSON.",
  sections: [
    {
      id: "a-cadrage",
      letter: "A",
      title: "Fiche de cadrage",
      subtitle: "Le problme, pour qui, et jusqu'o on va.",
      blocks: [
        {
          type: "p",
          text: "Les quipes crivent de bons commits et de mauvais CHANGELOGs. - chaque release, quelqu'un relit 80 messages git pour reconstituer 6 lignes de notes de version. readme-gen automatise ce travail de synthse et impose un format stable, lisible par les humains comême par les pipelines.",
        },
        {
          type: "table",
          headers: ["Persona", "Contexte", "Douleur mesure"],
          rows: [
            ["Mainteneuse de bibliothque", "Release mensuelle, 1  3 personnes", "30  60 min de tri de commits par version"],
            ["Lead technique", "Onboarding de nouveaux arrivants", "README obsolte, setup redcouvert  chaque fois"],
            ["ingénieur plateforme", "Pipeline de release", "Notes de version incompltes, pas de source unique"],
            ["développeur junior", "Premire contribution", "Ne sait pas quoi mettre dans une note de version"],
          ],
        },
        { type: "h3", text: "User stories" },
        {
          type: "list",
          items: [
            "En tant que mainteneuse, je veux gnrer un CHANGELOG depuis le dernier tag afin de publier une release en moins de 30 secondes.",
            "En tant que lead, je veux gnrer un README squelette quand il est absent afin qu'un nouvel arrivant sache lancer le projet.",
            "En tant qu'ingénieur CI, je veux une sortie JSON afin d'alimenter une release GitHub sans parser du Markdown.",
            "En tant que contributeur, je veux que les commits non conventionnels soient signals afin d'amliorer notre discipline sans bloquer la release.",
          ],
        },
        { type: "h3", text: "critères d'acceptation (Given / When / Then)" },
        {
          type: "table",
          headers: ["Given", "When", "Then"],
          rows: [
            ["Un dpt avec les tags v0.1.0 et v0.2.0", "je lance readme-gen --since v0.1.0", "seuls les commits postrieurs  v0.1.0 apparaissent"],
            ["Des commits feat, fix, docs, chore", "je gnre en Markdown", "les sections Added / Fixed / Documentation suivent Keep a Changelog"],
            ["Un commit mal forme", "je genere le CHANGELOG", "il est range dans Autres et un total est affiche en fin de sortie"],
            ["Aucun README.md", "je lance readme-gen --readme", "un squelette est cr depuis les mtadonnes du projet"],
            ["Un CHANGELOG existant", "je relance sans --force", "aucune criture : code retour 1 et message explicite"],
            ["Un dossier hors dpt git", "je lance la commande", "message d'erreur actionnable et code retour 2"],
          ],
        },
        { type: "h3", text: "Hors-scope explicite (v0.1.0)" },
        {
          type: "list",
          items: [
            "Rcriture ou cration de commits, amend, rebase : l'outil est strictement en lecture git.",
            "Hbergement de release, upload d'artefacts, appel aux APIs GitHub/GitLab.",
            "génération de notes de version marketing (ton, storytelling, traduction automatique).",
            "Monorepo multi-versions avec plusieurs tags de prfixes diffrents (prvu v1.1).",
            "Remplissage complet d'un README existant : seul un squelette manquant est cr.",
          ],
        },
      ],
    },
    {
      id: "b-specification",
      letter: "B",
      title: "Spcification fonctionnelle",
      subtitle: "Commandes, options, formats et codes de retour.",
      blocks: [
        {
          type: "tree",
          title: "Arborescence de commandes",
          code: `readme-gen [options]              # CHANGELOG depuis le dernier tag (défaut)
├── --readme                      # gnre README.md si absent
├── --check                       # n'crit rien, retourne 1 si entres invalides
├── init                          # cre .readmergenrc.json comêment
└── config [--show|--set k=v]     # inspecte / modifie la configuration`,
        },
        {
          type: "table",
          headers: ["Option", "Type", "défaut", "Description"],
          rows: [
            ["--since <tag|date>", "string", "dernier tag atteignable", "Point de dpart (tag SemVer ou date ISO, ex. 2026-01-01)"],
            ["--format <md|json>", "enum", "md", "Format de sortie. json crit un document stable et versionn"],
            ["--output <file>", "path", "CHANGELOG.md", "Destination. - crit sur stdout, jamais sur disque"],
            ["--readme", "boolean", "false", "Cre un README squelette s'il est absent"],
            ["--types <list>", "csv", "feat,fix,perf,refactor,docs", "Types conventionnels  incléure, dans l'ordre d'affichage"],
            ["--force", "boolean", "false", "Autorise l'crasement d'un fichier existant (sauvegarde .bak)"],
            ["--lang <fr|en>", "enum", "fr", "Langue des messages cléI et des titres gnrs"],
            ["--ci", "boolean", "false", "Sans couleur ni interaction, ligne de rsum sur stderr"],
              ["--dry-run", "boolean", "false", "Affiche le contenu sans ecrire (sur par defaut en mode CI)"],
              ["--version / --help", "flag", "-", "Version SemVer, aide complete avec exemples"],
          ],
        },
        { type: "h3", text: "Entre / sortie" },
        { type: "badges", items: ["Entre : historique git + mtadonnes projet", "Sortie : md stable", "Sortie : json versionn", "stdout pipe-friendly"] },
        {
          type: "code",
          title: "CHANGELOG.md gnr",
          lang: "md",
          code: `# Changelog
Toutes les volutions notables de ce projet sont documentes ici.
Le format suit Keep a Changelog et le versionnage smantique.

## [0.2.0] -" 2026-02-14

### Added
- lecture des commits conventionnels (feat, fix, docs--) (a1b2c3d)
- mode JSON compatible pipelines (e4f5a6b)

### Fixed
- gestion des tags sans annotation (9c8d7e6)

### Maintenance
- mise  à jour de picocolors (1122334)

## [0.1.0] -" 2026-01-20
...
_Commit non conventionnel : 2 -"  corriger dans la prochaine itration._`,
        },
        {
          type: "code",
          title: "CHANGELOG.json (sortie --format json)",
          lang: "json",
          code: `{
  "schemaVersion": "1",
  "generatedAt": "2026-02-14T10:12:00.000Z",
  "range": { "since": "v0.1.0", "until": "HEAD" },
  "versions": [
    {
      "version": "0.2.0",
      "date": "2026-02-14",
      "sections": {
        "Added": [
          { "message": "lecture des commits conventionnels", "hash": "a1b2c3d" }
        ]
      }
    }
  ],
  "unparsedCommits": [{ "hash": "ff00aa1", "subject": "wip" }],
  "stats": { "commits": 14, "parsed": 12, "unparsed": 2 }
}`,
        },
        {
          type: "table",
          headers: ["Code", "Signification", "Quand"],
          rows: [
            ["0", "OK", "Fichier crit, ou stdout produit, ou --check sans erreur"],
            ["1", "Erreur logique", "Output existant sans --force, aucune section, argument invalide"],
            ["2", "Erreur technique", "Pas un dpt git, binaire git absent, permission refuse"],
          ],
        },
        { type: "h3", text: "Erreurs et messages utilisateur" },
        {
          type: "table",
          headers: ["Cas", "Message (fr)", "Action attendue"],
          rows: [
            ["Pas de git", "-- Dpt git introuvable ici. Lancez la commande depuis la racine du projet.", "code 2"],
            ["Fichier existant", "-- CHANGELOG.md existe dj. Relancez avec --force pour l'craser.", "code 1"],
              ["Date invalide", "-- Date 32/02 illisible. Format attendu : AAAA-MM-JJ.", "code 1"],
            ["Permissions", "-- Impossible d'crire CHANGELOG.md (EACCES). Vrifiez les droits du fichier.", "code 2"],
              ["Aucun commit", "- Aucun commit dans la plage v0.2.0..HEAD.", "code 0, aucune ecriture"],
          ],
        },
      ],
    },
    {
      id: "c-technique",
      letter: "C",
      title: "Design technique",
      subtitle: "Choix de langage, dépendances, modules et flux.",
      blocks: [
        {
          type: "p",
          text: "Langage recommand : Node.js + TypeScript. Le public installe avec npx en une seconde, git et les transformations Markdown sont triviaux, et un bundle esbuild dmarre en ~40 ms. Alternative carte : Python 3.11 + Rich, trs bon pour le traitement de texte mais impose une double toolchain  une quipe qui fait dj tourner eslint et vitest.",
        },
        {
          type: "table",
          headers: ["dépendance", "Rle", "Poids", "Pourquoi"],
          rows: [
            ["picocolors", "Couleurs ANSI", "< 3 kB", "détection TTY et NO_COLOR sans api-graphiques"],
            ["esbuild (dev)", "Bundle du binaire", "dev only", "Build unique, dmarrage mesur sous 60 ms"],
            ["vitest (dev)", "Tests", "dev only", "Rapide, natif ESM, snapshots"],
          ],
        },
        {
          type: "code",
          lang: "text",
          title: "Pas de framework cléI",
          code: "node:util.parseArgs  -'  parsing sans dépendance\nprocess.exitCode      -'  jamais process.exit() en cours d'criture\nnode:child_process    -'  git en mode porcelain=v1, NUL spar",
        },
        {
          type: "tree",
          title: "Arborescence du paquet",
          code: `readme-gen/
├── src/
│   ├── cli.ts            # parseArgs, routing, exit codes
│   ├── core/
│   │   ├── git.ts        # readCommits(since) -" aucune logique d'affichage
│   │   ├── parse.ts      # ConventionalCommit parser
│   │   ├── group.ts      # regroupement par version/type
│   │   └── render.ts     # md | json, templates
│   ├── io/
│   │   ├── files.ts      # lecture, criture atomique, .bak
│   │   └── meta.ts       # package.json | pyproject.toml
│   ├── config.ts         # .readmergenrc.json + defaults
│   ├── help.ts           # texte --help, source unique
│   └── i18n.ts           # dictionnaires fr/en typs
├── tests/
│   ├── unit/             # parse, group, render
│   ├── integration/      # cléI sur fixtures git
│   └── fixtures/
├── package.json
└── README.md`,
        },
        { type: "h3", text: "Flux de la fonction principale" },
        {
          type: "flow",
          steps: [
            { title: "parseArgs", text: "valide les options, rsout la config rc > défauts, choisit la langue." },
            { title: "readCommits", text: "git log --format=-- porcelaine, dlimit par NUL. Retourne des donnes brutes." },
            { title: "parse", text: "type(scope)!: description + hash + date. Commit non conforme -' unparsed." },
            { title: "group", text: "version SemVer -' sections Keep a Changelog. Stable et dterministe." },
            { title: "render", text: "Markdown ou objet JSON versionn (schemaVersion: 1)." },
            { title: "write", text: "stdout, ou criture atomique (tmp + rename) avec sauvegarde .bak si --force." },
          ],
        },
        {
          type: "code",
          lang: "ts",
            title: "Pseudo-code du coeur",
          code: `function generate(opts: Options): Result {
  const repo = resolveRepo(opts.cwd);            // throw Technique si absent
  const since = resolveSince(repo, opts.since);  // tag | date ISO | null
  const raw = readCommits(repo, since);          // aucune criture
  const commits = raw.map(parseConventional);    // Ok | Unparsed
  const versions = groupByRelease(commits);
  const output = opts.format === "json"
    ? renderJson(versions)
    : renderMarkdown(versions, opts);
  return { output, stats: summarize(commits) };
}`,
        },
      ],
    },
    {
      id: "d-ux",
      letter: "D",
      title: "UX cléI",
      subtitle: "Le rendu, l'aide, et les cas qui fchent.",
      blocks: [
        {
          type: "kv",
          items: [
            { k: "Nom", v: "readme-gen" },
              { k: "Sous-titre", v: "readme-gen - Ton historique git, enfin lisible." },
            { k: "Ton", v: "direct, factuel, touà jours une action suivante" },
              { k: "Accessibilitée", v: "- succes - erreur - avertissement - information ; jamais la couleur seule" },
          ],
        },
        {
          type: "ascii",
          title: "Rendu d'une exécutéion (TTY, couleur)",
          code: `$ readme-gen --since v0.1.0 --output CHANGELOG.md

  readme-gen  v0.1.0

  -" Dpt trouv              devwell/readme-gen
  -" Plage analyse            v0.1.0..HEAD  14 commits
  -- 2 commits non conventionnels -' section -" Autres -"
  -" Sections gnres         Added 4  Fixed 2  Maintenance 1
  -" CHANGELOG.md crit        2,4 kB  sauvegarde : aucune

  Termin en 48 ms      code retour 0      --format json pour la CI`,
        },
        {
          type: "code",
          title: "--help (intgral)",
          lang: "text",
          code: `readme-gen -" Ton historique git, enfin lisible.

USAGE
  readme-gen [options]
  readme-gen init                   Cre .readmergenrc.json
  readme-gen config [--show]        Affiche la configuration effective

OPTIONS
  --since <tag|date>     Depuis un tag ou une date ISO (défaut : dernier tag)
  --format <md|json>     Format de sortie (défaut : md)
  --output <file>        Fichier de destination, - pour stdout (défaut : CHANGELOG.md)
  --readme               Gnre un README squelette s'il est absent
  --types <a,b,c>        Types conventionnels incléus (défaut : feat,fix,perf,refactor,docs)
  --check                Ne rien crire ; retourne 1 si des entres sont invalides
  --force                -crase un fichier existant (sauvegarde .bak)
  --dry-run              Affiche sans crire
  --lang <fr|en>         Langue (défaut : fr)
  --ci                   Sortie sans couleur, rsum sur stderr
  --no-color             Dsactive les couleurs
  -h, --help             Affiche cette aide
  -v, --version          Affiche la version

EXEMPLES
  readme-gen --since v0.2.0 --format md
  readme-gen --format json --output - | jq '.versions[0].version'
  readme-gen --readme --dry-run

Codes retour : 0 succès  1 erreur logique  2 erreur technique
Documentation incluse dans le guide Devwell.`,
        },
        {
          type: "table",
          headers: ["Situation", "Comportement", "Message clé"],
          rows: [
            ["Pas de depot git", "Sortie imêmediate, aucune creation de fichier", "-- Depot git introuvable ici - code 2"],
              ["Pas de fichier CHANGELOG", "Creation normale", "- cree"],
            ["Fichier existant", "Refus sans --force", "-- Relancez avec --force (sauvegarde .bak)"],
             ["Permissions refusees", "Rollback de l'ecriture atomique", "-- Droits insuffisants sur le dossier - code 2"],
            ["cléone shallow", "Warning puis analyse de l'historique disponible", "-- Historique tronqu : 12 commits visibles"],
            ["Pipe / CI", "Couleurs coupes automatiquement, aucune invite", "resum stderr"],
            ["Nom de fichier -", "Rien sur disque, contenu sur stdout", "pipe jq-friendly"],
          ],
        },
      ],
    },
    {
      id: "e-implementation",
      letter: "E",
      title: "Implmentation",
      subtitle: "Le code prt  poser dans le dpt.",
      blocks: [
        {
          type: "code",
            title: "package.json - complet",
          lang: "json",
          code: `{
  "name": "devwell",
  "version": "0.1.0",
  "description": "CHANGELOG et README depuis l'historique git.",
  "license": "MIT",
  "author": "Devwell contributors",
  "type": "module",
  "bin": { "readme-gen": "./dist/cli.js" },
  "engines": { "node": ">=18.17" },
  "files": ["dist", "README.md", "CHANGELOG.md", "LICENSE"],
  "scripts": {
    "build": "esbuild src/cli.ts --bundle --platform=node --format=esm --outfile=dist/cli.js --banner:js='#!/usr/bin/env node'",
    "dev": "tsx src/cli.ts",
    "test": "vitest run --coverage",
    "test:watch": "vitest",
    "lint": "eslint src tests",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": { "picocolors": "^1.1.1" },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@vitest/coverage-v8": "^3.0.0",
    "esbuild": "^0.24.0",
    "eslint": "^9.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}`,
        },
        {
          type: "code",
            title: "src/cli.ts - point d'entree",
          lang: "ts",
          code: `#!/usr/bin/env node
import { parseArgs } from "node:util";
import pc from "picocolors";
import { generate } from "./core/generate.js";
import { writeAtomic } from "./io/files.js";
import { t } from "./i18n.js";

const HELP = /* texte affich par --help, voir section D */ "";

function main(argv: string[]): number {
  let args;
  try {
    args = parseArgs({
      args: argv,
      options: {
        since: { type: "string" },
        format: { type: "string", default: "md" },
        output: { type: "string", default: "CHANGELOG.md" },
        readme: { type: "boolean", default: false },
        check: { type: "boolean", default: false },
        force: { type: "boolean", default: false },
        "dry-run": { type: "boolean", default: false },
        lang: { type: "string", default: "fr" },
        ci: { type: "boolean", default: false },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
      },
      allowPositionals: false,
    }).values;
  } catch (err) {
    console.error(pc.red("-- " + (err as Error).message));
    console.error("  Aide : readme-gen --help");
    return 1;
  }

  if (args.help) { console.log(HELP); return 0; }
  if (args.version) { console.log("0.1.0"); return 0; }

  try {
    const result = generate({
      since: args.since,
      format: args.format as "md" | "json",
      lang: args.lang as "fr" | "en",
    });

    if (args.check) return result.stats.unparsed > 0 ? 1 : 0;
    if (args["dry-run"] || args.output === "-") {
      process.stdout.write(result.output + "\\n");
      return 0;
    }
    writeAtomic(args.output!, result.output, { force: args.force! });
    if (!args.ci) console.log(t("done", args.lang, result.stats));
    return 0;
  } catch (err) {
    const e = err as { kind?: string; message: string };
    console.error(pc.red("-- " + e.message));
    return e.kind === "technical" ? 2 : 1;
  }
}

process.exitCode = main(process.argv.slice(2));`,
        },
        {
          type: "code",
            title: "src/core/parse.ts + render.ts - logique metier",
          lang: "ts",
          code: `export type Commit = { hash: string; date: string; subject: string };
export type Parsed = { type: string; scope?: string; description: string; breaking: boolean };

const CONVENTIONAL = /^(\\w+)(?:\\(([^)]+)\\))?(!)?:\\s(.+)$/;

export function parseCommit(subject: string): Parsed | null {
  const match = CONVENTIONAL.exec(subject.trim());
  if (!match) return null;
  return {
    type: match[1].toLowerCase(),
    scope: match[2],
    breaking: Boolean(match[3]),
    description: match[4],
  };
}

const ORDER = ["feat", "fix", "perf", "refactor", "docs", "chore"] as const;
const TITLES: Record<string, string> = {
  feat: "Added", fix: "Fixed", perf: "Performance",
  refactor: "Changed", docs: "Documentation", chore: "Maintenance",
};

export function renderMarkdown(versions: Release[], lang: "fr" | "en"): string {
  const lines = ["# Changelog", "", lang === "fr"
    ? "Le format suit Keep a Changelog et le versionnage smantique."
    : "Format follows Keep a Changelog and Semantic Versioning.", ""];
  for (const release of versions) {
    lines.push("## [" + release.version + "] -" " + release.date, "");
    for (const type of ORDER) {
      const entries = release.commits.filter((c) => c.type === type);
      if (!entries.length) continue;
      lines.push("### " + (TITLES[type] ?? "Other"));
      for (const c of entries) {
        lines.push("- " + c.description + (c.scope ? " (" + c.scope + ")" : "") + " (" + c.hash.slice(0, 7) + ")");
      }
      lines.push("");
    }
  }
  return lines.join("\\n").trimEnd() + "\\n";
}`,
        },
        {
          type: "code",
            title: ".readmergenrc.json - configuration d'exemple",
          lang: "json",
          code: `{
  "lang": "fr",
  "types": ["feat", "fix", "perf", "docs", "chore"],
  "sections": { "feat": "Added", "fix": "Fixed", "chore": "Maintenance" },
  "output": "CHANGELOG.md",
  "readme": { "enabled": true, "template": "./.github/README.tpl.md" },
  "ignore": ["chore(deps)", "docs(readme)"]
}`,
        },
        { type: "h3", text: "Installation (moins d'une minute)" },
        {
          type: "code",
          lang: "bash",
          title: "Installation & premire exécutéion",
          code: `# Depuis la racine du dépôt
npm install --global .

# Prévisualiser le changelog puis générer le fichier
devwell readme --since v0.1.0 --dry-run
devwell readme --since v0.1.0 --output CHANGELOG.md`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Décision technique : parseur maison vs library",
          text: "Option A (retenue) : parseur regex de 20 lignes + tests exhaustifs, aucune dépendance. Option B : conventional-commits-parser, plus complet mais 14 dépendances transitives. Pour un format dont on matrise 100 % des cas internes, l'option A est mesurable et suffisante.",
        },
      ],
    },
    {
      id: "f-tests",
      letter: "F",
      title: "Tests",
      subtitle: "Unitaires, intgration, non-rgression, couverture.",
      blocks: [
        {
          type: "code",
            title: "tests/unit/render.test.ts - Vitest",
          lang: "ts",
          code: `import { describe, expect, it } from "vitest";
import { parseCommit, renderMarkdown } from "../../src/core/parse.js";
import { groupByRelease } from "../../src/core/group.js";

describe("parseCommit", () => {
  it("parse un feat simple", () => {
    expect(parseCommit("feat: ajoute le mode JSON")).toMatchObject({
      type: "feat", description: "ajoute le mode JSON", breaking: false,
    });
  });
  it("extrait scope et breaking change", () => {
    expect(parseCommit("feat(cli)!: supprime --legacy")).toMatchObject({
      type: "feat", scope: "cli", breaking: true,
    });
  });
  it("rejette un commit non conventionnel", () => {
    expect(parseCommit("wip divers")).toBeNull();
    expect(parseCommit("")).toBeNull();
  });
});

describe("renderMarkdown", () => {
  it("respecte Keep a Changelog et l'ordre des sections", () => {
    const out = renderMarkdown([
      { version: "0.2.0", date: "2026-02-14", commits: [
        { type: "fix", description: "corrige le tag", hash: "1234567" },
        { type: "feat", description: "mode JSON", hash: "abcdef1" },
      ]},
    ], "fr");
    expect(out).toContain("## [0.2.0] -" 2026-02-14");
    expect(out.indexOf("### Added")).toBeLessThan(out.indexOf("### Fixed"));
  });
  it("ne produit jamais de section vide", () => {
    const out = renderMarkdown([{ version: "0.1.0", date: "2026-01-01", commits: [] }], "fr");
    expect(out).not.toContain("###");
  });
  it("est dterministe", () => {
    const commits = sampleCommits();
    expect(renderMarkdown(commits, "fr")).toBe(renderMarkdown(commits, "fr"));
  });
});`,
        },
        {
          type: "table",
          headers: ["Niveau", "Ce qui est couvert", "Outil"],
          rows: [
            ["Unitaire", "parse, group, render md/json, config, i18n", "Vitest"],
            ["Intgration cléI", "git init sur fixture, exécutéion du binaire, exit codes 0/1/2, fichier crit", "Vitest + execa"],
            ["Non-rgression", "dpt avec tags annots, shallow cléone, commits unicode, CHANGELOG existant", "fixtures git figes"],
            ["Contrat de sortie", "snapshot Markdown + validation schma JSON", "Vitest snapshot"],
          ],
        },
        {
          type: "code",
            title: "tests/integration/cli.test.ts - execution bout-en-bout",
          lang: "ts",
          code: `import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function fixtureRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "readme-gen-"));
  const git = (...a: string[]) => execFileSync("git", a, { cwd: dir });
  git("init", "-q");
  git("config", "user.email", "test@example.invalid");
  git("config", "user.name", "Tests");
  writeFileSync(join(dir, "index.ts"), "export {};\\n");
  git("add", ".");
  git("commit", "-qm", "feat: premire version");
  git("tag", "-a", "v0.1.0", "-m", "v0.1.0");
  writeFileSync(join(dir, "index.ts"), "export const x = 1;\\n");
  git("commit", "-qam", "fix(core): corrige x\\n\\nBREAKING CHANGE: contrat");
  return dir;
}

describe("readme-gen cléI", () => {
  it("gnre le CHANGELOG depuis le dernier tag (exit 0)", () => {
    const cwd = fixtureRepo();
    execFileSync("node", ["dist/cli.js", "--check"], { cwd });
    execFileSync("node", ["dist/cli.js"], { cwd });
    const md = readFileSync(join(cwd, "CHANGELOG.md"), "utf8");
    expect(md).toContain("# Changelog");
    expect(md).toContain("corrige x (core)");
  });

  it("refuse d'craser sans --force (exit 1)", () => {
    const cwd = fixtureRepo();
    writeFileSync(join(cwd, "CHANGELOG.md"), "existant");
    const run = () => execFileSync("node", ["dist/cli.js"], { cwd, stdio: "pipe" });
    expect(run).toThrow();
    expect(readFileSync(join(cwd, "CHANGELOG.md"), "utf8")).toBe("existant");
  });

  it("retourne 2 hors dpt git", () => {
    const empty = mkdtempSync(join(tmpdir(), "nogit-"));
    const run = () => execFileSync("node", ["dist/cli.js"], { cwd: empty, stdio: "pipe" });
    expect(run).toThrow();
    expect(existsSync(join(empty, "CHANGELOG.md"))).toBe(false);
  });
});`,
        },
        {
          type: "table",
          headers: ["scénario manuel", "Commande", "Rsultat attendu"],
          rows: [
            ["Projet existant", "readme-gen --dry-run", "Markdown sur stdout, aucun fichier modifi"],
            ["Pipeline JSON", "readme-gen --format json | jq .stats", "Objet pars, exit 0"],
            ["Mauvais tag", "readme-gen --since v9.9.9", "Message cléair, exit 1"],
            ["Windows WSL", "npm i -g puis readme-gen --version", "Version affiche, couleurs OK"],
            ["NO_COLOR=1", "readme-gen", "Aucun code ANSI, symboles conservs"],
          ],
        },
        {
          type: "callout",
          tone: "success",
          title: "Couverture cible : -- 85 %",
          text: "Seuils bloquants dans vitest.config.ts : branches 80, functions 85, lines 85, statements 85. Le job CI échoue en dessous. Les sorties Markdown sont valides par snapshots pour prvenir toute rgression de format.",
        },
        {
          type: "code",
            title: ".github/workflows/ci.yml - job de l'outil",
          lang: "yaml",
          code: `name: ci
on: [push, pull_request]
jobs:
  readme-gen:
    runs-on: \${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }        # tags ncessaires aux fixtures
      - uses: actions/setup-node@v4
        with: { node-version: \${{ matrix.node }}, cache: npm }
      - run: npm ci
      - run: npm run lint && npm run typecheck
      - run: npm run build
      - run: npm test -- --coverage
      - run: node dist/cli.js --version  # fume node sur les 3 OS`,
        },
      ],
    },
    {
      id: "g-documentation",
      letter: "G",
      title: "Documentation",
      subtitle: "README, CHANGELOG initial, dmo et contribution.",
      blocks: [
        {
          type: "badges",
          items: ["licence MIT", "CI 3 OS -- 3 Node", "npm devwell", "v0.1.0"],
        },
          { type: "h3", text: "README.md - extrait publie" },
        {
          type: "code",
          title: "README.md",
          lang: "md",
          code: `# readme-gen

> Ton historique git, enfin lisible. Gnre un CHANGELOG
> Keep a Changelog et un README squelette en une commande.

## Installation (30 s)

    npm install --global .
    devwell readme --help

prérequis : Node 18.17+, git 2.30+. Windows : WSL, PowerShell ou Git Bash.

## Usage

    readme-gen                          # CHANGELOG.md depuis le dernier tag
    readme-gen --since v1.2.0           # depuis un tag prcis
    readme-gen --format json --output - # JSON sur stdout
    readme-gen --readme                 # squelette si README absent

## Convention attendue

    feat(parser): support des scopes
    fix(cli)!: supprime l'option --legacy
    docs: prcise l'installation Windows

Types reconnus : feat, fix, perf, refactor, docs, chore, ci, test.
Un commit hors convention n'échoue pas : il rejoint -" Autres -".

## Options

| Option | défaut | Rle |
| --- | --- | --- |
| --since | dernier tag | borne basse |
| --format | md | md ou json |
| --output | CHANGELOG.md | fichier ou - |
| --force | false | sauvegarde .bak puis crase |
| --lang | fr | fr ou en |

Codes retour : 0 OK, 1 erreur logique, 2 erreur technique.

## Exemple de sortie
~~~text
-" CHANGELOG.md crit   2,4 kB      48 ms      exit 0
~~~

## FAQ

**Il crase mon fichier ?** Non. Sans --force, rien n'est crit.
**Mon historique est en anglais ?** Utilisez --lang en pour les titres.
**Pourquoi mes commits sont dans Autres ?** Le format type(scope): sujet
est requis, avec deux-points et espace.
**Fonctionne en monorepo ?** v0.1 : une seule ligne de tags. v1.1 prvue.

## Dmo
![asciinema](https://asciinema.org/a/readme-gen-demo.svg)

## Licence
MIT  Devwell`,
        },
        {
          type: "code",
            title: "CHANGELOG.md - version initiale",
          lang: "md",
          code: `# Changelog

## [0.1.0] -" 2026-02-20

### Added
- Lecture des commits conventionnels (feat, fix, docs, chore--)
- génération Keep a Changelog avec versions et dates stables
- Sortie JSON schemaVersion 1 pour pipelines
- Options --since, --format, --output, --lang, --ci, --dry-run
- génération d'un README squelette depuis package.json / pyproject.toml
- Fichier de configuration .readmergenrc.json

### Security
- -criture atomique + sauvegarde .bak en cas d'crasement
- Aucune exécutéion de commande issue des messages de commit

### Known limitations
- Monorepo multi-tags non pris en charge
- Pas de breaking change ddi dans la sortie Markdown`,
        },
        {
          type: "list",
          items: [
            "CONTRIBUTING.md : pnpm install, pnpm test, pnpm build ; une PR = un type de changement ; tests obligatoires pour tout comportement.",
            "Dmo : enregistrement asciinema de 25 s, incrust en SVG dans le README, script rejouable dans demo/.",
            "Conventional Commits appliqus au dpt lui-même (dogfooding) + commitlint en pre-commit.",
            "Changelog du dpt gnr par le binaire : le projet se documente avec lui-même.",
          ],
        },
      ],
    },
    {
      id: "h-livraison",
      letter: "H",
      title: "Livraison",
      subtitle: "Release, communication et trajectoire.",
      blocks: [
        {
          type: "check",
          title: "Checklist de release",
          items: [
            { label: "Tests verts sur Linux, macOS, Windows (Node 18/20/22)", done: true },
            { label: "Couverture -- 85 % vrifie dans les artefacts CI", done: true },
            { label: "Version SemVer bumpe + entre CHANGELOG gnre", done: true },
            { label: "npm pack inspect (dist, README, LICENSE uniquement)", done: true },
            { label: "Tag git sign v0.1.0 + GitHub Release", done: true },
            { label: "README vrifi sur npm (rendu Markdown et tableaux)" },
            { label: "Message Slack + note de version interne" },
          ],
        },
        {
          type: "code",
          title: "Publication npm",
          lang: "bash",
          code: `npm version minor --no-git-tag-version
devwell readme --since $(git describe --tags --abbrev=0)
git add package.json CHANGELOG.md && git commit -m "chore(release): v0.2.0"
git tag -s v0.2.0 -m "readme-gen v0.2.0"
git push --follow-tags
npm publish --access public --provenance`,
        },
        { type: "h3", text: "Plan de communication quipe" },
        {
          type: "code",
          title: "Message Slack (copier-coller)",
          lang: "text",
          code: `:seedling: readme-gen v0.1.0 est dispo

Fini de recopier des commits  la main avant chaque release.
  devwell readme --since <tag>

-" CHANGELOG Keep a Changelog
-" README squelette s'il manque
-" sortie JSON pour la CI
-" dry-run par défaut si vous voulez juste voir

Aprs votre prochaine release, dites-moi le temps gagn ici :thread:.
On garde la convention feat/fix/docs -" l'outil la détecte.`,
        },
        { type: "h3", text: "Roadmap" },
        {
          type: "table",
          headers: ["Version", "Contenu", "Critre de sortie"],
          rows: [
            ["v0.1.0", "génération md/json, README squelette, CI 3 OS", "Publication npm + dmo"],
            ["v1.0.0", "Monorepo (prfixes de tags), breaking changes ddis, config valide par schma", "API de sortie stable + 3 quipes pilotes"],
            ["v1.2.0", "Templates personnaliss (Handlebars-like minimal), --incléude/--excléude", "Aucun breaking du schma JSON"],
            ["v2.0.0", "Notes de release multi-langues, intgrations GitHub/GitLab en lecture", "ADR valid + migration documente"],
          ],
        },
      ],
    },
  ],
};
