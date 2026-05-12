import type { AuthUser, ModuleKey, Permission } from '../types/auth'

export type AccessRequirement = {
  permission?: Permission
  permissions?: Permission[]
  moduleKey?: ModuleKey
}

export function can(user: AuthUser, permission?: Permission) {
  if (!permission) return true
  if (user.permissions.includes('*')) return true
  return user.permissions.includes(permission)
}

export function canAny(user: AuthUser, permissions: Permission[] = []) {
  if (permissions.length === 0) return true
  if (user.permissions.includes('*')) return true
  return permissions.some((permission) => user.permissions.includes(permission))
}

export function canModule(user: AuthUser, moduleKey?: ModuleKey) {
  if (!moduleKey) return true
  if (user.permissions.includes('*')) return true
  return user.modules.includes(moduleKey) || user.tenant?.modules?.includes(moduleKey) || false
}

export function hasAccess(user: AuthUser, requirement: AccessRequirement = {}) {
  return canModule(user, requirement.moduleKey)
    && can(user, requirement.permission)
    && canAny(user, requirement.permissions)
}
