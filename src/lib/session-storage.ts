const TOKEN_KEY = 'token'
const TOUR_KEY = 'onekana:tour:v2'

export type TourState = 'not_asked' | 'accepted' | 'later' | 'disabled' | 'done'

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getTourState(): TourState {
  const value = localStorage.getItem(TOUR_KEY) as TourState | null
  return value || 'not_asked'
}

export function setTourState(state: TourState) {
  localStorage.setItem(TOUR_KEY, state)
}

export function clearLegacyTourState() {
  localStorage.removeItem('onekana:tour:v1')
}

