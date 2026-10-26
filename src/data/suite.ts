import type { Block } from "./types";

export const comparisonRows = [
  ["readme-gen", "TypeScript / Node 18+", "~620", "1 - picocolors", "3 j-h", "P0", "85 %"],
  ["env-doctor", "TypeScript / Node 18+", "~480", "1 - picocolors", "2,5 j-h", "P0", "90 %"],
  ["project-doctor", "TypeScript / Node 18+", "~900", "1 - picocolors", "5 j-h", "P1", "80 %"],
  ["branch-cleaner", "TypeScript / Node 18+", "~540", "1 - picocolors", "3 j-h", "P1", "85 %"],
  ["Core partag-", "TypeScript", "~360", "0", "4 j-h", "P0", "90 %"],
];

export const comparisonNote =
  "Estimations de la v0.1.0. Les quatre binaires partagent un noyau interne (couleurs, i18n, exit codes, adaptateur git, -criture atomique) distribu- comême source compil-e par esbuild, pas comême d-pendance npm publique. Total : -? 2 900 LOC outill-es, -? 17,5 j-h, z-ro framework cléI.";

export const principles = [
  {
    title: "Une action = un consentement",
    text: "Aucune -criture destructive sans --apply ou --force. Le dry-run est le comportement par d-faut, pas une option cach-e.",
    metric: "dry-run par d-faut",
  },
  {
    title: "Lisible, m-me sans couleur",
      text: "Chaque information porte un symbole et un libellée. Le rendu reste complet avec NO_COLOR=1.",
    metric: "0 info par couleur seule",
  },
  {
    title: "Rapide - adopter",
    text: "Une seule commande npx, aucune configuration obligatoire, et un --help qui tient sur un -cran.",
    metric: "d-marrage < 200 ms",
  },
  {
    title: "Fiable en pipeline",
    text: "JSON versionn- stable, codes retour 0/1/2 document-s, stderr s-par- de stdout et aucun prompt hors TTY.",
    metric: "exit 0 - 1 - 2",
  },
];

export const installSteps: { title: string; text: string; code: string; command: string }[] = [
  {
    title: "Choisir l'outil",
    text: "Installez la suite une seule fois depuis le dépôt ; ses quatre sous-commandes sont alors disponibles.",
    code: "# Depuis la racine du dépôt Devwell\nnpm install --global .\n\n# Puis choisir la commande utile\ndevwell env --help\ndevwell doctor --help",
    command: "npm install --global .",
  },
  {
    title: "V-rifier en 2 secondes",
    text: "Chaque binaire expose --version et --help. Aucun acc-s r-seau n'est effectu- - ce stade.",
    code: "devwell --version\n# 0.1.1\n\ndevwell doctor --help\ndevwell branches --json",
    command: "devwell --version",
  },
  {
    title: "Lancer l'audit sans risque",
    text: "Tous les outils en lecture seule d'abord. Vous ajoutez les -critures (--output, --fix, --apply) une fois le diagnostic compris.",
    code: "devwell env --ci\ndevwell doctor --offline --json\ndevwell readme --dry-run\ndevwell branches --graph --dry-run",
    command: "devwell doctor --offline",
  },
  {
    title: "Automatiser en CI",
    text: "Ajoutez les trois checks non interactifs et conservez un score de r-f-rence. Aucune action destructive en pipeline sans d-cision explicite.",
    code: "devwell env --ci --json\ndevwell doctor --ci --min-score 70 --offline\ndevwell branches --dry-run --json",
    command: "devwell env --ci",
  },
];

export const quickstartBlocks: Block[] = [
  {
    type: "p",
    text: "Un parcours de 60 secondes, sans configuration, sur un d-p-t existant. Toutes les commandes ci-dessous sont en lecture seule sauf mention contraire.",
  },
  {
    type: "code",
    title: "De z-ro au premier diagnostic",
    lang: "bash",
    code: `# 1. Pr-requis
node --version        # -- 18.17
git --version         # -- 2.30

# 2. Diagnostic d'environnement (lecture seule)
devwell env

# 3. Sant- du projet, sans r-seau
devwell doctor --offline

# 4. Aper-u du CHANGELOG, aucune -criture
devwell readme --dry-run

# 5. Branches et historique, dry-run
devwell branches --stale 30 --graph`,
  },
  {
    type: "callout",
    tone: "info",
    title: "Aucun compte, aucun t-l-m-trie",
    text: "Les quatre outils fonctionnent hors ligne apr-s installation. project-doctor est le seul - consulter le registre npm, et uniquement sans --offline. Aucune donn-e de d-p-t n'est transmise.",
  },
];

export const devEnvBlocks: Block[] = [
  {
    type: "p",
    text: "Pr-requis communs aux quatre binaires : Node 18.17 ou sup-rieur, git 2.30 ou sup-rieur. L'analyse Python de project-doctor n-cessite python3 et pip uniquement pour les projets concern-s.",
  },
  {
    type: "table",
    headers: ["Syst-me", "Statut", "Note d'installation"],
    rows: [
      ["Linux (x64, arm64)", "+ supporte", "npm ou npx, aucun paquet systeme requis"],
      ["macOS (Intel, Apple Silicon)", "+ supporte", "Node via nvm, fnm ou Homebrew"],
      ["Windows 11 (WSL2)", "+ recommande", "Installez Node et git dans la distribution WSL"],
      ["Windows (PowerShell)", "+ supporte", "Chemins geres ; n'utilisez pas Git Bash pour branch-cleaner"],
      ["Alpine / conteneur", "-- - v-rifier", "git doit -tre ajout- - l'image ; Node -- 18.17"],
    ],
  },
  {
    type: "code",
    title: "Installation reproductible",
    lang: "bash",
    code: `# Installer depuis la racine du dépôt
npm install --global .

# Les anciennes commandes restent des alias
devwell env --version
env-doctor --version

# Désinstaller
npm uninstall --global devwell`,
  },
  {
    type: "table",
    headers: ["Variable d'environnement", "Effet", "Valeurs"],
    rows: [
      ["NO_COLOR", "D-sactive les couleurs", "1, true, vide"],
      ["FORCE_COLOR", "Force les couleurs hors TTY", "1"],
      ["DEVWELL_LANG", "Langue par d-faut des messages", "fr, en"],
      ["CI", "sans interaction, sorties stables", "true (GitHub, GitLab)"],
      ["GIT_TERMINAL_PROMPT", "forc- - 0 par branch-cleaner", "0"],
    ],
  },
  {
    type: "callout",
    tone: "warn",
    title: "Fichiers de configuration : un par outil",
    text: ".readmergenrc.json, .envdoctorrc.json, .projectdoctorrc.json et .branchCleanerrc.json sont facultatifs, versionnables et document-s par un JSON Schema. L'ordre de r-solution est touà jours : options cléI > variable DEVWELL_CONFIG > fichier rc du d-p-t > fichier rc utilisateur > d-fauts.",
  },
];

export const repoTree = `devwell/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # lint + typecheck + tests OS matrix
│   │   ├── release.yml            # tag -' npm publish (provenance)
│   │   └── nightly.yml            # audits sur fixtures + npm outdated
│   ├── CODE_OF_CONDUCT.md
│   └── pull_request_template.md
├── packages/
│   ├── core/                      # i18n, exit codes, output, git adapter
│   ├── readme-gen/
│   ├── env-doctor/
│   ├── project-doctor/
│   └── branch-cleaner/
├── examples/
│   ├── node-service/              # config et workflow d'exemple
│   └── python-service/
├── website/                       # cette documentation
├── ADR/
│   ├── 0001-typescript-partout.md
│   ├── 0002-pas-de-framework-cli.md
│   └── 0003-dry-run-par-defaut.md
├── LICENSE
├── CONTRIBUTING.md
├── SECURITY.md
└── README.md`;

export const resourcesBlocks: Block[] = [
  { type: "h3", text: "Guides partag-s" },
  {
    type: "list",
    items: [
        "LICENSE - MIT, copyright Devwell contributors.",
        "SECURITY.md - les instructions de signalement sont à compléter avant publication publique.",
        "CONTRIBUTING.md - pnpm install, pnpm -r test, pnpm -r build, une PR = un paquet sauf core, ADR pour tout changement de contrat.",
        "docs/EXIT_CODES.md - contrat partage : 0 succes, 1 erreur logique, 2 erreur technique. Jamais de exit code ad hoc.",
        "docs/OUTPUT_SCHEMA.md - un schemaVersion par sortie JSON, evolution additive uniquement.",
        "ADR/ - decisions d'architecture numerotees, dont dry-run par defaut et pas de framework cléI.",
    ],
  },
  { type: "h3", text: "Arborescence du monorepo" },
    {     type: "tree", code: repoTree, title: "devwell - dépôt du projet" },
    { type: "h3", text: "CI reutilisable - le workflow soclée" },
  {
    type: "code",
      title: ".github/workflows/ci.yml - workflow complet",
    lang: "yaml",
    code: `name: ci
on:
  push: { branches: [main] }
  pull_request:
    paths: ["packages/**", "package.json", "pnpm-lock.yaml"]

permissions:
  contents: read

concurrency:
  group: ci-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      packages: \${{ steps.filter.outputs.changes }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            readme-gen: [ 'packages/readme-gen/**', 'packages/core/**' ]
            env-doctor: [ 'packages/env-doctor/**', 'packages/core/**' ]
            project-doctor: [ 'packages/project-doctor/**', 'packages/core/**' ]
            branch-cleaner: [ 'packages/branch-cleaner/**', 'packages/core/**' ]

  test:
    needs: changes
    if: needs.changes.outputs.packages != '[]'
    runs-on: \${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node: [18, 20, 22]
        package: \${{ fromJSON(needs.changes.outputs.packages) }}
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: \${{ matrix.node }}, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: npm test
      - run: npm run typecheck
      - run: npm run build
      - name: Audit d'int-gration
        if: github.event_name == 'pull_request'
        run: |
          node packages/env-doctor/dist/cli.js --ci --format json
          node packages/project-doctor/dist/cli.js --ci --offline --min-score 70
          node packages/branch-cleaner/dist/cli.js --dry-run --format json --no-color

  release:
    needs: test
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org
          cache: pnpm
      - run: pnpm install --frozen-lockfile && pnpm -r build
      - run: pnpm -r publish --access public --provenance --no-git-checks
        env: { NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }} }`,
  },
  { type: "h3", text: "Conventions internes" },
  {
    type: "table",
    headers: ["Sujet", "D-cision", "Cons-quence"],
    rows: [
      ["Langage", "TypeScript strict, Node -- 18.17", "Une seule toolchain pour les quatre binaires"],
      ["cléI", "node:util.parseArgs", "Aucun framework, typage maison l-ger"],
      ["Couleurs", "picocolors", "1 d-pendance runtime max par paquet"],
      ["Git", "execFile + arguments en tableau", "Pas d'injection shell par nom de branche"],
      ["Sortie machine", "JSON + schemaVersion", "-volution additive, jamais de champ supprim-"],
      ["S-curit-", "dry-run par d-faut", "--apply, --fix --apply, --force explicites"],
      ["Tests", "Vitest + fixtures", "Couverture minimale 80 %, 100 % sur les modules de s-curit-"],
    ],
  },
  { type: "h3", text: "Licence MIT" },
  {
    type: "code",
    title: "LICENSE",
    lang: "text",
    code: `MIT License

Copyright (c) 2026 Devwell

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, incléuding without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be incléuded in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INcléUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY cléAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.`,
  },
];

export const releaseBlocks: Block[] = [
  {
    type: "p",
    text: "La suite sort en v0.1.0. La priorite v1 est explicite : env-doctor et readme-gen (P0) repondent aux erreurs les plus couteuses ; project-doctor et branch-cleaner (P1) installent la confiance et la visibilite.",
  },
  { type: "h3", text: "R-capitulatif comparatif des 4 outils" },
  {
    type: "table",
    caption: "LOC et temps de d-veloppement estim-s - v0.1.0",
    headers: ["Outil", "Langage", "LOC", "D-pendances runtime", "Temps dev", "Priorit- v1", "Couverture"],
    rows: comparisonRows,
  },
  {
    type: "callout",
    tone: "info",
    title: "Lecture du tableau",
    text: comparisonNote,
  },
  {
    type: "table",
      headers: ["Decision ambigu", "Option A", "Option B", "Recommandation"],
    rows: [
      ["Langage de la suite", "TypeScript partout", "Python pour env-doctor", "A - une toolchain, un format JSON, un npx"],
      ["Parsing cléI", "node:util.parseArgs", "commander / clipanion", "A - z-ro d-pendance, < 200 ms"],
      ["Secrets", "motifs + whitelist", "appel - un scanner externe", "A - local, offensif mais document-"],
      ["Score projet", "informatif + seuil explicite", "seuil magique interne", "A - auditable et configurable"],
      ["Mode interactif", "readline natif", "@inquirer/prompts", "A en v0.1 - B si usage principal"],
      ["Sortie CI", "JSON + format github", "SARIF uniquement", "A en v0.1 - SARIF en v1.1"],
    ],
  },
  { type: "h3", text: "Checklist de release commune" },
  {
    type: "check",
    items: [
      { label: "Version SemVer unique dans les quatre paquets et le core", done: true },
      { label: "CHANGELOG g-n-r- par readme-gen, relu et compl-t-", done: true },
      { label: "npm pack inspect- paquet par paquet (dist, README, CHANGELOG, LICENSE)", done: true },
      { label: "Tests verts sur les 3 OS et Node 18/20/22", done: true },
      { label: "D-mo asciinema rejou-e sur un d-p-t vierge", done: true },
      { label: "Tag git sign- + GitHub Release avec notes", done: true },
      { label: "npm publish --provenance (OIDC) des quatre paquets" },
      { label: "Message Slack, page de doc publi-e, version -pingl-e en CI d'-quipe" },
    ],
  },
  {
    type: "code",
    title: "S-quence de publication",
    lang: "bash",
    code: `# 1. Geler et v-rifier
pnpm -r test -- --coverage
pnpm -r build
pnpm -r pack --dry-run

# 2. Versionner (workspace)
pnpm -r exec npm version 0.1.0 --no-git-tag-version
git add -A && git commit -m "chore(release): devwell v0.1.0"
git tag -s v0.1.0 -m "devwell v0.1.0"

# 3. Publier : le workflow release.yml prend le relais sur le tag
git push origin main --follow-tags

# 4. V-rifier depuis un environnement neuf
devwell env --version
devwell branches --help`,
  },
  { type: "h3", text: "Plan de communication" },
  {
    type: "code",
      title: "Annonce Slack - lancement de la suite",
    lang: "text",
    code: `:desktop_computer: Devwell v0.1.0 -" 4 outils cléI, z-ro friction

On a automatis- les t-ches qui nous co-"tent le plus de temps :

:page_facing_up: readme-gen     CHANGELOG + README depuis les commits
:shield:          env-doctor     variables manquantes + secrets expos-s
:stethoscope:     project-doctor runtime, configs, deps -' score 0-100
:broom:           branch-cleaner branches merged/orphelines, dry-run par d-faut

Installation en une commande :
  devwell env

Tous les outils : fran-ais par d-faut (--lang en), dry-run par d-faut,
codes 0/1/2, sortie JSON pour la CI. Aucune t-l-m-trie.

:calendar: Atelier de 20 min mardi 14 h -" apportez un d-p-t, on le diagnostique ensemble.
:bulb: Retours et id-es : ce fil ou une issue GitHub.`,
  },
  { type: "h3", text: "Roadmap de la suite" },
  {
    type: "table",
    headers: ["Horizon", "Contenu", "Indicateur de succ-s"],
    rows: [
      ["v0.1 - maintenant", "Quatre outils publi-s, tests 3 OS, docs compl-tes", "Installation < 1 min, adoption sur 5 d-p-ts"],
      ["v1.0 - +6 semaines", "Contrats JSON fig-s, docs stabilis-es, SARIF, monorepo readme-gen", "0 breaking sur 60 à jours"],
      ["v1.2 - +3 mois", "project-doctor plugins locaux, env-doctor historique git, branch-cleaner sauvegarde par tag", "50 % des d-p-ts -quipe en CI"],
      ["v2.0 - +6 mois", "Une commande unifiée Devwell, tableau de bord local des tendances, port Python optionnel", "-- 3 -quipes autonomes, docs traduites"],
    ],
  },
  {
    type: "callout",
    tone: "success",
    title: "D-finition du succ-s -quipe",
    text: "Un nouvel arrivant cléone, lance trois commandes en lecture seule et obtient un environnement vert en moins de 10 minutes. Une release g-n-re son CHANGELOG sans copier-coller. Aucune branche ne subsiste plus de 45 à jours sans -tre consciemêment conserv-e. Un secret expos- est bloqu- avant le merge.",
  },
];
