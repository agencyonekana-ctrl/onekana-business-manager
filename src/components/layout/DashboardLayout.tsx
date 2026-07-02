import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BookMarked,
  Building2,
  Calendar,
  ChevronRight,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Package,
  PackageCheck,
  ReceiptText,
  Settings,
  Users,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../../hooks/use-auth'
import { hasAccess } from '../../lib/access-control'
import type { AccessRequirement } from '../../lib/access-control'
import { Button } from '../ui/button'
import { OnboardingGuide } from '../app/OnboardingGuide'
import { RightSideBar } from '../app/RightSideBar'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '../ui/sidebar'

type MenuItem = AccessRequirement & {
  icon: React.ElementType
  label: string
  path: string
}

type MenuGroup = {
  label: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    label: 'Accueil',
    items: [
      { icon: LayoutDashboard, label: 'Tableau de bord', path: '/', moduleKey: 'dashboard', permission: 'dashboard.view' },
    ],
  },
  {
    label: 'Administration commerciale',
    items: [
      { icon: Mail, label: 'Demandes clients', path: '/demandes', moduleKey: 'sales', permission: 'sales.view' },
      { icon: Megaphone, label: 'Campagnes', path: '/campaigns', moduleKey: 'sales', permission: 'sales.view' },
      { icon: PackageCheck, label: 'Packs commerciaux', path: '/packs', moduleKey: 'sales', permission: 'sales.view' },
      { icon: BookMarked, label: 'Reservations agences', path: '/reservations', moduleKey: 'sales', permission: 'sales.view' },
    ],
  },
  {
    label: 'Administration OOH',
    items: [
      { icon: MapPin, label: 'Inventaire publicitaire', path: '/inventory', moduleKey: 'inventory', permission: 'inventory.view' },
      { icon: FileText, label: 'Documents', path: '/documents', moduleKey: 'operations', permission: 'operations.view' },
    ],
  },
  {
    label: 'Administration interne',
    items: [
      { icon: Users, label: 'Equipe', path: '/employees', moduleKey: 'team', permission: 'team.view' },
      { icon: Package, label: 'Materiels', path: '/materials', moduleKey: 'operations', permission: 'operations.view' },
      { icon: Calendar, label: 'Horaires', path: '/schedules', moduleKey: 'operations', permission: 'operations.view' },
      { icon: Building2, label: 'Departements', path: '/departments', moduleKey: 'administration', permission: 'administration.view' },
    ],
  },
  {
    label: 'Finance & controle',
    items: [
      { icon: ReceiptText, label: 'Factures & Paiements', path: '/invoices', moduleKey: 'finance', permission: 'finance.view' },
      { icon: Wallet, label: 'Onekana Wallet', path: '/wallet', moduleKey: 'finance', permission: 'finance.view' },
      { icon: Landmark, label: 'Comptabilite OHADA', path: '/accounting', moduleKey: 'finance', permission: 'finance.view' },
    ],
  },
  {
    label: 'Systeme',
    items: [
      { icon: Settings, label: 'Parametres', path: '/settings', moduleKey: 'settings', permission: 'settings.manage' },
    ],
  },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  if (!user) {
    return null
  }

  function isActivePath(path: string) {
    return path === '/' ? location.pathname === '/' : location.pathname === path
  }

  const visibleGroups = menuGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => hasAccess(user, item)) }))
    .filter((group) => group.items.length > 0)
  const visibleItems = visibleGroups.flatMap((group) => group.items)
  const activeItem = visibleItems.find((item) => isActivePath(item.path))

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <Sidebar className="border-r border-white/10 bg-[#151313] text-white shadow-2xl">
          <SidebarHeader className="border-b border-white/10 p-4">
            <div className="flex flex-col gap-3">
              <div className="flex h-14 w-full items-center rounded-2xl border border-white/10 bg-white px-3 py-2 shadow-sm">
                <img src="/logo%20onekana.png" alt="ONEKANA" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0 px-1">
                <span className="block text-sm font-black uppercase tracking-wide text-white">Centre admin ONEKANA</span>
                <span className="block text-[11px] font-semibold uppercase text-primary">Pilotage interne</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2">
            {visibleGroups.map((group) => (
              <div key={group.label} className="mb-4">
                <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-wide text-white/50">
                  {group.label}
                </div>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.path} className="block">
                          {(() => {
                            const active = isActivePath(item.path)
                            return (
                              <span
                                className={`relative flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                                  active
                                    ? 'border-white/10 bg-white/[0.08] text-white shadow-sm'
                                    : 'border-transparent text-white/78 hover:border-white/10 hover:bg-white/[0.06] hover:text-white'
                                }`}
                              >
                                {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />}
                                <span className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                                  active ? 'bg-primary/15 text-primary' : 'bg-white/[0.07] text-white/78'
                                }`}>
                                  <item.icon className="h-4 w-4" />
                                </span>
                                <span className="font-semibold">{item.label}</span>
                                {active && <ChevronRight className="ml-auto h-4 w-4 text-primary" />}
                              </span>
                            )
                          })()}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>
            ))}
          </SidebarContent>
          <div className="mt-auto space-y-4 border-t border-white/10 p-4">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-black text-white shadow-lg shadow-primary/15">
                {user.displayName[0] || 'U'}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-white">{user.displayName}</span>
                <span className="truncate text-xs text-white/65">{user.tenant?.name || user.email}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 rounded-xl text-white/78 hover:bg-white/[0.06] hover:text-white"
              onClick={() => logout()}
            >
              <LogOut className="h-5 w-5" />
              <span>Deconnexion</span>
            </Button>
          </div>
        </Sidebar>
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
          <header className="z-10 flex h-16 items-center justify-between border-b border-border bg-white/90 px-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-base font-black uppercase tracking-wide">
                {activeItem?.label || 'Tableau de bord'}
              </h1>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <div className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-bold uppercase text-primary">
                {user.tenant?.name || 'ONEKANA'}
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-[#f7f7f7] p-5 sm:p-6">
            <div className="mx-auto max-w-7xl animate-fade-in pb-20">{children}</div>
          </main>
        </SidebarInset>
        <RightSideBar />
        <OnboardingGuide />
      </div>
    </SidebarProvider>
  )
}
