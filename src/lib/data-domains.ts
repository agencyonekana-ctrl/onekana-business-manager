export type DataOrigin = 'created-here' | 'received-from-connected-spaces'

export type DataDomain = {
  key: string
  label: string
  origin: DataOrigin
  description: string
}

export const internalDataDomains: DataDomain[] = [
  {
    key: 'organization',
    label: 'Organisation interne',
    origin: 'created-here',
    description: 'Equipe, departements, horaires et parametres de travail.',
  },
  {
    key: 'operations',
    label: 'Logistique',
    origin: 'created-here',
    description: 'Materiels, documents, inventaire publicitaire et suivi operationnel.',
  },
  {
    key: 'commercial-control',
    label: 'Pilotage commercial',
    origin: 'created-here',
    description: 'Campagnes, reservations, factures et actions de controle interne.',
  },
]

export const connectedDataDomains: DataDomain[] = [
  {
    key: 'client-requests',
    label: 'Demandes clients',
    origin: 'received-from-connected-spaces',
    description: 'Demandes et informations recues depuis les espaces connectes.',
  },
]
