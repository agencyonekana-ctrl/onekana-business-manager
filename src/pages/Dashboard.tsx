import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, DollarSign, FileText, MapPin, Megaphone, ReceiptText, UserRoundCheck } from 'lucide-react'
import { DashboardActivity } from '../components/dashboard/DashboardActivity'
import { DashboardMetric } from '../components/dashboard/DashboardMetric'
import { DashboardQuickActions } from '../components/dashboard/DashboardQuickActions'
import { OperationalOverview } from '../components/dashboard/OperationalOverview'
import { PriorityList } from '../components/dashboard/PriorityList'
import { useAuth } from '../hooks/use-auth'
import { dataClient } from '../lib/data-client'
import { agencyApi, type AgencyContactMessage, type AgencySummary } from '../services/agency-api'
import type { DashboardCampaign, DashboardPriority, DashboardStats } from '../types/dashboard'

type AgencyCampaign = Record<string, unknown>

type DashboardAvailability = {
  contacts: boolean
  campaigns: boolean
  inventory: boolean
  unavailableInternal: string[]
}

const initialStats: DashboardStats = {
  newRequests: 0,
  activeCampaigns: 0,
  revenue: 0,
  occupancy: 0,
  availableEmplacements: 0,
  upcomingCampaigns: 0,
  documents: 0,
  unpaidInvoices: 0,
  connectedContacts: 0,
  connectedCampaigns: 0,
  geographicRecords: 0,
}

function settledValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const [activeCampaigns, setActiveCampaigns] = useState<DashboardCampaign[]>([])
  const [latestContacts, setLatestContacts] = useState<AgencyContactMessage[]>([])
  const [latestCampaigns, setLatestCampaigns] = useState<AgencyCampaign[]>([])
  const [availability, setAvailability] = useState<DashboardAvailability>({ contacts: true, campaigns: true, inventory: true, unavailableInternal: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setLoading(true)
      const results = await Promise.allSettled([
        dataClient.db.contactMessages.list(),
        dataClient.db.oohCampaigns.list(),
        dataClient.db.oohCampaignLines.list(),
        dataClient.db.oohEmplacements.list(),
        dataClient.db.documents.list(),
        dataClient.db.invoices.list(),
        agencyApi.summary(),
        agencyApi.contacts.list(),
        agencyApi.campaigns.list<AgencyCampaign>(),
      ])
      if (!active) return

      const [messagesResult, campaignsResult, linesResult, emplacementsResult, documentsResult, invoicesResult, summaryResult, contactsResult, agencyCampaignsResult] = results
      const messages = settledValue(messagesResult, []) as Array<Record<string, unknown>>
      const campaigns = settledValue(campaignsResult, []) as DashboardCampaign[]
      const lines = settledValue(linesResult, []) as Array<Record<string, unknown>>
      const emplacements = settledValue(emplacementsResult, []) as Array<Record<string, unknown>>
      const documents = settledValue(documentsResult, []) as Array<Record<string, unknown>>
      const invoices = settledValue(invoicesResult, []) as Array<Record<string, unknown>>
      const summary = settledValue(summaryResult, null as AgencySummary | null)
      const contacts = settledValue(contactsResult, [] as AgencyContactMessage[])
      const agencyCampaigns = settledValue(agencyCampaignsResult, [] as AgencyCampaign[])

      const today = new Date().toISOString().split('T')[0]
      const currentCampaigns = campaigns.filter((campaign) => campaign.startDate <= today && campaign.endDate >= today)
      const upcomingCampaigns = campaigns.filter((campaign) => campaign.startDate > today)
      const bookedIds = new Set(
        lines
          .filter((line) => currentCampaigns.some((campaign) => campaign.id === String(line.campaignId || '')))
          .map((line) => String(line.emplacementId || '')),
      )
      const localRequests = messages.filter((message) => message.status !== 'handled').length
      const unavailableInternal = [
        messagesResult.status === 'rejected' ? 'demandes internes' : '',
        campaignsResult.status === 'rejected' ? 'campagnes internes' : '',
        emplacementsResult.status === 'rejected' ? 'inventaire OOH' : '',
        invoicesResult.status === 'rejected' ? 'facturation' : '',
      ].filter(Boolean)

      setActiveCampaigns(currentCampaigns)
      setLatestContacts(contacts.slice(0, 5))
      setLatestCampaigns(agencyCampaigns.slice(0, 5))
      setAvailability({
        contacts: contactsResult.status === 'fulfilled',
        campaigns: agencyCampaignsResult.status === 'fulfilled',
        inventory: emplacementsResult.status === 'fulfilled' && linesResult.status === 'fulfilled' && campaignsResult.status === 'fulfilled',
        unavailableInternal,
      })
      setStats({
        newRequests: Number(summary?.contacts ?? (contactsResult.status === 'fulfilled' ? contacts.length : localRequests)),
        activeCampaigns: currentCampaigns.length,
        revenue: lines.reduce((total, line) => total + Number(line.totalPrice || 0), 0),
        occupancy: emplacements.length > 0 ? (bookedIds.size / emplacements.length) * 100 : 0,
        availableEmplacements: Math.max(0, emplacements.length - bookedIds.size),
        upcomingCampaigns: upcomingCampaigns.length,
        documents: documents.length,
        unpaidInvoices: invoices.filter((invoice) => !['paid', 'payee', 'paid_full'].includes(String(invoice.status || '').toLowerCase())).length,
        connectedContacts: Number(summary?.contacts ?? contacts.length),
        connectedCampaigns: Number(summary?.campaigns ?? agencyCampaigns.length),
        geographicRecords: Number(summary?.communes ?? 0) + Number(summary?.pointsChauds ?? 0) + Number(summary?.trajets ?? 0),
      })
      setLoading(false)
    }

    loadDashboard()
    return () => { active = false }
  }, [])

  const priorities = useMemo<DashboardPriority[]>(() => [
    { label: 'Demandes à qualifier', description: 'Nouvelles entrées à examiner', value: stats.newRequests, to: '/demandes', icon: UserRoundCheck, tone: stats.newRequests > 0 ? 'urgent' : 'neutral' },
    { label: 'Campagnes à contrôler', description: 'Campagnes reçues ou à venir', value: stats.connectedCampaigns || stats.upcomingCampaigns, to: '/campaigns', icon: CalendarClock, tone: 'attention' },
    { label: 'Factures à suivre', description: 'Paiements toujours en attente', value: stats.unpaidInvoices, to: '/invoices', icon: ReceiptText, tone: stats.unpaidInvoices > 0 ? 'urgent' : 'neutral' },
    { label: 'Documents disponibles', description: 'Pièces administratives centralisées', value: stats.documents, to: '/documents', icon: FileText, tone: 'neutral' },
  ], [stats])

  const displayDate = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-primary">{displayDate}</p>
          <h2 className="mt-2 text-2xl font-black text-foreground sm:text-3xl">Bonjour {user.displayName}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Supervisez les activités reçues, les opérations OOH et les éléments qui demandent une décision administrative.</p>
        </div>
        {!loading && <div className="flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-xs font-bold shadow-sm"><span className="h-2 w-2 rounded-full bg-primary" />{priorities.reduce((total, item) => total + item.value, 0)} éléments suivis</div>}
      </header>

      {availability.unavailableInternal.length > 0 && !loading && (
        <p className="rounded-lg border border-border bg-white px-3 py-2 text-xs text-muted-foreground">Certaines informations sont temporairement indisponibles : {availability.unavailableInternal.join(', ')}.</p>
      )}

      <section aria-label="Vue immédiate" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardMetric index={0} label="Demandes" value={stats.newRequests} helper="À qualifier" icon={UserRoundCheck} to="/demandes" loading={loading} emphasis />
        <DashboardMetric index={1} label="Campagnes" value={stats.connectedCampaigns || stats.activeCampaigns} helper="Sous contrôle" icon={Megaphone} to="/campaigns" loading={loading} />
        <DashboardMetric index={2} label="Disponibilités OOH" value={stats.availableEmplacements} helper="Emplacements libres" icon={MapPin} to="/inventory" loading={loading} />
        <DashboardMetric index={3} label="Factures" value={stats.unpaidInvoices} helper="Paiements à suivre" icon={ReceiptText} to="/invoices" loading={loading} emphasis={stats.unpaidInvoices > 0} />
        <DashboardMetric index={4} label="Revenus estimés" value={`${stats.revenue.toLocaleString('fr-FR')} USD`} helper="Réservations internes" icon={DollarSign} to="/invoices" loading={loading} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <PriorityList items={priorities} loading={loading} />
        <OperationalOverview occupancy={stats.occupancy} availableEmplacements={stats.availableEmplacements} campaigns={activeCampaigns} loading={loading} unavailable={!availability.inventory} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <DashboardActivity contacts={latestContacts} campaigns={latestCampaigns} contactsAvailable={availability.contacts} campaignsAvailable={availability.campaigns} loading={loading} />
        <DashboardQuickActions />
      </section>
    </div>
  )
}
