import { useState } from 'react'
import { Plus, Trash2, Pencil, Search } from 'lucide-react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { dataClient } from '@/lib/data-client'
import { toast } from 'react-hot-toast'
import { Site } from '../types'
import type { EntityMedia } from '@/types/media'
import { EntityMediaDialog } from '@/components/media/EntityMediaDialog'
import { EntityThumbnail } from '@/components/media/EntityThumbnail'

interface SitesTabProps {
  sites: Site[]
  media: EntityMedia[]
  loading: boolean
  onRefresh: () => void
  onMediaChanged: () => void
}

export function SitesTab({ sites, media, loading, onRefresh, onMediaChanged }: SitesTabProps) {
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [form, setForm] = useState({ name: '', address: '', city: '', coordinates: '' })

  const filteredSites = sites.filter(site => 
    site.name.toLowerCase().includes(search.toLowerCase()) ||
    site.address.toLowerCase().includes(search.toLowerCase()) ||
    site.city.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingSite) {
        await dataClient.db.oohSites.update(editingSite.id, form)
        toast.success('Site mis à jour')
      } else {
        await dataClient.db.oohSites.create(form)
        toast.success('Site ajouté')
      }
      setIsDialogOpen(false)
      setEditingSite(null)
      setForm({ name: '', address: '', city: '', coordinates: '' })
      onRefresh()
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer cet élément ?')) return
    try {
      await dataClient.db.oohSites.delete(id)
      toast.success('Élément supprimé')
      onRefresh()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 max-w-sm bg-card p-1 rounded-lg border border-border/50">
          <Search className="w-4 h-4 text-muted-foreground ml-2" />
          <Input 
            placeholder="Rechercher un site..." 
            className="border-0 focus-visible:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingSite(null)
            setForm({ name: '', address: '', city: '', coordinates: '' })
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Ajouter un site</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingSite ? 'Modifier le site' : 'Ajouter un site'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du site</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input id="city" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coords">Coordonnées (facultatif)</Label>
                  <Input id="coords" value={form.coordinates} onChange={(e) => setForm({...form, coordinates: e.target.value})} placeholder="lat,long" />
                </div>
              </div>
              <DialogFooter><Button type="submit" className="w-full">Enregistrer</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Adresse</TableHead><TableHead>Ville</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="text-center">Chargement...</TableCell></TableRow> : 
              filteredSites.map(site => (
                <TableRow key={site.id}>
                  <TableCell><div className="flex items-center gap-3"><EntityThumbnail media={media.find((item) => item.entityId === site.id && item.isCover) || media.find((item) => item.entityId === site.id)} alt={site.name} /><span className="font-medium">{site.name}</span></div></TableCell>
                  <TableCell>{site.address}</TableCell>
                  <TableCell>{site.city}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <EntityMediaDialog entityType="ooh_site" entityId={site.id} entityLabel={site.name} onChanged={onMediaChanged} />
                    <Button variant="ghost" size="icon" onClick={() => { setEditingSite(site); setForm({ name: site.name, address: site.address, city: site.city, coordinates: site.coordinates || '' }); setIsDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(site.id)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
