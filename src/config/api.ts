export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const endpoint = (path: string) => `${API_BASE_URL}${path}`

export const API_ENDPOINTS = {
  auth: {
    login: endpoint('/auth/login'),
    logout: endpoint('/auth/logout'),
    me: endpoint('/auth/me'),
    register: endpoint('/auth/register'),
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
  oohAssets: endpoint('/ooh/assets'),
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
}

export function resourceEndpoint(resourceUrl: string, id?: string | number) {
  return id ? `${resourceUrl}/${id}` : resourceUrl
}
