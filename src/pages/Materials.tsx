import { useState, useEffect } from 'react'
import { dataClient } from '../lib/data-client'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table'
import { Button } from '../components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { CategoryManager } from '../components/app/CategoryManager'
import { Plus, Search, Pencil, Trash2, User } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { PageHeader } from '../components/app/PageHeader'
import { EntityMediaDialog } from '../components/media/EntityMediaDialog'
import { EntityThumbnail } from '../components/media/EntityThumbnail'
import { mediaApi } from '../services/media-api'
import type { EntityMedia } from '../types/media'

interface Material {
  id: string
  name: string
  type: string
  serialNumber?: string
  purchaseDate?: string
  status: string
  assignedTo?: string
  description?: string
}

interface Employee {
  id: string
  firstName: string
  lastName: string
}

interface MaterialType {
  id: string
  name: string
}

const MATERIAL_STATUSES = [
  'Disponible',
  'Assigné',
  'En réparation',
  'Retiré'
]

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([])
  const [media, setMedia] = useState<EntityMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    serialNumber: '',
    purchaseDate: '',
    status: 'Disponible',
    assignedTo: '',
    description: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [matList, empList, typeList, mediaList] = await Promise.all([
        dataClient.db.materials.list(),
        dataClient.db.employees.list(),
        dataClient.db.materialTypes.list(),
        mediaApi.list('material'),
      ])
      setMaterials(matList as Material[])
      setEmployees(empList as Employee[])
      setMaterialTypes(typeList as MaterialType[])
      setMedia(mediaList)
    } catch {
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  async function refreshMedia() {
    try {
      setMedia(await mediaApi.list('material'))
    } catch {
      toast.error('Impossible d’actualiser les images')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const dataToSave = {
        ...formData,
        assignedTo: formData.assignedTo || null,
        // If status is "Assigné" but no employee selected, default to "Disponible"
        status: (formData.status === 'Assigné' && !formData.assignedTo) ? 'Disponible' : formData.status
      }

      if (editingMaterial) {
        await dataClient.db.materials.update(editingMaterial.id, dataToSave)
        toast.success('Matériel mis à jour')
      } else {
        await dataClient.db.materials.create(dataToSave)
        toast.success('Matériel ajouté')
      }
      
      setIsAddOpen(false)
      setEditingMaterial(null)
      resetForm()
      fetchData()
    } catch {
      toast.error('Une erreur est survenue')
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      type: '',
      serialNumber: '',
      purchaseDate: '',
      status: 'Disponible',
      assignedTo: '',
      description: ''
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer ce matériel ?')) return
    try {
      await dataClient.db.materials.delete(id)
      toast.success('Matériel supprimé')
      fetchData()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const filteredMaterials = materials.filter(mat => 
    mat.name.toLowerCase().includes(search.toLowerCase()) ||
    mat.type.toLowerCase().includes(search.toLowerCase()) ||
    mat.serialNumber?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organisation interne"
        title="Parc interne"
        description="Gérez les équipements utilisés par l’équipe ONEKANA, leur état, leur numéro de série et leur affectation."
        action={
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open)
          if (!open) {
            setEditingMaterial(null)
            resetForm()
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Ajouter un matériel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMaterial ? 'Modifier le matériel' : 'Ajouter un matériel'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du matériel</Label>
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="ex: Laptop MacBook Pro 14"
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(val) => setFormData({...formData, type: val})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {materialTypes.map(type => (
                        <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                      ))}
                      {materialTypes.length === 0 && (
                        <SelectItem disabled value="none">Aucun type défini. Ajoutez-le dans cette page.</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(val) => setFormData({...formData, status: val})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Numéro de série</Label>
                  <Input 
                    id="serialNumber" 
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                    placeholder="S/N: XXX-XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Date d'achat</Label>
                  <Input 
                    id="purchaseDate" 
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigné à (Optionnel)</Label>
                <Select 
                  value={formData.assignedTo || "none"} 
                  onValueChange={(val) => setFormData({...formData, assignedTo: val === "none" ? "" : val, status: val === "none" ? (formData.status === 'Assigné' ? 'Disponible' : formData.status) : 'Assigné'})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Non assigné" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non assigné</SelectItem>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description / Notes</Label>
                <Textarea 
                  id="description" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Notes complémentaires..."
                  className="resize-none"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">
                  {editingMaterial ? 'Mettre à jour' : 'Enregistrer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        }
      />

      <div className="flex items-center gap-2 max-w-md bg-card p-2 rounded-lg border border-border/50">
        <Search className="w-4 h-4 text-muted-foreground ml-2" />
        <Input 
          placeholder="Rechercher un matériel..." 
          className="border-0 focus-visible:ring-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Matériel</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Numéro de série</TableHead>
              <TableHead>Assigné à</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Chargement...</TableCell>
              </TableRow>
            ) : filteredMaterials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Aucun matériel trouvé.</TableCell>
              </TableRow>
            ) : (
              filteredMaterials.map((mat) => (
                <TableRow key={mat.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <EntityThumbnail media={media.find((item) => item.entityId === mat.id && item.isCover) || media.find((item) => item.entityId === mat.id)} alt={mat.name} />
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{mat.name}</span>
                        {mat.purchaseDate && <span className="text-xs text-muted-foreground">Acheté le: {new Date(mat.purchaseDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{mat.type}</TableCell>
                  <TableCell>
                    <span className="text-sm font-mono text-muted-foreground">{mat.serialNumber || '—'}</span>
                  </TableCell>
                  <TableCell>
                    {mat.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-primary" />
                        <span className="text-sm">
                          {employees.find(e => e.id === mat.assignedTo)?.firstName} {employees.find(e => e.id === mat.assignedTo)?.lastName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Non assigné</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      mat.status === 'Disponible' ? 'bg-green-100 text-green-700' : 
                      mat.status === 'Assigné' ? 'bg-blue-100 text-blue-700' :
                      mat.status === 'En réparation' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {mat.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <EntityMediaDialog entityType="material" entityId={mat.id} entityLabel={mat.name} onChanged={refreshMedia} />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => {
                        setEditingMaterial(mat)
                        setFormData({
                          name: mat.name,
                          type: mat.type,
                          serialNumber: mat.serialNumber || '',
                          purchaseDate: mat.purchaseDate || '',
                          status: mat.status,
                          assignedTo: mat.assignedTo || '',
                          description: mat.description || ''
                        })
                        setIsAddOpen(true)
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(mat.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CategoryManager
        title="Types de matériels"
        description="Ajoutez ou corrigez les catégories utilisées dans le formulaire matériel."
        itemLabel="un type de matériel"
        table={dataClient.db.materialTypes}
        onChanged={fetchData}
      />
    </div>
  )
}
