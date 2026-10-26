import { NextResponse, type NextRequest } from "next/server"
import { getUser } from "@/lib/auth/get-user"
import { createRoutingServices } from "@/lib/routing"
import { RecommendRequestSchema } from "@/lib/validation/routing-schemas"

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validation = RecommendRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 422 }
      )
    }

    const { recommendUseCase } = createRoutingServices()

    const result = await recommendUseCase.execute({
      ...validation.data,
      userId: user.id,
      userFacilityId: user.facility_id,
    })

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error("[POST /api/referrals/recommend] Error:", error)
    return NextResponse.json(
      { error: (error as Error).message || "Recommendation calculation failed" },
      { status: 500 }
    )
  }
}
