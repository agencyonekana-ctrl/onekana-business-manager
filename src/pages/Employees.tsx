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
import { Plus, Search, Pencil, Trash2, Building2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  departmentId: string
  jobTitle: string
  status: string
}

interface Department {
  id: string
  name: string
}

interface JobTitle {
  id: string
  name: string
}

interface EmployeeStatus {
  id: string
  name: string
  color: string
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([])
  const [employeeStatuses, setEmployeeStatuses] = useState<EmployeeStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    departmentId: '',
    jobTitle: '',
    status: 'Actif'
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [empList, deptList, jobList, statusList] = await Promise.all([
        dataClient.db.employees.list(),
        dataClient.db.departments.list(),
        dataClient.db.jobTitles.list(),
        dataClient.db.employeeStatuses.list(),
      ])
      setEmployees(empList as Employee[])
      setDepartments(deptList as Department[])
      setJobTitles(jobList as JobTitle[])
      setEmployeeStatuses(statusList as EmployeeStatus[])
    } catch (error) {
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingEmployee) {
        await dataClient.db.employees.update(editingEmployee.id, formData)
        toast.success('Employé mis à jour')
      } else {
        await dataClient.db.employees.create(formData)
        toast.success('Employé ajouté')
      }
      setIsAddOpen(false)
      setEditingEmployee(null)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        departmentId: '',
        jobTitle: '',
        status: 'Actif'
      })
      fetchData()
    } catch (error) {
      toast.error('Une erreur est survenue')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer cet employé ?')) return
    try {
      await dataClient.db.employees.delete(id)
      toast.success('Employé supprimé')
      fetchData()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const filteredEmployees = employees.filter(emp => 
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    emp.email.toLowerCase().includes(search.toLowerCase()) ||
    emp.jobTitle.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Employés</h2>
          <p className="text-muted-foreground">Gérez les membres de votre équipe et leurs informations.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open)
          if (!open) {
            setEditingEmployee(null)
            setFormData({ firstName: '', lastName: '', email: '', departmentId: '', jobTitle: '', status: 'Actif' })
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Ajouter un employé
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? 'Modifier l\'employé' : 'Ajouter un employé'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input 
                    id="firstName" 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input 
                    id="lastName" 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Département</Label>
                <Select 
                  value={formData.departmentId} 
                  onValueChange={(val) => setFormData({...formData, departmentId: val})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un département" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Poste</Label>
                <Select 
                  value={formData.jobTitle} 
                  onValueChange={(val) => setFormData({...formData, jobTitle: val})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un poste" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTitles.map(job => (
                      <SelectItem key={job.id} value={job.name}>{job.name}</SelectItem>
                    ))}
                    {jobTitles.length === 0 && (
                      <SelectItem disabled value="none">Aucun poste défini (Paramètres)</SelectItem>
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
                    {employeeStatuses.map(status => (
                      <SelectItem key={status.id} value={status.name}>{status.name}</SelectItem>
                    ))}
                    {employeeStatuses.length === 0 && (
                      <SelectItem disabled value="none">Aucun statut défini (Paramètres)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">
                  {editingEmployee ? 'Mettre à jour' : 'Enregistrer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-md bg-card p-2 rounded-lg border border-border/50">
        <Search className="w-4 h-4 text-muted-foreground ml-2" />
        <Input 
          placeholder="Rechercher un employé..." 
          className="border-0 focus-visible:ring-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Employé</TableHead>
              <TableHead>Département</TableHead>
              <TableHead>Poste</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Chargement...</TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Aucun employé trouvé.</TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((emp) => (
                <TableRow key={emp.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{emp.firstName} {emp.lastName}</span>
                      <span className="text-xs text-muted-foreground">{emp.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3 h-3 text-primary" />
                      {departments.find(d => d.id === emp.departmentId)?.name || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>{emp.jobTitle}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      employeeStatuses.find(s => s.name === emp.status)?.color || 'bg-gray-100 text-gray-700'
                    }`}>
                      {emp.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => {
                        setEditingEmployee(emp)
                        setFormData({
                          firstName: emp.firstName,
                          lastName: emp.lastName,
                          email: emp.email,
                          departmentId: emp.departmentId,
                          jobTitle: emp.jobTitle,
                          status: emp.status
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
                      onClick={() => handleDelete(emp.id)}
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
