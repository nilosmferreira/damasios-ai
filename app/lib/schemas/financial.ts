import { z } from "zod";

// Schema para criação de entrada/saída de caixa
export const createCashFlowSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  type: z.enum(["INFLOW", "OUTFLOW"], {
    errorMap: () => ({ message: "Tipo inválido" })
  }),
  date: z.string().min(1, "Data é obrigatória"),
});

// Schema para criação de pendência financeira
export const createFinancialPendingSchema = z.object({
  athleteId: z.string().uuid("ID do atleta inválido"),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  description: z.string().optional(),
});

// Schema para atualização de pendência financeira
export const updateFinancialPendingSchema = z.object({
  id: z.string().uuid("ID inválido"),
  amount: z.coerce.number().positive("Valor deve ser positivo").optional(),
  dueDate: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["PENDENTE", "PAGO"]).optional(),
  paymentDate: z.string().optional(),
});

// Schema para filtros financeiros
export const financialFiltersSchema = z.object({
  type: z.enum(["all", "pending", "paid", "cashflow"]).default("all"),
  athleteId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Tipos TypeScript inferidos
export type CreateCashFlowData = z.infer<typeof createCashFlowSchema>;
export type CreateFinancialPendingData = z.infer<typeof createFinancialPendingSchema>;
export type UpdateFinancialPendingData = z.infer<typeof updateFinancialPendingSchema>;
export type FinancialFilters = z.infer<typeof financialFiltersSchema>;
