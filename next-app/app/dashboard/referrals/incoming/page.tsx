import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth/get-user"
import { PageHeader } from "@/components/shared/page-header"
import { IncomingReferralFiltersBar } from "@/components/referrals/incoming/incoming-referral-filters"
import { IncomingReferralPagination } from "@/components/referrals/incoming/incoming-referral-pagination"
import { IncomingReferralTable } from "@/components/referrals/incoming/incoming-referral-table"
import { createIncomingReferralServices } from "@/lib/referrals"
import { getReceiverCapabilities } from "@/lib/referrals/domain/incoming-referral-policy"
import {
  INCOMING_REFERRALS_PAGE_SIZE,
  IncomingReferralFiltersSchema,
} from "@/lib/validation/incoming-referral-schemas"

interface IncomingReferralsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function IncomingReferralsPage({
  searchParams,
}: IncomingReferralsPageProps) {
  const user = await getUser()
  if (!user || !user.facility_id) {
    redirect("/login")
  }

  const rawParams = await searchParams
  const filters = IncomingReferralFiltersSchema.parse(rawParams)

  const actor = {
    userId: user.id,
    facilityId: user.facility_id,
  }

  const services = createIncomingReferralServices()
  const pageResult = await services.list.execute(actor, {
    search: filters.q,
    status: filters.status,
    urgency: filters.urgency,
    view: filters.view,
    page: filters.page,
    pageSize: INCOMING_REFERRALS_PAGE_SIZE,
  })

  const rows = pageResult.items.map((referral) => ({
    referral,
    capabilities: getReceiverCapabilities(referral),
  }))

  const hasFilters = Boolean(filters.q || filters.status || filters.urgency)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Incoming Referrals"
        description="Review, triage, update, and manage referrals directed to your facility"
      />

      <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
        <IncomingReferralFiltersBar filters={filters} />
        <IncomingReferralTable rows={rows} view={filters.view} hasFilters={hasFilters} />
        {pageResult.totalPages > 1 && (
          <IncomingReferralPagination
            filters={filters}
            page={pageResult.page}
            pageSize={pageResult.pageSize}
            total={pageResult.total}
            totalPages={pageResult.totalPages}
          />
        )}
      </div>
    </div>
  )
}
