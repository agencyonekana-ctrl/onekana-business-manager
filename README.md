# ONEKANA Back Office

ONEKANA Back Office est l'application interne qui accompagne le site public `ONEKANA`. Elle sert à piloter les opérations de régie publicitaire, les campagnes OOH, les réservations agences, l'inventaire des supports, les documents et les ressources internes.

## Rôle de l'application

Cette app est le back office local de ONEKANA. Elle centralise les données nécessaires à l'exploitation quotidienne:

- campagnes publicitaires et lignes de réservation;
- sites, supports, emplacements et assets OOH;
- demandes de réservation provenant d'agences ou partenaires;
- équipe, départements, horaires et matériels;
- documents administratifs ou commerciaux;
- paramètres métier comme les postes, statuts, types de matériel et types de réservation.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- Radix UI / composants inspirés shadcn
- React Router
- Données locales via `localStorage`

## Fonctionnement local

Le projet fonctionne sans backend réel pour le moment.

- L'authentification est simulée avec un utilisateur interne: `Admin Onekana`.
- Les données métier sont initialisées avec des seed data locales.
- Les opérations `list`, `get`, `create`, `update`, `delete` et `count` sont gérées par `src/lib/local-data.ts`.
- Les fichiers documents utilisent un storage simulé via des URL temporaires du navigateur.
- Les données CRUD persistent après rafraîchissement grâce à `localStorage`.

## Scripts utiles

```bash
npm run dev
npm run build
npm run lint:types
```

## Limites actuelles

- Pas encore de vraie base de données serveur.
- Pas encore de comptes utilisateurs réels.
- Les fichiers uploadés ne sont pas persistés comme dans un vrai stockage cloud.
- Cette version sert de socle autonome pour continuer la personnalisation avant ajout d'un backend réel.

## Positionnement

Le site `ONEKANA` est la vitrine publique de l'agence. `ONEKANA Back Office` est son outil interne de gestion, conçu pour suivre les campagnes, les supports terrain et l'activité opérationnelle.
