import { API_ENDPOINTS } from '../config/api'
import type { GeographicEntityType, GeographicReview, GeographicReviewStatus } from '../types/geography'
import { apiFetch, unwrapApiData } from './api-client'

export const geographicReviewsApi = {
  async list(entityType?: GeographicEntityType) {
    const query = entityType ? `?entity_type=${encodeURIComponent(entityType)}` : ''
    return unwrapApiData<GeographicReview[]>(await apiFetch(`${API_ENDPOINTS.geographicReviews}${query}`))
  },

  async save(entityType: GeographicEntityType, externalId: string, data: { status: GeographicReviewStatus; note?: string }) {
    return unwrapApiData<GeographicReview>(await apiFetch(
      `${API_ENDPOINTS.geographicReviews}/${entityType}/${encodeURIComponent(externalId)}`,
      { method: 'PUT', body: data },
    ))
  },
}
