import { useEffect, useMemo, useState } from 'react'
import { Mail, Phone, Search, Tag } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { agencyApi, type AgencyContactMessage } from '../services/agency-api'
import { EmptyState } from '../components/app/EmptyState'
import { PageHeader } from '../components/app/PageHeader'
import { StatusBadge } from '../components/app/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

const commercialStages = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'qualification', label: 'Qualification' },
  { value: 'proposition', label: 'Proposition' },
  { value: 'negociation', label: 'Negociation' },
  { value: 'gagne', label: 'Gagne' },
  { value: 'perdu', label: 'Perdu' },
  { value: 'inactif', label: 'Inactif' },
]

export default function Contacts() {
  const [contacts, setContacts] = useState<AgencyContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [agencyUnavailable, setAgencyUnavailable] = useState(false)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [sectorFilter, setSectorFilter] = useState('all')

  useEffect(() => {
    fetchContacts()
  }, [])

  async function fetchContacts() {
    setLoading(true)
    try {
      const rows = await agencyApi.contacts.list()
      setContacts(rows)
      setAgencyUnavailable(false)
    } catch {
      setContacts([])
      setAgencyUnavailable(true)
      toast.error('Connexion Agency temporairement indisponible')
    } finally {
      setLoading(false)
    }
  }

  const sectors = useMemo(() => {
    return Array.from(new Set(contacts.flatMap(contactSectors))).filter(Boolean).sort()
  }, [contacts])

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase()

    return contacts.filter((contact) => {
      const haystack = [
        contact.name,
        contact.email,
        contactCompany(contact),
        contactPhone(contact),
        contactStage(contact),
        ...contactSectors(contact),
      ].join(' ').toLowerCase()

      const matchesSearch = !query || haystack.includes(query)
      const matchesStage = stageFilter === 'all' || contactStage(contact) === stageFilter
      const matchesSector = sectorFilter === 'all' || contactSectors(contact).includes(sectorFilter)

      return matchesSearch && matchesStage && matchesSector
    })
  }, [contacts, search, sectorFilter, stageFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Activite recue"
        title="Contacts"
        description="Consultez les contacts enregistres dans ONEKANA, retrouvez leurs coordonnees et suivez leur etat commercial."
      />

      <section className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="Contacts" value={contacts.length} />
        <SummaryCard label="Entreprises" value={new Set(contacts.map(contactCompany).filter((value) => value !== 'Non renseignee')).size} />
        <SummaryCard label="Secteurs" value={sectors.length} />
      </section>

      <Card className="border-border bg-white" data-tour="contacts-table">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-base font-black uppercase">Repertoire contacts</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Cette vue sert a retrouver rapidement les contacts, leurs entreprises et leurs coordonnees.
              </p>
            </div>
            <StatusBadge tone="red">{filteredContacts.length} contacts</StatusBadge>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher nom, email, entreprise..."
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
            <div className="h-32 p-6 text-center text-sm text-muted-foreground">Chargement des contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title={agencyUnavailable ? 'Connexion Agency indisponible' : 'Aucun contact a afficher'}
                description={agencyUnavailable
                  ? 'Les contacts seront disponibles ici apres validation de la connexion Agency.'
                  : 'Les contacts enregistres apparaitront ici des qu ils seront disponibles.'}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Contact</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Secteur</TableHead>
                  <TableHead>Coordonnees</TableHead>
                  <TableHead>Etat</TableHead>
                  <TableHead>Derniere mise a jour</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div className="font-bold">{contact.name || 'Contact non renseigne'}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{contact.raw.fonction || contact.raw.role || 'Fonction non renseignee'}</div>
                    </TableCell>
                    <TableCell>{contactCompany(contact)}</TableCell>
                    <TableCell>{contactSectors(contact).join(', ') || 'Non renseigne'}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {contact.email ? (
                          <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-primary">
                            <Mail className="h-3.5 w-3.5" />
                            {contact.email}
                          </a>
                        ) : null}
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {contactPhone(contact)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell><ContactStageBadge stage={contactStage(contact)} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{contactDate(contact)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="border-border bg-white">
      <CardContent className="p-5">
        <span className="text-2xl font-black">{value}</span>
        <span className="mt-1 block text-xs font-black uppercase text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  )
}

function ContactStageBadge({ stage }: { stage: string }) {
  const label = commercialStages.find((item) => item.value === stage)?.label || stage || 'Prospect'
  const tone = stage === 'qualification' || stage === 'prospect' ? 'red' : stage === 'gagne' ? 'dark' : 'neutral'

  return <StatusBadge tone={tone}>{label}</StatusBadge>
}

function contactStage(contact: AgencyContactMessage) {
  return String(contact.raw.etape_achat || contact.raw.etape || contact.status || 'prospect').trim().toLowerCase()
}

function contactCompany(contact: AgencyContactMessage) {
  return String(contact.raw.company_name || contact.raw.company || contact.raw.organisation || 'Non renseignee')
}

function contactPhone(contact: AgencyContactMessage) {
  const phones = contact.raw.phones || contact.raw.phone || contact.raw.telephone || contact.raw.tel
  if (Array.isArray(phones)) return String(phones[0] || 'Non renseigne')
  return String(phones || 'Non renseigne')
}

function contactSectors(contact: AgencyContactMessage) {
  const rawSectors = contact.raw.sectors || contact.raw.secteurs || contact.raw.sector || contact.raw.secteur

  if (Array.isArray(rawSectors)) {
    return rawSectors.map((sector) => String(sector).trim()).filter(Boolean)
  }

  if (typeof rawSectors === 'string') {
    return rawSectors.split(',').map((sector) => sector.trim()).filter(Boolean)
  }

  return []
}

function contactDate(contact: AgencyContactMessage) {
  const value = String(contact.raw.updated_at || contact.raw.created_at || contact.createdAt || '').trim()

  if (!value) return 'Non renseignee'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('fr-FR')
}
