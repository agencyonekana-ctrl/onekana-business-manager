import { API_BASE_URL, API_ENDPOINTS, resourceActionEndpoint, resourceEndpoint } from '../config/api'
import { apiFetch, unwrapApiData } from './api-client'

function resource(url: string) {
  return {
    list: async <T = any>() => unwrapApiData<T[]>(await apiFetch(resourceEndpoint(url))),
    get: async <T = any>(id: string) => unwrapApiData<T>(await apiFetch(resourceEndpoint(url, id))),
    create: async <T = any>(data: unknown) => unwrapApiData<T>(await apiFetch(resourceEndpoint(url), { method: 'POST', body: data })),
    update: async <T = any>(id: string, data: unknown) => unwrapApiData<T>(await apiFetch(resourceEndpoint(url, id), { method: 'PUT', body: data })),
    delete: (id: string) => apiFetch(resourceEndpoint(url, id), { method: 'DELETE' }),
  }
}

export const remoteApi = {
  baseUrl: API_BASE_URL,

  auth: {
    register: (data: unknown) => apiFetch(API_ENDPOINTS.auth.register, { method: 'POST', body: data }),
    login: (data: unknown) => apiFetch(API_ENDPOINTS.auth.login, { method: 'POST', body: data, skipAuthRefresh: true, suppressAuthFailure: true }),
    refresh: () => apiFetch(API_ENDPOINTS.auth.refresh, { method: 'POST', skipAuthRefresh: true, suppressAuthFailure: true }),
    logout: () => apiFetch(API_ENDPOINTS.auth.logout, { method: 'POST', skipAuthRefresh: true, suppressAuthFailure: true }),
    me: () => apiFetch(API_ENDPOINTS.auth.me),
    forgotPassword: (data: { email: string }) => apiFetch(API_ENDPOINTS.auth.forgotPassword, { method: 'POST', body: data, skipAuthRefresh: true, suppressAuthFailure: true }),
    resetPassword: (data: { token: string, password: string }) => apiFetch(API_ENDPOINTS.auth.resetPassword, { method: 'POST', body: data, skipAuthRefresh: true, suppressAuthFailure: true }),
  },

  adminUsers: {
    list: async <T = any>() => unwrapApiData<T[]>(await apiFetch(API_ENDPOINTS.adminUsers)),
    create: async <T = any>(data: unknown) => unwrapApiData<T>(await apiFetch(API_ENDPOINTS.adminUsers, { method: 'POST', body: data })),
    update: async <T = any>(id: string, data: unknown) => unwrapApiData<T>(await apiFetch(resourceEndpoint(API_ENDPOINTS.adminUsers, id), { method: 'PATCH', body: data })),
    invite: (id: string) => apiFetch(resourceActionEndpoint(API_ENDPOINTS.adminUsers, id, 'invite'), { method: 'POST' }),
  },
  adminRoles: {
    list: async <T = any>() => unwrapApiData<T[]>(await apiFetch(API_ENDPOINTS.adminRoles)),
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
  notifications: {
    ...resource(API_ENDPOINTS.notifications),
    markRead: (id: string) => apiFetch(resourceActionEndpoint(API_ENDPOINTS.notifications, id, 'read'), { method: 'PUT' }),
  },
  roadmap: resource(API_ENDPOINTS.roadmap),

  accountingAccounts: resource(API_ENDPOINTS.accountingAccounts),
  accountingJournals: resource(API_ENDPOINTS.accountingJournals),
  accountingEntries: resource(API_ENDPOINTS.accountingEntries),
  accountingPeriods: resource(API_ENDPOINTS.accountingPeriods),
  accountingSettings: {
    get: async () => unwrapApiData(await apiFetch(API_ENDPOINTS.accountingSettings)),
    update: async (_id: string, data: unknown) => unwrapApiData(await apiFetch(API_ENDPOINTS.accountingSettings, { method: 'PUT', body: data })),
  },
  trialBalance: resource(API_ENDPOINTS.trialBalance),
  walletAccounts: resource(API_ENDPOINTS.walletAccounts),
  walletTransactions: resource(API_ENDPOINTS.walletTransactions),
  invoices: resource(API_ENDPOINTS.invoices),
  payments: resource(API_ENDPOINTS.payments),
  financeActions: {
    issueInvoice: async <T = any>(id: string) => unwrapApiData<T>(await apiFetch(resourceActionEndpoint(API_ENDPOINTS.invoices, id, 'issue'), { method: 'POST' })),
    reverseEntry: async <T = any>(id: string, reason: string) => unwrapApiData<T>(await apiFetch(resourceActionEndpoint(API_ENDPOINTS.accountingEntries, id, 'reverse'), { method: 'POST', body: { reason } })),
    closePeriod: async <T = any>(id: string) => unwrapApiData<T>(await apiFetch(resourceActionEndpoint(API_ENDPOINTS.accountingPeriods, id, 'close'), { method: 'POST' })),
  },
}
