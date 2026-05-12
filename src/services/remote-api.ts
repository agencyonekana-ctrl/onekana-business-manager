import { API_BASE_URL, API_ENDPOINTS, resourceEndpoint } from '../config/api'
import { apiFetch, unwrapApiData } from './api-client'

function resource(url: string) {
  return {
    list: async <T = any>() => unwrapApiData<T[]>(await apiFetch(resourceEndpoint(url))),
    get: async <T = any>(id: string) => unwrapApiData<T>(await apiFetch(resourceEndpoint(url, id))),
    create: <T = any>(data: unknown) => apiFetch<T>(resourceEndpoint(url), { method: 'POST', body: data }),
    update: <T = any>(id: string, data: unknown) => apiFetch<T>(resourceEndpoint(url, id), { method: 'PUT', body: data }),
    delete: (id: string) => apiFetch(resourceEndpoint(url, id), { method: 'DELETE' }),
  }
}

export const remoteApi = {
  baseUrl: API_BASE_URL,

  auth: {
    register: (data: unknown) => apiFetch(API_ENDPOINTS.auth.register, { method: 'POST', body: data }),
    login: (data: unknown) => apiFetch(API_ENDPOINTS.auth.login, { method: 'POST', body: data }),
    logout: () => apiFetch(API_ENDPOINTS.auth.logout, { method: 'POST' }),
    me: () => apiFetch(API_ENDPOINTS.auth.me),
  },

  employees: resource(API_ENDPOINTS.employees),
  departments: resource(API_ENDPOINTS.departments),
  documents: resource(API_ENDPOINTS.documents),
  schedules: resource(API_ENDPOINTS.schedules),
  materials: resource(API_ENDPOINTS.materials),
  materialTypes: resource(API_ENDPOINTS.materialTypes),
  reservations: resource(API_ENDPOINTS.reservations),
  reservationTypes: resource(API_ENDPOINTS.reservationTypes),
  jobTitles: resource(API_ENDPOINTS.jobTitles),
  employeeStatuses: resource(API_ENDPOINTS.employeeStatuses),

  oohSites: resource(API_ENDPOINTS.oohSites),
  oohSupports: resource(API_ENDPOINTS.oohSupports),
  oohEmplacements: resource(API_ENDPOINTS.oohEmplacements),
  oohAssets: resource(API_ENDPOINTS.oohAssets),
  oohPricingRules: resource(API_ENDPOINTS.oohPricingRules),
  oohCampaigns: resource(API_ENDPOINTS.oohCampaigns),
  oohCampaignLines: resource(API_ENDPOINTS.oohCampaignLines),
  oohTasks: resource(API_ENDPOINTS.oohTasks),

  packsCommerciaux: resource(API_ENDPOINTS.packsCommerciaux),
  optionsComplementaires: resource(API_ENDPOINTS.optionsComplementaires),
  contactMessages: resource(API_ENDPOINTS.contactMessages),
  campaignTypes: resource(API_ENDPOINTS.campaignTypes),
  campaignPrices: resource(API_ENDPOINTS.campaignPrices),
  communes: resource(API_ENDPOINTS.communes),
  quartiers: resource(API_ENDPOINTS.quartiers),
  pointsChauds: resource(API_ENDPOINTS.pointsChauds),
  transportRoutes: resource(API_ENDPOINTS.transportRoutes),
  routeCoordinates: resource(API_ENDPOINTS.routeCoordinates),
  agendaEvents: resource(API_ENDPOINTS.agendaEvents),
  notifications: resource(API_ENDPOINTS.notifications),
}
