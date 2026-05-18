export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type ApiFetchOptions = Omit<RequestInit, 'body' | 'method'> & {
  method?: ApiMethod
  body?: unknown
}

export class ApiError extends Error {
  status: number
  statusText: string

  constructor(status: number, statusText: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
  }
}

export async function apiFetch<T>(url: string, options: ApiFetchOptions = {}): Promise<T> {
  const token = getAuthToken()
  const headers = new Headers(options.headers)

  headers.set('Accept', 'application/json')
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(url, {
    ...options,
    method: options.method || 'GET',
    headers,
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken()
      window.dispatchEvent(new Event('onekana:auth-expired'))
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }

    const errorPayload = await response.json().catch(() => null)
    const message = errorPayload?.message || errorPayload?.error || `Erreur API ${response.status}`
    throw new ApiError(response.status, response.statusText, message)
  }

  if (response.status === 204) {
    return null as T
  }

  return response.json() as Promise<T>
}

export function unwrapApiData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}
import { clearAuthToken, getAuthToken } from '../lib/session-storage'

