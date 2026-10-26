"use client"

import { useState } from "react"
import Link from "next/link"
import { Archive, ArchiveRestore, ExternalLink, MoreHorizontal, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useServerAction } from "@/hooks/use-server-action"
import {
  setIncomingReferralArchivedAction,
  transitionIncomingReferralAction,
} from "@/lib/actions/incoming-referral-actions"
import type { ReferralStatus } from "@/lib/constants/referral-status"
import type { IncomingReferral, ReceiverCapabilities } from "@/lib/referrals/domain/types"
import { ConfirmActionDialog } from "./confirm-action-dialog"
import { EditReferralDetailsDialog } from "./edit-referral-details-dialog"
import { TRANSITION_PRESENTATION } from "./transition-presentation"

interface IncomingReferralRowActionsProps {
  referral: IncomingReferral
  capabilities: ReceiverCapabilities
}

type PendingConfirm =
  | { kind: "transition"; status: ReferralStatus }
  | { kind: "archive" }
  | { kind: "unarchive" }
  | null

/**
 * Row-level actions for one incoming referral. It only renders what the server
 * says is allowed (`capabilities`); the server re-checks every rule anyway.
 */
export function IncomingReferralRowActions({
  referral,
  capabilities,
}: IncomingReferralRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [confirm, setConfirm] = useState<PendingConfirm>(null)
  const transition = useServerAction(transitionIncomingReferralAction)
  const archive = useServerAction(setIncomingReferralArchivedAction)
  const pending = transition.pending || archive.pending

  function applyTransition(status: ReferralStatus, note: string | null = null) {
    transition.run(
      { referralId: referral.id, nextStatus: status, note },
      { onSuccess: () => setConfirm(null) }
    )
  }

  function applyArchive(archived: boolean) {
    archive.run({ referralId: referral.id, archived }, { onSuccess: () => setConfirm(null) })
  }

  const confirmTransition =
    confirm?.kind === "transition" ? TRANSITION_PRESENTATION[confirm.status] : undefined

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          id={`referral-actions-${referral.id}`}
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${referral.patientName}`}
              disabled={pending}
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem render={<Link href={`/dashboard/referrals/${referral.id}`} />}>
            <ExternalLink />
            View details
          </DropdownMenuItem>
          {capabilities.canEditDetails && (
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil />
              Edit details
            </DropdownMenuItem>
          )}

          {capabilities.transitions.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Update status</DropdownMenuLabel>
                {capabilities.transitions.map((status) => {
                  const ui = TRANSITION_PRESENTATION[status]
                  if (!ui) return null
                  const Icon = ui.icon
                  return (
                    <DropdownMenuItem
                      key={status}
                      variant={ui.destructive ? "destructive" : "default"}
                      onClick={() =>
                        ui.requiresReason
                          ? setConfirm({ kind: "transition", status })
                          : applyTransition(status)
                      }
                    >
                      <Icon />
                      {ui.label}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuGroup>
            </>
          )}

          {(capabilities.canArchive || capabilities.canUnarchive) && (
            <>
              <DropdownMenuSeparator />
              {capabilities.canArchive ? (
                <DropdownMenuItem onClick={() => setConfirm({ kind: "archive" })}>
                  <Archive />
                  Archive
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setConfirm({ kind: "unarchive" })}>
                  <ArchiveRestore />
                  Restore to inbox
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {capabilities.canEditDetails && (
        <EditReferralDetailsDialog referral={referral} open={editOpen} onOpenChange={setEditOpen} />
      )}

      {confirm?.kind === "transition" && confirmTransition && (
        <ConfirmActionDialog
          open
          onOpenChange={(open) => !open && setConfirm(null)}
          title={`${confirmTransition.label} referral?`}
          description={`${referral.patientName} from ${referral.referringFacility.name}. The referring facility will see this in the timeline.`}
          confirmLabel={confirmTransition.label}
          destructive={confirmTransition.destructive}
          pending={transition.pending}
          reason={{
            label: "Reason",
            placeholder: "e.g. No ICU beds available",
            required: confirmTransition.requiresReason,
          }}
          onConfirm={(reason) => applyTransition(confirm.status, reason)}
        />
      )}

      {(confirm?.kind === "archive" || confirm?.kind === "unarchive") && (
        <ConfirmActionDialog
          open
          onOpenChange={(open) => !open && setConfirm(null)}
          title={confirm.kind === "archive" ? "Archive referral?" : "Restore referral?"}
          description={
            confirm.kind === "archive"
              ? "It will be hidden from your inbox but kept in full, including its timeline. You can restore it from the Archived view."
              : "It will appear in your inbox again."
          }
          confirmLabel={confirm.kind === "archive" ? "Archive" : "Restore"}
          pending={archive.pending}
          onConfirm={() => applyArchive(confirm.kind === "archive")}
        />
      )}
    </>
  )
}
