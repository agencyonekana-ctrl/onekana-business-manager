import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  DollarSign,
  FileText,
  MapPin,
  Megaphone,
  Percent,
  ReceiptText,
  UserRoundCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { EmptyState } from '../components/app/EmptyState'
import { StatCard } from '../components/app/StatCard'
import { StatusBadge } from '../components/app/StatusBadge'
import { dataClient } from '../lib/data-client'
import { connectedDataDomains, internalDataDomains } from '../lib/data-domains'
import { useAuth } from '../hooks/use-auth'

type Campaign = {
  id: string
  name: string
  clientName: string
  startDate: string
  endDate: string
  status: string
}

type DashboardStats = {
  newRequests: number
  activeCampaigns: number
  revenue: number
  occupancy: number
  availableEmplacements: number
  upcomingCampaigns: number
  documents: number
  unpaidInvoices: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    newRequests: 0,
    activeCampaigns: 0,
    revenue: 0,
    occupancy: 0,
    availableEmplacements: 0,
    upcomingCampaigns: 0,
    documents: 0,
    unpaidInvoices: 0,
  })
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)
      try {
        const [messages, campaigns, lines, emplacements, documents, invoices] = await Promise.all([
          dataClient.db.contactMessages.list(),
          dataClient.db.oohCampaigns.list(),
          dataClient.db.oohCampaignLines.list(),
          dataClient.db.oohEmplacements.list(),
          dataClient.db.documents.list(),
          dataClient.db.invoices.list(),
        ])

        const today = new Date().toISOString().split('T')[0]
        const currentCampaigns = (campaigns as Campaign[]).filter((campaign) => campaign.startDate <= today && campaign.endDate >= today)
        const upcoming = (campaigns as Campaign[]).filter((campaign) => campaign.startDate > today)
        const bookedIds = new Set(
          (lines as any[])
            .filter((line) => currentCampaigns.some((campaign) => campaign.id === line.campaignId))
            .map((line) => line.emplacementId)
        )

        setActiveCampaigns(currentCampaigns)
        setStats({
          newRequests: (messages as any[]).filter((message) => message.status !== 'handled').length,
          activeCampaigns: currentCampaigns.length,
          revenue: (lines as any[]).reduce((acc, line) => acc + Number(line.totalPrice || 0), 0),
          occupancy: emplacements.length > 0 ? (bookedIds.size / emplacements.length) * 100 : 0,
          availableEmplacements: Math.max(0, emplacements.length - bookedIds.size),
          upcomingCampaigns: upcoming.length,
          documents: documents.length,
          unpaidInvoices: (invoices as any[]).filter((invoice) => !['paid', 'payee', 'paid_full'].includes(String(invoice.status || '').toLowerCase())).length,
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const priorityCount = stats.newRequests + stats.upcomingCampaigns + stats.unpaidInvoices

  const compactMetrics = [
    { label: 'Priorites', value: priorityCount, helper: 'A traiter', icon: CheckCircle2, to: '/demandes' },
    { label: 'Demandes', value: stats.newRequests, helper: 'En attente', icon: UserRoundCheck, to: '/demandes' },
    { label: 'Campagnes', value: stats.activeCampaigns, helper: 'Actives', icon: Megaphone, to: '/campaigns' },
    { label: 'Occupation', value: `${stats.occupancy.toFixed(0)}%`, helper: 'OOH', icon: Percent, to: '/inventory' },
    { label: 'Revenus', value: `${stats.revenue.toLocaleString()} USD`, helper: 'Estimes', icon: DollarSign, to: '/invoices' },
  ]

  const actions = useMemo(() => [
    {
      label: 'Demandes clients',
      value: stats.newRequests,
      to: '/demandes',
      icon: UserRoundCheck,
      helper: 'Qualifier les entrees recues et lancer le suivi.',
    },
    {
      label: 'Campagnes a lancer',
      value: stats.upcomingCampaigns,
      to: '/campaigns',
      icon: CalendarClock,
      helper: 'Verifier dates, client et emplacements.',
    },
    {
      label: 'Factures a suivre',
      value: stats.unpaidInvoices,
      to: '/invoices',
      icon: ReceiptText,
      helper: 'Controler paiements et statuts.',
    },
    {
      label: 'Documents',
      value: stats.documents,
      to: '/documents',
      icon: FileText,
      helper: 'Centraliser contrats, visuels et pieces utiles.',
    },
  ], [stats])

  const executiveStats = [
    { title: 'Revenus estimes', value: `${stats.revenue.toLocaleString()} USD`, icon: DollarSign, tone: 'neutral' as const, description: 'Volume previsionnel des reservations.' },
    { title: 'Emplacements libres', value: stats.availableEmplacements, icon: MapPin, tone: 'red' as const, description: 'Disponibilites utilisables.' },
    { title: 'Campagnes actives', value: stats.activeCampaigns, icon: Megaphone, tone: 'red' as const, description: 'Operations en cours.' },
    { title: 'Occupation OOH', value: `${stats.occupancy.toFixed(0)}%`, icon: Percent, tone: 'neutral' as const, description: 'Occupation des emplacements actifs.' },
  ]

  return (
    <div className="space-y-6">
      <DashboardIntro userName={user.displayName} stats={stats} />

      <section className="grid gap-3 xl:grid-cols-5">
        {compactMetrics.map((metric) => (
          <CompactMetric key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-sm font-black uppercase tracking-wide">Aujourd'hui</CardTitle>
            <StatusBadge tone="red">{priorityCount} priorites</StatusBadge>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {actions.map((action) => (
              <ActionCard key={action.label} {...action} />
            ))}
          </CardContent>
        </Card>

        <Card className="border-border bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-sm font-black uppercase tracking-wide">Pilotage</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/campaigns">Voir les campagnes</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <ControlLink to="/demandes" label="Demandes" description="Suivi des nouveaux contacts" icon={UserRoundCheck} />
            <ControlLink to="/campaigns" label="Campagnes" description="Planning et reservations" icon={Megaphone} />
            <ControlLink to="/inventory" label="Inventaire OOH" description="Sites et emplacements" icon={MapPin} />
            <ControlLink to="/invoices" label="Factures" description="Paiements et controle" icon={ReceiptText} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-tour="dashboard-kpis">
        {executiveStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <Card className="border-border bg-white">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-wide">
            <Megaphone className="h-5 w-5 text-primary" />
            Suivi operationnel
          </CardTitle>
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link to="/campaigns">
              Ouvrir
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Chargement du suivi...</div>
          ) : activeCampaigns.length === 0 ? (
            <EmptyState
              title="Aucune campagne active"
              description="Les campagnes en cours apparaitront ici avec leurs clients et dates de fin."
              action={<Button asChild size="sm"><Link to="/campaigns">Voir les campagnes</Link></Button>}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-[1fr_0.8fr_0.6fr] bg-muted/40 px-4 py-3 text-xs font-black uppercase text-muted-foreground">
                <span>Campagne</span>
                <span>Client</span>
                <span className="text-right">Fin</span>
              </div>
              <div className="divide-y divide-border">
                {activeCampaigns.slice(0, 6).map((campaign) => (
                  <Link
                    key={campaign.id}
                    to="/campaigns"
                    className="grid grid-cols-[1fr_0.8fr_0.6fr] items-center px-4 py-3 text-sm transition-colors hover:bg-primary/5"
                  >
                    <span className="font-bold">{campaign.name}</span>
                    <span className="text-muted-foreground">{campaign.clientName}</span>
                    <span className="text-right text-xs font-semibold text-muted-foreground">
                      {new Date(campaign.endDate).toLocaleDateString('fr-FR')}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardIntro({ userName, stats }: { userName: string, stats: DashboardStats }) {
  const internalLabels = internalDataDomains.map((domain) => domain.label.toLowerCase()).join(', ')
  const connectedLabels = connectedDataDomains.map((domain) => domain.label.toLowerCase()).join(', ')

  const capabilities = [
    {
      label: 'Demandes',
      description: 'Qualifier les contacts entrants et transformer les bons dossiers en campagnes.',
      icon: UserRoundCheck,
      to: '/demandes',
    },
    {
      label: 'Campagnes OOH',
      description: 'Planifier les affichages, suivre les dates et verifier les reservations.',
      icon: Megaphone,
      to: '/campaigns',
    },
    {
      label: 'Inventaire',
      description: 'Controler les sites, supports et emplacements disponibles pour les operations.',
      icon: MapPin,
      to: '/inventory',
    },
    {
      label: 'Documents',
      description: 'Regrouper contrats, visuels, pieces client et fichiers de suivi interne.',
      icon: FileText,
      to: '/documents',
    },
    {
      label: 'Finance',
      description: 'Garder un oeil sur les factures, paiements et indicateurs de controle.',
      icon: ReceiptText,
      to: '/invoices',
    },
  ]

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="relative p-6 sm:p-7 lg:p-8">
          <div className="absolute left-0 top-8 h-20 w-1.5 rounded-r-full bg-primary" />
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-black uppercase text-primary">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              Centre de pilotage
            </div>
            <h2 className="mt-5 text-3xl font-black uppercase tracking-tight text-foreground sm:text-5xl">
              Tableau de bord
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Bonjour {userName}. Retrouvez ici les priorites internes, les demandes recues, les campagnes OOH,
              l'inventaire publicitaire, les documents et le suivi financier pour piloter ONEKANA sans vous disperser.
            </p>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {capabilities.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="group rounded-2xl border border-border bg-[#fbfbfb] p-4 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:bg-white hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <item.icon className="h-5 w-5" />
                </span>
                <span className="mt-4 block text-sm font-black uppercase text-foreground">{item.label}</span>
                <span className="mt-2 block text-xs leading-5 text-muted-foreground">{item.description}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-border bg-[#f8f8f8] p-5 sm:p-6 lg:border-l lg:border-t-0">
          <div className="grid h-full gap-4">
            <div className="rounded-2xl border border-border bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-black uppercase text-muted-foreground">Cree ici</span>
                  <h3 className="mt-2 text-lg font-black uppercase">Gestion interne</h3>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {internalLabels} sont administres depuis ce back office pour garder une base de travail claire et fiable.
              </p>
            </div>

            <div className="rounded-2xl border border-primary/15 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-black uppercase text-primary">Recu depuis les espaces connectes</span>
                  <h3 className="mt-2 text-lg font-black uppercase">Donnees clients</h3>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UserRoundCheck className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Les {connectedLabels} apparaitront ici pour consultation, qualification et suivi administratif des que les espaces connectes les transmettront.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-white p-4">
                <span className="block text-2xl font-black">{stats.newRequests}</span>
                <span className="mt-1 block text-xs font-bold uppercase text-muted-foreground">Demandes recues</span>
              </div>
              <div className="rounded-2xl border border-border bg-white p-4">
                <span className="block text-2xl font-black">{stats.availableEmplacements}</span>
                <span className="mt-1 block text-xs font-bold uppercase text-muted-foreground">Emplacements libres</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CompactMetric({ label, value, helper, icon: Icon, to }: { label: string, value: string | number, helper: string, icon: React.ElementType, to: string }) {
  return (
    <Link to={to} className="group rounded-2xl border border-border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span>
          <span className="block text-[11px] font-black uppercase text-muted-foreground">{label}</span>
          <span className="mt-2 block truncate text-2xl font-black">{value}</span>
          <span className="mt-1 block text-xs text-muted-foreground">{helper}</span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </Link>
  )
}

function ActionCard({ label, value, to, icon: Icon, helper }: { label: string, value: number, to: string, icon: React.ElementType, helper: string }) {
  return (
    <Link to={to} className="group flex min-h-28 flex-col justify-between rounded-2xl border border-border bg-white p-4 transition-all hover:border-primary/30 hover:bg-primary/5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <span className="rounded-full bg-foreground px-2.5 py-1 text-xs font-black text-white">{value}</span>
      </div>
      <div>
        <div className="mt-4 text-sm font-black uppercase">{label}</div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{helper}</p>
      </div>
    </Link>
  )
}

function ControlLink({ to, label, description, icon: Icon }: { to: string, label: string, description: string, icon: React.ElementType }) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-2xl border border-border bg-muted/20 p-3 transition-colors hover:border-primary/25 hover:bg-primary/5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary ring-1 ring-border">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{description}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
    </Link>
  )
}
