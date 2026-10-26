"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ConfirmActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  pending?: boolean
  /** When set, shows a reason field. `required` blocks confirm until it's filled. */
  reason?: { label: string; placeholder?: string; required?: boolean }
  onConfirm: (reason: string | null) => void
}

/** Generic confirmation dialog with an optional reason field. */
export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  pending,
  reason,
  onConfirm,
}: ConfirmActionDialogProps) {
  const [value, setValue] = useState("")
  const trimmed = value.trim()
  const blocked = Boolean(reason?.required && !trimmed)

  function handleOpenChange(next: boolean) {
    if (!next) setValue("")
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {reason && (
          <div className="space-y-2">
            <Label htmlFor="confirm-action-reason" className="text-xs">
              {reason.label}
              {reason.required && <span className="text-destructive"> *</span>}
            </Label>
            <Textarea
              id="confirm-action-reason"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={reason.placeholder}
              maxLength={500}
              rows={3}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            id="confirm-action-submit"
            variant={destructive ? "destructive" : "default"}
            onClick={() => onConfirm(trimmed || null)}
            disabled={pending || blocked}
          >
            {pending && <Loader2 className="animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
