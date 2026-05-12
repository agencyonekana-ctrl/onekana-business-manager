import type { AuthUser } from '../types/auth'

const localAdmin: AuthUser = {
  id: 'local-admin',
  displayName: 'Admin Onekana',
  email: 'admin@onekana.local',
  tenant: {
    id: 'tenant-onekana',
    name: 'ONEKANA',
    slug: 'onekana',
    modules: ['dashboard', 'sales', 'inventory', 'team', 'operations', 'finance', 'administration', 'settings'],
  },
  roles: ['super-admin'],
  permissions: ['*'],
  modules: ['dashboard', 'sales', 'inventory', 'team', 'operations', 'finance', 'administration', 'settings'],
}

export function useAuth() {
  return {
    user: localAdmin,
    loading: false,
    isAuthenticated: true,
    login: () => undefined,
    logout: () => undefined,
  }
}
