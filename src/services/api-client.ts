import { API_ENDPOINTS } from '../config/api'
import { clearAccessToken, getAccessToken, setAccessToken } from '../lib/auth-session'

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type ApiFetchOptions = Omit<RequestInit, 'body' | 'method'> & {
  method?: ApiMethod
  body?: unknown
  skipAuthRefresh?: boolean
  suppressAuthFailure?: boolean
}

type RefreshPayload = {
  data?: {
    access_token?: string
  }
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

let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(API_ENDPOINTS.auth.refresh, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    })
      .then(async (response) => {
        if (!response.ok) return false
        const payload = await response.json() as RefreshPayload
        const token = payload.data?.access_token
        if (!token) return false
        setAccessToken(token)
        return true
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

function expireSession() {
  clearAccessToken()
  window.dispatchEvent(new Event('onekana:auth-expired'))
  if (!window.location.pathname.startsWith('/login')) {
    window.location.assign('/login')
  }
}

async function request(url: string, options: ApiFetchOptions, allowRetry: boolean) {
  const token = getAccessToken()
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
    credentials: 'include',
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 401 && allowRetry && !options.skipAuthRefresh && await refreshAccessToken()) {
    return request(url, options, false)
  }

  return response
}

export async function apiFetch<T>(url: string, options: ApiFetchOptions = {}): Promise<T> {
  const response = await request(url, options, true)

  if (!response.ok) {
    if (response.status === 401 && !options.suppressAuthFailure) {
      expireSession()
    }
    const errorPayload = await response.json().catch(() => null)
    const message = errorPayload?.message || errorPayload?.error || `Service indisponible (${response.status})`
    throw new ApiError(response.status, response.statusText, message)
  }

  if (response.status === 204) {
    return null as T
  }

  return response.json() as Promise<T>
}

export async function apiDownload(url: string): Promise<Blob> {
  const response = await request(url, { method: 'GET' }, true)
  if (!response.ok) {
    if (response.status === 401) expireSession()
    throw new ApiError(response.status, response.statusText, 'Document indisponible.')
  }
  return response.blob()
}

export function unwrapApiData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}
