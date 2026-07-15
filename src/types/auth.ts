export type ModuleKey =
  | 'dashboard'
  | 'sales'
  | 'inventory'
  | 'team'
  | 'operations'
  | 'finance'
  | 'administration'
  | 'settings'
  | 'approvals'

export type Permission =
  | '*'
  | 'dashboard.view'
  | 'sales.view'
  | 'sales.manage'
  | 'inventory.view'
  | 'inventory.manage'
  | 'team.view'
  | 'team.manage'
  | 'operations.view'
  | 'finance.view'
  | 'finance.manage'
  | 'administration.view'
  | 'settings.manage'
  | string

export type Tenant = {
  id: string
  name: string
  slug?: string
  plan?: string
  modules?: ModuleKey[]
}

export type AuthUser = {
  id: string
  displayName: string
  email: string
  tenant?: Tenant
  roles: string[]
  permissions: Permission[]
  modules: ModuleKey[]
  isActive?: boolean
}

export type AdminRole = {
  id: string
  name: string
  key: string
}
