"use client"

import { useState } from "react"
import { Sparkles, ShieldAlert, ChevronDown, ChevronUp, Stethoscope, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CASE_CATEGORIES, getCaseCategoryDefinition } from "@/lib/routing/config/case-categories"
import type { GeoPoint, Urgency } from "@/lib/routing/domain/types"
import { EmergencyBanner } from "./emergency-banner"
import { LocationPicker } from "./location-picker"

const EXTRA_RESOURCE_OPTIONS = [
  { code: "ICU_BED", label: "ICU Bed Required" },
  { code: "BLOOD_BANK", label: "Blood Bank / Transfusion Ready" },
  { code: "MECHANICAL_VENTILATOR", label: "Mechanical Ventilator" },
  { code: "CT_SCAN", label: "CT Scan" },
  { code: "OPERATING_ROOM", label: "Immediate Operating Room" },
  { code: "AMBULANCE", label: "Ambulance Transfer Support" },
]

export function PatientAssessmentForm({
  onSubmit,
  isLoading = false,
}: {
  onSubmit: (params: {
    origin: GeoPoint
    caseCategory: string
    urgency: Urgency
    extraRequiredResources: string[]
  }) => void
  isLoading?: boolean
}) {
  const [origin, setOrigin] = useState<GeoPoint | null>({
    lat: 13.1579,
    lng: 123.6986, // Default to BHS Daraga area
  })
  const [caseCategory, setCaseCategory] = useState<string>("TRAUMA")
  const [urgency, setUrgency] = useState<Urgency>("EMERGENCY")
  const [extraResources, setExtraResources] = useState<string[]>([])
  const [showOptional, setShowOptional] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const activeCategoryDef = getCaseCategoryDefinition(caseCategory)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!origin) {
      setValidationError("Please select or detect patient origin location.")
      return
    }
    setValidationError(null)

    onSubmit({
      origin,
      caseCategory,
      urgency,
      extraRequiredResources: extraResources,
    })
  }

  const toggleExtraResource = (code: string) => {
    setExtraResources((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 1. Location selection */}
      <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
        <LocationPicker value={origin} onChange={setOrigin} />
      </div>

      {/* 2. Medical Condition / Case category */}
      <div className="rounded-lg border border-border bg-white p-4 shadow-sm space-y-3">
        <div>
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5 text-emerald-600" />
            Medical Condition / Clinical Presentation <span className="text-red-500">*</span>
          </label>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Select the primary reason for routing or referral
          </p>
        </div>

        <select
          value={caseCategory}
          onChange={(e) => {
            const newCat = e.target.value
            setCaseCategory(newCat)
            const def = getCaseCategoryDefinition(newCat)
            if (def?.isEmergencyCategory) {
              setUrgency("EMERGENCY")
            }
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {CASE_CATEGORIES.map((cat) => (
            <option key={cat.code} value={cat.code}>
              {cat.label} {cat.isEmergencyCategory ? "🚨" : ""}
            </option>
          ))}
        </select>

        {activeCategoryDef && (
          <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
            {activeCategoryDef.description}
          </p>
        )}

        {/* Red flags warning */}
        {activeCategoryDef && activeCategoryDef.redFlagSymptoms.length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50/70 p-2.5 text-xs text-red-900 space-y-1">
            <p className="font-semibold flex items-center gap-1 text-red-800">
              <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
              Red-Flag Signs to watch for:
            </p>
            <ul className="list-disc pl-4 text-[11px] text-red-700 space-y-0.5">
              {activeCategoryDef.redFlagSymptoms.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 3. Urgency Selection */}
      <div className="rounded-lg border border-border bg-white p-4 shadow-sm space-y-2">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-emerald-600" />
          Urgency Level <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { level: "EMERGENCY", label: "Emergency", desc: "Immediate life threat", color: "border-red-500 text-red-700 bg-red-50" },
              { level: "URGENT", label: "Urgent", desc: "Within hours", color: "border-amber-500 text-amber-700 bg-amber-50" },
              { level: "ROUTINE", label: "Routine", desc: "Scheduled / elective", color: "border-emerald-500 text-emerald-700 bg-emerald-50" },
            ] as const
          ).map((item) => (
            <button
              key={item.level}
              type="button"
              onClick={() => setUrgency(item.level)}
              className={`rounded-md border-2 p-2.5 text-left transition-all ${
                urgency === item.level
                  ? `${item.color} font-bold shadow-sm`
                  : "border-border bg-white text-muted-foreground hover:bg-slate-50"
              }`}
            >
              <p className="text-xs">{item.label}</p>
              <p className="text-[10px] opacity-80">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Prominent Emergency banner when EMERGENCY is active */}
      {urgency === "EMERGENCY" && <EmergencyBanner />}

      {/* 4. Optional Collapsible: Additional Resource Needs */}
      <div className="rounded-lg border border-border bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold text-muted-foreground hover:bg-slate-50"
        >
          <span>Specific Required Equipment & Resources (Optional)</span>
          {showOptional ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showOptional && (
          <div className="p-4 pt-1 border-t border-border space-y-2">
            <p className="text-[11px] text-muted-foreground">
              Select specific critical resources needed. Only facilities with confirmed availability of these will be eligible for recommendation.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {EXTRA_RESOURCE_OPTIONS.map((res) => {
                const isSelected = extraResources.includes(res.code)
                return (
                  <label
                    key={res.code}
                    className={`flex items-center gap-2 rounded-md border p-2 text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-medium"
                        : "border-border text-muted-foreground hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleExtraResource(res.code)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{res.label}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {validationError && (
        <p className="text-xs font-medium text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {validationError}
        </p>
      )}

      {/* Submit Action */}
      <Button
        type="submit"
        disabled={isLoading || !origin}
        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md gap-2"
      >
        <Sparkles className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        {isLoading ? "Matching Suitable Facilities..." : "Find Nearest Capable Hospital"}
      </Button>
    </form>
  )
}
