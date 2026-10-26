# Configurer l'administration Devwell

Le panneau est accessible à `https://devwell-vert.vercel.app/#/admin`. Il utilise une connexion GitHub côté serveur, une liste de comptes autorisés et une session chiffrée en cookie HttpOnly. Les modifications sont écrites dans `public/content/site.json` sur la branche configurée ; un commit déclenche ensuite le déploiement Vercel.

## 1. Créer l'application OAuth GitHub

Depuis GitHub, ouvre **Settings → Developer settings → OAuth Apps → New OAuth App** :

- **Application name** : `Devwell Admin`
- **Homepage URL** : `https://devwell-vert.vercel.app`
- **Authorization callback URL** : `https://devwell-vert.vercel.app/api/admin/callback`

Après création, conserve le **Client ID** et génère un **Client secret**. Ne les ajoute pas au dépôt et ne les partage pas dans une conversation.

## 2. Générer une clé de session

Génère une valeur aléatoire dans PowerShell ; elle reste dans ton terminal :

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Utilise la sortie comme valeur de `ADMIN_SESSION_SECRET`. Elle doit rester privée et comporter au moins 32 caractères.

## 3. Ajouter les variables dans Vercel

Dans le projet Vercel, ouvre **Settings → Environment Variables** et ajoute ces variables à l'environnement **Production** :

| Variable | Valeur |
| --- | --- |
| `ADMIN_SITE_URL` | `https://devwell-vert.vercel.app` |
| `GITHUB_OAUTH_CLIENT_ID` | Client ID de l'OAuth App |
| `GITHUB_OAUTH_CLIENT_SECRET` | Client secret de l'OAuth App |
| `GITHUB_ADMIN_USERS` | Ton nom d'utilisateur GitHub exact ; plusieurs comptes séparés par des virgules |
| `GITHUB_REPOSITORY` | `T0b0i7/devwell-cli` |
| `GITHUB_BRANCH` | `main` |
| `ADMIN_SESSION_SECRET` | La valeur générée à l'étape précédente |

Le compte GitHub doit avoir les droits **push** sur le dépôt. Ajoute les secrets uniquement dans Vercel, sans les committer.

## 4. Redéployer et vérifier

Après avoir enregistré les variables, redéploie le projet depuis **Deployments** dans Vercel. Puis ouvre `https://devwell-vert.vercel.app/#/admin` et connecte-toi avec un compte autorisé.

Crée d'abord une annonce en brouillon, enregistre-la et vérifie le commit GitHub. Publie-la ensuite pour vérifier son affichage sur la page d'accueil. Le déploiement du site peut demander quelques minutes.

## Périmètre administrable

Le panneau permet de modifier le titre, la signature, le hero, le texte du pied de page, l'ordre et la visibilité de la navigation principale, ainsi que les annonces. Les autres textes des pages de documentation restent maintenus dans le code source.

## Sécurité et dépannage

- Une configuration manquante affiche l'identifiant de la variable à renseigner, jamais sa valeur.
- Seuls les comptes de `GITHUB_ADMIN_USERS` ayant accès en écriture au dépôt peuvent ouvrir une session.
- Les sessions expirent après deux heures ; le jeton GitHub est chiffré dans un cookie HttpOnly et n'est pas accessible au JavaScript du navigateur.
- Les modifications nécessitent une origine de requête identique au `ADMIN_SITE_URL`.
- Si la connexion échoue, vérifie l'URL de callback, le nom GitHub autorisé, les droits du dépôt et que Vercel a bien déployé après l'ajout des variables.
