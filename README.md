# ONEKANA Business Manager

Interface web de gestion interne ONEKANA.

Cette application sert de portail de travail pour piloter les operations, les campagnes, l'inventaire publicitaire, les documents, les finances et les activites administratives liees a ONEKANA.

## Principes

- Les acces sont controles par le systeme d'authentification et les droits utilisateur.
- Les donnees sensibles ne doivent jamais etre stockees dans le code source.
- Les informations de connexion, URLs privees, secrets et cles d'acces doivent rester dans les fichiers d'environnement locaux ou dans les variables securisees de l'hebergeur.
- Les donnees clients affichees dans le back office doivent provenir de services autorises.

## Modules

- Tableau de bord
- Demandes clients
- Campagnes et inventaire OOH
- Documents
- Equipe et organisation interne
- Materiels et horaires
- Factures, paiements, wallet et comptabilite
- Parametres utilisateur

## Installation

Installer les dependances:

```bash
npm install
```

Configurer l'environnement local a partir du modele fourni, puis renseigner les valeurs adaptees a l'environnement cible.

## Scripts

```bash
npm run dev
npm run lint:types
npm run build
```

## Securite

Ne pas publier:

- fichiers `.env`;
- identifiants de connexion;
- cles secretes;
- URLs internes non publiques;
- details d'infrastructure prives;
- exemples contenant de vraies donnees clients.

Toute information technique sensible doit rester dans une documentation privee reservee a l'equipe autorisee.
