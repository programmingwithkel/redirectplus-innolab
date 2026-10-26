"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addResourceAction } from "@/lib/actions/resource-actions"

export function AddResourceForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await addResourceAction(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
    }
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="rounded-lg border border-border bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-gray-50"
      >
        <span className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Resource
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <form action={handleSubmit} className="border-t border-border p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Name *</Label>
              <Input
                name="resource_name"
                placeholder="e.g., Cardiology"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <select
                name="resource_category"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                disabled={loading}
              >
                <option value="service">Service</option>
                <option value="specialty">Specialty</option>
                <option value="bed">Bed</option>
                <option value="equipment">Equipment</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status *</Label>
              <select
                name="status"
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                disabled={loading}
              >
                <option value="AVAILABLE">Available</option>
                <option value="LIMITED">Limited</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Quantity (optional)</Label>
              <Input
                name="quantity"
                type="number"
                placeholder="e.g., 10"
                disabled={loading}
              />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <Label className="text-xs">Description (optional)</Label>
            <Input
              name="description"
              placeholder="Brief description"
              disabled={loading}
            />
          </div>
          {error && (
            <p className="mt-2 text-xs text-red-600">{error}</p>
          )}
          <div className="mt-3 flex justify-end">
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Plus className="mr-1 h-3 w-3" />
              )}
              Add
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
