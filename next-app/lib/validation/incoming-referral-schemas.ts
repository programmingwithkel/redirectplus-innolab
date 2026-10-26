import { z } from "zod"
import { REFERRAL_STATUS, URGENCY_LEVELS } from "@/lib/constants/referral-status"

export const INCOMING_REFERRALS_PAGE_SIZE = 10

/** IDs are validated as GUIDs (not strict RFC UUIDs) to accept seeded IDs like a1111111-…. */
const referralId = z.guid({ error: "Invalid referral ID" })

/** Trims input; empty strings become null so "cleared" fields are stored as NULL. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Must be ${max} characters or fewer` })
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional()

// ---------------------------------------------------------------------------
// Inbox filters (URL search params)
// ---------------------------------------------------------------------------

/** Next.js search params may be repeated (string[]); only the first value is used. */
const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value)

export const IncomingReferralFiltersSchema = z.object({
  q: z
    .preprocess(firstValue, z.string().trim().max(100).optional())
    .transform((value) => value || undefined)
    .catch(undefined),
  status: z.preprocess(firstValue, z.enum(REFERRAL_STATUS).optional()).catch(undefined),
  urgency: z.preprocess(firstValue, z.enum(URGENCY_LEVELS).optional()).catch(undefined),
  view: z.preprocess(firstValue, z.enum(["active", "archived", "all"])).catch("active"),
  page: z.preprocess(firstValue, z.coerce.number().int().min(1)).catch(1),
})

export type IncomingReferralFilters = z.infer<typeof IncomingReferralFiltersSchema>

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const UpdateIncomingReferralDetailsSchema = z.object({
  referralId,
  patch: z.object({
    patientAge: z.number().int().min(0).max(130).nullable().optional(),
    patientSex: z.enum(["Male", "Female"]).nullable().optional(),
    patientAddress: optionalText(300),
    requiredService: optionalText(120),
    requiredSpecialty: optionalText(120),
    urgency: z.enum(URGENCY_LEVELS).optional(),
    clinicalNotes: optionalText(4000),
  }),
  note: optionalText(500),
})

export type UpdateIncomingReferralDetailsValues = z.input<typeof UpdateIncomingReferralDetailsSchema>

export const TransitionIncomingReferralSchema = z.object({
  referralId,
  nextStatus: z.enum(REFERRAL_STATUS),
  note: optionalText(500),
})

export const SetIncomingReferralArchivedSchema = z.object({
  referralId,
  archived: z.boolean(),
})
