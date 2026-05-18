import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { dataClient } from '../lib/data-client'
import type { AccountingEntry, AccountingJournal, OhadaAccount } from '../types/finance'
import { PageHeader } from '../components/app/PageHeader'
import { EmptyState } from '../components/app/EmptyState'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

export default function AccountingEntries() {
  const [entries, setEntries] = useState<AccountingEntry[]>([])
  const [accounts, setAccounts] = useState<OhadaAccount[]>([])
  const [journals, setJournals] = useState<AccountingJournal[]>([])
  const [form, setForm] = useState({ date: '', journalId: '', label: '', debitAccountId: '', creditAccountId: '', amount: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [entryRows, accountRows, journalRows] = await Promise.all([
        dataClient.db.accountingEntries.list<AccountingEntry>({ orderBy: { date: 'desc' } }),
        dataClient.db.accountingAccounts.list<OhadaAccount>({ orderBy: { code: 'asc' } }),
        dataClient.db.accountingJournals.list<AccountingJournal>({ orderBy: { code: 'asc' } }),
      ])
      setEntries(entryRows)
      setAccounts(accountRows)
      setJournals(journalRows)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const amount = Number(form.amount || 0)
  const isBalanced = useMemo(() => amount > 0 && form.debitAccountId !== form.creditAccountId, [amount, form.debitAccountId, form.creditAccountId])

  async function createEntry(event: React.FormEvent) {
    event.preventDefault()
    if (!isBalanced) {
      toast.error('Ecriture non équilibrée ou comptes invalides')
      return
    }
    try {
      await dataClient.db.accountingEntries.create({
        date: form.date,
        journalId: form.journalId,
        label: form.label,
        lines: [
          { accountId: form.debitAccountId, debit: amount, credit: 0 },
          { accountId: form.creditAccountId, debit: 0, credit: amount },
        ],
        totalDebit: amount,
        totalCredit: amount,
      })
      toast.success('Ecriture équilibrée créée')
      setForm({ date: '', journalId: '', label: '', debitAccountId: '', creditAccountId: '', amount: '' })
      fetchData()
    } catch {
      toast.error('Impossible de créer l’écriture')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Comptabilité OHADA" title="Ecritures comptables" description="Saisissez des écritures équilibrées. Le frontend rejette toute écriture où total débit et total crédit ne correspondent pas." />

      <Card className="border-primary/15 bg-white">
        <CardContent className="p-5">
          <form onSubmit={createEntry} className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></div>
            <div className="space-y-2"><Label>Journal</Label><Select value={form.journalId} onValueChange={(value) => setForm({ ...form, journalId: value })}><SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger><SelectContent>{journals.map((journal) => <SelectItem key={journal.id} value={journal.id}>{journal.code} - {journal.name || journal.nom}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Montant</Label><Input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required /></div>
            <div className="space-y-2 lg:col-span-3"><Label>Libellé</Label><Input value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} placeholder="Facture client, paiement campagne..." required /></div>
            <div className="space-y-2"><Label>Compte débit</Label><Select value={form.debitAccountId} onValueChange={(value) => setForm({ ...form, debitAccountId: value })}><SelectTrigger><SelectValue placeholder="Compte à débiter" /></SelectTrigger><SelectContent>{accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.code} - {account.label || account.libelle}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Compte crédit</Label><Select value={form.creditAccountId} onValueChange={(value) => setForm({ ...form, creditAccountId: value })}><SelectTrigger><SelectValue placeholder="Compte à créditer" /></SelectTrigger><SelectContent>{accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.code} - {account.label || account.libelle}</SelectItem>)}</SelectContent></Select></div>
            <div className="flex items-end"><Button type="submit" className="w-full gap-2" disabled={!isBalanced}><Plus className="h-4 w-4" /> Créer l’écriture</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-primary/15 bg-white">
        <CardContent className="p-0">
          {error ? <div className="p-6"><EmptyState title="Donnees indisponibles" description="Les ecritures seront affichees des qu elles seront disponibles." /></div> :
            loading ? <div className="p-6 text-center text-sm text-muted-foreground">Chargement...</div> :
            entries.length === 0 ? <div className="p-6"><EmptyState title="Aucune ecriture" description="Aucune ecriture comptable n est encore disponible." /></div> :
            <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Libellé</TableHead><TableHead>Référence</TableHead><TableHead className="text-right">Débit</TableHead><TableHead className="text-right">Crédit</TableHead></TableRow></TableHeader><TableBody>{entries.map((entry) => <TableRow key={entry.id}><TableCell>{entry.date}</TableCell><TableCell>{entry.label || entry.libelle}</TableCell><TableCell>{entry.reference || 'N/A'}</TableCell><TableCell className="text-right">{Number(entry.totalDebit || 0).toLocaleString()} USD</TableCell><TableCell className="text-right">{Number(entry.totalCredit || 0).toLocaleString()} USD</TableCell></TableRow>)}</TableBody></Table>}
        </CardContent>
      </Card>
    </div>
  )
}
