import { useState, useEffect } from 'react'
import { localData } from '../lib/local-data'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { MapPin, Monitor, Map as MapIcon, Image as ImageIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Site, Support, Emplacement, Asset } from '../features/inventory/types'
import { SitesTab } from '../features/inventory/components/SitesTab'
import { SupportsTab } from '../features/inventory/components/SupportsTab'
import { EmplacementsTab } from '../features/inventory/components/EmplacementsTab'
import { AssetsTab } from '../features/inventory/components/AssetsTab'

export default function Inventory() {
  const [sites, setSites] = useState<Site[]>([])
  const [supports, setSupports] = useState<Support[]>([])
  const [emplacements, setEmplacements] = useState<Emplacement[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [allLines, setAllLines] = useState<any[]>([])
  const [allCampaigns, setAllCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [sList, supList, eList, aList, lList, cList] = await Promise.all([
        localData.db.oohSites.list(),
        localData.db.oohSupports.list(),
        localData.db.oohEmplacements.list(),
        localData.db.oohAssets.list(),
        localData.db.oohCampaignLines.list(),
        localData.db.oohCampaigns.list()
      ])
      setSites(sList as Site[])
      setSupports(supList as Support[])
      setEmplacements(eList as Emplacement[])
      setAssets(aList as Asset[])
      setAllLines(lList)
      setAllCampaigns(cList)
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'inventaire')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestion de l'Inventaire</h2>
        <p className="text-muted-foreground">Gérez vos sites physiques, supports, emplacements et visuels (assets).</p>
      </div>

      <Tabs defaultValue="sites" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="sites" className="gap-2"><MapPin className="w-4 h-4" /> Sites</TabsTrigger>
          <TabsTrigger value="supports" className="gap-2"><Monitor className="w-4 h-4" /> Supports</TabsTrigger>
          <TabsTrigger value="emplacements" className="gap-2"><MapIcon className="w-4 h-4" /> Emplacements</TabsTrigger>
          <TabsTrigger value="assets" className="gap-2"><ImageIcon className="w-4 h-4" /> Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="sites">
          <SitesTab sites={sites} loading={loading} onRefresh={fetchData} />
        </TabsContent>

        <TabsContent value="supports">
          <SupportsTab supports={supports} loading={loading} onRefresh={fetchData} />
        </TabsContent>

        <TabsContent value="emplacements">
          <EmplacementsTab 
            emplacements={emplacements} 
            sites={sites} 
            supports={supports} 
            allLines={allLines} 
            allCampaigns={allCampaigns} 
            loading={loading} 
            onRefresh={fetchData} 
          />
        </TabsContent>

        <TabsContent value="assets">
          <AssetsTab assets={assets} loading={loading} onRefresh={fetchData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
