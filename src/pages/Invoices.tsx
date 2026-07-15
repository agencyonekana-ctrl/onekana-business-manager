import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Banknote, FilePlus2, ReceiptText } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { dataClient } from '../lib/data-client'
import { remoteApi } from '../services/remote-api'
import { featureFlags } from '../config/features'
import type { Invoice, Payment } from '../types/finance'
import { PageHeader } from '../components/app/PageHeader'
import { EmptyState } from '../components/app/EmptyState'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [invoiceRows, paymentRows] = await Promise.allSettled([
      dataClient.db.invoices.list<Invoice>(), dataClient.db.payments.list<Payment>(),
    ])
    if (invoiceRows.status === 'fulfilled') setInvoices(invoiceRows.value)
    if (paymentRows.status === 'fulfilled') setPayments(paymentRows.value)
    setError(invoiceRows.status === 'rejected' || paymentRows.status === 'rejected')
    setLoading(false)
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  async function issue(invoice: Invoice) {
    if (!confirm(`Valider la facture ${invoice.number} ? Elle générera une écriture comptable immuable.`)) return
    try { await remoteApi.financeActions.issueInvoice(invoice.id); toast.success('Facture validée'); await fetchData() }
    catch { toast.error('Complétez la configuration comptable avant de valider') }
  }

  return <div className="space-y-6">
    <PageHeader eyebrow="Finance" title="Factures & paiements" description="Émettez les factures internes, suivez leur solde et enregistrez les règlements reçus." action={featureFlags.advancedFinance ? <Button className="gap-2" onClick={() => setInvoiceOpen(true)}><FilePlus2 className="h-4 w-4" /> Nouvelle facture</Button> : undefined} />
    {error ? <EmptyState title="Certaines données sont indisponibles" description="Les informations accessibles restent affichées. Réessayez dans quelques instants." /> : null}

    <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5 text-primary" /> Factures</CardTitle></CardHeader><CardContent className="p-0">
        {loading ? <LoadingRows /> : invoices.length === 0 ? <div className="p-6"><EmptyState title="Aucune facture" description={featureFlags.advancedFinance ? "Créez un brouillon lorsque la prestation et le client ont été validés." : "Les factures validées apparaîtront ici."} /></div> : <Table><TableHeader><TableRow><TableHead>Numéro</TableHead><TableHead>Client</TableHead><TableHead>État</TableHead><TableHead className="text-right">Solde</TableHead>{featureFlags.advancedFinance ? <TableHead className="text-right">Action</TableHead> : null}</TableRow></TableHeader><TableBody>{invoices.map((invoice) => <TableRow key={invoice.id}><TableCell className="font-mono font-bold">{invoice.number || invoice.numero}</TableCell><TableCell>{invoice.clientName || invoice.client_name}</TableCell><TableCell><InvoiceStatus status={invoice.status} /></TableCell><TableCell className="text-right font-semibold">{money(invoice.balance ?? invoice.total)} USD</TableCell>{featureFlags.advancedFinance ? <TableCell className="text-right">{invoice.status === 'draft' ? <Button size="sm" variant="outline" onClick={() => void issue(invoice)}>Valider</Button> : Number(invoice.balance ?? 0) > 0 ? <Button size="sm" onClick={() => setPaymentInvoice(invoice)}>Paiement</Button> : null}</TableCell> : null}</TableRow>)}</TableBody></Table>}
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5 text-primary" /> Derniers paiements</CardTitle></CardHeader><CardContent className="p-0">
        {loading ? <LoadingRows /> : payments.length === 0 ? <div className="p-6"><EmptyState title="Aucun paiement" description="Les règlements validés apparaîtront ici." /></div> : <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Référence</TableHead><TableHead className="text-right">Montant</TableHead></TableRow></TableHeader><TableBody>{payments.map((payment) => <TableRow key={payment.id}><TableCell>{formatDate(payment.date)}</TableCell><TableCell className="font-mono">{payment.reference || '—'}</TableCell><TableCell className="text-right font-semibold">{money(payment.amount ?? payment.montant)} USD</TableCell></TableRow>)}</TableBody></Table>}
      </CardContent></Card>
    </div>

    <InvoiceDialog open={invoiceOpen} setOpen={setInvoiceOpen} onCreated={fetchData} />
    <PaymentDialog invoice={paymentInvoice} close={() => setPaymentInvoice(null)} onCreated={fetchData} />
  </div>
}

function InvoiceDialog({ open, setOpen, onCreated }: { open: boolean, setOpen: (value: boolean) => void, onCreated: () => Promise<void> }) {
  const [form, setForm] = useState({ clientName: '', number: '', description: '', quantity: '1.00', unitPrice: '', tax: '0.00', dueDate: '' })
  const [submitting, setSubmitting] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setSubmitting(true)
    try {
      await dataClient.db.invoices.create({ clientName: form.clientName, number: form.number || undefined, tax: form.tax, dueDate: form.dueDate || undefined, lines: [{ description: form.description, quantity: form.quantity, unitPrice: form.unitPrice }] })
      toast.success('Brouillon créé'); setOpen(false); setForm({ clientName: '', number: '', description: '', quantity: '1.00', unitPrice: '', tax: '0.00', dueDate: '' }); await onCreated()
    } catch { toast.error('La facture ne peut pas être créée') } finally { setSubmitting(false) }
  }
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent><form onSubmit={submit}><DialogHeader><DialogTitle>Nouvelle facture</DialogTitle><DialogDescription>La facture reste en brouillon jusqu'à sa validation.</DialogDescription></DialogHeader><div className="grid gap-4 py-5 sm:grid-cols-2"><Field label="Client" value={form.clientName} onChange={(value) => setForm({ ...form, clientName: value })} required /><Field label="Numéro (facultatif)" value={form.number} onChange={(value) => setForm({ ...form, number: value })} /><div className="sm:col-span-2"><Field label="Prestation" value={form.description} onChange={(value) => setForm({ ...form, description: value })} required /></div><Field label="Quantité" type="number" value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} required /><Field label="Prix unitaire USD" type="number" value={form.unitPrice} onChange={(value) => setForm({ ...form, unitPrice: value })} required /><Field label="Taxe USD" type="number" value={form.tax} onChange={(value) => setForm({ ...form, tax: value })} required /><Field label="Échéance" type="date" value={form.dueDate} onChange={(value) => setForm({ ...form, dueDate: value })} /></div><DialogFooter><Button type="submit" disabled={submitting}>{submitting ? 'Création...' : 'Créer le brouillon'}</Button></DialogFooter></form></DialogContent></Dialog>
}

function PaymentDialog({ invoice, close, onCreated }: { invoice: Invoice | null, close: () => void, onCreated: () => Promise<void> }) {
  const [form, setForm] = useState({ amount: '', method: 'bank', reference: '' })
  const [submitting, setSubmitting] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!invoice) return; setSubmitting(true)
    try { await dataClient.db.payments.create({ invoiceId: invoice.id, amount: form.amount, method: form.method, reference: form.reference, idempotencyKey: form.reference }); toast.success('Paiement enregistré'); close(); setForm({ amount: '', method: 'bank', reference: '' }); await onCreated() }
    catch { toast.error('Le paiement ne peut pas être enregistré') } finally { setSubmitting(false) }
  }
  return <Dialog open={Boolean(invoice)} onOpenChange={(value) => { if (!value) close() }}><DialogContent><form onSubmit={submit}><DialogHeader><DialogTitle>Enregistrer un paiement</DialogTitle><DialogDescription>{invoice?.number} · Solde {money(invoice?.balance)} USD</DialogDescription></DialogHeader><div className="grid gap-4 py-5"><Field label="Montant USD" type="number" value={form.amount} onChange={(value) => setForm({ ...form, amount: value })} required /><div className="space-y-2"><Label>Moyen</Label><Select value={form.method} onValueChange={(method) => setForm({ ...form, method })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bank">Banque</SelectItem><SelectItem value="wallet">Wallet</SelectItem><SelectItem value="cash">Espèces</SelectItem></SelectContent></Select></div><Field label="Référence unique" value={form.reference} onChange={(value) => setForm({ ...form, reference: value })} required /></div><DialogFooter><Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Valider le paiement'}</Button></DialogFooter></form></DialogContent></Dialog>
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string, value: string, onChange: (value: string) => void, type?: string, required?: boolean }) { return <label className="space-y-2 text-sm font-bold">{label}<Input type={type} min={type === 'number' ? '0' : undefined} step={type === 'number' ? '0.01' : undefined} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label> }
function LoadingRows() { return <div className="space-y-3 p-5">{[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-md bg-muted" />)}</div> }
function InvoiceStatus({ status = 'draft' }: { status?: string }) { const labels: Record<string, string> = { draft: 'Brouillon', issued: 'Émise', partial: 'Partielle', paid: 'Payée' }; return <Badge variant={status === 'paid' ? 'default' : 'outline'}>{labels[status] || status}</Badge> }
function money(value: string | number | undefined) { return Number(value ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function formatDate(value?: string) { return value ? new Date(value).toLocaleDateString('fr-FR') : '—' }
