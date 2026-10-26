import "server-only"
import { createClient } from "@/lib/supabase/server"
import type {
  RecommendationAuditLog,
  RecommendationRunRecord,
} from "../application/ports"

export class SupabaseRecommendationAuditLog implements RecommendationAuditLog {
  async logRecommendationRun(record: RecommendationRunRecord): Promise<string | null> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from("recommendation_runs")
        .insert({
          requested_by: record.requestedBy,
          requester_facility_id: record.requesterFacilityId,
          case_category: record.caseCategory,
          urgency: record.urgency,
          origin_latitude: record.originLatitude,
          origin_longitude: record.originLongitude,
          requirement_snapshot: record.requirementSnapshot,
          candidates_snapshot: record.candidatesSnapshot,
          recommended_facility_id: record.recommendedFacilityId,
          outcome: record.outcome,
          travel_source: record.travelSource,
          profile_version: record.profileVersion,
        })
        .select("id")
        .single()

      if (error) {
        console.warn("[RecommendationAuditLog] Failed to record run:", error.message)
        return null
      }

      return data?.id || null
    } catch (err) {
      console.warn("[RecommendationAuditLog] Exception recording run:", (err as Error).message)
      return null
    }
  }
}
