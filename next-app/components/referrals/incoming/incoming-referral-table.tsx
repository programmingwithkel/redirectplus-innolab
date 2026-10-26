import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Archive, Inbox } from "lucide-react"
import { StatusBadge, UrgencyBadge } from "@/components/shared/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { IncomingReferral, InboxView, ReceiverCapabilities } from "@/lib/referrals/domain/types"
import { IncomingReferralRowActions } from "./incoming-referral-row-actions"

export interface IncomingReferralRow {
  referral: IncomingReferral
  capabilities: ReceiverCapabilities
}

interface IncomingReferralTableProps {
  rows: IncomingReferralRow[]
  view: InboxView
  hasFilters: boolean
}

/** Presentational table. Receives already-authorized data and capabilities from the page. */
export function IncomingReferralTable({ rows, view, hasFilters }: IncomingReferralTableProps) {
  if (rows.length === 0) {
    return <EmptyState view={view} hasFilters={hasFilters} />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs">Patient</TableHead>
          <TableHead className="text-xs">From</TableHead>
          <TableHead className="text-xs">Service</TableHead>
          <TableHead className="text-xs">Urgency</TableHead>
          <TableHead className="text-xs">Status</TableHead>
          <TableHead className="text-xs">Received</TableHead>
          <TableHead className="w-10 text-xs">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ referral, capabilities }) => (
          <TableRow key={referral.id} className="hover:bg-gray-50">
            <TableCell>
              <Link
                href={`/dashboard/referrals/${referral.id}`}
                className="text-sm font-medium text-foreground hover:underline"
              >
                {referral.patientName}
              </Link>
              <p className="mt-0.5 max-w-[250px] truncate text-xs text-muted-foreground">
                {referral.chiefComplaint}
              </p>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {referral.referringFacility.name}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {referral.requiredService || "—"}
            </TableCell>
            <TableCell>
              <UrgencyBadge urgency={referral.urgency} />
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap items-center gap-1">
                <StatusBadge status={referral.status} />
                {referral.archivedAt && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    <Archive className="size-3" />
                    Archived
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(referral.createdAt), { addSuffix: true })}
            </TableCell>
            <TableCell className="text-right">
              <IncomingReferralRowActions referral={referral} capabilities={capabilities} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function EmptyState({ view, hasFilters }: { view: InboxView; hasFilters: boolean }) {
  const message = hasFilters
    ? "No referrals match your filters"
    : view === "archived"
      ? "No archived referrals"
      : "No incoming referrals"

  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-sm text-muted-foreground">
      <Inbox className="size-8 text-muted-foreground/50" />
      {message}
    </div>
  )
}
