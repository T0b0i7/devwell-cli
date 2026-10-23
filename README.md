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
| `devwell env` | Compare des fichiers `.env`, signale les clés manquantes, orphelines, vides ou dupliquées, et repère certains motifs de secrets. Les valeurs ne sont pas affichées. | `devwell env --files .env.example,.env` |
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

## Sécurité et comportement

- Les commandes s'exécutent sur ta machine ; le site web présente la suite, mais n'analyse pas tes dépôts.
- `devwell env` ne révèle pas les valeurs des variables.
- `devwell doctor` n'applique aucune correction sans `--fix --apply`.
- `devwell branches` simule le nettoyage par défaut. `--apply` cible les candidates fusionnées ; les branches non fusionnées nécessitent `--force-unmerged` et une confirmation interactive.
- Aucun outil ne remplace une revue de code, un gestionnaire de secrets, une sauvegarde ou une politique de sécurité.

## Feuille de route

Cette liste rassemble des pistes de travail, pas des engagements ni des dates de livraison. Les priorités pourront évoluer selon les retours et les besoins des utilisateurs.

### Fondations — à consolider

- [ ] Ajouter des tests de cas limites supplémentaires : dépôts vides, Git absent, fichiers `.env` mal formés et chemins avec espaces.
- [ ] Tester systématiquement l'installation et les commandes publiées sur Windows, macOS et Linux.
- [ ] Documenter clairement les codes de sortie, les formats JSON et les scénarios de panne de chaque commande.
- [ ] Vérifier que chaque exemple du site et du README correspond au comportement réel de la version publiée.

### Expérience en ligne de commande — pistes

- [ ] Harmoniser les options communes, les messages d'erreur et les conseils de correction.
- [ ] Améliorer les résumés de fin pour indiquer ce qui a été vérifié et la prochaine action utile.
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
