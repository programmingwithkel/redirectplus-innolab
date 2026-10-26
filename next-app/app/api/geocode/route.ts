import { NextResponse, type NextRequest } from "next/server"
import { getUser } from "@/lib/auth/get-user"
import { geocodeAddress } from "@/lib/google-maps/geocoding-client"
import { GeocodeRequestSchema } from "@/lib/validation/routing-schemas"

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validation = GeocodeRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 422 }
      )
    }

    const result = await geocodeAddress(validation.data.address)
    if (!result) {
      return NextResponse.json(
        { error: "Location could not be found. Please check spelling." },
        { status: 404 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[POST /api/geocode] Error:", error)
    return NextResponse.json(
      { error: (error as Error).message || "Geocoding failed" },
      { status: 500 }
    )
  }
}
