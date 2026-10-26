import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import type { IncomingReferralFilters } from "@/lib/validation/incoming-referral-schemas"
import { cn } from "@/lib/utils"

interface IncomingReferralPaginationProps {
  filters: IncomingReferralFilters
  page: number
  pageSize: number
  total: number
  totalPages: number
}

/** Server-rendered, link-based pagination that preserves the active filters. */
export function IncomingReferralPagination({
  filters,
  page,
  pageSize,
  total,
  totalPages,
}: IncomingReferralPaginationProps) {
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
      <span>
        {total === 0 ? "No results" : `Showing ${first}–${last} of ${total}`}
      </span>
      <div className="flex items-center gap-1">
        <PageLink
          id="incoming-prev-page"
          href={hrefFor(filters, page - 1)}
          disabled={page <= 1}
          label="Previous page"
        >
          <ChevronLeft />
        </PageLink>
        <span className="px-2">
          Page {Math.min(page, totalPages)} of {totalPages}
        </span>
        <PageLink
          id="incoming-next-page"
          href={hrefFor(filters, page + 1)}
          disabled={page >= totalPages}
          label="Next page"
        >
          <ChevronRight />
        </PageLink>
      </div>
    </div>
  )
}

function PageLink({
  id,
  href,
  disabled,
  label,
  children,
}: {
  id: string
  href: string
  disabled: boolean
  label: string
  children: React.ReactNode
}) {
  const className = cn(buttonVariants({ variant: "outline", size: "icon-sm" }))
  if (disabled) {
    return (
      <span id={id} aria-disabled="true" aria-label={label} className={cn(className, "pointer-events-none opacity-50")}>
        {children}
      </span>
    )
  }
  return (
    <Link id={id} href={href} aria-label={label} className={className} scroll={false}>
      {children}
    </Link>
  )
}

function hrefFor(filters: IncomingReferralFilters, page: number): string {
  const params = new URLSearchParams()
  if (filters.q) params.set("q", filters.q)
  if (filters.status) params.set("status", filters.status)
  if (filters.urgency) params.set("urgency", filters.urgency)
  if (filters.view !== "active") params.set("view", filters.view)
  if (page > 1) params.set("page", String(page))
  const query = params.toString()
  return query ? `?${query}` : "?"
}
