import { describe, expect, it } from 'vitest'
import { clearLegacyAuthToken, getTourState, setTourState } from './session-storage'

describe('UI session preferences', () => {
  it('persists only the onboarding preference', () => {
    expect(getTourState()).toBe('not_asked')
    setTourState('disabled')
    expect(getTourState()).toBe('disabled')
  })

  it('removes a legacy access token from local storage', () => {
    localStorage.setItem('token', 'legacy-secret')
    clearLegacyAuthToken()
    expect(localStorage.getItem('token')).toBeNull()
  })
})
