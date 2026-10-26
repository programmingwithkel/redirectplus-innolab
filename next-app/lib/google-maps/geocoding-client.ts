import "server-only"
import type { GeoPoint } from "../routing/domain/types"

function getApiKey(): string | null {
  return (
    process.env.GOOGLE_MAPS_SERVER_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    null
  )
}

export interface GeocodeResult {
  formattedAddress: string
  location: GeoPoint
}

export async function geocodeAddress(addressText: string): Promise<GeocodeResult | null> {
  const apiKey = getApiKey()
  if (!apiKey || !addressText.trim()) return null

  // Restrict region bias to Philippines (Bicol Region: Albay, Camarines, Sorsogon, Catanduanes, Masbate)
  const query = encodeURIComponent(`${addressText.trim()}, Bicol, Philippines`)
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&region=ph&key=${apiKey}`

  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== "OK" || !data.results?.[0]) return null

    const result = data.results[0]
    return {
      formattedAddress: result.formatted_address,
      location: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      },
    }
  } catch (err) {
    console.warn("[Geocoding] Request failed:", (err as Error).message)
    return null
  }
}
