import { useState } from 'react'
import { Plus, Trash2, Pencil, Search, File as FileIcon } from 'lucide-react'
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { localData } from '@/lib/local-data'
import { toast } from 'react-hot-toast'
import { Asset } from '../types'

interface AssetsTabProps {
  assets: Asset[]
  loading: boolean
  onRefresh: () => void
}

export function AssetsTab({ assets, loading, onRefresh }: AssetsTabProps) {
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [form, setForm] = useState({ name: '', fileUrl: '', type: 'Image' })

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(search.toLowerCase()) ||
    asset.type.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingAsset) {
        await localData.db.oohAssets.update(editingAsset.id, form)
        toast.success('Asset mis à jour')
      } else {
        await localData.db.oohAssets.create(form)
        toast.success('Asset ajouté')
      }
      setIsDialogOpen(false)
      setEditingAsset(null)
      setForm({ name: '', fileUrl: '', type: 'Image' })
      onRefresh()
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer cet élément ?')) return
    try {
      await localData.db.oohAssets.delete(id)
      toast.success('Élément supprimé')
      onRefresh()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 max-w-sm bg-card p-1 rounded-lg border border-border/50">
          <Search className="w-4 h-4 text-muted-foreground ml-2" />
          <Input placeholder="Rechercher un asset..." className="border-0 focus-visible:ring-0" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingAsset(null)
            setForm({ name: '', fileUrl: '', type: 'Image' })
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Ajouter un asset</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingAsset ? 'Modifier l\'asset' : 'Ajouter un asset'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="aname">Nom de l'asset</Label>
                <Input id="aname" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aurl">URL du fichier</Label>
                <Input id="aurl" value={form.fileUrl} onChange={(e) => setForm({...form, fileUrl: e.target.value})} required placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="atype">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Image">Image</SelectItem>
                    <SelectItem value="Vidéo">Vidéo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter><Button type="submit" className="w-full">Enregistrer</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? <div className="col-span-full text-center py-8">Chargement...</div> : 
          filteredAssets.map(asset => (
            <div key={asset.id} className="group relative rounded-xl border border-border/50 bg-card overflow-hidden transition-all hover:shadow-md">
              <div className="aspect-video bg-muted flex items-center justify-center border-b border-border/50 overflow-hidden">
                {asset.type === 'Image' ? (
                  <img src={asset.fileUrl} alt={asset.name} className="object-cover w-full h-full" onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Image+Non+Disponible')} />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileIcon className="w-8 h-8" />
                    <span className="text-xs">Fichier Vidéo</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate">
                    <p className="font-medium text-sm truncate">{asset.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{asset.type}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingAsset(asset); setForm(asset); setIsDialogOpen(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(asset.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
