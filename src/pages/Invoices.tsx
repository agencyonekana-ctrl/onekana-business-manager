import { useEffect, useState } from 'react'
import { ReceiptText } from 'lucide-react'
import { dataClient } from '../lib/data-client'
import type { Invoice, Payment } from '../types/finance'
import { PageHeader } from '../components/app/PageHeader'
import { EmptyState } from '../components/app/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [invoiceRows, paymentRows] = await Promise.all([
        dataClient.db.invoices.list<Invoice>(),
        dataClient.db.payments.list<Payment>(),
      ])
      setInvoices(invoiceRows)
      setPayments(paymentRows)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Finance" title="Factures & Paiements" description="Suivez les factures clients, les statuts de paiement et les règlements liés aux campagnes ONEKANA." />

      {error && <EmptyState title="API facturation indisponible" description="Endpoints attendus: /invoices et /payments." />}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-primary/15 bg-white">
          <CardHeader><CardTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5 text-primary" /> Factures</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="p-6 text-center text-sm text-muted-foreground">Chargement...</div> :
              invoices.length === 0 ? <div className="p-6"><EmptyState title="Aucune facture" description="Aucune facture n’est encore retournée par l’API." /></div> :
              <Table><TableHeader><TableRow><TableHead>Numéro</TableHead><TableHead>Client</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{invoices.map((invoice) => <TableRow key={invoice.id}><TableCell className="font-mono">{invoice.number || invoice.numero}</TableCell><TableCell>{invoice.clientName || invoice.client_name}</TableCell><TableCell>{invoice.status || 'N/A'}</TableCell><TableCell className="text-right">{Number(invoice.total ?? invoice.amount ?? invoice.montant ?? 0).toLocaleString()} USD</TableCell></TableRow>)}</TableBody></Table>}
          </CardContent>
        </Card>

        <Card className="border-primary/15 bg-white">
          <CardHeader><CardTitle>Paiements</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="p-6 text-center text-sm text-muted-foreground">Chargement...</div> :
              payments.length === 0 ? <div className="p-6"><EmptyState title="Aucun paiement" description="Aucun paiement n’est encore retourné par l’API." /></div> :
              <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Moyen</TableHead><TableHead>Référence</TableHead><TableHead className="text-right">Montant</TableHead></TableRow></TableHeader><TableBody>{payments.map((payment) => <TableRow key={payment.id}><TableCell>{payment.date || 'N/A'}</TableCell><TableCell>{payment.method || payment.moyen || 'N/A'}</TableCell><TableCell>{payment.reference || 'N/A'}</TableCell><TableCell className="text-right">{Number(payment.amount ?? payment.montant ?? 0).toLocaleString()} USD</TableCell></TableRow>)}</TableBody></Table>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
