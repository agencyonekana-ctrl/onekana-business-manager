import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays, format, startOfToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  CalendarClock,
  Eye,
  FileText,
  Filter,
  MapPin,
  Megaphone,
  ReceiptText,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { agencyApi } from '../services/agency-api'
import { dataClient } from '../lib/data-client'
import { PageHeader } from '../components/app/PageHeader'
import { EmptyState } from '../components/app/EmptyState'
import { StatusBadge } from '../components/app/StatusBadge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { ApprovalCaseDrawer } from '../components/approvals/ApprovalCaseDrawer'
import { ApprovalResourceControl } from '../components/approvals/ApprovalResourceControl'
import { useApprovalCases } from '../hooks/use-approval-cases'

type AgencyCampaign = Record<string, any>

type InternalCampaign = {
  id: string
  name: string
  clientName: string
  startDate: string
  endDate: string
  status: string
}

type CampaignLine = {
  id: string
  campaignId: string
  emplacementId: string
  totalPrice?: number
}

type Emplacement = {
  id: string
  name: string
  status?: string
}

const statusFilters = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'pending', label: 'A verifier' },
  { value: 'active', label: 'En cours' },
  { value: 'completed', label: 'Terminees' },
  { value: 'archived', label: 'Archivees' },
]

const pendingStatus = ['new', 'nouveau', 'pending', 'en_attente', 'draft', 'verification', 'a_verifier', 'submitted']
const activeStatus = ['active', 'en_cours', 'ongoing', 'validated', 'validee', 'running']
const completedStatus = ['done', 'completed', 'terminee', 'finished', 'closed']
const archivedStatus = ['archived', 'archivee', 'inactive']

export default function Campaigns() {
  const [agencyCampaigns, setAgencyCampaigns] = useState<AgencyCampaign[]>([])
  const [internalCampaigns, setInternalCampaigns] = useState<InternalCampaign[]>([])
  const [campaignLines, setCampaignLines] = useState<CampaignLine[]>([])
  const [emplacements, setEmplacements] = useState<Emplacement[]>([])
  const [loading, setLoading] = useState(true)
  const [agencyUnavailable, setAgencyUnavailable] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const approvals = useApprovalCases('agency_campaign')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      let received: AgencyCampaign[] = []
      try {
        received = await agencyApi.campaigns.list<AgencyCampaign>()
        setAgencyUnavailable(false)
      } catch {
        setAgencyUnavailable(true)
      }

      const [localCampaigns, lines, oohEmplacements] = await Promise.all([
        dataClient.db.oohCampaigns.list().catch(() => []),
        dataClient.db.oohCampaignLines.list().catch(() => []),
        dataClient.db.oohEmplacements.list().catch(() => []),
      ])

      setAgencyCampaigns(received)
      setInternalCampaigns(localCampaigns as InternalCampaign[])
      setCampaignLines(lines as CampaignLine[])
      setEmplacements(oohEmplacements as Emplacement[])
    } finally {
      setLoading(false)
    }
  }

  const filteredCampaigns = useMemo(() => {
    const query = search.trim().toLowerCase()

    return agencyCampaigns.filter((campaign) => {
      const haystack = [
        campaignName(campaign),
        campaignClient(campaign),
        campaignStatusLabel(campaign),
        campaignNeed(campaign),
      ].join(' ').toLowerCase()

      const matchesSearch = !query || haystack.includes(query)
      const matchesStatus = statusFilter === 'all' || statusBucket(campaign) === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [agencyCampaigns, search, statusFilter])

  const selectedCampaign = useMemo(() => {
    return filteredCampaigns.find((campaign) => campaignId(campaign) === selectedId) ?? filteredCampaigns[0] ?? null
  }, [filteredCampaigns, selectedId])

  const today = startOfToday()
  const todayString = format(today, 'yyyy-MM-dd')
  const timelineDays = Array.from({ length: 14 }).map((_, index) => addDays(today, index))
  const activeInternalCampaigns = internalCampaigns.filter(
    (campaign) => campaign.startDate <= todayString && campaign.endDate >= todayString
  )
  const occupiedIds = new Set(
    campaignLines
      .filter((line) => activeInternalCampaigns.some((campaign) => campaign.id === line.campaignId))
      .map((line) => line.emplacementId)
  )

  const stats = [
    { label: 'Campagnes recues', value: agencyCampaigns.length, icon: Megaphone },
    { label: 'A verifier', value: agencyCampaigns.filter((campaign) => statusBucket(campaign) === 'pending').length, icon: ShieldCheck },
    { label: 'En cours', value: agencyCampaigns.filter((campaign) => statusBucket(campaign) === 'active').length, icon: CalendarClock },
    { label: 'Disponibilites OOH', value: Math.max(0, emplacements.length - occupiedIds.size), icon: MapPin },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Activité reçue"
        title="Campagnes reçues"
        description="Consultez, filtrez et contrôlez les campagnes transmises aux équipes ONEKANA. Cette page sert au suivi administratif, pas à la création de campagnes."
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border bg-white">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div>
                <span className="text-2xl font-black">{stat.value}</span>
                <span className="mt-1 block text-xs font-black uppercase text-muted-foreground">{stat.label}</span>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <stat.icon className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="border-border bg-white" data-tour="campaigns-workspace">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-base font-black uppercase">Suivi des campagnes</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Recherchez une campagne, verifiez son etat et ouvrez les modules utiles pour les controles.
              </p>
            </div>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/inventory">
                <MapPin className="h-4 w-4" />
                Controler les disponibilites
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher par client, campagne, besoin..."
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>{filter.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Chargement des campagnes...</div>
          ) : filteredCampaigns.length === 0 ? (
            <EmptyState
              title={agencyUnavailable ? 'Connexion Agency indisponible' : 'Aucune campagne a afficher'}
              description={agencyUnavailable
                ? 'Les campagnes seront disponibles ici apres validation de la connexion Agency.'
                : 'Les campagnes recues apparaitront ici des qu elles seront disponibles.'}
            />
          ) : (
            <div className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
              <div className="overflow-hidden rounded-2xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Campagne</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Contrôle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map((campaign) => {
                      const id = campaignId(campaign)
                      const selected = selectedCampaign && campaignId(selectedCampaign) === id

                      return (
                        <TableRow
                          key={id}
                          className={selected ? 'bg-primary/5' : ''}
                          onClick={() => setSelectedId(id)}
                        >
                          <TableCell>
                            <div className="font-bold">{campaignName(campaign)}</div>
                            <div className="mt-1 max-w-xs truncate text-xs text-muted-foreground">{campaignNeed(campaign)}</div>
                          </TableCell>
                          <TableCell>{campaignClient(campaign)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{campaignPeriod(campaign)}</TableCell>
                          <TableCell><CampaignStatusBadge campaign={campaign} /></TableCell>
                          <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                            <div className="flex flex-col items-end gap-2">
                              <Button variant="ghost" size="sm" className="gap-2" onClick={() => setSelectedId(id)}>
                                <Eye className="h-4 w-4" />
                                Voir
                              </Button>
                              <ApprovalResourceControl
                                item={approvals.byExternalId.get(id)}
                                resourceType="agency_campaign"
                                externalId={id}
                                title={campaignName(campaign)}
                                subtitle={campaignNeed(campaign)}
                                companyName={campaignClient(campaign)}
                                snapshot={campaign}
                                priority={statusBucket(campaign) === 'pending' ? 'high' : 'normal'}
                                onOpen={setSelectedCaseId}
                                onCreated={approvals.reload}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <CampaignDetail campaign={selectedCampaign} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-black uppercase">
            <CalendarClock className="h-5 w-5 text-primary" />
            Controle visuel des emplacements
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Lecture des occupations connues sur les 14 prochains jours.
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {emplacements.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Aucun emplacement"
                description="Les emplacements controles apparaitront ici des qu'ils seront disponibles."
              />
            </div>
          ) : (
            <div className="min-w-[860px]">
              <div className="grid grid-cols-[220px_repeat(14,1fr)] border-b border-border">
                <div className="border-r border-border bg-muted/40 p-3 text-sm font-black">Emplacement</div>
                {timelineDays.map((day) => (
                  <div key={day.toISOString()} className="border-r border-border bg-muted/40 p-3 text-center text-xs font-bold last:border-r-0">
                    <div className="uppercase text-muted-foreground">{format(day, 'EEE', { locale: fr })}</div>
                    <div>{format(day, 'dd/MM')}</div>
                  </div>
                ))}
              </div>
              <div className="divide-y divide-border">
                {emplacements.map((emplacement) => (
                  <div key={emplacement.id} className="grid h-12 grid-cols-[220px_repeat(14,1fr)]">
                    <div className="truncate border-r border-border p-3 text-sm font-semibold">{emplacement.name}</div>
                    {timelineDays.map((day) => {
                      const dayString = format(day, 'yyyy-MM-dd')
                      const line = campaignLines.find((item) => {
                        if (item.emplacementId !== emplacement.id) return false
                        const campaign = internalCampaigns.find((row) => row.id === item.campaignId)
                        if (!campaign) return false
                        return dayString >= campaign.startDate && dayString <= campaign.endDate
                      })
                      const campaign = line ? internalCampaigns.find((row) => row.id === line.campaignId) : null

                      return (
                        <div key={day.toISOString()} className="flex items-center justify-center border-r border-border p-1 last:border-r-0">
                          {campaign ? (
                            <div
                              className="h-full w-full rounded-lg border border-primary/25 bg-primary/10 px-1 text-center text-[10px] font-black leading-8 text-primary"
                              title={`${campaign.name} - ${campaign.clientName}`}
                            >
                              {campaign.clientName?.slice(0, 3) || 'OOH'}
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <ApprovalCaseDrawer caseId={selectedCaseId} open={Boolean(selectedCaseId)} onOpenChange={(open) => { if (!open) setSelectedCaseId(null) }} onChanged={approvals.reload} />
    </div>
  )
}

function CampaignDetail({ campaign }: { campaign: AgencyCampaign | null }) {
  if (!campaign) {
    return (
      <EmptyState
        title="Aucun detail selectionne"
        description="Selectionnez une campagne pour afficher les informations de controle."
      />
    )
  }

  return (
    <aside className="rounded-2xl border border-border bg-[#fbfbfb] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black uppercase">{campaignName(campaign)}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{campaignClient(campaign)}</p>
        </div>
        <CampaignStatusBadge campaign={campaign} />
      </div>

      <div className="mt-5 space-y-4 text-sm">
        <InfoLine label="Periode" value={campaignPeriod(campaign)} />
        <InfoLine label="Besoin" value={campaignNeed(campaign)} />
        <InfoLine label="Budget" value={campaignBudget(campaign)} />
        <InfoLine label="Reference" value={campaignReference(campaign)} />
      </div>

      <div className="mt-6 grid gap-2">
        <Button asChild variant="outline" className="justify-start gap-2">
          <Link to="/inventory">
            <MapPin className="h-4 w-4" />
            Controler la disponibilite
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start gap-2">
          <Link to="/documents">
            <FileText className="h-4 w-4" />
            Ouvrir les documents
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start gap-2">
          <Link to="/invoices">
            <ReceiptText className="h-4 w-4" />
            Suivre les paiements
          </Link>
        </Button>
      </div>
    </aside>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[11px] font-black uppercase text-muted-foreground">{label}</span>
      <span className="mt-1 block font-semibold text-foreground">{value}</span>
    </div>
  )
}

function CampaignStatusBadge({ campaign }: { campaign: AgencyCampaign }) {
  const bucket = statusBucket(campaign)
  const tone = bucket === 'pending' ? 'red' : bucket === 'active' ? 'dark' : 'neutral'

  return <StatusBadge tone={tone}>{campaignStatusLabel(campaign)}</StatusBadge>
}

function campaignId(campaign: AgencyCampaign) {
  return String(campaign.id ?? campaign.campaign_id ?? campaign.uuid ?? campaign.reference ?? JSON.stringify(campaign))
}

function campaignName(campaign: AgencyCampaign) {
  return pickString(campaign, ['name', 'campaign_name', 'title', 'nom', 'label'], 'Campagne sans nom')
}

function campaignClient(campaign: AgencyCampaign) {
  return pickString(campaign, ['clientName', 'client_name', 'company_name', 'company', 'customer_name', 'entreprise'], 'Client non renseigne')
}

function campaignNeed(campaign: AgencyCampaign) {
  return pickString(campaign, ['need', 'besoin', 'objective', 'objectif', 'description', 'message'], 'Besoin non renseigne')
}

function campaignStatusLabel(campaign: AgencyCampaign) {
  return pickString(campaign, ['status', 'etat', 'state', 'workflow_status'], 'A verifier')
}

function campaignReference(campaign: AgencyCampaign) {
  return pickString(campaign, ['reference', 'ref', 'campaign_code', 'code'], 'Non renseignee')
}

function campaignBudget(campaign: AgencyCampaign) {
  const value = campaign.budget ?? campaign.amount ?? campaign.total ?? campaign.price ?? campaign.montant
  const numeric = Number(value)

  if (Number.isFinite(numeric) && numeric > 0) {
    return `${numeric.toLocaleString()} USD`
  }

  return 'Non renseigne'
}

function campaignPeriod(campaign: AgencyCampaign) {
  const start = pickString(campaign, ['startDate', 'start_date', 'date_debut', 'from'], '')
  const end = pickString(campaign, ['endDate', 'end_date', 'date_fin', 'to'], '')

  if (!start && !end) return 'Periode non renseignee'
  if (start && end) return `${formatDate(start)} - ${formatDate(end)}`
  return formatDate(start || end)
}

function statusBucket(campaign: AgencyCampaign) {
  const status = campaignStatusLabel(campaign).trim().toLowerCase()

  if (pendingStatus.includes(status)) return 'pending'
  if (activeStatus.includes(status)) return 'active'
  if (completedStatus.includes(status)) return 'completed'
  if (archivedStatus.includes(status)) return 'archived'

  return 'pending'
}

function pickString(source: Record<string, any>, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = source[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value)
    }
  }

  return fallback
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('fr-FR')
}
