import { useState, useEffect } from 'react'
import { dataClient } from '../lib/data-client'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { MapPin, Monitor, Map as MapIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Site, Support, Emplacement } from '../features/inventory/types'
import { SitesTab } from '../features/inventory/components/SitesTab'
import { SupportsTab } from '../features/inventory/components/SupportsTab'
import { EmplacementsTab } from '../features/inventory/components/EmplacementsTab'
import { PageHeader } from '../components/app/PageHeader'
import { mediaApi } from '../services/media-api'
import type { EntityMedia } from '../types/media'

export default function Inventory() {
  const [sites, setSites] = useState<Site[]>([])
  const [supports, setSupports] = useState<Support[]>([])
  const [emplacements, setEmplacements] = useState<Emplacement[]>([])
  const [media, setMedia] = useState<EntityMedia[]>([])
  const [allLines, setAllLines] = useState<any[]>([])
  const [allCampaigns, setAllCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [sList, supList, eList, lList, cList, siteMedia, supportMedia, emplacementMedia] = await Promise.all([
        dataClient.db.oohSites.list(),
        dataClient.db.oohSupports.list(),
        dataClient.db.oohEmplacements.list(),
        dataClient.db.oohCampaignLines.list(),
        dataClient.db.oohCampaigns.list(),
        mediaApi.list('ooh_site'),
        mediaApi.list('ooh_support'),
        mediaApi.list('ooh_emplacement'),
      ])
      setSites(sList as Site[])
      setSupports(supList as Support[])
      setEmplacements(eList as Emplacement[])
      setMedia([...siteMedia, ...supportMedia, ...emplacementMedia])
      setAllLines(lList)
      setAllCampaigns(cList)
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'inventaire')
    } finally {
      setLoading(false)
    }
  }

  async function refreshMedia() {
    try {
      const rows = await Promise.all([
        mediaApi.list('ooh_site'),
        mediaApi.list('ooh_support'),
        mediaApi.list('ooh_emplacement'),
      ])
      setMedia(rows.flat())
    } catch {
      toast.error('Impossible d’actualiser les images')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ventes OOH"
        title="Inventaire OOH"
        description="Contrôlez les sites, les formats de supports et les emplacements commercialisables de la régie ONEKANA."
      />

      <Tabs defaultValue="sites" className="w-full" data-tour="inventory-tabs">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="sites" className="gap-2"><MapPin className="w-4 h-4" /> Sites</TabsTrigger>
          <TabsTrigger value="supports" className="gap-2"><Monitor className="w-4 h-4" /> Supports</TabsTrigger>
          <TabsTrigger value="emplacements" className="gap-2"><MapIcon className="w-4 h-4" /> Emplacements</TabsTrigger>
        </TabsList>

        <TabsContent value="sites">
          <SitesTab sites={sites} media={media.filter((item) => item.entityType === 'ooh_site')} loading={loading} onRefresh={fetchData} onMediaChanged={refreshMedia} />
        </TabsContent>

        <TabsContent value="supports">
          <SupportsTab supports={supports} media={media.filter((item) => item.entityType === 'ooh_support')} loading={loading} onRefresh={fetchData} onMediaChanged={refreshMedia} />
        </TabsContent>

        <TabsContent value="emplacements">
          <EmplacementsTab 
            emplacements={emplacements} 
            sites={sites} 
            supports={supports} 
            allLines={allLines} 
            allCampaigns={allCampaigns} 
            media={media.filter((item) => item.entityType === 'ooh_emplacement')}
            loading={loading} 
            onRefresh={fetchData} 
            onMediaChanged={refreshMedia}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
