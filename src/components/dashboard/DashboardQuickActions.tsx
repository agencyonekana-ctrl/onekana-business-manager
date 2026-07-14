import type { ElementType } from 'react'
import { ArrowUpRight, Mail, MapPinned, Megaphone, ReceiptText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { featureFlags } from '../../config/features'

const actions = [
  { label: 'Demandes', description: 'Qualifier les entrées', to: '/demandes', icon: Mail },
  { label: 'Campagnes', description: 'Contrôler les statuts', to: '/campaigns', icon: Megaphone },
  ...(featureFlags.geography ? [{ label: 'Territoires', description: 'Consulter la couverture', to: '/geography', icon: MapPinned }] : []),
  { label: 'Factures', description: 'Suivre les paiements', to: '/invoices', icon: ReceiptText },
] satisfies Array<{ label: string; description: string; to: string; icon: ElementType }>

export function DashboardQuickActions() {
  return (
    <Card className="border-border bg-white shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase">Accès rapides</CardTitle><p className="mt-1 text-xs text-muted-foreground">Les espaces de contrôle disponibles pour le pilote.</p></CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {actions.map((action) => (
          <Link key={action.to} to={action.to} className="group flex items-center gap-3 rounded-xl border border-border/70 p-3 transition-[transform,border-color,background-color] duration-200 hover:translate-x-px hover:border-primary/20 hover:bg-primary/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground transition-colors duration-200 group-hover:bg-primary/10 group-hover:text-primary"><action.icon className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{action.label}</span><span className="block truncate text-xs text-muted-foreground">{action.description}</span></span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
