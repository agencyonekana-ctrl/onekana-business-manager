import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Building2, CalendarClock, CheckCircle2, ChevronRight, ClipboardCheck, FileText, MapPin, Megaphone, ReceiptText, Users } from 'lucide-react'
import { ApprovalCaseDrawer } from '../components/approvals/ApprovalCaseDrawer'
import { ApprovalPriorityBadge, ApprovalStatusBadge } from '../components/approvals/ApprovalBadges'
import { approvalResourceLabels } from '../components/approvals/approval-labels'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { useAuth } from '../hooks/use-auth'
import { dataClient } from '../lib/data-client'
import { agencyApi, type AgencySummary } from '../services/agency-api'
import { approvalApi } from '../services/approval-api'
import type { ApprovalCase, ApprovalOverview } from '../types/approvals'

type ContextStats = { contacts: number; campaigns: number; available: number; unpaidInvoices: number }

export default function Dashboard() {
  const { user } = useAuth()
  const [overview, setOverview] = useState<ApprovalOverview | null>(null)
  const [priorityCases, setPriorityCases] = useState<ApprovalCase[]>([])
  const [context, setContext] = useState<ContextStats>({ contacts: 0, campaigns: 0, available: 0, unpaidInvoices: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState<string[]>([])

  async function load() {
    setLoading(true)
    const results = await Promise.allSettled([
      approvalApi.overview(),
      approvalApi.list({ open: true, perPage: 6 }),
      agencyApi.summary(),
      dataClient.db.oohEmplacements.list(),
      dataClient.db.invoices.list(),
    ])
    const missing: string[] = []
    if (results[0].status === 'fulfilled') setOverview(results[0].value); else { setOverview(null); missing.push('centre de validation') }
    if (results[1].status === 'fulfilled') setPriorityCases(results[1].value.data); else setPriorityCases([])
    const agency = results[2].status === 'fulfilled' ? results[2].value as AgencySummary : null
    const emplacements = results[3].status === 'fulfilled' ? results[3].value as Array<Record<string, unknown>> : []
    const invoices = results[4].status === 'fulfilled' ? results[4].value as Array<Record<string, unknown>> : []
    if (results[2].status === 'rejected') missing.push('activité reçue')
    if (results[3].status === 'rejected') missing.push('inventaire OOH')
    if (results[4].status === 'rejected') missing.push('facturation')
    setContext({
      contacts: Number(agency?.contacts ?? 0),
      campaigns: Number(agency?.campaigns ?? 0),
      available: emplacements.filter((item) => !['occupied', 'booked', 'indisponible'].includes(String(item.status || '').toLowerCase())).length,
      unpaidInvoices: invoices.filter((item) => !['paid', 'payee', 'paid_full'].includes(String(item.status || '').toLowerCase())).length,
    })
    setUnavailable(missing)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCases = useMemo(() => overview ? overview.counts.pending + overview.counts.in_review + overview.counts.needs_information : 0, [overview])
  const displayDate = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-black uppercase text-primary">{displayDate}</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Bonjour {user.displayName}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Voici les décisions, contrôles et activités qui demandent l’attention de l’administration ONEKANA.</p></div>
        <Button asChild variant="outline" className="gap-2"><Link to="/validations"><ClipboardCheck className="h-4 w-4" />Ouvrir la file de validation</Link></Button>
      </header>

      {unavailable.length > 0 && !loading ? <div className="flex items-center gap-2 rounded-lg border border-primary/15 bg-primary/[0.04] px-4 py-3 text-sm"><AlertTriangle className="h-4 w-4 text-primary" /><span>Certaines informations sont momentanément indisponibles : {unavailable.join(', ')}.</span></div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Vue administrative immédiate">
        <Metric loading={loading} icon={ClipboardCheck} label="Dossiers ouverts" value={openCases} helper="À examiner ou en cours" to="/validations" accent />
        <Metric loading={loading} icon={AlertTriangle} label="En retard" value={overview?.overdue ?? 0} helper="Échéance dépassée" to="/validations" accent={Boolean(overview?.overdue)} />
        <Metric loading={loading} icon={CalendarClock} label="Campagnes à contrôler" value={overview?.byResource?.agency_campaign ?? 0} helper={`${context.campaigns} reçues au total`} to="/campaigns" />
        <Metric loading={loading} icon={FileText} label="Documents à vérifier" value={overview?.byResource?.document ?? 0} helper="Contrôle administratif" to="/documents" />
        <Metric loading={loading} icon={Users} label="Anomalies signalées" value={(overview?.byResource?.agency_user ?? 0) + (overview?.byResource?.agency_contact ?? 0)} helper="Comptes et contacts" to="/validations" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="border-border bg-white">
          <CardHeader className="flex-row items-center justify-between"><div><CardTitle className="text-base font-black uppercase">À traiter maintenant</CardTitle><p className="mt-1 text-sm text-muted-foreground">Les dossiers les plus prioritaires de la file administrative.</p></div><Button asChild variant="ghost" size="sm"><Link to="/validations">Voir tout <ChevronRight className="ml-1 h-4 w-4" /></Link></Button></CardHeader>
          <CardContent className="p-0">{loading ? <DashboardRows /> : priorityCases.length ? <div className="divide-y divide-border">{priorityCases.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/40"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><ClipboardCheck className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="truncate font-bold">{item.title}</div><div className="mt-1 truncate text-xs text-muted-foreground">{approvalResourceLabels[item.resourceType]} · {item.assigneeName || 'Non assigné'}</div></div><ApprovalPriorityBadge priority={item.priority} /><ApprovalStatusBadge status={item.status} /><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>)}</div> : <p className="px-6 py-12 text-center text-sm text-muted-foreground">Aucun dossier prioritaire pour le moment.</p>}</CardContent>
        </Card>

        <Card className="border-border bg-white"><CardHeader><CardTitle className="text-base font-black uppercase">Charge des responsables</CardTitle></CardHeader><CardContent className="space-y-4">{loading ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-10 w-full" />) : overview?.workload.length ? overview.workload.map((entry) => <div key={entry.userId} className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-black">{entry.name.charAt(0)}</span><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{entry.name}</div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, entry.total * 12)}%` }} /></div></div><span className="text-sm font-black">{entry.total}</span></div>) : <p className="py-8 text-center text-sm text-muted-foreground">Aucun dossier assigné.</p>}</CardContent></Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="border-border bg-white"><CardHeader><CardTitle className="text-base font-black uppercase">Décisions récentes</CardTitle></CardHeader><CardContent className="space-y-4">{loading ? <DashboardRows count={3} /> : overview?.recentDecisions.length ? overview.recentDecisions.map((decision) => <button key={decision.id} type="button" onClick={() => setSelectedId(decision.caseId)} className="flex w-full gap-3 border-b border-border pb-3 text-left last:border-0"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><div className="text-sm font-bold">{decision.title}</div><p className="mt-1 text-xs text-muted-foreground">{decision.userName || 'Administration'} · {formatDate(decision.createdAt)}</p></div></button>) : <p className="py-8 text-center text-sm text-muted-foreground">Les décisions enregistrées apparaîtront ici.</p>}</CardContent></Card>

        <Card className="border-border bg-white"><CardHeader><CardTitle className="text-base font-black uppercase">Suivi opérationnel</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><QuickLink icon={Megaphone} label="Campagnes reçues" value={context.campaigns} to="/campaigns" /><QuickLink icon={MapPin} label="Emplacements disponibles" value={context.available} to="/inventory" /><QuickLink icon={ReceiptText} label="Factures à suivre" value={context.unpaidInvoices} to="/invoices" /><QuickLink icon={Building2} label="Demandes à qualifier" value={overview?.byResource?.agency_request ?? 0} to="/demandes" /></CardContent></Card>
      </section>

      <ApprovalCaseDrawer caseId={selectedId} open={Boolean(selectedId)} onOpenChange={(open) => { if (!open) setSelectedId(null) }} onChanged={load} />
    </div>
  )
}

function Metric({ loading, icon: Icon, label, value, helper, to, accent = false }: { loading: boolean; icon: typeof ClipboardCheck; label: string; value: number; helper: string; to: string; accent?: boolean }) { return <Link to={to} className={`group rounded-lg border bg-white p-4 transition-all hover:-translate-y-px hover:shadow-sm ${accent ? 'border-primary/20' : 'border-border'}`}>{loading ? <><Skeleton className="h-7 w-16" /><Skeleton className="mt-3 h-3 w-28" /></> : <><div className="flex items-center justify-between"><span className="text-2xl font-black">{value}</span><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent ? 'bg-primary text-white' : 'bg-muted text-foreground'}`}><Icon className="h-4 w-4" /></span></div><span className="mt-3 block text-xs font-black uppercase">{label}</span><span className="mt-1 block text-xs text-muted-foreground">{helper}</span></>}</Link> }
function QuickLink({ icon: Icon, label, value, to }: { icon: typeof Megaphone; label: string; value: number; to: string }) { return <Link to={to} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-all hover:border-primary/25 hover:bg-muted/30"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><span className="block text-xl font-black">{value}</span><span className="block truncate text-xs font-bold text-muted-foreground">{label}</span></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link> }
function DashboardRows({ count = 4 }: { count?: number }) { return <div className="space-y-4 p-6">{Array.from({ length: count }).map((_, index) => <div key={index} className="flex gap-3"><Skeleton className="h-9 w-9 rounded-lg" /><div className="flex-1"><Skeleton className="h-4 w-2/3" /><Skeleton className="mt-2 h-3 w-1/3" /></div></div>)}</div> }
function formatDate(value: string) { const date = new Date(value.replace(' ', 'T') + 'Z'); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date) }
