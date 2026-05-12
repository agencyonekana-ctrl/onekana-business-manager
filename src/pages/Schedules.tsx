import { useState, useEffect } from 'react'
import { dataClient } from '../lib/data-client'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
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
import { Plus, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Schedule {
  id: string
  employeeId: string
  date: string
  startTime: string
  endTime: string
  notes: string
}

interface Employee {
  id: string
  firstName: string
  lastName: string
}

export default function Schedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [isAddOpen, setIsAddOpen] = useState(false)

  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [schList, empList] = await Promise.all([
        dataClient.db.schedules.list(),
        dataClient.db.employees.list()
      ])
      setSchedules(schList as Schedule[])
      setEmployees(empList as Employee[])
    } catch (error) {
      toast.error('Erreur lors du chargement des plannings')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await dataClient.db.schedules.create(formData)
      toast.success('Horaire ajouté')
      setIsAddOpen(false)
      fetchData()
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement')
    }
  }

  // Helper to get days of current week
  const getWeekDays = (date: Date) => {
    const start = new Date(date)
    start.setDate(start.getDate() - start.getDay() + 1) // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return d
    })
  }

  const weekDays = getWeekDays(currentWeek)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Horaires</h2>
          <p className="text-muted-foreground">Planifiez et visualisez les horaires de l'équipe.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Planifier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Planifier un horaire</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employé</Label>
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
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date" 
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Début</Label>
                  <Input 
                    id="startTime" 
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Fin</Label>
                  <Input 
                    id="endTime" 
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input 
                  id="notes" 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Réunion, Télétravail..."
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">Enregistrer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border/50">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              const d = new Date(currentWeek)
              d.setDate(d.getDate() - 7)
              setCurrentWeek(d)
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold min-w-[150px] text-center">
            Semaine du {weekDays[0].toLocaleDateString()}
          </span>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              const d = new Date(currentWeek)
              d.setDate(d.getDate() + 7)
              setCurrentWeek(d)
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="ghost" onClick={() => setCurrentWeek(new Date())}>Aujourd'hui</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dayStr = day.toISOString().split('T')[0]
          const daySchedules = schedules.filter(s => s.date === dayStr)
          const isToday = dayStr === new Date().toISOString().split('T')[0]

          return (
            <div key={dayStr} className="space-y-3">
              <div className={`text-center p-2 rounded-lg border ${
                isToday ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/30 border-border/50'
              }`}>
                <div className="text-xs font-medium uppercase">{day.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                <div className="text-lg font-bold">{day.getDate()}</div>
              </div>
              
              <div className="space-y-2 min-h-[100px]">
                {daySchedules.length > 0 ? (
                  daySchedules.map(sch => {
                    const emp = employees.find(e => e.id === sch.employeeId)
                    return (
                      <Card key={sch.id} className="border-border/50 shadow-sm">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-semibold text-primary truncate">
                            <User className="w-3 h-3" />
                            {emp ? `${emp.firstName} ${emp.lastName}` : 'N/A'}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {sch.startTime} - {sch.endTime}
                          </div>
                          {sch.notes && (
                            <div className="text-[10px] bg-secondary p-1 rounded italic truncate">
                              {sch.notes}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <div className="text-[10px] text-muted-foreground text-center py-4 border border-dashed rounded-lg border-border/30">
                    Libre
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
