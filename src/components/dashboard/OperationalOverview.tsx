import { ArrowRight, MapPin, Megaphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DashboardCampaign } from '../../types/dashboard'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Skeleton } from '../ui/skeleton'

type OperationalOverviewProps = {
  occupancy: number
  availableEmplacements: number
  campaigns: DashboardCampaign[]
  loading: boolean
  unavailable?: boolean
}

export function OperationalOverview({ occupancy, availableEmplacements, campaigns, loading, unavailable = false }: OperationalOverviewProps) {
  return (
    <Card className="border-border bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-sm font-black uppercase">Suivi opérationnel</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Occupation du parc et campagnes internes en cours.</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1.5"><Link to="/inventory">Inventaire <ArrowRight className="h-4 w-4" /></Link></Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4"><Skeleton className="h-24 w-full bg-muted" /><Skeleton className="h-14 w-full bg-muted" /></div>
        ) : unavailable ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">Le suivi OOH est temporairement indisponible.</div>
        ) : (
          <>
            <div className="rounded-xl bg-[#171515] p-4 text-white">
              <div className="flex items-end justify-between gap-4">
                <div><span className="text-3xl font-black tabular-nums">{occupancy.toFixed(0)}%</span><span className="mt-1 block text-[11px] font-bold uppercase text-white/60">Occupation OOH</span></div>
                <div className="text-right"><span className="text-xl font-black tabular-nums">{availableEmplacements}</span><span className="mt-1 block text-[10px] font-bold uppercase text-white/60">Emplacements libres</span></div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${Math.min(100, Math.max(0, occupancy))}%` }} /></div>
            </div>
            <div className="mt-3 space-y-2">
              {campaigns.length === 0 ? (
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground"><Megaphone className="h-4 w-4" />Aucune campagne interne active.</div>
              ) : campaigns.slice(0, 3).map((campaign) => (
                <Link key={campaign.id} to="/campaigns" className="group flex items-center gap-3 rounded-xl border border-border/70 p-3 transition-colors duration-200 hover:border-primary/20 hover:bg-primary/[0.025]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><MapPin className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{campaign.name}</span><span className="block truncate text-xs text-muted-foreground">{campaign.clientName || 'Client non renseigné'}</span></span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
