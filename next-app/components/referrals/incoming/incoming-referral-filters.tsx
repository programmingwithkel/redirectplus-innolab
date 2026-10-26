"use client"

import { useEffect, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Loader2, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { REFERRAL_STATUS, URGENCY_LEVELS } from "@/lib/constants/referral-status"
import type { InboxView } from "@/lib/referrals/domain/types"
import type { IncomingReferralFilters } from "@/lib/validation/incoming-referral-schemas"
import { cn } from "@/lib/utils"

const VIEWS: { value: InboxView; label: string }[] = [
  { value: "active", label: "Inbox" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
]

const SEARCH_DEBOUNCE_MS = 350

/** URL-driven filters: the URL is the single source of truth, so views are shareable and survive refresh. */
export function IncomingReferralFiltersBar({ filters }: { filters: IncomingReferralFilters }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, startTransition] = useTransition()
  const [search, setSearch] = useState(filters.q ?? "")

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    params.delete("page") // any filter change returns to the first page
    const query = params.toString()
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname))
  }

  // Debounce typing so we don't hit the server on every keystroke
  useEffect(() => {
    if (search.trim() === (filters.q ?? "")) return
    const timeout = setTimeout(() => updateParams({ q: search.trim() || undefined }), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- updateParams reads latest params at call time
  }, [search])

  const hasFilters = Boolean(filters.q || filters.status || filters.urgency)

  return (
    <div className="flex flex-col gap-3 border-b border-border p-3 lg:flex-row lg:items-center lg:justify-between">
      <div role="tablist" aria-label="Inbox view" className="inline-flex w-fit rounded-lg bg-muted p-0.5">
        {VIEWS.map((view) => (
          <button
            key={view.value}
            id={`incoming-view-${view.value}`}
            role="tab"
            type="button"
            aria-selected={filters.view === view.value}
            onClick={() => updateParams({ view: view.value === "active" ? undefined : view.value })}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              filters.view === view.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {view.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="incoming-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, complaint, service"
            aria-label="Search incoming referrals"
            maxLength={100}
            className="pl-8"
          />
          {isNavigating && (
            <Loader2 className="absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        <NativeSelect
          id="incoming-status-filter"
          aria-label="Filter by status"
          value={filters.status ?? ""}
          onChange={(e) => updateParams({ status: e.target.value || undefined })}
        >
          <NativeSelectOption value="">All statuses</NativeSelectOption>
          {Object.values(REFERRAL_STATUS).map((status) => (
            <NativeSelectOption key={status} value={status}>
              {status.replace("_", " ")}
            </NativeSelectOption>
          ))}
        </NativeSelect>

        <NativeSelect
          id="incoming-urgency-filter"
          aria-label="Filter by urgency"
          value={filters.urgency ?? ""}
          onChange={(e) => updateParams({ urgency: e.target.value || undefined })}
        >
          <NativeSelectOption value="">All urgency</NativeSelectOption>
          {Object.values(URGENCY_LEVELS).map((level) => (
            <NativeSelectOption key={level} value={level}>
              {level}
            </NativeSelectOption>
          ))}
        </NativeSelect>

        {hasFilters && (
          <Button
            id="incoming-clear-filters"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("")
              updateParams({ q: undefined, status: undefined, urgency: undefined })
            }}
          >
            <X />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
