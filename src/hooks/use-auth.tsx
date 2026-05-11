type FakeUser = {
  id: string
  displayName: string
  email: string
}

export function useAuth() {
  const user: FakeUser = {
    id: 'local-admin',
    displayName: 'Admin Onekana',
    email: 'admin@onekana.local',
  }

  return {
    user,
    loading: false,
    isAuthenticated: true,
    login: () => undefined,
    logout: () => undefined,
  }
}
