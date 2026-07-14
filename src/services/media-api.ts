import { API_ENDPOINTS } from '../config/api'
import type { EntityMedia, MediaEntityType } from '../types/media'
import { apiFetch, unwrapApiData } from './api-client'

function mediaUrl(entityType: MediaEntityType, entityId?: string) {
  const params = new URLSearchParams({ entity_type: entityType })
  if (entityId) params.set('entity_id', entityId)
  return `${API_ENDPOINTS.media}?${params.toString()}`
}

export const mediaApi = {
  async list(entityType: MediaEntityType, entityId?: string) {
    return unwrapApiData<EntityMedia[]>(await apiFetch(mediaUrl(entityType, entityId)))
  },

  async upload(entityType: MediaEntityType, entityId: string, file: File, altText: string, isCover = false) {
    const body = new FormData()
    body.append('entityType', entityType)
    body.append('entityId', entityId)
    body.append('altText', altText)
    body.append('isCover', String(isCover))
    body.append('file', file)

    return unwrapApiData<EntityMedia>(await apiFetch(API_ENDPOINTS.media, { method: 'POST', body }))
  },

  async update(id: string, data: Partial<Pick<EntityMedia, 'altText' | 'isCover' | 'sortOrder'>>) {
    return unwrapApiData<EntityMedia>(await apiFetch(`${API_ENDPOINTS.media}/${id}`, { method: 'PATCH', body: data }))
  },

  remove(id: string) {
    return apiFetch(`${API_ENDPOINTS.media}/${id}`, { method: 'DELETE' })
  },
}
