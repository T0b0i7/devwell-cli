import type { ToolDoc } from "./types";

export const envDoctor: ToolDoc = {
  slug: "env-doctor",
  index: "02",
  name: "env-doctor",
  binary: "env-doctor",
  tagline: "Tes variables d'env, au chevet du build.",
  short:
    "Compare .env, .env.example et .env.production, détecte les oublis, les doublons et les secrets exposés.",
  description:
    "Un audit statique et local de vos fichiers d'environnement. Aucun secret n'est exécuté ni envoyé sur le réseau : l'outil lit, classe, masque et retourne un code de sortie fiable pour la CI.",
  icon: "env",
  accent: "mint",
  language: "TypeScript  Node -- 18",
  deps: "1 runtime (picocolors)",
  loc: "~480",
  devTime: "2,5 j-h",
  priority: "P0",
  install: "npm install --global .",
  quickCommand: "devwell env --ci --json",
  keyFlags: ["--ci", "--format", "--strict"],
  tags: ["dotenv", "sécurité", "CI"],
  preamble:
    "Outil 02  Garde-fou d'environnement. Analyse statique, secrets masqués, sortie lisible par un humain et par une machine.",
  sections: [
    {
      id: "a-cadrage",
      letter: "A",
      title: "Fiche de cadrage",
      subtitle: "Les variables qui manquent toujours au mauvais moment.",
      blocks: [
        {
          type: "p",
          text: "Une variable absente de .env.example ne casse pas la CI : elle casse l'onboarding du prochain développeur, trois semaines plus tard. À l'inverse, une clé de production collée dans .env peut fuiter sur un fork public. env-doctor rend ces deux risques visibles en moins de deux secondes, sans lire ni afficher les valeurs sensibles en clair.",
        },
        {
          type: "table",
          headers: ["Persona", "Contexte", "Douleur"],
          rows: [
            ["Developpeuse junior", "Premier clone du projet", "- DATABASE_URL manquante - apres 40 min d'installation"],
            ["Lead / mainteneur", "Revue de PR", "Detecter a l'oeil une cle ajoutee sans exemple"],
            ["Ingenieur securite", "Audit de depot", "Secrets en dur non repares, .env parfois versionne"],
            ["Ingénieur CI/CD", "Pipeline de build", "Configs désynchronisés entre staging et production"],
          ],
        },
        { type: "h3", text: "User stories" },
        {
          type: "list",
          items: [
            "En tant que nouvel arrivant, je veux savoir exactement quelles variables me manquent afin de démarrer en moins de deux minutes.",
            "En tant que lead, je veux que la CI échoue si une clé existe en local mais pas dans .env.example afin de garder la documentation à jour.",
            "En tant qu'ingénieur sécurité, je veux voir les secrets exposés sous forme masquée afin de les révoquer sans les recopier dans Slack.",
            "En tant qu'ingénieur CI, je veux un rapport JSON et un code retour fiable afin de bloquer une PR automatiquement.",
            "En tant que développeur, je veux autoriser des clés volontairement publiques (VITE_*) afin de ne pas subir de faux positifs.",
          ],
        },
          { type: "h3", text: "Critères d'acceptation" },
        {
          type: "table",
          headers: ["Given", "When", "Then"],
          rows: [
            [".env contient STRIPE_KEY absente de .env.example", "je lance env-doctor", "STRIPE_KEY est listee - manquante dans l'exemple -, exit 1"],
            [".env.example contient API_URL absente de .env", "je lance env-doctor", "API_URL est listee - orpheline - avec severite warning"],
            [".env contient AKIAIOSFODNN7EXAMPLE", "je lance env-doctor", "secret AWS détect, valeur masque (AKIA------------), exit 1"],
            ["Deux fois la cl PORT dans le mme fichier", "je lance env-doctor", "doublon signal, la dernire valeur gagne (comme dotenv)"],
            ["Tout est cohrent", "je lance env-doctor --ci --format json", "JSON valide, tableau issues vide, exit 0"],
            ["Aucun fichier .env*", "je lance la commande", "message d'information, exit 0 sauf --strict"],
          ],
        },
        { type: "h3", text: "Hors-scope explicite" },
        {
          type: "list",
          items: [
            "Chargement des variables dans le processus courant (jamais de mutation de process.env).",
            "Appel  un vault, AWS Secrets Manager, Doppler ou GitHub Secrets : aucune connexion réseau.",
            "Rotation, génération ou chiffrement de secrets (renvoi vers les outils natifs de la plateforme).",
            "Validation de schma de type (Zod, Pydantic) : env-doctor vrifie prsence et cohrence, pas la forme mtier.",
            "Blocage des fuites dj commites dans l'historique git (v1.2 : --history).",
          ],
        },
      ],
    },
    {
      id: "b-specification",
      letter: "B",
      title: "Spcification fonctionnelle",
      subtitle: "Options, rapport, svrits et codes de retour.",
      blocks: [
        {
          type: "tree",
          title: "Arborescence de commandes",
          code: `env-doctor [options] [fichiers...]
├── env-doctor                     # autodétecte .env, .env.example, .env.production
├── env-doctor .env .env.example   # comparaison explicite
├── env-doctor init                # cre .envdoctorrc.json
└── env-doctor baseline            # construit une baseline signe des cls autorises`,
        },
        {
          type: "table",
          headers: ["Option", "Type", "Dfaut", "Description"],
          rows: [
            ["--ci", "boolean", "false", "Mode silencieux : JSON sur stdout, aucun texte dcoratif"],
            ["--format <pretty|json|github>", "enum", "pretty", "json pour pipelines, github pour annotations de PR"],
            ["--files <paths...>", "list", "autodétection", "Fichiers compars, le premier est la rfrence"],
            ["--strict", "boolean", "false", "Les warnings deviennent bloquants (exit 1)"],
            ["--secrets / --no-secrets", "boolean", "actif", "Active ou coupe l'analyse de motifs de secrets"],
            ["--allow <glob>", "repeatable", "VITE_*, NEXT_PUBLIC_*", "Cls publiques exclues du scan de secrets"],
              ["--ignore <KEY>", "repeatable", "-", "Cles a exclure entierement du rapport"],
            ["--mask <full|partial|none>", "enum", "partial", "Masquage des valeurs ; none interdit en CI"],
            ["--lang <fr|en>", "enum", "fr", "Langue des messages"],
            ["--color / --no-color", "flag", "auto (TTY)", "Force ou coupe les couleurs"],
              ["--version / --help", "flag", "-", "Version / aide"],
          ],
        },
        { type: "h3", text: "Rgles de diagnostic" },
        {
          type: "table",
          headers: ["Contrle", "Svrit", "Condition", "Bloquant en CI"],
          rows: [
            ["Cl manquante dans .env", "error", "prsente dans .env.example", "oui"],
            ["Orpheline", "warning", "prsente dans .env, absente de l'exemple", "non (oui avec --strict)"],
            ["Valeur vide", "error", "KEY= ou KEY=\"\"", "oui"],
            ["Doublon", "error", "mme cl 2+ fois dans un fichier", "oui"],
            ["Secret expos", "error", "valeur conforme  un motif connu", "oui"],
            ["Nom de cl invalide", "warning", "hors [A-Z_][A-Z0-9_]*", "non"],
            ["Fichier non lisible", "error technique", "EACCES / encodage", "exit 2"],
          ],
        },
        { type: "h3", text: "Format de rapport" },
        {
          type: "code",
          title: "Sortie --ci --format json (contrat stable)",
          lang: "json",
          code: `{
  "tool": "env-doctor",
  "version": "0.1.0",
  "schemaVersion": 1,
  "ok": false,
  "files": [
    { "path": ".env.example", "keys": 14, "role": "reference" },
    { "path": ".env", "keys": 13, "role": "compare" }
  ],
  "issues": [
    {
      "code": "ENV_KEY_MISSING",
      "severity": "error",
      "file": ".env.example",
      "key": "STRIPE_SECRET_KEY",
      "message": "Prsente dans .env.example, absente de .env"
    },
    {
      "code": "ENV_SECRET_EXPOSED",
      "severity": "error",
      "file": ".env",
      "key": "AWS_ACCESS_KEY_ID",
      "message": "Motif aws-access-key détect",
      "preview": "AKIA------------"
    }
  ],
  "summary": { "errors": 2, "warnings": 1, "byCode": { "ENV_KEY_MISSING": 1 } }
}`,
        },
        {
          type: "table",
          headers: ["Code", "Signification", "Comportement"],
          rows: [
            ["0", "OK", "Aucune erreur ; warnings tolrs sauf --strict"],
            ["1", "Erreur logique", "Au moins une issue bloquante (ou warning en --strict)"],
            ["2", "Erreur technique", "Fichier illisible, encodage non support, permission refuse"],
          ],
        },
        {
          type: "code",
          title: "Exemples d'invocation",
          lang: "bash",
          code: `# Audit local color
env-doctor

# PR GitHub : une annotation par issue, code retour bloquant
env-doctor --ci --format github

# Comparer trois environnements explicitement
env-doctor .env.example .env .env.production

# Autoriser les cls publiques Vite et Next
env-doctor --allow "VITE_*" --allow "NEXT_PUBLIC_*"

# En local, afficher tout (jamais en CI)
env-doctor --mask none`,
        },
      ],
    },
    {
      id: "c-technique",
      letter: "C",
      title: "Design technique",
      subtitle: "Un parseur .env maison, un scan de secrets honnête.",
      blocks: [
        {
          type: "p",
          text: "Langage recommande : TypeScript/Node. La detection de motifs et le parsing de fichiers texte sont directs, et l'equipe partage deja l'outillage npm. Alternative : Python 3.11 + Rich - tres lisible pour les rapports, mais demarrage ~110 ms et distribution pipx separee. Le contrat de sortie JSON est identique, ce qui rendrait un portage v2 realiste. Recommandation : TS pour une premiere version.",
        },
        {
          type: "table",
          headers: ["dépendance", "Rle", "Pourquoi pas plus"],
          rows: [
            ["picocolors", "Couleurs et détection NO_COLOR", "3 kB, aucune chane de dépendances"],
            ["node:fs, node:path", "IO fichier", "suffisant, aucune lib d'entreprise"],
            ["vitest + execa (dev)", "tests et CLI E2E", "dev uniquement"],
          ],
        },
        { type: "h3", text: "Pourquoi ne pas utiliser dotenv" },
        {
          type: "p",
          text: "dotenv est conu pour injecter des variables dans process.env. env-doctor doit au contraire rester passif : on garde la surface d'attaque minimale, on garde les valeurs hors de l'environnement du processus, et on contrle le comportement sur les doublons et les guillemets. Le parseur maison tient en une quarantaine de lignes et couvre export, guillemets simples/doubles, chappements et commentaires.",
        },
        {
          type: "tree",
          title: "Arborescence du paquet",
          code: `env-doctor/
├── src/
│   ├── cli.ts              # parseArgs, --ci, rendu, exit code
│   ├── core/
│   │   ├── discover.ts     # autodétection ordonne des .env*
│   │   ├── parseEnv.ts     # pur : string -> Map + doublons
│   │   ├── compare.ts      # manquants / orphelins / vides
│   │   ├── secrets.ts      # motifs + whitelist + masquage
│   │   └── severity.ts     # rgles de blocage
│   ├── render/
│   │   ├── pretty.ts
│   │   ├── json.ts
│   │   └── github.ts       # ::error file=.env::message
│   └── config.ts
├── tests/
│   ├── fixtures/           # 6 dpts d'exemple versionns
│   └── unit|integration/
└── package.json`,
        },
        {
          type: "table",
          headers: ["Motif", "Exemple (masqu dans la sortie)", "Svrit"],
          rows: [
            ["AWS access key", "AKIA + 16 alphanumriques", "error"],
            ["GitHub token", "ghp_, gho_, ghs_, github_pat_", "error"],
            ["Stripe", "sk_live_, rk_live_", "error"],
            ["Slack", "xoxb-, xoxp-, xoxa-", "error"],
            ["Cl prive PEM", "-----BEGIN -- PRIVATE KEY-----", "error"],
            ["JWT", "eyJ-- . eyJ-- . signature", "warning"],
            ["Gnrique", "*_SECRET, *_TOKEN, *_PASSWORD non vide et > 16 chars", "warning"],
            ["Google API", "AIza + 35 caractres", "error"],
          ],
        },
        {
          type: "flow",
          steps: [
            { title: "discover", text: "Dtermine la rfrence (.env.example en priorit) et les fichiers compars. Respecte --files." },
            { title: "parseEnv", text: "Chaque fichier -' Map ordonne de cls, valeurs jamais logues, doublons conservs." },
            { title: "compare", text: "Rfrence vs autres : manquantes, orphelines, vides, doublons, noms invalides." },
            { title: "scanSecrets", text: "Motifs compils une fois, whitelist --allow, prvisualisation masque." },
            { title: "decide", text: "severity.ts calcule le code retour : 0, 1, ou 2 si erreur technique." },
            { title: "render", text: "pretty / json / github. En --ci : un seul document JSON sur stdout." },
          ],
        },
      ],
    },
    {
      id: "d-ux",
      letter: "D",
      title: "UX CLI",
      subtitle: "Voir l'essentiel, masquer le reste.",
      blocks: [
        {
          type: "kv",
          items: [
            { k: "Nom", v: "env-doctor" },
              { k: "Sous-titre", v: "env-doctor - Trouve les variables manquantes avant la prod." },
            { k: "Principe", v: "ne jamais afficher une valeur secrte complte, mme avec --mask none en CI" },
              { k: "Symboles", v: "- OK - bloquant - warning - information - action" },
          ],
        },
        {
          type: "ascii",
          title: "Rendu local (couleur, symboles)",
          code: `$ env-doctor

  env-doctor  0.1.0        audit statique  2 fichiers traites

  R-F-RENCE      .env.example           14 cls
  COMPAR-        .env                   13 cls
                 .env.production        non trouv (ignor)

  -- 2 erreurs    -- 1 avertissement

  -- MANQUANTES                              dans .env
    -' STRIPE_SECRET_KEY                     rfrence dans .env.example
    -' REDIS_URL                             rfrence dans .env.example

  -- ORPHELINE                               absente de l'exemple
    -' VITE_ANALYTICS_TOKEN                  cl publique (allowlist)

  -- SECRETS EXPOS-S
    .env:12  AWS_ACCESS_KEY_ID              AKIA------------         motif aws-access-key
    .env:17  SESSION_SIGNING_KEY            ----------------           motif generic-secret

  PROCHAINES -TAPES
    -' ajoutez les cls manquantes  .env          (copier depuis .env.example)
    -' documentez les orphelines ou retirez-les    (--ignore KEY)
    -' révoquez AWS_ACCESS_KEY_ID si le fichier a t versionn

  Audit termin en 31 ms  exit 1`,
        },
        {
          type: "code",
          title: "--help (intgral)",
          lang: "text",
          code: `env-doctor -" Trouve les variables manquantes avant la prod.

USAGE
  env-doctor [options] [fichiers...]
  env-doctor init            Cre .envdoctorrc.json
  env-doctor baseline        Enregistre les cls autorises sans secret

OPTIONS
  --ci                     Mode silencieux : JSON sur stdout
  --format <fmt>           pretty | json | github (dfaut : pretty)
  --files <paths...>       Fichiers  comparer (1er = rfrence)
  --strict                 Traite les warnings comme des erreurs
  --no-secrets             Dsactive l'analyse de motifs de secrets
  --allow <glob>           Cl publique autorise (rptable)
  --ignore <KEY>           Cl exclue du rapport (rptable)
  --mask <mode>            full | partial | none (dfaut : partial)
  --lang <fr|en>           Langue (dfaut : fr)
  --no-color               Dsactive les couleurs
  -h, --help               Affiche cette aide
  -v, --version            Affiche la version

EXEMPLES
  env-doctor
  env-doctor --ci --format json | jq '.issues[] | select(.severity == "error")'
  env-doctor .env.example .env .env.production --strict
  env-doctor --ignore VITE_ANALYTICS_TOKEN --allow "NEXT_PUBLIC_*"

Codes retour : 0 OK  1 issues bloquantes  2 erreur technique
Scurit : aucune valeur complte n'est jamais affiche ni transmise.`,
        },
        {
          type: "table",
          headers: ["Situation", "Comportement", "Message"],
          rows: [
              ["Aucun fichier", "exit 0, aucune erreur", "- Aucun fichier .env* detecte (attendu : .env.example)"],
            ["Seulement .env", "analyse sans rfrence", "-- Pas de rfrence : la comparaison n'est pas possible"],
            ["Fichier lisible mais vide", "erreur logique", "-- .env.example est vide"],
            ["Encodage UTF-16 / BOM", "erreur technique", "-- Encodage non support. Enregistrez en UTF-8."],
            ["CI sans TTY", "couleurs dsactives, aucun prompt", "sortie JSON stable"],
            ["Windows CRLF", "parse normal, fin de ligne ignore", "aucune diffrence de comportement"],
            ["Secret allowlist", "omis du scan", "invisible, sauf --no-secrets --strict"],
          ],
        },
      ],
    },
    {
      id: "e-implementation",
      letter: "E",
      title: "Implmentation",
      subtitle: "Parseur pur, comparaison testable, sorties déterministes.",
      blocks: [
        {
          type: "code",
            title: "package.json - complet",
          lang: "json",
          code: `{
  "name": "devwell",
  "version": "0.1.0",
  "description": "Audit statique des fichiers .env : manquants, doublons, secrets.",
  "license": "MIT",
  "author": "Devwell contributors",
  "type": "module",
  "bin": { "env-doctor": "./dist/cli.js" },
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
    "execa": "^9.5.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}`,
        },
        {
          type: "code",
            title: "src/core/parseEnv.ts + compare.ts - complet",
          lang: "ts",
          code: `export type EnvEntry = { key: string; value: string; line: number };
export type ParsedEnv = { entries: EnvEntry[]; duplicates: string[] };

/** Parseur passif : ne touche jamais  process.env. */
export function parseEnv(source: string): ParsedEnv {
  const entries: EnvEntry[] = [];
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  source.split(/\\r?\\n/).forEach((raw, i) => {
    const line = raw.replace(/^\\uFEFF/, "").trim();
    if (!line || line.startsWith("#")) return;
    const match = /^(?:export\\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\\s*=\\s*(.*)$/.exec(line);
    if (!match) return;
    const [, key, rest] = match;
    const value = rest.replace(/\\s+#.*$/, "").replace(/^(['"])(.*)\\1$/, "$2");
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
    entries.push({ key, value, line: i + 1 });
  });

  return { entries, duplicates: [...duplicates] };
}

export type IssueCode =
  | "ENV_KEY_MISSING" | "ENV_KEY_ORPHAN" | "ENV_VALUE_EMPTY"
  | "ENV_DUPLICATE_KEY" | "ENV_SECRET_EXPOSED" | "ENV_KEY_INVALID";

export type Issue = {
  code: IssueCode;
  severity: "error" | "warning";
  file: string;
  key: string;
  message: string;
  preview?: string;
};

export function compareEnv(reference: ParsedEnv, target: ParsedEnv, file: string, refFile: string): Issue[] {
  const refKeys = new Map(reference.entries.map((e) => [e.key, e]));
  const targetKeys = new Map(target.entries.map((e) => [e.key, e]));
  const issues: Issue[] = [];

  for (const { key, line } of target.duplicates.map((k) => ({ key: k, line: 0 }))) {
    issues.push({ code: "ENV_DUPLICATE_KEY", severity: "error", file, key, message: "Cl dfinie plusieurs fois" });
  }
  for (const [key, entry] of refKeys) {
    if (!targetKeys.has(key)) {
      issues.push({
        code: "ENV_KEY_MISSING", severity: "error", file, key,
        message: "Prsente dans " + refFile + ", absente de " + file,
      });
    }
  }
  for (const [key, entry] of targetKeys) {
    if (!refKeys.has(key)) {
      issues.push({
        code: "ENV_KEY_ORPHAN", severity: "warning", file, key,
        message: "Prsente dans " + file + ", absente de " + refFile,
      });
    }
    if (!entry.value.trim()) {
      issues.push({ code: "ENV_VALUE_EMPTY", severity: "error", file, key, message: "Valeur vide" });
    }
  }
  return issues;
}`,
        },
        {
          type: "code",
            title: "src/core/secrets.ts - motifs et masquage",
          lang: "ts",
          code: `type SecretRule = { id: string; pattern: RegExp; severity: "error" | "warning" };

const RULES: SecretRule[] = [
  { id: "aws-access-key", pattern: /\\bAKIA[0-9A-Z]{16}\\b/, severity: "error" },
  { id: "github-token", pattern: /\\bgh[pous]_[A-Za-z0-9_]{20,}\\b/, severity: "error" },
  { id: "stripe-secret", pattern: /\\b[rs]k_live_[A-Za-z0-9]{16,}\\b/, severity: "error" },
  { id: "slack-token", pattern: /\\bxox[abp]-[A-Za-z0-9-]{10,}\\b/, severity: "warning" },
  { id: "google-api", pattern: /\\bAIza[0-9A-Za-z_-]{30,}\\b/, severity: "error" },
  { id: "private-key", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, severity: "error" },
  { id: "jwt", pattern: /\\beyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+/, severity: "warning" },
  // Le motif gnrique s'applique au NOM de la cl, pas  la valeur (voir scanSecrets).
];

export function mask(value: string, mode: "full" | "partial" | "none"): string {
  if (mode === "none") return value;
  if (mode === "full" || value.length <= 6) return "------------";
  return value.slice(0, 4) + "--".repeat(Math.min(8, value.length - 4));
}

export function scanSecrets(
  file: string,
  entries: { key: string; value: string; line: number }[],
  allow: RegExp[],
  mode: "full" | "partial" | "none",
) {
  const isPublic = (key: string) => allow.some((glob) => glob.test(key));
  return entries.flatMap(({ key, value, line }) => {
    if (!value || isPublic(key)) return [];
    const namedRule = RULES.find((rule) => rule.pattern.test(value)) ?? null;
    const genericRule: SecretRule | null =
      /^[A-Z0-9_]*(SECRET|TOKEN|PASSWORD|PRIVATE)[A-Z0-9_]*$/.test(key) && value.length >= 16
        ? { id: "generic-secret", pattern: /.*/, severity: "warning" }
        : null;
    const rule = namedRule ?? genericRule;
    if (!rule) return [];
    return [{
      code: "ENV_SECRET_EXPOSED" as const,
      severity: rule.severity,
      file, key, line,
      message: "Motif " + rule.id + " détect (ligne " + line + ")",
      preview: rule.id === "aws-access-key" ? value.slice(0, 4) + "------------" : mask(value, mode),
    }];
  });
}`,
        },
        {
          type: "code",
            title: ".envdoctorrc.json - configuration d'equipe",
          lang: "json",
          code: `{
  "reference": ".env.example",
  "compare": [".env", ".env.local", ".env.production"],
  "allow": ["VITE_*", "NEXT_PUBLIC_*", "PUBLIC_*"],
  "ignore": ["CI", "NODE_ENV"],
  "secretRules": { "disable": ["jwt"], "extra": [
    { "id": "internal-db", "pattern": "postgres://[^\\\\s]+", "severity": "error" }
  ]},
  "strict": false,
  "mask": "partial"
}`,
        },
        {
          type: "code",
          title: "Installation & intgration",
          lang: "bash",
          code: `# Depuis la racine du dépôt
npm install --global .

# Vérifier les variables sans exposer leurs valeurs
devwell env --files .env.example,.env --json`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Limites assumes du scan de secrets",
          text: "Un scanner par motifs produit des faux positifs et des faux ngatifs. La whitelist VITE_/NEXT_PUBLIC_ est active par dfaut, le motif gnrique est un warning, et aucun rapport n'est envoy sur le réseau. Les secrets confirms doivent tre rvoqus, pas seulement retirs du fichier.",
        },
      ],
    },
    {
      id: "f-tests",
      letter: "F",
      title: "Tests",
      subtitle: "Fixtures de fuite relle, zro secret dans les snapshots.",
      blocks: [
        {
          type: "code",
          title: "tests/unit/env-doctor.test.ts",
          lang: "ts",
          code: `import { describe, expect, it } from "vitest";
import { compareEnv, parseEnv } from "../../src/core/parseEnv.js";
import { mask, scanSecrets } from "../../src/core/secrets.js";

describe("parseEnv", () => {
  it("gre guillemets, export et commentaires", () => {
    const { entries } = parseEnv([
      "# app",
      "export API_URL=https://api.test",
      "TOKEN='abc123'",
      "EMPTY=",
      "WITH_HASH=foo # commentaire",
    ].join("\\n"));
    expect(entries.map((e) => [e.key, e.value])).toEqual([
      ["API_URL", "https://api.test"], ["TOKEN", "abc123"],
      ["EMPTY", ""], ["WITH_HASH", "foo"],
    ]);
  });

  it("détecte les doublons sans perdre aucune ligne", () => {
    const { entries, duplicates } = parseEnv("PORT=1\\nPORT=2\\n");
    expect(entries).toHaveLength(2);
    expect(duplicates).toEqual(["PORT"]);
  });

  it("ignore les lignes invalides", () => {
    expect(parseEnv("pas une variable\\n=x\\nVALID=1").entries).toHaveLength(1);
  });
});

describe("scanSecrets", () => {
  const mode = "partial" as const;
  it("détecte une cl AWS et ne rvle pas le secret complet", () => {
    const issues = scanSecrets(".env", [{ key: "AWS_ACCESS_KEY_ID", value: "AKIAIOSFODNN7EXAMPLE", line: 3 }], [], mode);
    expect(issues[0]).toMatchObject({ code: "ENV_SECRET_EXPOSED", severity: "error" });
    expect(JSON.stringify(issues)).not.toContain("AKIAIOSFODNN7EXAMPLE");
  });
  it("respecte la whitelist des cls publiques", () => {
    const issues = scanSecrets(".env", [{ key: "VITE_STRIPE", value: "sk_live_abcdefghijklmnop", line: 1 }], [/^VITE_/], mode);
    expect(issues).toEqual([]);
  });
  it("masque entirement en mode full", () => {
    expect(mask("supersecretvalue", "full")).toBe("------------");
  });
});

describe("compareEnv", () => {
  it("liste manquantes, orphelines et vides", () => {
    const ref = parseEnv("API_URL=\\nSTRIPE_KEY=\\n");
    const target = parseEnv("API_URL=\\nLEGACY=old\\n");
    const issues = compareEnv(ref, target, ".env", ".env.example");
    expect(issues.map((i) => i.code)).toEqual(["ENV_KEY_MISSING", "ENV_KEY_ORPHAN", "ENV_VALUE_EMPTY"]);
  });
});`,
        },
        {
          type: "code",
            title: "tests/integration/cli.test.ts - exit codes",
          lang: "ts",
          code: `import { execa } from "execa";
import { fileURLToPath } from "node:url";
const CLI = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));
const fixture = (name: string) => fileURLToPath(new URL("../fixtures/" + name, import.meta.url));

it("retourne 0 sur un environnement sain", async () => {
  const { stdout, exitCode } = await execa("node", [CLI, "--ci"], { cwd: fixture("clean") });
  expect(exitCode).toBe(0);
  expect(JSON.parse(stdout).ok).toBe(true);
});

it("retourne 1 et un JSON valide en cas de manquante", async () => {
  const run = await execa("node", [CLI, "--ci"], { cwd: fixture("missing-key"), reject: false });
  expect(run.exitCode).toBe(1);
  const report = JSON.parse(run.stdout);
  expect(report.issues[0].code).toBe("ENV_KEY_MISSING");
  expect(report.issues[0]).not.toHaveProperty("value");
});

it("ne fuit jamais un secret dans stdout/stderr", async () => {
  const run = await execa("node", [CLI, "--format", "json"], { cwd: fixture("aws-secret"), reject: false });
  expect(run.stdout + run.stderr).not.toMatch(/AKIAIOSFODNN7EXAMPLE/);
});

it("retourne 2 sur un fichier illisible", async () => {
  const run = await execa("node", [CLI, "--files", "/root/.env"], { reject: false });
  expect(run.exitCode).toBe(2);
});`,
        },
        {
          type: "table",
          headers: ["Fixture", "Contenu", "Attendu"],
          rows: [
            ["clean/", ".env = .env.example, valeurs valides", "exit 0, 0 issue"],
            ["missing-key/", "1 cl d'exemple absente", "exit 1, ENV_KEY_MISSING"],
            ["aws-secret/", "cl AKIA factice de test", "exit 1, masque, jamais en clair"],
            ["duplicates/", "PORT dfini deux fois", "exit 1, ENV_DUPLICATE_KEY"],
            ["allowlist/", "VITE_* + NEXT_PUBLIC_*", "exit 0, aucune alerte"],
            ["crlf/", "fins de ligne Windows", "comportement identique  LF"],
          ],
        },
        {
          type: "table",
          headers: ["Test manuel", "Commande", "Attendu"],
          rows: [
            ["Sans TTY", "env-doctor < /dev/null", "aucune couleur, none interaction"],
            ["GitHub Actions", "env-doctor --ci --format github", "annotations ::error, exit 1"],
            ["Valeurs publiques", "env-doctor --allow \"VITE_*\"", "0 faux positif"],
            ["Fichier protg", "env-doctor --files .env.locked", "exit 2 avec conseil de permission"],
            ["--mask none hors CI", "env-doctor --mask none", "valeurs visibles, avertissement affich"],
          ],
        },
        {
          type: "callout",
          tone: "success",
          title: "Couverture vise : -- 90 %",
          text: "Le module secrets.ts est  100 % exig : une rgle non teste est une rgle qu'on ne peut pas promettre. Les snapshots pretty n'incluent jamais de valeur brute ; un test ddi l'affirme.",
        },
        {
          type: "code",
          title: "Job CI (extrait du workflow)",
          lang: "yaml",
          code: `- run: npm run build
- run: npm test -- --coverage
- run: node dist/cli.js --ci --format json > env-report.json || true
- name: Bloque sur secrets exposés
  run: node dist/cli.js --ci --format json
  env: { NO_COLOR: "1" }`,
        },
      ],
    },
    {
      id: "g-documentation",
      letter: "G",
      title: "Documentation",
      subtitle: "Un README qui explique aussi ce que l'outil ne fait pas.",
      blocks: [
        { type: "badges", items: ["MIT", "zro réseau", "CI 3 OS", "npm devwell", "v0.1.0"] },
        {
          type: "code",
            title: "README.md - extrait publie",
          lang: "md",
          code: `# env-doctor

> Trouve les variables manquantes et les secrets exposés avant la prod.

## Installation (20 s)

    npm install --global .
    devwell env

prérequis : Node 18.17+. Aucun accs réseau n'est effectu.

## Ce qu'il vrifie

- cls prsentes dans .env.example mais absentes de .env
- cls orphelines, vides, dupliques ou mal nommes
- motifs de secrets connus : AWS, GitHub, Stripe, Slack, Google,
  JWT, cl prive PEM et motif gnrique SECRET/TOKEN/PASSWORD

## Usage

    env-doctor                          # audit color local
    env-doctor --ci                     # JSON pour la CI
    env-doctor --format github          # annotations de PR
    env-doctor .env.example .env.production

## Sortie et codes retour

0 = OK  1 = issue bloquante  2 = erreur technique.
En --ci, stdout ne contient que du JSON parseable.

## Configuration

~~~json
{
  "reference": ".env.example",
  "compare": [".env", ".env.production"],
  "allow": ["VITE_*", "NEXT_PUBLIC_*"]
}
~~~

## Scurit

Les valeurs ne sont jamais affiches en clair (masquage partiel
par dfaut), jamais exécutées, jamais envoyes sur le réseau.
Un secret détect doit tre rvoqu, pas seulement supprim.

## FAQ

**Pourquoi VITE_* est ignor ?** Les cls VITE_ sont publiques par
conception ct client. Retirez-les de la whitelist si ce n'est pas
votre cas.
**La CI échoue sur une orpheline.** Utilisez --strict uniquement si
vous avez dcid de tout bloquer, sinon --ignore KEY.
**Et .env.production ?** Jamais ncessaires en local : ne le commitez
pas, comparez uniquement sa structure.

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
- Comparaison .env / .env.example / .env.production
- détection cls manquantes, orphelines, vides, doublons, invalides
- détection de 8 familles de secrets avec masquage
- Mode --ci JSON stable (schemaVersion 1) et format github
- Whitelist --allow pour les cls publiques
- Fichier de configuration .envdoctorrc.json

### Security
- Aucun chargement des valeurs dans process.env
- Aucune sortie réseau
- Test garantissant l'absence de secret brut dans stdout/stderr

### Known limitations
- Pas d'analyse de l'historique git (v1.2)
- Le motif gnrique produit des warnings  qualifier`,
        },
        {
          type: "list",
          items: [
            "Guide de contribution : toute nouvelle rgle de secret doit venir avec un test positif ET un test ngatif.",
            "Dmo asciinema : détection d'une cl AWS, correction, relance verte (script dans demo/env-doctor.sh).",
            "Page GitHub Security advisory pour signaler un contournement du scanner.",
            "Documentation des codes de sortie dans docs/EXIT_CODES.md, partage par les quatre outils.",
          ],
        },
      ],
    },
    {
      id: "h-livraison",
      letter: "H",
      title: "Livraison",
      subtitle: "Scurit d'abord, adoption ensuite.",
      blocks: [
        {
          type: "check",
          title: "Checklist de release",
          items: [
            { label: "Fixtures sans secret rel (cls factices, jamais de production)", done: true },
            { label: "Test de non-fuite stdout/stderr vert", done: true },
            { label: "Couverture secrets.ts  100 %", done: true },
            { label: "README scurit relu (masquage, rvocation)", done: true },
            { label: "npm publish --provenance + tag sign v0.1.0", done: true },
            { label: "Ajout de la commande au template de CI d'quipe" },
            { label: "Notification Slack + atelier de 15 min en quipe" },
          ],
        },
        {
          type: "code",
          title: "Message Slack de lancement",
          lang: "text",
          code: `:shield: env-doctor v0.1.0 est prt

Le check qui aurait vit notre dernier -" a marche pas chez moi -".
  devwell env

Il compare .env et .env.example, signale les doublons,
les valeurs vides et les secrets exposés (AWS, GitHub, Stripe--).
-- Aucune valeur n'est affiche en clair.

CI :  env-doctor --ci --format json
Svre :  --strict (warnings bloquants)

On l'ajoute au template de CI vendredi 15 min ? Rpondez :+1:.
Un secret détect =  révoquer, pas juste  supprimer du fichier.`,
        },
        {
          type: "table",
          headers: ["Version", "Contenu", "Critre"],
          rows: [
            ["v0.1.0", "Audit statique, JSON, whitelist, 8 motifs", "Adoption sur 3 dpts"],
            ["v1.0.0", "Schma de sortie stable, rgles configurables par JSON Schema, baseline signe", "Contrat de sortie Fig + revue scurit"],
            ["v1.2.0", "Scan de l'historique git + détection .env versionn", "Temps < 2 s sur 10 000 commits"],
            ["v2.0.0", "Validation de typage optionnelle (zod/pydantic), suggestions de valeurs", "Aucune valeur envoye hors machine"],
          ],
        },
      ],
    },
  ],
};
