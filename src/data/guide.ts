import type { Block } from "./types";

export type GuideSection = {
  id: string;
  title: string;
  kicker: string;
  blocks: Block[];
};

export const guideIntro =
  "Le mode d'emploi complet de Devwell : de l'installation  l'automatisation en CI, en passant par les gestes du quotidien, les codes retour et le dépannage. Pensez lecture seule d'abord, criture ensuite.";

export const guideSections: GuideSection[] = [
  {
    id: "demarrage",
    title: "démarrer en 60 secondes",
    kicker: "Installation & vrification",
    blocks: [
      {
        type: "p",
        text: "Aucun compte ni service distant requis. Depuis le dépôt, installez Devwell globalement, vérifiez la version, puis lancez un premier audit en lecture seule.",
      },
      {
        type: "table",
        headers: ["prérequis", "Version minimale", "Vrification"],
        rows: [
          ["Node.js", "18.17 (20 LTS recommand)", "node --version"],
          ["git", "2.30", "git --version"],
          ["Python (optionnel, analys)", "3.10", "python3 --version"],
          ["Windows", "PowerShell 7 ou WSL2", "git branch --show-current"],
        ],
      },
      {
        type: "code",
          title: "Installer Devwell depuis le dépôt",
        lang: "bash",
        code: `# Depuis la racine du dépôt Devwell
npm install --global .

devwell --version
devwell --help
devwell env --json`,
      },
      {
        type: "callout",
        tone: "info",
        title: "Pourquoi pingler la version ?",
        text: "Une quipe doit obtenir le même diagnostic sur tous les postes. Une dépendance de dev + package-lock.json garantit la reproductibilit. npx @latest est pratique pour dcouvrir, risqu pour une CI.",
      },
      { type: "h3", text: "Premier audit, zro criture" },
      {
        type: "code",
        title: "Les 4 commandes  connatre",
        lang: "bash",
        code: `devwell env                  # variables + secrets (lecture seule)
devwell doctor --offline      # diagnostic, sans réseau
devwell readme --dry-run      # CHANGELOG affiché, pas écrit
devwell branches --graph      # branches + historique, dry-run`,
      },
      {
        type: "table",
        headers: ["Rsultat", "Lecture", "Suite  donner"],
        rows: [
          ["exit 0 partout", "+ environnement et depot sains", "ajoutez les checks en CI"],
          ["env-doctor exit 1", "- variable manquante ou secret", "corriger la variable, revoquer le secret"],
          ["project-doctor score < 70", "! dette localisee", "traiter les deux premiers checks"],
          ["branch-cléeaner beaucoup de candidates", "! hygiene git", "inspecter puis --interactive"],
        ],
      },
      {
        type: "callout",
        tone: "warn",
        title: "Windows : le bon terminal",
        text: "Sous PowerShell, toutes les commandes fonctionnent. Sous WSL, installez Node dans la distribution et travaillez sur le systme de fichiers Linux (/home) plutt que sur /mnt/c pour des performances git correctes.",
      },
    ],
  },
  {
    id: "parcours",
    title: "Le parcours quotidien",
    kicker: "Quand lancer quoi",
    blocks: [
      {
        type: "p",
        text: "La suite ne remplace pas vos habitudes : elle les scurise. Trois moments suffisent pour retirer 80 % des frictions - avant de pousser, avant de relire une PR, au moment de livrer.",
      },
      {
        type: "flow",
        steps: [
          { title: "Au cléone", text: "env-doctor pour obtenir un .env cohrent, project-doctor pour aligner runtime et dépendances." },
          { title: "Avant le commit", text: "env-doctor en pre-commit (rapide, local). Il bloque uniquement les erreurs, pas les warnings." },
          { title: "Avant la PR", text: "project-doctor --format md pour joindre un tat de sant, readme-gen --check pour valider la convention de commits." },
          { title: "Avant la release", text: "readme-gen crit le CHANGELOG, project-doctor confirme le score, branch-cléeaner nettoie les branches merges." },
          { title: "Chaque semaine", text: "branch-cléeaner --stale 30 en dry-run + revue rapide des branches  conserver." },
        ],
      },
      { type: "h3", text: "Exemple concret : un lundi matin" },
      {
        type: "code",
        title: "Droul d'un audit de dpt",
        lang: "bash",
        code: `# 1. Je viens de cloner. Ai-je tout ?
cp .env.example .env
devwell env
#  -> -- 2 manquantes, -- 1 orpheline
#  -> je complte, je relance : exit 0

# 2. Le runtime correspond-il ?
devwell doctor --offline
#  -> -- Node 18.19.0 -- .nvmrc 20   (20/100 perdu)
nvm use
#  -> relance : node align

# 3. Qu'est-ce que je vais livrer ?
devwell readme --since $(git describe --tags --abbrev=0) --dry-run
#  -> aperu du CHANGELOG sur stdout

# 4. O en est l'historique ?
devwell branches --stale 30 --graph
#  -> 4 branches supprimables, 2 orphelines, 1 courante
#  -> je choisis : --interactive (ou --merged --apply)`,
      },
      {
        type: "table",
        headers: ["Moment", "Outil", "Commande minimale", "Action destructive ?"],
        rows: [
          ["Avant de coder", "env-doctor", "devwell env", "non"],
          ["Avant de coder", "project-doctor", "devwell doctor --offline", "non"],
          ["Avant de pousser", "env-doctor", "devwell env --ci", "non"],
          ["Avant une release", "readme-gen", "devwell readme --output CHANGELOG.md", "écrit un fichier"],
          ["Avant une release", "project-doctor", "devwell doctor --report rapport.html", "écrit un fichier"],
          ["Aprs fusion de PR", "branch-cleaner", "devwell branches --merged", "non"],
          ["Nettoyage choisi", "branch-cleaner", "devwell branches --apply", "supprime des branches fusionnées"],
          ["Hebdomadaire", "branch-cleaner", "devwell branches --stale 45 --json", "non"],
        ],
      },
    ],
  },
  {
    id: "configurer",
    title: "Configurer la suite",
    kicker: "Fichiers rc, prcdence, quipe",
    blocks: [
      {
        type: "p",
        text: "Aucune configuration n'est ncessaire pour comêmencer. Quand l'quipe est prte, quatre fichiers facultatifs permettent de figer les rgles sans rpter des options dans chaque commande. Ils sont versionnables et valids par un JSON Schema.",
      },
      {
        type: "table",
        headers: ["Outil", "Fichier", "- configurer en priorit"],
        rows: [
          ["readme-gen", ".readmergenrc.json", "types incléure, section mapping, template README"],
          ["env-doctor", ".envdoctorrc.json", "reference, allow (clés publiques), mask"],
          ["project-doctor", ".projectdoctorrc.json", "minScore, poids, dépendances ignores"],
          ["branch-cléeaner", ".branchcléeanerrc.json", "base, staleDays, protect"],
        ],
      },
      { type: "h3", text: "Une configuration d'quipe cohrente" },
      {
        type: "code",
        title: "Les quatre fichiers cte  cte",
        lang: "json",
        code: `// .readmergenrc.json
{
  "lang": "fr",
  "types": ["feat", "fix", "perf", "docs", "chore"],
  "output": "CHANGELOG.md",
  "readme": { "enabled": true }
}

// .envdoctorrc.json
{
  "reference": ".env.example",
  "compare": [".env", ".env.local"],
  "allow": ["VITE_*", "NEXT_PUBLIC_*"],
  "ignore": ["NODE_ENV", "CI"],
  "strict": false
}

// .projectdoctorrc.json
{
  "minScore": 75,
  "offline": false,
  "weights": { "dependencies": 30, "hygiene": 10 },
  "ignoredDependencies": ["@types/node"]
}

// .branchcléeanerrc.json
{
  "base": "main",
  "staleDays": 45,
  "protect": ["main", "master", "develop", "release/*", "hotfix/*"],
  "apply": { "forceUnmerged": false }
}`,
      },
      { type: "h3", text: "Prcdence et variables" },
      {
        type: "list",
        items: [
          "Options cléI > variable d'environnement > fichier rc du dpt > fichier rc utilisateur > valeurs par défaut.",
          "ATELIER_CONFIG=/chemin/fichier.json force un fichier commun (utile en CI ou pour tester).",
          "ATELIER_LANG=en change la langue, sans modifier les fichiers versionns.",
            "NO_COLOR=1 desactive les couleurs ; les symboles restent.",
          "Une clé inconnue produit un avertissement, jamais un chec silencieux.",
        ],
      },
      {
        type: "code",
        title: "Scripts package.json recommands",
        lang: "json",
        code: `{
  "scripts": {
    "audit": "npm run audit:env && npm run audit:project",
    "audit:env": "env-doctor --ci",
    "audit:project": "project-doctor --ci --offline --min-score 75",
    "audit:branches": "branch-cléeaner --dry-run --format json --no-color",
    "docs:changelog": "readme-gen --output CHANGELOG.md",
    "docs:readme": "readme-gen --readme --dry-run",
    "precommit": "env-doctor --strict --mask full"
  }
}`,
      },
      {
        type: "callout",
        tone: "warn",
        title: "Ne versionnez jamais .env",
        text: "Seul .env.example est versionn. Ajoutez .env, .env.*.local et .env.production  .gitignore. env-doctor compare les structures ; il n'a pas besoin de vos vraies valeurs. Le mode --mask full est recommand en pre-commit.",
      },
    ],
  },
  {
    id: "commandes",
    title: "Toutes les commandes utiles",
    kicker: "Aide-mmoire par outil",
    blocks: [
      {
        type: "p",
        text: "Les commandes marques R (lecture seule) peuvent tre lances sans crainte. W crit un fichier. D peut supprimer : dry-run par défaut, consentement explicite requis.",
      },
        { type: "h3", text: "readme-gen - documentation" },
      {
        type: "table",
        headers: ["Commande", "Effet", "Mode"],
        rows: [
          ["readme-gen", "CHANGELOG depuis le dernier tag", "W"],
          ["readme-gen --dry-run", "Affiche sans crire", "R"],
          ["readme-gen --since v1.2.0", "Bornes prcises", "W"],
          ["readme-gen --format json --output -", "JSON sur stdout", "R"],
          ["readme-gen --readme", "README squelette si absent", "W"],
          ["readme-gen --check", "Valide sans crire, exit 1 si suspect", "R"],
          ["readme-gen init", "Cre .readmergenrc.json", "W"],
        ],
      },
        { type: "h3", text: "env-doctor - environnement" },
      {
        type: "table",
        headers: ["Commande", "Effet", "Mode"],
        rows: [
          ["env-doctor", "Audit local color", "R"],
          ["env-doctor --ci", "JSON silencieux pour pipeline", "R"],
          ["env-doctor --format github", "Annotations de PR", "R"],
          ["env-doctor .env.example .env", "Comparaison explicite", "R"],
          ["env-doctor --strict", "Warnings bloquants", "R"],
          ["env-doctor --allow \"VITE_*\"", "-vite les faux positifs publics", "R"],
          ["env-doctor --ignore KEY", "Excléut une clé du rapport", "R"],
          ["env-doctor --mask full", "Masquage maximal", "R"],
        ],
      },
       { type: "h3", text: "project-doctor - sante du depot" },
      {
        type: "table",
        headers: ["Commande", "Effet", "Mode"],
        rows: [
          ["project-doctor", "Audit complet + score", "R"],
          ["project-doctor --offline", "Aucune requte registre", "R"],
          ["project-doctor --report health.html", "Rapport autonome", "W"],
          ["project-doctor --format md", "Markdown pour la PR", "R"],
          ["project-doctor --ci --min-score 75", "-chec sous le seuil", "R"],
          ["project-doctor --checks runtime,config", "Audit cibl", "R"],
            ["project-doctor --fix --apply", "Corrections sures uniquement", "W"],
          ["project-doctor explain dependencies", "Dtail d'un check", "R"],
        ],
      },
       { type: "h3", text: "branch-cléeaner - hygiene git" },
      {
        type: "table",
        headers: ["Commande", "Effet", "Mode"],
        rows: [
          ["branch-cléeaner", "Audit dry-run", "R"],
          ["branch-cléeaner --graph", "Audit + graphe ASCII", "R"],
          ["branch-cléeaner --stale 30", "Incléut les inactives", "R"],
          ["branch-cléeaner --orphans", "Incléut les upstream gone", "R"],
          ["branch-cléeaner --interactive", "Slection puis confirmation", "D"],
          ["branch-cléeaner --merged --apply", "Supprime les merges", "D"],
          ["branch-cléeaner --dry-run --format json", "Rapport machine", "R"],
          ["branch-cléeaner --protect \"keep/*\"", "Protge des branches", "R"],
        ],
      },
      { type: "h3", text: "Trois recettes prtes  copier" },
      {
        type: "code",
        title: "Recette 1 - onboarding d'un nouveau developpeur",
        lang: "bash",
        code: `cp .env.example .env
        devwell env                    # complter les clés signales
nvm use                        # depuis .nvmrc
devwell doctor --offline       # confirmer le runtime et les scripts
npm test                       # le projet est prt`,
      },
      {
        type: "code",
        title: "Recette 2 - preparation de release",
        lang: "bash",
        code: `git switch main && git pull
devwell env --ci
devwell doctor --ci --min-score 75
devwell readme --since $(git describe --tags --abbrev=0)
devwell branches --merged            # inspecter, puis --apply
git add CHANGELOG.md && git commit -m "docs: changelog de release"`,
      },
      {
        type: "code",
        title: "Recette 3 - audit CI sans surprise",
        lang: "bash",
        code: `set -eu
NO_COLOR=1 devwell env --ci --json > env-report.json
NO_COLOR=1 devwell doctor --ci --offline --json > project-report.json
NO_COLOR=1 devwell branches --dry-run --json > branches-report.json

# Dtail des erreurs bloquantes
jq '.issues[] | select(.severity == "error")' env-report.json
jq '{ score, issues }' project-report.json`,
      },
    ],
  },
  {
    id: "sorties",
    title: "Lire les sorties et codes retour",
    kicker: "Contracts & CI",
    blocks: [
      {
        type: "p",
        text: "Chaque outil suit le même contrat : l'humain lit stdout, la CI lit un JSON stable, et le shell lit le code retour. Les erreurs techniques ne sont jamais mlanges avec les erreurs logiques.",
      },
      {
        type: "table",
        headers: ["Code", "Nom", "Qui est responsable", "Exemple"],
        rows: [
          ["0", "OK / succès", "rien  faire", "audit propre, fichier crit"],
          ["1", "Erreur logique", "l'utilisateur ou son dpt", "clé manquante, score sous le seuil, branche non merge"],
          ["2", "Erreur technique", "l'environnement", "git absent, fichier illisible, JSON invalide"],
        ],
      },
      {
        type: "table",
        headers: ["Symbole", "Signification", "Action"],
        rows: [
            ["v", "succes / conforme", "aucune"],
          ["--", "erreur bloquante", "corriger avant de continuer"],
          ["--", "avertissement", "examiner ; bloquant en --strict"],
            ["i", "information", "aucune"],
          ["---", "courant (branches)", "sujet de la commande"],
          ["-'", "action recommande", "commande  exécutéer"],
        ],
      },
      {
        type: "code",
        title: "Exploiter le JSON en shell",
        lang: "bash",
        code: `# Compter les erreurs d'environnement
devwell env --ci | jq '.summary.errors'

# Rcuprer le score du projet
devwell doctor --ci --offline --json | jq '.score'

# Lister les branches candidates avant Décision
devwell branches --dry-run --json | jq -r '.candidates[]'

# Vrifier un contrat de CI en une ligne
devwell doctor --ci --offline --json | jq -e '.score >= 70' > /dev/null

# Sparer erreurs et warnings
devwell env --ci | jq '[.issues[] | select(.severity=="error")] | length'`,
      },
      { type: "h3", text: "stdout, stderr et couleur" },
      {
        type: "list",
        items: [
          "stdout ne contient que le rsultat exploitable ; les messages d'avancement vont sur stderr.",
          "En --ci, stdout est un unique document JSON parseable, sans bannire ni couleur.",
          "--format github produit des annotations ::error et ::warning pour les PR GitHub.",
          "Avec NO_COLOR=1, tous les codes ANSI disparaissent mais chaque symbole et libellé reste.",
          "Les identifiants de check (runtime, dependencies--) sont stables et documents pour vos filtres.",
        ],
      },
      {
        type: "callout",
        tone: "success",
        title: "Stabilit du contrat",
        text: "Chaque JSON expose schemaVersion. Une volution est touà jours additive : les champs existants ne sont pas renomms avant une majeure. Un test de contrat valide le schma  chaque release.",
      },
    ],
  },
  {
    id: "ci",
    title: "Automatiser en CI",
    kicker: "Pipelines & hooks",
    blocks: [
      {
        type: "p",
        text: "Trois checks non interactifs suffisent. Comêmencez en observation (ne pas bloquer), mesurez deux semaines, puis activez les seuils. project-doctor documente le seuil via --min-score pour viter les checs surprises.",
      },
      {
        type: "code",
        title: ".github/workflows/audit.yml - version minimale",
        lang: "yaml",
        code: `name: audit
on: [push, pull_request]
permissions: { contents: read }

jobs:
  atelier:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }          # requis pour readme-gen et les tags

      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc        # source de vrit du runtime
          cache: npm

      - run: npm ci

      # 1. Environnement : bloque les erreurs, tolre les warnings
      - name: Variables d'environnement
        run: devwell env --ci --format github

      # 2. Sant du projet : seuil explicite
      - name: Sant du projet
        run: devwell doctor --ci --offline --min-score 75 --format md >> $GITHUB_STEP_SUMMARY

      # 3. Hygine git : observation, aucune suppression
      - name: Branches
        run: devwell branches --dry-run --json > branches.json || true

      - name: Aperu du CHANGELOG
        run: devwell readme --dry-run --format md > changelog-preview.md || true

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: atelier-audit
          path: |
            branches.json
            changelog-preview.md`,
      },
      {
        type: "callout",
        tone: "warn",
        title: "Ne lancez jamais --apply en CI",
        text: "branch-cléeaner --apply est destin  un poste humain. En pipeline, utilisez --dry-run et publiez le rapport. De même, --fix exige une revue : gnrez le diff, laissez un humain l'appliquer.",
      },
      { type: "h3", text: "Pre-commit & pre-push" },
      {
        type: "code",
        title: ".husky/pre-commit (ou hook local)",
        lang: "bash",
        code: `#!/usr/bin/env sh
# Rapide, silencieux, sans réseau. Bloque uniquement les erreurs.
devwell env --ci || {
  echo "-- devwell env : corrigez les variables ou révoquez le secret."
  exit 1
}`,
      },
      {
        type: "code",
        title: ".husky/pre-push",
        lang: "bash",
        code: `#!/usr/bin/env sh
devwell readme --check || {
  echo "-- Des commits ne suivent pas la convention (feat:, fix:--)"
}
devwell doctor --ci --offline --min-score 70`,
      },
      { type: "h3", text: "GitLab CI et pipelines gnriques" },
      {
        type: "code",
        title: ".gitlab-ci.yml",
        lang: "yaml",
        code: `audit:
  image: node:22
  before_script:
    - apt-get update && apt-get install -y --no-install-recomêmends git
    - npm ci
  script:
    - devwell env --ci --json > env-report.json
    - devwell doctor --ci --offline --json > project-report.json
    - devwell branches --dry-run --json > branches.json
  artifacts:
    when: always
    paths: [env-report.json, project-report.json, branches.json]`,
      },
      {
        type: "table",
        headers: ["Niveau de blocage", "env-doctor", "project-doctor", "branch-cléeaner"],
        rows: [
          ["Observation", "--ci, ignorer exit 1", "--ci, ignorer exit 1", "--dry-run --format json"],
          ["Recommand", "--ci (erreurs)", "--ci --min-score 75", "rapport seulement"],
          ["Strict", "--ci --strict", "--ci --min-score 90 --strict", "jamais bloquant"],
        ],
      },
    ],
  },
  {
    id: "securite",
    title: "Secrets & garde-fous",
    kicker: "Ce qu'il faut faire, dans l'ordre",
    blocks: [
      {
        type: "p",
        text: "Un secret détect est un secret compromis ds qu'il a touch un dpt, un log ou un terminal partag. La priorit est la rvocation, pas la suppression du fichier. Les outils Devwell sont locaux et ne transmettent aucune valeur.",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "révoquer ou faire tourner le secret chez le fournisseur (AWS, Stripe, GitHub--).",
          "Retirer la valeur du .env local et la remplacer par une variable d'environnement non versionne.",
          "Vrifier l'historique git : a-t-il t commit ? Un script ddi (gitleaks, git filter-repo) sera ncessaire.",
          "Ajouter le fichier concern  .gitignore s'il n'y est pas.",
          "Relancer env-doctor jusqu' exit 0 et ajouter --ci en CI pour empcher le retour.",
          "Documenter l'incident interne sans jamais recopier la valeur dans le ticket ou Slack.",
        ],
      },
      {
        type: "table",
        headers: ["Faux positif probable", "Traitement"],
        rows: [
          ["clé publique prvue ct client (VITE_, NEXT_PUBLIC_)", "ajouter  allow dans .envdoctorrc.json"],
          ["Valeur de test / fixture", "ignorer la clé, prfixer la valeur par test_"],
          ["Token gnr localement dans .env.local", "ajouter .env.local aux fichiers compars ou l'ignorer"],
          ["Token volontairement partag en quipe", "ce n'est pas une clé : documenter le risque et changer de pratique"],
        ],
      },
      { type: "h3", text: "Scuriser un nettoyage de branches" },
      {
        type: "code",
          title: "Protocole sur avant --apply",
        lang: "bash",
        code: `# 1. Vrifier l'tat
git status --short
git branch --show-current

# 2. Sauvegarder tout avant de supprimer
git tag backup/$(date +%Y%m%d-%H%M) -m "Sauvegarde avant branch-cléeaner"

# 3. Inspecter prcisment
branch-cléeaner --stale 45 --graph

# 4. Nettoyer ce qui est certain
branch-cléeaner --merged --apply

# 5. En cas de doute sur une branche : la conserver
branch-cléeaner --protect "wip/*" --interactive`,
      },
      {
        type: "callout",
        tone: "warn",
        title: "Ce que les outils ne feront jamais",
        text: "Pas de push, pas de force-push, pas de rebase, pas de modification de l'historique. Pas de suppression de fichier utilisateur sans option d'criture explicite. Pas d'appel réseau pour env-doctor et branch-cléeaner. Pas de lecture de secrets pour les transmettre.",
      },
    ],
  },
  {
    id: "depannage",
    title: "dépannage",
    kicker: "Les erreurs qu'on rencontre vraiment",
    blocks: [
      {
        type: "table",
        headers: ["Symptme", "Cause probable", "Solution"],
        rows: [
          ["command not found: devwell", "installation globale absente du PATH", "depuis la racine du dépôt, lancer npm install --global . puis rouvrir le terminal"],
          ["-- Dpt git introuvable", "commande lance hors racine", "se placer dans le dpt ou vrifier git rev-parse --show-toplevel"],
          ["-- git est requis", "git absent (image Alpine, conteneur)", "apt-get install git ou apk add git"],
          ["env-doctor ignore tout", "aucun fichier .env*", "crer .env.example ou passer --files chemin"],
          ["project-doctor dépendances ignores", "registre injoignable ou --offline", "relancer sans --offline, vrifier le proxy npm"],
          ["project-doctor score 0 partout", "config invalide (JSON cass)", "corriger le fichier signal ; utiliser --format json pour le dtail"],
            ["readme-gen commit Autres", "message non conventionnel", "format type(scope): sujet ; lancer --check avant la release"],
          ["CHANGELOG non crit", "fichier existant sans --force", "relancer avec --force (sauvegarde .bak) ou supprimer le fichier"],
          ["branch-cléeaner --interactive refus", "pas de TTY (CI, pipe)", "utiliser --dry-run --format json ou un terminal rel"],
          ["branch-cléeaner ne propose rien", "branches non merges, protges ou critre absent", "ajouter --stale ou --orphans, vrifier --protect et la base"],
          ["Couleurs illisibles / log pollu", "TTY simul ou NO_COLOR", "ajouter --no-color, les symboles restent"],
          ["Accents casss sous Windows", "console non UTF-8", "chcp 65001 en PowerShell ou utiliser Windows Terminal / WSL"],
        ],
      },
      {
        type: "code",
        title: "Diagnostic rapide de l'installation",
        lang: "bash",
        code: `node --version              # -- 18.17
git --version               # -- 2.30
npm config get registry     # doit rpondre
devwell env --version
echo $?                     # 0 attendu

# Vrifier un dpt et sa racine
git rev-parse --show-toplevel
git for-each-ref --format='%(refname:short)' refs/heads | head

# Tester hors TTY (comportement CI)
devwell env --ci < /dev/null | head -c 300`,
      },
      { type: "h3", text: "Questions frquentes" },
      { type: "h3", text: "La suite remplace-t-elle husky, eslint ou npm audit ?" },
      {
        type: "p",
        text: "Non. env-doctor et readme-gen sont des garde-fous cibles ; project-doctor renvoie explicitement vers npm audit ou pip-audit pour les CVE, et ne remplace ni lint ni tests. Utilisez-les ensemble : les outils Devwell repondent a pourquoi ce projet est-il difficile a reprendre.",
      },
      { type: "h3", text: "Aucun réseau en CI, est-ce possible ?" },
      {
        type: "p",
        text: "Oui. Installez les paquets  l'tape npm ci, utilisez --offline pour project-doctor, et n'activez jamais --fetch avec branch-cléeaner. env-doctor et readme-gen (hors donnes dj prsentes) n'ont aucun besoin réseau.",
      },
      { type: "h3", text: "Les valeurs de mon .env sortent-elles de ma machine ?" },
      {
        type: "p",
        text: "Non. env-doctor est un analyseur statique local. Il ne charge pas les valeurs dans l'environnement, ne les envoie jamais et masque les secrets dans sa sortie. Vrifiez vous-même : aucune requte réseau n'est effectue par le binaire. Un test automatis garantit l'absence de valeur brute dans stdout/stderr.",
      },
      { type: "h3", text: "Puis-je l'utiliser sur un projet Python sans Node ?" },
      {
        type: "p",
        text: "Node 18+ est ncessaire pour exécutéer les binaires. Deux options : installer Node dans la CI (frquent même sur un projet Python), ou exécutéer l'outil dans un conteneur node:22-alpine avec le dpt mont. Un port Python autonome est  l'tude pour la v2, pas avant.",
      },
      { type: "h3", text: "Comêment contribuer ou signaler un bug ?" },
      {
        type: "p",
        text: "Ouvrez une issue avec la version (--version), la commande exacte, la sortie, et le systme. Pour une faille de sécurité, ne publiez pas de détails exploitables dans une issue ; consultez SECURITY.md. Les pull requests suivent CONTRIBUTING.md et exigent un test par comportement modifi.",
      },
    ],
  },
  {
    id: "adoption",
    title: "Faire adopter la suite",
    kicker: "Plan d'quipe & conventions",
    blocks: [
      {
        type: "p",
        text: "Un outil partag s'adopte par la dmonstration, pas par dcret. Ce plan de quatre semaines comêmence par une valeur visible sans contrainte, puis rend les vrifications automatiques une fois qu'elles sont comprises.",
      },
      {
        type: "table",
        headers: ["Semaine", "Action", "Objectif mesurable"],
        rows: [
          ["S1  Dcouverte", "Post Slack, dmo de 20 min sur un vrai dpt, lecture du guide", "-- 60 % des devs ont lanc un audit"],
          ["S2  Diagnostic", "Chaque dpt reoit un rapport project-doctor et un rapport branches", "Score de rfrence not, 3 frictions identifies"],
          ["S3  Prvention", "env-doctor en pre-commit, --check de readme-gen sur les PR", "0 variable manquante  l'onboarding"],
          ["S4  Rituel", "Nettoyage de branches mensuel, CHANGELOG gnr  chaque release", "-- 45 à jours d'ge pour les branches, release sans copier-coller"],
        ],
      },
      { type: "h3", text: "Convention de commits minimale" },
      {
        type: "code",
        title: "Les 6 types  connatre",
        lang: "text",
        code: `feat(scope): ajoute une fonctionnalit visible
fix(scope): corrige un comportement
docs: documentation uniquement
chore: maintenance, dépendances, config
perf: amlioration de performance
refactor: changement interne sans impact fonctionnel

! aprs le type ou BREAKING CHANGE dans le corps pour un changement cassant.
Exemple : feat(api)!: retire l'endpoint v1

Rgles : impratif, 72 caractres max, une intention par commit.
readme-gen cléasse automatiquement ; les autres finissent dans -" Autres -".`,
      },
      {
        type: "table",
        headers: ["Rle", "Responsabilit", "Rythme"],
        rows: [
          ["Référent qualité projet", "tient la doc, forme les nouveaux, arbitre les faux positifs", "30 min / semaine"],
          ["Mainteneurs", "traitent les rapports d'audit et activent les seuils", " chaque sprint"],
          ["Toute l'quipe", "lance les commandes lecture seule avant PR", "quotidien"],
          ["sécurité", "relit la politique de secrets et les incidents", "mensuel"],
        ],
      },
      {
        type: "code",
        title: "Rituels - a copier dans l'ordre du à jour",
        lang: "text",
        code: `LUNDI -" 5 min : tat du dpt
  devwell doctor --offline
  devwell branches --stale 30 --graph

AVANT CHAQUE RELEASE -" 10 min
  devwell env --ci
  devwell doctor --ci --min-score 75
  devwell readme --since <dernier-tag>
  devwell branches --merged     # inspection, puis --apply si valid

FIN DE SPRINT -" 15 min
  revue du score de sant (tendance)
  revue des branches conserves et des faux positifs de secrets
  Décision : conserver, protger, ou supprimer`,
      },
      {
        type: "callout",
        tone: "success",
        title: "Indicateurs de russite",
        text: "Temps d'onboarding < 10 min  0 secret vivant dans un .env versionn  score de sant -- 80 sur les dpts actifs  CHANGELOG  à jour  chaque tag  moins de 10 branches locales par dpt.",
      },
    ],
  },
];
