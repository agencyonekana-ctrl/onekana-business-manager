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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Plus, Megaphone, Trash2, Eye, Calculator, Calendar as CalendarIcon, List } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { toast } from 'react-hot-toast'
import { format, addDays, startOfToday, isWithinInterval, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Campaign {
  id: string
  name: string
  clientName: string
  startDate: string
  endDate: string
  status: string
}

interface CampaignLine {
  id: string
  campaignId: string
  emplacementId: string
  assetId?: string
  totalPrice: number
}

interface Emplacement {
  id: string
  name: string
  supportId: string
  status: string
}

interface Support {
  id: string
  name: string
  type: string
}

interface PricingRule {
  id: string
  supportType: string
  basePrice: number
  coefficient: number
}

interface Asset {
  id: string
  name: string
  type: string
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [emplacements, setEmplacements] = useState<Emplacement[]>([])
  const [supports, setSupports] = useState<Support[]>([])
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [campaignLines, setCampaignLines] = useState<CampaignLine[]>([])
  const [allLines, setAllLines] = useState<CampaignLine[]>([])
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([])

  // Dialog States
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false)
  const [isLineDialogOpen, setIsLineDialogOpen] = useState(false)

  const [campaignForm, setCampaignForm] = useState({ name: '', clientName: '', startDate: '', endDate: '', status: 'draft' })
  const [lineForm, setLineForm] = useState({ emplacementId: '', assetId: '', totalPrice: 0 })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [cList, eList, supList, pList, aList, lList] = await Promise.all([
        localData.db.oohCampaigns.list(),
        localData.db.oohEmplacements.list(),
        localData.db.oohSupports.list(),
        localData.db.oohPricingRules.list(),
        localData.db.oohAssets.list(),
        localData.db.oohCampaignLines.list()
      ])
      setCampaigns(cList as Campaign[])
      setAllCampaigns(cList as Campaign[])
      setEmplacements(eList as Emplacement[])
      setSupports(supList as Support[])
      setPricingRules(pList as PricingRule[])
      setAssets(aList as Asset[])
      setAllLines(lList as CampaignLine[])
    } catch (error) {
      toast.error('Erreur lors du chargement des campagnes')
    } finally {
      setLoading(false)
    }
  }

  async function fetchLines(campaignId: string) {
    try {
      const lines = await localData.db.oohCampaignLines.list({ where: { campaignId } })
      setCampaignLines(lines as CampaignLine[])
    } catch (error) {
      toast.error('Erreur lors du chargement des lignes')
    }
  }

  async function handleCampaignSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await localData.db.oohCampaigns.create(campaignForm)
      toast.success('Campagne créée')
      setIsCampaignDialogOpen(false)
      setCampaignForm({ name: '', clientName: '', startDate: '', endDate: '', status: 'draft' })
      fetchData()
    } catch (error) {
      toast.error('Erreur lors de la création')
    }
  }

  async function handleLineSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCampaign) return
    
    try {
      // Check for overlap
      const existingLines = await localData.db.oohCampaignLines.list({
        where: { emplacementId: lineForm.emplacementId }
      })
      
      const campaignsLinked = await Promise.all(
        (existingLines as CampaignLine[]).map(l => localData.db.oohCampaigns.get(l.campaignId))
      )
      
      const overlap = campaignsLinked.some((c: any) => {
        if (!c) return false
        return (
          selectedCampaign.startDate <= c.endDate && 
          selectedCampaign.endDate >= c.startDate
        )
      })

      if (overlap) {
        toast.error('Cet emplacement est déjà réservé sur cette période.')
        return
      }

      await localData.db.oohCampaignLines.create({
        ...lineForm,
        campaignId: selectedCampaign.id,
        assetId: lineForm.assetId || null
      })
      
      toast.success('Ligne de vente ajoutée')
      setIsLineDialogOpen(false)
      setLineForm({ emplacementId: '', assetId: '', totalPrice: 0 })
      fetchLines(selectedCampaign.id)
      fetchData() // Refresh emplacements list
    } catch (error) {
      toast.error('Erreur lors de l\'ajout')
    }
  }

  // Auto-calculate price when emplacement is selected
  useEffect(() => {
    if (lineForm.emplacementId) {
      const emp = emplacements.find(e => e.id === lineForm.emplacementId)
      if (emp) {
        const support = supports.find(s => s.id === emp.supportId)
        if (support) {
          const rule = pricingRules.find(r => r.supportType === support.type)
          if (rule) {
            setLineForm(prev => ({ ...prev, totalPrice: rule.basePrice * rule.coefficient }))
          }
        }
      }
    }
  }, [lineForm.emplacementId, emplacements, supports, pricingRules])

  const today = startOfToday()
  const timelineDays = Array.from({ length: 14 }).map((_, i) => addDays(today, i))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Campagnes & Réservations</h2>
          <p className="text-muted-foreground">Gérez les réservations d'emplacements et les lignes de vente par campagne.</p>
        </div>
        <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Nouvelle Campagne</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Créer une campagne</DialogTitle></DialogHeader>
            <form onSubmit={handleCampaignSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="cname">Nom de la campagne</Label>
                <Input id="cname" value={campaignForm.name} onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Nom du client</Label>
                <Input id="client" value={campaignForm.clientName} onChange={(e) => setCampaignForm({...campaignForm, clientName: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Date de début</Label>
                  <Input id="start" type="date" value={campaignForm.startDate} onChange={(e) => setCampaignForm({...campaignForm, startDate: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">Date de fin</Label>
                  <Input id="end" type="date" value={campaignForm.endDate} onChange={(e) => setCampaignForm({...campaignForm, endDate: e.target.value})} required />
                </div>
              </div>
              <DialogFooter><Button type="submit" className="w-full">Créer la campagne</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="list" className="gap-2"><List className="w-4 h-4" /> Liste des Campagnes</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2"><CalendarIcon className="w-4 h-4" /> Vue Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="pt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Campaign List */}
            <Card className="lg:col-span-1 border-border/50">
              <CardHeader>
                <CardTitle>Liste des Campagnes</CardTitle>
                <CardDescription>Sélectionnez une campagne pour voir ses lignes.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y border-t">
                  {loading ? <div className="p-4 text-center">Chargement...</div> : 
                    campaigns.map(c => (
                      <button 
                        key={c.id} 
                        className={`w-full text-left p-4 hover:bg-muted/50 transition-colors flex justify-between items-center ${selectedCampaign?.id === c.id ? 'bg-primary/5 border-l-4 border-primary' : ''}`}
                        onClick={() => { setSelectedCampaign(c); fetchLines(c.id); }}
                      >
                        <div className="space-y-1">
                          <div className="font-semibold">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.clientName}</div>
                        </div>
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Campaign Detail / Lines */}
            <Card className="lg:col-span-2 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{selectedCampaign ? `Lignes: ${selectedCampaign.name}` : 'Détails de la campagne'}</CardTitle>
                  <CardDescription>Emplacements réservés et tarification.</CardDescription>
                </div>
                {selectedCampaign && (
                  <Dialog open={isLineDialogOpen} onOpenChange={setIsLineDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Ajouter une ligne</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Réserver un emplacement</DialogTitle></DialogHeader>
                      <form onSubmit={handleLineSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="lemp">Emplacement</Label>
                          <Select value={lineForm.emplacementId} onValueChange={(v) => setLineForm({...lineForm, emplacementId: v})}>
                            <SelectTrigger><SelectValue placeholder="Choisir un emplacement" /></SelectTrigger>
                            <SelectContent>
                              {emplacements.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          {lineForm.emplacementId && (
                            <p className="text-xs text-muted-foreground italic">
                              Type: {supports.find(s => s.id === emplacements.find(e => e.id === lineForm.emplacementId)?.supportId)?.type || 'Inconnu'}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lasset">Visuel (Asset)</Label>
                          <Select value={lineForm.assetId} onValueChange={(v) => setLineForm({...lineForm, assetId: v})}>
                            <SelectTrigger><SelectValue placeholder="Choisir un visuel" /></SelectTrigger>
                            <SelectContent>
                              {assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name} ({a.type})</SelectItem>)}
                              {assets.length === 0 && <SelectItem disabled value="none">Aucun asset disponible</SelectItem>}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lprice">Prix Total (€)</Label>
                          <div className="flex gap-2">
                            <Input id="lprice" type="number" value={lineForm.totalPrice} onChange={(e) => setLineForm({...lineForm, totalPrice: parseFloat(e.target.value)})} required />
                            <div className="flex items-center justify-center p-2 bg-muted rounded-md" title="Prix suggéré par le moteur de tarification">
                              <Calculator className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                        <DialogFooter><Button type="submit" className="w-full">Ajouter à la campagne</Button></DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {!selectedCampaign ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-4">
                    <Megaphone className="w-12 h-12 opacity-20" />
                    <p>Sélectionnez une campagne pour voir ses lignes de vente.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Emplacement</TableHead>
                        <TableHead>Visuel</TableHead>
                        <TableHead className="text-right">Prix Total</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaignLines.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucune ligne pour cette campagne.</TableCell></TableRow> : 
                        campaignLines.map(line => (
                          <TableRow key={line.id}>
                            <TableCell>{emplacements.find(e => e.id === line.emplacementId)?.name || 'Inconnu'}</TableCell>
                            <TableCell>
                              <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                                {assets.find(a => a.id === line.assetId)?.name || 'Aucun'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono">{line.totalPrice.toLocaleString()} €</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive" 
                                onClick={async () => { 
                                  await localData.db.oohCampaignLines.delete(line.id); 
                                  fetchLines(selectedCampaign.id); 
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="pt-4">
          <Card className="border-border/50 overflow-hidden">
            <CardHeader>
              <CardTitle>Planning des Emplacements</CardTitle>
              <CardDescription>Occupation visuelle sur les 14 prochains jours.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-[200px_repeat(14,1fr)] border-b">
                  <div className="p-3 bg-muted font-medium border-r">Emplacement</div>
                  {timelineDays.map(day => (
                    <div key={day.toISOString()} className="p-3 text-center bg-muted text-xs font-medium border-r last:border-r-0">
                      <div className="uppercase opacity-50">{format(day, 'EEE', { locale: fr })}</div>
                      <div>{format(day, 'dd/MM')}</div>
                    </div>
                  ))}
                </div>
                <div className="divide-y">
                  {emplacements.map(emp => (
                    <div key={emp.id} className="grid grid-cols-[200px_repeat(14,1fr)] h-12">
                      <div className="p-3 text-sm font-medium border-r truncate">{emp.name}</div>
                      {timelineDays.map(day => {
                        const dayStr = format(day, 'yyyy-MM-dd')
                        const line = allLines.find(l => {
                          if (l.emplacementId !== emp.id) return false
                          const camp = allCampaigns.find(c => c.id === l.campaignId)
                          if (!camp) return false
                          return dayStr >= camp.startDate && dayStr <= camp.endDate
                        })
                        const camp = line ? allCampaigns.find(c => c.id === line.campaignId) : null

                        return (
                          <div 
                            key={day.toISOString()} 
                            className={`border-r last:border-r-0 flex items-center justify-center p-0.5`}
                          >
                            {camp && (
                              <div 
                                className="w-full h-full rounded bg-primary/20 border border-primary/40 flex items-center justify-center overflow-hidden"
                                title={`${camp.name} - ${camp.clientName}`}
                              >
                                <span className="text-[10px] truncate px-1 text-primary font-bold">
                                  {camp.clientName.substring(0, 3)}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
