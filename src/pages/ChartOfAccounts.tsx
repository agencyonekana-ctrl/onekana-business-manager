import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { dataClient } from '../lib/data-client'
import type { OhadaAccount } from '../types/finance'
import { PageHeader } from '../components/app/PageHeader'
import { EmptyState } from '../components/app/EmptyState'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

const initialForm = { code: '', label: '', type: 'actif' }

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState<OhadaAccount[]>([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => { fetchAccounts() }, [])

  async function fetchAccounts() {
    setLoading(true)
    try {
      const rows = await dataClient.db.accountingAccounts.list<OhadaAccount>({ orderBy: { code: 'asc' } })
      setAccounts(rows)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  async function createAccount(event: React.FormEvent) {
    event.preventDefault()
    const firstClass = Number(form.code[0])
    if (!firstClass || firstClass < 1 || firstClass > 8) {
      toast.error('Le code OHADA doit commencer par une classe de 1 à 8')
      return
    }
    try {
      await dataClient.db.accountingAccounts.create({ ...form, class: firstClass, isActive: true })
      toast.success('Compte OHADA créé')
      setForm(initialForm)
      fetchAccounts()
    } catch {
      toast.error('Impossible de créer le compte')
    }
  }

  async function deleteAccount(id: string) {
    if (!confirm('Supprimer ce compte comptable ?')) return
    try {
      await dataClient.db.accountingAccounts.delete(id)
      toast.success('Compte supprimé')
      fetchAccounts()
    } catch {
      toast.error('Suppression impossible')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Comptabilité OHADA"
        title="Plan comptable SYSCOHADA"
        description="Créez et consultez les comptes comptables. Les codes doivent commencer par une classe OHADA de 1 à 8."
      />

      <Card className="border-primary/15 bg-white">
        <CardContent className="p-5">
          <form onSubmit={createAccount} className="grid gap-4 lg:grid-cols-[1fr_2fr_1fr_auto] lg:items-end">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="ex: 411100" required />
            </div>
            <div className="space-y-2">
              <Label>Libellé</Label>
              <Input value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} placeholder="Clients" required />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="passif">Passif</SelectItem>
                  <SelectItem value="charge">Charge</SelectItem>
                  <SelectItem value="produit">Produit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="gap-2"><Plus className="h-4 w-4" /> Ajouter</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-primary/15 bg-white">
        <CardContent className="p-0">
          {error ? (
            <div className="p-6"><EmptyState title="Donnees indisponibles" description="Le plan comptable sera affiche des qu il sera disponible." /></div>
          ) : loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Chargement...</div>
          ) : accounts.length === 0 ? (
            <div className="p-6"><EmptyState title="Aucun compte" description="Aucun compte OHADA n est encore disponible." /></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Libellé</TableHead><TableHead>Classe</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono font-bold">{account.code}</TableCell>
                    <TableCell>{account.label || account.libelle}</TableCell>
                    <TableCell>{account.class || account.classe || account.code?.[0]}</TableCell>
                    <TableCell>{account.type || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteAccount(account.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
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
