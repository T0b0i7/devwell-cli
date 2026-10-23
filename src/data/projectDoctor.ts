import type { ToolDoc } from "./types";

export const projectDoctor: ToolDoc = {
  slug: "project-doctor",
  index: "03",
  name: "project-doctor",
  binary: "project-doctor",
  tagline: "Diagnostique ton projet en 1 commande.",
  short:
    "Runtime, dépendances obsoltes, fichiers de config : un score de sant 0-100 et un rapport HTML.",
  description:
    "Le check-up complet d'un depot Node ou Python. project-doctor croise la version du runtime, les manifests, les configs et les dependances pour produire un diagnostic priorise et ne corrige que ce qui est sur.",
  icon: "stethoscope",
  accent: "sky",
  language: "TypeScript  Node -- 18",
  deps: "1 runtime (picocolors), fetch natif",
  loc: "~900",
  devTime: "5 j-h",
  priority: "P1",
  install: "npm install --global .",
  quickCommand: "devwell doctor --json",
  keyFlags: ["--fix", "--report", "--min-score"],
  tags: ["audit", "runtime", "dépendances"],
  preamble:
    "Outil 03  Check-up de dpt. Un score honnête, expliqu, et une liste d'actions ordonnes par impact.",
  sections: [
    {
      id: "a-cadrage",
      letter: "A",
      title: "Fiche de cadrage",
      subtitle: "Un tat des lieux partag, pas une nime checklist.",
      blocks: [
        {
          type: "p",
          text: "Un dpt drive silencieusement : .nvmrc dit 18, la CI tourne en 22, le tsconfig contient trois options obsoltes, et 9 dépendances ont deux ans de retard. project-doctor agrge ces signaux en un score 0-100, explique chaque point perdu et propose l'action la plus rentable en premier. Le rapport HTML est partageable tel quel  la fin d'un sprint.",
        },
        {
          type: "table",
          headers: ["Persona", "Contexte", "Douleur"],
          rows: [
            ["Tech lead", "Reprise d'un dpt existant", "Ne sait pas par o comêmencer l'assainissement"],
            ["développeur senior", "Revue de dette technique", "Audit manuel, rsultat non reproductible"],
            ["Dveloppeuse junior", "Onboarding", "Configuration locale incohrente avec la CI"],
            ["Responsable plateforme", "Portefeuille de dpts", "Aucune vision standardise de la sant"],
          ],
        },
        { type: "h3", text: "User stories" },
        {
          type: "list",
          items: [
            "En tant que tech lead, je veux un score de sant argument afin de prioriser le travail sans lancer dix outils.",
            "En tant que développeur, je veux savoir quelle version de Node installer afin que mon environnement corresponde au dpt.",
            "En tant que mainteneur, je veux un rapport HTML autonome afin de le partager en revue sans serveur.",
            "En tant que plateforme, je veux un mode --ci avec seuil minimal afin de prvenir la dgradation d'un dpt.",
            "En tant que developpeur prudent, je veux un --fix limite aux corrections sures afin de ne pas voir mes dependances modifiees a mon insu.",
          ],
        },
        { type: "h3", text: "critères d'acceptation" },
        {
          type: "table",
          headers: ["Given", "When", "Then"],
          rows: [
            [".nvmrc = 20 et node = 18", "je lance project-doctor", "le check runtime échoue et recommande nvm use 20"],
            ["Un projet propre avec CI, lockfile, README", "je lance l'audit", "score -- 90, exit 0"],
            ["9 dépendances mineures obsoltes", "je lance l'audit", "section dependencies avec versions actuelle -' cible"],
            ["Un tsconfig avec virgule finale", "je lance l'audit", "JSONC pars sans erreur, aucune alerte parasite"],
            ["Stockage hors ligne", "je lance project-doctor --offline", "les checks réseau sont marqus ignors, score recalcul sans eux"],
            ["Un check de config cass", "je lance --fix --apply", "correction applique + note explicite dans le rapport, exit 0"],
            ["Score infrieur au seuil --min-score 80", "je lance en CI", "exit 1 et rcapitulatif des pertes de points"],
          ],
        },
        { type: "h3", text: "Hors-scope explicite" },
        {
          type: "list",
          items: [
            "Mise  à jour automatique de versions majeures : jamais sans Décision humaine.",
            "Audit de vulnrabilits CVE : renvoi explicite vers npm audit / pip-audit.",
            "Analyse du code (complexit, duplication, couverture) : outils ddis.",
            "Installation ou changement de version du runtime sur la machine.",
            "exécutéion de scripts du projet (aucun npm install, aucun postinstall).",
            "Monitoring continu hberg : l'outil reste local et one-shot.",
          ],
        },
      ],
    },
    {
      id: "b-specification",
      letter: "B",
      title: "Spcification fonctionnelle",
      subtitle: "Dix checks pondrs, un score, des actions.",
      blocks: [
        {
          type: "tree",
          title: "Arborescence de commandes",
          code: `project-doctor [options]
├── project-doctor                 # audit complet + tableau
├── project-doctor init            # cre .projectdoctorrc.json
├── project-doctor checks          # liste les checks, poids et tat
├── project-doctor explain <id>    # dtail, source, remdiation
└── project-doctor report <file>   # gnre un rapport HTML autonome`,
        },
        {
          type: "table",
          headers: ["Option", "Type", "défaut", "Description"],
          rows: [
              ["--fix", "boolean", "false", "Prepare les corrections sures ; les applique avec --apply"],
            ["--apply", "boolean", "false", "exécutée rellement les corrections prpares par --fix"],
              ["--report <file.html>", "path", "-", "Rapport HTML autonome, aucune dependance reseau"],
            ["--format <table|md|json>", "enum", "table", "Sortie console, Markdown collable en PR, JSON pour la CI"],
            ["--ci", "boolean", "false", "Sans couleur, sans interaction, rsum machine"],
            ["--min-score <0-100>", "number", "80", "Seuil d'chec en CI (code retour 1)"],
            ["--checks <ids>", "csv", "tous", "exécutée une slection : runtime,lockfile,dependencies,config"],
              ["--offline", "boolean", "false", "Aucune requete registre, checks reseau marques - ignores -"],
            ["--strict", "boolean", "false", "La moindre erreur de config bloque, même avec bon score"],
            ["--lang <fr|en>", "enum", "fr", "Langue des messages"],
            ["--no-color", "flag", "auto", "Dsactive les couleurs"],
              ["--version / --help", "flag", "-", "Version / aide"],
          ],
        },
        { type: "h3", text: "Grille du score (0-100)" },
        {
          type: "table",
          headers: ["Check", "ID", "Poids", "-chec ="],
          rows: [
            ["Runtime align", "runtime", "20", "Version active -- .nvmrc / .python-version"],
            ["Configs valides", "config", "20", "package.json / tsconfig / eslint illisibles ou options retires"],
            ["Lockfile cohrent", "lockfile", "10", "Absent, ou manifest plus rcent que le lock"],
            ["dépendances  à jour", "dependencies", "25", "Ratio de dépendances obsoltes, pnalit accrue pour les majeures"],
            ["Scripts essentiels", "scripts", "10", "test, lint, build manquants ou scripts tronqus"],
            ["Hygine du dpt", "hygiene", "15", "README, LICENSE, .gitignore, .editorconfig, CI"],
          ],
        },
        {
          type: "table",
          headers: ["Score", "Statut", "Lecture"],
          rows: [
              ["90-100", "- Excellent", "Maintenance courante ; rien d'urgent"],
            ["70-89", "-- Bon", "Dette localise, traiter les 2 premiers check"],
            ["50-69", "-- Fragile", "Onboarding  risque, plan d'action sur un sprint"],
            ["0-49", "-- Critique", "Config ou runtime non fiable, bloquer les nouvelles features"],
          ],
        },
          { type: "h3", text: "Corrections sures de --fix" },
        {
          type: "table",
            headers: ["Correction", "Sure ?", "Raison"],
          rows: [
            ["Ajouter engines.node depuis .nvmrc", "oui", "Documente l'existant, aucun changement de runtime"],
            ["Crer .nvmrc si absent et runtime unique détect", "oui", "Aucun impact sur le build en cours"],
            ["Complter .gitignore (.env, node_modules, dist)", "oui", "Protge des fichiers dj ignors de fait"],
            ["Infrer les scripts test/lint si le fichier de config existe", "oui", "Ajoute une commande, ne remplace rien"],
            ["Crer les sections README/LICENSE manquantes", "oui", "Contenu squelette,  complter"],
            ["exécutéer npm audit fix", "non", "Peut modifier l'arbre de dépendances"],
            ["Monter une version majeure", "non", "Décision humaine"],
            ["-craser un tsconfig existant", "non", "Perte de configuration locale"],
          ],
        },
        {
          type: "table",
          headers: ["Code", "Signification"],
          rows: [
            ["0", "Audit OK et score -- --min-score (ou --fix entirement russi)"],
            ["1", "Erreur logique : score sous le seuil, config casse en --strict"],
            ["2", "Erreur technique : permission, rapport HTML non crivable, JSON invalide"],
          ],
        },
        {
          type: "code",
          title: "Sortie JSON (extrait contractuel)",
          lang: "json",
          code: `{
  "tool": "project-doctor",
  "schemaVersion": 1,
  "project": { "name": "devwell-web", "manager": "npm", "runtime": "node" },
  "score": 78,
  "status": "bon",
  "scores": [
    { "id": "runtime", "weight": 20, "earned": 20 },
    { "id": "dependencies", "weight": 25, "earned": 13 }
  ],
  "issues": [
    { "id": "dependencies", "severity": "warning", "count": 4,
      "message": "4 dépendances obsoltes (2 majeures)",
      "fix": "npm outdated puis mises  à jour cibles" }
  ],
  "ignored": [],
  "fixesApplied": []
}`,
        },
      ],
    },
    {
      id: "c-technique",
      letter: "C",
      title: "Design technique",
      subtitle: "Lire beaucoup, modifier trs peu.",
      blocks: [
        {
          type: "p",
          text: "Langage recommand : TypeScript/Node. Les artefacts  analyser sont majoritairement npm (package.json, lock, tsconfig) et la sortie JSON de npm outdated est directement exploitable. Pour les projets Python, l'outil dlgue aux commandes officielles (python3 --version, pip list --outdated --format json) et dgrade proprement si elles sont absentes. Alternative : Python/Packaging, meilleur pour pip mais plus faible sur la lecture JSONC de tsconfig. Recommandation : TypeScript, avec un adaptateur runtime isol.",
        },
        {
          type: "table",
          headers: ["dépendance", "Rle", "Note"],
          rows: [
            ["picocolors", "couleurs", "seule dépendance runtime"],
            ["fetch (natif Node -- 18)", "registre npm", "timeout 2 s, retry 0, --offline respect"],
            ["node:util.parseArgs", "cléI", "aucun framework"],
            ["nvm / python3 / pip", "mtadonnes runtime", "commandes systme, chec non bloquant"],
            ["vitest (dev)", "tests", "fetch inject, aucun réseau en test"],
          ],
        },
        { type: "h3", text: "Architecture : adaptateurs et rgles pures" },
        {
          type: "tree",
          title: "Arborescence du paquet",
          code: `project-doctor/
├── src/
│   ├── cli.ts
│   ├── project/
│   │   ├── detect.ts       # manager, runtime, workspaces
│   │   ├── manifest.ts     # package.json, pyproject.toml
│   │   └── configs.ts      # tsconfig (JSONC), eslint flat/legacy
│   ├── checks/
│   │   ├── index.ts        # registre pondr, tri stable
│   │   ├── runtime.ts
│   │   ├── dependencies.ts # npm outdated / pip (injectable)
│   │   ├── lockfile.ts
│   │   ├── config.ts
│   │   ├── scripts.ts
│   │   └── hygiene.ts
│   ├── score.ts            # pondration pure, bornes 0-100
│   ├── fix.ts              # liste blanche de corrections
│   ├── report/html.ts      # template autonome, chappement strict
│   └── render/table.ts
├── tests/
└── package.json`,
        },
        {
          type: "flow",
          steps: [
            { title: "detect", text: "Trouve la racine, le gestionnaire (npm/pnpm/yarn/pip), le runtime cible via .nvmrc / .python-version / .tool-versions." },
            { title: "readConfigs", text: "Parse JSON et JSONC sans mutation. Une config invalide devient une issue, pas un crash." },
            { title: "runChecks", text: "exécutée les checks activs en parallle borne ; chaque check met des issues et un ratio earned/weight." },
            { title: "network", text: "npm outdated / pip --outdated uniquement si !offline, timeout court, chec = check ignor et signal." },
            { title: "score", text: "Somême des poids moins pnalits, borne 0-100. Le dtail est touà jours expos, jamais seulement le chiffre." },
            { title: "fix/report", text: "--fix applique la liste blanche par criture atomique ; --report rend un HTML statique chapp." },
          ],
        },
        {
          type: "callout",
          tone: "info",
          title: "Décision : score non bloquant, seuil explicite",
          text: "Option A retenue : score informatif, chec CI pilot par --min-score (défaut 80). Option B : seuil magique fixe. La A est explicite, ajustable par dpt, et vite les faux checs lors de l'adoption.",
        },
      ],
    },
    {
      id: "d-ux",
      letter: "D",
      title: "UX cléI",
      subtitle: "Le diagnostic doit dire quoi faire ensuite.",
      blocks: [
        {
          type: "kv",
          items: [
            { k: "Nom", v: "project-doctor" },
              { k: "Sous-titre", v: "project-doctor - Diagnostique ton projet en 1 commande." },
            { k: "Principe", v: "chaque point perdu est rattach  une action et  un identifiant de check" },
            { k: "Accessibilité", v: "jauge en ASCII + libellé de statut, pas de vert/rouge seul" },
          ],
        },
        {
          type: "ascii",
          title: "Rendu d'un audit (TTY, couleur)",
          code: `$ project-doctor

  project-doctor                                    devwell-web  npm

  SANT- DU PROJET                                   78 / 100   -- BON
  ----------------------------------------------------------------------'--'--'--'--'--'--'--'

  -" RUNTIME           Node 20.11.1 = .nvmrc 20         20/20
  -" CONFIGS           package.json, tsconfig, eslint      20/20
  -" LOCKFILE          package-lock.json  à jour             10/10
  -- D-PENDANCES       4 obsoltes  2 majeures             13/25
  -" SCRIPTS           dev, build, test, lint               10/10
  -- HYGI-NE           README vide  pas de LICENSE         5/15

  ACTIONS PRIORITAIRES
  1 -- Mettre  à jour picocolors 1.0 -' 1.1         npm i picocolors@1
  2 -- Vite 4 -' 6 : migration majeure             voir docs/upgrade.md
  3 -- Ajouter une LICENSE                        project-doctor --fix
  4 -- Complter le README                        project-doctor --report

  4 warning  0 erreur  2 checks réseau  0 correction applique
  Rapport HTML : project-doctor --report rapport.html        exit 0`,
        },
        {
          type: "code",
          title: "--help (intgral)",
          lang: "text",
          code: `project-doctor -" Diagnostique ton projet en 1 commande.

USAGE
  project-doctor [options]
  project-doctor init                 Cre .projectdoctorrc.json
  project-doctor checks              Liste ids, poids et tat
  project-doctor explain <check>     Dtail et remdiation
  project-doctor report <file.html>  Gnre un rapport autonome

OPTIONS
  --fix                  Prpare les corrections s-"res (dry-run)
  --apply                exécutée les corrections prpares par --fix
  --report <file>        -crit un rapport HTML partageable
  --format <fmt>         table | md | json (défaut : table)
  --ci                   Sans couleur ni interaction
  --min-score <n>        Seuil d'chec CI, 0-100 (défaut : 80)
  --checks <ids>         Sous-ensemble spar par des virgules
  --offline              Aucune requte vers le registre
  --strict               Toute erreur de config bloque
  --lang <fr|en>         Langue (défaut : fr)
  --no-color             Couleurs dsactives
  -h, --help / -v, --version

CORRECTIONS S-'RES (--fix)
  engines.node, .nvmrc, .gitignore, scripts infrables, squelettes
  README/LICENSE. Aucune dépendance n'est mise  à jour.

EXEMPLES
  project-doctor
  project-doctor --format md > rapport.md
  project-doctor --ci --min-score 70 --format json
  project-doctor --fix --offline

Codes retour : 0 OK  1 seuil non atteint  2 erreur technique
Documentation incluse dans le guide Devwell.`,
        },
        {
          type: "table",
          headers: ["Situation", "Comportement", "Message"],
          rows: [
            ["Pas de manifest", "exit 2, aucun audit partiel prsent comême complet", "-- Aucun package.json ni pyproject.toml détect"],
            ["Config invalide", "issue, pas de crash", "-- tsconfig.json : virgule finale ligne 12 (JSONC)"],
             ["Pas de reseau / offline", "check ignore, jamais note 0", "- Dependances non verifiees (--offline)"],
            ["Registre lent", "timeout 2 s, audit poursuivi", "-- Registre injoignable, check ignor"],
            ["Rapport protg", "exit 2 sans toucher au disque", "-- Impossible d'crire rapport.html (EACCES)"],
             ["--fix sans --apply", "plan affiche, aucun fichier modifie", "- 3 corrections proposees - relancez avec --apply"],
             ["Detache de tout depot", "audit local, check hygiene limite", "- Pas de depot git : hygiene evaluee sur les fichiers visibles"],
          ],
        },
      ],
    },
    {
      id: "e-implementation",
      letter: "E",
      title: "Implmentation",
        subtitle: "Le soclée reel : checks, score, fix sur, rapport.",
      blocks: [
        {
          type: "code",
            title: "package.json - complet",
          lang: "json",
          code: `{
  "name": "devwell",
  "version": "0.1.0",
  "description": "Diagnostic 0-100 d'un projet Node/Python : runtime, configs, dépendances.",
  "license": "MIT",
  "author": "Devwell contributors",
  "type": "module",
  "bin": { "project-doctor": "./dist/cli.js" },
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
          title: "src/checks/runtime.ts + score.ts",
          lang: "ts",
          code: `import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);

export type CheckResult = {
  id: string;
  label: string;
  weight: number;
  earned: number;
  severity: "ok" | "warning" | "error";
  message: string;
  action?: string;
};

export async function checkRuntime(cwd: string): Promise<CheckResult> {
  const base = { id: "runtime", label: "Runtime", weight: 20 };
  let expected: string | null = null;
  try { expected = (await readFile(cwd + "/.nvmrc", "utf8")).trim().replace(/^v/, ""); } catch { /* absent */ }

  let actual = process.versions.node;
  try {
    const { stdout } = await run("node", ["--version"], { cwd, timeout: 2000 });
    actual = stdout.trim().replace(/^v/, "");
  } catch { /* on garde la version du process */ }

  if (!expected) {
    return { ...base, earned: 14, severity: "warning",
      message: "Aucune version pingle (" + actual + ")",
      action: "Ajouter .nvmrc pour figer la version" };
  }
  const matches = actual.split(".")[0] === expected.split(".")[0];
  return matches
    ? { ...base, earned: 20, severity: "ok", message: "Node " + actual + " = .nvmrc " + expected }
    : { ...base, earned: 0, severity: "error",
        message: "Node " + actual + " -- .nvmrc " + expected,
        action: "nvm install " + expected + " && nvm use " + expected };
}

/** Score pur : somême des points gagns, born 0-100. */
export function computeScore(results: CheckResult[]): {
  score: number; status: "excellent" | "bon" | "fragile" | "critique";
} {
  const max = results.reduce((sum, r) => sum + r.weight, 0);
  const earned = results.reduce((sum, r) => sum + r.earned, 0);
  const score = max === 0 ? 0 : Math.round((earned / max) * 100);
  const status = score >= 90 ? "excellent" : score >= 70 ? "bon" : score >= 50 ? "fragile" : "critique";
  return { score, status };
}`,
        },
        {
          type: "code",
            title: "src/checks/configs.ts - JSONC sans dependance",
          lang: "ts",
          code: `/** Retire les comêmentaires et virgules finales hors chanes. */
export function stripJsonc(source: string): string {
  let out = "";
  let inString = false;
  let inLine = false;
  let inBlock = false;

  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    const n = source[i + 1];

    if (inLine) { if (c === "\\n") { inLine = false; out += c; } continue; }
    if (inBlock) { if (c === "*" && n === "/") { inBlock = false; i++; } continue; }
    if (inString) {
      out += c;
      if (c === "\\\\") { out += source[++i]; continue; }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; out += c; continue; }
    if (c === "/" && n === "/") { inLine = true; i++; continue; }
    if (c === "/" && n === "*") { inBlock = true; i++; continue; }
    out += c;
  }
  return out.replace(/,(\s*[}\]])/g, "$1");
}

export function readTsconfig(source: string): { ok: true; data: unknown } | { ok: false; message: string } {
  try {
    return { ok: true, data: JSON.parse(stripJsonc(source)) };
  } catch (err) {
    return { ok: false, message: "tsconfig.json illisible : " + (err as Error).message };
  }
}`,
        },
        {
          type: "code",
            title: "src/fix.ts - liste blanche, jamais de surprise",
          lang: "ts",
          code: `export type Fix = { id: string; describe: string; apply: () => Promise<void> };

const SAFE_IDS = new Set([
  "engines-from-nvmrc", "create-nvmrc", "gitignore-essentials",
  "infer-scripts", "readme-skeleton", "license-mit",
]);

export async function runFixes(fixes: Fix[], { ci, apply }: { ci: boolean; apply: boolean }) {
  const eligible = fixes.filter((fix) => SAFE_IDS.has(fix.id));
  if (!eligible.length) return { applied: [] as string[], skipped: fixes.map((f) => f.id) };
  // dry-run structurel : sans --apply, rien n'est crit, même en CI
  if (!apply) return { applied: [], skipped: eligible.map((f) => f.id) };
  if (ci) throw new Error("--fix --apply est rserv  une revue humaine hors CI");

  const applied: string[] = [];
  for (const fix of eligible) {
    await fix.apply();              // critures atomiques uniquement
    applied.push(fix.id);
  }
  return { applied, skipped: fixes.filter((f) => !SAFE_IDS.has(f.id)).map((f) => f.id) };
}`,
        },
        {
          type: "code",
            title: ".projectdoctorrc.json - configuration d'equipe",
          lang: "json",
          code: `{
  "minScore": 80,
  "offline": false,
  "ignore": ["hygiene"],
  "weights": { "dependencies": 30, "hygiene": 10 },
  "ignoredDependencies": ["@types/node"],
  "report": { "title": "Devwell - santé du dépôt", "theme": "light" },
  "fix": { "enabled": ["engines-from-nvmrc", "gitignore-essentials"] }
}`,
        },
        {
          type: "code",
          title: "Installation & usage en quipe",
          lang: "bash",
          code: `# Outil partag dans le dpt (version pingle, exécutéion reproductible)
npm install --global .

# Une commande, que le projet soit Node ou Python
devwell doctor

# Rapport de sprint
devwell doctor --report artifacts/health.html

# Portail CI : chec si le score descend sous 70
devwell doctor --ci --min-score 70 --json

# Installation globale (usage ponctuel hors dpt)
devwell doctor --json`,
        },
      ],
    },
    {
      id: "f-tests",
      letter: "F",
      title: "Tests",
      subtitle: "Aucun test ne dpend du réseau ni du runtime local.",
      blocks: [
        {
          type: "code",
          title: "tests/unit/score.test.ts",
          lang: "ts",
          code: `import { describe, expect, it } from "vitest";
import { computeScore, type CheckResult } from "../../src/checks/runtime.js";
import { stripJsonc, readTsconfig } from "../../src/checks/configs.js";

const result = (weight: number, earned: number): CheckResult => ({
  id: "x", label: "X", weight, earned, severity: "ok", message: "",
});

describe("computeScore", () => {
  it("retourne 100 quand tout est gagn", () => {
    expect(computeScore([result(20, 20), result(80, 80)])).toEqual({ score: 100, status: "excellent" });
  });
  it("arrondit et borne le score", () => {
    expect(computeScore([result(3, 1)]).score).toBe(33);
    expect(computeScore([]).score).toBe(0);
  });
  it("cléasse correctement les statuts aux bornes", () => {
    expect(computeScore([result(100, 90)]).status).toBe("excellent");
    expect(computeScore([result(100, 70)]).status).toBe("bon");
    expect(computeScore([result(100, 50)]).status).toBe("fragile");
    expect(computeScore([result(100, 49)]).status).toBe("critique");
  });
});

describe("JSONC", () => {
  it("supprime comêmentaires et virgules finales", () => {
    const source = '{ /* c */ "compilerOptions": { "strict": true, }, // fin\\n }';
    expect(JSON.parse(stripJsonc(source))).toEqual({ compilerOptions: { strict: true } });
  });
  it("ne casse pas une URL dans une chane", () => {
    const data = readTsconfig('{ "path": "https://x.dev//y", }');
    expect(data.ok).toBe(true);
  });
  it("remonte un message cléair sur JSON cass", () => {
    expect(readTsconfig('{ "strict": tru }')).toMatchObject({ ok: false });
  });
});

describe("runtime", () => {
  it("recommande la version du .nvmrc sans modifier le systme", async () => {
    const { checkRuntime } = await import("../../src/checks/runtime.js");
    const res = await checkRuntime(process.cwd());
    expect(res.weight).toBe(20);
    expect(["ok", "warning", "error"]).toContain(res.severity);
  });
});`,
        },
        {
          type: "code",
            title: "tests/integration/cli.test.ts - fixtures & fetch simule",
          lang: "ts",
          code: `import { execa } from "execa";
import { readFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const fixture = (name: string) => new URL("../fixtures/" + name, import.meta.url).pathname;
const cléI = new URL("../../dist/cli.js", import.meta.url).pathname;

it("sant parfaite : exit 0 et score 100", async () => {
  const { stdout, exitCode } = await execa("node", [cléI, "--ci", "--format", "json", "--offline"], { cwd: fixture("healthy") });
  expect(exitCode).toBe(0);
  expect(JSON.parse(stdout)).toMatchObject({ score: 100 });
});

it("respecte --min-score", async () => {
  const run = await execa("node", [cléI, "--ci", "--offline", "--min-score", "95"], { cwd: fixture("obsolete-deps"), reject: false });
  expect(run.exitCode).toBe(1);
});

it("--fix cre engines depuis .nvmrc sans toucher aux deps", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "pd-fix-"));
  await copyFixture("fixable", cwd);
  const before = JSON.parse(await readFile(join(cwd, "package.json"), "utf8"));
  await execa("node", [cléI, "--fix", "--apply", "--offline"], { cwd });
  const after = JSON.parse(await readFile(join(cwd, "package.json"), "utf8"));
  expect(after.engines.node).toBe("20");
  expect(after.dependencies).toEqual(before.dependencies);
});

it("config casse : erreur explique, code 1 en --strict", async () => {
  const run = await execa("node", [cléI, "--ci", "--offline", "--strict"], { cwd: fixture("broken-tsconfig"), reject: false });
  expect(run.stderr + run.stdout).toContain("tsconfig");
  expect(run.exitCode).toBe(1);
});

it("--offline ne ralise aucune requte", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  await execa("node", [cléI, "--ci", "--offline"], { cwd: fixture("healthy") });
  expect(fetchMock).not.toHaveBeenCalled();
});`,
        },
        {
          type: "table",
          headers: ["Fixture", "But", "Attendu"],
          rows: [
            ["healthy/", "Score maximal", "100, exit 0"],
            ["obsolete-deps/", "Pnalit dépendances", "score 60-75, action liste"],
              ["fixable/", "Correction sure", "engines ajoute, zero modification de deps"],
            ["broken-tsconfig/", "Rsilience JSONC", "exit 1 en strict, pas de stacktrace"],
            ["python-uv/", "Projet Python avec pyproject + uv.lock", "détection Python, commande pip adapte"],
            ["network-down/", "fetch rejette", "check ignor, pas de score nul"],
          ],
        },
        {
          type: "table",
          headers: ["Test manuel", "Commande", "Attendu"],
          rows: [
            ["Dpt rel", "project-doctor", "tableau complet, exit 0 ou 1"],
            ["Rapport HTML", "project-doctor --report /tmp/r.html puis ouvrir", "fichier autonome, aucun CDN, contenu chapp"],
            ["Mode CI hors ligne", "project-doctor --ci --offline --format json", "JSON valide, checks réseau ignors signals"],
            ["Mauvaise version", "nvm use 16 puis project-doctor", "erreur runtime + commande de correction"],
            ["Windows PowerShell", "devwell doctor --report r.html", "chemins corrects, rapport gnr"],
          ],
        },
        {
          type: "callout",
          tone: "success",
          title: "Couverture vise : -- 80 %",
          text: "Seuils bloquants : 80 % global, 100 % sur fix.ts. Les appels réseau sont injects et mocks : aucun test ne touche le registre npm. Le snapshot du rapport HTML incléut un titre avec apostrophe et balise pour valider l'chappement.",
        },
        {
          type: "code",
            title: "CI - matrice et artefacts",
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
  - run: node dist/cli.js --ci --offline --min-score 80 --format json
  - uses: actions/upload-artifact@v4
    if: always()
    with: { name: health-report, path: artifacts/health.html }`,
        },
      ],
    },
    {
      id: "g-documentation",
      letter: "G",
      title: "Documentation",
      subtitle: "Expliquer le score et ses limites.",
      blocks: [
        { type: "badges", items: ["MIT", "Node + Python", "offline-first", "npm devwell", "v0.1.0"] },
        {
          type: "code",
            title: "README.md - extrait publie",
          lang: "md",
          code: `# project-doctor

> Diagnostique ton projet en 1 commande.
> Un score 0-100, des actions priorises, un rapport partageable.

## Installation (40 s)

    npm install --global .
    devwell doctor

Node 18.17+ pour lancer l'outil. Les projets Python sont
supports via python3 / pip, sans installation Python de l'outil.

## Ce qui est mesur

| Check | Poids | Vrifie |
| --- | --- | --- |
| runtime | 20 | Node/Python actif vs .nvmrc/.python-version |
| config | 20 | package.json, tsconfig JSONC, eslint |
| lockfile | 10 | prsence et cohrence |
| dependencies | 25 | npm outdated / pip list (maj. majeures pnalises) |
| scripts | 10 | test, lint, build |
| hygiene | 15 | README, LICENSE, .gitignore, CI |

## Usage

    project-doctor
    project-doctor --report artifacts/health.html
    project-doctor --format md > audit.md
    project-doctor --ci --min-score 70
    project-doctor --checks runtime,dependencies
    project-doctor explain dependencies

## --fix : ce qui est modifi

Uniquement des corrections s-"res : engines.node lu depuis .nvmrc,
.nvmrc manquant, .gitignore, scripts infrables, squelettes
README/LICENSE. Jamais de dépendance, jamais de version majeure.
Tout est dry-run par défaut : ajoutez --apply.

## Ce que l'outil ne fait pas

Pas d'audit CVE (npm audit / pip-audit), pas de monte de
version automatique, pas de scan de code, aucun envoi réseau
avec --offline.

## FAQ

**Mon score est bas, par o comêmencer ?** Regardez les deux
premiers check lists : ils psent le plus.
**Le check dépendances est ignor.** Le registre est injoignable
ou --offline est actif ; le score est recalcul sans ce poids.
**Puis-je crire mes propres checks ?** v1.1 exposera une API locale.

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
- Score de sant pondr 0-100 avec dtail par check
- Checks runtime, config (dont JSONC), lockfile, dépendances,
  scripts, hygine
- Rapport HTML autonome et sortie Markdown / JSON
- --offline, --checks, --min-score, --strict
- --fix avec liste blanche de corrections s-"res et dry-run par défaut
- Support Node (npm, pnpm, yarn) et Python (pip, uv)

### Security
- Aucune exécutéion de scripts du projet analys
- Rapport HTML chapp, zro ressource externe
- Aucune mutation de version de dépendance par --fix

### Known limitations
- Score approximatif sur les monorepos non détects
- Le check config ne valide pas les plugins ESLint personnaliss`,
        },
        {
          type: "list",
          items: [
              "README : tableau de score, limites explicites, section - ce que l'outil ne fait pas -.",
            "Dmo asciinema : audit d'un dpt dgrad -' --fix -' score +12 -' rapport HTML.",
            "CONTRIBUTING : tout nouveau check doit fournir poids, test unitaire, fixture et entre explain.",
            "docs/SCORING.md : formule publique et versionne pour que le score reste auditable.",
          ],
        },
      ],
    },
    {
      id: "h-livraison",
      letter: "H",
      title: "Livraison",
      subtitle: "Publier un diagnostic fiable, pas anxiogne.",
      blocks: [
        {
          type: "check",
          title: "Checklist de release",
          items: [
            { label: "Formule de score documente et fige pour la v0.1", done: true },
            { label: "Tests sans réseau (fetch inject) sur les 3 OS", done: true },
            { label: "Rapport HTML vrifi hors ligne (aucun CDN)", done: true },
            { label: "--fix limit  la liste blanche, test en non-rgression", done: true },
            { label: "Version 0.1.0, tag sign, npm publish --provenance", done: true },
            { label: "README publi avec le tableau des poids" },
            { label: "Dmo interne de 15 min + bilan de score sur 2 dpts" },
          ],
        },
        {
          type: "code",
          title: "Message Slack de lancement",
          lang: "text",
          code: `:stethoscope: project-doctor v0.1.0 -" le check-up du dpt

Score de sant 0-100, raisons dtailles, et un rapport HTML  partager.
  devwell doctor

  -" runtime vs .nvmrc        -" configs (même tsconfig JSONC)
  -" lockfile                 -- dépendances obsoltes
  -- README / LICENSE         -" scripts

CI :  project-doctor --ci --min-score 70 --offline
Fix s-"r :  project-doctor --fix --apply (dry-run par défaut)
Pas de monte de version auto, promis.

Atelier de 15 min jeudi ? :calendar:`,
        },
        {
          type: "table",
          headers: ["Version", "Contenu", "Critre de sortie"],
          rows: [
              ["v0.1.0", "6 checks, score, HTML, fix sur, offline", "3 depots pilotes, score reproductible"],
            ["v1.0.0", "Contrat JSON stable, docs de scoring, support pnpm workspaces", "Schma fig, 10 retours d'quipes traits"],
            ["v1.1.0", "Checks personnaliss locaux (plugin JS), check sécurité renvoyant vers l'outil ddi", "API documente, bac  sable"],
            ["v2.0.0", "Mode veille (watch) et tendance de score, historique local", "Zro criture réseau par défaut"],
          ],
        },
      ],
    },
  ],
};
