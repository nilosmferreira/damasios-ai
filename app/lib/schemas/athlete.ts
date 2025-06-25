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
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome pode conter apenas letras e espaços"),
    
  billingType: z.enum(billingTypes, {
    errorMap: () => ({ message: "Por favor, selecione um tipo de cobrança válido" }),
  }),
  
  preferredPositions: z
    .array(z.enum(basketballPositions))
    .min(1, "Por favor, selecione pelo menos uma posição preferida")
    .max(3, "Você pode selecionar no máximo 3 posições preferidas"),
    
  isActive: z.boolean().default(true),
});

// Schema for updating an athlete
export const updateAthleteSchema = createAthleteSchema.partial().extend({
  id: z.string().uuid("ID de atleta inválido"),
});

// Schema for toggling athlete active status
export const toggleAthleteStatusSchema = z.object({
  id: z.string().uuid("ID de atleta inválido"),
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
