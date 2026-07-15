# ONEKANA Business Manager

Back office interne de supervision ONEKANA.

## Demarrage

```bash
npm ci
npm run dev
```

Copier `.env.example` vers `.env` et renseigner l'adresse du service admin local. Le fichier `.env` ne doit jamais etre versionne.

## Verification

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

## Mise en production

- Deployer le dossier `dist` genere par `npm run build`.
- Configurer les variables d'environnement dans l'hebergeur, jamais dans Git.
- Conserver la geographie et la finance avancee desactivees tant que les services associes ne sont pas valides.
- Executer les controles CI et une recette sur staging avant toute promotion.

## Centre de validation

Le module de supervision est active avec `VITE_ENABLE_APPROVAL_CENTER=true`, uniquement apres migration du service admin. Il permet de traiter les comptes, demandes, campagnes recues et documents sans modifier leur source externe. Les actions disponibles dependent du profil connecte.

La file peut etre actualisee manuellement depuis `Centre de validation`. En production, son actualisation periodique est executee par le service admin.

Les informations d'infrastructure, identifiants et contrats prives sont conserves hors de ce depot public.
