import { useEffect, useMemo, useState } from 'react'
import { Plus, Wallet as WalletIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { dataClient } from '../lib/data-client'
import type { WalletAccount, WalletTransaction } from '../types/finance'
import { PageHeader } from '../components/app/PageHeader'
import { EmptyState } from '../components/app/EmptyState'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

export default function Wallet() {
  const [accounts, setAccounts] = useState<WalletAccount[]>([])
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [form, setForm] = useState({ walletAccountId: '', type: 'inflow', amount: '', source: '', reference: '' })
  const [accountForm, setAccountForm] = useState({ name: '', code: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [accountRows, transactionRows] = await Promise.all([
        dataClient.db.walletAccounts.list<WalletAccount>(),
        dataClient.db.walletTransactions.list<WalletTransaction>({ orderBy: { date: 'desc' } }),
      ])
      setAccounts(accountRows)
      setTransactions(transactionRows)
      setForm((current) => ({ ...current, walletAccountId: current.walletAccountId || accountRows[0]?.id || '' }))
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const computedBalance = useMemo(() => transactions.reduce((total, transaction) => {
    const amount = Number(transaction.amount ?? transaction.montant ?? 0)
    return ['outflow', 'decaissement', 'debit'].includes(transaction.type) ? total - amount : total + amount
  }, 0), [transactions])

  const accountBalance = accounts.reduce((total, account) => total + Number(account.balance ?? account.solde ?? 0), 0)
  const balance = accounts.length > 0 ? accountBalance : computedBalance

  async function createTransaction(event: React.FormEvent) {
    event.preventDefault()
    try {
      await dataClient.db.walletTransactions.create({ ...form, amount: form.amount, idempotencyKey: form.reference })
      toast.success('Mouvement Wallet créé')
      setForm({ walletAccountId: form.walletAccountId, type: 'inflow', amount: '', source: '', reference: '' })
      fetchData()
    } catch {
      toast.error('Vérifiez le compte, la référence et la configuration comptable')
    }
  }

  async function createAccount(event: React.FormEvent) {
    event.preventDefault()
    try {
      const account = await dataClient.db.walletAccounts.create<WalletAccount>(accountForm)
      toast.success('Compte Wallet créé')
      setAccountForm({ name: '', code: '' })
      setForm((current) => ({ ...current, walletAccountId: account.id }))
      await fetchData()
    } catch { toast.error('Impossible de créer ce compte Wallet') }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Onekana Wallet"
        description="Suivez le portefeuille interne ONEKANA: encaissements, décaissements, références et solde consolidé."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-primary/15 bg-[#0b0b0b] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-black uppercase">
              <WalletIcon className="h-5 w-5 text-primary" />
              Solde interne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{balance.toLocaleString()} USD</div>
            <p className="mt-1 text-xs text-white/60">Calculé depuis les mouvements validés</p>
          </CardContent>
        </Card>

        <Card className="border-primary/15 bg-white lg:col-span-2">
          <CardContent className="p-5">
            <form onSubmit={createTransaction} className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
              <div className="space-y-2"><Label>Compte Wallet</Label><Select value={form.walletAccountId} onValueChange={(value) => setForm({ ...form, walletAccountId: value })}><SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger><SelectContent>{accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name || account.nom}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inflow">Encaissement</SelectItem>
                    <SelectItem value="outflow">Décaissement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Montant</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Input
                  value={form.source}
                  onChange={(event) => setForm({ ...form, source: event.target.value })}
                  placeholder="Campagne, facture..."
                />
              </div>
              <div className="space-y-2">
                <Label>Référence unique</Label>
                <Input
                  value={form.reference}
                  onChange={(event) => setForm({ ...form, reference: event.target.value })}
                  placeholder="REF-001"
                />
              </div>
              <Button type="submit" className="gap-2" disabled={!form.walletAccountId || !form.reference}>
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {accounts.length === 0 ? <Card><CardHeader><CardTitle>Créer le premier compte Wallet</CardTitle></CardHeader><CardContent><form onSubmit={createAccount} className="grid gap-3 sm:grid-cols-[1fr_0.6fr_auto] sm:items-end"><div className="space-y-2"><Label>Nom</Label><Input value={accountForm.name} onChange={(event) => setAccountForm({ ...accountForm, name: event.target.value })} placeholder="Wallet principal" required /></div><div className="space-y-2"><Label>Code</Label><Input value={accountForm.code} onChange={(event) => setAccountForm({ ...accountForm, code: event.target.value.toUpperCase() })} placeholder="WALLET" required /></div><Button type="submit">Créer</Button></form></CardContent></Card> : null}

      <Card className="border-primary/15 bg-white">
        <CardContent className="p-0">
          {error ? (
            <div className="p-6">
              <EmptyState title="Donnees indisponibles" description="Les mouvements du portefeuille seront affiches des qu'ils seront disponibles." />
            </div>
          ) : loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Chargement...</div>
          ) : transactions.length === 0 ? (
            <div className="p-6">
              <EmptyState title="Aucun mouvement" description="Aucun mouvement Wallet n'est encore disponible." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.date || transaction.createdAt || 'N/A'}</TableCell>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell>{transaction.source || 'N/A'}</TableCell>
                    <TableCell>{transaction.reference || 'N/A'}</TableCell>
                    <TableCell className="text-right">{Number(transaction.amount ?? transaction.montant ?? 0).toLocaleString()} USD</TableCell>
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
