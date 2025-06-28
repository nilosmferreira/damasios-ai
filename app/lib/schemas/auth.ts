import { z } from "zod";
import { basketballPositions, billingTypes } from "./athlete";

// Schema para login
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

// Schema para cadastro de usuário
export const userCreateSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["ADMINISTRADOR", "ATLETA"], {
    errorMap: () => ({ message: "Tipo de usuário inválido" })
  }),
});

// Schema para edição de usuário
export const userUpdateSchema = z.object({
  email: z.string().email("Email inválido").optional(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  role: z.enum(["ADMINISTRADOR", "ATLETA"]).optional(),
});

// Schema para cadastro de usuário com dados de atleta
export const userCreateWithAthleteSchema = z.object({
  // User data
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["ADMINISTRADOR", "ATLETA"], {
    errorMap: () => ({ message: "Tipo de usuário inválido" })
  }),
  
  // Athlete data (only required if role is ATLETA)
  athleteName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  billingType: z.enum(billingTypes).optional(),
  preferredPositions: z.array(z.enum(basketballPositions)).optional(),
}).refine(
  (data) => {
    // If role is ATLETA, athlete data is required
    if (data.role === "ATLETA") {
      return data.athleteName && data.billingType && data.preferredPositions && data.preferredPositions.length > 0;
    }
    return true;
  },
  {
    message: "Dados do atleta são obrigatórios quando o papel é ATLETA",
    path: ["athleteName"],
  }
);

// Tipos TypeScript inferidos
export type LoginData = z.infer<typeof loginSchema>;
export type UserCreateData = z.infer<typeof userCreateSchema>;
export type UserUpdateData = z.infer<typeof userUpdateSchema>;
export type UserCreateWithAthleteData = z.infer<typeof userCreateWithAthleteSchema>;
