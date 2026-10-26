import { z } from "zod"

export const GeoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export const RecommendRequestSchema = z.object({
  origin: GeoPointSchema,
  caseCategory: z.string().min(1, "Case category is required"),
  urgency: z.enum(["ROUTINE", "URGENT", "EMERGENCY"]),
  extraRequiredResources: z.array(z.string()).optional(),
  searchRadiusMeters: z.number().min(1000).max(200_000).optional(),
})

export const RouteRequestSchema = z.object({
  origin: GeoPointSchema,
  facilityId: z.string().uuid("Invalid facility ID"),
})

export const GeocodeRequestSchema = z.object({
  address: z.string().min(2, "Address query must be at least 2 characters"),
})

export const UpdateOperatingStatusSchema = z.object({
  facilityId: z.string().uuid(),
  operatingStatus: z.enum(["OPERATIONAL", "LIMITED_OPERATIONS", "CLOSED", "UNKNOWN"]),
})

export const UpdateAcceptanceStatusSchema = z.object({
  facilityId: z.string().uuid(),
  caseCategory: z.string().min(1),
  acceptanceStatus: z.enum(["ACCEPTING", "ACCEPTING_WITH_CONDITIONS", "NOT_ACCEPTING", "UNKNOWN"]),
  reasonCode: z
    .enum([
      "NO_BEDS",
      "NO_SPECIALIST",
      "EQUIPMENT_UNAVAILABLE",
      "ED_DIVERSION",
      "STAFF_SHORTAGE",
      "OTHER",
    ])
    .nullable()
    .optional(),
  validHours: z.number().min(1).max(24).default(4),
})
