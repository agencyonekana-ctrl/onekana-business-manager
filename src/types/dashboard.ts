import type { ElementType } from 'react'

export type DashboardCampaign = {
  id: string
  name: string
  clientName: string
  startDate: string
  endDate: string
  status: string
}

export type DashboardStats = {
  newRequests: number
  activeCampaigns: number
  revenue: number
  occupancy: number
  availableEmplacements: number
  upcomingCampaigns: number
  documents: number
  unpaidInvoices: number
  connectedContacts: number
  connectedCampaigns: number
  geographicRecords: number
}

export type DashboardPriority = {
  label: string
  description: string
  value: number
  to: string
  icon: ElementType
  tone: 'urgent' | 'attention' | 'neutral'
}
