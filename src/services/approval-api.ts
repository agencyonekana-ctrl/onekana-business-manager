import { API_ENDPOINTS, resourceActionEndpoint, resourceEndpoint } from '../config/api'
import { apiFetch, unwrapApiData } from './api-client'
import type { ApprovalAssignee, ApprovalCase, ApprovalListResponse, ApprovalOverview, ApprovalPriority, ApprovalResourceType, ApprovalSettings, ApprovalStatus } from '../types/approvals'

export type ApprovalFilters = {
  q?: string
  status?: ApprovalStatus | 'all'
  priority?: ApprovalPriority | 'all'
  resourceType?: ApprovalResourceType | 'all'
  assignedTo?: string | 'all'
  overdue?: boolean
  open?: boolean
  page?: number
  perPage?: number
}

function queryString(filters: ApprovalFilters = {}) {
  const query = new URLSearchParams()
  if (filters.q) query.set('q', filters.q)
  if (filters.status && filters.status !== 'all') query.set('status', filters.status)
  if (filters.priority && filters.priority !== 'all') query.set('priority', filters.priority)
  if (filters.resourceType && filters.resourceType !== 'all') query.set('resource_type', filters.resourceType)
  if (filters.assignedTo && filters.assignedTo !== 'all') query.set('assigned_to', filters.assignedTo)
  if (filters.overdue) query.set('overdue', '1')
  if (filters.open) query.set('open', '1')
  if (filters.page) query.set('page', String(filters.page))
  if (filters.perPage) query.set('per_page', String(filters.perPage))
  const value = query.toString()
  return value ? `?${value}` : ''
}

export const approvalApi = {
  overview: async () => unwrapApiData<ApprovalOverview>(await apiFetch(API_ENDPOINTS.approvals.overview)),
  list: (filters?: ApprovalFilters) => apiFetch<ApprovalListResponse>(`${API_ENDPOINTS.approvals.cases}${queryString(filters)}`),
  get: async (id: string) => unwrapApiData<ApprovalCase>(await apiFetch(resourceEndpoint(API_ENDPOINTS.approvals.cases, id))),
  create: async (data: { resourceType: ApprovalResourceType; externalId: string; title: string; subtitle?: string; companyName?: string; sourceSystem?: string; snapshot?: Record<string, unknown>; priority?: ApprovalPriority }) => unwrapApiData<ApprovalCase>(await apiFetch(API_ENDPOINTS.approvals.cases, { method: 'POST', body: data })),
  update: async (id: string, data: { version: number; priority?: ApprovalPriority; assignedTo?: string | null; dueAt?: string | null }) => unwrapApiData<ApprovalCase>(await apiFetch(resourceEndpoint(API_ENDPOINTS.approvals.cases, id), { method: 'PATCH', body: data })),
  transition: async (id: string, data: { version: number; status: ApprovalStatus; reason?: string }) => unwrapApiData<ApprovalCase>(await apiFetch(resourceActionEndpoint(API_ENDPOINTS.approvals.cases, id, 'transition'), { method: 'POST', body: data })),
  addComment: (id: string, body: string) => apiFetch(resourceActionEndpoint(API_ENDPOINTS.approvals.cases, id, 'comments'), { method: 'POST', body: { body } }),
  import: () => apiFetch(API_ENDPOINTS.approvals.import, { method: 'POST' }),
  assignees: async () => unwrapApiData<ApprovalAssignee[]>(await apiFetch(API_ENDPOINTS.approvals.assignees)),
  settings: async () => unwrapApiData<ApprovalSettings>(await apiFetch(API_ENDPOINTS.approvals.settings)),
  updateSettings: async (data: Pick<ApprovalSettings, 'requestDueHours' | 'campaignDueHours' | 'userDueHours' | 'documentDueHours' | 'importSinceDays'>) => unwrapApiData<ApprovalSettings>(await apiFetch(API_ENDPOINTS.approvals.settings, { method: 'PUT', body: data })),
  findByResource: async (resourceType: ApprovalResourceType, externalId: string) => {
    const response = await approvalApi.list({ resourceType, q: externalId, perPage: 100 })
    return response.data.find((item) => item.resourceType === resourceType && item.externalId === externalId) ?? null
  },
}
