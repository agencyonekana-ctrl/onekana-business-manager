import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { ApiTable } from '../../types/api'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

type CategoryItem = {
  id: string
  name: string
}

type CategoryManagerProps = {
  title: string
  description: string
  itemLabel: string
  table: ApiTable
  onChanged?: () => void
}

export function CategoryManager({ title, description, itemLabel, table, onChanged }: CategoryManagerProps) {
  const [items, setItems] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CategoryItem | null>(null)
  const [name, setName] = useState('')

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await table.list<CategoryItem>()
      setItems(rows)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [table])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  function openDialog(item?: CategoryItem) {
    setEditingItem(item || null)
    setName(item?.name || '')
    setIsDialogOpen(true)
  }

  function closeDialog() {
    setIsDialogOpen(false)
    setEditingItem(null)
    setName('')
  }

  async function handleSave() {
    const trimmedName = name.trim()
    if (!trimmedName) return

    try {
      if (editingItem) {
        await table.update(editingItem.id, { name: trimmedName })
        toast.success('Element modifie')
      } else {
        await table.create({ name: trimmedName })
        toast.success('Element ajoute')
      }
      closeDialog()
      await fetchItems()
      onChanged?.()
    } catch {
      toast.error('Impossible d enregistrer cet element')
    }
  }

  async function handleDelete(item: CategoryItem) {
    if (!confirm(`Supprimer "${item.name}" ?`)) return

    try {
      await table.delete(item.id)
      toast.success('Element supprime')
      await fetchItems()
      onChanged?.()
    } catch {
      toast.error('Impossible de supprimer cet element')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button size="sm" className="gap-2" onClick={() => openDialog()}>
          <Plus className="h-4 w-4" />
          Ajouter
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
              <TableRow>
                <TableCell colSpan={2} className="h-16 text-center text-muted-foreground">Chargement...</TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="h-16 text-center text-muted-foreground">Aucun element defini.</TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => openDialog(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} {itemLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="category-name">Nom</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleSave()}
              placeholder="Entrez le nom"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Annuler</Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
