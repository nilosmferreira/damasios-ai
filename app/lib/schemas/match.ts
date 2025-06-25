import { z } from "zod";

// Schema para criação de partida
export const createMatchSchema = z.object({
  date: z.string().min(1, "Data é obrigatória"),
  time: z.string().min(1, "Horário é obrigatório"),
  placeId: z.string().min(1, "Local é obrigatório"),
});

// Schema para edição de partida
export const updateMatchSchema = z.object({
  id: z.string().uuid("ID inválido"),
  date: z.string().min(1, "Data é obrigatória"),
  time: z.string().min(1, "Horário é obrigatório"),
  placeId: z.string().min(1, "Local é obrigatório"),
});

// Schema para confirmação de presença
export const confirmPresenceSchema = z.object({
  matchId: z.string().uuid("ID da partida inválido"),
  athleteId: z.string().uuid("ID do atleta inválido"),
});

// Schema para filtros de partidas
export const matchFiltersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  placeId: z.string().optional(),
  status: z.enum(["upcoming", "past", "all"]).default("upcoming"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Tipos TypeScript inferidos
export type CreateMatchData = z.infer<typeof createMatchSchema>;
export type UpdateMatchData = z.infer<typeof updateMatchSchema>;
export type ConfirmPresenceData = z.infer<typeof confirmPresenceSchema>;
export type MatchFilters = z.infer<typeof matchFiltersSchema>;
