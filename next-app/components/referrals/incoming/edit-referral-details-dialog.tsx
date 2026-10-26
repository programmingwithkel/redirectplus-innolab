"use client"

import { useState, type FormEvent } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { useServerAction } from "@/hooks/use-server-action"
import { updateIncomingReferralDetailsAction } from "@/lib/actions/incoming-referral-actions"
import { URGENCY_LEVELS } from "@/lib/constants/referral-status"
import type { IncomingReferral } from "@/lib/referrals/domain/types"
import type { UpdateIncomingReferralDetailsValues } from "@/lib/validation/incoming-referral-schemas"

interface EditReferralDetailsDialogProps {
  referral: IncomingReferral
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FieldErrors = Record<string, string[]>

/** UPDATE form: receiver corrects triage and patient details. */
export function EditReferralDetailsDialog({
  referral,
  open,
  onOpenChange,
}: EditReferralDetailsDialogProps) {
  const { run, pending } = useServerAction(updateIncomingReferralDetailsAction)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  function handleOpenChange(next: boolean) {
    if (!next) setFieldErrors({})
    onOpenChange(next)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFieldErrors({})
    run(toPayload(referral.id, new FormData(event.currentTarget)), {
      onSuccess: () => handleOpenChange(false),
      onError: (result) => setFieldErrors(result.fieldErrors ?? {}),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit referral details</DialogTitle>
          <DialogDescription>
            Correct triage or patient details for {referral.patientName}. Every change is recorded
            in the referral timeline.
          </DialogDescription>
        </DialogHeader>

        {/* key resets uncontrolled inputs if the referral changes while open */}
        <form key={referral.updatedAt} id="edit-referral-form" onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age" htmlFor="edit-patient-age" error={fieldErrors["patch.patientAge"]}>
              <Input
                id="edit-patient-age"
                name="patientAge"
                type="number"
                min={0}
                max={130}
                defaultValue={referral.patientAge ?? ""}
              />
            </Field>
            <Field label="Sex" htmlFor="edit-patient-sex" error={fieldErrors["patch.patientSex"]}>
              <NativeSelect
                id="edit-patient-sex"
                name="patientSex"
                defaultValue={referral.patientSex ?? ""}
                className="w-full"
              >
                <NativeSelectOption value="">Not specified</NativeSelectOption>
                <NativeSelectOption value="Male">Male</NativeSelectOption>
                <NativeSelectOption value="Female">Female</NativeSelectOption>
              </NativeSelect>
            </Field>
          </div>

          <Field label="Address" htmlFor="edit-patient-address" error={fieldErrors["patch.patientAddress"]}>
            <Input
              id="edit-patient-address"
              name="patientAddress"
              maxLength={300}
              defaultValue={referral.patientAddress ?? ""}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Required service" htmlFor="edit-required-service" error={fieldErrors["patch.requiredService"]}>
              <Input
                id="edit-required-service"
                name="requiredService"
                maxLength={120}
                defaultValue={referral.requiredService ?? ""}
              />
            </Field>
            <Field label="Required specialty" htmlFor="edit-required-specialty" error={fieldErrors["patch.requiredSpecialty"]}>
              <Input
                id="edit-required-specialty"
                name="requiredSpecialty"
                maxLength={120}
                defaultValue={referral.requiredSpecialty ?? ""}
              />
            </Field>
          </div>

          <Field label="Urgency (re-triage)" htmlFor="edit-urgency" error={fieldErrors["patch.urgency"]}>
            <NativeSelect
              id="edit-urgency"
              name="urgency"
              defaultValue={referral.urgency}
              className="w-full"
            >
              {Object.values(URGENCY_LEVELS).map((level) => (
                <NativeSelectOption key={level} value={level}>
                  {level}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Clinical notes" htmlFor="edit-clinical-notes" error={fieldErrors["patch.clinicalNotes"]}>
            <Textarea
              id="edit-clinical-notes"
              name="clinicalNotes"
              rows={3}
              maxLength={4000}
              defaultValue={referral.clinicalNotes ?? ""}
            />
          </Field>

          <Field label="Reason for change (optional)" htmlFor="edit-note" error={fieldErrors.note}>
            <Input
              id="edit-note"
              name="note"
              maxLength={500}
              placeholder="e.g. Vitals re-assessed on arrival"
            />
          </Field>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button id="edit-referral-submit" type="submit" form="edit-referral-form" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string[]
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs">
        {label}
      </Label>
      {children}
      {error?.length ? <p className="text-xs text-destructive">{error[0]}</p> : null}
    </div>
  )
}

/** Maps raw form fields to the action payload. The server re-validates everything. */
function toPayload(referralId: string, form: FormData): UpdateIncomingReferralDetailsValues {
  const text = (name: string) => String(form.get(name) ?? "")
  const age = text("patientAge").trim()
  const sex = text("patientSex")

  return {
    referralId,
    patch: {
      patientAge: age === "" ? null : Number(age),
      patientSex: sex === "" ? null : (sex as "Male" | "Female"),
      patientAddress: text("patientAddress"),
      requiredService: text("requiredService"),
      requiredSpecialty: text("requiredSpecialty"),
      urgency: text("urgency") as UpdateIncomingReferralDetailsValues["patch"]["urgency"],
      clinicalNotes: text("clinicalNotes"),
    },
    note: text("note"),
  }
}
