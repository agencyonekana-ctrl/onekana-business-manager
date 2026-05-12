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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { dataClient } from '@/lib/data-client'
import { toast } from 'react-hot-toast'
import { Support } from '../types'

interface SupportsTabProps {
  supports: Support[]
  loading: boolean
  onRefresh: () => void
}

export function SupportsTab({ supports, loading, onRefresh }: SupportsTabProps) {
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSupport, setEditingSupport] = useState<Support | null>(null)
  const [form, setForm] = useState({ name: '', type: 'Digital', dimensions: '' })

  const filteredSupports = supports.filter(sup => 
    sup.name.toLowerCase().includes(search.toLowerCase()) ||
    sup.type.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingSupport) {
        await dataClient.db.oohSupports.update(editingSupport.id, form)
        toast.success('Support mis à jour')
      } else {
        await dataClient.db.oohSupports.create(form)
        toast.success('Support ajouté')
      }
      setIsDialogOpen(false)
      setEditingSupport(null)
      setForm({ name: '', type: 'Digital', dimensions: '' })
      onRefresh()
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer cet élément ?')) return
    try {
      await dataClient.db.oohSupports.delete(id)
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
          <Input placeholder="Rechercher un support..." className="border-0 focus-visible:ring-0" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingSupport(null)
            setForm({ name: '', type: 'Digital', dimensions: '' })
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Ajouter un support</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingSupport ? 'Modifier le support' : 'Ajouter un support'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="sname">Nom du support</Label>
                <Input id="sname" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stype">Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Digital">Digital</SelectItem>
                      <SelectItem value="Statique">Statique</SelectItem>
                      <SelectItem value="LED">LED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sdims">Dimensions</Label>
                  <Input id="sdims" value={form.dimensions} onChange={(e) => setForm({...form, dimensions: e.target.value})} placeholder="ex: 4x3m" />
                </div>
              </div>
              <DialogFooter><Button type="submit" className="w-full">Enregistrer</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Type</TableHead><TableHead>Dimensions</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="text-center">Chargement...</TableCell></TableRow> : 
              filteredSupports.map(sup => (
                <TableRow key={sup.id}>
                  <TableCell className="font-medium">{sup.name}</TableCell>
                  <TableCell>{sup.type}</TableCell>
                  <TableCell>{sup.dimensions}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingSupport(sup); setForm({ name: sup.name, type: sup.type, dimensions: sup.dimensions || '' }); setIsDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(sup.id)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
