import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  DollarSign,
  MapPin,
  Megaphone,
  PackageCheck,
  Percent,
  UserRoundCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'
import { PageHeader } from '../components/app/PageHeader'
import { EmptyState } from '../components/app/EmptyState'
import { dataClient } from '../lib/data-client'
import { useAuth } from '../hooks/use-auth'

type Campaign = {
  id: string
  name: string
  clientName: string
  startDate: string
  endDate: string
  status: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    newRequests: 0,
    activeCampaigns: 0,
    revenue: 0,
    occupancy: 0,
    availableEmplacements: 0,
    upcomingCampaigns: 0,
  })
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([])

  useEffect(() => {
    async function fetchStats() {
      try {
        const [messages, campaigns, lines, emplacements] = await Promise.all([
          dataClient.db.contactMessages.list(),
          dataClient.db.oohCampaigns.list(),
          dataClient.db.oohCampaignLines.list(),
          dataClient.db.oohEmplacements.list(),
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
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    { title: 'Nouvelles demandes', value: stats.newRequests, icon: UserRoundCheck, tone: 'bg-primary/10 text-primary' },
    { title: 'Campagnes actives', value: stats.activeCampaigns, icon: Megaphone, tone: 'bg-black text-white' },
    { title: "Revenus estimés", value: `${stats.revenue.toLocaleString()} USD`, icon: DollarSign, tone: 'bg-emerald-50 text-emerald-700' },
    { title: "Taux d'occupation", value: `${stats.occupancy.toFixed(0)}%`, icon: Percent, tone: 'bg-secondary/70 text-foreground' },
    { title: 'Emplacements libres', value: stats.availableEmplacements, icon: MapPin, tone: 'bg-primary/10 text-primary' },
    { title: 'A lancer', value: stats.upcomingCampaigns, icon: CalendarClock, tone: 'bg-amber-50 text-amber-700' },
  ]

  const quickActions = [
    { label: 'Traiter une demande', to: '/demandes', icon: UserRoundCheck, help: 'Commencez par qualifier les messages entrants du site public.' },
    { label: 'Créer une campagne', to: '/campaigns', icon: Megaphone, help: 'Préparez la campagne client, ses dates et ses lignes de réservation.' },
    { label: 'Voir disponibilités', to: '/inventory', icon: MapPin, help: 'Consultez les sites, supports et emplacements disponibles.' },
    { label: 'Ajouter un pack', to: '/packs', icon: PackageCheck, help: 'Créez ou adaptez une offre commerciale pour vos prospects.' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ONEKANA ventes OOH"
        title="Tableau de bord commercial"
        description={`Bonjour ${user.displayName}. Suivez les demandes clients, les campagnes actives, les revenus estimés et les disponibilités publicitaires.`}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => (
          <TooltipProvider key={action.to}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="outline" className="h-auto justify-between border-primary/20 bg-white px-4 py-3 text-left">
                  <Link to={action.to}>
                    <span className="flex items-center gap-3">
                      <span className="rounded-lg bg-primary/10 p-2 text-primary">
                        <action.icon className="h-4 w-4" />
                      </span>
                      <span className="font-bold">{action.label}</span>
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{action.help}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" data-tour="dashboard-kpis">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-primary/15 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold">{stat.title}</CardTitle>
              <div className={`rounded-lg p-2 ${stat.tone}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-primary/15 bg-white lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-black uppercase">
              <Megaphone className="h-5 w-5 text-primary" />
              Campagnes en cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeCampaigns.length === 0 ? (
              <EmptyState
                title="Aucune campagne active"
                description="Créez une campagne puis ajoutez des emplacements pour suivre son occupation ici."
                action={<Button asChild size="sm"><Link to="/campaigns">Créer une campagne</Link></Button>}
              />
            ) : (
              <div className="divide-y divide-primary/10">
                {activeCampaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <div className="text-sm font-bold">{campaign.name}</div>
                      <div className="text-xs text-muted-foreground">{campaign.clientName}</div>
                    </div>
                    <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      Jusqu'au {new Date(campaign.endDate).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/15 bg-[#111111] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-black uppercase">
              <BookOpenCheck className="h-5 w-5 text-[#ffd026]" />
              Parcours recommandé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/75">
            <p>1. Traiter la demande client.</p>
            <p>2. Choisir ou adapter un pack commercial.</p>
            <p>3. Créer la campagne et réserver les emplacements.</p>
            <p>4. Centraliser les documents liés au client.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
