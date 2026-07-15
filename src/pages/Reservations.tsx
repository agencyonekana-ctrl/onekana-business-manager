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
import { Plus, Search, Pencil, Trash2, Building2, Phone, Mail, CalendarRange } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Reservation {
  id: string
  agencyName: string
  contactName: string
  contactEmail: string
  contactPhone?: string
  serviceType: string
  startDate: string
  endDate: string
  status: string
  notes?: string
  createdAt?: string
}

interface ReservationType {
  id: string
  name: string
}

const STATUSES = ['En attente', 'Confirmée', 'En cours', 'Terminée', 'Annulée']

const STATUS_STYLES: Record<string, string> = {
  'En attente': 'bg-amber-100 text-amber-700',
  'Confirmée': 'bg-blue-100 text-blue-700',
  'En cours': 'bg-teal-100 text-teal-700',
  'Terminée': 'bg-green-100 text-green-700',
  'Annulée': 'bg-red-100 text-red-700'
}

const defaultForm = {
  agencyName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  serviceType: '',
  startDate: '',
  endDate: '',
  status: 'En attente',
  notes: ''
}

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [reservationTypes, setReservationTypes] = useState<ReservationType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Reservation | null>(null)
  const [formData, setFormData] = useState(defaultForm)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [resList, typeList] = await Promise.all([
        dataClient.db.reservations.list({ orderBy: { createdAt: 'desc' } }),
        dataClient.db.reservationTypes.list(),
      ])
      setReservations(resList as Reservation[])
      setReservationTypes(typeList as ReservationType[])
    } catch {
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.agencyName || !formData.contactName || !formData.contactEmail || !formData.serviceType || !formData.startDate || !formData.endDate) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    try {
      if (editing) {
        await dataClient.db.reservations.update(editing.id, formData)
        toast.success('Réservation mise à jour')
      } else {
        await dataClient.db.reservations.create(formData)
        toast.success('Réservation créée')
      }
      closeDialog()
      fetchData()
    } catch {
      toast.error('Une erreur est survenue')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette réservation ?')) return
    try {
      await dataClient.db.reservations.delete(id)
      toast.success('Réservation supprimée')
      fetchData()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  function openEdit(r: Reservation) {
    setEditing(r)
    setFormData({
      agencyName: r.agencyName,
      contactName: r.contactName,
      contactEmail: r.contactEmail,
      contactPhone: r.contactPhone || '',
      serviceType: r.serviceType,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status,
      notes: r.notes || ''
    })
    setIsDialogOpen(true)
  }

  function closeDialog() {
    setIsDialogOpen(false)
    setEditing(null)
    setFormData(defaultForm)
  }

  const filtered = reservations.filter(r =>
    r.agencyName.toLowerCase().includes(search.toLowerCase()) ||
    r.contactName.toLowerCase().includes(search.toLowerCase()) ||
    r.serviceType.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Réservations Agences</h2>
          <p className="text-muted-foreground">Gérez les demandes de partenariat et réservations de services.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setIsDialogOpen(true) }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Nouvelle réservation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier la réservation' : 'Nouvelle réservation'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="agencyName">Nom de l'agence *</Label>
                <Input
                  id="agencyName"
                  value={formData.agencyName}
                  onChange={e => setFormData({ ...formData, agencyName: e.target.value })}
                  placeholder="ex: Agence Alpha Consulting"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Nom du contact *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Jean Dupont"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Téléphone</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="contact@agence.com"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Type de service *</Label>
                  <Select value={formData.serviceType} onValueChange={val => setFormData({ ...formData, serviceType: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un service" />
                    </SelectTrigger>
                    <SelectContent>
                      {reservationTypes.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                      {reservationTypes.length === 0 && (
                        <SelectItem disabled value="none">Aucun type défini. Ajoutez-le dans cette page.</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select value={formData.status} onValueChange={val => setFormData({ ...formData, status: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Date de début *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Date de fin *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Remarques</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Détails supplémentaires sur la demande..."
                  className="resize-none"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">
                  {editing ? 'Mettre à jour' : 'Enregistrer la réservation'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-md bg-card p-2 rounded-lg border border-border/50">
        <Search className="w-4 h-4 text-muted-foreground ml-2" />
        <Input
          placeholder="Rechercher une réservation..."
          className="border-0 focus-visible:ring-0"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Agence</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Chargement...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Aucune réservation trouvée.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(r => (
                <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-rose-50 text-rose-500">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="font-medium">{r.agencyName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{r.contactName}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span>{r.contactEmail}</span>
                      </div>
                      {r.contactPhone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span>{r.contactPhone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{r.serviceType}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <CalendarRange className="w-3 h-3 text-primary" />
                      <span>{new Date(r.startDate).toLocaleDateString('fr-FR')}</span>
                      <span>→</span>
                      <span>{new Date(r.endDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[r.status] || 'bg-gray-100 text-gray-700'}`}>
                      {r.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => openEdit(r)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(r.id)}
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
        title="Types de réservations"
        description="Ajoutez ou corrigez les services proposés aux agences."
        itemLabel="un type de réservation"
        table={dataClient.db.reservationTypes}
        onChanged={fetchData}
      />
    </div>
  )
}
