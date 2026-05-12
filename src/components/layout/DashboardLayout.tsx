import React from 'react'
import { useAuth } from '../../hooks/use-auth'
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
import { NavLink } from 'react-router-dom'
import { Button } from '../ui/button'
import { OnboardingGuide } from '../app/OnboardingGuide'
import { RightSideBar } from '../app/RightSideBar'
import { hasAccess } from '../../lib/access-control'
import type { AccessRequirement } from '../../lib/access-control'
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
    label: 'Ventes OOH',
    items: [
      { icon: Mail, label: 'Demandes clients', path: '/demandes', moduleKey: 'sales', permission: 'sales.view' },
      { icon: PackageCheck, label: 'Packs commerciaux', path: '/packs', moduleKey: 'sales', permission: 'sales.view' },
      { icon: Megaphone, label: 'Campagnes', path: '/campaigns', moduleKey: 'sales', permission: 'sales.view' },
      { icon: MapPin, label: 'Inventaire publicitaire', path: '/inventory', moduleKey: 'inventory', permission: 'inventory.view' },
    ],
  },
  {
    label: 'Gestion interne',
    items: [
      { icon: Users, label: 'Equipe', path: '/employees', moduleKey: 'team', permission: 'team.view' },
      { icon: Package, label: 'Materiels', path: '/materials', moduleKey: 'operations', permission: 'operations.view' },
      { icon: FileText, label: 'Documents', path: '/documents', moduleKey: 'operations', permission: 'operations.view' },
      { icon: Calendar, label: 'Horaires', path: '/schedules', moduleKey: 'operations', permission: 'operations.view' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { icon: Landmark, label: 'Comptabilité OHADA', path: '/accounting', moduleKey: 'finance', permission: 'finance.view' },
      { icon: Wallet, label: 'Onekana Wallet', path: '/wallet', moduleKey: 'finance', permission: 'finance.view' },
      { icon: ReceiptText, label: 'Factures & Paiements', path: '/invoices', moduleKey: 'finance', permission: 'finance.view' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { icon: Building2, label: 'Departements', path: '/departments', moduleKey: 'administration', permission: 'administration.view' },
      { icon: BookMarked, label: 'Reservations agences', path: '/reservations', moduleKey: 'sales', permission: 'sales.view' },
      { icon: Settings, label: 'Parametres', path: '/settings', moduleKey: 'settings', permission: 'settings.manage' },
    ],
  },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const visibleGroups = menuGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => hasAccess(user, item)) }))
    .filter((group) => group.items.length > 0)
  const visibleItems = visibleGroups.flatMap((group) => group.items)

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <Sidebar className="border-r border-white/10 bg-[#111111] text-white">
          <SidebarHeader className="border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <img src="/logo-1.png" alt="ONEKANA" className="h-10 w-auto shrink-0" />
              <div className="min-w-0">
                <span className="block text-sm font-black uppercase tracking-wide text-white">Back Office</span>
                <span className="block text-[11px] font-semibold uppercase text-[#ffd026]">
                  Regie & operations
                </span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2">
            {visibleGroups.map((group) => (
              <div key={group.label} className="mb-4">
                <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-wide text-[#ffd026]">
                  {group.label}
                </div>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.path}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                              isActive
                                ? 'bg-[#e31317] text-white'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }`
                          }
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="font-medium">{item.label}</span>
                          {window.location.pathname === item.path && (
                            <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>
            ))}
          </SidebarContent>
          <div className="mt-auto space-y-4 border-t border-white/10 p-4">
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffd026] font-black text-[#111111]">
                {user.displayName[0] || 'U'}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-white">{user.displayName}</span>
                <span className="truncate text-xs text-white/55">{user.tenant?.name || user.email}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => logout()}
            >
              <LogOut className="h-5 w-5" />
              <span>Deconnexion</span>
            </Button>
          </div>
        </Sidebar>
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
          <header className="z-10 flex h-16 items-center justify-between border-b border-border bg-white/85 px-6 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-lg font-black uppercase tracking-wide">
                {visibleItems.find((item) => item.path === window.location.pathname)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-bold uppercase text-primary sm:flex">
              {user.tenant?.name || 'ONEKANA'} interne
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
          </main>
        </SidebarInset>
        <RightSideBar />
        <OnboardingGuide />
      </div>
    </SidebarProvider>
  )
}
