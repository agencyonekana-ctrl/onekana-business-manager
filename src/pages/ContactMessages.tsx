import { useEffect, useMemo, useState } from 'react'
import { Search, Tag } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { agencyApi, type AgencyContactMessage } from '../services/agency-api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { EmptyState } from '../components/app/EmptyState'
import { PageHeader } from '../components/app/PageHeader'
import { StatusBadge } from '../components/app/StatusBadge'
import { ApprovalCaseDrawer } from '../components/approvals/ApprovalCaseDrawer'
import { ApprovalResourceControl } from '../components/approvals/ApprovalResourceControl'
import { useApprovalCases } from '../hooks/use-approval-cases'

type ContactMessage = AgencyContactMessage

const commercialStages = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'qualification', label: 'Qualification' },
  { value: 'proposition', label: 'Proposition' },
  { value: 'negociation', label: 'Negociation' },
  { value: 'gagne', label: 'Gagne' },
  { value: 'perdu', label: 'Perdu' },
  { value: 'inactif', label: 'Inactif' },
]

export default function ContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [sectorFilter, setSectorFilter] = useState('all')
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const approvals = useApprovalCases('agency_request')

  useEffect(() => {
    fetchMessages()
  }, [])

  async function fetchMessages() {
    setLoading(true)
    try {
      const rows = await agencyApi.contacts.list()
      setMessages(rows)
    } catch {
      setMessages([])
      toast.error('Donnees temporairement indisponibles')
    } finally {
      setLoading(false)
    }
  }

  const sectors = useMemo(() => {
    return Array.from(new Set(messages.flatMap(contactSectors))).filter(Boolean).sort()
  }, [messages])

  const filteredMessages = useMemo(() => {
    const query = search.trim().toLowerCase()

    return messages.filter((message) => {
      const haystack = [
        message.name,
        message.email,
        contactCompany(message),
        contactNeed(message),
        message.message,
        contactStage(message),
        ...contactSectors(message),
      ].join(' ').toLowerCase()

      const matchesSearch = !query || haystack.includes(query)
      const matchesStage = stageFilter === 'all' || contactStage(message) === stageFilter
      const matchesSector = sectorFilter === 'all' || contactSectors(message).includes(sectorFilter)

      return matchesSearch && matchesStage && matchesSector
    })
  }, [messages, search, sectorFilter, stageFilter])

  const stageCounts = useMemo(() => {
    return commercialStages.reduce<Record<string, number>>((acc, stage) => {
      acc[stage.value] = messages.filter((message) => contactStage(message) === stage.value).length
      return acc
    }, {})
  }, [messages])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Activité reçue"
        title="Demandes clients"
        description="Qualifiez les demandes reçues, attribuez leur contrôle et suivez chaque décision administrative."
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {commercialStages.map((stage) => (
          <button
            key={stage.value}
            type="button"
            onClick={() => setStageFilter(stage.value)}
            className={`rounded-2xl border bg-white p-4 text-left transition-all hover:border-primary/25 hover:shadow-sm ${
              stageFilter === stage.value ? 'border-primary/30 ring-2 ring-primary/10' : 'border-border'
            }`}
          >
            <span className="block text-2xl font-black">{stageCounts[stage.value] || 0}</span>
            <span className="mt-1 block text-[11px] font-black uppercase text-muted-foreground">{stage.label}</span>
          </button>
        ))}
      </section>

      <Card className="border-border bg-white" data-tour="client-requests-table">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-base font-black uppercase">Indexation des demandes</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Filtrez les contacts reçus et repérez les demandes qui nécessitent une intervention.
              </p>
            </div>
            <StatusBadge tone="red">{filteredMessages.length} resultats</StatusBadge>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher contact, entreprise, besoin..."
                className="pl-9"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Etape" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les etapes</SelectItem>
                {commercialStages.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger>
                <Tag className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Secteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les secteurs</SelectItem>
                {sectors.map((sector) => (
                  <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="h-32 p-6 text-center text-sm text-muted-foreground">Chargement des demandes...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Aucune demande a afficher"
                description="Les donnees recues apparaitront ici des qu'elles seront disponibles."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Contact</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Besoin</TableHead>
                  <TableHead>Étape</TableHead>
                  <TableHead>Prochaine action</TableHead>
                  <TableHead className="text-right">Contrôle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <div className="font-bold">{message.name || 'Contact non renseigne'}</div>
                      {message.email ? <a className="text-xs text-primary" href={`mailto:${message.email}`}>{message.email}</a> : null}
                    </TableCell>
                    <TableCell>{contactCompany(message)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{contactNeed(message)}</div>
                      <div className="mt-1 max-w-sm truncate text-xs text-muted-foreground">{message.message}</div>
                    </TableCell>
                    <TableCell>
                      <ContactStageBadge stage={contactStage(message)} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{nextContactDate(message)}</TableCell>
                    <TableCell className="text-right">
                      <ApprovalResourceControl
                        item={approvals.byExternalId.get(message.id)}
                        resourceType="agency_request"
                        externalId={message.id}
                        title={contactNeed(message)}
                        subtitle={message.name || message.email || undefined}
                        companyName={contactCompany(message)}
                        snapshot={message.raw}
                        priority="high"
                        onOpen={setSelectedCaseId}
                        onCreated={approvals.reload}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <ApprovalCaseDrawer caseId={selectedCaseId} open={Boolean(selectedCaseId)} onOpenChange={(open) => { if (!open) setSelectedCaseId(null) }} onChanged={approvals.reload} />
    </div>
  )
}

function ContactStageBadge({ stage }: { stage: string }) {
  const label = commercialStages.find((item) => item.value === stage)?.label || stage || 'Prospect'
  const tone = stage === 'qualification' || stage === 'prospect' ? 'red' : stage === 'gagne' ? 'dark' : 'neutral'

  return <StatusBadge tone={tone}>{label}</StatusBadge>
}

function contactStage(message: ContactMessage) {
  return String(message.raw.etape_achat || message.raw.etape || message.status || 'prospect').trim().toLowerCase()
}

function contactCompany(message: ContactMessage) {
  return String(message.raw.company_name || message.raw.company || message.raw.organisation || 'Non renseignee')
}

function contactNeed(message: ContactMessage) {
  return String(message.raw.support_solicited || message.subject || message.raw.besoin || 'Demande generale')
}

function contactSectors(message: ContactMessage) {
  const rawSectors = message.raw.sectors || message.raw.secteurs || message.raw.sector || message.raw.secteur

  if (Array.isArray(rawSectors)) {
    return rawSectors.map((sector) => String(sector).trim()).filter(Boolean)
  }

  if (typeof rawSectors === 'string') {
    return rawSectors.split(',').map((sector) => sector.trim()).filter(Boolean)
  }

  return []
}

function nextContactDate(message: ContactMessage) {
  const value = String(message.raw.next_contact_date || message.raw.nextContactDate || '').trim()

  if (!value) return 'A planifier'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('fr-FR')
}
