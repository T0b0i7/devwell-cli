# Contribuer

Merci de vouloir contribuer à Devwell.

## Avant de commencer

- Pour une correction simple, ouvre une pull request avec le contexte, le comportement attendu et les tests effectués.
- Pour une évolution qui modifie l'interface CLI ou le format des rapports, ouvre d'abord une issue afin de discuter de la compatibilité.
- N'inclus jamais de vrais secrets, tokens, fichiers `.env` ou données privées dans une issue, un test ou une capture.

## Environnement de développement

Prérequis : Node.js 20.19 ou plus récent pour le site et les dépendances de développement ; Git pour les tests d'intégration de `branch-cleaner` et `readme-gen`.

```sh
npm install
npm run check
npm audit
```

Les tests utilisent `node:test` et créent des dépôts Git temporaires. Chaque commande devrait rester sûre par défaut, afficher des erreurs actionnables et préserver la compatibilité Node.js 18.17+ annoncée pour les CLI.

## Pull requests

- Décris le problème et le changement de comportement.
- Ajoute ou ajuste des tests pour les comportements modifiés et les cas limites.
- Vérifie les tests, le typecheck et le build avec `npm run check`.
- Signale les changements incompatibles et les décisions de sécurité.
- Garde les changements ciblés et n'ajoute aucune dépendance sans justification.

En soumettant une contribution, tu acceptes qu'elle soit distribuée sous la licence MIT du projet.
