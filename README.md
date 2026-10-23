# Devwell

**Healthy repos, happier devs.** Quatre outils pour documenter un projet, contrôler sa configuration et garder ses branches propres — avec des actions prudentes par défaut.

**Site web :** [devwell-vert.vercel.app](https://devwell-vert.vercel.app/) · **Code source :** [T0b0i7/devwell-cli](https://github.com/T0b0i7/devwell-cli)

## Démarrage rapide

```sh
npm install --global .
devwell --help
```

Devwell s'installe depuis le dépôt local. Le package npm n'est pas encore publié.

## Les outils

| Sous-commande | À quoi elle sert | Exemple |
| --- | --- | --- |
| `devwell readme` | Génère un changelog depuis les commits Git conventionnels. | `devwell readme --dry-run` |
| `devwell env` | Compare les fichiers `.env` et repère les clés manquantes ou certains motifs de secrets sans afficher leurs valeurs. | `devwell env --files .env.example,.env --json` |
| `devwell doctor` | Évalue la configuration de projets Node.js ou Python et produit un rapport exploitable en CI. | `devwell doctor --json` |
| `devwell branches` | Repère les branches locales candidates au nettoyage et permet une suppression explicite. | `devwell branches --json` |

Chaque sous-commande propose `--help` et `--version`. Les rapports JSON peuvent être demandés avec `--json` ou `--format json`. Les anciens exécutables `readme-gen`, `env-doctor`, `project-doctor` et `branch-cleaner` restent disponibles comme alias.

## Sécurité et limites

- `devwell env` n'affiche jamais les valeurs des variables d'environnement.
- `devwell branches` simule les suppressions par défaut, protège la branche courante et les branches usuelles, et exige une double confirmation interactive pour supprimer une branche non fusionnée.
- `devwell doctor` n'applique aucune correction sans demande explicite. Les modifications qu'il prend en charge sont ciblées et sauvegardées.
- Ces outils ne remplacent pas une revue de sécurité, un gestionnaire de secrets ou une politique de sauvegarde.
- Ils s'exécutent localement dans le terminal ; le site web les documente, mais ne les exécute pas sur l'ordinateur du visiteur.

## Prérequis

- Node.js 18.17 ou plus récent pour les commandes.
- Git pour `devwell readme` et `devwell branches`.
- Python pour la détection du runtime Python par `devwell doctor`.
- Node.js 20.19 ou plus récent pour construire ou lancer le site Vite.

## Installation

### Depuis le dépôt

```sh
npm install --global .
```

Les quatre commandes sont alors disponibles dans le terminal. Pour les désinstaller :

```sh
npm uninstall --global devwell
```

Pour développer le site, installer les dépendances du workspace avec `npm install`, puis lancer `npm run dev`. `npm run build` génère le site statique.

### Créer une archive installable

Depuis la racine du dépôt :

```sh
npm pack
```

Le fichier `devwell-0.1.0.tgz` peut être installé globalement depuis son emplacement :

```sh
npm install --global .\devwell-0.1.0.tgz
```

Cette archive contient les exécutables CLI et leur noyau partagé, pas le code du site ni ses dépendances de développement.

## Développement et validation

```sh
npm install
npm run check
npm audit
```

`npm run check` exécute les tests, le contrôle TypeScript et le build de production.

## Contribuer

Les contributions sont les bienvenues. Consulte [CONTRIBUTING.md](./CONTRIBUTING.md) pour lancer les vérifications et proposer un changement ; consulte [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) pour les attentes de la communauté.

Pour signaler une vulnérabilité, suis les instructions de [SECURITY.md](./SECURITY.md) et évite de publier les détails avant qu'une correction soit disponible.

## Licence

Ce projet est distribué sous licence MIT. Voir [LICENSE](./LICENSE).

## Publication

Le site est hébergé gratuitement sur Vercel. Le package CLI n'est pas encore publié sur npm : la publication attend une autorisation 2FA ou un jeton npm de publication adapté.
