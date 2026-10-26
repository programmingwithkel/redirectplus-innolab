import { NextResponse, type NextRequest } from "next/server"
import { getUser } from "@/lib/auth/get-user"
import { createRoutingServices } from "@/lib/routing"
import { RouteRequestSchema } from "@/lib/validation/routing-schemas"

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validation = RouteRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 422 }
      )
    }

    const { facilityRepo, routeProvider } = createRoutingServices()
    const facility = await facilityRepo.getFacilitySnapshot(validation.data.facilityId)

    if (!facility || !facility.location) {
      return NextResponse.json(
        { error: "Facility location not found" },
        { status: 404 }
      )
    }

    const route = await routeProvider.getDrivingRoute(
      validation.data.origin,
      facility.location
    )

    if (!route) {
      return NextResponse.json(
        { error: "Driving route could not be calculated" },
        { status: 503 }
      )
    }

    return NextResponse.json(route, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error("[POST /api/routes] Error:", error)
    return NextResponse.json(
      { error: (error as Error).message || "Route calculation failed" },
      { status: 500 }
    )
  }
}
