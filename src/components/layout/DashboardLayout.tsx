import { useEffect, useMemo, useState } from 'react'
import type { ElementType, ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Contact,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  MapPinned,
  Megaphone,
  Package,
  ReceiptText,
  Settings,
  Users,
  Wallet,
} from 'lucide-react'
import { OnboardingGuide } from '../app/OnboardingGuide'
import { PageTransition } from '../app/PageTransition'
import { RightSideBar } from '../app/RightSideBar'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
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
  useSidebar,
} from '../ui/sidebar'
import { useAuth } from '../../hooks/use-auth'
import { hasAccess } from '../../lib/access-control'
import type { AccessRequirement } from '../../lib/access-control'
import { getOpenNavigationGroup, setOpenNavigationGroup } from '../../lib/navigation-preferences'
import { featureFlags } from '../../config/features'

type MenuItem = AccessRequirement & {
  icon: ElementType
  label: string
  path: string
}

type MenuGroup = {
  id: string
  label: string
  items: MenuItem[]
}

const dashboardItem: MenuItem = { icon: LayoutDashboard, label: 'Tableau de bord', path: '/', moduleKey: 'dashboard', permission: 'dashboard.view' }

const menuGroups: MenuGroup[] = [
  {
    id: 'received',
    label: 'Activité reçue',
    items: [
      { icon: Contact, label: 'Contacts', path: '/contacts', moduleKey: 'sales', permission: 'sales.view' },
      { icon: Mail, label: 'Demandes clients', path: '/demandes', moduleKey: 'sales', permission: 'sales.view' },
      { icon: Megaphone, label: 'Campagnes reçues', path: '/campaigns', moduleKey: 'sales', permission: 'sales.view' },
      { icon: Users, label: 'Utilisateurs Agency', path: '/agency-users', moduleKey: 'sales', permission: 'sales.view' },
    ],
  },
  {
    id: 'ooh',
    label: 'Contrôle OOH',
    items: [
      ...(featureFlags.geography ? [{ icon: MapPinned, label: 'Territoires & mobilité', path: '/geography', moduleKey: 'inventory' as const, permission: 'inventory.view' }] : []),
      { icon: MapPin, label: 'Inventaire OOH', path: '/inventory', moduleKey: 'inventory', permission: 'inventory.view' },
      { icon: FileText, label: 'Documents', path: '/documents', moduleKey: 'operations', permission: 'operations.view' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance & contrôle',
    items: [
      { icon: ReceiptText, label: 'Factures & paiements', path: '/invoices', moduleKey: 'finance', permission: 'finance.view' },
      ...(featureFlags.advancedFinance ? [
        { icon: Wallet, label: 'Onekana Wallet', path: '/wallet', moduleKey: 'finance' as const, permission: 'finance.view' },
        { icon: Landmark, label: 'Comptabilité OHADA', path: '/accounting', moduleKey: 'finance' as const, permission: 'finance.view' },
      ] : []),
    ],
  },
  {
    id: 'organization',
    label: 'Organisation interne',
    items: [
      { icon: Users, label: 'Équipe', path: '/employees', moduleKey: 'team', permission: 'team.view' },
      { icon: Package, label: 'Parc interne', path: '/materials', moduleKey: 'team', permission: 'team.view' },
      { icon: Calendar, label: 'Horaires', path: '/schedules', moduleKey: 'operations', permission: 'operations.view' },
      { icon: Building2, label: 'Départements', path: '/departments', moduleKey: 'administration', permission: 'administration.view' },
    ],
  },
  {
    id: 'settings',
    label: 'Paramètres',
    items: [
      { icon: Settings, label: 'Paramètres', path: '/settings', moduleKey: 'settings', permission: 'settings.manage' },
    ],
  },
]

function matchesPath(currentPath: string, itemPath: string) {
  return itemPath === '/' ? currentPath === '/' : currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return null

  return (
    <SidebarProvider>
      <DashboardShell>{children}</DashboardShell>
    </SidebarProvider>
  )
}

function DashboardShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const { setOpenMobile } = useSidebar()
  const visibleGroups = useMemo(() => menuGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => hasAccess(user, item)) }))
    .filter((group) => group.items.length > 0), [user])
  const visibleDashboard = hasAccess(user, dashboardItem)
  const activeGroup = visibleGroups.find((group) => group.items.some((item) => matchesPath(location.pathname, item.path)))
  const activeItem = [dashboardItem, ...visibleGroups.flatMap((group) => group.items)].find((item) => matchesPath(location.pathname, item.path))
  const [openGroup, setOpenGroup] = useState<string | null>(() => getOpenNavigationGroup())

  useEffect(() => {
    if (activeGroup) {
      setOpenGroup(activeGroup.id)
      setOpenNavigationGroup(activeGroup.id)
    }
  }, [activeGroup?.id, location.pathname])

  if (!user) return null

  function toggleGroup(groupId: string) {
    const next = openGroup === groupId ? null : groupId
    setOpenGroup(next)
    setOpenNavigationGroup(next)
  }

  function closeMobileNavigation() {
    setOpenMobile(false)
  }

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar className="border-r border-white/10 bg-[#151313] text-white shadow-xl">
        <SidebarHeader className="border-b border-white/10 p-3">
          <div className="flex h-12 items-center rounded-lg border border-white/10 bg-white px-3 shadow-sm">
            <img src="/logo%20onekana.png" alt="ONEKANA" className="h-8 w-full object-contain" />
          </div>
          <div className="px-1 pt-2">
            <span className="block text-xs font-black uppercase text-white">Centre admin ONEKANA</span>
            <span className="mt-0.5 block text-[10px] font-bold uppercase text-primary">Pilotage interne</span>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-3">
          {visibleDashboard && (
            <SidebarMenu className="mb-3">
              <NavigationItem item={dashboardItem} active={location.pathname === '/'} onNavigate={closeMobileNavigation} />
            </SidebarMenu>
          )}

          <nav aria-label="Navigation principale" className="space-y-1">
            {visibleGroups.map((group) => {
              const isOpen = openGroup === group.id
              const containsActive = activeGroup?.id === group.id
              return (
                <Collapsible key={group.id} open={isOpen} onOpenChange={() => toggleGroup(group.id)}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[10px] font-black uppercase transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${containsActive ? 'bg-white/[0.06] text-white' : 'text-white/50 hover:bg-white/[0.04] hover:text-white/75'}`}
                      aria-label={`${isOpen ? 'Replier' : 'Déplier'} ${group.label}`}
                    >
                      <span>{group.label}</span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="navigation-group-content overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <SidebarMenu className="pb-2 pt-1">
                      {group.items.map((item) => <NavigationItem key={item.path} item={item} active={matchesPath(location.pathname, item.path)} onNavigate={closeMobileNavigation} />)}
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </nav>
        </SidebarContent>

        <div className="mt-auto space-y-2 border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-black text-white">{user.displayName[0] || 'U'}</div>
            <div className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-white">{user.displayName}</span><span className="block truncate text-[11px] text-white/55">{user.tenant?.name || user.email}</span></div>
          </div>
          <Button variant="ghost" className="h-9 w-full justify-start gap-3 rounded-lg text-white/70 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white" onClick={() => logout()}>
            <LogOut className="h-4 w-4" /><span>Déconnexion</span>
          </Button>
        </div>
      </Sidebar>

      <SidebarInset className="flex flex-1 flex-col overflow-hidden">
        <header className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-border bg-white/90 px-4 shadow-sm backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="h-8 w-8" />
            <div className="min-w-0">
              <span className="hidden text-[10px] font-bold uppercase text-muted-foreground sm:block">{activeGroup?.label || 'Vue globale'}</span>
              <h1 className="truncate text-sm font-black text-foreground sm:text-base">{activeItem?.label || 'Tableau de bord'}</h1>
            </div>
          </div>
          <span className="hidden rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-bold text-foreground sm:block">{user.tenant?.name || 'ONEKANA'}</span>
        </header>
        <main className="flex-1 overflow-y-auto bg-[#f7f7f7] p-4 sm:p-6">
          <div className="mx-auto max-w-7xl pb-20"><PageTransition transitionKey={location.pathname}>{children}</PageTransition></div>
        </main>
      </SidebarInset>
      <RightSideBar />
      <OnboardingGuide />
    </div>
  )
}

function NavigationItem({ item, active, onNavigate }: { item: MenuItem; active: boolean; onNavigate: () => void }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink to={item.path} onClick={onNavigate} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
          <span className={`relative flex items-center gap-3 rounded-lg border px-2.5 py-2 transition-[transform,background-color,border-color,color] duration-200 ${active ? 'border-white/10 bg-white/[0.09] text-white' : 'border-transparent text-white/68 hover:translate-x-px hover:border-white/[0.07] hover:bg-white/[0.045] hover:text-white'}`}>
            {active && <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-r-full bg-primary" />}
            <span className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-200 ${active ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'bg-white/[0.06] text-white/70'}`}><item.icon className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.label}</span>
            <ChevronRight className={`h-3.5 w-3.5 transition-[transform,opacity] duration-200 ${active ? 'translate-x-0 opacity-100 text-primary' : '-translate-x-1 opacity-0'}`} />
          </span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
