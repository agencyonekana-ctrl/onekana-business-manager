import { useEffect, useMemo } from 'react'
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet'
import type { AgencyHotspot, AgencyRoute } from '../../types/geography'
import { EmptyState } from '../app/EmptyState'

type GeographyMapProps = {
  hotspots?: AgencyHotspot[]
  routes?: AgencyRoute[]
}

function parseLineString(route: AgencyRoute): LatLngExpression[] {
  const raw = route.lineCoordinates?.match(/LINESTRING\s*\((.+)\)/i)?.[1]
  if (raw) {
    return raw.split(',').flatMap((pair) => {
      const [lng, lat] = pair.trim().split(/\s+/).map(Number)
      return Number.isFinite(lat) && Number.isFinite(lng) ? [[lat, lng] as LatLngExpression] : []
    })
  }

  if ([route.startLat, route.startLng, route.endLat, route.endLng].every((value) => typeof value === 'number')) {
    return [
      [route.startLat as number, route.startLng as number],
      [route.endLat as number, route.endLng as number],
    ]
  }

  return []
}

function MapViewport({ points }: { points: LatLngExpression[] }) {
  const map = useMap()

  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 14)
    if (points.length > 1) map.fitBounds(points as LatLngBoundsExpression, { padding: [28, 28], maxZoom: 14 })
  }, [map, points])

  return null
}

export function GeographyMap({ hotspots = [], routes = [] }: GeographyMapProps) {
  const routeLines = useMemo(
    () => routes.map((route) => ({ route, points: parseLineString(route) })).filter((item) => item.points.length > 1),
    [routes],
  )
  const points = useMemo<LatLngExpression[]>(() => [
    ...hotspots.flatMap((hotspot) => typeof hotspot.latitude === 'number' && typeof hotspot.longitude === 'number'
      ? [[hotspot.latitude, hotspot.longitude] as LatLngExpression]
      : []),
    ...routeLines.flatMap((line) => line.points),
  ], [hotspots, routeLines])

  if (points.length === 0) {
    return <EmptyState title="Aucune coordonnée exploitable" description="La carte apparaîtra lorsque les données reçues contiendront des coordonnées valides." />
  }

  return (
    <div className="h-[440px] overflow-hidden rounded-2xl border border-border bg-muted">
      <MapContainer center={points[0]} zoom={12} scrollWheelZoom className="h-full w-full" preferCanvas>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapViewport points={points} />
        {hotspots.map((hotspot) => typeof hotspot.latitude === 'number' && typeof hotspot.longitude === 'number' ? (
          <CircleMarker key={hotspot.id} center={[hotspot.latitude, hotspot.longitude]} radius={8} pathOptions={{ color: '#c81e24', fillColor: '#e21b23', fillOpacity: 0.8, weight: 2 }}>
            <Popup><strong>{hotspot.name}</strong><br />{hotspot.district || 'Quartier non renseigné'}</Popup>
          </CircleMarker>
        ) : null)}
        {routeLines.map(({ route, points: linePoints }) => (
          <Polyline key={route.id} positions={linePoints} pathOptions={{ color: '#171717', weight: 4, opacity: 0.8 }}>
            <Popup><strong>{route.name}</strong><br />{route.distanceKm ? `${route.distanceKm} km` : 'Distance non renseignée'}</Popup>
          </Polyline>
        ))}
      </MapContainer>
    </div>
  )
}
