import { remoteApi } from '../services/remote-api'
import type { ApiTable, QueryOptions, StorageUploadResult } from '../types/api'
import { getAuthToken } from './session-storage'

type RemoteResource = {
  list?: () => Promise<any[]>
  get?: (id: string) => Promise<any>
  create?: (data: any) => Promise<any>
  update?: (id: string, data: any) => Promise<any>
  delete?: (id: string) => Promise<any>
}

function filterRows<T extends Record<string, any>>(rows: T[], options: QueryOptions = {}) {
  const filtered = options.where
    ? rows.filter((row) => Object.entries(options.where || {}).every(([key, value]) => row[key] === value))
    : rows

  const order = options.orderBy && Object.entries(options.orderBy)[0]
  if (!order) return filtered

  const [field, direction] = order
  return [...filtered].sort((a, b) => {
    const av = String(a[field] ?? '')
    const bv = String(b[field] ?? '')
    return direction === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv)
  })
}

function normalizeId(row: any) {
  if (!row || typeof row !== 'object') return row
  return {
    ...row,
    id: String(row.id ?? row.uuid ?? row.campaign_id ?? row.pack_id ?? row.message_id ?? ''),
  }
}

function apiTable(remote: RemoteResource): ApiTable {
  return {
    async list<T = any>(options: QueryOptions = {}): Promise<T[]> {
      if (!remote.list) return []
      const rows = (await remote.list()).map(normalizeId)
      return filterRows(rows, options) as T[]
    },
    async get<T = any>(id: string): Promise<T | null> {
      if (!remote.get) return null
      return normalizeId(await remote.get(id)) as T
    },
    async count(options: QueryOptions = {}) {
      const rows = await this.list(options)
      return rows.length
    },
    async create<T = any>(data: any): Promise<T> {
      if (!remote.create) throw new Error('Create endpoint is not configured for this resource.')
      return normalizeId(await remote.create(data)) as T
    },
    async update<T = any>(id: string, data: any): Promise<T | null> {
      if (!remote.update) throw new Error('Update endpoint is not configured for this resource.')
      return normalizeId(await remote.update(id, data)) as T
    },
    async delete(id: string) {
      if (!remote.delete) throw new Error('Delete endpoint is not configured for this resource.')
      return remote.delete(id)
    },
  }
}

const db = Object.fromEntries(
  Object.entries(remoteApi)
    .filter(([key]) => key !== 'baseUrl' && key !== 'auth')
    .map(([key, resource]) => [key, apiTable(resource as RemoteResource)])
) as Record<string, ApiTable>

export const dataClient = {
  db,
  storage: {
    async upload(file: File, path: string): Promise<StorageUploadResult> {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('path', path)

      const token = getAuthToken()
      const response = await fetch(`${remoteApi.baseUrl}/uploads`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload API error ${response.status}`)
      }

      const payload = await response.json()
      const data = payload?.data ?? payload

      return {
        path: data.path ?? path,
        publicUrl: data.publicUrl ?? data.public_url ?? data.url,
      }
    },
  },
}
