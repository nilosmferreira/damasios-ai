import { z } from "zod";

// Available basketball positions (matching Prisma schema)
export const basketballPositions = [
  "ARMADOR", // Point Guard
  "ALA", // Forward
  "ALA_ARMADOR", // Shooting Guard
  "PIVO", // Center
  "ALA_PIVO", // Power Forward
] as const;

// Available billing types (matching Prisma schema)
export const billingTypes = ["DIARISTA", "MENSALISTA"] as const;

// Schema for creating a new athlete
export const createAthleteSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Name can only contain letters and spaces"),
    
  billingType: z.enum(billingTypes, {
    errorMap: () => ({ message: "Please select a valid billing type" }),
  }),
  
  preferredPositions: z
    .array(z.enum(basketballPositions))
    .min(1, "Please select at least one preferred position")
    .max(3, "You can select at most 3 preferred positions"),
    
  isActive: z.boolean().default(true),
});

// Schema for updating an athlete
export const updateAthleteSchema = createAthleteSchema.partial().extend({
  id: z.string().uuid("Invalid athlete ID"),
});

// Schema for toggling athlete active status
export const toggleAthleteStatusSchema = z.object({
  id: z.string().uuid("Invalid athlete ID"),
  isActive: z.boolean(),
});

// Schema for athlete filters
export const athleteFiltersSchema = z.object({
  status: z.enum(["all", "active", "inactive"]).default("active"),
  billingType: z.enum([...billingTypes, "all"]).default("all"),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Type exports for TypeScript
export type CreateAthleteInput = z.infer<typeof createAthleteSchema>;
export type UpdateAthleteInput = z.infer<typeof updateAthleteSchema>;
export type ToggleAthleteStatusInput = z.infer<typeof toggleAthleteStatusSchema>;
export type AthleteFilters = z.infer<typeof athleteFiltersSchema>;
export type BasketballPosition = typeof basketballPositions[number];
export type BillingType = typeof billingTypes[number];

// Helper function to get position display name
export function getPositionDisplayName(position: BasketballPosition): string {
  const positionMap = {
    ARMADOR: "Point Guard",
    ALA: "Forward", 
    ALA_ARMADOR: "Shooting Guard",
    PIVO: "Center",
    ALA_PIVO: "Power Forward",
  };
  return positionMap[position];
}

// Helper function to get billing type display name
export function getBillingTypeDisplayName(billingType: BillingType): string {
  return billingType === "DIARISTA" ? "Per Game" : "Monthly";
}
