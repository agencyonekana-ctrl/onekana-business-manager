import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ClipboardCheck, Filter, RefreshCw, Search, UserRoundCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader } from '../components/app/PageHeader'
import { EmptyState } from '../components/app/EmptyState'
import { ApprovalCaseDrawer } from '../components/approvals/ApprovalCaseDrawer'
import { ApprovalPriorityBadge, ApprovalStatusBadge } from '../components/approvals/ApprovalBadges'
import { approvalResourceLabels, approvalStatusLabels } from '../components/approvals/approval-labels'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { approvalApi } from '../services/approval-api'
import type { ApprovalAssignee, ApprovalCase, ApprovalListResponse, ApprovalPriority, ApprovalResourceType, ApprovalStatus } from '../types/approvals'
import { can } from '../lib/access-control'
import { useAuth } from '../hooks/use-auth'

const initialResponse: ApprovalListResponse = { data: [], meta: { current_page: 1, per_page: 20, total: 0, last_page: 1 } }
const statusOptions: Array<ApprovalStatus | 'all'> = ['all', 'pending', 'in_review', 'needs_information', 'approved', 'rejected', 'archived']

export default function ApprovalCenter() {
  const { user } = useAuth()
  const [response, setResponse] = useState(initialResponse)
  const [assignees, setAssignees] = useState<ApprovalAssignee[]>([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [importing, setImporting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ApprovalStatus | 'all'>('all')
  const [priority, setPriority] = useState<ApprovalPriority | 'all'>('all')
  const [resourceType, setResourceType] = useState<ApprovalResourceType | 'all'>('all')
  const [assignedTo, setAssignedTo] = useState('all')
  const [page, setPage] = useState(1)
  const canImport = can(user, 'approvals.manage')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cases, users] = await Promise.all([
        approvalApi.list({ q: search, status, priority, resourceType, assignedTo, page, perPage: 20 }),
        approvalApi.assignees(),
      ])
      setResponse(cases); setAssignees(users); setUnavailable(false)
    } catch { setResponse(initialResponse); setUnavailable(true) }
    finally { setLoading(false) }
  }, [assignedTo, page, priority, resourceType, search, status])

  useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer) }, [load])
  useEffect(() => { setPage(1) }, [search, status, priority, resourceType, assignedTo])

  const statusCounts = useMemo(() => response.data.reduce<Record<string, number>>((counts, item) => ({ ...counts, [item.status]: (counts[item.status] || 0) + 1 }), {}), [response.data])

  async function importCases() {
    setImporting(true)
    try { await approvalApi.import(); toast.success('Les dossiers ont été actualisés.'); await load() }
    catch { toast.error('L’actualisation n’a pas pu être terminée.') }
    finally { setImporting(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Pilotage administratif" title="Centre de validation" description="Traitez les dossiers qui demandent une décision, attribuez les responsabilités et conservez un historique complet des contrôles." action={canImport ? <Button onClick={importCases} disabled={importing} className="gap-2"><RefreshCw className={`h-4 w-4 ${importing ? 'animate-spin' : ''}`} />{importing ? 'Actualisation...' : 'Actualiser les dossiers'}</Button> : undefined} />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Résumé de la file">
        <QueueMetric icon={ClipboardCheck} label="À examiner" value={statusCounts.pending || 0} active={status === 'pending'} onClick={() => setStatus(status === 'pending' ? 'all' : 'pending')} />
        <QueueMetric icon={UserRoundCheck} label="En cours" value={statusCounts.in_review || 0} active={status === 'in_review'} onClick={() => setStatus(status === 'in_review' ? 'all' : 'in_review')} />
        <QueueMetric icon={AlertTriangle} label="Informations attendues" value={statusCounts.needs_information || 0} active={status === 'needs_information'} onClick={() => setStatus(status === 'needs_information' ? 'all' : 'needs_information')} />
        <QueueMetric icon={ClipboardCheck} label="Total filtré" value={response.meta.total} active={status === 'all'} onClick={() => setStatus('all')} />
      </section>

      <Card className="overflow-hidden border-border bg-white">
        <CardHeader className="border-b border-border p-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(240px,1fr)_190px_170px_190px_190px]">
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un dossier..." className="pl-9" /></div>
            <FilterSelect value={status} onValueChange={(value) => setStatus(value as ApprovalStatus | 'all')} placeholder="Statut">{statusOptions.map((value) => <SelectItem key={value} value={value}>{value === 'all' ? 'Tous les statuts' : approvalStatusLabels[value]}</SelectItem>)}</FilterSelect>
            <FilterSelect value={priority} onValueChange={(value) => setPriority(value as ApprovalPriority | 'all')} placeholder="Priorité"><SelectItem value="all">Toutes les priorités</SelectItem><SelectItem value="urgent">Urgente</SelectItem><SelectItem value="high">Haute</SelectItem><SelectItem value="normal">Normale</SelectItem><SelectItem value="low">Faible</SelectItem></FilterSelect>
            <FilterSelect value={resourceType} onValueChange={(value) => setResourceType(value as ApprovalResourceType | 'all')} placeholder="Domaine"><SelectItem value="all">Tous les domaines</SelectItem>{Object.entries(approvalResourceLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</FilterSelect>
            <FilterSelect value={assignedTo} onValueChange={setAssignedTo} placeholder="Responsable"><SelectItem value="all">Tous les responsables</SelectItem>{assignees.map((entry) => <SelectItem key={entry.id} value={entry.id}>{entry.displayName || entry.name}</SelectItem>)}</FilterSelect>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="p-10 text-center text-sm text-muted-foreground">Chargement de la file de validation...</div> : response.data.length === 0 ? <div className="p-6"><EmptyState title={unavailable ? 'Dossiers temporairement indisponibles' : 'Aucun dossier à traiter'} description={unavailable ? 'Le centre de validation sera de nouveau disponible dès que le service répondra.' : 'Les nouveaux dossiers ou éléments signalés apparaîtront ici.'} /></div> : (
            <Table>
              <TableHeader><TableRow className="bg-muted/40"><TableHead>Dossier</TableHead><TableHead>Domaine</TableHead><TableHead>Responsable</TableHead><TableHead>Échéance</TableHead><TableHead>Priorité</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>{response.data.map((item) => <ApprovalRow key={item.id} item={item} onOpen={() => setSelectedId(item.id)} />)}</TableBody>
            </Table>
          )}
          {!loading && response.meta.total > 0 ? <div className="flex items-center justify-between border-t border-border px-4 py-3"><span className="text-xs text-muted-foreground">Page {response.meta.current_page} sur {response.meta.last_page} · {response.meta.total} dossiers</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Précédent</Button><Button variant="outline" size="sm" disabled={page >= response.meta.last_page} onClick={() => setPage((value) => value + 1)}>Suivant</Button></div></div> : null}
        </CardContent>
      </Card>

      <ApprovalCaseDrawer caseId={selectedId} open={Boolean(selectedId)} onOpenChange={(open) => { if (!open) setSelectedId(null) }} onChanged={load} />
    </div>
  )
}

function QueueMetric({ icon: Icon, label, value, active, onClick }: { icon: typeof ClipboardCheck; label: string; value: number; active: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={`flex items-center justify-between rounded-lg border bg-white p-4 text-left transition-all hover:-translate-y-px hover:border-primary/25 hover:shadow-sm ${active ? 'border-primary/30 ring-2 ring-primary/10' : 'border-border'}`}><div><span className="text-2xl font-black">{value}</span><span className="mt-1 block text-xs font-black uppercase text-muted-foreground">{label}</span></div><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span></button> }
function FilterSelect({ value, onValueChange, placeholder, children }: { value: string; onValueChange: (value: string) => void; placeholder: string; children: React.ReactNode }) { return <Select value={value} onValueChange={onValueChange}><SelectTrigger><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{children}</SelectContent></Select> }
function ApprovalRow({ item, onOpen }: { item: ApprovalCase; onOpen: () => void }) { return <TableRow className="cursor-pointer" onClick={onOpen}><TableCell><div className="font-bold">{item.title}</div><div className="mt-1 text-xs text-muted-foreground">{item.companyName || item.subtitle || `Référence ${item.externalId}`}</div></TableCell><TableCell>{approvalResourceLabels[item.resourceType]}</TableCell><TableCell>{item.assigneeName || <span className="text-muted-foreground">Non assigné</span>}</TableCell><TableCell className={isOverdue(item) ? 'font-bold text-primary' : 'text-muted-foreground'}>{formatDate(item.dueAt)}</TableCell><TableCell><ApprovalPriorityBadge priority={item.priority} /></TableCell><TableCell><ApprovalStatusBadge status={item.status} /></TableCell><TableCell className="text-right"><Button variant="outline" size="sm" onClick={(event) => { event.stopPropagation(); onOpen() }}>Ouvrir</Button></TableCell></TableRow> }
function isOverdue(item: ApprovalCase) { return Boolean(item.dueAt && !['approved', 'rejected', 'archived'].includes(item.status) && new Date(item.dueAt.replace(' ', 'T') + 'Z').getTime() < Date.now()) }
function formatDate(value?: string | null) { if (!value) return 'Sans échéance'; const date = new Date(value.replace(' ', 'T') + 'Z'); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date) }
