"use client"

import { useState } from "react"
import { MapPin, Navigation, Search, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { GeoPoint } from "@/lib/routing/domain/types"

const POPULAR_BICOL_LOCATIONS: { name: string; point: GeoPoint }[] = [
  { name: "Daraga Poblacion, Albay", point: { lat: 13.1579, lng: 123.6986 } },
  { name: "Legazpi City Port / CHO, Albay", point: { lat: 13.1391, lng: 123.7438 } },
  { name: "Camalig Town Center, Albay", point: { lat: 13.135, lng: 123.6656 } },
  { name: "Tabaco City Centro, Albay", point: { lat: 13.3586, lng: 123.7353 } },
  { name: "Ligao City Centro, Albay", point: { lat: 13.2214, lng: 123.5241 } },
  { name: "Guinobatan Centro, Albay", point: { lat: 13.1897, lng: 123.5993 } },
]

export function LocationPicker({
  value,
  onChange,
  onAddressResolved,
}: {
  value: GeoPoint | null
  onChange: (point: GeoPoint) => void
  onAddressResolved?: (address: string) => void
}) {
  const [isLocating, setIsLocating] = useState(false)
  const [locationName, setLocationName] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const handleUseBrowserLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.")
      return
    }

    setIsLocating(true)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        const point: GeoPoint = {
          lat: Number(position.coords.latitude.toFixed(5)),
          lng: Number(position.coords.longitude.toFixed(5)),
        }
        onChange(point)
        const desc = `GPS Location (${point.lat}, ${point.lng})`
        setLocationName(desc)
        if (onAddressResolved) onAddressResolved(desc)
      },
      (error) => {
        setIsLocating(false)
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError("Location permission denied. Please select a preset or type an address below.")
        } else {
          setGeoError("Unable to retrieve location. Please search manually.")
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  const handleSearchAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setGeoError(null)

    try {
      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: searchQuery }),
      })

      const data = await res.json()
      if (!res.ok) {
        setGeoError(data.error || "Location could not be found.")
      } else {
        onChange(data.location)
        setLocationName(data.formattedAddress)
        if (onAddressResolved) onAddressResolved(data.formattedAddress)
        setSearchQuery("")
      }
    } catch (err) {
      setGeoError("Geocoding failed. Please select from presets.")
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
          Patient Origin Location <span className="text-red-500">*</span>
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseBrowserLocation}
          disabled={isLocating}
          className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 gap-1.5"
        >
          <Navigation className={`h-3 w-3 ${isLocating ? "animate-spin text-emerald-600" : ""}`} />
          {isLocating ? "Detecting GPS..." : "Use Current GPS"}
        </Button>
      </div>

      {/* Selected location indicator */}
      {value ? (
        <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50/60 p-2.5 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check className="h-3 w-3" />
            </span>
            <div>
              <p className="font-semibold">{locationName || "Selected Coordinate"}</p>
              <p className="text-[11px] text-emerald-700">
                {value.lat.toFixed(4)}° N, {value.lng.toFixed(4)}° E
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] text-emerald-700 hover:text-emerald-900"
            onClick={() => {
              setLocationName("")
            }}
          >
            Change
          </Button>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">
            No location set. Click &ldquo;Use Current GPS&rdquo; or pick a municipality below.
          </p>
        </div>
      )}

      {/* Error alert */}
      {geoError && (
        <div className="flex items-center gap-1.5 rounded-md bg-amber-50 p-2 text-xs text-amber-800 border border-amber-200">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Manual search input */}
      <div className="flex gap-1.5">
        <Input
          placeholder="Or type municipality or barangay (e.g., Guinobatan, Polangui)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleSearchAddress()
            }
          }}
          className="h-8 text-xs bg-white"
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => handleSearchAddress()}
          disabled={isSearching || !searchQuery.trim()}
          className="h-8 px-3 text-xs gap-1"
        >
          <Search className="h-3 w-3" />
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </div>

      {/* Quick-pick presets */}
      <div className="space-y-1">
        <p className="text-[11px] font-medium text-muted-foreground">Quick select in Albay:</p>
        <div className="flex flex-wrap gap-1">
          {POPULAR_BICOL_LOCATIONS.map((loc) => (
            <button
              key={loc.name}
              type="button"
              onClick={() => {
                onChange(loc.point)
                setLocationName(loc.name)
                if (onAddressResolved) onAddressResolved(loc.name)
              }}
              className={`rounded-full px-2.5 py-0.5 text-[11px] transition-colors border ${
                value && value.lat === loc.point.lat && value.lng === loc.point.lng
                  ? "bg-emerald-600 text-white border-emerald-600 font-medium"
                  : "bg-white text-muted-foreground border-border hover:bg-slate-50 hover:text-foreground"
              }`}
            >
              {loc.name.split(",")[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
