"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Loader2,
  Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createReferralAction } from "@/lib/actions/referral-actions"
import type { Facility } from "@/lib/types/database"

interface ReferralFormProps {
  facilities: Facility[]
  currentFacilityId: string
  currentFacilityName: string
  preselectedFacilityId?: string
  recommendationRunId?: string
  initialUrgency?: string
  initialService?: string
}

export function ReferralForm({
  facilities,
  currentFacilityId,
  currentFacilityName,
  preselectedFacilityId,
  recommendationRunId,
  initialUrgency,
  initialService,
}: ReferralFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedReceivingId, setSelectedReceivingId] = useState<string>(
    preselectedFacilityId || ""
  )

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    try {
      const result = await createReferralAction(formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }

  // Filter out current facility from receiving options
  const receivingFacilities = facilities.filter(
    (f) => f.id !== currentFacilityId && f.is_active
  )

  return (
    <form action={handleSubmit} className="space-y-6">
      {recommendationRunId && (
        <input type="hidden" name="recommendation_run_id" value={recommendationRunId} />
      )}
      {/* Patient Information */}
      <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-medium text-foreground">
          Patient Information
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="patient_name">
              Patient Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="patient_name"
              name="patient_name"
              placeholder="Full name"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patient_age">Age</Label>
            <Input
              id="patient_age"
              name="patient_age"
              type="number"
              min="0"
              max="150"
              placeholder="Age"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patient_sex">Sex</Label>
            <select
              id="patient_sex"
              name="patient_sex"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              disabled={loading}
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="patient_address">Patient Address</Label>
            <Input
              id="patient_address"
              name="patient_address"
              placeholder="Address or location"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Referral Details */}
      <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-medium text-foreground">
          Referral Details
        </h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chief_complaint">
              Chief Complaint <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="chief_complaint"
              name="chief_complaint"
              placeholder="Primary reason for referral"
              required
              disabled={loading}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Referral</Label>
            <Input
              id="reason"
              name="reason"
              placeholder="Additional reason or context"
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="required_service">Required Service / Specialty</Label>
              <Input
                id="required_service"
                name="required_service"
                defaultValue={initialService || ""}
                placeholder="e.g., Cardiology, Surgery"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="urgency">
                Urgency Level <span className="text-red-500">*</span>
              </Label>
              <select
                id="urgency"
                name="urgency"
                required
                defaultValue={initialUrgency || "ROUTINE"}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={loading}
              >
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinical_notes">Clinical Notes</Label>
            <Textarea
              id="clinical_notes"
              name="clinical_notes"
              placeholder="Relevant clinical findings, vitals, history"
              disabled={loading}
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Facility Selection */}
      <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-medium text-foreground">
          Facility Assignment
        </h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Referring Facility</Label>
            <div className="rounded-md border border-border bg-gray-50 px-3 py-2 text-sm text-muted-foreground">
              {currentFacilityName}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="receiving_facility_id">
                Receiving Facility <span className="text-red-500">*</span>
              </Label>
              {preselectedFacilityId && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ★ Selected from Smart Recommendation
                </span>
              )}
            </div>
            <select
              id="receiving_facility_id"
              name="receiving_facility_id"
              required
              value={selectedReceivingId}
              onChange={(e) => setSelectedReceivingId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              disabled={loading}
            >
              <option value="">Select receiving facility</option>
              {receivingFacilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.facility_type})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading}
          style={{ backgroundColor: "var(--facility-primary)" }}
          className="text-white hover:opacity-90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Referral
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
