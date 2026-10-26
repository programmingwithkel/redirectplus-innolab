import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { RequirementProfileRepository } from "../application/ports"
import { CASE_CATEGORIES } from "../config/case-categories"
import type { CareRequirementProfile } from "../domain/types"

export class SupabaseRequirementProfileRepository
  implements RequirementProfileRepository
{
  async getProfile(caseCategory: string): Promise<CareRequirementProfile | null> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from("care_requirement_profiles")
        .select("*")
        .eq("case_category", caseCategory)
        .eq("is_active", true)
        .single()

      if (data && !error) {
        return {
          caseCategory: data.case_category,
          label: data.label,
          requiredServices: data.required_services || [],
          mandatoryResources: data.mandatory_resources || [],
          requiresHospitalEmergency: Boolean(data.requires_hospital_emergency),
          isEmergencyCategory: Boolean(data.is_emergency_category),
          version: data.version || 1,
          isClinicallyReviewed: Boolean(data.is_clinically_reviewed),
        }
      }
    } catch {
      // Fall through to static configuration fallback
    }

    // Static fallback
    const staticDef = CASE_CATEGORIES.find((c) => c.code === caseCategory)
    if (!staticDef) return null

    return {
      caseCategory: staticDef.code,
      label: staticDef.label,
      requiredServices: staticDef.commonServices,
      mandatoryResources:
        staticDef.code === "TRAUMA"
          ? ["ED_OPERATIONAL", "TRAUMA_TEAM", "OPERATING_ROOM", "BLOOD_BANK"]
          : staticDef.code === "OBSTETRIC_EMERGENCY"
          ? ["ED_OPERATIONAL", "OBSTETRICIAN_ON_DUTY", "DELIVERY_ROOM"]
          : staticDef.code === "RESPIRATORY_DISTRESS"
          ? ["ED_OPERATIONAL", "OXYGEN_SUPPLY", "MECHANICAL_VENTILATOR"]
          : staticDef.code === "SUSPECTED_STROKE"
          ? ["ED_OPERATIONAL", "CT_SCAN", "NEUROLOGIST_ON_CALL"]
          : staticDef.code === "CARDIAC_EMERGENCY"
          ? ["ED_OPERATIONAL", "ECG_MACHINE", "CARDIOLOGIST_ON_CALL"]
          : staticDef.code === "INTENSIVE_CARE"
          ? ["ICU_BED"]
          : staticDef.requiresHospitalEmergency
          ? ["ED_OPERATIONAL"]
          : [],
      requiresHospitalEmergency: staticDef.requiresHospitalEmergency,
      isEmergencyCategory: staticDef.isEmergencyCategory,
      version: 1,
      isClinicallyReviewed: false, // Static DRAFT
    }
  }
}
