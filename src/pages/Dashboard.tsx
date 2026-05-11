import { useEffect, useState } from 'react'
import {
  BookMarked,
  Calendar,
  DollarSign,
  FileText,
  MapPin,
  Megaphone,
  Package,
  Percent,
  Users,
  Wrench,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { localData } from '../lib/local-data'
import { useAuth } from '../hooks/use-auth'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    employees: 0,
    documents: 0,
    schedules: 0,
    materials: 0,
    reservations: 0,
    oohSites: 0,
    oohEmplacements: 0,
    oohCampaigns: 0,
    oohRevenue: 0,
    oohOccupancy: 0,
    oohMaintenance: 0,
  })
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([])

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          empCount,
          docCount,
          schCount,
          matCount,
          resCount,
          sitesCount,
          empOohCount,
          campCount,
          campaigns,
          lines,
          tasks,
        ] = await Promise.all([
          localData.db.employees.count(),
          localData.db.documents.count(),
          localData.db.schedules.count(),
          localData.db.materials.count(),
          localData.db.reservations.count(),
          localData.db.oohSites.count(),
          localData.db.oohEmplacements.count(),
          localData.db.oohCampaigns.count(),
          localData.db.oohCampaigns.list(),
          localData.db.oohCampaignLines.list(),
          localData.db.oohTasks.list({ where: { status: 'pending' } }),
        ])

        const totalRevenue = (lines as any[]).reduce((acc, line) => acc + (line.totalPrice || 0), 0)
        const now = new Date().toISOString().split('T')[0]
        const currentCampaigns = (campaigns as any[]).filter((c) => c.startDate <= now && c.endDate >= now)
        const bookedEmplacementIds = new Set(
          (lines as any[])
            .filter((line) => currentCampaigns.some((campaign) => campaign.id === line.campaignId))
            .map((line) => line.emplacementId)
        )

        setActiveCampaigns(currentCampaigns)
        setStats({
          employees: empCount,
          documents: docCount,
          schedules: schCount,
          materials: matCount,
          reservations: resCount,
          oohSites: sitesCount,
          oohEmplacements: empOohCount,
          oohCampaigns: campCount,
          oohRevenue: totalRevenue,
          oohOccupancy: empOohCount > 0 ? (bookedEmplacementIds.size / empOohCount) * 100 : 0,
          oohMaintenance: (tasks as any[]).length,
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    { title: 'Campagnes', value: stats.oohCampaigns, icon: Megaphone, tone: 'bg-primary/10 text-primary' },
    { title: "Chiffre d'affaires", value: `${stats.oohRevenue.toLocaleString()} €`, icon: DollarSign, tone: 'bg-emerald-50 text-emerald-600' },
    { title: 'Occupation', value: `${stats.oohOccupancy.toFixed(1)}%`, icon: Percent, tone: 'bg-secondary/60 text-foreground' },
    { title: 'Sites OOH', value: stats.oohSites, icon: MapPin, tone: 'bg-black text-white' },
    { title: 'Réservations', value: stats.reservations, icon: BookMarked, tone: 'bg-primary/10 text-primary' },
    { title: 'Maintenance', value: stats.oohMaintenance, icon: Wrench, tone: 'bg-amber-50 text-amber-700' },
  ]

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-primary/15 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-primary">ONEKANA Back Office</p>
            <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
              Pilotage interne des campagnes terrain
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Bonjour {user.displayName}. Suivez les supports OOH, les réservations agences, les documents et les
              opérations internes depuis un seul tableau de bord.
            </p>
          </div>
          <div className="rounded-lg bg-[#111111] px-4 py-3 text-white">
            <p className="text-[11px] font-bold uppercase text-[#ffd026]">Supports réservables</p>
            <p className="text-2xl font-black">{stats.oohEmplacements}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="overflow-hidden border-primary/15 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold">{stat.title}</CardTitle>
              <div className={`rounded-lg p-2 ${stat.tone}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{stat.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">Données locales enregistrées</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-primary/15 bg-white lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-black uppercase">
              <Megaphone className="h-5 w-5 text-primary" />
              Campagnes actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeCampaigns.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">Aucune campagne active pour le moment.</p>
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
            <CardTitle className="text-lg font-black uppercase">Activité interne</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-white/75">
                <Users className="h-4 w-4 text-[#ffd026]" />
                Équipe
              </span>
              <strong>{stats.employees}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-white/75">
                <Package className="h-4 w-4 text-[#ffd026]" />
                Matériels
              </span>
              <strong>{stats.materials}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-white/75">
                <FileText className="h-4 w-4 text-[#ffd026]" />
                Documents
              </span>
              <strong>{stats.documents}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-white/75">
                <Calendar className="h-4 w-4 text-[#ffd026]" />
                Horaires
              </span>
              <strong>{stats.schedules}</strong>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
