import { useState, useEffect } from 'react'
import { localData } from '../lib/local-data'
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
import { Plus, Search, Pencil, Trash2, Building2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Department {
  id: string
  name: string
  description: string
}

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchDepartments()
  }, [])

  async function fetchDepartments() {
    setLoading(true)
    try {
      const list = await localData.db.departments.list()
      setDepartments(list as Department[])
    } catch (error) {
      toast.error('Erreur lors du chargement des départements')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingDept) {
        await localData.db.departments.update(editingDept.id, formData)
        toast.success('Département mis à jour')
      } else {
        await localData.db.departments.create(formData)
        toast.success('Département ajouté')
      }
      setIsAddOpen(false)
      setEditingDept(null)
      setFormData({ name: '', description: '' })
      fetchDepartments()
    } catch (error) {
      toast.error('Une erreur est survenue')
    }
  }

  async function handleDelete(id: string) {
    try {
      // Check if department has employees before deleting
      const empCount = await localData.db.employees.count({ where: { departmentId: id } })
      if (empCount > 0) {
        toast.error('Impossible de supprimer : ce département contient des employés')
        return
      }
    } catch {
      // If count fails, proceed with deletion anyway
    }

    if (!confirm('Voulez-vous vraiment supprimer ce département ?')) return
    try {
      await localData.db.departments.delete(id)
      toast.success('Département supprimé')
      fetchDepartments()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(search.toLowerCase()) ||
    dept.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Départements</h2>
          <p className="text-muted-foreground">Gérez la structure organisationnelle de l'entreprise.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open)
          if (!open) {
            setEditingDept(null)
            setFormData({ name: '', description: '' })
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Ajouter un département
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingDept ? 'Modifier le département' : 'Ajouter un département'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du département</Label>
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                  placeholder="Ex: Marketing, IT, RH..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optionnel)</Label>
                <Input 
                  id="description" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Bref descriptif du rôle..."
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">
                  {editingDept ? 'Mettre à jour' : 'Enregistrer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-md bg-card p-2 rounded-lg border border-border/50">
        <Search className="w-4 h-4 text-muted-foreground ml-2" />
        <Input 
          placeholder="Rechercher un département..." 
          className="border-0 focus-visible:ring-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Département</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">Chargement...</TableCell>
              </TableRow>
            ) : filteredDepartments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">Aucun département trouvé.</TableCell>
              </TableRow>
            ) : (
              filteredDepartments.map((dept) => (
                <TableRow key={dept.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-foreground">{dept.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {dept.description || 'Aucune description.'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => {
                        setEditingDept(dept)
                        setFormData({
                          name: dept.name,
                          description: dept.description
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
                      onClick={() => handleDelete(dept.id)}
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
    </div>
  )
}
