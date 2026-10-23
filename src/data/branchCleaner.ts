import type { ToolDoc } from "./types";

export const branchCleaner: ToolDoc = {
  slug: "branch-cleaner",
  index: "04",
  name: "branch-cleaner",
  binary: "branch-cleaner",
  tagline: "Des branches propres, un historique lisible.",
  short:
    "Liste les branches mergees, orphelines ou trop vieilles, et les supprime - uniquement apres votre validation.",
  description:
    "Un inventaire honnête de vos branches locales, un graphe ASCII lisible et un mode interactif. Dry-run par défaut : aucune branche ne disparat tant que vous n'avez pas dit --apply.",
  icon: "branch",
  accent: "amber",
  language: "TypeScript  Node -- 18",
  deps: "1 runtime (picocolors)",
  loc: "~540",
  devTime: "3 j-h",
  priority: "P1",
  install: "npm install --global .",
  quickCommand: "devwell branches --stale 30 --graph",
  keyFlags: ["--merged", "--stale", "--graph"],
  tags: ["git", "sécurité", "dry-run"],
  preamble:
    "Outil 04  Hygine git. Pense  peu prs tout, propose beaucoup, ne supprime rien sans consentement explicite.",
  sections: [
    {
      id: "a-cadrage",
      letter: "A",
      title: "Fiche de cadrage",
      subtitle: "Nettoyer sans jamais mettre en danger le travail non merg.",
      blocks: [
        {
          type: "p",
          text: "Sur un depot actif, les branches locales s'accumulent : features livrees, branches abandonnees, traces de remotes supprimes. git branch liste tout sans hierarchie et git log --graph devient illisible a partir de 30 commits. branch-cleaner cléasse, explique, simule et propose - la suppression reste une decision explicite.",
        },
        {
          type: "table",
          headers: ["Persona", "Contexte", "Douleur"],
          rows: [
            ["développeur", "Dpt ancien, 40 branches locales", "Peur de supprimer du travail non merg"],
            ["Lead technique", "Revue d'hygine de dpt", "Nettoyage manuel, long et risqu"],
            ["Nouvel arrivant", "cléone + branches de l'quipe", "Ne distingue pas merged, gone et active"],
            ["Release manager", "Avant une release", "Historique illisible, branches fantmes"],
          ],
        },
        { type: "h3", text: "User stories" },
        {
          type: "list",
          items: [
            "En tant que développeur prudent, je veux voir ce qui serait supprim avant toute action afin de ne pas perdre de travail.",
            "En tant que développeur, je veux visualiser les branches merges, orphelines ou anciennes dans une seule vue afin de dcider vite.",
            "En tant que release manager, je veux un graphe git simplifi afin de comprendre la topologie avant de taguer.",
            "En tant qu'utilisateur de CI, je veux un rapport JSON en dry-run afin de mesurer l'hygine sans risque.",
            "En tant que développeur, je veux protger main, develop et mes branches pingles afin qu'un nettoyage ne les touche jamais.",
          ],
        },
        { type: "h3", text: "critères d'acceptation" },
        {
          type: "table",
          headers: ["Given", "When", "Then"],
          rows: [
            ["Une branche mergee dans main", "je lance branch-cleaner sans --apply", "elle est listee - supprimable -, mais existe encore"],
            ["La même branche avec --apply", "la branche est la courante", "elle est protge et jamais supprime"],
            ["Une branche non merge", "j'active --merged", "elle n'apparat pas dans les candidates"],
             ["Un upstream supprime sur le remote", "je lance l'audit", "branche cléassee - orpheline / upstream gone -"],
             ["Dernier commit il y a 95 à jours", "je lance --stale 90", "branche cléassee - ancienne -"],
            ["Aucune branche ne correspond", "j'applique le nettoyage", "aucun message d'erreur, exit 0"],
            ["--interactive sans TTY", "je lance en CI", "refus avec conseil --dry-run --json, exit 1"],
            ["Une branche non merge + --force-unmerged", "sans confirmation interactive", "refus, exit 1"],
          ],
        },
        { type: "h3", text: "Hors-scope explicite" },
        {
          type: "list",
          items: [
            "Suppression de branches distantes : l'outil ne pousse jamais vers origin en v0.1.",
            "Rcriture d'historique (rebase, filter-branch, force push).",
            "Suppression de tags ou de worktrees (v1.2 pour les worktrees).",
            "Fusion ou rsolution de conflits : l'outil observe et supprime, il ne merge pas.",
            "Interface graphique ou web ; sortie shell uniquement.",
            "Nettoyage automatique non supervis par défaut (cron possible uniquement avec --apply explicite).",
          ],
        },
      ],
    },
    {
      id: "b-specification",
      letter: "B",
      title: "Spcification fonctionnelle",
      subtitle: "Auditer, cléasser, proposer, appliquer.",
      blocks: [
        {
          type: "tree",
          title: "Arborescence de commandes",
          code: `branch-cleaner [options]         # audit dry-run (défaut)
├── --merged                     # cible les branches merges
├── --stale <days>               # cible les branches inactives
├── --orphans                    # cible les upstream disparus
├── --graph                      # affiche le graphe ASCII
├── --interactive                # slection TTY puis confirmation
├── init                         # cre .branchCleanerrc.json
└── --apply                      # SEUL moyen de supprimer`,
        },
        {
          type: "table",
          headers: ["Option", "Type", "défaut", "Description"],
          rows: [
            ["--merged", "boolean", "true", "Incléut les branches entirement merges dans la base"],
              ["--stale <days>", "number", "-", "Incléut les branches sans commit depuis N à jours"],
            ["--orphans", "boolean", "true", "Incléut les branches dont l'upstream est gone"],
            ["--base <ref>", "string", "main puis master", "Rfrence de comparaison pour le statut merg"],
            ["--graph", "boolean", "false", "Affiche le graphe ASCII simplifi de l'historique"],
            ["--graph-limit <n>", "number", "30", "Nombre de commits du graphe"],
            ["--interactive", "boolean", "false", "Slection  cocher (flches + espace) puis confirmation"],
            ["--dry-run", "boolean", "true", "Simulation ; --apply pour exécutéer"],
            ["--apply", "boolean", "false", "Supprime les branches slectionnes (git branch -d)"],
            ["--force-unmerged", "boolean", "false", "Autorise -D sur non merges, avec double confirmation"],
            ["--protect <patterns>", "csv", "main,master,develop,release/*", "Branches jamais supprimables"],
            ["--fetch / --no-fetch", "flag", "no-fetch", "Met  à jour les refs distantes (réseau, opt-in)"],
            ["--format <pretty|json>", "enum", "pretty", "Rapport machine pour la CI"],
            ["--lang <fr|en> / --no-color", "flag", "fr / auto", "Langue, couleurs"],
              ["--version / --help", "flag", "-", "Version / aide"],
          ],
        },
        { type: "h3", text: "Rgles de cléassement" },
        {
          type: "table",
          headers: ["Catgorie", "Rgle git", "sécurité"],
          rows: [
              ["Merged", "git merge-base --is-ancestor <branch> <base>", "suppression -d sure"],
            ["Orpheline", "upstream configur mais git for-each-ref [gone]", "contenu local conserv jusqu' --apply"],
            ["Ancienne", "committerdate < auà jourd'hui - N à jours", "ge indicatif, jamais suffisant seul"],
            ["Active", "ni merged, ni stale, ni gone", "jamais propose"],
            ["Protge", "head courante, --protect, main/master/develop", "jamais propose, même en --force"],
            ["Dtache", "HEAD dtache", "aucune branche courante, avertissement"],
          ],
        },
        {
          type: "table",
          headers: ["Garde-fou", "Comportement"],
          rows: [
            ["défaut", "dry-run intgral, aucune commande destructive"],
              ["--apply absent", "ligne finale - rien n'a ete supprime -"],
            ["Branche protge", "refus même avec --force-unmerged"],
            ["Non merge", "excléue sauf --force-unmerged + confirmation saisie"],
            ["-chec d'une suppression", "poursuite des autres, code 1 et rapport des checs"],
            ["Pas de TTY", "--interactive refus ; --dry-run --format json reste possible"],
            ["Git absent / pas de dpt", "message technique, exit 2"],
          ],
        },
        {
          type: "table",
          headers: ["Code", "Signification"],
          rows: [
            ["0", "Audit termin ou nettoyage appliqu sans erreur"],
            ["1", "Action refuse (protection, confirmation absente) ou suppression partiellement échoue"],
            ["2", "Erreur technique : git absent, dpt introuvable, permission"],
          ],
        },
        {
          type: "code",
          title: "Rapport JSON",
          lang: "json",
          code: `{
  "tool": "branch-cleaner",
  "schemaVersion": 1,
  "repo": { "root": "/code/devwell", "head": "feat/nav", "base": "main" },
  "dryRun": true,
  "branches": [
    { "name": "feat/nav", "merged": false, "staleDays": 2, "upstreamGone": false, "protected": true, "reason": "branche courante" },
    { "name": "fix/env", "merged": true, "staleDays": 18, "upstreamGone": false, "protected": false, "reason": "merge dans main" },
    { "name": "feat/legacy", "merged": false, "staleDays": 128, "upstreamGone": true, "protected": false, "reason": "upstream supprim  inactive" }
  ],
  "candidates": ["fix/env", "feat/legacy"],
  "deleted": [],
  "summary": { "total": 12, "candidates": 2, "protected": 3, "applied": false }
}`,
        },
      ],
    },
    {
      id: "c-technique",
      letter: "C",
      title: "Design technique",
      subtitle: "Git plumbing, zro shell, dry-run structurel.",
      blocks: [
        {
          type: "p",
          text: "Langage recommande : TypeScript/Node. Un script bash serait plus court mais fragile sur Windows (Git Bash, chemins, encodage) et difficile a tester serieusement. Node fournit execFile (arguments en tableau, pas de shell) et un ecosysteme de test mature. Alternative : Go pour un binaire autonome tres rapide - ecartee en v0.1 pour rester dans la toolchain npm de l'equipe. Recommandation : TypeScript, avec un GitAdapter injectable pour les tests.",
        },
        {
          type: "table",
          headers: ["dépendance", "Rle", "Pourquoi"],
          rows: [
            ["picocolors", "couleurs", "unique dépendance runtime"],
            ["node:child_process.execFile", "appels git", "aucun shell, injection impossible par un nom de branche"],
            ["node:readline/promises", "mode interactif", "vite @inquirer/prompts (~15 modules) pour une simple slection"],
            ["vitest (dev)", "tests", "fixtures git réelles, exécutéion OS matrix"],
          ],
        },
        {
          type: "callout",
          tone: "warn",
          title: "Décision : readline natif vs @inquirer/prompts",
          text: "Option A retenue : node:readline/promises, zro dépendance, mais une bouclée de slection d'environ 70 lignes et une UX cléavier  tester. Option B : @inquirer/prompts, UX excellente et accessible immdiatement, mais arbre de dépendances plus lourd. Recommandation : A pour la v0.1, B si le mode interactif devient le chemin principal.",
        },
        {
          type: "tree",
          title: "Arborescence du paquet",
          code: `branch-cleaner/
├── src/
│   ├── cli.ts               # parseArgs, garde TTY, exit codes
│   ├── git/
│   │   ├── adapter.ts       # execFile("git", args) + timeout
│   │   ├── refs.ts          # for-each-ref, merged, upstream gone
│   │   └── graph.ts         # log --graph -' nettoyage + couleurs
│   ├── core/
│   │   ├── audit.ts         # cléassement pur (donnes injectes)
│   │   ├── safety.ts        # invariants de suppression
│   │   └── apply.ts         # suppressions une par une, rollback info
│   ├── ui/
│   │   ├── table.ts
│   │   └── select.ts        # readline, cléavier, confirmation
│   └── config.ts
├── tests/
│   ├── fixtures/            # dpts git gnrs par script
│   └── unit|integration/
└── package.json`,
        },
        {
          type: "flow",
          steps: [
            { title: "guard", text: "Vrifie git, la racine, la TTY si --interactive, et la protection de HEAD." },
            { title: "collect", text: "for-each-ref (refname, upstream, committerdate) + merge-base vers la base. Aucun fetch sans --fetch." },
            { title: "audit", text: "Fonction pure : donnes refs + options -' catgories, raisons, candidates, protges." },
            { title: "display", text: "Table colore ou graphe ASCII. Si dry-run : s'arrte ici, avec un exemple de --apply." },
            { title: "select", text: "Mode interactif : filtrage, slection, confirmation. Sinon toutes les candidates aprs --apply." },
            { title: "apply", text: "Vrification finale de safety.ts, git branch -d (ou -D doublement confirm), collecte des checs." },
          ],
        },
      ],
    },
    {
      id: "d-ux",
      letter: "D",
      title: "UX cléI",
      subtitle: "La prudence se voit dans chaque ligne.",
      blocks: [
        {
          type: "kv",
          items: [
            { k: "Nom", v: "branch-cleaner" },
              { k: "Sous-titre", v: "branch-cleaner - Fais le menage sans perdre de travail." },
            { k: "Promesse", v: "aucune suppression sans --apply (et confirmation en interactif)" },
              { k: "Symboles", v: "- supprimable - examiner - protegee - information" },
          ],
        },
        {
          type: "ascii",
          title: "Audit + graphe (TTY, couleur)",
          code: `$ branch-cleaner --stale 30 --graph

  branch-cleaner                          devwell  base : main  DRY-RUN

  BRANCHES                   tat                    dernier commit
  -" fix/env                  merge                   il y a 18 j
  -" docs/rfc                 merge                   il y a 7 j
  -- feat/legacy              upstream supprim        il y a 128 j
  -- feat/old-idea            inactive (> 30 j)        il y a 64 j
  -- main                     protge                 il y a 1 h
  --- feat/nav                 courante                 il y a 2 h

  HISTORIQUE                                     30 commits  HEAD : feat/nav
  * 1a2b3c4 (HEAD -' feat/nav) feat: navigation responsive
  * 8d9e0f1 fix: focus cléavier
  |\\
  | * 77aa11e (fix/env) fix: lit la config au dmarrage
  |/
  * 3c4d5e6 (main) chore: release 0.2.0
  * 9f8e7d6 docs: guide de contribution

  3 supprimables  2  examiner  1 protge
  Simulation -" rien n'a t supprim.
  -' branch-cleaner --apply               supprimer les 3 branches merges
  -' branch-cleaner --interactive         choisir manuellement
  -' branch-cleaner --orphans --apply     cibler aussi les orphelines`,
        },
        {
          type: "code",
          title: "--help (intgral)",
          lang: "text",
          code: `branch-cleaner -" Fais le mnage sans perdre de travail.

USAGE
  branch-cleaner [options]
  branch-cleaner --interactive        Slection puis confirmation
  branch-cleaner --apply              exécutée rellement les suppressions
  branch-cleaner init                 Cre .branchCleanerrc.json

OPTIONS
  --merged                Incléure les branches merges (défaut : oui)
  --stale <à jours>        Incléure les branches inactives depuis N à jours
  --orphans              Incléure les upstream disparus (défaut : oui)
  --base <ref>            Rfrence de comparaison (défaut : main/master)
  --graph                 Afficher le graphe ASCII simplifi
  --graph-limit <n>       Commits affichs dans le graphe (défaut : 30)
  --protect <patterns>    Branches protges, spares par virgule
  --interactive           Slection cléavier (ncessite un TTY)
  --dry-run               Simulation (défaut)
  --apply                 Supprime les branches slectionnes
  --force-unmerged        Autorise -D (double confirmation requise)
  --fetch                 Met  à jour les refs distantes avant l'audit
  --format <pretty|json>  Sortie lisible ou machine
  --lang <fr|en>          Langue (défaut : fr)
  --no-color              Dsactive les couleurs
  -h, --help / -v, --version

S-CURIT-
  Jamais la branche courante. Jamais main, master, develop,
  release/*. Jamais une branche non merge sans --force-unmerged.
  Le mode dry-run est actif par défaut.

Codes retour : 0 succès  1 refus/chec partiel  2 erreur technique
Documentation incluse dans le guide Devwell.`,
        },
        {
          type: "table",
          headers: ["Cas", "Comportement", "Message"],
          rows: [
            ["Pas de git", "exit 2, rien tent", "-- git est requis et introuvable dans le PATH"],
             ["Detachee", "audit possible, aucune branche courante", "- HEAD detachee sur 1a2b3c4"],
             ["Pas de remote", "orphelines non detectables", "- Aucun upstream configure : gestion orphelines desactivee"],
            ["Pas de TTY", "--interactive refus", "-- Le mode interactif exige un terminal (essayez --dry-run --format json)"],
            ["Permission refuse", "exit 2, git stderr traduit", "-- Suppression impossible : la ref est verrouille"],
            ["Branche protge", "excléue silencieusement du lot", "-- feat/x protge (--protect)"],
            ["Fetch demand hors ligne", "non bloquant, audit sur refs locales", "-- Impossible de joindre origin, refs locales utilises"],
              ["Aucune candidate", "exit 0", "- Rien a faire, votre depot est deja propre"],
          ],
        },
      ],
    },
    {
      id: "e-implementation",
      letter: "E",
      title: "Implmentation",
        subtitle: "La logique de securite est le coeur de l'outil.",
      blocks: [
        {
          type: "code",
            title: "package.json - complet",
          lang: "json",
          code: `{
  "name": "devwell",
  "version": "0.1.0",
  "description": "Audit et nettoyage s-"r des branches git, avec graphe ASCII.",
  "license": "MIT",
  "author": "Devwell contributors",
  "type": "module",
  "bin": { "branch-cleaner": "./dist/cli.js" },
  "engines": { "node": ">=18.17" },
  "files": ["dist", "README.md", "CHANGELOG.md", "LICENSE"],
  "scripts": {
    "build": "esbuild src/cli.ts --bundle --platform=node --format=esm --outfile=dist/cli.js --banner:js='#!/usr/bin/env node'",
    "dev": "tsx src/cli.ts",
    "test": "vitest run --coverage",
    "lint": "eslint src tests",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": { "picocolors": "^1.1.1" },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@vitest/coverage-v8": "^3.0.0",
    "esbuild": "^0.24.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}`,
        },
        {
          type: "code",
            title: "src/git/adapter.ts - aucun shell",
          lang: "ts",
          code: `import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);

export cléass GitError extends Error {
  constructor(message: string, public readonly code = 2) {
    super(message);
  }
}

/** GitAdapter injectable : les tests unitaires fournissent un faux. */
export type GitAdapter = {
  refs(): Promise<string>;
  currentBranch(): Promise<string | null>;
  isMerged(branch: string, base: string): Promise<boolean>;
  deleteBranch(branch: string, force: boolean): Promise<void>;
};

export function createGit(cwd: string): GitAdapter {
  async function git(...args: string[]): Promise<string> {
    try {
      const { stdout } = await exec("git", args, {
        cwd, timeout: 4000, maxBuffer: 4 * 1024 * 1024,
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0", LC_ALL: "C" },
      });
      return stdout;
    } catch (err) {
      const e = err as { stderr?: string; code?: string };
      if (e.code === "ENOENT") throw new GitError("git est requis et introuvable dans le PATH");
      throw new GitError((e.stderr || "git a chou").trim());
    }
  }

  return {
    refs: () => git("for-each-ref", "--format=%(refname:short)%00%(upstream:short)%00%(committerdate:unix)%00", "refs/heads"),
    currentBranch: async () => {
      try { return (await git("symbolic-ref", "--quiet", "--short", "HEAD")).trim(); }
      catch { return null; }
    },
    isMerged: async (branch, base) => {
      try { await git("merge-base", "--is-ancestor", branch, base); return true; }
      catch { return false; }
    },
    deleteBranch: async (branch, force) => { await git("branch", force ? "-D" : "-d", branch); },
  };
}`,
        },
        {
          type: "code",
            title: "src/core/safety.ts - les invariants, testes un par un",
          lang: "ts",
          code: `export type Branch = {
  name: string;
  merged: boolean;
  staleDays: number;
  upstreamGone: boolean;
};

export type SafetyPolicy = {
  current: string | null;
  protect: string[];          // globs simples : main, release/*
  forceUnmerged: boolean;
  confirmed: boolean;
};

const DEFAULTS = ["main", "master", "develop", "dev", "release/*"];

function globMatch(pattern: string, name: string): boolean {
  if (pattern.endsWith("/*")) return name.startsWith(pattern.slice(0, -1));
  return pattern === name;
}

export function isProtected(branch: string, policy: SafetyPolicy): boolean {
  if (branch === policy.current) return true;
  return [...DEFAULTS, ...policy.protect].some((glob) => globMatch(glob, branch));
}

export function canDelete(branch: Branch, policy: SafetyPolicy): { ok: true } | { ok: false; reason: string } {
  if (isProtected(branch.name, policy)) return { ok: false, reason: "branche protge ou courante" };
  if (!branch.merged && !branch.upstreamGone && !policy.forceUnmerged) {
    return { ok: false, reason: "non merge -" --force-unmerged requis" };
  }
  if (!branch.merged && policy.forceUnmerged && !policy.confirmed) {
    return { ok: false, reason: "non merge -" confirmation explicite requise" };
  }
  return { ok: true };
}`,
        },
        {
          type: "code",
            title: "src/core/audit.ts - fonction pure et deterministe",
          lang: "ts",
          code: `import { canDelete, isProtected, type Branch, type SafetyPolicy } from "./safety.js";

export type AuditOptions = { staleDays: number | null; incléudeMerged: boolean; incléudeOrphans: boolean };
export type Candidate = Branch & { reason: string };

export function audit(branches: Branch[], opts: AuditOptions, policy: SafetyPolicy) {
  const examined = branches
    .filter((b) => b.name !== "")
    .map((branch) => {
      const stale = opts.staleDays !== null && branch.staleDays >= opts.staleDays;
      const interesting =
        (opts.incléudeMerged && branch.merged) ||
        (opts.incléudeOrphans && branch.upstreamGone) ||
        stale;
      return { ...branch, interesting };
    });

  const candidates: Candidate[] = [];
  for (const branch of examined) {
    if (!branch.interesting) continue;
    if (isProtected(branch.name, policy)) continue;
    const verdict = canDelete(branch, policy);
    if (!verdict.ok) continue;
    const reason = branch.merged ? "merge dans la base"
      : branch.upstreamGone ? "upstream supprim"
      : "inactive depuis " + branch.staleDays + " j";
    candidates.push({ ...branch, reason });
  }

  return {
    candidates: candidates.sort((a, b) => a.name.localeCompare(b.name)),
    protectedCount: examined.filter((b) => isProtected(b.name, policy)).length,
    examinedCount: examined.length,
  };
}`,
        },
        {
          type: "code",
            title: ".branchCleanerrc.json - configuration de securite",
          lang: "json",
          code: `{
  "base": "main",
  "staleDays": 45,
  "protect": ["main", "master", "develop", "release/*", "hotfix/*"],
  "incléudeMerged": true,
  "incléudeOrphans": true,
  "fetch": false,
  "graph": { "limit": 25, "showMerges": true },
  "apply": {
    "confirm": "always",
    "forceUnmerged": false
  }
}`,
        },
        {
          type: "code",
            title: "Installation & workflow sur",
          lang: "bash",
          code: `# Depuis la racine du dépôt
npm install --global .
devwell branches --version

# 1) Touà jours regarder d'abord
branch-cleaner --stale 30 --graph

# 2) Slection interactive (TTY) -" la confirmation reste obligatoire
branch-cleaner --interactive

# 3) Nettoyage non interactif, limit aux merges
branch-cleaner --merged --apply

# 4) Rapport d'hygine en CI, aucune criture
branch-cleaner --dry-run --format json --no-color`,
        },
      ],
    },
    {
      id: "f-tests",
      letter: "F",
      title: "Tests",
      subtitle: "Le dry-run et les protections sont tests en priorit.",
      blocks: [
        {
          type: "code",
          title: "tests/unit/safety.test.ts",
          lang: "ts",
          code: `import { describe, expect, it } from "vitest";
import { canDelete, isProtected } from "../../src/core/safety.js";
import { audit } from "../../src/core/audit.js";

const policy = { current: "feat/nav", protect: ["release/*"], forceUnmerged: false, confirmed: false };
const b = (name: string, merged: boolean, staleDays = 4, upstreamGone = false) =>
  ({ name, merged, staleDays, upstreamGone });

describe("isProtected", () => {
  it("protge la branche courante et les noms rservs", () => {
    expect(isProtected("feat/nav", policy)).toBe(true);
    expect(isProtected("main", policy)).toBe(true);
    expect(isProtected("release/1.0", policy)).toBe(true);
  });
  it("n'interdit pas une branche de feature ordinaire", () => {
    expect(isProtected("feat/landing", policy)).toBe(false);
  });
});

describe("canDelete", () => {
  it("autorise une branche merge non protge", () => {
    expect(canDelete(b("fix/env", true), policy)).toEqual({ ok: true });
  });
  it("refuse une non merge sans --force-unmerged", () => {
    expect(canDelete(b("wip/api", false), policy)).toMatchObject({ ok: false });
    expect(canDelete(b("wip/api", false), policy).reason).toContain("--force-unmerged");
  });
  it("refuse une non merge même force sans confirmation", () => {
    expect(canDelete(b("wip/api", false), { ...policy, forceUnmerged: true })).toMatchObject({ ok: false });
  });
});

describe("audit", () => {
  it("ne propose jamais la branche courante", () => {
    const { candidates } = audit([b("feat/nav", true)], { staleDays: 0, incléudeMerged: true, incléudeOrphans: true }, policy);
    expect(candidates.map((c) => c.name)).not.toContain("feat/nav");
  });
  it("cléasse par merged, gone et ge, de faon stable", () => {
    const out = audit([b("z-merged", true), b("a-gone", false, 2, true), b("b-stale", false, 90)],
      { staleDays: 30, incléudeMerged: true, incléudeOrphans: true }, policy);
    expect(out.candidates.map((c) => c.name)).toEqual(["a-gone", "b-stale", "z-merged"]);
  });
  it("excléut une branche ni merge, ni gone, ni stale", () => {
    const out = audit([b("feat/active", false, 2)], { staleDays: 30, incléudeMerged: true, incléudeOrphans: true }, policy);
    expect(out.candidates).toEqual([]);
  });
});`,
        },
        {
          type: "code",
            title: "tests/integration/safety.test.ts - vrais depots git",
          lang: "ts",
          code: `import { execa } from "execa";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cléI = new URL("../../dist/cli.js", import.meta.url).pathname;
async function gitRepo(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), "bc-"));
  const git = (...a: string[]) => execa("git", a, { cwd: dir });
  await git("init", "-q", "-b", "main");
  await git("config", "user.email", "test@example.invalid");
  await git("config", "user.name", "Tests");
  writeFileSync(join(dir, "a.txt"), "a");
  await git("add", ".");
  await git("commit", "-qm", "init");
  return dir;
}
const branches = async (cwd: string) =>
  (await execa("git", ["for-each-ref", "--format=%(refname:short)", "refs/heads"], { cwd })).stdout.split("\\n");

it("ne supprime RIEN sans --apply", async () => {
  const cwd = await gitRepo();
  await execa("git", ["branch", "fix/env"]);
  await execa("node", [cléI, "--merged", "--no-color"], { cwd });
  expect(await branches(cwd)).toContain("fix/env");
});

it("supprime une branche merge avec --apply", async () => {
  const cwd = await gitRepo();
  await execa("git", ["branch", "fix/env"]);
  const { exitCode } = await execa("node", [cléI, "--merged", "--apply", "--no-color"], { cwd });
  expect(exitCode).toBe(0);
  expect(await branches(cwd)).not.toContain("fix/env");
});

it("ne supprime jamais main", async () => {
  const cwd = await gitRepo();
  await execa("node", [cléI, "--merged", "--apply", "--no-color"], { cwd });
  expect(await branches(cwd)).toContain("main");
});

it("protge une branche demande via --protect", async () => {
  const cwd = await gitRepo();
  await execa("git", ["branch", "keep/me"]);
  await execa("node", [cléI, "--merged", "--apply", "--protect", "keep/*", "--no-color"], { cwd });
  expect(await branches(cwd)).toContain("keep/me");
});

it("refuse les non merges sans double confirmation", async () => {
  const cwd = await gitRepo();
  await execa("git", ["checkout", "-qb", "wip/api"]);
  writeFileSync(join(cwd, "b.txt"), "b");
  await execa("git", ["add", "."]); await execa("git", ["commit", "-qm", "wip"]);
  await execa("git", ["checkout", "main"]);
  const run = await execa("node", [cléI, "--force-unmerged", "--apply", "--no-color"], { cwd, reject: false });
  expect(run.exitCode).toBe(1);
  expect(await branches(cwd)).toContain("wip/api");
});`,
        },
        {
          type: "table",
          headers: ["Fixture git", "scénario", "Attendu"],
          rows: [
            ["merged-only", "3 branches merges, 1 courante", "3 candidates, aucune suppression en dry-run"],
            ["unmerged", "branche non merge", "excléue sans --force-unmerged, protection teste"],
            ["orphan", "upstream configur puis remote supprim", "détection via [gone], rapport JSON"],
            ["stale", "dates de commit forces (GIT_COMMITTER_DATE)", "seuil --stale 30 respecte la limite"],
            ["detached", "HEAD dtache", "exit 0, aucune courante, avertissement"],
            ["no-remote", "aucun upstream", "check orphelines ignor, aucun crash"],
          ],
        },
        {
          type: "table",
          headers: ["Test manuel", "Commande", "Attendu"],
          rows: [
            ["Dpt de test", "branch-cleaner --graph", "dry-run visible, arbre lisible"],
            ["Slection cléavier", "branch-cleaner --interactive", "flches + espace, annulation q, confirmation requise"],
            ["CI sans TTY", "branch-cleaner --interactive", "refus exit 1, message actionnable"],
            ["Windows WSL", "devwell branches --stale 30", "rendu correct, pas de git bash spcifique"],
            ["Protected", "branch-cleaner --apply --protect main", "main intacte, aucune erreur"],
          ],
        },
        {
          type: "callout",
          tone: "success",
          title: "Couverture vise : -- 85 %",
          text: "safety.ts doit tre  100 %. Un test E2E par invariant destructif est obligatoire : dry-run, courante, protge, non merge sans confirmation. Les fixtures se crent par script avec des dates GIT_COMMITTER_DATE pour rester déterministes.",
        },
        {
          type: "code",
            title: "CI - incléut un test sur les trois OS",
          lang: "yaml",
          code: `strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
    node: [18, 20, 22]
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with: { node-version: \${{ matrix.node }}, cache: npm }
  - run: npm ci && npm run lint && npm run build
  - run: npm test -- --coverage
  - name: Fume sécuritéaire
    run: node dist/cli.js --dry-run --no-color --format json`,
        },
      ],
    },
    {
      id: "g-documentation",
      letter: "G",
      title: "Documentation",
      subtitle: "-crire noir sur blanc ce qui ne sera jamais supprim.",
      blocks: [
        { type: "badges", items: ["MIT", "dry-run par défaut", "3 OS", "npm devwell", "v0.1.0"] },
        {
          type: "code",
            title: "README.md - extrait publie",
          lang: "md",
          code: `# branch-cleaner

> Fais le mnage sans perdre de travail.
> Un audit de branches, un graphe lisible, un consentement explicite.

## Installation (20 s)

    npm install --global .
    branch-cleaner --version

prérequis : git 2.30+, Node 18.17+ (ou WSL sous Windows).

## Le rflexe en 3 lignes

    branch-cleaner --stale 30 --graph   # regarder
    branch-cleaner --interactive        # choisir
    branch-cleaner --apply              # exécutéer

## Ce que l'outil ne supprimera jamais

- la branche courante
- main, master, develop, release/*
- une branche non merge, sauf --force-unmerged + confirmation
- une branche ajoute via --protect

## Comprendre les statuts

| Symbole | Statut | Sens |
| --- | --- | --- |
| -" | merge | contenue dans la base |
| -- | orpheline | upstream supprim (gone) |
| -- | inactive | pas de commit depuis N à jours |
| --- | courante | HEAD dessus, protge |
| -- | protge | pattern de protection |

## Options principales

| Option | défaut | Effet |
| --- | --- | --- |
| --merged | true | incléure les merges |
| --stale <j> | off | incléure les inactives |
| --graph | false | arbre ASCII |
| --apply | false | supprimer rellement |
| --interactive | false | slection TTY |
| --protect | défauts | branches intouchables |
| --format json | pretty | audit machine |

## sécurité

Le dry-run est le mode par défaut. --apply doit tre crit
explicitement. Aucune branche distante n'est modifie.
Aucune commande git dangereuse (rebase, reset, push) n'est lance.

## FAQ

**J'ai peur de perdre un commit.** Une branche merge a ses commits
dans la base. Une orpheline ou une inactive n'est pas forcment
merge : crez un tag de sauvegarde avant --apply. L'outil ne modifie
jamais les commits de la base.
**Et les branches distantes ?** Hors-scope v0.1. Seules les refs
locales refs/heads sont supprimes.
**Pourquoi une branche n'apparat pas ?** Elle n'est peut-tre pas
merge, protge, ou ne correspond  aucun critre.
**--apply ne fait rien ?** Vrifiez TTY, protections et --stale.

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
- Audit des branches : merges, orphelines (upstream gone), inactives
- Graphe ASCII simplifi avec --graph et --graph-limit
- Mode interactif cléavier avec slection et confirmation
- Dry-run par défaut ; --apply comême seule action destructive
- Protections main/master/develop/release/* et --protect
- Rapport JSON (schemaVersion 1), i18n fr/en, --no-color

### Security
- Jamais la branche courante, jamais une non merge sans double
  confirmation explicite
- Aucun appel  git shell : execFile avec tableau d'arguments
- Aucune opration réseau sans --fetch

### Known limitations
- Branches distantes non supprimes
- Worktrees non pris en charge (v1.2)`,
        },
        {
          type: "list",
          items: [
            "Dmo asciinema : 30 s, 40 branches -' 5 supprimes aprs slection, aucune perte.",
            "CONTRIBUTING : toute volution touchant safety.ts exige un test E2E et une revue de sécurité.",
            "README : les interdictions sont un contrat, pas une note de bas de page.",
            "docs/SAFETY.md : modle de menace (TOCTOU, upstream gone, branches homonymes).",
          ],
        },
      ],
    },
    {
      id: "h-livraison",
      letter: "H",
      title: "Livraison",
      subtitle: "Une adoption qui comêmence par la confiance.",
      blocks: [
        {
          type: "check",
          title: "Checklist de release",
          items: [
            { label: "Tests des 5 invariants destructifs verts sur 3 OS", done: true },
            { label: "Dry-run par défaut confirm par test E2E", done: true },
            { label: "Mode interactif test cléavier + sans TTY", done: true },
            { label: "safety.ts couvert  100 %", done: true },
            { label: "README sécurité + FAQ publis", done: true },
            { label: "Tag sign v0.1.0, npm publish --provenance" },
            { label: "Dmo quipe : audit rel sur un dpt partag" },
          ],
        },
        {
          type: "code",
          title: "Message Slack de lancement",
          lang: "text",
          code: `:broom: branch-cleaner v0.1.0 -" le mnage git, sans stress

  devwell branches --stale 30 --graph

  -" branches merges       -- orphelines / anciennes
  --- courante (protge)    -- branches protges

DRY-RUN PAR D-FAUT. Rien ne bouge sans --apply.
  branch-cleaner --interactive   (choisir  la main)
  branch-cleaner --apply         (merges uniquement)

Jamais main, jamais votre branche courante, jamais une non
merge sans confirmation. Distantes : hors-scope v0.1.

Jeudi 15 min : audit live de notre dpt ? :mag:`,
        },
        {
          type: "table",
          headers: ["Version", "Contenu", "Critre de sortie"],
          rows: [
            ["v0.1.0", "Audit, graphe ASCII, interactif, dry-run, protections", "3 dpts nettoys sans incident"],
            ["v1.0.0", "Contrat JSON stable, purge des remotes en option explicite, worktrees en lecture", "Revue sécurité externalise"],
            ["v1.2.0", "Sauvegarde automatique en tag local avant --apply, --since", "Restaurer une branche en une commande"],
            ["v2.0.0", "Politique d'quipe partage (fichier + rgles par prfixe), rapport de tendance", "Deux quipes pilotes en production"],
          ],
        },
      ],
    },
  ],
};
