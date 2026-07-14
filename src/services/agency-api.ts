import { API_ENDPOINTS } from '../config/api'
import { apiFetch, unwrapApiData } from './api-client'
import type { AgencyCommune, AgencyHotspot, AgencyRoute } from '../types/geography'

export type AgencySummary = {
  users?: number
  campaigns?: number
  contacts?: number
  communes?: number
  pointsChauds?: number
  trajets?: number
}

export type AgencyUser = {
  id: string
  name: string
  email: string
  company?: string
  role?: string
  active?: boolean
}

export type AgencyContactMessage = {
  id: string
  name: string
  email: string
  subject?: string
  message: string
  status?: string
  createdAt?: string
  created_at?: string
  raw: Record<string, any>
}

function firstValue(value: unknown): string {
  if (Array.isArray(value)) {
    return String(value[0] ?? '')
  }

  return String(value ?? '')
}

function contactStatus(contact: Record<string, any>) {
  const step = String(contact.etape_achat || contact.etape || '').toLowerCase()
  return step && step !== 'prospect' ? 'handled' : 'new'
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function normalizeAgencyUser(user: Record<string, any>): AgencyUser {
  const firstName = String(user.first_name || user.firstName || '').trim()
  const lastName = String(user.last_name || user.lastName || '').trim()
  const name = [firstName, lastName].filter(Boolean).join(' ')

  return {
    id: String(user.user_id ?? user.id ?? ''),
    name: name || String(user.name || 'Utilisateur sans nom'),
    email: String(user.email || ''),
    company: user.company ? String(user.company) : undefined,
    role: user.role ? String(user.role) : undefined,
    active: user.is_active === undefined ? undefined : Boolean(Number(user.is_active)),
  }
}

function normalizeCommune(row: Record<string, any>): AgencyCommune {
  return {
    id: String(row.id ?? ''),
    name: String(row.nom ?? row.name ?? 'Commune sans nom'),
    population: optionalNumber(row.population),
    description: row.description ? String(row.description) : undefined,
  }
}

function normalizeHotspot(row: Record<string, any>): AgencyHotspot {
  return {
    id: String(row.id ?? ''),
    name: String(row.nom_point ?? row.name ?? 'Point chaud sans nom'),
    transportType: row.type_transport ? String(row.type_transport) : undefined,
    longitude: optionalNumber(row.longitude),
    latitude: optionalNumber(row.latitude),
    attendance: optionalNumber(row.frequentation),
    district: row.quartier ? String(row.quartier) : undefined,
  }
}

function normalizeRoute(row: Record<string, any>): AgencyRoute {
  return {
    id: String(row.id ?? ''),
    name: String(row.nom_trajet ?? row.name ?? 'Trajet sans nom'),
    startLat: optionalNumber(row.start_lat),
    startLng: optionalNumber(row.start_lng),
    endLat: optionalNumber(row.end_lat),
    endLng: optionalNumber(row.end_lng),
    lineCoordinates: row.line_coordinates ? String(row.line_coordinates) : undefined,
    distanceKm: optionalNumber(row.distance_km),
    durationMinutes: optionalNumber(row.duree_minutes),
    transportMode: row.transport_mode ? String(row.transport_mode) : undefined,
    createdAt: row.created_at ? String(row.created_at) : undefined,
  }
}

export function normalizeAgencyContact(contact: Record<string, any>): AgencyContactMessage {
  const company = String(contact.company_name || contact.company || '')
  const person = String(contact.contact_person || contact.name || '')

  return {
    id: String(contact.id ?? contact.contact_id ?? ''),
    name: person || company || 'Contact sans nom',
    email: firstValue(contact.emails || contact.email),
    subject: contact.support_solicited || contact.fonction || company || 'Demande client',
    message: contact.notes || contact.survival_action || contact.description || 'Aucun message detaille.',
    status: contactStatus(contact),
    createdAt: contact.created_at,
    created_at: contact.created_at,
    raw: contact,
  }
}

export const agencyApi = {
  summary: async () => unwrapApiData<AgencySummary>(await apiFetch(API_ENDPOINTS.agency.summary)),

  users: {
    list: async () => unwrapApiData<Record<string, any>[]>(await apiFetch(API_ENDPOINTS.agency.users)).map(normalizeAgencyUser),
  },

  contacts: {
    list: async () => {
      const rows = unwrapApiData<Record<string, any>[]>(await apiFetch(API_ENDPOINTS.agency.contacts))
      return rows.map(normalizeAgencyContact)
    },
  },

  campaigns: {
    list: async <T = any>() => unwrapApiData<T[]>(await apiFetch(API_ENDPOINTS.agency.campaigns)),
  },

  geographic: {
    communes: async () => unwrapApiData<Record<string, any>[]>(await apiFetch(API_ENDPOINTS.agency.communes)).map(normalizeCommune),
    pointsChauds: async () => unwrapApiData<Record<string, any>[]>(await apiFetch(API_ENDPOINTS.agency.pointsChauds)).map(normalizeHotspot),
    trajets: async () => unwrapApiData<Record<string, any>[]>(await apiFetch(API_ENDPOINTS.agency.trajets)).map(normalizeRoute),
  },
}
