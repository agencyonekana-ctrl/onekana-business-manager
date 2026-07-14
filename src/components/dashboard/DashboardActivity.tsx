import { ArrowRight, Mail, Megaphone } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { AgencyContactMessage } from '../../services/agency-api'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { DashboardSkeleton } from './DashboardSkeleton'

type AgencyCampaign = Record<string, unknown>

type DashboardActivityProps = {
  contacts: AgencyContactMessage[]
  campaigns: AgencyCampaign[]
  contactsAvailable: boolean
  campaignsAvailable: boolean
  loading: boolean
}

function campaignLabel(campaign: AgencyCampaign) {
  return String(campaign.name || campaign.campaign_name || campaign.title || 'Campagne sans nom')
}

function campaignMeta(campaign: AgencyCampaign) {
  return String(campaign.clientName || campaign.client_name || campaign.company_name || campaign.company || 'Client non renseigné')
}

export function DashboardActivity({ contacts, campaigns, contactsAvailable, campaignsAvailable, loading }: DashboardActivityProps) {
  return (
    <Card className="border-border bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-black uppercase">Activité récente</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">Les dernières informations reçues des espaces connectés.</p>
      </CardHeader>
      <CardContent>
        {loading ? <DashboardSkeleton rows={4} /> : (
          <div className="grid gap-5 md:grid-cols-2">
            <ActivityColumn title="Demandes" to="/demandes" icon={Mail} available={contactsAvailable} empty="Aucune demande reçue.">
              {contacts.slice(0, 4).map((contact) => (
                <Link key={contact.id} to="/demandes" className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors duration-200 hover:bg-primary/[0.035]">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{contact.name}</span><span className="block truncate text-xs text-muted-foreground">{contact.subject || contact.email || 'À qualifier'}</span></span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              ))}
            </ActivityColumn>
            <ActivityColumn title="Campagnes" to="/campaigns" icon={Megaphone} available={campaignsAvailable} empty="Aucune campagne reçue.">
              {campaigns.slice(0, 4).map((campaign) => (
                <Link key={String(campaign.id || campaign.campaign_id)} to="/campaigns" className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors duration-200 hover:bg-primary/[0.035]">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-foreground/30" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{campaignLabel(campaign)}</span><span className="block truncate text-xs text-muted-foreground">{campaignMeta(campaign)}</span></span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              ))}
            </ActivityColumn>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ActivityColumn({ title, to, icon: Icon, available, empty, children }: { title: string; to: string; icon: typeof Mail; available: boolean; empty: string; children: ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children)
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3 border-b border-border pb-2">
        <h3 className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground"><Icon className="h-4 w-4 text-primary" />{title}</h3>
        <Link to={to} className="text-xs font-bold text-primary hover:underline">Voir tout</Link>
      </div>
      {!available ? <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">Données temporairement indisponibles.</p> : hasChildren ? <div>{children}</div> : <p className="p-3 text-xs text-muted-foreground">{empty}</p>}
    </section>
  )
}
