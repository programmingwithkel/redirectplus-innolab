"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle,
  XCircle,
  Eye,
  Play,
  Flag,
  Shuffle,
  MessageSquare,
  Loader2,
  Ban,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  updateReferralStatusAction,
  redirectReferralAction,
  addNoteAction,
} from "@/lib/actions/referral-actions"
import type { ReferralStatus } from "@/lib/constants/referral-status"
import type { Facility } from "@/lib/types/database"

interface ReferralActionsProps {
  referralId: string
  status: ReferralStatus
  isReceiver: boolean
  isSender: boolean
  facilities: Facility[]
  currentFacilityId: string
  referringFacilityId: string
}

export function ReferralActions({
  referralId,
  status,
  isReceiver,
  isSender,
  facilities,
  currentFacilityId,
  referringFacilityId,
}: ReferralActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showRedirect, setShowRedirect] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [notes, setNotes] = useState("")
  const [redirectFacility, setRedirectFacility] = useState("")
  const [redirectReason, setRedirectReason] = useState("")

  async function handleStatusUpdate(newStatus: ReferralStatus, label: string) {
    setLoading(label)
    setError(null)
    const result = await updateReferralStatusAction(referralId, newStatus, notes || undefined)
    if (result.error) {
      setError(result.error)
    }
    setLoading(null)
    setNotes("")
    router.refresh()
  }

  async function handleRedirect() {
    if (!redirectFacility || !redirectReason) {
      setError("Select a facility and provide a reason")
      return
    }
    setLoading("redirect")
    setError(null)
    const result = await redirectReferralAction(referralId, redirectFacility, redirectReason)
    if (result.error) {
      setError(result.error)
    }
    setLoading(null)
    setShowRedirect(false)
    setRedirectFacility("")
    setRedirectReason("")
    router.refresh()
  }

  async function handleAddNote() {
    if (!notes.trim()) return
    setLoading("note")
    setError(null)
    const result = await addNoteAction(referralId, notes)
    if (result.error) {
      setError(result.error)
    }
    setLoading(null)
    setShowNote(false)
    setNotes("")
    router.refresh()
  }

  const isTerminal = ["COMPLETED", "DECLINED", "CANCELLED"].includes(status)
  const redirectableFacilities = facilities.filter(
    (f) => f.id !== currentFacilityId && f.id !== referringFacilityId && f.is_active
  )

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {!isTerminal && (
        <div className="flex flex-wrap gap-2">
          {/* Receiver actions */}
          {isReceiver && status === "PENDING" && (
            <Button
              size="sm"
              onClick={() => handleStatusUpdate("ACKNOWLEDGED", "acknowledge")}
              disabled={loading !== null}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {loading === "acknowledge" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Eye className="mr-1 h-3 w-3" />}
              Acknowledge
            </Button>
          )}

          {isReceiver && status === "ACKNOWLEDGED" && (
            <>
              <Button
                size="sm"
                onClick={() => handleStatusUpdate("ACCEPTED", "accept")}
                disabled={loading !== null}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {loading === "accept" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle className="mr-1 h-3 w-3" />}
                Accept
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleStatusUpdate("DECLINED", "decline")}
                disabled={loading !== null}
              >
                {loading === "decline" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <XCircle className="mr-1 h-3 w-3" />}
                Decline
              </Button>
            </>
          )}

          {isReceiver && status === "ACCEPTED" && (
            <Button
              size="sm"
              onClick={() => handleStatusUpdate("IN_PROGRESS", "progress")}
              disabled={loading !== null}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {loading === "progress" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Play className="mr-1 h-3 w-3" />}
              Start Treatment
            </Button>
          )}

          {isReceiver && status === "IN_PROGRESS" && (
            <Button
              size="sm"
              onClick={() => handleStatusUpdate("COMPLETED", "complete")}
              disabled={loading !== null}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {loading === "complete" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Flag className="mr-1 h-3 w-3" />}
              Complete
            </Button>
          )}

          {/* Redirect (receiver, PENDING or ACKNOWLEDGED) */}
          {isReceiver && ["PENDING", "ACKNOWLEDGED"].includes(status) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRedirect(!showRedirect)}
              disabled={loading !== null}
            >
              <Shuffle className="mr-1 h-3 w-3" />
              Redirect
            </Button>
          )}

          {/* Cancel (sender, PENDING only) */}
          {isSender && status === "PENDING" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusUpdate("CANCELLED", "cancel")}
              disabled={loading !== null}
              className="text-red-600 hover:bg-red-50"
            >
              {loading === "cancel" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Ban className="mr-1 h-3 w-3" />}
              Cancel Referral
            </Button>
          )}

          {/* Add Note (any active status, sender or receiver) */}
          {(isSender || isReceiver) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowNote(!showNote)}
              disabled={loading !== null}
            >
              <MessageSquare className="mr-1 h-3 w-3" />
              Add Note
            </Button>
          )}
        </div>
      )}

      {/* Redirect Dialog */}
      {showRedirect && (
        <div className="rounded-lg border border-border bg-gray-50 p-4 space-y-3">
          <h3 className="text-sm font-medium">Redirect Referral</h3>
          <div className="space-y-2">
            <Label className="text-xs">New Receiving Facility</Label>
            <select
              value={redirectFacility}
              onChange={(e) => setRedirectFacility(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">Select facility</option>
              {redirectableFacilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.facility_type})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Reason for Redirection</Label>
            <Textarea
              value={redirectReason}
              onChange={(e) => setRedirectReason(e.target.value)}
              placeholder="Why is this referral being redirected?"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleRedirect}
              disabled={loading !== null}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              {loading === "redirect" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Shuffle className="mr-1 h-3 w-3" />}
              Confirm Redirect
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowRedirect(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Add Note Dialog */}
      {showNote && (
        <div className="rounded-lg border border-border bg-gray-50 p-4 space-y-3">
          <h3 className="text-sm font-medium">Add Note</h3>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter your note..."
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={loading !== null}
            >
              {loading === "note" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <MessageSquare className="mr-1 h-3 w-3" />}
              Save Note
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNote(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
