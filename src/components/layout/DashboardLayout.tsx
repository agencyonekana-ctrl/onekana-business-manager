import React from 'react'
import { useAuth } from '../../hooks/use-auth'
import {
  BookMarked,
  Building2,
  Calendar,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  Megaphone,
  Package,
  Settings,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Button } from '../ui/button'
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

const menuItems = [
  { icon: LayoutDashboard, label: 'Tableau de bord', path: '/' },
  { icon: Users, label: 'Équipe', path: '/employees' },
  { icon: Building2, label: 'Départements', path: '/departments' },
  { icon: Megaphone, label: 'Campagnes', path: '/campaigns' },
  { icon: MapPin, label: 'Inventaire', path: '/inventory' },
  { icon: Package, label: 'Matériels', path: '/materials' },
  { icon: BookMarked, label: 'Réservations', path: '/reservations' },
  { icon: FileText, label: 'Documents', path: '/documents' },
  { icon: Calendar, label: 'Horaires', path: '/schedules' },
  { icon: Settings, label: 'Paramètres', path: '/settings' },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()

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
                  Régie & opérations
                </span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              {menuItems.map((item) => (
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
          </SidebarContent>
          <div className="mt-auto space-y-4 border-t border-white/10 p-4">
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffd026] font-black text-[#111111]">
                {user.displayName[0] || 'U'}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-white">{user.displayName}</span>
                <span className="truncate text-xs text-white/55">{user.email}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => logout()}
            >
              <LogOut className="h-5 w-5" />
              <span>Déconnexion</span>
            </Button>
          </div>
        </Sidebar>
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
          <header className="z-10 flex h-16 items-center justify-between border-b border-border bg-white/85 px-6 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-lg font-black uppercase tracking-wide">
                {menuItems.find((item) => item.path === window.location.pathname)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-bold uppercase text-primary sm:flex">
              ONEKANA interne
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
