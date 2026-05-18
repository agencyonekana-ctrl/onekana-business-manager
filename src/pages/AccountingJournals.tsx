import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { dataClient } from '../lib/data-client'
import type { AccountingJournal } from '../types/finance'
import { PageHeader } from '../components/app/PageHeader'
import { EmptyState } from '../components/app/EmptyState'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

export default function AccountingJournals() {
  const [journals, setJournals] = useState<AccountingJournal[]>([])
  const [form, setForm] = useState({ code: '', name: '', type: 'vente' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => { fetchJournals() }, [])

  async function fetchJournals() {
    setLoading(true)
    try {
      setJournals(await dataClient.db.accountingJournals.list<AccountingJournal>({ orderBy: { code: 'asc' } }))
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  async function createJournal(event: React.FormEvent) {
    event.preventDefault()
    try {
      await dataClient.db.accountingJournals.create(form)
      toast.success('Journal créé')
      setForm({ code: '', name: '', type: 'vente' })
      fetchJournals()
    } catch {
      toast.error('Impossible de créer le journal')
    }
  }

  async function deleteJournal(id: string) {
    if (!confirm('Supprimer ce journal ?')) return
    try {
      await dataClient.db.accountingJournals.delete(id)
      toast.success('Journal supprimé')
      fetchJournals()
    } catch {
      toast.error('Suppression impossible')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Comptabilité OHADA" title="Journaux comptables" description="Déclarez les journaux utilisés pour classer les écritures: ventes, banque, caisse, achats et opérations diverses." />

      <Card className="border-primary/15 bg-white">
        <CardContent className="p-5">
          <form onSubmit={createJournal} className="grid gap-4 lg:grid-cols-[1fr_2fr_1fr_auto] lg:items-end">
            <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="VT" required /></div>
            <div className="space-y-2"><Label>Nom</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Journal des ventes" required /></div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vente">Vente</SelectItem>
                  <SelectItem value="banque">Banque</SelectItem>
                  <SelectItem value="caisse">Caisse</SelectItem>
                  <SelectItem value="achat">Achat</SelectItem>
                  <SelectItem value="od">Operations diverses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="gap-2"><Plus className="h-4 w-4" /> Ajouter</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-primary/15 bg-white">
        <CardContent className="p-0">
          {error ? <div className="p-6"><EmptyState title="Donnees indisponibles" description="Les journaux seront affiches des qu ils seront disponibles." /></div> :
            loading ? <div className="p-6 text-center text-sm text-muted-foreground">Chargement...</div> :
            journals.length === 0 ? <div className="p-6"><EmptyState title="Aucun journal" description="Aucun journal comptable n est encore disponible." /></div> :
            <Table>
              <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Nom</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{journals.map((journal) => <TableRow key={journal.id}><TableCell className="font-mono font-bold">{journal.code}</TableCell><TableCell>{journal.name || journal.nom}</TableCell><TableCell>{journal.type}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteJournal(journal.id)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>)}</TableBody>
            </Table>}
        </CardContent>
      </Card>
    </div>
  )
}
