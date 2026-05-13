import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
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
import { PageHeader } from '../components/app/PageHeader'
import { EmptyState } from '../components/app/EmptyState'
import { ActionTile } from '../components/app/ActionTile'
import { StatCard } from '../components/app/StatCard'
import { StatusBadge } from '../components/app/StatusBadge'
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
    { title: 'Nouvelles demandes', value: stats.newRequests, icon: UserRoundCheck, tone: 'red' as const, description: 'Demandes entrantes à qualifier.' },
    { title: 'Campagnes actives', value: stats.activeCampaigns, icon: Megaphone, tone: 'red' as const, description: 'Campagnes OOH en cours.' },
    { title: 'Revenus estimés', value: `${stats.revenue.toLocaleString()} USD`, icon: DollarSign, tone: 'neutral' as const, description: 'Total estimé des lignes réservées.' },
    { title: "Taux d'occupation", value: `${stats.occupancy.toFixed(0)}%`, icon: Percent, tone: 'neutral' as const, description: 'Occupation des emplacements actifs.' },
    { title: 'Emplacements libres', value: stats.availableEmplacements, icon: MapPin, tone: 'red' as const, description: 'Disponibles sur la période active.' },
    { title: 'À lancer', value: stats.upcomingCampaigns, icon: CalendarClock, tone: 'red' as const, description: 'Campagnes planifiées à venir.' },
  ]

  const quickActions = [
    { label: 'Traiter une demande', to: '/demandes', icon: UserRoundCheck, description: 'Qualifier les messages entrants du site public.' },
    { label: 'Créer une campagne', to: '/campaigns', icon: Megaphone, description: 'Préparer les dates, le client et les réservations.' },
    { label: 'Voir disponibilités', to: '/inventory', icon: MapPin, description: 'Consulter sites, supports et emplacements.' },
    { label: 'Ajouter un pack', to: '/packs', icon: PackageCheck, description: 'Structurer une offre commerciale réutilisable.' },
  ]

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="ONEKANA ventes OOH"
        title="Tableau de bord commercial"
        description={`Bonjour ${user.displayName}. Pilotez les demandes, campagnes, revenus estimés et disponibilités publicitaires depuis un seul espace.`}
      />

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111] text-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-primary/25 bg-primary/15 px-3 py-1 text-xs font-bold uppercase text-primary">
              Pipeline opérationnel ONEKANA
            </div>
            <h3 className="max-w-3xl text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              Transformer une demande client en campagne réservée, suivie et facturée.
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">
              Le back office garde le parcours court: qualifier, choisir l'offre, réserver les emplacements, centraliser les documents et suivre la finance.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4">
              <div className="text-3xl font-black">{stats.newRequests}</div>
              <div className="mt-1 text-xs font-bold uppercase text-white/65">Demandes à traiter</div>
            </div>
            <div className="rounded-2xl border border-primary/25 bg-primary/15 p-4 text-primary">
              <div className="text-3xl font-black">{stats.occupancy.toFixed(0)}%</div>
              <div className="mt-1 text-xs font-bold uppercase text-primary">Occupation</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => (
          <ActionTile key={action.to} {...action} />
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" data-tour="dashboard-kpis">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border bg-white lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-wide">
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
              <div className="divide-y divide-border">
                {activeCampaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <div className="text-sm font-bold">{campaign.name}</div>
                      <div className="text-xs text-muted-foreground">{campaign.clientName}</div>
                    </div>
                    <StatusBadge tone="red">
                      Jusqu'au {new Date(campaign.endDate).toLocaleDateString('fr-FR')}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#111111] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-wide">
              <BookOpenCheck className="h-5 w-5 text-primary" />
              Workflow recommandé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/75">
            {['Traiter la demande client', 'Choisir ou adapter un pack commercial', 'Créer la campagne et réserver les emplacements', 'Centraliser les documents liés au client'].map((step, index) => (
              <div key={step} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-black text-primary">{index + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
