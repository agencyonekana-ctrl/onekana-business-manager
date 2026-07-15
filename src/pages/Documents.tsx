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
import { Plus, Search, Trash2, FileText, Download, UploadCloud } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Document {
  id: string
  name: string
  employeeId: string
  type: string
  fileUrl: string
  fileId?: string
  createdAt: string
}

interface Employee {
  id: string
  firstName: string
  lastName: string
}

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    type: 'Contrat',
    file: null as File | null
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [docList, empList] = await Promise.all([
        dataClient.db.documents.list(),
        dataClient.db.employees.list()
      ])
      setDocuments(docList as Document[])
      setEmployees(empList as Employee[])
    } catch {
      toast.error('Erreur lors du chargement des documents')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.file) {
      toast.error('Veuillez sélectionner un fichier')
      return
    }

    setUploading(true)
    try {
      // 1. Upload to storage
      const file = formData.file
      const path = `documents/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      const { publicUrl, fileId } = await dataClient.storage.upload(file, path)

      // 2. Save metadata to DB
      await dataClient.db.documents.create({
        name: formData.name,
        employeeId: formData.employeeId,
        type: formData.type,
        fileUrl: publicUrl,
        fileId,
        createdAt: new Date().toISOString()
      })

      toast.success('Document ajouté avec succès')
      setIsAddOpen(false)
      setFormData({ name: '', employeeId: '', type: 'Contrat', file: null })
      fetchData()
    } catch {
      toast.error('Erreur lors de l\'envoi du document')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string, _fileUrl: string) {
    if (!confirm('Voulez-vous vraiment supprimer ce document ?')) return
    try {
      // Extract path from URL to remove from storage (optional but cleaner)
      // For now just delete record for simplicity as storage removal requires exact path
      await dataClient.db.documents.delete(id)
      toast.success('Document supprimé')
      fetchData()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  async function handleDownload(document: Document) {
    if (!document.fileId) {
      toast.error('Ce document doit etre reimporte dans le stockage securise.')
      return
    }

    try {
      const blob = await dataClient.storage.download(document.fileId)
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.name
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Document temporairement indisponible')
    }
  }

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(search.toLowerCase()) ||
    employees.find(e => e.id === doc.employeeId)?.firstName.toLowerCase().includes(search.toLowerCase()) ||
    employees.find(e => e.id === doc.employeeId)?.lastName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
          <p className="text-muted-foreground">Suivez et archivez les documents RH de vos employés.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Ajouter un document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nouveau document</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du document</Label>
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                  placeholder="Ex: Contrat de travail, RIB..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee">Employé concerné</Label>
                <Select 
                  value={formData.employeeId} 
                  onValueChange={(val) => setFormData({...formData, employeeId: val})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un employé" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(val) => setFormData({...formData, type: val})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type de document" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Contrat">Contrat</SelectItem>
                    <SelectItem value="Identité">Identité</SelectItem>
                    <SelectItem value="RIB">RIB</SelectItem>
                    <SelectItem value="Diplôme">Diplôme</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Fichier</Label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {formData.file ? formData.file.name : "Cliquez pour uploader"}
                      </p>
                    </div>
                    <input 
                      id="file" 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => setFormData({...formData, file: e.target.files?.[0] || null})}
                    />
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full" disabled={uploading}>
                  {uploading ? 'Envoi en cours...' : 'Ajouter le document'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-md bg-card p-2 rounded-lg border border-border/50">
        <Search className="w-4 h-4 text-muted-foreground ml-2" />
        <Input 
          placeholder="Rechercher par nom ou employé..." 
          className="border-0 focus-visible:ring-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <Table data-tour="documents-table">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Document</TableHead>
              <TableHead>Employé</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date d'ajout</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Chargement...</TableCell>
              </TableRow>
            ) : filteredDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Aucun document trouvé.</TableCell>
              </TableRow>
            ) : (
              filteredDocs.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary text-primary">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="font-medium">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {employees.find(e => e.id === doc.employeeId) 
                      ? `${employees.find(e => e.id === doc.employeeId)?.firstName} ${employees.find(e => e.id === doc.employeeId)?.lastName}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full bg-muted text-xs font-medium">
                      {doc.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-primary"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(doc.id, doc.fileUrl)}
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
