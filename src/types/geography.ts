export type GeographicEntityType = 'commune' | 'point_chaud' | 'trajet'
export type GeographicReviewStatus = 'to_review' | 'verified'

export type AgencyCommune = {
  id: string
  name: string
  population?: number
  description?: string
}

export type AgencyHotspot = {
  id: string
  name: string
  transportType?: string
  longitude?: number
  latitude?: number
  attendance?: number
  district?: string
}

export type AgencyRoute = {
  id: string
  name: string
  startLat?: number
  startLng?: number
  endLat?: number
  endLng?: number
  lineCoordinates?: string
  distanceKm?: number
  durationMinutes?: number
  transportMode?: string
  createdAt?: string
}

export type GeographicReview = {
  id: string
  entityType: GeographicEntityType
  externalId: string
  status: GeographicReviewStatus
  note?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  updatedAt?: string | null
}
