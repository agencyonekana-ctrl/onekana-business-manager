export type MediaEntityType = 'ooh_site' | 'ooh_support' | 'ooh_emplacement' | 'material'

export type EntityMedia = {
  id: string
  entityType: MediaEntityType
  entityId: string
  path: string
  publicUrl: string
  mimeType: string
  altText?: string | null
  isCover: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}
