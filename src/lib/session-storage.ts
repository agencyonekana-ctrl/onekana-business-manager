const TOUR_KEY = 'onekana:tour:v2'

export type TourState = 'not_asked' | 'accepted' | 'later' | 'disabled' | 'done'

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

export function clearLegacyAuthToken() {
  localStorage.removeItem('token')
}

