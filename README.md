# Devwell

**Des projets sains, des développeurs sereins.** Devwell rassemble quatre commandes locales pour mieux documenter un dépôt, vérifier sa configuration et garder ses branches sous contrôle.

[Site web](https://devwell-vert.vercel.app/) · [Code source](https://github.com/T0b0i7/devwell-cli) · [Signaler un problème](https://github.com/T0b0i7/devwell-cli/issues)

## Démarrage rapide

```sh
npm install --global devwell
cd mon-projet
devwell --help
```

Devwell s'exécute localement dans le dépôt courant. Commence par les commandes de diagnostic et les modes aperçu ; les opérations qui écrivent ou suppriment demandent une option explicite.

## Les quatre commandes

| Commande | Ce qu'elle vérifie ou produit | Exemple prudent |
| --- | --- | --- |
| `devwell env` | Compare des fichiers `.env`, signale les clés manquantes, orphelines, vides ou dupliquées ainsi que les lignes mal formées, et repère certains motifs de secrets. Les valeurs ne sont pas affichées. | `devwell env --files .env.example,.env` |
| `devwell doctor` | Évalue certains aspects de santé d'un projet Node.js ou Python : runtime, configurations, lockfile, scripts et hygiène du dépôt. | `devwell doctor --offline` |
| `devwell branches` | Audite les branches Git locales et présente les candidates selon leur état. Le mode aperçu est activé par défaut. | `devwell branches --stale 30 --graph` |
| `devwell readme` | Prépare un changelog à partir des commits conventionnels ; peut aussi vérifier les commits ou créer un README minimal absent. | `devwell readme --dry-run` |

Pour les options, les formats et les codes de sortie :

```sh
devwell env --help
devwell doctor --help
devwell branches --help
devwell readme --help
```

Les anciens binaires restent disponibles : `env-doctor`, `project-doctor`, `branch-cleaner` et `readme-gen`.

## Rapports et automatisation

Les commandes qui produisent un rapport prennent en charge JSON pour les scripts et les pipelines :

```sh
devwell env --ci --json
devwell doctor --ci --min-score 80
devwell branches --dry-run --json
devwell readme --dry-run --json --output -
```

`devwell doctor` fonctionne hors ligne par défaut ; `--offline` rend ce choix explicite. Vérifie le code de sortie de chaque commande dans ta CI et ajuste ses seuils à ton projet avant d'en faire un contrôle bloquant.

### Codes de sortie

| Code | Signification |
| --- | --- |
| `0` | Contrôle réussi, ou commande terminée sans erreur bloquante. |
| `1` | Résultat non conforme à la règle demandée, option invalide, ou opération refusée (par exemple un fichier de sortie déjà présent). |
| `2` | Prérequis ou contexte manquant, comme Git absent ou aucun manifeste de projet reconnu par `doctor`. |

Le détail dépend de la commande : `env` renvoie `1` en cas d'erreur, et aussi en cas d'avertissement avec `--strict`. `doctor` renvoie `1` si le score est inférieur à `--min-score` (80 par défaut) ; `--strict` fait aussi échouer les erreurs de configuration. `readme --check` renvoie `1` si des commits ne suivent pas la convention attendue. `branches` renvoie `1` si une suppression candidate échoue. Les erreurs d'options et de contexte sont affichées sur stderr.

### Formats des rapports

- `env` : `pretty` par défaut, `json` ou `github`. `--ci` sélectionne JSON ; le rapport expose `schemaVersion`, `files`, `issues` et `summary`. Les valeurs des variables ne sont pas incluses. Sans fichier `.env*`, la commande indique que l'analyse n'a pas eu lieu et termine avec `0` : vérifie ce message avant de considérer le contrôle comme effectué.
- `doctor` : tableau par défaut, `md` ou `json`, avec `schemaVersion`, `project`, `ecosystem`, `score`, `status`, `checks` et `fixes`. `--report <fichier.html>` écrit en plus un rapport HTML.
- `branches` : sortie lisible par défaut ou JSON, avec `schemaVersion`, branches examinées, candidates, suppressions, échecs et éventuel graphe Git.
- `readme` : Markdown par défaut ou JSON, avec `schemaVersion`, plage de commits, versions, détails et statistiques. `--output -` écrit le résultat sur stdout.

Les rapports JSON sont destinés à l'automatisation ; leurs objets de premier niveau portent `schemaVersion: 1`. Les messages destinés aux humains restent sur stdout pour les résultats et sur stderr pour les erreurs.

### Pannes courantes

| Situation | Comportement |
| --- | --- |
| Aucun fichier `.env*` détecté | `env` prévient que l'analyse n'a pas eu lieu ; ajoute `.env.example` ou précise `--files`. |
| Ligne `.env` mal formée | `env` indique le fichier et la ligne, sans afficher le contenu de la ligne. Le code de sortie est `1`. |
| Git non installé | `readme` et `branches` affichent l'erreur de dépendance et renvoient `2`. |
| Dépôt Git sans commit | `branches` explique qu'une référence de base valide est nécessaire et renvoie `1`. |
| Aucun `package.json` ni `pyproject.toml` | `doctor` explique qu'aucun projet pris en charge n'a été trouvé et renvoie `2`. |
| Fichier de sortie existant | `readme` refuse de l'écraser sans `--force` ; une erreur est affichée au lieu de remplacer le fichier silencieusement. |

## Sécurité et comportement

- Les commandes s'exécutent sur ta machine ; le site web présente la suite, mais n'analyse pas tes dépôts.
- `devwell env` ne révèle pas les valeurs des variables.
- `devwell doctor` n'applique aucune correction sans `--fix --apply`.
- `devwell branches` simule le nettoyage par défaut. `--apply` cible les candidates fusionnées ; les branches non fusionnées nécessitent `--force-unmerged` et une confirmation interactive.
- Aucun outil ne remplace une revue de code, un gestionnaire de secrets, une sauvegarde ou une politique de sécurité.

## Feuille de route

Cette liste rassemble des pistes de travail, pas des engagements ni des dates de livraison. Les priorités pourront évoluer selon les retours et les besoins des utilisateurs.

### Fondations — à consolider

- [x] Ajouter des tests de cas limites : dépôts vides, Git absent, fichiers `.env` mal formés et chemins avec espaces.
- [ ] Tester systématiquement l'installation et les commandes publiées sur Windows, macOS et Linux.
- [x] Documenter les codes de sortie, les formats JSON et les scénarios de panne courants des commandes.
- [x] Vérifier les exemples CLI du README par rapport aux options et tests de la version source.

### Expérience en ligne de commande — pistes

- [ ] Harmoniser les options communes, les messages d'erreur et les conseils de correction.
- [x] Améliorer les résumés de fin pour indiquer ce qui a été vérifié et la prochaine action utile.
- [ ] Étudier des options globales telles que `--quiet`, `--verbose` et `--no-color`, si elles améliorent les usages en terminal et en CI.
- [ ] Évaluer une configuration partagée facultative pour éviter de répéter les mêmes réglages dans plusieurs commandes.

### Outils — pistes

- [ ] `env` : rendre les règles d'ignorance et les faux positifs plus faciles à comprendre et à ajuster.
- [ ] `doctor` : préciser les limites du score, élargir les vérifications utiles et rendre chaque correction proposée vérifiable.
- [ ] `branches` : améliorer les explications sur le statut de chaque branche et les garde-fous avant toute suppression.
- [ ] `readme` : couvrir davantage de conventions de commits et faciliter la prévisualisation avant écriture.

### Adoption et documentation — pistes

- [ ] Ajouter des démonstrations terminal reproductibles pour les quatre commandes.
- [ ] Enrichir les exemples d'intégration dans GitHub Actions et d'autres environnements CI.
- [ ] Recueillir les retours d'utilisateurs avant d'ajouter de nouvelles plateformes ou de nouveaux gestionnaires de paquets.

## Installation et désinstallation

### Depuis npm

```sh
npm install --global devwell
devwell --version
```

Pour désinstaller :

```sh
npm uninstall --global devwell
```

### Depuis le dépôt

```sh
git clone https://github.com/T0b0i7/devwell-cli.git
cd devwell-cli
npm install --global .
```

Pour contribuer au site ou au code :

```sh
npm install
npm run dev
```

## Prérequis

- Node.js 18.17 ou plus récent pour les commandes.
- Git pour `devwell readme` et `devwell branches`.
- Python installé si tu analyses des projets Python avec `devwell doctor`.
- Node.js 20.19 ou plus récent pour construire et développer le site.

## Développement et validation

```sh
npm run check
npm audit
```

`npm run check` exécute les tests, le contrôle TypeScript et le build de production.

## Contribuer

Les contributions et retours sont les bienvenus. Consulte [CONTRIBUTING.md](./CONTRIBUTING.md) avant de proposer un changement et le [code de conduite](./CODE_OF_CONDUCT.md) pour les règles de la communauté.

Pour signaler une vulnérabilité, suis les consignes de [SECURITY.md](./SECURITY.md) plutôt que de publier des détails sensibles dans une issue publique.

## Licence

Devwell est distribué sous licence MIT. Voir [LICENSE](./LICENSE).
