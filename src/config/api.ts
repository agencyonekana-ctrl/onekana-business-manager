const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim()

if (import.meta.env.PROD && !configuredApiUrl) {
  throw new Error('VITE_API_BASE_URL must be configured for production builds.')
}

export const API_BASE_URL = (configuredApiUrl || 'http://127.0.0.1:8000/api').replace(/\/$/, '')

const endpoint = (path: string) => `${API_BASE_URL}${path}`

export const API_ENDPOINTS = {
  auth: {
    login: endpoint('/auth/login'),
    logout: endpoint('/auth/logout'),
    refresh: endpoint('/auth/refresh'),
    me: endpoint('/auth/me'),
    forgotPassword: endpoint('/auth/forgot-password'),
    resetPassword: endpoint('/auth/reset-password'),
    register: endpoint('/auth/register'),
  },
  adminUsers: endpoint('/admin/users'),
  adminRoles: endpoint('/admin/roles'),
  approvals: {
    overview: endpoint('/admin/overview'),
    cases: endpoint('/admin/cases'),
    assignees: endpoint('/admin/cases/assignees'),
    import: endpoint('/admin/cases/import'),
    settings: endpoint('/admin/validation-settings'),
    audit: endpoint('/admin/audit-log'),
  },

  employees: endpoint('/employees'),
  departments: endpoint('/departments'),
  documents: endpoint('/documents'),
  schedules: endpoint('/schedules'),
  materials: endpoint('/materials'),
  materialTypes: endpoint('/material-types'),
  reservations: endpoint('/reservations'),
  reservationTypes: endpoint('/reservation-types'),
  jobTitles: endpoint('/job-titles'),
  employeeStatuses: endpoint('/employee-statuses'),

  oohSites: endpoint('/ooh/sites'),
  oohSupports: endpoint('/ooh/supports'),
  oohEmplacements: endpoint('/ooh/emplacements'),
  oohPricingRules: endpoint('/ooh/pricing-rules'),
  oohCampaigns: endpoint('/ooh/campaigns'),
  oohCampaignLines: endpoint('/ooh/campaign-lines'),
  oohTasks: endpoint('/ooh/tasks'),

  packsCommerciaux: endpoint('/packs'),
  optionsComplementaires: endpoint('/options'),
  contactMessages: endpoint('/contact-messages'),
  campaignTypes: endpoint('/campaign-types'),
  campaignPrices: endpoint('/campaign-prices'),
  communes: endpoint('/communes'),
  quartiers: endpoint('/quartiers'),
  pointsChauds: endpoint('/points-chauds'),
  transportRoutes: endpoint('/transport-routes'),
  routeCoordinates: endpoint('/route-coordinates'),
  agendaEvents: endpoint('/agenda-events'),
  notifications: endpoint('/notifications'),
  roadmap: endpoint('/roadmap'),

  accountingAccounts: endpoint('/accounting/accounts'),
  accountingJournals: endpoint('/accounting/journals'),
  accountingEntries: endpoint('/accounting/entries'),
  accountingPeriods: endpoint('/accounting/periods'),
  accountingSettings: endpoint('/accounting/settings'),
  trialBalance: endpoint('/accounting/trial-balance'),
  walletAccounts: endpoint('/wallet/accounts'),
  walletTransactions: endpoint('/wallet/transactions'),
  invoices: endpoint('/invoices'),
  payments: endpoint('/payments'),
  geographicReviews: endpoint('/geographic-reviews'),
  media: endpoint('/media'),
  files: endpoint('/files'),

  agency: {
    profile: endpoint('/agency/profile'),
    summary: endpoint('/agency/summary'),
    users: endpoint('/agency/users'),
    campaigns: endpoint('/agency/campaigns'),
    contacts: endpoint('/agency/contacts'),
    communes: endpoint('/agency/geographic/communes'),
    pointsChauds: endpoint('/agency/geographic/points-chauds'),
    trajets: endpoint('/agency/geographic/trajets'),
  },
}

export function resourceEndpoint(resourceUrl: string, id?: string | number) {
  return id ? `${resourceUrl}/${id}` : resourceUrl
}

export function resourceActionEndpoint(resourceUrl: string, id: string | number, action: string) {
  return `${resourceEndpoint(resourceUrl, id)}/${action}`
}
