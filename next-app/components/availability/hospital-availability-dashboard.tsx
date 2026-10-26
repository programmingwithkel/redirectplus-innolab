"use client"

import { useState } from "react"
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  reconfirmAllFacilityResourcesAction,
  updateAcceptanceStatusAction,
  updateOperatingStatusAction,
} from "@/lib/actions/availability-actions"
import { CASE_CATEGORIES } from "@/lib/routing/config/case-categories"
import type {
  AcceptanceReasonCode,
  AcceptanceStatus,
  OperatingStatus,
} from "@/lib/types/database"

export function HospitalAvailabilityDashboard({
  facility,
  acceptanceList,
}: {
  facility: any
  acceptanceList: any[]
}) {
  const [operatingStatus, setOperatingStatus] = useState<OperatingStatus>(
    facility?.operating_status || "OPERATIONAL"
  )
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isReconfirmingAll, setIsReconfirmingAll] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Acceptance status state
  const [selectedCategory, setSelectedCategory] = useState<string>("TRAUMA")
  const [acceptanceStatus, setAcceptanceStatus] = useState<AcceptanceStatus>("ACCEPTING")
  const [reasonCode, setReasonCode] = useState<AcceptanceReasonCode | "">("")
  const [validHours, setValidHours] = useState<number>(4)
  const [isUpdatingAcceptance, setIsUpdatingAcceptance] = useState(false)

  const handleOperatingStatusChange = async (newStatus: OperatingStatus) => {
    setIsUpdatingStatus(true)
    setStatusMessage(null)
    setOperatingStatus(newStatus)

    const res = await updateOperatingStatusAction(newStatus)
    setIsUpdatingStatus(false)
    if (res.error) {
      setStatusMessage(`Error: ${res.error}`)
    } else {
      setStatusMessage("Operating status successfully updated & timestamp refreshed.")
      setTimeout(() => setStatusMessage(null), 4000)
    }
  }

  const handleReconfirmAll = async () => {
    setIsReconfirmingAll(true)
    setStatusMessage(null)

    const res = await reconfirmAllFacilityResourcesAction()
    setIsReconfirmingAll(false)
    if (res.error) {
      setStatusMessage(`Error: ${res.error}`)
    } else {
      setStatusMessage("All facility resources and service timestamps re-confirmed for current shift.")
      setTimeout(() => setStatusMessage(null), 4000)
    }
  }

  const handleAcceptanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingAcceptance(true)
    setStatusMessage(null)

    const res = await updateAcceptanceStatusAction({
      caseCategory: selectedCategory,
      acceptanceStatus,
      reasonCode: (reasonCode as AcceptanceReasonCode) || null,
      validHours,
    })

    setIsUpdatingAcceptance(false)
    if (res.error) {
      setStatusMessage(`Error: ${res.error}`)
    } else {
      setStatusMessage(`Acceptance status for ${selectedCategory} updated (valid for ${validHours}h).`)
      setTimeout(() => setStatusMessage(null), 4000)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" />
            Live Hospital Availability &amp; Acceptance Control
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Keep your facility&rsquo;s live operational readiness current to receive suitable routing recommendations.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleReconfirmAll}
          disabled={isReconfirmingAll}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-8 font-semibold shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isReconfirmingAll ? "animate-spin" : ""}`} />
          {isReconfirmingAll ? "Attesting..." : "Re-Confirm Shift Freshness"}
        </Button>
      </div>

      {statusMessage && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-900 font-medium flex items-center gap-1.5 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Grid: 1. Operating Status, 2. Case Acceptance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Operating Status */}
        <div className="rounded-lg border border-border bg-slate-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              Facility Operating Status
            </h3>
            <span className="text-[10px] text-muted-foreground">
              Last updated: {facility?.operating_status_updated_at ? new Date(facility.operating_status_updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { status: "OPERATIONAL", label: "Operational", color: "border-emerald-500 bg-emerald-50 text-emerald-800" },
                { status: "LIMITED_OPERATIONS", label: "Limited", color: "border-amber-500 bg-amber-50 text-amber-800" },
                { status: "CLOSED", label: "Closed / Divert", color: "border-red-500 bg-red-50 text-red-800" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.status}
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleOperatingStatusChange(opt.status)}
                className={`rounded-md border-2 p-2.5 text-center text-xs font-bold transition-all ${
                  operatingStatus === opt.status
                    ? `${opt.color} shadow-sm`
                    : "border-border bg-white text-muted-foreground hover:bg-slate-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Selecting an operational status immediately updates routing eligibility and alerts incoming ambulances.
          </p>
        </div>

        {/* Panel 2: Case Acceptance & Diversion */}
        <form onSubmit={handleAcceptanceSubmit} className="rounded-lg border border-border bg-slate-50/50 p-4 space-y-3">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Patient Acceptance per Medical Condition
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-700">Case Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-white px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-emerald-500"
              >
                {CASE_CATEGORIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700">Acceptance Status</label>
              <select
                value={acceptanceStatus}
                onChange={(e) => setAcceptanceStatus(e.target.value as AcceptanceStatus)}
                className="w-full rounded-md border border-input bg-white px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ACCEPTING">Accepting (Confirmed)</option>
                <option value="ACCEPTING_WITH_CONDITIONS">Accepting w/ Conditions</option>
                <option value="NOT_ACCEPTING">Not Accepting / Divert</option>
              </select>
            </div>
          </div>

          {acceptanceStatus === "NOT_ACCEPTING" && (
            <div>
              <label className="text-[11px] font-semibold text-red-800">Reason for Non-Acceptance</label>
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value as AcceptanceReasonCode)}
                className="w-full rounded-md border border-red-300 bg-red-50/50 px-2.5 py-1.5 text-xs text-red-900"
              >
                <option value="">Select clinical reason...</option>
                <option value="ED_DIVERSION">ED Diversion / Overcrowded</option>
                <option value="NO_BEDS">No Available Beds</option>
                <option value="NO_SPECIALIST">Specialist Unavailable / On Leave</option>
                <option value="EQUIPMENT_UNAVAILABLE">Critical Equipment Down</option>
                <option value="STAFF_SHORTAGE">Staff Shortage</option>
                <option value="OTHER">Other Operational Constraint</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Valid for:</span>
              <select
                value={validHours}
                onChange={(e) => setValidHours(parseInt(e.target.value, 10))}
                className="rounded border border-input bg-white px-1.5 py-0.5 text-xs font-semibold"
              >
                <option value={2}>2 hours</option>
                <option value={4}>4 hours (shift)</option>
                <option value={8}>8 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
              </select>
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={isUpdatingAcceptance}
              className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold"
            >
              {isUpdatingAcceptance ? "Saving..." : "Update Acceptance"}
            </Button>
          </div>
        </form>
      </div>

      {/* Active Acceptance Registry Overview */}
      {acceptanceList.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Current Case Acceptance Registry ({acceptanceList.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {acceptanceList.map((item: any) => {
              const isAccepting = item.acceptance_status === "ACCEPTING" || item.acceptance_status === "ACCEPTING_WITH_CONDITIONS"
              const isExpired = new Date(item.expires_at).getTime() <= Date.now()

              return (
                <div
                  key={item.case_category}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs ${
                    isExpired
                      ? "bg-slate-50 border-slate-300 text-slate-500 line-through"
                      : isAccepting
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-medium"
                      : "bg-red-50 border-red-300 text-red-800 font-medium"
                  }`}
                >
                  {isAccepting ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )}
                  <span>{item.case_category.replace(/_/g, " ")}:</span>
                  <span className="font-bold">{item.acceptance_status}</span>
                  {item.reason_code && (
                    <span className="text-[10px] opacity-80">({item.reason_code})</span>
                  )}
                  {isExpired && <span className="text-[10px] text-amber-700 italic">(expired)</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
