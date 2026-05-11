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
import { localData } from '@/lib/local-data'
import { toast } from 'react-hot-toast'
import { Site, Support, Emplacement } from '../types'

interface EmplacementsTabProps {
  emplacements: Emplacement[]
  sites: Site[]
  supports: Support[]
  allLines: any[]
  allCampaigns: any[]
  loading: boolean
  onRefresh: () => void
}

export function EmplacementsTab({ 
  emplacements, 
  sites, 
  supports, 
  allLines, 
  allCampaigns, 
  loading, 
  onRefresh 
}: EmplacementsTabProps) {
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmplacement, setEditingEmplacement] = useState<Emplacement | null>(null)
  const [form, setForm] = useState({ name: '', siteId: '', supportId: '', status: 'available' })

  const filteredEmplacements = emplacements.filter(emp => {
    const site = sites.find(s => s.id === emp.siteId)
    const support = supports.find(s => s.id === emp.supportId)
    return emp.name.toLowerCase().includes(search.toLowerCase()) ||
      site?.name.toLowerCase().includes(search.toLowerCase()) ||
      support?.name.toLowerCase().includes(search.toLowerCase())
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingEmplacement) {
        await localData.db.oohEmplacements.update(editingEmplacement.id, form)
        toast.success('Emplacement mis à jour')
      } else {
        await localData.db.oohEmplacements.create(form)
        toast.success('Emplacement ajouté')
      }
      setIsDialogOpen(false)
      setEditingEmplacement(null)
      setForm({ name: '', siteId: '', supportId: '', status: 'available' })
      onRefresh()
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer cet élément ?')) return
    try {
      await localData.db.oohEmplacements.delete(id)
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
          <Input placeholder="Rechercher un emplacement..." className="border-0 focus-visible:ring-0" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingEmplacement(null)
            setForm({ name: '', siteId: '', supportId: '', status: 'available' })
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Ajouter un emplacement</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingEmplacement ? 'Modifier l\'emplacement' : 'Ajouter un emplacement'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="ename">Nom de l'emplacement</Label>
                <Input id="ename" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="esite">Site</Label>
                  <Select value={form.siteId} onValueChange={(v) => setForm({...form, siteId: v})}>
                    <SelectTrigger><SelectValue placeholder="Choisir un site" /></SelectTrigger>
                    <SelectContent>{sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="esupport">Support</Label>
                  <Select value={form.supportId} onValueChange={(v) => setForm({...form, supportId: v})}>
                    <SelectTrigger><SelectValue placeholder="Choisir un support" /></SelectTrigger>
                    <SelectContent>{supports.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estatus">Statut Manuel (Optionnel)</Label>
                <Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Actif (Normal)</SelectItem>
                    <SelectItem value="maintenance">En Maintenance</SelectItem>
                    <SelectItem value="disabled">Hors Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter><Button type="submit" className="w-full">Enregistrer</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Site</TableHead><TableHead>Support</TableHead><TableHead>Disponibilité</TableHead><TableHead>État</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="text-center">Chargement...</TableCell></TableRow> : 
              filteredEmplacements.map(emp => {
                const now = new Date().toISOString().split('T')[0]
                const currentLine = allLines.find(l => {
                  if (l.emplacementId !== emp.id) return false
                  const camp = allCampaigns.find(c => c.id === l.campaignId)
                  return camp && now >= camp.startDate && now <= camp.endDate
                })
                const activeCamp = currentLine ? allCampaigns.find(c => c.id === currentLine.campaignId) : null

                return (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>{sites.find(s => s.id === emp.siteId)?.name || 'N/A'}</TableCell>
                    <TableCell>{supports.find(s => s.id === emp.supportId)?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {activeCamp ? (
                        <div className="flex flex-col">
                          <span className="text-rose-600 text-xs font-bold uppercase">Occupé</span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{activeCamp.clientName}</span>
                        </div>
                      ) : (
                        <span className="text-emerald-600 text-xs font-bold uppercase">Libre</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        emp.status === 'available' ? 'bg-green-100 text-green-700' : 
                        emp.status === 'maintenance' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {emp.status === 'available' ? 'Normal' : emp.status === 'maintenance' ? 'Maintenance' : 'HS'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingEmplacement(emp); setForm(emp); setIsDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(emp.id)}><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
