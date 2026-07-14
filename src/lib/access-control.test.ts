import { describe, expect, it } from 'vitest'
import { can, canAny, canModule, hasAccess } from './access-control'
import type { AuthUser } from '../types/auth'

const user: AuthUser = {
  id: '1',
  displayName: 'Admin',
  email: 'admin@example.test',
  roles: ['admin'],
  permissions: ['dashboard.view', 'inventory.view'],
  modules: ['dashboard', 'inventory'],
}

describe('access control', () => {
  it('requires both the module and permission', () => {
    expect(hasAccess(user, { moduleKey: 'inventory', permission: 'inventory.view' })).toBe(true)
    expect(hasAccess(user, { moduleKey: 'finance', permission: 'finance.view' })).toBe(false)
  })

  it('supports any permission and wildcard administrators', () => {
    expect(canAny(user, ['sales.view', 'inventory.view'])).toBe(true)
    expect(can(user, 'sales.view')).toBe(false)
    expect(can({ ...user, permissions: ['*'] }, 'finance.manage')).toBe(true)
  })

  it('denies anonymous users', () => {
    expect(canModule(null, 'dashboard')).toBe(false)
    expect(hasAccess(null)).toBe(false)
  })
})
