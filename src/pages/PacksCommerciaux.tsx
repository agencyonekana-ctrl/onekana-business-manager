import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, PackageCheck } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { dataClient } from '../lib/data-client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { PageHeader } from '../components/app/PageHeader'
import { EmptyState } from '../components/app/EmptyState'

type PackCommercial = {
  id: string
  nom?: string
  name?: string
  categorie?: string
  budget_min?: number
  budget_max?: number
  budget_description?: string
  description?: string
  ideal_pour?: string
  actif?: boolean
}

const emptyForm = {
  nom: '',
  categorie: '',
  budget_min: '',
  budget_max: '',
  description: '',
  ideal_pour: '',
}

export default function PacksCommerciaux() {
  const [packs, setPacks] = useState<PackCommercial[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PackCommercial | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    fetchPacks()
  }, [])

  async function fetchPacks() {
    setLoading(true)
    try {
      const rows = await dataClient.db.packsCommerciaux.list<PackCommercial>({ orderBy: { ordre_affichage: 'asc' } })
      setPacks(rows)
    } catch {
      toast.error('Erreur lors du chargement des packs')
    } finally {
      setLoading(false)
    }
  }

  function openEdit(pack: PackCommercial) {
    setEditing(pack)
    setForm({
      nom: pack.nom || pack.name || '',
      categorie: pack.categorie || '',
      budget_min: String(pack.budget_min || ''),
      budget_max: String(pack.budget_max || ''),
      description: pack.description || '',
      ideal_pour: pack.ideal_pour || '',
    })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditing(null)
    setForm(emptyForm)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const payload = {
      ...form,
      name: form.nom,
      budget_min: Number(form.budget_min || 0),
      budget_max: Number(form.budget_max || 0),
      budget_description: `${form.budget_min || 0} - ${form.budget_max || 0} USD`,
      actif: true,
    }

    try {
      if (editing) {
        await dataClient.db.packsCommerciaux.update(editing.id, payload)
        toast.success('Pack mis à jour')
      } else {
        await dataClient.db.packsCommerciaux.create(payload)
        toast.success('Pack ajouté')
      }
      closeDialog()
      fetchPacks()
    } catch {
      toast.error('Impossible d’enregistrer le pack')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce pack commercial ?')) return
    try {
      await dataClient.db.packsCommerciaux.delete(id)
      toast.success('Pack supprimé')
      fetchPacks()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ventes OOH"
        title="Packs commerciaux"
        description="Construisez les offres qui servent de base aux devis, demandes clients et campagnes publicitaires."
        action={
        <Dialog open={dialogOpen} onOpenChange={(open) => open ? setDialogOpen(true) : closeDialog()}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau pack
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier le pack' : 'Créer un pack'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input id="nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categorie">Catégorie</Label>
                  <Input id="categorie" value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="budget_min">Budget min</Label>
                  <Input id="budget_min" type="number" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_max">Budget max</Label>
                  <Input id="budget_max" type="number" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ideal">Idéal pour</Label>
                <Input id="ideal" value={form.ideal_pour} onChange={(e) => setForm({ ...form, ideal_pour: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>Annuler</Button>
                <Button type="submit">Enregistrer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        }
      />

      <Card className="border-primary/15 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-primary" />
            Catalogue commercial
          </CardTitle>
          <CardDescription>Catalogue des offres utilisees par les equipes commerciales.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table data-tour="packs-table">
            <TableHeader>
              <TableRow>
                <TableHead>Pack</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Idéal pour</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">Chargement...</TableCell></TableRow>
              ) : packs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-6">
                    <EmptyState
                      title="Aucun pack commercial"
                      description="Ajoutez un premier pack pour faciliter la qualification des demandes et la préparation des campagnes."
                      action={<Button size="sm" onClick={() => setDialogOpen(true)}>Créer un pack</Button>}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                packs.map((pack) => (
                  <TableRow key={pack.id}>
                    <TableCell>
                      <div className="font-bold">{pack.nom || pack.name}</div>
                      <div className="max-w-md truncate text-xs text-muted-foreground">{pack.description}</div>
                    </TableCell>
                    <TableCell>{pack.categorie || 'N/A'}</TableCell>
                    <TableCell>{pack.budget_description || `${pack.budget_min || 0} - ${pack.budget_max || 0} USD`}</TableCell>
                    <TableCell>{pack.ideal_pour || 'N/A'}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(pack)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(pack.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
