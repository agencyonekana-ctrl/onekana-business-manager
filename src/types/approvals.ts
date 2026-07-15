export type ApprovalStatus = 'pending' | 'in_review' | 'needs_information' | 'approved' | 'rejected' | 'archived'
export type ApprovalPriority = 'low' | 'normal' | 'high' | 'urgent'
export type ApprovalResourceType = 'agency_user' | 'agency_contact' | 'agency_request' | 'agency_campaign' | 'document'

export type ApprovalCase = {
  id: string
  subjectId: string
  sourceSystem: 'agency' | 'internal' | string
  resourceType: ApprovalResourceType
  externalId: string
  title: string
  subtitle?: string | null
  companyExternalId?: string | null
  companyName?: string | null
  snapshot: Record<string, unknown>
  status: ApprovalStatus
  priority: ApprovalPriority
  assignedTo?: string | null
  assigneeName?: string | null
  dueAt?: string | null
  decisionReason?: string | null
  syncStatus: 'local_only' | 'pending' | 'synced' | 'failed'
  version: number
  decidedBy?: string | null
  decidedAt?: string | null
  createdAt: string
  updatedAt: string
  comments?: ApprovalComment[]
  events?: ApprovalEvent[]
}

export type ApprovalComment = { id: string; caseId: string; userId: string; userName?: string; body: string; createdAt: string }
export type ApprovalEvent = { id: string; caseId: string; userId?: string | null; userName?: string | null; type: string; reason?: string | null; createdAt: string }

export type ApprovalOverview = {
  counts: Record<ApprovalStatus, number>
  byResource: Record<ApprovalResourceType, number>
  urgent: number
  overdue: number
  workload: Array<{ userId: string; name: string; total: number }>
  recentDecisions: Array<{ id: string; caseId: string; title: string; userName?: string | null; reason?: string | null; createdAt: string }>
  lastImportAt?: string | null
  unavailable: string[]
}

export type ApprovalAssignee = { id: string; displayName: string; name: string; email: string; isActive?: boolean }
export type ApprovalListResponse = { data: ApprovalCase[]; meta: { current_page: number; per_page: number; total: number; last_page: number } }
export type ApprovalSettings = {
  requestDueHours: number
  campaignDueHours: number
  userDueHours: number
  documentDueHours: number
  importSinceDays: number
  lastImportAt?: string | null
  importUnavailable?: string[]
}
