"use client"

import { useEffect, useState, useMemo } from "react"
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps"
import {
  Building2,
  Compass,
  MapPin,
  Navigation2,
  Sparkles,
} from "lucide-react"
import { decodePolyline } from "@/lib/google-maps/decode-polyline"
import type { GeoPoint, RankedFacility } from "@/lib/routing/domain/types"

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

// Helper sub-component to draw polyline on the google map using the native google.maps.Polyline
function MapRouteRenderer({
  routePoints,
}: {
  routePoints: GeoPoint[]
}) {
  const map = useMap()

  useEffect(() => {
    if (
      !map ||
      typeof window === "undefined" ||
      typeof google === "undefined" ||
      !google.maps ||
      routePoints.length === 0
    ) {
      return
    }

    const polyline = new google.maps.Polyline({
      path: routePoints,
      geodesic: true,
      strokeColor: "#059669", // Emerald 600
      strokeOpacity: 0.9,
      strokeWeight: 5,
    })

    polyline.setMap(map)

    // Adjust bounds to fit route
    const bounds = new google.maps.LatLngBounds()
    routePoints.forEach((p) => bounds.extend(p))
    map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 })

    return () => {
      polyline.setMap(null)
    }
  }, [map, routePoints])

  return null
}

export function HospitalMap({
  origin,
  hospitals,
  selectedHospitalId,
  onSelectHospital,
}: {
  origin: GeoPoint | null
  hospitals: RankedFacility[]
  selectedHospitalId?: string | null
  onSelectHospital?: (hospital: RankedFacility) => void
}) {
  const [activeInfoWindow, setActiveInfoWindow] = useState<string | null>(null)
  const [encodedPolyline, setEncodedPolyline] = useState<string | null>(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)

  // Default center Albay / Bicol
  const defaultCenter = useMemo(
    () => origin || { lat: 13.1579, lng: 123.6986 },
    [origin]
  )

  const selectedHospital = useMemo(
    () => hospitals.find((h) => h.facility.id === selectedHospitalId) || hospitals[0] || null,
    [hospitals, selectedHospitalId]
  )

  // When selected hospital changes and origin exists, fetch route polyline
  useEffect(() => {
    if (!origin || !selectedHospital || !selectedHospital.facility.location) {
      setEncodedPolyline(null)
      return
    }

    let isMounted = true
    setIsLoadingRoute(true)

    fetch("/api/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin,
        facilityId: selectedHospital.facility.id,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.encodedPolyline) {
          setEncodedPolyline(data.encodedPolyline)
        }
      })
      .catch((err) => {
        console.warn("[HospitalMap] Route polyline request failed:", err)
      })
      .finally(() => {
        if (isMounted) setIsLoadingRoute(false)
      })

    return () => {
      isMounted = false
    }
  }, [origin, selectedHospital])

  const routePoints = useMemo(() => {
    if (!encodedPolyline) return []
    return decodePolyline(encodedPolyline)
  }, [encodedPolyline])

  // If no Google Maps key is present in environment, render clean visual fallback map
  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className="relative h-[480px] w-full rounded-xl border border-border bg-slate-100 overflow-hidden flex flex-col items-center justify-center p-6 text-center shadow-inner">
        <div className="max-w-md space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Compass className="h-6 w-6 animate-pulse" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Interactive Map View</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Google Maps API key is waiting to be configured in <code className="bg-white px-1.5 py-0.5 rounded border text-emerald-800">.env.local</code>.
            All driving recommendations, ETA calculations, and capability matching are fully operational!
          </p>
          {selectedHospital && (
            <div className="rounded-lg bg-white p-3 text-left border shadow-sm space-y-1 text-xs">
              <p className="font-bold text-emerald-800 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Selected: {selectedHospital.facility.name}
              </p>
              <p className="text-muted-foreground">
                ETA: {selectedHospital.travel.durationSeconds ? `${Math.round(selectedHospital.travel.durationSeconds / 60)} min` : "N/A"} •{" "}
                {selectedHospital.facility.municipality}, {selectedHospital.facility.province}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-[480px] w-full rounded-xl border border-border overflow-hidden shadow-sm">
      <APIProvider apiKey={GOOGLE_MAPS_KEY}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={12}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="h-full w-full"
        >
          {/* Patient Origin Marker */}
          {origin && (
            <Marker
              position={origin}
              title="Patient Location"
              icon={{
                path: "M 0, 0 m -6, 0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0",
                scale: 1.5,
                fillColor: "#2563EB", // Blue
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 2,
              }}
            />
          )}

          {/* Hospital Markers */}
          {hospitals.map((h, index) => {
            if (!h.facility.location) return null
            const isRec = index === 0 && h.verdict === "CONFIRMED"
            const isSelected = h.facility.id === selectedHospitalId

            const markerColor =
              h.verdict === "EXCLUDED"
                ? "#94A3B8" // Slate
                : isRec
                ? "#059669" // Emerald
                : isSelected
                ? "#2563EB" // Blue
                : "#0D9488" // Teal

            return (
              <Marker
                key={h.facility.id}
                position={h.facility.location}
                title={h.facility.name}
                onClick={() => {
                  setActiveInfoWindow(h.facility.id)
                  if (onSelectHospital) onSelectHospital(h)
                }}
                icon={{
                  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                  scale: isRec || isSelected ? 1.8 : 1.4,
                  fillColor: markerColor,
                  fillOpacity: 1,
                  strokeColor: "#FFFFFF",
                  strokeWeight: 1.5,
                }}
              />
            )
          })}

          {/* Active InfoWindow */}
          {activeInfoWindow && (
            (() => {
              const h = hospitals.find((item) => item.facility.id === activeInfoWindow)
              if (!h || !h.facility.location) return null

              const mins = h.travel.durationSeconds
                ? Math.round(h.travel.durationSeconds / 60)
                : null

              return (
                <InfoWindow
                  position={h.facility.location}
                  onCloseClick={() => setActiveInfoWindow(null)}
                >
                  <div className="p-1 space-y-1 text-xs max-w-xs">
                    <h4 className="font-bold text-slate-900">{h.facility.name}</h4>
                    <p className="text-[11px] text-slate-600">
                      {h.facility.tier} • {mins !== null ? `${mins} min driving` : "ETA N/A"}
                    </p>
                    <p className="text-[10px] font-semibold text-emerald-700">
                      Status: {h.verdict}
                    </p>
                  </div>
                </InfoWindow>
              )
            })()
          )}

          {/* Polyline Route Overlay */}
          {routePoints.length > 0 && <MapRouteRenderer routePoints={routePoints} />}
        </Map>
      </APIProvider>

      {/* Floating loading badge */}
      {isLoadingRoute && (
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border rounded-md px-2.5 py-1 text-xs font-medium text-emerald-800 shadow-sm flex items-center gap-1.5">
          <Navigation2 className="h-3 w-3 animate-spin text-emerald-600" />
          <span>Calculating live route...</span>
        </div>
      )}
    </div>
  )
}
