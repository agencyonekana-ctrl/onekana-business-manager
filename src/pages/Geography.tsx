import { useEffect, useMemo, useState } from 'react'
import type { ElementType, ReactNode } from 'react'
import 'leaflet/dist/leaflet.css'
import { CheckCircle2, ClipboardCheck, Map, MapPin, Route, Search, UsersRound } from 'lucide-react'
import { EmptyState } from '../components/app/EmptyState'
import { PageHeader } from '../components/app/PageHeader'
import { StatusBadge } from '../components/app/StatusBadge'
import { GeographicReviewDialog } from '../components/geography/GeographicReviewDialog'
import { GeographyMap } from '../components/geography/GeographyMap'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { useAuth } from '../hooks/use-auth'
import { can } from '../lib/access-control'
import { agencyApi } from '../services/agency-api'
import { geographicReviewsApi } from '../services/geographic-reviews-api'
import type { AgencyCommune, AgencyHotspot, AgencyRoute, GeographicEntityType, GeographicReview } from '../types/geography'

type ReviewTarget = { entityType: GeographicEntityType; externalId: string; label: string }

function reviewKey(entityType: GeographicEntityType, externalId: string) {
  return `${entityType}:${externalId}`
}

function formatNumber(value?: number) {
  return typeof value === 'number' ? new Intl.NumberFormat('fr-FR').format(value) : 'Non renseigné'
}

export default function Geography() {
  const { user } = useAuth()
  const [communes, setCommunes] = useState<AgencyCommune[]>([])
  const [hotspots, setHotspots] = useState<AgencyHotspot[]>([])
  const [routes, setRoutes] = useState<AgencyRoute[]>([])
  const [reviews, setReviews] = useState<Record<string, GeographicReview>>({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [available, setAvailable] = useState(true)
  const [agencyUnavailable, setAgencyUnavailable] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      const [communesResult, hotspotsResult, routesResult, reviewsResult] = await Promise.allSettled([
        agencyApi.geographic.communes(),
        agencyApi.geographic.pointsChauds(),
        agencyApi.geographic.trajets(),
        geographicReviewsApi.list(),
      ])
      if (!active) return

      setCommunes(communesResult.status === 'fulfilled' ? communesResult.value : [])
      setHotspots(hotspotsResult.status === 'fulfilled' ? hotspotsResult.value : [])
      setRoutes(routesResult.status === 'fulfilled' ? routesResult.value : [])
      setAvailable([communesResult, hotspotsResult, routesResult].some((result) => result.status === 'fulfilled'))
      setAgencyUnavailable([communesResult, hotspotsResult, routesResult].every((result) => result.status === 'rejected'))
      if (reviewsResult.status === 'fulfilled') {
        setReviews(Object.fromEntries(reviewsResult.value.map((review) => [reviewKey(review.entityType, review.externalId), review])))
      }
      setLoading(false)
    }

    load()
    return () => { active = false }
  }, [])

  const query = search.trim().toLocaleLowerCase('fr')
  const filteredCommunes = useMemo(() => communes.filter((commune) =>
    [commune.name, commune.description].some((value) => value?.toLocaleLowerCase('fr').includes(query))), [communes, query])
  const filteredHotspots = useMemo(() => hotspots.filter((hotspot) =>
    [hotspot.name, hotspot.district, hotspot.transportType].some((value) => value?.toLocaleLowerCase('fr').includes(query))), [hotspots, query])
  const filteredRoutes = useMemo(() => routes.filter((routeItem) =>
    [routeItem.name, routeItem.transportMode].some((value) => value?.toLocaleLowerCase('fr').includes(query))), [routes, query])
  const canReview = can(user, 'inventory.manage')

  function reviewFor(entityType: GeographicEntityType, externalId: string) {
    return reviews[reviewKey(entityType, externalId)]
  }

  function onSaved(review: GeographicReview) {
    setReviews((current) => ({ ...current, [reviewKey(review.entityType, review.externalId)]: review }))
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Contrôle OOH" title="Territoires & mobilité" description="Consultez les communes, les zones de forte fréquentation et les trajets utiles au contrôle de la couverture publicitaire." />

      <section className="grid gap-3 sm:grid-cols-3">
        <GeoMetric icon={Map} label="Communes" value={communes.length} />
        <GeoMetric icon={MapPin} label="Points chauds" value={hotspots.length} />
        <GeoMetric icon={Route} label="Trajets" value={routes.length} />
      </section>

      {!available && !loading && <EmptyState title={agencyUnavailable ? 'Connexion Agency indisponible' : 'Donnees temporairement indisponibles'} description={agencyUnavailable ? 'Les donnees geographiques apparaitront ici apres validation de la connexion Agency.' : 'Les informations territoriales apparaitront ici des que les espaces connectes seront disponibles.'} />}

      <Card className="border-border bg-white">
        <CardContent className="p-4 sm:p-5">
          <div className="flex max-w-xl items-center gap-2 rounded-xl border border-border bg-muted/20 px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un territoire, un quartier ou un trajet..." className="border-0 bg-transparent px-0 focus-visible:ring-0" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="communes" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-3 sm:w-[520px]">
          <TabsTrigger value="communes" className="gap-2 py-2.5"><Map className="h-4 w-4" /> Communes</TabsTrigger>
          <TabsTrigger value="hotspots" className="gap-2 py-2.5"><MapPin className="h-4 w-4" /> Points chauds</TabsTrigger>
          <TabsTrigger value="routes" className="gap-2 py-2.5"><Route className="h-4 w-4" /> Trajets</TabsTrigger>
        </TabsList>

        <TabsContent value="communes">
          <GeoList loading={loading} empty={filteredCommunes.length === 0}>
            {filteredCommunes.map((commune) => (
              <article key={commune.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{commune.name}</h3><ReviewBadge review={reviewFor('commune', commune.id)} /></div>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{commune.description || 'Description non renseignée.'}</p>
                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold"><UsersRound className="h-4 w-4 text-primary" /> Population : {formatNumber(commune.population)}</div>
                  </div>
                  {canReview && <ReviewButton onClick={() => setReviewTarget({ entityType: 'commune', externalId: commune.id, label: commune.name })} />}
                </div>
              </article>
            ))}
          </GeoList>
        </TabsContent>

        <TabsContent value="hotspots">
          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <GeoList loading={loading} empty={filteredHotspots.length === 0}>
              {filteredHotspots.map((hotspot) => (
                <article key={hotspot.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{hotspot.name}</h3><ReviewBadge review={reviewFor('point_chaud', hotspot.id)} /></div>
                      <p className="mt-2 text-sm text-muted-foreground">{hotspot.district || 'Quartier non renseigné'} · {hotspot.transportType || 'Transport non renseigné'}</p>
                      <p className="mt-3 text-sm font-semibold">Fréquentation : {formatNumber(hotspot.attendance)}</p>
                    </div>
                    {canReview && <ReviewButton onClick={() => setReviewTarget({ entityType: 'point_chaud', externalId: hotspot.id, label: hotspot.name })} />}
                  </div>
                </article>
              ))}
            </GeoList>
            <GeographyMap hotspots={filteredHotspots} />
          </div>
        </TabsContent>

        <TabsContent value="routes">
          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <GeoList loading={loading} empty={filteredRoutes.length === 0}>
              {filteredRoutes.map((routeItem) => (
                <article key={routeItem.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{routeItem.name}</h3><ReviewBadge review={reviewFor('trajet', routeItem.id)} /></div>
                      <p className="mt-2 text-sm text-muted-foreground">{routeItem.transportMode || 'Mode non renseigné'}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-muted px-2.5 py-1">{routeItem.distanceKm ?? '—'} km</span><span className="rounded-full bg-muted px-2.5 py-1">{routeItem.durationMinutes ?? '—'} min</span></div>
                    </div>
                    {canReview && <ReviewButton onClick={() => setReviewTarget({ entityType: 'trajet', externalId: routeItem.id, label: routeItem.name })} />}
                  </div>
                </article>
              ))}
            </GeoList>
            <GeographyMap routes={filteredRoutes} />
          </div>
        </TabsContent>
      </Tabs>

      {reviewTarget && <GeographicReviewDialog open {...reviewTarget} review={reviewFor(reviewTarget.entityType, reviewTarget.externalId)} onOpenChange={(open) => { if (!open) setReviewTarget(null) }} onSaved={onSaved} />}
    </div>
  )
}

function GeoMetric({ icon: Icon, label, value }: { icon: ElementType; label: string; value: number }) {
  return <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><div><span className="block text-2xl font-black">{value}</span><span className="text-xs font-bold uppercase text-muted-foreground">{label}</span></div></div>
}

function ReviewBadge({ review }: { review?: GeographicReview }) {
  return review?.status === 'verified' ? <StatusBadge tone="dark"><CheckCircle2 className="mr-1 h-3 w-3" /> Vérifié</StatusBadge> : <StatusBadge tone="red">À vérifier</StatusBadge>
}

function ReviewButton({ onClick }: { onClick: () => void }) {
  return <Button type="button" variant="outline" size="sm" onClick={onClick} className="gap-2"><ClipboardCheck className="h-4 w-4" /> Contrôler</Button>
}

function GeoList({ loading, empty, children }: { loading: boolean; empty: boolean; children: ReactNode }) {
  if (loading) return <div className="rounded-2xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Chargement des territoires...</div>
  if (empty) return <EmptyState title="Aucun résultat" description="Aucune donnée ne correspond à votre recherche." />
  return <div className="space-y-3">{children}</div>
}
