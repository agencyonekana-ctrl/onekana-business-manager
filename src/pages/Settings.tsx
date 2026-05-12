import { useState, useEffect } from 'react'
import { dataClient } from '../lib/data-client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { PageHeader } from '../components/app/PageHeader'
import { resetOnboardingGuide } from '../components/app/OnboardingGuide'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
import { Label } from '../components/ui/label'

interface CategoryType {
  id: string
  name: string
}

export default function Settings() {
  const [materialTypes, setMaterialTypes] = useState<CategoryType[]>([])
  const [reservationTypes, setReservationTypes] = useState<CategoryType[]>([])
  const [jobTitles, setJobTitles] = useState<CategoryType[]>([])
  const [employeeStatuses, setEmployeeStatuses] = useState<CategoryType[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'material' | 'reservation' | 'job' | 'status'>('material')
  const [editingItem, setEditingEditingItem] = useState<CategoryType | null>(null)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    fetchTypes()
  }, [])

  async function fetchTypes() {
    setLoading(true)
    try {
      const [matList, resList, jobList, statusList] = await Promise.all([
        dataClient.db.materialTypes.list(),
        dataClient.db.reservationTypes.list(),
        dataClient.db.jobTitles.list(),
        dataClient.db.employeeStatuses.list(),
      ])
      setMaterialTypes(matList as CategoryType[])
      setReservationTypes(resList as CategoryType[])
      setJobTitles(jobList as CategoryType[])
      setEmployeeStatuses(statusList as CategoryType[])
    } catch {
      toast.error('Erreur lors du chargement des paramètres')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!newName.trim()) return

    try {
      let table
      switch (dialogType) {
        case 'material': table = dataClient.db.materialTypes; break
        case 'reservation': table = dataClient.db.reservationTypes; break
        case 'job': table = dataClient.db.jobTitles; break
        case 'status': table = dataClient.db.employeeStatuses; break
      }
      
      if (editingItem) {
        await table.update(editingItem.id, { name: newName })
        toast.success('Modifié avec succès')
      } else {
        await table.create({ name: newName })
        toast.success('Ajouté avec succès')
      }
      
      closeDialog()
      fetchTypes()
    } catch {
      toast.error('Une erreur est survenue')
    }
  }

  async function handleDelete(id: string, type: 'material' | 'reservation' | 'job' | 'status') {
    if (!confirm('Supprimer cette catégorie ?')) return
    try {
      let table
      switch (type) {
        case 'material': table = dataClient.db.materialTypes; break
        case 'reservation': table = dataClient.db.reservationTypes; break
        case 'job': table = dataClient.db.jobTitles; break
        case 'status': table = dataClient.db.employeeStatuses; break
      }
      await table.delete(id)
      toast.success('Supprimé avec succès')
      fetchTypes()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  function openDialog(type: 'material' | 'reservation' | 'job' | 'status', item?: CategoryType) {
    setDialogType(type)
    if (item) {
      setEditingEditingItem(item)
      setNewName(item.name)
    } else {
      setEditingEditingItem(null)
      setNewName('')
    }
    setIsDialogOpen(true)
  }

  function closeDialog() {
    setIsDialogOpen(false)
    setEditingEditingItem(null)
    setNewName('')
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        eyebrow="Administration"
        title="Paramètres"
        description="Personnalisez les listes internes et relancez le guide de prise en main pour accompagner les utilisateurs."
        action={
          <Button
            variant="outline"
            onClick={() => {
              resetOnboardingGuide()
              toast.success('Guide de prise en main relancé')
            }}
          >
            Relancer le guide
          </Button>
        }
      />
      <div className="hidden">
        <h2 className="text-3xl font-bold tracking-tight">Paramètres</h2>
        <p className="text-muted-foreground">Personnalisez les types de données pour votre entreprise.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Material Types */}
        <CategoryCard
          title="Types de Matériels"
          description="Gérez les catégories d'équipements."
          items={materialTypes}
          loading={loading}
          onAdd={() => openDialog('material')}
          onEdit={(item) => openDialog('material', item)}
          onDelete={(id) => handleDelete(id, 'material')}
        />

        {/* Reservation Types */}
        <CategoryCard
          title="Types de Réservations"
          description="Gérez les types de services pour les agences."
          items={reservationTypes}
          loading={loading}
          onAdd={() => openDialog('reservation')}
          onEdit={(item) => openDialog('reservation', item)}
          onDelete={(id) => handleDelete(id, 'reservation')}
        />

        {/* Job Titles */}
        <CategoryCard
          title="Postes / Métiers"
          description="Gérez les intitulés de postes pour les employés."
          items={jobTitles}
          loading={loading}
          onAdd={() => openDialog('job')}
          onEdit={(item) => openDialog('job', item)}
          onDelete={(id) => handleDelete(id, 'job')}
        />

        {/* Employee Statuses */}
        <CategoryCard
          title="Statuts Employés"
          description="Gérez les différents statuts (Actif, Congé, etc.)."
          items={employeeStatuses}
          loading={loading}
          onAdd={() => openDialog('status')}
          onEdit={(item) => openDialog('status', item)}
          onDelete={(id) => handleDelete(id, 'status')}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Modifier le type' : 'Ajouter un type'}
              {dialogType === 'material' ? ' de matériel' : 
               dialogType === 'reservation' ? ' de réservation' :
               dialogType === 'job' ? ' de poste' : ' de statut'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Entrez le nom..."
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Annuler</Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CategoryCard({ 
  title, 
  description, 
  items, 
  loading, 
  onAdd, 
  onEdit, 
  onDelete 
}: { 
  title: string, 
  description: string, 
  items: CategoryType[], 
  loading: boolean, 
  onAdd: () => void, 
  onEdit: (item: CategoryType) => void, 
  onDelete: (id: string) => void 
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button size="sm" onClick={onAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={2} className="text-center italic">Chargement...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Aucun élément défini.</TableCell></TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
