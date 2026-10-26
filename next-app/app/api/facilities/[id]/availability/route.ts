import { NextResponse, type NextRequest } from "next/server"
import { getUser } from "@/lib/auth/get-user"
import { createRoutingServices } from "@/lib/routing"
import type { Urgency } from "@/lib/routing/domain/types"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const { searchParams } = new URL(req.url)
    const caseCategory = searchParams.get("caseCategory") || "EMERGENCY_GENERAL"
    const urgency = (searchParams.get("urgency") as Urgency) || "EMERGENCY"

    const { verifyUseCase } = createRoutingServices()

    const result = await verifyUseCase.execute({
      facilityId: id,
      caseCategory,
      urgency,
    })

    if (!result.evaluation) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 })
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error("[GET /api/facilities/[id]/availability] Error:", error)
    return NextResponse.json(
      { error: (error as Error).message || "Verification failed" },
      { status: 500 }
    )
  }
}
